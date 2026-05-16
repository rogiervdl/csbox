/*
 * WASM module — runtime loading, compile API, run/stop
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

let wasmExports = null;
let wasmReady   = false;
let running     = false;
let terminal    = null;
let errors      = null;

// FUNCTIES
// ========

async function loadWasm() {
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

   terminal.clear();
   errors.clear();
   terminal.setRunning(true);
   running = true;
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

   if (!wasmExports) {
      terminal.append('[WASM runtime niet beschikbaar.]');
      terminal.setRunning(false);
      running = false;
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
   if (!wasmExports || !running) return;
   try {
      await wasmExports.WasmExports.SetCancelled();
   } catch { /* intentionally ignored */ }
}

async function provideInput(val) {
   if (!wasmExports) return;
   try {
      await wasmExports.WasmExports.ProvideInput(val);
   } catch { /* intentionally ignored */ }
}

export const Wasm = { init, run, stop, provideInput };
