/*
 * Bestanden van de geladen oefening
 *
 * Houdt de bestanden van de geladen oefening bij: per tekstbestand een
 * Monaco-model, los van de editors. Een paneel is enkel een editor op zo'n
 * model; sluiten verliest dus niets, en een bestand zonder paneel kan toch
 * gewijzigd worden (herstellen, ZIP). De afbeeldingen in media/ zijn
 * alleen-lezen en hebben geen model.
 *
 * De padregel is dezelfde als op de server (server/services/paden.js).
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Config } from '../config.js';

// DECLARATIES
// ===========

// een segment: letters, cijfers, punt, liggend streepje en underscore, niet beginnend met een punt of _
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// hoogstens één map diep, en een begrensde lengte
const MAX_SEGMENTEN = 2;
const MAX_LENGTE = 100;

// de bewerkbare extensies per map; '' is de hoofdmap
const BEWERKBAAR = {
   '': ['.cs'],
   classes: ['.cs'],
   files: ['.txt', '.csv', '.tsv', '.json'],
};

// de vaste mappen, altijd zichtbaar in de boom, en die waarin de student bestanden kan toevoegen
const VASTE_MAPPEN = ['classes', 'files', 'media'];
const TOEVOEGBAAR = ['classes', 'files'];

// het bestand dat er altijd is; het kan niet hernoemd of verwijderd worden
const HOOFDBESTAND = 'Program.cs';

// welke bestanden afbeeldingen zijn, zoals op de server
const AFBEELDING = /\.(png|jpe?g|gif|svg|webp|ico)$/i;

// de taal van Monaco per extensie
const TALEN = { '.cs': 'csharp', '.txt': 'plaintext', '.csv': 'plaintext', '.tsv': 'plaintext', '.json': 'json' };

// de modellen per pad, in de volgorde van het laden
let modellen = new Map();

// de alleen-lezen bestanden, en waar de bestanden van de oefening op de server staan
let alleenLezenPaden = [];
let baseUrl = '';

// wie verwittigd wordt bij een wijziging
const luisteraars = [];

// FUNCTIES
// ========

/**
 * Geeft de extensie van een pad, in kleine letters.
 *
 * @param {string} pad - bv. classes/Persoon.cs
 * @returns {string} bv. .cs; leeg zonder extensie
 */
function extensieVan(pad) {
   const punt = pad.lastIndexOf('.');
   return punt === -1 ? '' : pad.slice(punt).toLowerCase();
}

/**
 * Zegt of een pad een geldig bewerkbaar bestand is: in de hoofdmap, classes/
 * of files/, met een extensie die bij die map hoort.
 *
 * @param {*} pad - bv. classes/Persoon.cs
 * @returns {boolean}
 */
function isGeldigPad(pad) {
   // tekst van een redelijke lengte
   if (typeof pad !== 'string' || pad.length === 0 || pad.length > MAX_LENGTE) return false;

   // hoogstens één map diep, elk segment volgens de regel
   const segmenten = pad.split('/');
   if (segmenten.length > MAX_SEGMENTEN) return false;
   if (!segmenten.every(segment => SEGMENT.test(segment))) return false;

   // de map moet in de vaste lijst staan, en de extensie erbij horen
   const map = segmenten.length === 1 ? '' : segmenten[0];
   const extensies = BEWERKBAAR[map];
   return Array.isArray(extensies) && extensies.includes(extensieVan(pad));
}

/**
 * Geeft de toegelaten extensies van een map.
 *
 * @param {string} map - '' voor de hoofdmap
 * @returns {Array<string>} bv. ['.cs']; de eerste is de standaard; leeg voor media/
 */
function extensiesVan(map) {
   return [...(BEWERKBAAR[map] ?? [])];
}

/**
 * Geeft de vaste mappen, die altijd in de boom staan.
 *
 * @returns {Array<string>}
 */
function vasteMappen() {
   return [...VASTE_MAPPEN];
}

/**
 * Zegt of de student in een map bestanden kan toevoegen: classes/ en files/,
 * niet de hoofdmap of media/.
 *
 * @param {string} map
 * @returns {boolean}
 */
function isToevoegbaar(map) {
   return TOEVOEGBAAR.includes(map);
}

/**
 * Geeft de taal van Monaco voor een pad, volgens de extensie.
 *
 * @param {string} pad
 * @returns {string} csharp, json of plaintext
 */
function taalVan(pad) {
   return TALEN[extensieVan(pad)] ?? 'plaintext';
}

/**
 * Verwittigt de luisteraars dat een bestand gewijzigd is.
 *
 * @param {string} pad
 */
function verwittig(pad) {
   luisteraars.forEach(luisteraar => luisteraar(pad));
}

/**
 * Maakt het model van één bestand, met zijn wijzigingsmelding.
 *
 * @param {string} pad
 * @param {string} inhoud
 * @returns {object} het Monaco-model
 */
function maakModel(pad, inhoud) {
   // het model, met het pad als URI, en altijd dezelfde inspringing (niet afgeleid uit de inhoud)
   const model = monaco.editor.createModel(inhoud, taalVan(pad), monaco.Uri.parse(`file:///${pad}`));
   model.updateOptions({ tabSize: Config.inspringing, indentSize: Config.inspringing, insertSpaces: true });

   // elke wijziging verwittigt de luisteraars
   function handleModelChange() {
      verwittig(pad);
   }
   model.onDidChangeContent(handleModelChange);

   return model;
}

/**
 * Vervangt de bestanden door die van een andere oefening. De vorige
 * modellen worden vrijgegeven: sluit dus eerst de panelen.
 *
 * @param {object} bestanden - pad → inhoud, in de gewenste volgorde
 * @param {Array<string>} [alleenLezen] - de paden van de alleen-lezen bestanden
 * @param {string} [url] - de map van de oefening op de server, met / achteraan
 */
function laad(bestanden, alleenLezen, url) {
   // de vorige modellen weg
   modellen.forEach(model => model.dispose());

   // de nieuwe, zonder wijzigingsmelding: laden is geen wijziging
   modellen = new Map(Object.keys(bestanden).filter(isGeldigPad).map(pad => [pad, maakModel(pad, bestanden[pad])]));
   alleenLezenPaden = [...(alleenLezen ?? [])];
   baseUrl = url ?? '';
}

/**
 * Geeft de inhoud van alle tekstbestanden.
 *
 * @returns {object} pad → inhoud
 */
function alle() {
   const resultaat = {};
   modellen.forEach((model, pad) => { resultaat[pad] = model.getValue(); });
   return resultaat;
}

/**
 * Zet de inhoud van een bestand; een onbekend bestand komt erbij.
 *
 * @param {string} pad
 * @param {string} tekst
 */
function zet(pad, tekst) {
   if (!isGeldigPad(pad)) return;

   // een bestaand bestand krijgt de nieuwe inhoud
   if (modellen.has(pad)) {
      modellen.get(pad).setValue(tekst);
      return;
   }

   // een nieuw bestand krijgt een model, tenzij het pad enkel in hoofdletters verschilt
   if (bestaat(pad)) return;
   modellen.set(pad, maakModel(pad, tekst));
   verwittig(pad);
}

/**
 * Zegt of er al een bestand met dat pad is, zonder op hoofdletters te letten:
 * Persoon.cs en persoon.cs zouden anders naast elkaar kunnen staan.
 *
 * @param {string} pad
 * @returns {boolean}
 */
function bestaat(pad) {
   const klein = pad.toLowerCase();
   return [...modellen.keys(), ...alleenLezenPaden].some(ander => ander.toLowerCase() === klein);
}

/**
 * Zegt of de student een bestand mag hernoemen of verwijderen: een bewerkbaar
 * bestand, behalve Program.cs.
 *
 * @param {string} pad
 * @returns {boolean}
 */
function isBeheerbaar(pad) {
   return modellen.has(pad) && pad !== HOOFDBESTAND;
}

/**
 * Hernoemt een bestand; de inhoud gaat mee naar een nieuw model. Sluit eerst
 * zijn paneel.
 *
 * @param {string} oud - het huidige pad
 * @param {string} nieuw - het nieuwe pad, geldig en nog niet in gebruik
 * @returns {boolean} true als het hernoemen gelukt is
 */
function hernoem(oud, nieuw) {
   // enkel een beheerbaar bestand, naar een geldig en vrij pad (enkel hoofdletters wijzigen mag)
   if (!isBeheerbaar(oud) || !isGeldigPad(nieuw) || nieuw === HOOFDBESTAND) return false;
   if (bestaat(nieuw) && nieuw.toLowerCase() !== oud.toLowerCase()) return false;

   // de inhoud naar een nieuw model, het oude weg
   const inhoud = modellen.get(oud).getValue();
   modellen.get(oud).dispose();
   modellen.delete(oud);
   modellen.set(nieuw, maakModel(nieuw, inhoud));

   // beide paden zijn gewijzigd
   verwittig(oud);
   verwittig(nieuw);
   return true;
}

/**
 * Verwijdert een bestand. Sluit eerst zijn paneel.
 *
 * @param {string} pad
 * @returns {boolean} true als het verwijderen gelukt is
 */
function verwijder(pad) {
   if (!isBeheerbaar(pad)) return false;
   modellen.get(pad).dispose();
   modellen.delete(pad);
   verwittig(pad);
   return true;
}

/**
 * Geeft de paden van de tekstbestanden.
 *
 * @returns {Array<string>}
 */
function paden() {
   return [...modellen.keys()];
}

/**
 * Geeft de paden van de alleen-lezen bestanden.
 *
 * @returns {Array<string>}
 */
function alleenLezen() {
   return [...alleenLezenPaden];
}

/**
 * Zegt of een pad naar een afbeelding wijst.
 *
 * @param {string} pad
 * @returns {boolean}
 */
function isAfbeelding(pad) {
   return AFBEELDING.test(pad);
}

/**
 * Geeft het adres van een bestand van de oefening op de server, bv. voor
 * een afbeelding.
 *
 * @param {string} pad
 * @returns {string}
 */
function url(pad) {
   return `${baseUrl}${pad.split('/').map(encodeURIComponent).join('/')}`;
}

/**
 * Geeft het model van een bestand.
 *
 * @param {string} pad
 * @returns {object|null}
 */
function model(pad) {
   return modellen.get(pad) ?? null;
}

/**
 * Laat een functie verwittigen bij elke wijziging in een bestand, ook in
 * een bestand zonder paneel.
 *
 * @param {Function} luisteraar - krijgt het pad van het gewijzigde bestand
 */
function bijWijziging(luisteraar) {
   luisteraars.push(luisteraar);
}

// EXPORTS
// =======

export const Bestanden = { HOOFDBESTAND, isGeldigPad, extensiesVan, vasteMappen, isToevoegbaar, taalVan, laad, alle, zet, bestaat, isBeheerbaar, hernoem, verwijder, paden, alleenLezen, isAfbeelding, url, model, bijWijziging };
