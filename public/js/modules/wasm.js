/*
 * WASM module — runtime loading, compile API, run/stop
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// SharedArrayBuffer is required for .NET WASM (used for Atomics-based thread sync);
// some environments (e.g. Schoolyear proctoring) block it regardless of COOP/COEP headers
const wasmSupported = typeof SharedArrayBuffer !== 'undefined';

const RUN_COOLDOWN_MS = 5000;

const btnRun         = document.querySelector('#btn-run');
const modalCooldown  = document.querySelector('#modal-cooldown');
const modalCooldownBackdrop = document.querySelector('#modal-cooldown .modal__backdrop');

modalCooldownBackdrop.addEventListener('click', () => {
   modalCooldown.setAttribute('aria-hidden', 'true');
});

let wasmExports = null;
let wasmReady   = false;
let running     = false;
let terminal    = null;
let errors      = null;
let wsConn      = null;
let lastRunTime = 0;

// FUNCTIES
// ========

async function loadWasm() {
   if (!wasmSupported) return;
   try {
      const { dotnet } = await import('/wasm-dist/dotnet.js');
      const runtime = await dotnet.create();
      runtime.setModuleImports('csbox-interop', buildInterop());
      wasmExports = await runtime.getAssemblyExports('wasm-host');
      wasmReady = true;
   } catch (err) {
      terminal.append(`[WASM laad-fout: ${err?.message ?? err}]`);
   }
}

function needsInput(code) {
   return /Console\.(ReadLine|ReadKey)\s*\(/.test(code);
}

async function runServerSideBatch(code) {
   terminal.setStatus('Uitvoeren...');
   try {
      const resp = await fetch('/api/run', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ code, input: '' }),
      });
      const result = await resp.json();

      // toon compile-/runtime-fouten
      if (result.errors?.length > 0) errors.show(result.errors);

      // toon uitvoer
      if (result.output?.length > 0) terminal.handleRawOutput(result.output.join('\n') + '\n');
   } catch (err) {
      terminal.append(`[Netwerkfout: ${err.message}]`);
   }
   terminal.setStatus('');
   terminal.setRunning(false);
   running = false;
}

function runServerSideInteractive(code) {
   return new Promise((resolve) => {
      terminal.setStatus('Compileren...');

      // open WebSocket voor interactieve server-side uitvoering
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsConn = new WebSocket(`${protocol}//${location.host}`);

      wsConn.onopen = () => {
         wsConn.send(JSON.stringify({ type: 'start', code }));
      };

      wsConn.onmessage = (e) => {
         const data = JSON.parse(e.data);

         if (data.type === 'output') {
            terminal.setStatus('');
            terminal.handleRawOutput(data.data);
            // activeer invoerveld na korte pauze (programma kan op input wachten)
            terminal.setReadKeyMode(false);
         }

         if (data.type === 'exit') {
            terminal.setStatus('');
            terminal.setRunning(false);
            running = false;
            wsConn = null;
            if (data.errors?.length > 0) errors.show(data.errors);
            if (data.code !== 0 && data.code !== -1 && !data.errors?.length) {
               terminal.append(`\n[Programma gestopt met exitcode ${data.code}]`);
            }
            resolve();
         }
      };

      wsConn.onerror = () => {
         terminal.append('[Fout: kon niet verbinden met server.]');
         terminal.setStatus('');
         terminal.setRunning(false);
         running = false;
         wsConn = null;
         resolve();
      };

      wsConn.onclose = () => {
         if (running) {
            terminal.setStatus('');
            terminal.setRunning(false);
            running = false;
            wsConn = null;
            resolve();
         }
      };
   });
}

function buildInterop() {
   return {
      sendOutput(text) { terminal.handleRawOutput(text); },
      notifyInputNeeded(mode) { terminal.setReadKeyMode(mode === 'key'); },
      sendDone(exitCode) {
         terminal.setStatus('');
         terminal.setRunning(false);
         running = false;
         if (exitCode !== 0 && exitCode !== -1) {
            terminal.append(`\n[Programma gestopt met exitcode ${exitCode}]`);
         }
      },
      sendError(message) { terminal.append(`\n[Fout: ${message}]`); },
   };
}

// EXPORTS
// =======

function init(terminalModule, errorsModule) {
   terminal = terminalModule;
   errors = errorsModule;
   loadWasm();
}

async function run(code) {
   if (running) return;

   // voorkom spammen: hooguit één run per 5 seconden
   const now = Date.now();
   if (now - lastRunTime < RUN_COOLDOWN_MS) {
      modalCooldown.setAttribute('aria-hidden', 'false');
      return;
   }
   lastRunTime = now;

   // grijze knop voor de cooldown-duur
   btnRun.classList.add('is-cooldown');
   setTimeout(() => { btnRun.classList.remove('is-cooldown'); }, RUN_COOLDOWN_MS);

   terminal.clear();
   errors.clear();
   terminal.setRunning(true);
   running = true;

   // WASM niet beschikbaar (bijv. Schoolyear-omgeving blokkeert SharedArrayBuffer)
   if (!wasmSupported) {
      await (needsInput(code) ? runServerSideInteractive(code) : runServerSideBatch(code));
      return;
   }

   terminal.setStatus('Compileren...');

   let compileResult;
   try {
      const resp = await fetch('/api/compile', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ code }),
      });
      compileResult = await resp.json();
   } catch (err) {
      terminal.append(`[Netwerkfout: ${err.message}]`);
      terminal.setRunning(false);
      running = false;
      return;
   }

   if (compileResult.errors && compileResult.errors.length > 0) {
      errors.show(compileResult.errors);
   }

   if (!compileResult.dll) {
      terminal.setRunning(false);
      running = false;
      terminal.setStatus('');
      return;
   }

   terminal.setStatus('');

   const raw = atob(compileResult.dll);
   const dll = new Uint8Array(raw.length);
   for (let i = 0; i < raw.length; i++) dll[i] = raw.charCodeAt(i);

   if (!wasmReady) {
      terminal.setStatus('WASM laden...');
      await new Promise((resolve) => {
         const check = setInterval(() => {
            if (wasmReady) { clearInterval(check); resolve(); }
         }, 100);
         setTimeout(() => { clearInterval(check); resolve(); }, 30000);
      });
      terminal.setStatus('');
   }

   // WASM runtime niet geladen (bijv. laad-fout) — val terug op server
   if (!wasmExports) {
      await (needsInput(code) ? runServerSideInteractive(code) : runServerSideBatch(code));
      return;
   }

   try {
      await wasmExports.WasmExports.RunCode(dll);
   } catch (err) {
      terminal.append(`\n[Fout: ${err?.message ?? err}]`);
      terminal.setRunning(false);
      running = false;
   }
}

async function stop() {
   if (wsConn && wsConn.readyState === WebSocket.OPEN) {
      wsConn.send(JSON.stringify({ type: 'stop' }));
      return;
   }
   if (!wasmExports || !running) return;
   try {
      await wasmExports.WasmExports.SetCancelled();
   } catch { /* intentionally ignored */ }
}

async function provideInput(val) {
   if (wsConn && wsConn.readyState === WebSocket.OPEN) {
      wsConn.send(JSON.stringify({ type: 'input', data: val }));
      return;
   }
   if (!wasmExports) return;
   try {
      await wasmExports.WasmExports.ProvideInput(val);
   } catch { /* intentionally ignored */ }
}

export const Wasm = { init, run, stop, provideInput };
