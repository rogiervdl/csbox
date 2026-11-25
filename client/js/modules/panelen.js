/*
 * Panelen in het editorgebied
 *
 * Per geopend bestand een paneel: een kop met het pad, een formatteerknop (enkel
 * voor C#), een kopieerknop en een kruisje, en daaronder een eigen
 * Monaco-editor op het model uit Bestanden. Een afbeelding krijgt een paneel
 * zonder editor. Een bestand staat in hoogstens één paneel; tussen twee
 * panelen staat een versleepbare grens.
 *
 * Een paneel sluiten ruimt enkel de editor op, niet het model: de inhoud en
 * de undo-geschiedenis blijven. Modules die iets per editor instellen
 * (sneltoetsen) doen dat via bijNieuweEditor, omdat editors komen en gaan.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Config } from '../config.js';
import { Bestanden } from './bestanden.js';
import { Clipboard } from './clipboard.js';
import { Resizer } from './resizer.js';

// DECLARATIES
// ===========

// de panelen per pad: { element, editor } (editor is null bij een afbeelding)
const panelen = new Map();

// wie verwittigd wordt bij een nieuwe editor, en bij een paneel dat opengaat of sluit
const editorLuisteraars = [];
const veranderingsLuisteraars = [];

// DOM
const divEditors = document.querySelector('#editors-panel');
const tplPaneel = document.querySelector('#tpl-paneel');
const lblGeenPanelen = document.querySelector('#lbl-geen-panelen');

// FUNCTIES
// ========

/**
 * Herberekent de afmetingen van alle editors, bv. na het verslepen van een
 * grens of het wisselen van layout.
 */
function herschik() {
   panelen.forEach(paneel => paneel.editor?.layout());
}

/**
 * Verwittigt wie wil weten welke panelen open zijn.
 */
function verwittig() {
   veranderingsLuisteraars.forEach(luisteraar => luisteraar(openPaden()));
}

/**
 * Zet de grenzen tussen de panelen opnieuw, na het openen of sluiten van
 * een paneel, en toont de uitleg als er geen paneel meer open is.
 */
function herbouwGrenzen() {
   // de oude grenzen weg, en elk paneel zijn standaardgrootte
   divEditors.querySelectorAll('.resizer').forEach(grens => grens.remove());
   const elementen = [...panelen.values()].map(paneel => paneel.element);
   elementen.forEach(element => { element.style.flex = ''; });

   // een grens tussen elk paar opeenvolgende panelen
   for (let i = 1; i < elementen.length; i++) {
      const grens = document.createElement('div');
      grens.className = 'resizer resizer--paneel';
      elementen[i].before(grens);
      Resizer.koppelPanelen(grens, elementen[i - 1], elementen[i]);
   }

   // de uitleg zonder panelen
   lblGeenPanelen.classList.toggle('is-hidden', elementen.length > 0);
   herschik();
}

/**
 * Maakt de editor van een tekstbestand in een paneel.
 *
 * @param {HTMLElement} romp - het element waarin de editor komt
 * @param {string} pad
 * @returns {object} de Monaco-editor
 */
function maakEditor(romp, pad) {
   const editor = monaco.editor.create(romp, { ...Config.editor, model: Bestanden.model(pad) });
   editorLuisteraars.forEach(luisteraar => luisteraar(editor, pad));
   return editor;
}

/**
 * Maakt de afbeelding in een paneel, met haar afmetingen in de kop.
 *
 * @param {HTMLElement} romp - het element waarin de afbeelding komt
 * @param {HTMLElement} lblPad - de kop, voor de afmetingen
 * @param {string} pad
 */
function maakAfbeelding(romp, lblPad, pad) {
   // de afmetingen zodra de afbeelding geladen is
   const img = document.createElement('img');
   function handleImgLoad() {
      lblPad.textContent = `${pad} — ${img.naturalWidth} × ${img.naturalHeight}`;
   }
   img.addEventListener('load', handleImgLoad);

   // de afbeelding van de server
   img.className = 'editor-pane__afbeelding';
   img.alt = pad;
   img.src = Bestanden.url(pad);
   romp.classList.add('editor-pane__body--afbeelding');
   romp.append(img);
}

/**
 * Koppelt de knoppen in de kop van een paneel. Een afbeelding heeft geen
 * formatteer- of kopieerknop; enkel C# kan geformatteerd worden.
 *
 * @param {HTMLElement} element - het paneel
 * @param {object|null} editor - de editor, of null bij een afbeelding
 * @param {string} pad
 */
function koppelKnoppen(element, editor, pad) {
   const btnFormat = element.querySelector('.btn-format');
   const btnKopieer = element.querySelector('.btn-copy');
   const btnSluit = element.querySelector('.btn-close-pane');

   // sluiten kan altijd
   function handleBtnSluitClick() {
      sluit(pad);
   }
   btnSluit.addEventListener('click', handleBtnSluitClick);

   // formatteren enkel voor C#
   if (editor && Bestanden.taalVan(pad) === 'csharp') {
      function handleBtnFormatClick() {
         editor.getAction('editor.action.formatDocument').run();
      }
      btnFormat.addEventListener('click', handleBtnFormatClick);
   } else {
      btnFormat.remove();
   }

   // kopiëren enkel met een editor
   if (editor) {
      function handleBtnKopieerClick(e) {
         Clipboard.kopieer(editor, e.currentTarget);
      }
      btnKopieer.addEventListener('click', handleBtnKopieerClick);
   } else {
      btnKopieer.remove();
   }
}

/**
 * Opent een bestand in een nieuw paneel achteraan. Staat het al open, dan
 * krijgt dat paneel de focus.
 *
 * @param {string} pad
 * @returns {object|null} de editor van het paneel, of null (afbeelding of onbekend bestand)
 */
function open(pad) {
   // al open: enkel de focus
   if (panelen.has(pad)) {
      const paneel = panelen.get(pad);
      if (paneel.editor) paneel.editor.focus();
      else paneel.element.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      return paneel.editor;
   }

   // een tekstbestand moet bestaan, een afbeelding moet bij de oefening horen
   const isAlleenLezen = Bestanden.alleenLezen().includes(pad);
   if (!isAlleenLezen && !Bestanden.model(pad)) return null;

   // het paneel uit de template, achteraan
   const element = tplPaneel.content.firstElementChild.cloneNode(true);
   const lblPad = element.querySelector('.editor-pane__label');
   const romp = element.querySelector('.editor-pane__body');
   lblPad.textContent = pad;
   lblPad.title = pad;
   divEditors.append(element);

   // de inhoud: een editor of een afbeelding, met de knoppen die erbij horen
   const editor = isAlleenLezen ? null : maakEditor(romp, pad);
   if (isAlleenLezen) maakAfbeelding(romp, lblPad, pad);
   koppelKnoppen(element, editor, pad);
   panelen.set(pad, { element, editor });

   // de grenzen en wie het wil weten
   herbouwGrenzen();
   verwittig();
   return editor;
}

/**
 * Opent een bestand en zet de cursor op een regel en kolom, bv. bij een fout.
 *
 * @param {string} pad
 * @param {number} regel - vanaf 1
 * @param {number} kolom - vanaf 1
 */
function toonPositie(pad, regel, kolom) {
   // open het bestand; een afbeelding of onbekend bestand heeft geen positie
   const editor = open(pad);
   if (!editor || !regel) return;

   // de cursor op de positie, in beeld, met de focus
   const positie = { lineNumber: regel, column: kolom || 1 };
   editor.setPosition(positie);
   editor.revealPositionInCenter(positie);
   editor.focus();
}

/**
 * Sluit het paneel van een bestand. De inhoud blijft in Bestanden.
 *
 * @param {string} pad
 */
function sluit(pad) {
   const paneel = panelen.get(pad);
   if (!paneel) return;

   // de editor opruimen, niet het model
   if (paneel.editor) paneel.editor.dispose();
   paneel.element.remove();
   panelen.delete(pad);

   // de grenzen en wie het wil weten
   herbouwGrenzen();
   verwittig();
}

/**
 * Sluit alle panelen, bv. vóór een andere oefening geladen wordt.
 */
function sluitAlle() {
   [...panelen.keys()].forEach(sluit);
}

/**
 * Geeft de paden van de open panelen, in hun volgorde.
 *
 * @returns {Array<string>}
 */
function openPaden() {
   return [...panelen.keys()];
}

/**
 * Laat een functie iets instellen op elke editor, ook op de editors die
 * al open zijn.
 *
 * @param {Function} luisteraar - krijgt de editor en het pad van zijn bestand
 */
function bijNieuweEditor(luisteraar) {
   editorLuisteraars.push(luisteraar);
   panelen.forEach((paneel, pad) => { if (paneel.editor) luisteraar(paneel.editor, pad); });
}

/**
 * Laat een functie verwittigen als een paneel opengaat of sluit.
 *
 * @param {Function} luisteraar - krijgt de paden van de open panelen
 */
function bijVerandering(luisteraar) {
   veranderingsLuisteraars.push(luisteraar);
}

// EXPORTS
// =======

export const Panelen = { open, toonPositie, sluit, sluitAlle, openPaden, herschik, bijNieuweEditor, bijVerandering };
