/*
 * Errors panel module
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

let errorCount = 0;

// private DOM
const elmErrorsBadge  = document.querySelector('#errors-badge');
const elmErrorsBody   = document.querySelector('#errors-body');
const elmErrorsPanel  = document.querySelector('#errors-panel');
const elmErrorsToggle = document.querySelector('#errors-toggle');
const btnErrorsClear  = document.querySelector('#errors-clear');

// FUNCTIES
// ========

function renderErrorEntry(err) {
   const entry = document.createElement('div');
   entry.className = `error-entry${err.severity === 'warning' ? ' error-entry--warning' : ''}`;

   const loc = document.createElement('span');
   loc.className = 'error-entry__location';
   loc.textContent = err.line ? `r${err.line}:${err.col || 0}` : '';

   const text = document.createElement('span');
   text.className = 'error-entry__text';
   text.textContent = err.message;

   entry.appendChild(loc);
   entry.appendChild(text);
   elmErrorsBody.appendChild(entry);

   if (err.severity !== 'warning') errorCount++;
}

// event handlers

function handleErrorsToggleClick(e) {
   if (e.target === btnErrorsClear) return;
   elmErrorsPanel.classList.toggle('is-collapsed');
   if (!elmErrorsPanel.classList.contains('is-collapsed')) {
      errorCount = 0;
      elmErrorsBadge.textContent = '';
      elmErrorsBadge.classList.remove('visible');
   }
}

function handleErrorsClearClick(e) {
   e.stopPropagation();
   clear();
}

// EXPORTS
// =======

function init() {
   elmErrorsToggle.addEventListener('click', handleErrorsToggleClick);
   btnErrorsClear.addEventListener('click', handleErrorsClearClick);
}

function clear() {
   elmErrorsBody.innerHTML = '';
   errorCount = 0;
   elmErrorsBadge.textContent = '';
   elmErrorsBadge.classList.remove('visible');
}

function show(errors) {
   errors.forEach(renderErrorEntry);
   if (errorCount > 0) {
      elmErrorsBadge.textContent = errorCount;
      elmErrorsBadge.classList.add('visible');
      elmErrorsPanel.classList.remove('is-collapsed');
   }
}

export const Errors = { init, clear, show };
