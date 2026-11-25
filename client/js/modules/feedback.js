/*
 * Feedback module — de knop en het venster rechtsonder
 *
 * Vraagt de server de tests van de oefening uit te voeren op de huidige
 * bestanden, en toont het resultaat: de compileerfouten, de stijlfouten, of per test ✓/✗
 * met de score als sterren. De knop verschijnt enkel bij een oefening met
 * tests. Bij ongewijzigde code toont de knop de vorige feedback opnieuw; de
 * verversknop vraagt altijd een nieuwe berekening, met een cooldown.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Bestanden } from './bestanden.js';
import { Feedbacktekst } from './feedbacktekst.js';

// DECLARATIES
// ===========

// de API en de cooldown tussen twee berekeningen
const API = '/api/feedback';
const COOLDOWN_MS = 5000;
const SECONDE_MS = 1000;

// de sterren: vijf, met een trofee bij 100 %
const MAX_STERREN = 5;
const PROCENT_PER_STER = 100 / MAX_STERREN;

// de oefening met tests, of null
let oefening = null;

// de code en het resultaat van de vorige feedback, om die opnieuw te tonen
let codeBijFeedback = null;
let laatsteResultaat = null;

// een lopende aanvraag, de keuze waarvoor ze liep en het einde van de cooldown
let bezig = false;
let keuze = 0;
let cooldownTot = 0;
let cooldownTimer = null;

// de foutenmodule, om compileerfouten ook klikbaar te tonen
let errors = null;

// de markdown-parser met de veilige renderer
let markdown = null;

// private DOM
const btnFeedback = document.querySelector('#btn-feedback');
const pnlFeedback = document.querySelector('#pnl-feedback');
const btnVervers = document.querySelector('#btn-feedback-ververs');
const btnSluiten = document.querySelector('#btn-feedback-sluiten');
const lstFeedback = document.querySelector('#lst-feedback');
const VERVERS_TITEL = btnVervers.title;

// FUNCTIES
// ========

/**
 * Stuurt de bestanden naar de server en geeft het antwoord.
 *
 * @param {object} gegevens - vak, module, oefening en bestanden
 * @returns {Promise<{ok: boolean, data: object|null}>} of het lukte, met de JSON
 */
async function vraagServer(gegevens) {
   try {
      const antwoord = await fetch(API, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(gegevens),
      });
      const data = await antwoord.json();
      return { ok: antwoord.ok, data };
   } catch (e) {
      return { ok: false, data: null };
   }
}

/**
 * Voegt een bericht toe aan het venster.
 *
 * @param {string} soort - resultaat of melding
 * @param {string} tekst - de tekst; bij een resultaat markdown
 * @returns {HTMLElement} het nieuwe bericht
 */
function voegBerichtToe(soort, tekst) {
   // een resultaat als veilige markdown, een melding als tekst
   const bericht = document.createElement('div');
   bericht.className = `bericht bericht--${soort}`;
   if (soort === 'resultaat') {
      bericht.classList.add('feedback__markdown');
      bericht.innerHTML = markdown.parse(tekst);
   } else {
      bericht.textContent = tekst;
   }

   // onderaan toevoegen
   lstFeedback.append(bericht);
   lstFeedback.scrollTop = lstFeedback.scrollHeight;
   return bericht;
}

/**
 * Toont enkel een melding in het venster.
 *
 * @param {string} tekst - de melding
 * @param {string} [extra] - een extra klasse, bv. bericht--fout
 */
function toonMelding(tekst, extra) {
   lstFeedback.replaceChildren();
   const bericht = voegBerichtToe('melding', tekst);
   if (extra) bericht.classList.add(extra);
}

/**
 * Toont een animatietje zolang de feedback berekend wordt.
 */
function toonLaden() {
   lstFeedback.replaceChildren();
   const bericht = document.createElement('div');
   bericht.className = 'bericht bericht--laden';
   bericht.innerHTML = '<span></span><span></span><span></span>';
   lstFeedback.append(bericht);
}

/**
 * Toont de compileerfouten: één regel per fout, met bestand en regel.
 *
 * @param {Array<object>} fouten - file, line en message per fout
 */
function toonFouten(fouten) {
   // de uitleg en de fouten
   toonMelding('Je code compileert nog niet; los eerst deze fouten op:', 'bericht--controle');
   const regels = fouten.map(fout => `✗ ${fout.file ? `${fout.file}:${fout.line} — ` : ''}${fout.message}`);
   if (regels.length > 0) voegBerichtToe('melding', regels.join('\n')).classList.add('bericht--controle', 'bericht--controle-fouten');

   // ook in het foutenpaneel, waar een klik het bestand opent
   errors.clear();
   errors.show(fouten);
}

/**
 * Toont de stijlfouten: één regel per fout, met bestand en regel, zoals de
 * linting in WebBox.
 *
 * @param {Array<object>} fouten - file, line en message per fout
 */
function toonStijl(fouten) {
   // de uitleg en de fouten
   toonMelding('Je code volgt de stijlregels nog niet; los eerst deze punten op:', 'bericht--controle');
   const regels = fouten.map(fout => `⚠ ${fout.file}:${fout.line} — ${fout.message}`);
   voegBerichtToe('melding', regels.join('\n')).classList.add('bericht--controle', 'bericht--controle-fouten');

   // ook in het foutenpaneel, waar een klik het bestand opent
   errors.clear();
   errors.show(fouten);
}

/**
 * Geeft een score als sterren, met een trofee bij 100 %.
 *
 * @param {number} score - 0 tot 100
 * @returns {string} bv. "★★★★☆" of "★★★★★ 🏆"
 */
function alsSterren(score) {
   const aantal = Math.round(score / PROCENT_PER_STER);
   const trofee = score === 100 ? ' 🏆' : '';
   return `${'★'.repeat(aantal)}${'☆'.repeat(MAX_STERREN - aantal)}${trofee}`;
}

/**
 * Toont de resultaten van de tests, met de score als sterren eronder.
 *
 * @param {Array<object>} resultaten - caption, description, tips, punten en geslaagd per test
 * @param {number} score - 0 tot 100
 */
function toonResultaten(resultaten, score) {
   // de tests, met gekleurde tekens
   lstFeedback.replaceChildren();
   const bericht = voegBerichtToe('resultaat', Feedbacktekst.bouwToetsTekst(resultaten));
   Feedbacktekst.kleurTekens(bericht);

   // de sterren, met het percentage als tooltip
   const lblSterren = document.createElement('div');
   lblSterren.className = 'bericht__sterren';
   lblSterren.textContent = alsSterren(score);
   lblSterren.title = `${score} %`;
   bericht.append(lblSterren);
}

/**
 * Toont een resultaat van de server: de compileerfouten, de stijlfouten, of
 * de tests.
 *
 * @param {object} resultaat - { errors }, { stijl } of { resultaten, score }
 */
function toonResultaat(resultaat) {
   if (resultaat.errors) toonFouten(resultaat.errors);
   else if (resultaat.stijl) toonStijl(resultaat.stijl);
   else toonResultaten(resultaat.resultaten, resultaat.score);
}

/**
 * Werkt de knoppen bij volgens de toestand: bezig, cooldown en of de code
 * sinds de vorige feedback veranderd is.
 */
function werkBij() {
   // de feedbackknop
   const zelfdeCode = laatsteResultaat !== null && codeBijFeedback === JSON.stringify(Bestanden.alle());
   btnFeedback.title = zelfdeCode ? 'Toon de feedback op deze versie opnieuw' : 'Vraag feedback op je code';
   btnFeedback.disabled = bezig;

   // de verversknop, met de resterende cooldown in de tooltip
   const resterend = cooldownTot - Date.now();
   btnVervers.disabled = bezig || resterend > 0;
   btnVervers.title = resterend > 0 ? `nog ${Math.ceil(resterend / SECONDE_MS)} s wachten` : VERVERS_TITEL;
}

/**
 * Start de cooldown en telt ze af in de verversknop.
 */
function startCooldown() {
   cooldownTot = Date.now() + COOLDOWN_MS;
   clearInterval(cooldownTimer);
   cooldownTimer = setInterval(telAf, SECONDE_MS);
   werkBij();
}

/**
 * Werkt de verversknop bij tijdens de cooldown, en stopt na afloop.
 */
function telAf() {
   if (Date.now() >= cooldownTot) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
   }
   werkBij();
}

/**
 * Vraagt nieuwe feedback op de huidige bestanden en toont het resultaat.
 */
async function vraagFeedback() {
   // niet zonder oefening, niet tijdens een aanvraag of de cooldown
   if (!oefening || bezig || Date.now() < cooldownTot) return;

   // toon het venster met het animatietje
   const dezeKeuze = keuze;
   const bestanden = Bestanden.alle();
   bezig = true;
   pnlFeedback.classList.remove('is-hidden');
   toonLaden();
   werkBij();

   // de aanvraag; een andere oefening intussen maakt ze overbodig
   const antwoord = await vraagServer({ vak: oefening.vak, module: oefening.module, oefening: oefening.oefening, bestanden });
   bezig = false;
   if (dezeKeuze !== keuze) return;
   startCooldown();

   // een fout van de server
   if (!antwoord.ok || !antwoord.data) {
      toonMelding(antwoord.data?.fout ?? 'De server is niet bereikbaar.', 'bericht--fout');
      return;
   }

   // het resultaat, en onthouden voor ongewijzigde code
   codeBijFeedback = JSON.stringify(bestanden);
   laatsteResultaat = antwoord.data;
   toonResultaat(laatsteResultaat);
   werkBij();
}

/**
 * Kiest de oefening waarop de feedback slaat. Zonder tests verdwijnen de
 * knop en het venster.
 *
 * @param {{vak: string, module: string, oefening: string, feedback: boolean}|null} gekozen - de oefening, of null
 */
function kiesOefening(gekozen) {
   // de oefening, als ze tests heeft; de vorige feedback vervalt
   keuze++;
   oefening = gekozen?.feedback ? gekozen : null;
   codeBijFeedback = null;
   laatsteResultaat = null;

   // de knop, en een leeg venster
   btnFeedback.classList.toggle('is-hidden', oefening === null);
   if (oefening === null) pnlFeedback.classList.add('is-hidden');
   toonMelding('Vraag feedback op je code.');
   werkBij();
}

/**
 * Initialiseert de feedback.
 *
 * @param {object} errorsModule - de foutenmodule
 */
function init(errorsModule) {
   errors = errorsModule;
   markdown = Feedbacktekst.maakMarkdown();
   btnFeedback.addEventListener('click', handleBtnFeedbackClick);
   btnVervers.addEventListener('click', handleBtnVerversClick);
   btnSluiten.addEventListener('click', handleBtnSluitenClick);
   btnFeedback.addEventListener('mouseenter', handleBtnFeedbackMouseenter);
}

// event handlers

function handleBtnFeedbackClick() {
   // ongewijzigde code: de vorige feedback opnieuw tonen
   if (laatsteResultaat !== null && codeBijFeedback === JSON.stringify(Bestanden.alle())) {
      pnlFeedback.classList.remove('is-hidden');
      return;
   }

   // anders een nieuwe berekening; tijdens de cooldown enkel het venster
   if (Date.now() < cooldownTot) {
      pnlFeedback.classList.remove('is-hidden');
      return;
   }
   vraagFeedback();
}

function handleBtnVerversClick() {
   vraagFeedback();
}

function handleBtnSluitenClick() {
   pnlFeedback.classList.add('is-hidden');
}

function handleBtnFeedbackMouseenter() {
   werkBij();
}

// EXPORTS
// =======

export const Feedback = { init, kiesOefening };
