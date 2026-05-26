/*
 * Toolbar module — format, download, upload, theme toggle, layout toggle, run, stop
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

let editor = null;
let wasm   = null;

// private DOM
const btnDownload = document.querySelector('#btn-download');
const btnFormat   = document.querySelector('#btn-format');
const btnLayout   = document.querySelector('#btn-layout');
const btnRun      = document.querySelector('#btn-run');
const btnStop     = document.querySelector('#btn-stop');
const btnTheme    = document.querySelector('#btn-theme');
const elmWorkspace   = document.querySelector('#workspace');
const elmEditorPanel = document.querySelector('#editor-panel');
const elmRightPanel  = document.querySelector('#right-panel');
const elmTermPanel   = document.querySelector('#terminal-panel');
const elmErrorsPanel = document.querySelector('#errors-panel');
const inpUpload   = document.querySelector('#input-upload');

// FUNCTIES
// ========

function handleReaderLoad(ev) {
   editor.setValue(ev.target.result);
}

// event handlers

function handleBtnRunClick() {
   wasm.run(editor.getValue());
}

function removeButtonPress() {
   btnRun.classList.remove('is-pressed');
}

function handleBtnRunFromShortcut() {
   btnRun.classList.add('is-pressed');
   wasm.run(editor.getValue());
   setTimeout(removeButtonPress, 150);
}

function handleDocumentKeydown(e) {
   if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      btnRun.classList.add('is-pressed');
   }
}

function handleDocumentKeyup(e) {
   if (!btnRun.classList.contains('is-pressed')) return;
   if (e.key !== 's' && e.key !== 'Control' && e.key !== 'Meta') return;
   btnRun.classList.remove('is-pressed');
   wasm.run(editor.getValue());
}

function handleBtnStopClick() {
   wasm.stop();
}

function handleBtnFormatClick() {
   editor.getAction('editor.action.formatDocument').run();
}

function handleBtnDownloadClick() {
   const blob = new Blob([editor.getValue()], { type: 'text/plain' });
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = 'Program.cs';
   a.click();
   URL.revokeObjectURL(url);
}

async function handleInpUploadChange(e) {
   const file = e.target.files[0];
   if (!file) return;

   if (file.name.endsWith('.zip')) {
      try {
         const zip = await JSZip.loadAsync(file);
         const csFile = Object.values(zip.files).find(f => f.name.endsWith('.cs') && !f.dir);
         if (!csFile) {
            // JSZip loaded but no .cs file found — show in terminal via wasm interop fallback
            console.warn('Geen .cs bestand gevonden in de ZIP.');
            return;
         }
         const content = await csFile.async('string');
         editor.setValue(content);
      } catch {
         console.warn('Kon de ZIP niet lezen.');
      }
   } else {
      const reader = new FileReader();
      reader.addEventListener('load', handleReaderLoad);
      reader.readAsText(file);
   }
   e.target.value = '';
}

function handleBtnThemeClick() {
   const isLight = document.documentElement.classList.toggle('theme-light');
   monaco.editor.setTheme(isLight ? 'vs' : 'vs-dark');
   localStorage.setItem('csbox-theme', isLight ? 'light' : 'dark');
}

function handleBtnLayoutClick() {
   elmWorkspace.classList.toggle('layout-stacked');
   elmEditorPanel.style.flex = '';
   elmRightPanel.style.flex = '';
   elmTermPanel.style.flex = '';
   elmErrorsPanel.style.flex = '';
   editor.layout();
}

// EXPORTS
// =======

function init(editorInstance, wasmModule) {
   editor = editorInstance;
   wasm = wasmModule;

   btnRun.addEventListener('click', handleBtnRunClick);
   document.addEventListener('keydown', handleDocumentKeydown);
   document.addEventListener('keyup', handleDocumentKeyup);
   btnStop.addEventListener('click', handleBtnStopClick);
   btnFormat.addEventListener('click', handleBtnFormatClick);
   btnDownload.addEventListener('click', handleBtnDownloadClick);
   inpUpload.addEventListener('change', handleInpUploadChange);
   btnTheme.addEventListener('click', handleBtnThemeClick);
   btnLayout.addEventListener('click', handleBtnLayoutClick);
}

export const Toolbar = { init, handleBtnRunFromShortcut };
