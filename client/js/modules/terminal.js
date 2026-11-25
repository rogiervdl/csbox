/*
 * Terminal module — output rendering, ANSI colours, input handling, running state
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// de ANSI-voorgrondcodes; elke code heeft een CSS-variabele --ansi-<code> per
// kleurschema, zodat de terminal het schema volgt
const ANSI_CODES = [30, 31, 32, 33, 34, 35, 36, 37, 90, 91, 92, 93, 94, 95, 96, 97];

// een achtergrondcode is de voorgrondcode plus 10
const ANSI_BG_OFFSET = 10;

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

/**
 * Geeft de CSS-kleur voor een ANSI-voorgrondcode, of null bij een onbekende code.
 *
 * @param {number} code - bv. 31
 * @returns {string|null} bv. 'var(--ansi-31)'
 */
function ansiKleur(code) {
   return ANSI_CODES.includes(code) ? `var(--ansi-${code})` : null;
}

/**
 * Verwerkt een markering uit de uitvoer: wissen, kleur herstellen of een kleur zetten.
 *
 * @param {string} tag - CLEAR, RS, FG:<code> of BG:<code>
 */
function handleSentinel(tag) {
   // wissen en kleur herstellen
   if (tag === 'CLEAR') { clear(); return; }
   if (tag === 'RS') { ansiState = { fg: null, bg: null }; return; }

   // voor- of achtergrondkleur
   const parts = tag.split(':');
   const code = Number(parts[1]);
   if (parts[0] === 'FG') ansiState.fg = ansiKleur(code);
   if (parts[0] === 'BG') ansiState.bg = ansiKleur(code - ANSI_BG_OFFSET);
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
