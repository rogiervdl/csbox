/*
 * Foutenpaneel
 *
 * Toont de compileerfouten en -waarschuwingen met hun bestand en regel, bv.
 * classes/Persoon.cs:12. Een klik op een fout met een bestand opent dat
 * bestand op die positie.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// het aantal fouten (geen waarschuwingen) sinds het paneel opengeklapt werd
let errorCount = 0;

// wat er gebeurt bij een klik op een fout: krijgt bestand, regel en kolom
let toonPositie = null;

// DOM
const elmErrorsBadge = document.querySelector('#errors-badge');
const elmErrorsBody = document.querySelector('#errors-body');
const elmErrorsPanel = document.querySelector('#errors-panel');
const elmErrorsToggle = document.querySelector('#errors-toggle');
const btnErrorsClear = document.querySelector('#errors-clear');

// FUNCTIES
// ========

/**
 * Geeft de plaats van een fout als tekst.
 *
 * @param {object} err - { file, line, col }
 * @returns {string} bv. classes/Persoon.cs:12:5; leeg zonder plaats
 */
function plaatsVan(err) {
   if (!err.file) return '';
   return err.line ? `${err.file}:${err.line}:${err.col || 1}` : err.file;
}

/**
 * Voegt één fout toe aan het paneel. Een fout met een bestand is een knop.
 *
 * @param {object} err - { file, line, col, severity, message }
 */
function renderErrorEntry(err) {
   // een knop met een bestand, anders een gewone regel
   const entry = document.createElement(err.file ? 'button' : 'div');
   entry.className = `error-entry${err.severity === 'warning' ? ' error-entry--warning' : ''}`;
   if (err.file) {
      entry.type = 'button';
      entry.title = 'Toon in de editor';
      entry.dataset.file = err.file;
      entry.dataset.line = String(err.line || 0);
      entry.dataset.col = String(err.col || 0);
   }

   // de plaats en de melding
   const loc = document.createElement('span');
   loc.className = 'error-entry__location';
   loc.textContent = plaatsVan(err);
   const text = document.createElement('span');
   text.className = 'error-entry__text';
   text.textContent = err.message;
   entry.append(loc, text);
   elmErrorsBody.append(entry);

   // tel de fouten voor de badge
   if (err.severity !== 'warning') errorCount++;
}

/**
 * Initialiseert het foutenpaneel.
 *
 * @param {Function} onToonPositie - opent een bestand op een positie: (bestand, regel, kolom)
 */
function init(onToonPositie) {
   toonPositie = onToonPositie;
   elmErrorsToggle.addEventListener('click', handleErrorsToggleClick);
   btnErrorsClear.addEventListener('click', handleErrorsClearClick);
   elmErrorsBody.addEventListener('click', handleErrorsBodyClick);
}

/**
 * Wist alle fouten en de badge.
 */
function clear() {
   elmErrorsBody.innerHTML = '';
   errorCount = 0;
   elmErrorsBadge.textContent = '';
   elmErrorsBadge.classList.remove('visible');
}

/**
 * Toont fouten; bij minstens één echte fout klapt het paneel open met een badge.
 *
 * @param {Array<object>} errors - { file, line, col, severity, message }
 */
function show(errors) {
   errors.forEach(renderErrorEntry);
   if (errorCount === 0) return;
   elmErrorsBadge.textContent = errorCount;
   elmErrorsBadge.classList.add('visible');
   elmErrorsPanel.classList.remove('is-collapsed');
}

// event handlers

function handleErrorsToggleClick(e) {
   // de wisknop klapt niet
   if (e.target === btnErrorsClear) return;

   // open- of dichtklappen; opengeklapt verdwijnt de badge
   elmErrorsPanel.classList.toggle('is-collapsed');
   if (elmErrorsPanel.classList.contains('is-collapsed')) return;
   errorCount = 0;
   elmErrorsBadge.textContent = '';
   elmErrorsBadge.classList.remove('visible');
}

function handleErrorsClearClick(e) {
   e.stopPropagation();
   clear();
}

function handleErrorsBodyClick(e) {
   // enkel een fout met een bestand
   const entry = e.target.closest('.error-entry[data-file]');
   if (!entry || !toonPositie) return;
   toonPositie(entry.dataset.file, Number(entry.dataset.line), Number(entry.dataset.col));
}

// EXPORTS
// =======

export const Errors = { init, clear, show };
