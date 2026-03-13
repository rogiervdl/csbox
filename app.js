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

// Hulpklasse voor Console.ReadKey() — werkt niet met omgeleide stdin
const HELPER_CS = `internal static class CsBoxIO {
    public static System.ConsoleKeyInfo ReadKey(bool intercept = false) {
        System.Console.Write("__CSBOX_RK__");
        string line = System.Console.ReadLine() ?? string.Empty;
        char ch = line.Length > 0 ? line[0] : '\\0';
        System.ConsoleKey key = ch >= 'a' && ch <= 'z'
            ? (System.ConsoleKey)System.Char.ToUpper(ch)
            : (System.ConsoleKey)ch;
        return new System.ConsoleKeyInfo(ch, key, System.Char.IsUpper(ch), false, false);
    }
}`;

// Strip alle ANSI escape sequences uit de output (kleuren lopen via sentinels)
const ANSI_RE = /\x1B(?:\[[0-9;]*[a-zA-Z]|[^[])/g;

// ConsoleColor → ANSI SGR codes (mirrors .NET's Unix mapping)
const CONSOLE_COLOR_FG = {
  Black:30, DarkRed:31, DarkGreen:32, DarkYellow:33,
  DarkBlue:34, DarkMagenta:35, DarkCyan:36, Gray:37,
  DarkGray:90, Red:91, Green:92, Yellow:93,
  Blue:94, Magenta:95, Cyan:96, White:97,
};
const CONSOLE_COLOR_BG = {
  Black:40, DarkRed:41, DarkGreen:42, DarkYellow:43,
  DarkBlue:44, DarkMagenta:45, DarkCyan:46, Gray:47,
  DarkGray:100, Red:101, Green:102, Yellow:103,
  Blue:104, Magenta:105, Cyan:106, White:107,
};

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
      fs.writeFileSync(path.join(tmpDir, 'CsBoxHelper.cs'), HELPER_CS, 'utf8');
      const safeCode = (data.code || '')
        .replace(/Console\.Clear\s*\(\s*\)/g,       'Console.Write("__CSBOX_CLEAR__")')
        .replace(/Console\.ForegroundColor\s*=\s*ConsoleColor\.(\w+)\s*;/g,
          (_, c) => `Console.Write("__CSBOX_FG:${CONSOLE_COLOR_FG[c] ?? 0}__");`)
        .replace(/Console\.BackgroundColor\s*=\s*ConsoleColor\.(\w+)\s*;/g,
          (_, c) => `Console.Write("__CSBOX_BG:${CONSOLE_COLOR_BG[c] ?? 0}__");`)
        .replace(/Console\.ResetColor\s*\(\s*\)\s*;/g, 'Console.Write("__CSBOX_RS__");')
        .replace(/Console\.ReadKey\s*\(\s*(?:true|false)?\s*\)/g, 'CsBoxIO.ReadKey()');
      fs.writeFileSync(path.join(tmpDir, 'Program.cs'), safeCode, 'utf8');

      proc = spawn('dotnet', ['run', '--project', tmpDir, '--no-launch-profile', '--verbosity', 'quiet'], {
        cwd: tmpDir,
        env: { ...process.env, DOTNET_NOLOGO: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1',
               DOTNET_SYSTEM_CONSOLE_ALLOW_ANSI_COLOR_REDIRECTION: '1', TERM: 'xterm-256color' },
      });

      // Alle sentinels beginnen met __CSBOX_
      const CSBOX_RE  = /__CSBOX_(CLEAR|RS|RK|FG:\d+|BG:\d+)__/;
      const CSBOX_PFX = '__CSBOX_';
      const CSBOX_MAX = '__CSBOX_BG:100__'.length;
      let outBuf = '';

      function handleSentinel(tag) {
        if (tag === 'CLEAR') { send({ type: 'clear' }); return; }
        if (tag === 'RS')    { send({ type: 'color', fg: null, bg: null }); return; }
        if (tag === 'RK')    { send({ type: 'readkey' }); return; }
        const [ch, code] = tag.split(':');
        if (ch === 'FG') send({ type: 'color', fg: +code });
        if (ch === 'BG') send({ type: 'color', bg: +code });
      }

      proc.stdout.on('data', (chunk) => {
        const raw = chunk.toString().replace(ANSI_RE, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        // CS-fout/waarschuwingsregels in stdout: doorsturen als build-bericht + toevoegen aan stderr-buffer
        const clean = raw.split('\n').filter(line => {
          if (errorRe.test(line)) {
            send({ type: 'build', data: line + '\n' });
            stderr += line + '\n';
            return false;
          }
          return true;
        }).join('\n');
        outBuf += clean;

        // Verwerk alle volledige sentinels
        let m;
        while ((m = CSBOX_RE.exec(outBuf)) !== null) {
          if (m.index > 0) send({ type: 'output', data: outBuf.slice(0, m.index) });
          handleSentinel(m[1]);
          outBuf = outBuf.slice(m.index + m[0].length);
          CSBOX_RE.lastIndex = 0;
        }

        // Houd het einde vast als het het begin van een sentinel kan zijn
        let hold = 0;
        const p = outBuf.lastIndexOf(CSBOX_PFX);
        if (p !== -1 && p + CSBOX_MAX >= outBuf.length) {
          hold = outBuf.length - p;
        } else {
          for (let len = Math.min(outBuf.length, CSBOX_PFX.length - 1); len > 0; len--) {
            if (outBuf.endsWith(CSBOX_PFX.slice(0, len))) { hold = len; break; }
          }
        }

        const toSend = outBuf.slice(0, outBuf.length - hold);
        if (toSend) { send({ type: 'output', data: toSend }); outBuf = outBuf.slice(toSend.length); }
      });

      const errorRe = /^.*\.cs\((\d+),(\d+)\):\s*(error|warning)\s+\S+:\s*(.+)$/;
      let stderr = '';
      proc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr += text;
        // Stuur warnings/errors real-time naar de terminal als build-bericht
        for (const raw of text.split('\n')) {
          const line = raw.replace(/\r$/, '');
          if (errorRe.test(line)) send({ type: 'build', data: line + '\n' });
        }
      });

      proc.on('close', (code) => {
        const errors = [];
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
