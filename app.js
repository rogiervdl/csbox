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

// ── Code-transformaties (server-side, vóór compilatie) ────────────────────────

// Hulpklasse voor Console.ReadKey() — kan geen JSImport gebruiken in student-DLL
// Console.ReadKey() → CsBoxHelper.ReadKey() → Console.In.ReadLine()[0]
const HELPER_CS = `internal static class CsBoxHelper {
    public static System.ConsoleKeyInfo ReadKey(bool intercept = false) {
        string line = System.Console.ReadLine() ?? string.Empty;
        char ch = line.Length > 0 ? line[0] : '\\0';
        System.ConsoleKey key = ch >= 'a' && ch <= 'z'
            ? (System.ConsoleKey)System.Char.ToUpper(ch)
            : (System.ConsoleKey)ch;
        return new System.ConsoleKeyInfo(ch, key, System.Char.IsUpper(ch), false, false);
    }
}`;

// ConsoleColor → ANSI SGR codes
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

function transformCode(code) {
  return code
    .replace(/Console\.Clear\s*\(\s*\)/g,       'Console.Write("__CSBOX_CLEAR__")')
    .replace(/Console\.ForegroundColor\s*=\s*ConsoleColor\.(\w+)\s*;/g,
      (_, c) => `Console.Write("__CSBOX_FG:${CONSOLE_COLOR_FG[c] ?? 0}__");`)
    .replace(/Console\.BackgroundColor\s*=\s*ConsoleColor\.(\w+)\s*;/g,
      (_, c) => `Console.Write("__CSBOX_BG:${CONSOLE_COLOR_BG[c] ?? 0}__");`)
    .replace(/Console\.ResetColor\s*\(\s*\)\s*;/g, 'Console.Write("__CSBOX_RS__");')
    .replace(/Console\.ReadKey\s*\(\s*(?:true|false)?\s*\)/g, 'CsBoxHelper.ReadKey()');
}

// ── Persistente Roslyn runner pool ────────────────────────────────────────────
const RUNNER_COUNT = parseInt(process.env.RUNNER_COUNT || '4', 10);
const MAX_QUEUE    = 10;

const queue   = [];
const workers = Array.from({ length: RUNNER_COUNT }, () => ({ proc: null, ready: false, current: null }));

function spawnRunner(worker) {
  const runnerBin = path.join(__dirname, 'runner-bin', 'runner.dll');
  const proc = fs.existsSync(runnerBin)
    ? spawn('dotnet', [runnerBin], { stdio: ['pipe', 'pipe', 'pipe'] })
    : spawn('dotnet', ['run', '--project', path.join(__dirname, 'runner')],
        { stdio: ['pipe', 'pipe', 'pipe'] });

  worker.proc = proc;

  const rlOut = readline.createInterface({ input: proc.stdout });
  rlOut.on('line', (line) => {
    if (!worker.current) return;
    const { resolve, timer } = worker.current;
    worker.current = null;
    clearTimeout(timer);
    try { resolve(JSON.parse(line)); }
    catch (e) { resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Parse fout: ' + e.message }] }); }
    processQueue();
  });

  const rlErr = readline.createInterface({ input: proc.stderr });
  rlErr.on('line', (line) => {
    if (line.trim() === 'READY') { worker.ready = true; console.log('C# runner klaar.'); processQueue(); }
  });

  proc.on('exit', (code) => {
    console.warn(`Runner gestopt (exit ${code}), herstart over 2s...`);
    worker.ready = false;
    worker.proc  = null;
    if (worker.current) { worker.current.resolve({ output: [], errors: [] }); clearTimeout(worker.current.timer); worker.current = null; }
    setTimeout(() => spawnRunner(worker), 2000);
  });
}

function processQueue() {
  // stuur verzoeken naar alle vrije workers tegelijk
  for (const worker of workers) {
    if (queue.length === 0) break;
    if (!worker.ready || worker.current) continue;
    worker.current = queue.shift();
    worker.proc.stdin.write(JSON.stringify({
      type:  worker.current.type  || 'run',
      code:  worker.current.code,
      input: worker.current.input || '',
    }) + '\n');
  }
}

function runBatch(code, input) {
  return new Promise((resolve) => {
    if (queue.length >= MAX_QUEUE) {
      resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Server bezet, probeer opnieuw.' }] });
      return;
    }
    const timer = setTimeout(() => {
      const idx = queue.findIndex(r => r.resolve === resolve);
      if (idx >= 0) queue.splice(idx, 1);
      else { const w = workers.find(w => w.current?.resolve === resolve); if (w) w.current = null; }
      resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout.' }] });
    }, 30_000);
    queue.push({ type: 'run', code, input: input || '', resolve, timer });
    processQueue();
  });
}

function compileBatch(code) {
  return new Promise((resolve) => {
    if (queue.length >= MAX_QUEUE) {
      resolve({ dll: null, errors: [{ line: 0, col: 0, severity: 'error', message: 'Server bezet, probeer opnieuw.' }] });
      return;
    }
    const timer = setTimeout(() => {
      const idx = queue.findIndex(r => r.resolve === resolve);
      if (idx >= 0) queue.splice(idx, 1);
      else { const w = workers.find(w => w.current?.resolve === resolve); if (w) w.current = null; }
      resolve({ dll: null, errors: [{ line: 0, col: 0, severity: 'error', message: 'Compile timeout.' }] });
    }, 30_000);
    queue.push({ type: 'compile', code, input: '', resolve, timer });
    processQueue();
  });
}

workers.forEach(spawnRunner);

// ── Express ────────────────────────────────────────────────────────────────────

// COOP/COEP headers — vereist voor SharedArrayBuffer (gebruikt door WASM + Atomics)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy',   'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
});

// blokkeer directe toegang tot oplossingsbestanden
app.use((req, res, next) => {
  if (/\/Oplossing\.cs$/i.test(req.path)) {
    return res.status(403).end();
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

// Serveer gepubliceerd WASM-dist (na: dotnet publish wasm-host/ -c Release)
// De web-bundle zit in AppBundle/_framework/ (dotnet.boot.js + .wasm assemblies)
const wasmDist = path.join(__dirname, 'wasm-host', 'bin', 'Release', 'net10.0', 'browser-wasm', 'AppBundle', '_framework');
if (fs.existsSync(wasmDist)) {
  app.use('/wasm-dist', express.static(wasmDist, {
    setHeaders(res) {
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    },
  }));
}

// ── /api/run (batch, voor achtergrondcompatibiliteit) ─────────────────────────
app.post('/api/run', async (req, res) => {
  const code  = (req.body && req.body.code)  || '';
  const input = (req.body && req.body.input) || '';
  if (!code.trim()) return res.json({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Geen code.' }] });
  res.json(await runBatch(code, input));
});

// ── /api/compile (WASM-modus) ─────────────────────────────────────────────────
app.post('/api/compile', async (req, res) => {
  const rawCode = (req.body && req.body.code) || '';
  if (!rawCode.trim()) {
    return res.json({ dll: null, errors: [{ line: 0, col: 0, severity: 'error', message: 'Geen code.' }] });
  }

  // Transformeer code (ReadKey, kleuren, Clear) en injecteer de helper class
  const safeCode = transformCode(rawCode) + '\n\n' + HELPER_CS;

  const result = await compileBatch(safeCode);
  res.json(result);
});

// ── WebSocket — interactieve server-side fallback (voor omgevingen zonder WASM) ──

// runtimeconfig voor dotnet exec (version 1.0.0 + latestMajor → pakt altijd de geïnstalleerde versie)
const WS_RUNTIME_CONFIG = JSON.stringify({
  runtimeOptions: {
    tfm: 'net10.0',
    framework: { name: 'Microsoft.NETCore.App', version: '1.0.0' },
    rollForward: 'latestMajor',
  },
}, null, 2);

const server = app.listen(PORT, () => {
  console.log(`CSBox draait op http://localhost:${PORT}`);
  if (!fs.existsSync(wasmDist)) {
    console.warn('⚠ WASM dist niet gevonden. Voer uit: dotnet publish wasm-host/ -c Release');
  }
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

      // transformeer code en injecteer helper, compileer via de gedeelde Roslyn runner
      const safeCode = transformCode(data.code || '') + '\n\n' + HELPER_CS;
      compileBatch(safeCode).then((result) => {
        // compilatiefouten: stuur terug en stop
        if (!result.dll) {
          send({ type: 'exit', code: 1, errors: result.errors || [] });
          return;
        }

        // schrijf DLL en runtimeconfig naar temp-map
        const id = crypto.randomBytes(8).toString('hex');
        tmpDir = path.join(os.tmpdir(), 'csbox-' + id);
        fs.mkdirSync(tmpDir, { recursive: true });
        const dllPath = path.join(tmpDir, 'StudentCode.dll');
        fs.writeFileSync(dllPath, Buffer.from(result.dll, 'base64'));
        fs.writeFileSync(path.join(tmpDir, 'StudentCode.runtimeconfig.json'), WS_RUNTIME_CONFIG, 'utf8');

        // voer gecompileerde DLL uit (geen hercompilatie)
        proc = spawn('dotnet', ['exec', dllPath], {
          env: { ...process.env, DOTNET_NOLOGO: '1', DOTNET_CLI_TELEMETRY_OPTOUT: '1' },
        });

        // stream stdout naar client
        proc.stdout.on('data', (chunk) => {
          const text = chunk.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          send({ type: 'output', data: text });
        });

        // runtime-fouten (onbehandelde exceptions) via stderr
        proc.stderr.on('data', (chunk) => {
          send({ type: 'output', data: chunk.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n') });
        });

        proc.on('close', (code) => {
          send({ type: 'exit', code: code ?? 0, errors: [] });
          cleanup();
        });

        proc.on('error', (err) => {
          send({ type: 'exit', code: -1, errors: [{ line: 0, col: 0, severity: 'error', message: 'Kon dotnet niet starten: ' + err.message }] });
          cleanup();
        });

        // maximale sessieduur: 30 seconden
        sessionTimer = setTimeout(() => {
          send({ type: 'exit', code: -1, errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout: programma duurde langer dan 30 seconden.' }] });
          cleanup();
        }, 30_000);
      });

    } else if (data.type === 'input') {
      if (proc && proc.stdin.writable) proc.stdin.write((data.data || '') + '\n');

    } else if (data.type === 'stop') {
      cleanup();
      send({ type: 'exit', code: -1, errors: [] });
    }
  });

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});
