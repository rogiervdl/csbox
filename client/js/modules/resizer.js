/*
 * Resizer
 *
 * Versleepbare grenzen: tussen de bestandsbrowser en de panelen, tussen de
 * panelen en de terminal, tussen de terminal en het foutenpaneel, en tussen
 * twee panelen. Die laatste maakt Panelen telkens een paneel opengaat of sluit.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// de standaard minimale grootte van een paneel, in pixels
const STANDAARD_MIN = 80;

// wat er moet gebeuren na het verslepen, bv. de editors herschikken
let naVerslepen = null;

// DOM
const elmWorkspace = document.querySelector('#workspace');
const elmMainResizer = document.querySelector('#main-resizer');
const elmBrowserResizer = document.querySelector('#browser-resizer');
const elmRightResizer = document.querySelector('#right-resizer');
const elmBrowser = document.querySelector('#bestandsbrowser');
const elmEditorsPanel = document.querySelector('#editors-panel');
const elmRightPanel = document.querySelector('#right-panel');
const elmTermPanel = document.querySelector('#terminal-panel');
const elmErrorsPanel = document.querySelector('#errors-panel');

// FUNCTIES
// ========

/**
 * Geeft de minimale grootte van een paneel terug.
 * Een dichtgeklapt paneel ligt via CSS vast op 30px en klemt dus niet mee:
 * anders zou het slepen meteen blokkeren zodra de buur dichtgeklapt is.
 *
 * @param {HTMLElement} pane - het paneel
 * @param {number} min - de minimale grootte in pixels
 * @returns {number} het minimum, of 0 voor een dichtgeklapt paneel
 */
function paneMinSize(pane, min) {
   const isCollapsed = pane.classList.contains('is-collapsed') || pane.classList.contains('is-ingeklapt');
   return isCollapsed ? 0 : min;
}

/**
 * Maakt een sleepbare grens tussen twee panelen.
 *
 * @param {HTMLElement} resizerEl - het resizer-element
 * @param {HTMLElement} paneA - het eerste paneel
 * @param {HTMLElement} paneB - het tweede paneel
 * @param {Function} setSize - past de flex-grootte van beide panelen aan
 * @param {Function} isVerticalFn - geeft true terug als de richting verticaal is
 * @param {number} minA - minimale grootte van het eerste paneel in pixels
 * @param {number} minB - minimale grootte van het tweede paneel in pixels
 */
function initResizer(resizerEl, paneA, paneB, setSize, isVerticalFn, minA = STANDAARD_MIN, minB = STANDAARD_MIN) {
   // de positie en de groottes bij het begin van het slepen, en de zin (-1 als B vóór A staat)
   let startPos = 0;
   let startSizeA = 0;
   let startSizeB = 0;
   let zin = 1;

   // tijdens het slepen
   function handleDocumentMousemove(e) {
      // begrens de verplaatsing zodat geen van beide panelen onder zijn minimum zakt
      const moved = ((isVerticalFn() ? e.clientY : e.clientX) - startPos) * zin;
      const lower = paneMinSize(paneA, minA) - startSizeA;
      const upper = startSizeB - paneMinSize(paneB, minB);
      const delta = Math.min(Math.max(moved, lower), upper);

      // pas de groottes aan, en laat de editors volgen
      setSize(paneA, paneB, startSizeA + delta, startSizeB - delta);
      if (naVerslepen) naVerslepen();
   }

   // einde van het slepen
   function handleDocumentMouseup() {
      resizerEl.classList.remove('is-dragging');
      document.removeEventListener('mousemove', handleDocumentMousemove);
      document.removeEventListener('mouseup', handleDocumentMouseup);
   }

   // begin van het slepen
   function handleResizerMousedown(e) {
      e.preventDefault();
      resizerEl.classList.add('is-dragging');
      startPos = isVerticalFn() ? e.clientY : e.clientX;
      startSizeA = isVerticalFn() ? paneA.offsetHeight : paneA.offsetWidth;
      startSizeB = isVerticalFn() ? paneB.offsetHeight : paneB.offsetWidth;
      zin = getComputedStyle(paneA.parentElement).flexDirection.endsWith('reverse') ? -1 : 1;
      document.addEventListener('mousemove', handleDocumentMousemove);
      document.addEventListener('mouseup', handleDocumentMouseup);
   }

   resizerEl.addEventListener('mousedown', handleResizerMousedown);
}

/**
 * Geeft paneel A een vast deel van de ouder, in procent; B krijgt de rest.
 *
 * @param {HTMLElement} a
 * @param {HTMLElement} b
 * @param {number} sA - de nieuwe grootte van A in pixels
 * @param {boolean} isVert - of de ouder verticaal schikt
 */
function zetProcent(a, b, sA, isVert) {
   const total = isVert ? a.parentElement.offsetHeight : a.parentElement.offsetWidth;
   a.style.flex = `0 0 ${(sA / total) * 100}%`;
   b.style.flex = '1 1 0';
}

// de richtingen van de vaste grenzen
function isHorizontaal() {
   return false;
}

function isVerticaal() {
   return true;
}

// de panelen staan onder elkaar in de verticale layout
function isPanelenVerticaal() {
   return elmWorkspace.classList.contains('layout-vertical');
}

// de grens tussen de panelen en de terminal: in procent
function zetHoofdgrens(a, b, sA) {
   zetProcent(a, b, sA, false);
}

// de grens naast de browser: de browser krijgt een vaste breedte
function zetBrowsergrens(a, b, sA) {
   a.style.flex = `0 0 ${sA}px`;
}

// de grens boven het foutenpaneel: het foutenpaneel krijgt een vaste hoogte
function zetFoutengrens(a, b, sA, sB) {
   b.style.flex = `0 0 ${sB}px`;
}

// de grens tussen twee editorpanelen: in procent, in de richting van de layout
function zetPaneelgrens(a, b, sA) {
   zetProcent(a, b, sA, isPanelenVerticaal());
}

/**
 * Maakt een sleepbare grens tussen twee editorpanelen; de richting volgt
 * de layout.
 *
 * @param {HTMLElement} grens - het resizer-element tussen beide
 * @param {HTMLElement} paneA - het paneel ervoor
 * @param {HTMLElement} paneB - het paneel erna
 */
function koppelPanelen(grens, paneA, paneB) {
   initResizer(grens, paneA, paneB, zetPaneelgrens, isPanelenVerticaal);
}

/**
 * Initialiseert de vaste grenzen.
 *
 * @param {Function} herschik - wat er na het verslepen moet gebeuren, bv. de editors herschikken
 */
function init(herschik) {
   // onthoud wat er na het slepen moet gebeuren
   naVerslepen = herschik;

   // de vaste grenzen; de grens naast de browser laat de browser smal worden, niet de panelen
   initResizer(elmBrowserResizer, elmBrowser, elmEditorsPanel, zetBrowsergrens, isHorizontaal, 120, 200);
   initResizer(elmMainResizer, elmEditorsPanel, elmRightPanel, zetHoofdgrens, isHorizontaal);
   initResizer(elmRightResizer, elmTermPanel, elmErrorsPanel, zetFoutengrens, isVerticaal, 60, 30);
}

// EXPORTS
// =======

export const Resizer = { init, koppelPanelen };
