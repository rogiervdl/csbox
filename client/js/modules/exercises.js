/*
 * Exercises module — oefeningkeuze en opgavepaneel
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Config } from '../config.js';
import { Store } from '../storage.js';
import { Bestanden } from './bestanden.js';
import { Panelen } from './panelen.js';
import { Bestandsbrowser } from './bestandsbrowser.js';
import { PrismKleuren } from './prism-kleuren.js';
import { ThemeSwitcher } from './themeswitcher.js';

// DECLARATIES
// ===========

// de catalogus
let subjectsData = [];

// wie wil weten welke oefening gekozen is (bv. de feedback)
let oefeningLuisteraar = null;

// de huidige oefening en haar opgave
let currentReadme = '';
let currentExerciseLabel = '';
let currentExerciseBaseUrl = '';

// de sleutels in localStorage
const LS_SUBJECT = 'csbox-subject';
const LS_MODULE = 'csbox-module';
const LS_EXERCISE = 'csbox-exercise';
const LS_CODE_PREFIX = 'csbox-code';

// het bestand dat zonder geopend in de catalogus een paneel krijgt
const HOOFDBESTAND = 'Program.cs';

// automatisch bewaren, een seconde na de laatste wijziging, onder de sleutel
// van de oefening die geladen is (null zonder oefening)
const SAVE_DELAY_MS = 1000;
let saveTimeout = null;
let loadedKey = null;

// sleepstatus van het opgavepaneel
let readmeDragOffsetX = 0;
let readmeDragOffsetY = 0;
let readmeHasBeenPositioned = false;

// de eerste positie van het opgavepaneel: rechtsboven, onder de toolbar
const README_MARGE_RECHTS = 24;
const README_TOP = 64;

// hoe lang de blob-URL van een opgave in een nieuw tabblad blijft bestaan
const BLOB_LEVENSDUUR_MS = 10000;

// Schoolyear's examenbrowser (Electron-shell) sluit een los venster (window.open)
// binnen enkele milliseconden na aanmaak weer; op die userAgent verbergen we de
// "nieuw tabblad"-knop daarom
const LOCKDOWN_BROWSER_PATTERN = /exams-client|Electron/;

// de talen van de codeblokken in de opgave die Prism inkleurt
const LANGUAGE_MAP = {
   cs: 'csharp',
   csharp: 'csharp',
};

// DOM
const selSubject = document.querySelector('#select-subject');
const selModule = document.querySelector('#select-module');
const selExercise = document.querySelector('#select-exercise');
const btnReadme = document.querySelector('#btn-readme');
const btnReadmeNewTab = document.querySelector('#btn-readme-newtab');
const btnModalClose = document.querySelector('#btn-modal-close');
const divModal = document.querySelector('#modal-readme');
const divModalDialog = document.querySelector('#modal-readme .modal__dialog');
const divModalHeader = document.querySelector('#modal-readme .modal__header');
const divModalTitle = document.querySelector('#modal-readme .modal__title');
const divModalBody = document.querySelector('#modal-readme-body');
const divBrand = document.querySelector('.toolbar__brand');
const divModalConfirm = document.querySelector('#modal-confirm');
const btnConfirmBewaarde = document.querySelector('#btn-confirm-bewaarde');
const btnConfirmStartcode = document.querySelector('#btn-confirm-startcode');
const divModalConfirmBackdrop = document.querySelector('#modal-confirm .modal__backdrop');

// FUNCTIES
// ========

/**
 * Haalt een JSON-antwoord op. Geeft null terug bij een fout.
 *
 * @param {string} url
 * @returns {Promise<object|null>}
 */
async function fetchJson(url) {
   try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.json();
   } catch (e) {
      return null;
   }
}

/**
 * Zet de catalogus van de server om naar de vorm die deze module gebruikt.
 *
 * @param {object} catalog - { vakken: [{ mapnaam, label, modules: [{ mapnaam, label, oefeningen }] }] }
 * @returns {Array<object>} [{ id, label, modules: [{ id, label, exercises: [{ id, label, geopend, feedback }] }] }]
 */
function toSubjects(catalog) {
   return catalog.vakken.map(vak => ({
      id: vak.mapnaam,
      label: vak.label,
      modules: vak.modules.map(mod => ({
         id: mod.mapnaam,
         label: mod.label,
         exercises: mod.oefeningen.map(oef => ({ id: oef.mapnaam, label: oef.label, geopend: oef.geopend ?? [HOOFDBESTAND], feedback: oef.feedback === true })),
      })),
   }));
}

/**
 * Meldt de gekozen oefening aan de luisteraar, of null zonder oefening.
 *
 * @param {{vak: string, module: string, oefening: string, feedback: boolean}|null} oefening
 */
function meldOefening(oefening) {
   if (oefeningLuisteraar) oefeningLuisteraar(oefening);
}

/**
 * Laadt de catalogus en herstelt de laatste selectie.
 */
async function loadIndex() {
   // haal de catalogus op; zonder catalogus blijven de keuzelijsten leeg
   const catalog = await fetchJson('/api/content/index');
   if (!catalog) return;

   // vul de keuzelijsten en herstel de selectie
   subjectsData = toSubjects(catalog);
   populateSubjects();
   restoreSelection();
}

/**
 * Vult de vak-dropdown op basis van subjectsData.
 */
function populateSubjects() {
   subjectsData.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject.id;
      option.textContent = subject.label;
      selSubject.appendChild(option);
   });
}

/**
 * Vult de module-dropdown op basis van het gekozen vak.
 *
 * @param {string} subjectId
 */
function populateModules(subjectId) {
   // zoek het vak
   const subject = subjectsData.find(s => s.id === subjectId);
   if (!subject) return;

   // een optie per module
   subject.modules.forEach(mod => {
      const option = document.createElement('option');
      option.value = mod.id;
      option.textContent = mod.label;
      selModule.appendChild(option);
   });
   selModule.disabled = false;
}

/**
 * Vult de oefening-dropdown op basis van het gekozen vak en de gekozen module.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 */
function populateExercises(subjectId, moduleId) {
   // zoek de module
   const subject = subjectsData.find(s => s.id === subjectId);
   const mod = subject?.modules.find(m => m.id === moduleId);
   if (!mod) return;

   // een optie per oefening
   mod.exercises.forEach(exercise => {
      const option = document.createElement('option');
      option.value = exercise.id;
      option.textContent = exercise.label;
      selExercise.appendChild(option);
   });
   selExercise.disabled = false;
}

/**
 * Schakelt de opgaveknoppen uit en vergeet de opgave.
 */
function resetReadme() {
   meldOefening(null);
   currentReadme = '';
   btnReadme.disabled = true;
   btnReadme.title = 'geen opgave gegeven';
   btnReadmeNewTab.disabled = true;
}

/**
 * Laadt de startcode en opgave voor de geselecteerde oefening.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 * @param {string} exerciseId
 * @param {boolean} confirmIfSaved - vraag eerst of de bewaarde versie geladen moet worden
 */
async function loadExercise(subjectId, moduleId, exerciseId, confirmIfSaved = false) {
   // de oefening en haar afbeeldingen komen van de contentroute
   const exerciseUrl = `/api/content/${subjectId}/${moduleId}/${exerciseId}`;
   currentExerciseBaseUrl = `${exerciseUrl}/asset/`;
   resetReadme();

   // het label voor de titel van de opgave
   const subject = subjectsData.find(s => s.id === subjectId);
   const mod = subject?.modules.find(m => m.id === moduleId);
   const exercise = mod?.exercises.find(e => e.id === exerciseId);
   currentExerciseLabel = exercise?.label ?? '';

   // een bewaarde versie gaat voor, eventueel na bevestiging
   const saved = leesBewaard(subjectId, moduleId, exerciseId);
   const useSaved = saved !== null && confirmIfSaved ? await confirmRestore() : saved !== null;

   // haal de startbestanden en de opgave op
   const exerciseData = await fetchJson(exerciseUrl);
   if (!exerciseData) return;

   // guard tegen race condition: selectie kan veranderd zijn tijdens fetch
   if (selSubject.value !== subjectId || selModule.value !== moduleId || selExercise.value !== exerciseId) return;

   // de startcode, of de bewaarde versie daarover, met de panelen die de oefening aanwijst
   const bestanden = voegBewaardSamen(exerciseData.bestanden, useSaved ? saved : null);
   toonBestanden(bestanden, exerciseData.alleenLezen ?? [], currentExerciseBaseUrl, exercise?.geopend ?? [HOOFDBESTAND], codeKey(subjectId, moduleId, exerciseId));
   meldOefening({ vak: subjectId, module: moduleId, oefening: exerciseId, feedback: exercise?.feedback === true });
   const readme = exerciseData.readme ?? null;

   // toon de opgave meteen
   if (readme === null) return;
   currentReadme = readme;
   btnReadme.disabled = false;
   btnReadme.title = 'Toon opgave';
   btnReadmeNewTab.disabled = false;
   await showReadme();
}

/**
 * Legt een bewaarde versie over de startcode. De bewaarde versie bepaalt welke
 * bestanden er zijn: de student kan bestanden toevoegen, hernoemen en
 * verwijderen. Enkel Program.cs is er altijd, desnoods met zijn startcode.
 *
 * @param {object} start - pad → inhoud van de startbestanden
 * @param {object|null} bewaard - pad → inhoud van de bewaarde versie, of null
 * @returns {object} pad → inhoud
 */
function voegBewaardSamen(start, bewaard) {
   // een lege of ontbrekende Program.cs in de startcode krijgt de standaardinhoud
   const standaard = Config.defaultBestanden[HOOFDBESTAND];
   if (!start[HOOFDBESTAND]?.trim()) start = { ...start, [HOOFDBESTAND]: standaard };
   if (!bewaard) return { ...start };

   // eerst de startbestanden die nog bestaan, in hun volgorde
   const resultaat = {};
   Object.keys(start)
      .filter(pad => bewaard[pad] !== undefined)
      .forEach(pad => { resultaat[pad] = bewaard[pad]; });

   // dan de andere bewaarde bestanden
   Object.keys(bewaard)
      .filter(pad => start[pad] === undefined)
      .forEach(pad => { resultaat[pad] = bewaard[pad]; });

   // Program.cs is er altijd
   if (resultaat[HOOFDBESTAND] === undefined) resultaat[HOOFDBESTAND] = start[HOOFDBESTAND];
   return resultaat;
}

/**
 * Vervangt de bestanden in de editors en de boom, en opent de panelen.
 *
 * @param {object} bestanden - pad → inhoud
 * @param {Array<string>} alleenLezen - de paden van de afbeeldingen
 * @param {string} url - de map van de oefening op de server; leeg zonder oefening
 * @param {Array<string>} geopend - de bestanden die een paneel krijgen, in die volgorde
 * @param {string|null} [key] - de bewaarsleutel van de oefening; null zonder oefening
 */
function toonBestanden(bestanden, alleenLezen, url, geopend, key = null) {
   // bewaar eerst wat nog gepland stond voor de vorige oefening
   saveCode();
   loadedKey = key;

   // dan de panelen dicht: hun editors gebruiken de modellen die nu vervallen
   Panelen.sluitAlle();
   Bestanden.laad(bestanden, alleenLezen, url);
   Bestandsbrowser.herbouw(true);
   geopend.forEach(Panelen.open);
}

/**
 * Rendert de opgave als HTML, met de codeblokken ingekleurd door Prism.
 *
 * @returns {Promise<string>} de gerenderde HTML
 */
async function renderReadme() {
   // de opgave als HTML
   const doc = parseReadme();

   // de kleuring is versiering: gaat er iets mis, dan tonen we de opgave
   // zonder kleur in plaats van helemaal niet
   try {
      // marked zet de taal van de fence in een class; blokken zonder taal blijven ongekleurd
      doc.querySelectorAll('pre > code[class^="language-"]').forEach(colorizeBlock);
   } catch (e) {
      console.warn('Exercises: syntaxkleuring overgeslagen', e);
      return parseReadme().body.innerHTML;
   }

   return doc.body.innerHTML;
}

/**
 * Kleurt één codeblok in met Prism, als de taal gekend is.
 *
 * @param {HTMLElement} block - een code-element met class language-<taal>
 */
function colorizeBlock(block) {
   // enkel talen die Prism hier kent
   const language = LANGUAGE_MAP[block.className.replace('language-', '')];
   if (!language) return;

   // het afsluitende regeleinde van marked weglaten, anders komt er een lege laatste regel
   const code = block.textContent.replace(/\n$/, '');
   block.innerHTML = PrismKleuren.kleurHtml(code);
}

/**
 * Parseert de opgave naar HTML en maakt de afbeeldingspaden absoluut.
 * Het parsen gebeurt in een inert document, want dat laadt nog geen afbeeldingen:
 * anders lost de browser de relatieve paden eerst op tegen de app-URL, met een
 * 404 per afbeelding tot gevolg.
 *
 * @returns {Document} het inerte document met de gerenderde markdown
 */
function parseReadme() {
   // parse de markdown
   const doc = new DOMParser().parseFromString(marked.parse(currentReadme), 'text/html');
   const absBase = new URL(currentExerciseBaseUrl, window.location.href).href;

   // afbeeldingen komen van de asset-route van de oefening
   doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src) img.setAttribute('src', new URL(src, absBase).href);
   });

   return doc;
}

/**
 * Rendert de opgave als HTML en toont ze in het opgavepaneel.
 */
async function showReadme() {
   divModalTitle.textContent = `Opgave — ${currentExerciseLabel}`;
   divModalBody.innerHTML = await renderReadme();
   divModalBody.insertAdjacentHTML('beforeend', Config.readmeTip);
   divModal.setAttribute('aria-hidden', 'false');
   positionReadmePanelInitially();
}

/**
 * Zet het opgavepaneel bij de eerste keer tonen rechtsboven, buiten de weg van de editor.
 * Nadien blijven de laatst gekozen positie en afmeting staan, ook bij een volgende oefening.
 */
function positionReadmePanelInitially() {
   if (readmeHasBeenPositioned) return;
   readmeHasBeenPositioned = true;
   positionReadmePanel(window.innerWidth - divModalDialog.offsetWidth - README_MARGE_RECHTS, README_TOP);
}

/**
 * Zet het opgavepaneel op de gegeven positie, geklemd binnen het scherm.
 *
 * @param {number} x
 * @param {number} y
 */
function positionReadmePanel(x, y) {
   const maxX = Math.max(window.innerWidth - divModalDialog.offsetWidth, 0);
   const maxY = Math.max(window.innerHeight - divModalDialog.offsetHeight, 0);
   divModalDialog.style.left = `${Math.min(Math.max(x, 0), maxX)}px`;
   divModalDialog.style.top = `${Math.min(Math.max(y, 0), maxY)}px`;
}

/**
 * Opent de opgave als HTML-pagina in een nieuw tabblad, met de stylesheet
 * van de app en hetzelfde kleurschema als het opgavevenster.
 */
async function openReadmeInNewTab() {
   // de basis voor afbeeldingen, de stylesheet, het kleurschema en de inhoud
   const absBase = new URL(currentExerciseBaseUrl, window.location.href).href;
   const stylesheet = new URL('css/styles.css', window.location.href).href;
   const { theme, schema } = document.documentElement.dataset;
   const body = await renderReadme();

   // de volledige pagina: de opmaak van het opgavevenster, als gewone pagina die scrolt
   const html = `<!DOCTYPE html>
<html lang="nl" data-theme="${theme}" data-schema="${schema}">
<head>
   <meta charset="UTF-8">
   <title>${currentExerciseLabel}</title>
   <base href="${absBase}">
   <link rel="stylesheet" href="${stylesheet}">
   <style>
      html, body { height: auto; overflow: auto; }
      .modal__body { margin: 0 auto; max-width: 780px; padding: 40px 24px; }
      ${ThemeSwitcher.codeCss()}
   </style>
</head>
<body>
<main class="modal__body">
<h1>${currentExerciseLabel}</h1>
${body}
</main>
</body>
</html>`;

   // open ze via een tijdelijke blob-URL
   const blob = new Blob([html], { type: 'text/html' });
   const url = URL.createObjectURL(blob);
   window.open(url, '_blank');
   setTimeout(revokeUrl, BLOB_LEVENSDUUR_MS, url);
}

/**
 * Geeft een blob-URL vrij.
 *
 * @param {string} url
 */
function revokeUrl(url) {
   URL.revokeObjectURL(url);
}

/**
 * Verbergt het opgavepaneel; de focus gaat eerst terug naar de opgaveknop,
 * want aria-hidden op een element met de focus is een toegankelijkheidsfout.
 */
function closeModal() {
   if (divModal.contains(document.activeElement)) btnReadme.focus();
   divModal.setAttribute('aria-hidden', 'true');
}

/**
 * Parseert de URL-hash naar een selectie-object.
 *
 * @returns {{ subjectId: string, moduleId: string, exerciseId: string }|null}
 */
function getHashSelection() {
   // geen of een ongeldige hash
   const hash = location.hash.slice(1);
   if (!hash) return null;
   const parts = hash.split('/');
   if (parts.length < 1 || parts.length > 3) return null;

   // vak, module en oefening, voor zover gegeven
   return {
      subjectId: parts[0] || null,
      moduleId: parts[1] || null,
      exerciseId: parts[2] || null,
   };
}

/**
 * Zet de URL-hash op basis van de huidige selectie.
 *
 * @param {string} subjectId
 * @param {string} [moduleId]
 * @param {string} [exerciseId]
 */
function setHash(subjectId, moduleId, exerciseId) {
   const parts = [subjectId, moduleId, exerciseId].filter(Boolean);
   history.replaceState(null, '', `#${parts.join('/')}`);
}

/**
 * Verwijdert de URL-hash.
 */
function clearHash() {
   history.replaceState(null, '', location.pathname + location.search);
}

/**
 * Bouwt de localStorage-sleutel voor de bestanden van een oefening.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 * @param {string} exerciseId
 * @returns {string}
 */
function codeKey(subjectId, moduleId, exerciseId) {
   return `${LS_CODE_PREFIX}/${subjectId}/${moduleId}/${exerciseId}`;
}

/**
 * Leest de bewaarde bestanden van een oefening. Een bewaarde versie van voor
 * de meerdere bestanden (enkel de code, onder .../cs) wordt Program.cs.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 * @param {string} exerciseId
 * @returns {object|null} pad → inhoud, of null zonder bewaarde versie
 */
function leesBewaard(subjectId, moduleId, exerciseId) {
   // de bewaarde bestanden als JSON, enkel met tekst; onleesbaar telt als niet bewaard
   const key = codeKey(subjectId, moduleId, exerciseId);
   const json = Store.get(key);
   if (json !== null) {
      try {
         const bewaard = JSON.parse(json);
         if (!bewaard || typeof bewaard !== 'object') return null;
         return Object.fromEntries(Object.entries(bewaard).filter(([, inhoud]) => typeof inhoud === 'string'));
      } catch (e) {
         return null;
      }
   }

   // de oude vorm: enkel de code
   const oud = Store.get(`${key}/cs`);
   return oud === null ? null : { [HOOFDBESTAND]: oud };
}

/**
 * Slaat een geplande wijziging meteen op: alle bestanden van de geladen
 * oefening, in localStorage. Zonder geplande wijziging of oefening gebeurt er niets.
 */
function saveCode() {
   if (saveTimeout === null) return;
   clearTimeout(saveTimeout);
   saveTimeout = null;
   if (loadedKey) Store.set(loadedKey, JSON.stringify(Bestanden.alle()));
}

/**
 * Slaat alle bestanden van de geladen oefening meteen op (Ctrl+S), ook
 * zonder geplande wijziging. Zonder oefening gebeurt er niets.
 */
function bewaar() {
   clearTimeout(saveTimeout);
   saveTimeout = null;
   if (loadedKey) Store.set(loadedKey, JSON.stringify(Bestanden.alle()));
}

/**
 * Toont een dialoogvenster en vraagt of de bewaarde versie geladen moet worden.
 *
 * @returns {Promise<boolean>}
 */
function confirmRestore() {
   return new Promise(resolve => {
      // toon de dialoog
      divModalConfirm.setAttribute('aria-hidden', 'false');

      // sluit de dialoog en geef de keuze door
      function finish(useSaved) {
         divModalConfirm.setAttribute('aria-hidden', 'true');
         btnConfirmBewaarde.removeEventListener('click', handleBtnConfirmBewaardeClick);
         btnConfirmStartcode.removeEventListener('click', handleBtnConfirmStartcodeClick);
         divModalConfirmBackdrop.removeEventListener('click', handleDivModalConfirmBackdropClick);
         resolve(useSaved);
      }

      // de bewaarde versie, de startcode, of naast de dialoog klikken (bewaarde versie)
      function handleBtnConfirmBewaardeClick() { finish(true); }
      function handleBtnConfirmStartcodeClick() { finish(false); }
      function handleDivModalConfirmBackdropClick() { finish(true); }

      // koppel de knoppen
      btnConfirmBewaarde.addEventListener('click', handleBtnConfirmBewaardeClick);
      btnConfirmStartcode.addEventListener('click', handleBtnConfirmStartcodeClick);
      divModalConfirmBackdrop.addEventListener('click', handleDivModalConfirmBackdropClick);
   });
}

/**
 * Plant een debounced opslaan in (1s na de laatste wijziging).
 */
function scheduleSave() {
   clearTimeout(saveTimeout);
   saveTimeout = setTimeout(saveCode, SAVE_DELAY_MS);
}

/**
 * Herstelt de laatste selectie vanuit de URL-hash of localStorage.
 */
function restoreSelection() {
   // het vak
   const fromHash = getHashSelection();
   const savedSubject = fromHash?.subjectId ?? Store.get(LS_SUBJECT);
   if (!savedSubject) return;
   selSubject.value = savedSubject;
   if (selSubject.value !== savedSubject) return;

   // de module
   populateModules(savedSubject);
   if (fromHash && !fromHash.moduleId) return;
   const savedModule = fromHash?.moduleId ?? Store.get(LS_MODULE);
   if (!savedModule) return;
   selModule.value = savedModule;
   if (selModule.value !== savedModule) return;

   // de oefening
   populateExercises(savedSubject, savedModule);
   if (fromHash && !fromHash.exerciseId) return;
   const savedExercise = fromHash?.exerciseId ?? Store.get(LS_EXERCISE);
   if (!savedExercise) return;
   selExercise.value = savedExercise;
   if (selExercise.value !== savedExercise) return;

   loadExercise(savedSubject, savedModule, savedExercise);
}

// event handlers

function handleDivBrandClick() {
   // leeg de keuzelijsten en de opgave
   selSubject.value = '';
   selModule.innerHTML = '<option value="">Module...</option>';
   selModule.disabled = true;
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   resetReadme();
   currentExerciseLabel = '';
   currentExerciseBaseUrl = '';

   // vergeet de selectie en toon de standaardbestanden
   Store.remove(LS_SUBJECT);
   Store.remove(LS_MODULE);
   Store.remove(LS_EXERCISE);
   clearHash();
   toonBestanden(Config.defaultBestanden, [], '', [HOOFDBESTAND]);
}

function handleSelSubjectChange() {
   // leeg de lagere keuzelijsten
   selModule.innerHTML = '<option value="">Module...</option>';
   selModule.disabled = true;
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   resetReadme();

   // onthoud het vak en vul de modules
   const subjectId = selSubject.value;
   if (!subjectId) {
      clearHash();
      return;
   }
   Store.set(LS_SUBJECT, subjectId);
   Store.remove(LS_MODULE);
   Store.remove(LS_EXERCISE);
   setHash(subjectId);
   populateModules(subjectId);
}

function handleSelModuleChange() {
   // leeg de oefeningen
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   resetReadme();

   // onthoud de module en vul de oefeningen
   const subjectId = selSubject.value;
   const moduleId = selModule.value;
   if (!subjectId || !moduleId) return;
   Store.set(LS_MODULE, moduleId);
   Store.remove(LS_EXERCISE);
   setHash(subjectId, moduleId);
   populateExercises(subjectId, moduleId);
}

function handleSelExerciseChange() {
   // geen oefening gekozen
   const subjectId = selSubject.value;
   const moduleId = selModule.value;
   const exerciseId = selExercise.value;
   if (!subjectId || !moduleId || !exerciseId) {
      resetReadme();
      return;
   }

   // onthoud de oefening en laad ze
   Store.set(LS_EXERCISE, exerciseId);
   setHash(subjectId, moduleId, exerciseId);
   loadExercise(subjectId, moduleId, exerciseId, true);
}

function handleBtnReadmeClick() {
   if (currentReadme) showReadme();
}

function handleBtnReadmeNewTabClick() {
   if (currentReadme) openReadmeInNewTab();
}

function handleBtnModalCloseClick() {
   closeModal();
}

function handleDocumentKeydown(e) {
   if (e.key === 'Escape') closeModal();
}

function handleDivModalHeaderPointerdown(e) {
   // klikken op de knoppen in de titelbalk mogen niet slepen starten
   if (e.target.closest('.modal__header-actions')) return;

   // onthoud waar in het paneel de muis vastpakt
   const rect = divModalDialog.getBoundingClientRect();
   readmeDragOffsetX = e.clientX - rect.left;
   readmeDragOffsetY = e.clientY - rect.top;
   divModalHeader.setPointerCapture(e.pointerId);
}

function handleDivModalHeaderPointermove(e) {
   if (!divModalHeader.hasPointerCapture(e.pointerId)) return;
   positionReadmePanel(e.clientX - readmeDragOffsetX, e.clientY - readmeDragOffsetY);
}

function handleDivModalHeaderPointerup(e) {
   if (divModalHeader.hasPointerCapture(e.pointerId)) divModalHeader.releasePointerCapture(e.pointerId);
}

// EXPORTS
// =======

/**
 * Initialiseert de exercises-module, met de standaardbestanden zolang er
 * geen oefening geladen is.
 *
 * @param {Function} [bijOefening] - krijgt de gekozen oefening, of null zonder oefening
 */
function init(bijOefening = null) {
   // wie de gekozen oefening wil weten
   oefeningLuisteraar = bijOefening;

   // de standaardbestanden, en wijzigingen in elk bestand automatisch bewaren
   toonBestanden(Config.defaultBestanden, [], '', [HOOFDBESTAND]);
   Bestanden.bijWijziging(scheduleSave);

   // toon kale URL's in de opgave als tekst; enkel [tekst](url) wordt een link
   marked.setOptions({ gfm: false });

   // in de examenbrowser werkt een nieuw tabblad niet
   if (LOCKDOWN_BROWSER_PATTERN.test(navigator.userAgent)) btnReadmeNewTab.classList.add('is-hidden');

   // koppel de keuzelijsten, de opgaveknoppen en het slepen van het opgavepaneel
   divBrand.addEventListener('click', handleDivBrandClick);
   selSubject.addEventListener('change', handleSelSubjectChange);
   selModule.addEventListener('change', handleSelModuleChange);
   selExercise.addEventListener('change', handleSelExerciseChange);
   btnReadme.addEventListener('click', handleBtnReadmeClick);
   btnReadmeNewTab.addEventListener('click', handleBtnReadmeNewTabClick);
   btnModalClose.addEventListener('click', handleBtnModalCloseClick);
   document.addEventListener('keydown', handleDocumentKeydown);
   divModalHeader.addEventListener('pointerdown', handleDivModalHeaderPointerdown);
   divModalHeader.addEventListener('pointermove', handleDivModalHeaderPointermove);
   divModalHeader.addEventListener('pointerup', handleDivModalHeaderPointerup);

   loadIndex();
}

export const Exercises = { init, bewaar };
