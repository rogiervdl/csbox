/*
 * Bestandsbeheer: bestanden toevoegen, hernoemen en verwijderen
 *
 * De student kan een bestand toevoegen in classes/ of files/ (de map die hij
 * in de boom koos), het hernoemen binnen zijn map en het verwijderen, dat
 * laatste na bevestiging. Mappen maken kan niet; Program.cs en de afbeeldingen
 * in media/ liggen vast. Zonder extensie krijgt een naam de standaardextensie
 * van zijn map.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Bestanden } from './bestanden.js';
import { Panelen } from './panelen.js';

// DECLARATIES
// ===========

// de naam van een map in de meldingen; '' is de hoofdmap
const MAPNAMEN = { '': 'de hoofdmap', classes: 'classes/', files: 'files/' };

// een naam die een C#-klasse kan zijn, voor de startcode van een nieuw .cs-bestand
const KLASSENAAM = /^[A-Za-z_][A-Za-z0-9_]*$/;

// het bestand in de dialoog: 'toevoegen' of 'hernoemen', de map, en bij hernoemen het huidige pad
let modus = 'toevoegen';
let huidigeMap = '';
let huidigPad = '';

// het bestand dat op bevestiging van verwijderen wacht
let teVerwijderen = '';

// DOM
const divModalBestand = document.querySelector('#modal-bestand');
const divModalBestandBackdrop = document.querySelector('#modal-bestand .modal__backdrop');
const frmBestand = document.querySelector('#frm-bestand');
const lblTitel = document.querySelector('#lbl-bestand-titel');
const inpNaam = document.querySelector('#inp-bestand-naam');
const lblHint = document.querySelector('#lbl-bestand-hint');
const lblFout = document.querySelector('#lbl-bestand-fout');
const btnOk = document.querySelector('#btn-bestand-ok');
const btnAnnuleren = document.querySelector('#btn-bestand-annuleren');
const divModalVerwijder = document.querySelector('#modal-verwijder');
const divModalVerwijderBackdrop = document.querySelector('#modal-verwijder .modal__backdrop');
const lblVerwijder = document.querySelector('#lbl-verwijder');
const btnVerwijderOk = document.querySelector('#btn-verwijder-ok');
const btnVerwijderAnnuleren = document.querySelector('#btn-verwijder-annuleren');

// FUNCTIES
// ========

/**
 * Splitst een pad in zijn map en zijn naam.
 *
 * @param {string} pad - bv. classes/Persoon.cs
 * @returns {{map: string, naam: string}} '' voor de hoofdmap
 */
function splits(pad) {
   const slash = pad.indexOf('/');
   return slash === -1 ? { map: '', naam: pad } : { map: pad.slice(0, slash), naam: pad.slice(slash + 1) };
}

/**
 * Maakt het pad uit een map en een getypte naam; zonder extensie komt de
 * standaardextensie van de map erbij.
 *
 * @param {string} map - '' voor de hoofdmap
 * @param {string} naam - wat de student typte
 * @returns {string} het pad
 */
function maakPad(map, naam) {
   const volledig = naam.includes('.') ? naam : `${naam}${Bestanden.extensiesVan(map)[0] ?? ''}`;
   return map ? `${map}/${volledig}` : volledig;
}

/**
 * Controleert een nieuw pad en geeft de reden als het niet kan.
 *
 * @param {string} pad - het nieuwe pad
 * @param {string} map - de map, voor de melding
 * @param {string} naam - wat de student typte
 * @returns {string|null} de foutmelding, of null als het pad kan
 */
function controleer(pad, map, naam) {
   // een naam is nodig
   if (!naam) return 'Geef een naam.';

   // de extensie moet bij de map horen, en de naam de vorm volgen
   if (!Bestanden.isGeldigPad(pad)) {
      return `Een naam bestaat uit letters, cijfers, punt, - en _, begint met een letter of cijfer, en eindigt in ${MAPNAMEN[map]} op ${Bestanden.extensiesVan(map).join(', ')}.`;
   }

   // Program.cs ligt vast, en een pad mag nog niet bestaan (enkel hoofdletters wijzigen mag)
   if (pad === Bestanden.HOOFDBESTAND) return `${Bestanden.HOOFDBESTAND} bestaat altijd en kan niet nog eens gemaakt worden.`;
   const isEnkelHoofdletters = modus === 'hernoemen' && pad.toLowerCase() === huidigPad.toLowerCase();
   if (Bestanden.bestaat(pad) && !isEnkelHoofdletters) return `Er is al een bestand ${pad}.`;
   return null;
}

/**
 * Geeft de startcode van een nieuw bestand: een lege klasse met de naam van
 * het bestand voor C#, anders niets.
 *
 * @param {string} pad
 * @returns {string}
 */
function startcode(pad) {
   // enkel C#, met een naam die een klasse kan zijn
   const naam = splits(pad).naam.replace(/\.cs$/, '');
   if (!pad.endsWith('.cs') || !KLASSENAAM.test(naam)) return '';
   return `class ${naam}\n{\n}\n`;
}

/**
 * Toont de toegelaten extensies van de map onder het naamveld.
 */
function toonHint() {
   lblHint.textContent = `Toegelaten in ${MAPNAMEN[huidigeMap]}: ${Bestanden.extensiesVan(huidigeMap).join(', ')}`;
}

/**
 * Toont of verbergt een foutmelding in de dialoog.
 *
 * @param {string|null} melding
 */
function toonFout(melding) {
   lblFout.textContent = melding ?? '';
   lblFout.classList.toggle('is-hidden', !melding);
}

/**
 * Opent de dialoog.
 */
function openDialoog() {
   toonFout(null);
   toonHint();
   divModalBestand.setAttribute('aria-hidden', 'false');
   inpNaam.focus();
}

/**
 * Sluit de dialoog; de focus mag niet in een verborgen dialoog blijven.
 */
function sluitDialoog() {
   if (divModalBestand.contains(document.activeElement)) document.activeElement.blur();
   divModalBestand.setAttribute('aria-hidden', 'true');
}

/**
 * Opent de dialoog om een nieuw bestand toe te voegen in een map.
 *
 * @param {string} map - classes of files; een andere map kan niet
 */
function openToevoegen(map) {
   if (!Bestanden.isToevoegbaar(map)) return;
   modus = 'toevoegen';
   huidigeMap = map;
   huidigPad = '';
   lblTitel.textContent = `Nieuw bestand in ${MAPNAMEN[map]}`;
   btnOk.textContent = 'Toevoegen';
   inpNaam.value = '';
   openDialoog();
}

/**
 * Opent de dialoog om een bestand te hernoemen, binnen zijn map.
 *
 * @param {string} pad
 */
function openHernoemen(pad) {
   if (!Bestanden.isBeheerbaar(pad)) return;

   // de dialoog met de huidige naam
   modus = 'hernoemen';
   huidigeMap = splits(pad).map;
   huidigPad = pad;
   lblTitel.textContent = `${pad} hernoemen`;
   btnOk.textContent = 'Hernoemen';
   inpNaam.value = splits(pad).naam;
   openDialoog();

   // de naam zonder extensie geselecteerd, om meteen te overschrijven
   const punt = inpNaam.value.lastIndexOf('.');
   inpNaam.setSelectionRange(0, punt === -1 ? inpNaam.value.length : punt);
}

/**
 * Vraagt bevestiging om een bestand te verwijderen.
 *
 * @param {string} pad
 */
function vraagVerwijderen(pad) {
   if (!Bestanden.isBeheerbaar(pad)) return;
   teVerwijderen = pad;
   lblVerwijder.textContent = `Wil je ${pad} verwijderen? Dat kan niet ongedaan gemaakt worden.`;
   divModalVerwijder.setAttribute('aria-hidden', 'false');
   btnVerwijderAnnuleren.focus();
}

/**
 * Sluit de bevestiging van verwijderen.
 */
function sluitVerwijderen() {
   if (divModalVerwijder.contains(document.activeElement)) document.activeElement.blur();
   divModalVerwijder.setAttribute('aria-hidden', 'true');
   teVerwijderen = '';
}

/**
 * Initialiseert het bestandsbeheer: de knoppen van de dialogen.
 */
function init() {
   frmBestand.addEventListener('submit', handleFrmBestandSubmit);
   btnAnnuleren.addEventListener('click', sluitDialoog);
   divModalBestandBackdrop.addEventListener('click', sluitDialoog);
   btnVerwijderOk.addEventListener('click', handleBtnVerwijderOkClick);
   btnVerwijderAnnuleren.addEventListener('click', sluitVerwijderen);
   divModalVerwijderBackdrop.addEventListener('click', sluitVerwijderen);
   document.addEventListener('keydown', handleDocumentKeydown);
}

// event handlers

function handleFrmBestandSubmit(e) {
   e.preventDefault();

   // het nieuwe pad, gecontroleerd
   const naam = inpNaam.value.trim();
   const pad = maakPad(huidigeMap, naam);
   const fout = controleer(pad, huidigeMap, naam);
   if (fout) {
      toonFout(fout);
      return;
   }

   // toevoegen: met startcode, meteen in een paneel
   sluitDialoog();
   if (modus === 'toevoegen') {
      Bestanden.zet(pad, startcode(pad));
      Panelen.open(pad);
      return;
   }

   // hernoemen: het paneel gaat dicht en opent weer met het nieuwe pad
   const wasOpen = Panelen.openPaden().includes(huidigPad);
   Panelen.sluit(huidigPad);
   if (Bestanden.hernoem(huidigPad, pad) && wasOpen) Panelen.open(pad);
}

function handleBtnVerwijderOkClick() {
   // eerst het paneel dicht: zijn editor gebruikt het model
   const pad = teVerwijderen;
   sluitVerwijderen();
   Panelen.sluit(pad);
   Bestanden.verwijder(pad);
}

function handleDocumentKeydown(e) {
   if (e.key !== 'Escape') return;
   sluitDialoog();
   sluitVerwijderen();
}

// EXPORTS
// =======

export const Bestandsbeheer = { init, openToevoegen, openHernoemen, vraagVerwijderen };
