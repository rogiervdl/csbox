/*
 * Bestandsbrowser
 *
 * Toont de bestanden van de oefening als boom: mappen eerst, daarna
 * bestanden, alfabetisch. Een klik op een bestand opent het in een paneel, ook
 * een afbeelding; de geopende bestanden zijn gemarkeerd. Mappen klappen open
 * en dicht, en de browser zelf klapt in tot een smalle strook. De vaste mappen
 * staan er altijd. Een klik op een map kiest ze; de + in de kop voegt een
 * bestand toe in de gekozen map (enkel classes/ en files/). Naast elk
 * beheerbaar bestand staan knoppen om het te hernoemen of te verwijderen (zie
 * Bestandsbeheer).
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Bestanden } from './bestanden.js';
import { Panelen } from './panelen.js';
import { Bestandsbeheer } from './bestandsbeheer.js';

// DECLARATIES
// ===========

// de mappen die de student dichtklapte in de geladen oefening
const dichteMappen = new Set();

// het icoon van een open en een dichte map, een afbeelding en een ander bestand
const ICOON_OPEN = 'img/icon-folder-open.svg';
const ICOON_DICHT = 'img/icon-folder.svg';
const ICOON_AFBEELDING = 'img/icon-image.svg';
const ICOON_BESTAND = 'img/icon-file.svg';

// de knoppen naast een beheerbaar bestand: actie, icoon en uitleg
const ACTIES = [
   { actie: 'hernoemen', icoon: 'img/icon-rename.svg', titel: 'Hernoem' },
   { actie: 'verwijderen', icoon: 'img/icon-trash.svg', titel: 'Verwijder' },
];

// de paden die nu in de boom staan
let getoond = [];

// de geselecteerde map, waarin de + een bestand toevoegt; leeg zonder selectie
let gekozenMap = '';

// DOM
const pnlBrowser = document.querySelector('#bestandsbrowser');
const btnInklappen = document.querySelector('#btn-bestandsbrowser');
const btnNieuw = document.querySelector('#btn-bestand-nieuw');
const lstBestanden = document.querySelector('#lst-bestanden');

// FUNCTIES
// ========

/**
 * Zet een lijst paden om in een boom. De vaste mappen staan er altijd in,
 * ook als ze leeg zijn.
 *
 * @param {Array<string>} paden - bv. ["Program.cs", "classes/Persoon.cs"]
 * @returns {{mappen: Map<string, object>, bestanden: Array<string>}} de boom; elke map heeft dezelfde vorm
 */
function bouwBoom(paden) {
   // de wortel met de vaste mappen
   const wortel = { mappen: new Map(), bestanden: [] };
   Bestanden.vasteMappen().forEach(map => wortel.mappen.set(map, { mappen: new Map(), bestanden: [] }));

   // daal per pad af tot de map van het bestand, en maak onderweg de mappen aan
   paden.forEach(pad => {
      let knoop = wortel;
      pad.split('/').slice(0, -1).forEach(segment => {
         if (!knoop.mappen.has(segment)) knoop.mappen.set(segment, { mappen: new Map(), bestanden: [] });
         knoop = knoop.mappen.get(segment);
      });
      knoop.bestanden.push(pad);
   });

   return wortel;
}

/**
 * Maakt de knop van één bestand.
 *
 * @param {string} pad
 * @returns {HTMLLIElement}
 */
function maakBestand(pad) {
   // het icoon
   const icoon = document.createElement('img');
   icoon.className = 'bestandsboom__icoon';
   icoon.src = Bestanden.isAfbeelding(pad) ? ICOON_AFBEELDING : ICOON_BESTAND;
   icoon.alt = '';

   // de knop met de naam
   const btn = document.createElement('button');
   btn.className = 'bestandsboom__bestand';
   btn.type = 'button';
   btn.title = pad;
   btn.dataset.pad = pad;
   btn.append(icoon, pad.slice(pad.lastIndexOf('/') + 1));

   // in een lijstitem, met de knoppen om te hernoemen en te verwijderen als dat mag
   const li = document.createElement('li');
   li.className = 'bestandsboom__item';
   li.append(btn);
   if (Bestanden.isBeheerbaar(pad)) li.append(maakActies(pad));
   return li;
}

/**
 * Maakt de knoppen om een bestand te hernoemen en te verwijderen.
 *
 * @param {string} pad
 * @returns {HTMLSpanElement}
 */
function maakActies(pad) {
   const span = document.createElement('span');
   span.className = 'bestandsboom__acties';

   // een knop per actie, met een icoon
   ACTIES.forEach(item => {
      const icoon = document.createElement('img');
      icoon.src = item.icoon;
      icoon.alt = '';
      const btn = document.createElement('button');
      btn.className = 'bestandsboom__actie';
      btn.type = 'button';
      btn.title = `${item.titel} ${pad}`;
      btn.setAttribute('aria-label', `${item.titel} ${pad}`);
      btn.dataset.actie = item.actie;
      btn.dataset.doel = pad;
      btn.append(icoon);
      span.append(btn);
   });
   return span;
}

/**
 * Maakt het lijstitem van één map, met haar inhoud.
 *
 * @param {object} knoop - de map, zie bouwBoom
 * @param {string} naam - de naam van de map
 * @param {string} mapPad - het pad van de map, met / achteraan
 * @returns {HTMLLIElement}
 */
function maakMap(knoop, naam, mapPad) {
   // het icoon, open of dicht
   const isDicht = dichteMappen.has(mapPad);
   const icoon = document.createElement('img');
   icoon.className = 'bestandsboom__icoon bestandsboom__icoon--map';
   icoon.src = isDicht ? ICOON_DICHT : ICOON_OPEN;
   icoon.alt = '';

   // de knop met de naam
   const btn = document.createElement('button');
   btn.className = 'bestandsboom__mapnaam';
   btn.type = 'button';
   btn.dataset.map = mapPad;
   btn.setAttribute('aria-expanded', String(!isDicht));
   btn.append(icoon, naam);

   // de inhoud in een eigen lijst
   const ul = document.createElement('ul');
   ul.append(...maakItems(knoop, mapPad));

   // in een lijstitem, gemarkeerd als het de gekozen map is
   const li = document.createElement('li');
   li.className = 'bestandsboom__map';
   li.classList.toggle('is-dicht', isDicht);
   btn.classList.toggle('is-gekozen', mapPad === `${gekozenMap}/`);
   li.append(btn, ul);
   return li;
}

/**
 * Kiest de map waarin de + een bestand toevoegt, markeert ze en zet de + aan
 * of uit: enkel in classes/ en files/ kan een bestand bij.
 *
 * @param {string} map - de naam van de map; leeg om niets te kiezen
 */
function kiesMap(map) {
   // markeer de gekozen map
   gekozenMap = map;
   lstBestanden.querySelectorAll('.bestandsboom__mapnaam').forEach(btn => {
      btn.classList.toggle('is-gekozen', btn.dataset.map === `${map}/`);
   });

   // de + met een uitleg
   const kan = Bestanden.isToevoegbaar(map);
   btnNieuw.disabled = !kan;
   btnNieuw.title = kan ? `Nieuw bestand in ${map}/` : 'Kies eerst een map: classes of files';
}

/**
 * Maakt de lijst van één map: eerst de submappen, dan de bestanden.
 *
 * @param {object} knoop - zie bouwBoom
 * @param {string} pad - het pad van de map, met / achteraan; leeg voor de wortel
 * @returns {Array<HTMLLIElement>}
 */
function maakItems(knoop, pad) {
   const mappen = [...knoop.mappen.keys()].sort().map(naam => maakMap(knoop.mappen.get(naam), naam, `${pad}${naam}/`));
   const bestanden = [...knoop.bestanden].sort().map(maakBestand);
   return [...mappen, ...bestanden];
}

/**
 * Markeert de bestanden die in een paneel open staan.
 *
 * @param {Array<string>} openPaden
 */
function markeer(openPaden) {
   lstBestanden.querySelectorAll('.bestandsboom__bestand').forEach(btn => {
      btn.classList.toggle('is-open', openPaden.includes(btn.dataset.pad));
   });
}

/**
 * Tekent de boom opnieuw met alle bestanden van de oefening. Na het laden
 * van een oefening staan alle mappen open en is er geen map gekozen.
 *
 * @param {boolean} [isNieuweOefening] - true als er net een oefening geladen is
 */
function herbouw(isNieuweOefening = false) {
   // een nieuwe oefening begint met open mappen, zonder keuze
   if (isNieuweOefening) {
      dichteMappen.clear();
      gekozenMap = '';
   }

   // de boom, de open bestanden en de gekozen map
   getoond = [...Bestanden.paden(), ...Bestanden.alleenLezen()];
   lstBestanden.replaceChildren(...maakItems(bouwBoom(getoond), ''));
   markeer(Panelen.openPaden());
   kiesMap(gekozenMap);
}

/**
 * Initialiseert de bestandsbrowser.
 */
function init() {
   lstBestanden.addEventListener('click', handleLstBestandenClick);
   btnInklappen.addEventListener('click', handleBtnInklappenClick);
   btnNieuw.addEventListener('click', handleBtnNieuwClick);
   Panelen.bijVerandering(markeer);
   Bestanden.bijWijziging(handleBestandGewijzigd);
}

// event handlers

function handleLstBestandenClick(e) {
   const btn = e.target.closest('button');
   if (!btn) return;

   // hernoemen of verwijderen
   if (btn.dataset.actie === 'hernoemen') {
      Bestandsbeheer.openHernoemen(btn.dataset.doel);
      return;
   }
   if (btn.dataset.actie === 'verwijderen') {
      Bestandsbeheer.vraagVerwijderen(btn.dataset.doel);
      return;
   }

   // een bestand opent in een paneel
   if (btn.dataset.pad) {
      Panelen.open(btn.dataset.pad);
      return;
   }

   // een map wordt de gekozen map, en klapt open of dicht met het icoon dat erbij hoort
   kiesMap(btn.dataset.map.replace(/\/$/, ''));
   const li = btn.closest('.bestandsboom__map');
   const isDicht = li.classList.toggle('is-dicht');
   btn.setAttribute('aria-expanded', String(!isDicht));
   btn.querySelector('.bestandsboom__icoon').src = isDicht ? ICOON_DICHT : ICOON_OPEN;
   if (isDicht) dichteMappen.add(btn.dataset.map);
   else dichteMappen.delete(btn.dataset.map);
}

function handleBtnNieuwClick() {
   Bestandsbeheer.openToevoegen(gekozenMap);
}

function handleBtnInklappenClick() {
   pnlBrowser.classList.toggle('is-ingeklapt');
   pnlBrowser.style.flex = '';
   Panelen.herschik();
}

function handleBestandGewijzigd(pad) {
   // enkel een bestand dat erbij kwam of wegging, verandert de boom
   if (getoond.includes(pad) === Bestanden.paden().includes(pad)) return;
   herbouw();
}

// EXPORTS
// =======

export const Bestandsbrowser = { init, herbouw };
