/*
 * Code kopiëren naar het klembord
 *
 * Tijdens een examen kan downloaden niet: Schoolyear laat het niet toe. De
 * student levert dus in door zijn code te plakken. De kopieerknop in de kop van
 * elk paneel maakt daar één klik van.
 *
 * Lukt het klembord niet (het vraagt een beveiligde context en kan geweigerd
 * worden), dan selecteert de knop de hele editor, zodat Ctrl+C nog altijd werkt.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// hoe lang de knop bevestigt dat er gekopieerd is
const BEVESTIGING_MS = 1500;
let bevestigingTimer = null;

// FUNCTIES
// ========

/**
 * Zet tekst op het klembord.
 *
 * @param {string} tekst - de code uit de editor
 * @returns {Promise<boolean>} true als het klembord de tekst aanvaardde
 */
async function kopieerNaarKlembord(tekst) {
   try {
      await navigator.clipboard.writeText(tekst);
      return true;
   } catch (e) {
      return false;
   }
}

/**
 * Selecteert de volledige inhoud van een editor, als terugvaloptie voor
 * wanneer het klembord geweigerd wordt.
 *
 * @param {object} editor - een Monaco-editor
 */
function selecteerAlles(editor) {
   editor.focus();
   editor.setSelection(editor.getModel().getFullModelRange());
}

/**
 * Haalt de bevestiging weer weg.
 */
function wisBevestiging() {
   document.querySelectorAll('.btn-copy.is-copied').forEach(knop => knop.classList.remove('is-copied'));
}

/**
 * Laat kort zien dat er gekopieerd is.
 *
 * @param {HTMLElement} btn - de aangeklikte knop
 */
function toonBevestiging(btn) {
   clearTimeout(bevestigingTimer);
   wisBevestiging();
   btn.classList.add('is-copied');
   bevestigingTimer = setTimeout(wisBevestiging, BEVESTIGING_MS);
}

/**
 * Kopieert de inhoud van een editor naar het klembord, of selecteert ze als
 * het klembord geweigerd wordt.
 *
 * @param {object} editor - de Monaco-editor van het paneel
 * @param {HTMLElement} btn - de kopieerknop van het paneel
 */
async function kopieer(editor, btn) {
   const gelukt = await kopieerNaarKlembord(editor.getValue());
   if (!gelukt) {
      selecteerAlles(editor);
      return;
   }
   toonBevestiging(btn);
}

// EXPORTS
// =======

export const Clipboard = { kopieer };
