const express  = require('express');
const path     = require('path');
const fs       = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');

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

// ── Persistente Roslyn runner ──────────────────────────────────────────────────
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
  runnerProc.stdin.write(JSON.stringify({
    type:  current.type  || 'run',
    code:  current.code,
    input: current.input || '',
  }) + '\n');
}

function runBatch(code, input) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const idx = queue.findIndex(r => r.resolve === resolve);
      if (idx >= 0) queue.splice(idx, 1);
      else if (current?.resolve === resolve) current = null;
      resolve({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout.' }] });
    }, 30_000);
    queue.push({ type: 'run', code, input: input || '', resolve, timer });
    processQueue();
  });
}

function compileBatch(code) {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const idx = queue.findIndex(r => r.resolve === resolve);
      if (idx >= 0) queue.splice(idx, 1);
      else if (current?.resolve === resolve) current = null;
      resolve({ dll: null, errors: [{ line: 0, col: 0, severity: 'error', message: 'Compile timeout.' }] });
    }, 30_000);
    queue.push({ type: 'compile', code, input: '', resolve, timer });
    processQueue();
  });
}

spawnRunner();

// ── Express ────────────────────────────────────────────────────────────────────

// COOP/COEP headers — vereist voor SharedArrayBuffer (gebruikt door WASM + Atomics)
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy',   'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
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

// ── Server starten ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`CSBox draait op http://localhost:${PORT}`);
  if (!fs.existsSync(wasmDist)) {
    console.warn('⚠ WASM dist niet gevonden. Voer uit: dotnet publish wasm-host/ -c Release');
  }
});
