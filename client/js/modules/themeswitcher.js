/*
 * Thema-wisselaar
 *
 * De knop met het palet doorloopt de kleurschema's. Elk schema heeft een
 * donkere of lichte basis (data-theme), waarop de lichte opmaak in de CSS
 * steunt, en eigen kleuren (data-schema) voor de app, de editor en de terminal.
 * De kleuren van de code komen uit prism-kleuren.js, voor de editor en voor
 * de codeblokken in de opgave.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Store } from '../storage.js';
import { PrismKleuren } from './prism-kleuren.js';

// DECLARATIES
// ===========

// de kleurschema's in volgorde van de knop: naam, basis en Monaco-thema
const SCHEMAS = [
   { id: 'light', naam: 'Licht', basis: 'light', monaco: 'licht' },
   { id: 'coy', naam: 'Coy', basis: 'light', monaco: 'coy' },
   { id: 'zand', naam: 'Zand', basis: 'light', monaco: 'zand' },
   { id: 'okaida', naam: 'Okaida', basis: 'dark', monaco: 'okaida' },
   { id: 'dark', naam: 'Donker', basis: 'dark', monaco: 'donker' },
];

// de Monaco-thema's: hun basis en de kleuren van de editor zelf
const MONACO_THEMAS = {
   licht: { base: 'vs', colors: {} },
   donker: { base: 'vs-dark', colors: {} },
   okaida: {
      base: 'vs-dark',
      colors: {
         'editor.background': '#272822',
         'editor.foreground': '#f8f8f2',
         'editor.lineHighlightBackground': '#3e3d32',
         'editor.selectionBackground': '#49483e',
         'editorLineNumber.foreground': '#75715e',
      },
   },
   coy: {
      base: 'vs',
      colors: {
         'editor.background': '#fdfdfd',
         'editor.lineHighlightBackground': '#f0f4f8',
         'editorLineNumber.foreground': '#a0a8c0',
      },
   },
   zand: {
      base: 'vs',
      colors: {
         'editor.background': '#fcfcf4',
         'editor.lineHighlightBackground': '#f1f0e2',
         'editorLineNumber.foreground': '#b4b39a',
      },
   },
};

// het standaardschema, ook bij een onbekende waarde
const STANDAARD = 'dark';

// de sleutels in localStorage; init.js leest ze ook
const LS_SCHEMA = 'csbox-schema';
const LS_THEME = 'csbox-theme';

// DOM
const btnTheme = document.querySelector('#btn-theme');
const styleCode = document.createElement('style');

// FUNCTIES
// ========

/**
 * Registreert de eigen Monaco-thema's, met de kleuren van de code uit
 * prism-kleuren.js.
 */
function defineerMonacoThemas() {
   Object.entries(MONACO_THEMAS).forEach(([naam, thema]) => {
      monaco.editor.defineTheme(naam, {
         base: thema.base,
         inherit: true,
         rules: PrismKleuren.monacoRegels(naam),
         colors: thema.colors,
      });
   });
}

/**
 * Geeft het kleurschema met die id, of Donker als het niet bestaat.
 *
 * @param {string} id - bv. 'okaida'
 * @returns {object} het schema
 */
function zoekSchema(id) {
   return SCHEMAS.find(schema => schema.id === id) ?? SCHEMAS.find(schema => schema.id === STANDAARD);
}

/**
 * Geeft het schema dat na het gegeven schema komt, cyclisch.
 *
 * @param {object} schema - het huidige schema
 * @returns {object} het volgende schema
 */
function volgendSchema(schema) {
   return SCHEMAS[(SCHEMAS.indexOf(schema) + 1) % SCHEMAS.length];
}

/**
 * Past een kleurschema toe op de UI, de editor en de codeblokken in de
 * opgave, en onthoudt het. Vereist dat monaco beschikbaar is.
 *
 * @param {string} id - de id van het schema
 */
function applyTheme(id) {
   // de basis voor de lichte opmaak, en de eigen kleuren
   const schema = zoekSchema(id);
   document.documentElement.dataset.theme = schema.basis;
   document.documentElement.dataset.schema = schema.id;
   monaco.editor.setTheme(schema.monaco);

   // dezelfde kleuren voor de code in de opgave
   styleCode.textContent = PrismKleuren.css(schema.monaco);

   // de knop noemt het huidige en het volgende schema
   btnTheme.title = `Kleurschema: ${schema.naam} (klik voor ${volgendSchema(schema).naam})`;

   // onthoud het schema en zijn basis, voor init.js bij een volgend bezoek
   Store.set(LS_SCHEMA, schema.id);
   Store.set(LS_THEME, schema.basis);
}

/**
 * Geeft de CSS met de kleuren van de code in het huidige schema, bv. voor
 * de opgave in een nieuw tabblad.
 *
 * @returns {string} de CSS-regels voor .token.<naam>
 */
function codeCss() {
   return styleCode.textContent;
}

/**
 * Initialiseert het thema; zonder bewaard schema geldt de bewaarde basis.
 */
function init() {
   // de stijl voor de code in de opgave
   document.head.append(styleCode);

   // registreer de thema's en pas het bewaarde schema toe
   defineerMonacoThemas();
   applyTheme(Store.get(LS_SCHEMA) || Store.get(LS_THEME) || STANDAARD);

   // koppel de knop
   btnTheme.addEventListener('click', handleBtnThemeClick);
}

// event handlers

function handleBtnThemeClick() {
   // het volgende schema in de lijst
   const huidig = zoekSchema(document.documentElement.dataset.schema);
   applyTheme(volgendSchema(huidig).id);
}

// EXPORTS
// =======

export const ThemeSwitcher = { applyTheme, init, codeCss };
