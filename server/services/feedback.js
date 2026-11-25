/*
 * CSBox — feedback op een oefening
 *
 * Voert de tests uit properties.json uit op de code van een student, volgens
 * docs/tests-schema.md: eerst compileren, dan de C#-tests in de runner, dan
 * de console-tests door het programma uit te voeren in een afgeschermd proces.
 * De server berekent de score; de client krijgt de resultaten en de score.
 */

const fs = require('fs');
const { spawn } = require('child_process');
const runner = require('./runner');
const sandbox = require('./sandbox');
const testschema = require('./testschema');

// grenzen voor één uitvoering van een console-test: de duur en de uitvoer
const MAX_DUUR_MS = 10000;
const MAX_UITVOER = 64 * 1024;

/**
 * Maakt van een tekst een code-span voor markdown, ook als er backticks in staan.
 *
 * @param {string} tekst - De tekst
 * @returns {string} De code-span
 */
function alsCode(tekst) {
   const rand = String(tekst).includes('`') ? '``' : '`';
   return `${rand}${rand === '``' ? ' ' : ''}${tekst}${rand === '``' ? ' ' : ''}${rand}`;
}

/**
 * Zegt of de uitvoer een patroon bevat. Een gewone tekst vergelijkt zonder
 * witruimte en hoofdletters; een regex loopt op de uitvoer met elke reeks
 * witruimte als één spatie, altijd case-insensitive.
 *
 * @param {string} uitvoer - De uitvoer van het programma
 * @param {string} patroon - De tekst of /regex/vlaggen uit de test
 * @returns {boolean} Of het patroon gevonden is
 */
function bevat(uitvoer, patroon) {
   // een regex, met i erbij
   const regex = testschema.alsRegex(patroon);
   if (regex) {
      const vlaggen = regex.flags.includes('i') ? regex.flags : `${regex.flags}i`;
      return new RegExp(regex.source, vlaggen.replace('g', '')).test(uitvoer.replace(/\s+/g, ' '));
   }

   // een gewone tekst, zonder witruimte en hoofdletters
   const zonderWitruimte = tekst => tekst.replace(/\s+/g, '').toLowerCase();
   return zonderWitruimte(uitvoer).includes(zonderWitruimte(patroon));
}

/**
 * Voert het programma één keer uit met de gegeven invoer, in een afgeschermd
 * proces, en geeft de uitvoer terug.
 *
 * @param {string} dll - De DLL in base64
 * @param {Array<string>} invoer - De regels voor Console.ReadLine()
 * @returns {Promise<{uitvoer: string, uitzondering: string|null, timeout: boolean}>} De uitvoer, de eerste regel van een onbehandelde exception en of het programma te lang liep
 */
function voerUit(dll, invoer) {
   return new Promise(function (resolve) {
      // de werkmap met het programma, en het proces zonder de omgeving van de server
      const { werkmap, dllPad } = sandbox.schrijfProgramma(dll);
      const proc = spawn('dotnet', ['exec', dllPad], sandbox.spawnOpties(werkmap));
      let uitvoer = '';
      let fouten = '';
      let timeout = false;

      // uitvoer en fouten verzamelen, begrensd
      proc.stdout.on('data', function (stuk) {
         if (uitvoer.length < MAX_UITVOER) uitvoer += stuk.toString();
      });
      proc.stderr.on('data', function (stuk) {
         if (fouten.length < MAX_UITVOER) fouten += stuk.toString();
      });

      // een programma dat te lang loopt, wordt gestopt
      const timer = setTimeout(function () {
         timeout = true;
         proc.kill();
      }, MAX_DUUR_MS);

      // het einde: de werkmap weg en het resultaat terug
      function klaar() {
         clearTimeout(timer);
         fs.rm(werkmap, { recursive: true, force: true }, () => {});
         const uitzondering = fouten.split(/\r?\n/).find(regel => /exception/i.test(regel)) ?? null;
         resolve({ uitvoer: uitvoer.replace(/\r\n/g, '\n'), uitzondering: uitzondering?.trim() ?? null, timeout });
      }
      proc.on('close', klaar);
      proc.on('error', function (fout) {
         fouten += `Exception: kon dotnet niet starten: ${fout.message}`;
         klaar();
      });

      // de invoer in één keer; een programma dat meer vraagt, krijgt het einde van de invoer
      proc.stdin.on('error', () => {});
      proc.stdin.end(invoer.map(regel => `${regel}\n`).join(''));
   });
}

/**
 * Geeft de reden waarom een uitvoering niet geldt, of null.
 *
 * @param {{uitzondering: string|null, timeout: boolean}} uitvoering - Het resultaat van voerUit
 * @returns {string|null} De reden
 */
function redenVan(uitvoering) {
   if (uitvoering.timeout) return `het programma stopte niet binnen ${MAX_DUUR_MS / 1000} s (wacht het op meer invoer?)`;
   if (uitvoering.uitzondering) return `het programma stopte met een fout: ${alsCode(uitvoering.uitzondering)}`;
   return null;
}

/**
 * Beoordeelt één console-test op de uitvoer van zijn invoer.
 *
 * @param {object} test - De test uit properties.json
 * @param {object} uitvoering - Het resultaat van voerUit
 * @returns {{geslaagd: boolean, omschrijving: string, reden: string|null}} Het resultaat
 */
function beoordeelConsole(test, uitvoering) {
   // de standaardomschrijving: tekst tussen aanhalingstekens of een patroon, met de invoer erbij
   const invoer = test.input?.length ? ` bij invoer ${test.input.map(alsCode).join(', ')}` : '';
   const wat = testschema.alsRegex(test.contains) ? `patroon ${alsCode(test.contains)}` : `tekst "${test.contains}"`;
   const omschrijving = test.assert === 'consoleContains'
      ? `${wat} in de uitvoer${invoer}`
      : `${wat} niet in de uitvoer${invoer}`;

   // een programma dat niet normaal stopt, faalt altijd
   const reden = redenVan(uitvoering);
   if (reden) return { geslaagd: false, omschrijving, reden };

   // bevat of bevat niet
   const gevonden = bevat(uitvoering.uitvoer, test.contains);
   return { geslaagd: test.assert === 'consoleContains' ? gevonden : !gevonden, omschrijving, reden: null };
}

/**
 * Voert de console-tests uit: één uitvoering per verschillende invoer.
 *
 * @param {string} dll - De DLL in base64
 * @param {Array<object>} tests - De console*-tests
 * @returns {Promise<Map<object, object>>} Per test het resultaat
 */
async function voerConsoleTestsUit(dll, tests) {
   // de tests per invoer
   const perInvoer = new Map();
   tests.forEach(function (test) {
      const sleutel = JSON.stringify(test.input ?? []);
      if (!perInvoer.has(sleutel)) perInvoer.set(sleutel, []);
      perInvoer.get(sleutel).push(test);
   });

   // na elkaar uitvoeren, zodat één aanvraag niet te veel processen start
   const resultaten = new Map();
   for (const [sleutel, groep] of perInvoer) {
      const uitvoering = await voerUit(dll, JSON.parse(sleutel));
      groep.forEach(test => resultaten.set(test, beoordeelConsole(test, uitvoering)));
   }

   return resultaten;
}

/**
 * Berekent de score: de behaalde punten op het totaal, naar beneden
 * afgerond, zodat enkel 100 betekent dat elke test geslaagd is.
 *
 * @param {Array<{punten: number, geslaagd: boolean}>} resultaten - De resultaten
 * @returns {number} 0 tot 100
 */
function berekenScore(resultaten) {
   const totaal = resultaten.reduce((som, item) => som + item.punten, 0);
   const behaald = resultaten.reduce((som, item) => som + (item.geslaagd ? item.punten : 0), 0);
   return totaal > 0 ? Math.floor((behaald / totaal) * 100) : 0;
}

/**
 * Geeft feedback op de bestanden van een student voor een oefening.
 *
 * @param {object} oefening - De oefening uit de catalogus, met haar tests
 * @param {object} bestanden - Pad → inhoud, van de client
 * @returns {Promise<{errors: Array<object>}|{stijl: Array<object>}|{resultaten: Array<object>, score: number}>} De compileerfouten, de stijlfouten, of de resultaten en de score
 */
async function geefFeedback(oefening, bestanden) {
   // compileren, de stijlcontrole en de C#-tests; bij stijlfouten enkel die
   const csTests = oefening.tests.filter(test => test.assert.startsWith('cs'));
   const gecompileerd = await runner.test(bestanden, csTests);
   if (gecompileerd.style?.length) return { stijl: gecompileerd.style };

   // bij compileerfouten enkel die
   if (!gecompileerd.dll) return { errors: (gecompileerd.errors ?? []).filter(fout => fout.severity === 'error') };

   // de console-tests op het gecompileerde programma
   const consoleTests = oefening.tests.filter(test => test.assert.startsWith('console'));
   const consoleResultaten = await voerConsoleTestsUit(gecompileerd.dll, consoleTests);

   // de resultaten in de volgorde van de lijst, met de omschrijving uit de test als die er is
   const csResultaten = new Map(csTests.map((test, index) => [test, gecompileerd.tests?.[index] ?? { geslaagd: false, omschrijving: test.assert, reden: 'de test kon niet lopen' }]));
   const resultaten = oefening.tests.map(function (test) {
      const resultaat = csResultaten.get(test) ?? consoleResultaten.get(test);
      const reden = !resultaat.geslaagd && resultaat.reden ? ` — ${resultaat.reden}` : '';
      return {
         caption: test.caption ?? null,
         description: `${test.description ?? resultaat.omschrijving}${reden}`,
         tips: test.tips,
         punten: test.points ?? 1,
         geslaagd: resultaat.geslaagd,
      };
   });

   return { resultaten, score: berekenScore(resultaten) };
}

module.exports = { geefFeedback };
