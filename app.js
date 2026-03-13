const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const os       = require('os');
const crypto   = require('crypto');
const readline = require('readline');
const { spawn }          = require('child_process');
const { WebSocketServer } = require('ws');

const app  = express();
const PORT = process.env.PORT || 3003;

const CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>`;

const ANSI_RE = /\x1B\[[0-9;]*[a-zA-Z]/g;

// ── Persistente Roslyn runner (voor batch /api/run) ───
let runnerProc  = null;
let runnerReady = false;
const queue     = [];
let current     = null;

function spawnRunner() {
  const runnerBin = path.join(__dirname, 'runner-bin', 'runner.dll');
  const proc = fs.existsSync(runnerBin)
    ? spawn('dotnet', [runnerBin], { stdio: ['pipe', 'pipe', 'pipe'] })
    : spawn('dotnet', ['run', '--project', path.join(__dirname, 'runner')],
        { stdio: ['pipe', 'pipe', 'pipe'] });

  runnerProc = proc;

  const rlOut = readline.createInterface({ input: proc.stdout });
  rlOut.on('line', (line) => {
    if (!current) return;
    const { resolve, timer } = current;
    current = null;
    clearTimeout(timer);
    try { resolve(JSON.parse(line)); }
    catch (e) { resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Parse fout: ' + e.message }] }); }
    processQueue();
  });

  const rlErr = readline.createInterface({ input: proc.stderr });
  rlErr.on('line', (line) => {
    if (line.trim() === 'READY') { runnerReady = true; console.log('C# runner klaar.'); processQueue(); }
  });

  proc.on('exit', (code) => {
    console.warn(`Runner gestopt (exit ${code}), herstart over 2s...`);
    runnerReady = false; runnerProc = null;
    if (current) { current.resolve({ output: [], errors: [] }); clearTimeout(current.timer); current = null; }
    setTimeout(spawnRunner, 2000);
  });
}

function processQueue() {
  if (current || !runnerReady || queue.length === 0) return;
  current = queue.shift();
  runnerProc.stdin.write(JSON.stringify({ code: current.code, input: current.input }) + '\n');
}

function runBatch(code, input) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const idx = queue.findIndex(r => r.resolve === resolve);
      if (idx >= 0) queue.splice(idx, 1);
      else if (current?.resolve === resolve) current = null;
      resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout.' }] });
    }, 30_000);
    queue.push({ code, input: input || '', resolve, timer });
    processQueue();
  });
}

spawnRunner();

// ── Express ───────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

app.post('/api/run', async (req, res) => {
  const code  = (req.body && req.body.code)  || '';
  const input = (req.body && req.body.input) || '';
  if (!code.trim()) return res.json({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Geen code.' }] });
  res.json(await runBatch(code, input));
});

// ── HTTP server + WebSocket ───────────────────────────
const server = app.listen(PORT, () => {
  console.log(`CSBox draait op http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

wss.on('connection', function (ws) {
  let proc        = null;
  let tmpDir      = null;
  let sessionTimer = null;

  function cleanup() {
    if (sessionTimer) { clearTimeout(sessionTimer); sessionTimer = null; }
    if (proc) { try { proc.kill(); } catch {} proc = null; }
    if (tmpDir) { fs.rm(tmpDir, { recursive: true, force: true }, () => {}); tmpDir = null; }
  }

  function send(obj) {
    if (ws.readyState === 1) ws.send(JSON.stringify(obj));
  }

  ws.on('message', function (raw) {
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === 'start') {
      if (proc) return;

      const id = crypto.randomBytes(8).toString('hex');
      tmpDir = path.join(os.tmpdir(), 'csbox-' + id);
      fs.mkdirSync(tmpDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'csbox.csproj'), CSPROJ, 'utf8');
      const safeCode = (data.code || '')
        .replace(/Console\.Clear\s*\(\s*\)/g, 'Console.WriteLine("__CSBOX_CLEAR__")');
      fs.writeFileSync(path.join(tmpDir, 'Program.cs'), safeCode, 'utf8');

      proc = spawn('dotnet', ['run', '--project', tmpDir, '--no-launch-profile'], {
        cwd: tmpDir,
        env: { ...process.env, DOTNET_NOLOGO: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1' },
      });

      const SENTINEL = '__CSBOX_CLEAR__\n';
      let outBuf = '';

      proc.stdout.on('data', (chunk) => {
        outBuf += chunk.toString()
          .replace(ANSI_RE, '')
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n');

        // Verwerk volledige sentinels
        let idx;
        while ((idx = outBuf.indexOf(SENTINEL)) !== -1) {
          if (idx > 0) send({ type: 'output', data: outBuf.slice(0, idx) });
          send({ type: 'clear' });
          outBuf = outBuf.slice(idx + SENTINEL.length);
        }

        // Houd het einde vast als het het begin van een sentinel kan zijn
        let hold = 0;
        for (let len = Math.min(outBuf.length, SENTINEL.length - 1); len > 0; len--) {
          if (outBuf.endsWith(SENTINEL.slice(0, len))) { hold = len; break; }
        }

        const toSend = outBuf.slice(0, outBuf.length - hold);
        if (toSend) { send({ type: 'output', data: toSend }); outBuf = outBuf.slice(toSend.length); }
      });

      let stderr = '';
      proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

      proc.on('close', (code) => {
        // Filter compilatiefouten uit stderr
        const errors = [];
        const errorRe = /^.*\.cs\((\d+),(\d+)\):\s*(error|warning)\s+\S+:\s*(.+)$/;
        const seen = new Set();
        for (const line of stderr.split('\n')) {
          const m = line.replace(/\r$/, '').match(errorRe);
          if (m) {
            const message = m[4].replace(/\s*\[.*\]\s*$/, '').trim();
            const key = m[1] + ':' + m[2] + ':' + message;
            if (!seen.has(key)) { seen.add(key); errors.push({ line: +m[1], col: +m[2], severity: m[3], message }); }
          }
        }
        send({ type: 'exit', code: code ?? 0, errors });
        cleanup();
        ws.close();
      });

      proc.on('error', (err) => {
        send({ type: 'exit', code: -1, errors: [{ line: 0, col: 0, severity: 'error', message: 'Kon dotnet niet starten: ' + err.message }] });
        cleanup();
        ws.close();
      });

      sessionTimer = setTimeout(() => {
        send({ type: 'exit', code: -1, errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout: sessie duurde langer dan 10 minuten.' }] });
        cleanup();
      }, 10 * 60_000);

    } else if (data.type === 'input') {
      if (proc && proc.stdin.writable) {
        proc.stdin.write((data.data || '') + '\n');
      }
    } else if (data.type === 'stop') {
      cleanup();
      send({ type: 'exit', code: -1, errors: [] });
    }
  });

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});
