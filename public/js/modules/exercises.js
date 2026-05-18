/*
 * Exercises module — startcode picker & opgave overlay
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Config } from '../config.js';

// DECLARATIES
// ===========

let editor = null;
let subjectsData = [];
let currentOpgave = '';
let currentExerciseLabel = '';
let currentExerciseBaseUrl = '';

const LS_SUBJECT     = 'csbox-subject';
const LS_MODULE      = 'csbox-module';
const LS_EXERCISE    = 'csbox-exercise';
const LS_CODE_PREFIX = 'csbox-code';
const SAVE_DELAY_MS  = 1000;

let saveTimeout = null;
let isLoading = false;

// DOM
const selSubject          = document.querySelector('#select-subject');
const selModule           = document.querySelector('#select-module');
const selExercise         = document.querySelector('#select-exercise');
const btnOpgave           = document.querySelector('#btn-opgave');
const btnOpgaveNewTab     = document.querySelector('#btn-opgave-newtab');
const btnModalClose       = document.querySelector('#btn-modal-close');
const divModal            = document.querySelector('#modal-opgave');
const divModalBody        = document.querySelector('#modal-opgave-body');
const divModalBackdrop    = document.querySelector('#modal-opgave .modal__backdrop');
const divBrand            = document.querySelector('.toolbar__brand');
const divModalConfirm         = document.querySelector('#modal-confirm');
const btnConfirmBewaarde      = document.querySelector('#btn-confirm-bewaarde');
const btnConfirmStartcode     = document.querySelector('#btn-confirm-startcode');
const divModalConfirmBackdrop = document.querySelector('#modal-confirm .modal__backdrop');

// FUNCTIES
// ========

/**
 * Laadt en parseert startcodes/index.json5.
 */
async function loadIndex() {
   try {
      const response = await fetch('startcodes/index.json5');
      if (!response.ok) return;
      const text = await response.text();
      subjectsData = JSON5.parse(text).subjects;
      populateSubjects();
      restoreSelection();
   } catch (e) {
      console.warn('Exercises: kon index.json5 niet laden', e);
   }
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
   const subject = subjectsData.find(s => s.id === subjectId);
   if (!subject) return;
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
   const subject = subjectsData.find(s => s.id === subjectId);
   const mod = subject?.modules.find(m => m.id === moduleId);
   if (!mod) return;
   mod.exercises
      .filter(exercise => !exercise.hidden)
      .forEach(exercise => {
         const option = document.createElement('option');
         option.value = exercise.id;
         option.textContent = exercise.label;
         selExercise.appendChild(option);
      });
   selExercise.disabled = false;
}

/**
 * Laadt de startcode en opgave voor de geselecteerde oefening.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 * @param {string} exerciseId
 * @param {boolean} confirmIfSaved
 */
async function loadExercise(subjectId, moduleId, exerciseId, confirmIfSaved = false) {
   const base = `startcodes/${subjectId}/${moduleId}/${exerciseId}/`;
   currentExerciseBaseUrl = base;
   currentOpgave = '';
   btnOpgave.disabled = true;
   btnOpgave.title = 'geen opgave gegeven';
   btnOpgaveNewTab.disabled = true;

   const subject  = subjectsData.find(s => s.id === subjectId);
   const mod      = subject?.modules.find(m => m.id === moduleId);
   const exercise = mod?.exercises.find(e => e.id === exerciseId);
   currentExerciseLabel = exercise?.label ?? '';

   const hasSaved = localStorage.getItem(codeKey(subjectId, moduleId, exerciseId)) !== null;

   // bevestigingsdialoog eerst: de knop-klik dient als user gesture voor PiP
   const useSaved = hasSaved && confirmIfSaved ? await confirmRestore() : hasSaved;

   // PiP aanvragen na bevestiging, terwijl we nog in de user gesture context zitten
   const pipWindow = await requestPipWindow();

   const [cs, opgave] = await Promise.all([
      fetchText(`${base}Program.cs`),
      fetchText(`${base}opgave.md`),
   ]);

   isLoading = true;
   editor.setValue(
      (useSaved ? localStorage.getItem(codeKey(subjectId, moduleId, exerciseId)) : null) ?? cs ?? ''
   );
   isLoading = false;

   // guard tegen race condition: selectie kan veranderd zijn tijdens fetch
   if (selSubject.value !== subjectId || selModule.value !== moduleId || selExercise.value !== exerciseId) return;

   if (opgave !== null) {
      currentOpgave = opgave;
      btnOpgave.disabled = false;
      btnOpgave.title = 'Toon opgave';
      btnOpgaveNewTab.disabled = false;
      if (pipWindow) {
         fillPipWindow(pipWindow);
      } else {
         showOpgave();
      }
   }
}

/**
 * Haalt tekst op via fetch. Geeft null terug bij 404 of fout.
 *
 * @param {string} url
 * @returns {Promise<string|null>}
 */
async function fetchText(url) {
   try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.text();
   } catch (e) {
      return null;
   }
}

/**
 * Vraagt een nieuw PiP-venster aan. Geeft null terug als PiP niet beschikbaar is.
 *
 * @returns {Promise<Window|null>}
 */
async function requestPipWindow() {
   if (!window.documentPictureInPicture) return null;
   try {
      return await window.documentPictureInPicture.requestWindow({ width: 600, height: 500, disallowReturnToOpener: true });
   } catch (e) {
      return null;
   }
}

/**
 * Vult een PiP-venster met de opgave van de huidige oefening.
 *
 * @param {Window} pipWindow
 */
function fillPipWindow(pipWindow) {
   const absBase = new URL(currentExerciseBaseUrl, window.location.href).href;
   pipWindow.document.title = currentExerciseLabel;
   pipWindow.document.head.innerHTML = `<style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #1e1e1e; color: #ccc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.7; overflow-y: auto; padding: 20px 24px; }
      h1 { font-size: 18px; font-weight: 600; margin-bottom: 16px; }
      h2 { font-size: 16px; margin-bottom: 10px; margin-top: 20px; }
      h3 { font-size: 14px; margin-bottom: 8px; margin-top: 16px; }
      p { margin-bottom: 10px; }
      ul, ol { margin-bottom: 10px; padding-left: 22px; }
      li { margin-bottom: 3px; }
      code { background: rgba(255 255 255 / 10%); border-radius: 3px; font-family: Consolas, monospace; font-size: 12px; padding: 1px 5px; }
      pre { background: rgba(255 255 255 / 6%); border-radius: 4px; margin-bottom: 10px; overflow-x: auto; padding: 12px; }
      pre code { background: none; padding: 0; }
      img { border-radius: 4px; max-width: 100%; }
      strong { font-weight: 600; }
   </style><base href="${absBase}">`;
   pipWindow.document.body.innerHTML = `<h1>${currentExerciseLabel}</h1>${marked.parse(currentOpgave)}`;
   fixImagePaths(pipWindow.document.body, absBase);
}

/**
 * Opent de opgave in PiP, of in de modal als PiP niet beschikbaar is.
 */
async function openOpgaveInPiP() {
   const pipWindow = await requestPipWindow();
   if (pipWindow) {
      fillPipWindow(pipWindow);
   } else {
      showOpgave();
   }
}

/**
 * Rendert de opgave als HTML en toont de modal.
 */
function showOpgave() {
   document.querySelector('.modal__title').textContent = `Opgave — ${currentExerciseLabel}`;
   divModalBody.innerHTML = marked.parse(currentOpgave);
   fixImagePaths(divModalBody);
   divModal.setAttribute('aria-hidden', 'false');
}

/**
 * Zet relatieve afbeeldingspaden om naar absolute paden.
 *
 * @param {HTMLElement} container
 * @param {string} [base]
 */
function fixImagePaths(container, base) {
   const resolvedBase = base ?? currentExerciseBaseUrl;
   container.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('/')) {
         img.src = `${resolvedBase}${src}`;
      }
   });
}

/**
 * Opent de opgave als HTML-pagina in een nieuw tabblad.
 */
function openOpgaveInNewTab() {
   const absBase = new URL(currentExerciseBaseUrl, window.location.href).href;
   const html = `<!DOCTYPE html>
<html lang="nl">
<head>
   <meta charset="UTF-8">
   <title>${currentExerciseLabel}</title>
   <base href="${absBase}">
   <style>
      body { color: #1e1e1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.7; margin: 0 auto; max-width: 780px; padding: 40px 24px; }
      h1 { font-size: 24px; margin-bottom: 12px; margin-top: 0; }
      h2 { font-size: 20px; margin-top: 32px; }
      h3 { font-size: 17px; margin-top: 24px; }
      p { margin-bottom: 12px; }
      ul, ol { margin-bottom: 12px; padding-left: 28px; }
      li { margin-bottom: 4px; }
      code { background: #f0f0f0; border-radius: 3px; font-family: Consolas, monospace; font-size: 13px; padding: 2px 5px; }
      pre { background: #f6f8fa; border-radius: 6px; font-size: 13px; overflow-x: auto; padding: 16px; }
      pre code { background: none; padding: 0; }
      img { border-radius: 4px; max-width: 100%; }
      strong { font-weight: 600; }
   </style>
</head>
<body>
<h1>${currentExerciseLabel}</h1>
${marked.parse(currentOpgave)}
</body>
</html>`;
   const blob = new Blob([html], { type: 'text/html' });
   const url = URL.createObjectURL(blob);
   window.open(url, '_blank');
   setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/**
 * Verbergt de modal.
 */
function closeModal() {
   divModal.setAttribute('aria-hidden', 'true');
}

/**
 * Parseert de URL-hash naar een selectie-object.
 *
 * @returns {{ subjectId: string, moduleId: string, exerciseId: string }|null}
 */
function getHashSelection() {
   const hash = location.hash.slice(1);
   if (!hash) return null;
   const parts = hash.split('/');
   if (parts.length < 1 || parts.length > 3) return null;
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
 * Bouwt de localStorage-sleutel voor de editorinhoud van een oefening.
 *
 * @param {string} subjectId
 * @param {string} moduleId
 * @param {string} exerciseId
 * @returns {string}
 */
function codeKey(subjectId, moduleId, exerciseId) {
   return `${LS_CODE_PREFIX}/${subjectId}/${moduleId}/${exerciseId}/cs`;
}

/**
 * Slaat de huidige editorinhoud op in localStorage.
 */
function saveCode() {
   const subjectId  = selSubject.value;
   const moduleId   = selModule.value;
   const exerciseId = selExercise.value;
   if (!subjectId || !moduleId || !exerciseId) return;
   localStorage.setItem(codeKey(subjectId, moduleId, exerciseId), editor.getValue());
}

/**
 * Toont een dialoogvenster en vraagt of de bewaarde versie geladen moet worden.
 *
 * @returns {Promise<boolean>}
 */
function confirmRestore() {
   return new Promise(resolve => {
      divModalConfirm.setAttribute('aria-hidden', 'false');

      function finish(useSaved) {
         divModalConfirm.setAttribute('aria-hidden', 'true');
         btnConfirmBewaarde.removeEventListener('click', onBewaarde);
         btnConfirmStartcode.removeEventListener('click', onStartcode);
         divModalConfirmBackdrop.removeEventListener('click', onBackdrop);
         resolve(useSaved);
      }

      function onBewaarde() { finish(true); }
      function onStartcode() { finish(false); }
      function onBackdrop() { finish(true); }

      btnConfirmBewaarde.addEventListener('click', onBewaarde);
      btnConfirmStartcode.addEventListener('click', onStartcode);
      divModalConfirmBackdrop.addEventListener('click', onBackdrop);
   });
}

/**
 * Plant een debounced opslaan in (1s na de laatste wijziging).
 */
function scheduleSave() {
   if (isLoading) return;
   clearTimeout(saveTimeout);
   saveTimeout = setTimeout(saveCode, SAVE_DELAY_MS);
}

/**
 * Herstelt de laatste selectie vanuit de URL-hash of localStorage.
 */
function restoreSelection() {
   const fromHash = getHashSelection();
   const savedSubject = fromHash?.subjectId ?? localStorage.getItem(LS_SUBJECT);
   if (!savedSubject) return;
   selSubject.value = savedSubject;
   if (selSubject.value !== savedSubject) return;

   populateModules(savedSubject);
   if (fromHash && !fromHash.moduleId) return;

   const savedModule = fromHash?.moduleId ?? localStorage.getItem(LS_MODULE);
   if (!savedModule) return;
   selModule.value = savedModule;
   if (selModule.value !== savedModule) return;

   populateExercises(savedSubject, savedModule);
   if (fromHash && !fromHash.exerciseId) return;

   const savedExercise = fromHash?.exerciseId ?? localStorage.getItem(LS_EXERCISE);
   if (!savedExercise) return;
   selExercise.value = savedExercise;
   if (selExercise.value !== savedExercise) return;

   loadExercise(savedSubject, savedModule, savedExercise);
}

// event handlers

function handleDivBrandClick() {
   selSubject.value = '';
   selModule.innerHTML = '<option value="">Module...</option>';
   selModule.disabled = true;
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   btnOpgave.disabled = true;
   btnOpgave.title = 'geen opgave gegeven';
   btnOpgaveNewTab.disabled = true;
   currentOpgave = '';
   currentExerciseLabel = '';
   currentExerciseBaseUrl = '';
   localStorage.removeItem(LS_SUBJECT);
   localStorage.removeItem(LS_MODULE);
   localStorage.removeItem(LS_EXERCISE);
   clearHash();
   editor.setValue(Config.defaultCode);
}

function handleSelSubjectChange() {
   selModule.innerHTML = '<option value="">Module...</option>';
   selModule.disabled = true;
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   btnOpgave.disabled = true;
   btnOpgaveNewTab.disabled = true;
   currentOpgave = '';

   const subjectId = selSubject.value;
   if (!subjectId) {
      clearHash();
      return;
   }
   localStorage.setItem(LS_SUBJECT, subjectId);
   localStorage.removeItem(LS_MODULE);
   localStorage.removeItem(LS_EXERCISE);
   setHash(subjectId);
   populateModules(subjectId);
}

function handleSelModuleChange() {
   selExercise.innerHTML = '<option value="">Oefening...</option>';
   selExercise.disabled = true;
   btnOpgave.disabled = true;
   btnOpgaveNewTab.disabled = true;
   currentOpgave = '';

   const subjectId = selSubject.value;
   const moduleId  = selModule.value;
   if (!subjectId || !moduleId) return;
   localStorage.setItem(LS_MODULE, moduleId);
   localStorage.removeItem(LS_EXERCISE);
   setHash(subjectId, moduleId);
   populateExercises(subjectId, moduleId);
}

function handleSelExerciseChange() {
   const subjectId  = selSubject.value;
   const moduleId   = selModule.value;
   const exerciseId = selExercise.value;
   if (!subjectId || !moduleId || !exerciseId) {
      btnOpgave.disabled = true;
      btnOpgaveNewTab.disabled = true;
      currentOpgave = '';
      return;
   }
   localStorage.setItem(LS_EXERCISE, exerciseId);
   setHash(subjectId, moduleId, exerciseId);
   loadExercise(subjectId, moduleId, exerciseId, true);
}

function handleBtnOpgaveClick() {
   if (currentOpgave) openOpgaveInPiP();
}

function handleBtnOpgaveNewTabClick() {
   if (currentOpgave) openOpgaveInNewTab();
}

function handleBtnModalCloseClick() {
   closeModal();
}

function handleDivModalBackdropClick() {
   closeModal();
}

function handleDocumentKeydown(e) {
   if (e.key === 'Escape') closeModal();
}

// EXPORTS
// =======

/**
 * Initialiseert de exercises-module met de Monaco-editor.
 *
 * @param {object} editorInstance - Monaco editor instantie
 */
function init(editorInstance) {
   editor = editorInstance;

   editor.onDidChangeModelContent(scheduleSave);

   divBrand.addEventListener('click', handleDivBrandClick);
   selSubject.addEventListener('change', handleSelSubjectChange);
   selModule.addEventListener('change', handleSelModuleChange);
   selExercise.addEventListener('change', handleSelExerciseChange);
   btnOpgave.addEventListener('click', handleBtnOpgaveClick);
   btnOpgaveNewTab.addEventListener('click', handleBtnOpgaveNewTabClick);
   btnModalClose.addEventListener('click', handleBtnModalCloseClick);
   divModalBackdrop.addEventListener('click', handleDivModalBackdropClick);
   document.addEventListener('keydown', handleDocumentKeydown);

   loadIndex();
}

export const Exercises = { init };
