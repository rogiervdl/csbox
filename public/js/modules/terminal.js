/*
 * Terminal module — output rendering, ANSI colours, input handling, running state
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

const ANSI_FG = {
   30: '#555',    31: '#cd3131', 32: '#0dbc79', 33: '#e5e510',
   34: '#2472c8', 35: '#bc3fbc', 36: '#11a8cd', 37: '#e5e5e5',
   90: '#666',    91: '#f14c4c', 92: '#23d18b', 93: '#f5f543',
   94: '#3b8eea', 95: '#d670d6', 96: '#29b8db', 97: '#ffffff',
};

const ANSI_BG = {
   40:  '#555',    41:  '#cd3131', 42:  '#0dbc79', 43:  '#e5e510',
   44:  '#2472c8', 45:  '#bc3fbc', 46:  '#11a8cd', 47:  '#e5e5e5',
   100: '#666',   101:  '#f14c4c', 102: '#23d18b', 103: '#f5f543',
   104: '#3b8eea', 105: '#d670d6', 106: '#29b8db', 107: '#ffffff',
};

const CSBOX_RE  = /__CSBOX_(CLEAR|RS|FG:\d+|BG:\d+)__/;
const CSBOX_PFX = '__CSBOX_';
const CSBOX_MAX = '__CSBOX_BG:100__'.length;

// private state
let ansiState      = { fg: null, bg: null };
let outBuf         = '';
let inputPauseTimer = null;
let isRunning      = false;
let readKeyMode    = false;
let sendInputFn    = null;

// private DOM
const elmTermOutput = document.querySelector('#terminal-output');
const elmTermStatus = document.querySelector('#terminal-status');
const elmWorkspace  = document.querySelector('#workspace');
const inpTerm       = document.querySelector('#terminal-input');
const btnTermClear  = document.querySelector('#terminal-clear');

// FUNCTIES
// ========

function handleSentinel(tag) {
   if (tag === 'CLEAR') { clear(); return; }
   if (tag === 'RS') { ansiState = { fg: null, bg: null }; return; }
   const parts = tag.split(':');
   const ch = parts[0];
   const code = parts[1];
   if (ch === 'FG') ansiState.fg = ANSI_FG[+code] ?? null;
   if (ch === 'BG') ansiState.bg = ANSI_BG[+code] ?? null;
}

function enableInput() {
   if (isRunning) {
      inpTerm.disabled = false;
      inpTerm.focus();
   }
}

function scheduleInputEnable() {
   clearTimeout(inputPauseTimer);
   inpTerm.disabled = true;
   inputPauseTimer = setTimeout(enableInput, 120);
}

// event handlers

async function handleTermInputKeydown(e) {
   if (readKeyMode && e.key.length === 1) {
      e.preventDefault();
      readKeyMode = false;
      const val = e.key;
      inpTerm.value = '';
      append(`${val}\n`);
      try { await sendInputFn(val); } catch { /* ignored */ }
      scheduleInputEnable();
      return;
   }
   if (e.key === 'Enter' && !readKeyMode) {
      const val = inpTerm.value;
      inpTerm.value = '';
      append(`${val}\n`);
      try { await sendInputFn(val); } catch { /* ignored */ }
      scheduleInputEnable();
   }
}

// EXPORTS
// =======

function init(sendInput) {
   sendInputFn = sendInput;
   inpTerm.addEventListener('keydown', handleTermInputKeydown);
   btnTermClear.addEventListener('click', clear);
}

function handleRawOutput(raw) {
   const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
   outBuf += text;

   let m;
   while ((m = CSBOX_RE.exec(outBuf)) !== null) {
      if (m.index > 0) append(outBuf.slice(0, m.index));
      handleSentinel(m[1]);
      outBuf = outBuf.slice(m.index + m[0].length);
      CSBOX_RE.lastIndex = 0;
   }

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
   if (toSend) { append(toSend); outBuf = outBuf.slice(toSend.length); }
}

function append(text) {
   if (ansiState.fg || ansiState.bg) {
      const span = document.createElement('span');
      if (ansiState.fg) span.style.color = ansiState.fg;
      if (ansiState.bg) span.style.backgroundColor = ansiState.bg;
      span.textContent = text;
      elmTermOutput.appendChild(span);
   } else {
      elmTermOutput.appendChild(document.createTextNode(text));
   }
   elmTermOutput.scrollTop = elmTermOutput.scrollHeight;
}

function clear() {
   elmTermOutput.textContent = '';
   ansiState = { fg: null, bg: null };
}

function setStatus(text) {
   elmTermStatus.textContent = text;
}

function setRunning(value) {
   isRunning = value;
   elmWorkspace.classList.toggle('is-running', value);
   inpTerm.disabled = true;
   if (value) inpTerm.focus();
}

function setReadKeyMode(isKey) {
   readKeyMode = isKey;
   scheduleInputEnable();
}

export const Terminal = { init, handleRawOutput, append, clear, setStatus, setRunning, setReadKeyMode };
