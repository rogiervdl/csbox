// Houd de WASM main thread in leven zodat threads en JS interop werken.
// De werkelijke logica zit in WasmExports.cs (JSExport).
await Task.Delay(Timeout.Infinite);
