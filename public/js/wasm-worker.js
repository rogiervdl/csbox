/**
 * CSBox WASM Worker
 *
 * Laadt de .NET 10 WASM runtime en voert gecompileerde studentassemblies uit.
 * Student code draait op een .NET thread pool thread (Task.Run) zodat de
 * main worker thread vrij blijft voor JavaScript I/O berichten.
 * Blocking I/O (ReadLine/ReadKey) gebeurt via SemaphoreSlim.Wait() in C#.
 *
 * Communicatie:
 *   INKOMEND:   { type: 'run',   dll: Uint8Array }
 *               { type: 'input', text: string }
 *               { type: 'stop' }
 *   UITGAAND:   { type: 'output',       data: string }
 *               { type: 'input-needed', mode: 'line'|'key' }
 *               { type: 'exit',         code: number }
 *               { type: 'error',        data: string }
 *               { type: 'ready' }
 */

'use strict';

let runtime     = null;
let wasmExports = null;

// ── csbox-interop module ──────────────────────────────────────────────────────
const csboxInterop = {

    sendOutput(text) {
        self.postMessage({ type: 'output', data: text });
    },

    notifyInputNeeded(mode) {
        self.postMessage({ type: 'input-needed', mode });
    },

    sendDone(exitCode) {
        self.postMessage({ type: 'exit', code: exitCode });
    },

    sendError(message) {
        self.postMessage({ type: 'error', data: message });
    },
};

// ── .NET WASM runtime laden ───────────────────────────────────────────────────
async function initRuntime() {
    try {
        const { dotnet } = await import('/wasm-dist/dotnet.js');

        runtime = await dotnet.create();

        runtime.setModuleImports('csbox-interop', csboxInterop);
        wasmExports = await runtime.getAssemblyExports('wasm-host');

        self.postMessage({ type: 'ready' });
    } catch (err) {
        self.postMessage({ type: 'error', data: 'WASM laad-fout: ' + (err?.message ?? err) });
    }
}

// ── Berichten van de main thread ──────────────────────────────────────────────
self.onmessage = function (e) {
    const msg = e.data;

    if (msg.type === 'run') {
        if (!wasmExports) {
            self.postMessage({ type: 'error', data: 'Runtime nog niet geladen.' });
            return;
        }
        // RunCode start Task.Run en keert direct terug.
        wasmExports.WasmExports.RunCode(msg.dll);
        return;
    }

    if (msg.type === 'input') {
        if (wasmExports) {
            wasmExports.WasmExports.ProvideInput(msg.text);
        }
        return;
    }

    if (msg.type === 'stop') {
        if (wasmExports) {
            wasmExports.WasmExports.SetCancelled();
        }
        return;
    }
};

initRuntime();
