/*
 * Layout-wisselaar
 *
 * De terminal en het foutenpaneel staan altijd rechts. De layoutknop draait
 * de editorpanelen telkens een kwartslag: naast elkaar van links naar rechts,
 * onder elkaar van boven naar onder (standaard), naast elkaar van rechts naar
 * links, onder elkaar van onder naar boven. Het icoon van de knop toont de
 * huidige stand; het gevulde paneel is het eerste.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Panelen } from './panelen.js';

// DECLARATIES
// ===========

// de standen in de volgorde van de knop: of de panelen onder elkaar staan, of de volgorde omgekeerd is, icoon en uitleg
const STANDEN = [
   { isOnder: false, isOmgekeerd: false, icoon: 'img/icon-layout-ltr.svg', titel: 'naast elkaar, van links naar rechts' },
   { isOnder: true, isOmgekeerd: false, icoon: 'img/icon-layout-ttb.svg', titel: 'onder elkaar, van boven naar onder' },
   { isOnder: false, isOmgekeerd: true, icoon: 'img/icon-layout-rtl.svg', titel: 'naast elkaar, van rechts naar links' },
   { isOnder: true, isOmgekeerd: true, icoon: 'img/icon-layout-btt.svg', titel: 'onder elkaar, van onder naar boven' },
];

// de stand bij het laden: onder elkaar, van boven naar onder
let stand = 1;

// DOM
const elmWorkspace = document.querySelector('#workspace');
const elmEditorsPanel = document.querySelector('#editors-panel');
const elmRightPanel = document.querySelector('#right-panel');
const btnLayout = document.querySelector('#btn-layout');
const imgLayout = btnLayout.querySelector('img');

// FUNCTIES
// ========

/**
 * Toont een stand: de klassen op de werkruimte, het icoon en de uitleg.
 *
 * @param {object} item - een stand uit STANDEN
 */
function toonStand(item) {
   elmWorkspace.classList.toggle('layout-vertical', item.isOnder);
   elmWorkspace.classList.toggle('layout-reverse', item.isOmgekeerd);
   imgLayout.src = item.icoon;
   btnLayout.title = `Draai de layout (nu ${item.titel})`;
}

/**
 * Initialiseert de layoutknop.
 */
function init() {
   toonStand(STANDEN[stand]);
   btnLayout.addEventListener('click', handleBtnLayoutClick);
}

// event handlers

function handleBtnLayoutClick() {
   // de volgende stand
   stand = (stand + 1) % STANDEN.length;
   toonStand(STANDEN[stand]);

   // de versleepte afmetingen vallen terug op de standaard
   elmEditorsPanel.style.flex = '';
   elmRightPanel.style.flex = '';
   elmEditorsPanel.querySelectorAll('.editor-pane').forEach(pane => { pane.style.flex = ''; });

   // de editors passen zich aan
   Panelen.herschik();
}

// EXPORTS
// =======

export const Layout = { init };
