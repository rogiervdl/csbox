/*
 * CSBox — de Roslyn-runnerpool
 *
 * Een begrensde pool van dotnet-processen (runner/) die de C#-bestanden van een
 * oefening samen compileren tot een DLL. Ze voeren de code nooit uit: dat gebeurt in WASM in de browser, of
 * in een afgeschermd proces (zie sandbox.js en uitvoering.js).
 *
 * De pool groeit mee met de wachtrij tot MAX_RUNNERS en krimpt na een periode
 * zonder werk tot MIN_RUNNERS, om geheugen te sparen op Railway.
 */

const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { spawn } = require('child_process');
const paden = require('./paden');

// de runner: gepubliceerd in runner-bin/, of anders rechtstreeks uit de broncode
const RUNNER_DLL = path.resolve(__dirname, '..', '..', 'runner-bin', 'runner.dll');
const RUNNER_PROJECT = path.resolve(__dirname, '..', '..', 'runner');

// ondergrens (altijd warm, voor snelle eerste respons) en bovengrens (bv. tijdens examens) van de pool
const MIN_RUNNERS = parseInt(process.env.MIN_RUNNERS || '1', 10);
const MAX_RUNNERS = parseInt(process.env.MAX_RUNNERS || process.env.RUNNER_COUNT || '10', 10);

// hoelang een runner ongebruikt mag blijven vooraleer hij wordt afgebouwd
const RUNNER_IDLE_MS = parseInt(process.env.RUNNER_IDLE_TIMEOUT_MS || '300000', 10);

// grenzen per aanvraag: de lengte van de wachtrij en de tijd voor één compilatie
const MAX_WACHTRIJ = 10;
const COMPILEER_TIMEOUT_MS = 30000;

// wachttijd voor een gecrashte runner opnieuw start
const HERSTART_MS = 2000;

// grenzen aan de bestanden van één aanvraag: het aantal en de totale lengte
const MAX_BESTANDEN = 50;
const MAX_TOTAAL = 500000;

// de map voor de bestanden die de server zelf toevoegt; de runner toont er geen fouten van
const EIGEN_MAP = '__csbox';

// de map met de gegevensbestanden die het programma kan inlezen
const GEGEVENSMAP = 'files/';

// hulpklasse voor Console.ReadKey(): de student-DLL kan geen JSImport gebruiken,
// dus Console.ReadKey() → CsBoxHelper.ReadKey() → Console.In.ReadLine()[0];
// op Windows (lokaal ontwikkelen) zet ze ook de uitvoer op UTF-8, zoals Node ze leest;
// de cultuur volgt nl-BE, ook in WASM (dat zonder ICU draait) en op de server,
// zodat getallen, bedragen en datums overal hetzelfde verschijnen
const HELPER_CS = `internal static class CsBoxHelper {
    [System.Runtime.CompilerServices.ModuleInitializer]
    internal static void ZetCodering() {
        if (System.OperatingSystem.IsWindows()) System.Console.OutputEncoding = System.Text.Encoding.UTF8;
    }

    [System.Runtime.CompilerServices.ModuleInitializer]
    internal static void ZetCultuur() {
        var cultuur = (System.Globalization.CultureInfo)System.Globalization.CultureInfo.InvariantCulture.Clone();
        var getallen = cultuur.NumberFormat;
        getallen.NumberDecimalSeparator = ",";
        getallen.NumberGroupSeparator = ".";
        getallen.CurrencyDecimalSeparator = ",";
        getallen.CurrencyGroupSeparator = ".";
        getallen.CurrencySymbol = "€";
        getallen.CurrencyPositivePattern = 2;
        getallen.CurrencyNegativePattern = 12;
        getallen.PercentDecimalSeparator = ",";
        getallen.PercentGroupSeparator = ".";
        var datums = cultuur.DateTimeFormat;
        datums.DayNames = new[] { "zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag" };
        datums.AbbreviatedDayNames = new[] { "zo", "ma", "di", "wo", "do", "vr", "za" };
        datums.MonthNames = new[] { "januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december", "" };
        datums.AbbreviatedMonthNames = new[] { "jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec", "" };
        datums.MonthGenitiveNames = datums.MonthNames;
        datums.AbbreviatedMonthGenitiveNames = datums.AbbreviatedMonthNames;
        datums.FirstDayOfWeek = System.DayOfWeek.Monday;
        datums.DateSeparator = "/";
        datums.ShortDatePattern = "d/MM/yyyy";
        datums.LongDatePattern = "dddd d MMMM yyyy";
        datums.ShortTimePattern = "H:mm";
        datums.LongTimePattern = "H:mm:ss";
        datums.FullDateTimePattern = "dddd d MMMM yyyy H:mm:ss";
        datums.MonthDayPattern = "d MMMM";
        datums.YearMonthPattern = "MMMM yyyy";
        datums.AMDesignator = "";
        datums.PMDesignator = "";
        System.Globalization.CultureInfo.DefaultThreadCurrentCulture = cultuur;
        System.Globalization.CultureInfo.CurrentCulture = cultuur;
    }

    public static System.ConsoleKeyInfo ReadKey(bool intercept = false) {
        string line = System.Console.ReadLine() ?? string.Empty;
        char ch = line.Length > 0 ? line[0] : '\\0';
        System.ConsoleKey key = ch >= 'a' && ch <= 'z'
            ? (System.ConsoleKey)System.Char.ToUpper(ch)
            : (System.ConsoleKey)ch;
        return new System.ConsoleKeyInfo(ch, key, System.Char.IsUpper(ch), false, false);
    }
}`;

// ConsoleColor → ANSI SGR-codes, voor de voorgrond en de achtergrond
const KLEUR_VOORGROND = {
   Black: 30, DarkRed: 31, DarkGreen: 32, DarkYellow: 33,
   DarkBlue: 34, DarkMagenta: 35, DarkCyan: 36, Gray: 37,
   DarkGray: 90, Red: 91, Green: 92, Yellow: 93,
   Blue: 94, Magenta: 95, Cyan: 96, White: 97,
};
const KLEUR_ACHTERGROND = {
   Black: 40, DarkRed: 41, DarkGreen: 42, DarkYellow: 43,
   DarkBlue: 44, DarkMagenta: 45, DarkCyan: 46, Gray: 47,
   DarkGray: 100, Red: 101, Green: 102, Yellow: 103,
   Blue: 104, Magenta: 105, Cyan: 106, White: 107,
};

// de wachtrij en de runners
const wachtrij = [];
const runners = [];

/**
 * Zet de console-aanroepen die de terminal niet rechtstreeks kan uitvoeren om
 * in markeringen die de terminal herkent: wissen, kleuren en ReadKey.
 *
 * @param {string} code - De C#-code van de student
 * @returns {string} De omgezette code
 */
function transformeer(code) {
   // de vervangingen zijn volledig gekwalificeerd: de student hoeft geen using System te hebben
   return code
      .replace(/(?:System\.)?Console\.Clear\s*\(\s*\)/g, 'System.Console.Write("__CSBOX_CLEAR__")')
      .replace(/(?:System\.)?Console\.ForegroundColor\s*=\s*(?:System\.)?ConsoleColor\.(\w+)\s*;/g, (_, kleur) => `System.Console.Write("__CSBOX_FG:${KLEUR_VOORGROND[kleur] ?? 0}__");`)
      .replace(/(?:System\.)?Console\.BackgroundColor\s*=\s*(?:System\.)?ConsoleColor\.(\w+)\s*;/g, (_, kleur) => `System.Console.Write("__CSBOX_BG:${KLEUR_ACHTERGROND[kleur] ?? 0}__");`)
      .replace(/(?:System\.)?Console\.ResetColor\s*\(\s*\)\s*;/g, 'System.Console.Write("__CSBOX_RS__");')
      .replace(/(?:System\.)?Console\.ReadKey\s*\(\s*(?:true|false)?\s*\)/g, 'CsBoxHelper.ReadKey()');
}

/**
 * Maakt een fout zonder bestand of regel, in de vorm van de runner.
 *
 * @param {string} melding - De foutmelding
 * @returns {{dll: null, errors: Array<object>}} Een mislukt resultaat
 */
function mislukt(melding) {
   return { dll: null, errors: [{ file: null, line: 0, col: 0, severity: 'error', message: melding }] };
}

/**
 * Controleert de bestanden van een aanvraag: een object met geldige paden
 * (zie paden.js) en tekst als inhoud, binnen de grenzen, met minstens één
 * .cs-bestand.
 *
 * @param {*} bestanden - Pad → inhoud, van de client
 * @returns {string|null} De foutmelding, of null als alles in orde is
 */
function controleer(bestanden) {
   // een object met tekst als inhoud
   if (!bestanden || typeof bestanden !== 'object' || Array.isArray(bestanden)) return 'Geen code.';
   const lijst = Object.entries(bestanden);
   if (lijst.some(([, inhoud]) => typeof inhoud !== 'string')) return 'Ongeldige bestanden.';

   // binnen de grenzen
   if (lijst.length > MAX_BESTANDEN) return `Te veel bestanden (hoogstens ${MAX_BESTANDEN}).`;
   if (lijst.reduce((totaal, [, inhoud]) => totaal + inhoud.length, 0) > MAX_TOTAAL) return 'De bestanden zijn samen te groot.';

   // elk pad volgens de padregel, en minstens één .cs-bestand met code
   const ongeldig = lijst.find(([pad]) => !paden.isBewerkbaar(pad));
   if (ongeldig) return `Ongeldig bestandspad: ${ongeldig[0]}`;
   if (!lijst.some(([pad, inhoud]) => pad.endsWith('.cs') && inhoud.trim())) return 'Geen code.';

   return null;
}

/**
 * Maakt de broncode die de gegevensbestanden (files/) aanmaakt zodra het
 * programma start, via een module-initializer. Zo vindt het programma ze in
 * zijn werkmap, zowel in WASM als in het afgeschermde proces. De inhoud gaat
 * als base64 mee, zodat geen enkel teken de C#-tekst kan breken.
 *
 * @param {Array<[string, string]>} gegevens - Pad en inhoud van elk gegevensbestand
 * @returns {string} De C#-code
 */
function maakGegevensCode(gegevens) {
   // een schrijfopdracht per bestand
   const opdrachten = gegevens
      .map(([pad, inhoud]) => `        System.IO.File.WriteAllBytes(${JSON.stringify(pad)}, System.Convert.FromBase64String("${Buffer.from(inhoud, 'utf8').toString('base64')}"));`)
      .join('\n');

   // de klasse met de initializer
   return `internal static class CsBoxBestanden {
    [System.Runtime.CompilerServices.ModuleInitializer]
    internal static void Schrijf() {
        System.IO.Directory.CreateDirectory("files");
${opdrachten}
    }
}`;
}

/**
 * Zet de bestanden van de student om naar de bronbestanden voor de runner:
 * elk .cs-bestand omgezet (zie transformeer), plus de hulpklasse voor ReadKey
 * en, als er gegevensbestanden zijn, de code die ze aanmaakt.
 *
 * @param {object} bestanden - Pad → inhoud, gecontroleerd
 * @returns {Array<{path: string, code: string}>} De bronbestanden
 */
function bronbestanden(bestanden) {
   // de .cs-bestanden van de student, omgezet
   const lijst = Object.entries(bestanden);
   const bron = lijst
      .filter(([pad]) => pad.endsWith('.cs'))
      .map(([pad, inhoud]) => ({ path: pad, code: transformeer(inhoud) }));

   // de hulpklasse voor ReadKey
   bron.push({ path: `${EIGEN_MAP}/Helper.cs`, code: HELPER_CS });

   // de gegevensbestanden
   const gegevens = lijst.filter(([pad]) => pad.startsWith(GEGEVENSMAP));
   if (gegevens.length > 0) bron.push({ path: `${EIGEN_MAP}/Bestanden.cs`, code: maakGegevensCode(gegevens) });

   return bron;
}

/**
 * Verwijdert een aanvraag uit de wachtrij, of maakt de runner vrij die ze aan het
 * uitvoeren was.
 *
 * @param {Function} resolve - De resolve van de aanvraag
 */
function vergeetAanvraag(resolve) {
   // nog in de wachtrij: eruit halen
   const index = wachtrij.findIndex(aanvraag => aanvraag.resolve === resolve);
   if (index >= 0) {
      wachtrij.splice(index, 1);
      return;
   }

   // al bij een runner: die runner wordt vrij
   const runner = runners.find(r => r.huidige?.resolve === resolve);
   if (runner) runner.huidige = null;
}

/**
 * Verdeelt de wachtrij over alle vrije runners.
 */
function verwerkWachtrij() {
   for (const runner of runners) {
      // stop als er niets meer wacht; sla bezette runners over
      if (wachtrij.length === 0) break;
      if (!runner.klaar || runner.huidige) continue;

      // de runner is niet langer ongebruikt
      clearTimeout(runner.idleTimer);
      runner.idleTimer = null;

      // geef de volgende aanvraag door
      runner.huidige = wachtrij.shift();
      runner.proc.stdin.write(`${JSON.stringify(runner.huidige.aanvraag)}\n`);
   }
}

/**
 * Plant het afbouwen van een ongebruikte runner, zolang de pool boven
 * MIN_RUNNERS zit.
 *
 * @param {object} runner - De runner uit de pool
 */
function planAfbouw(runner) {
   // een vorige planning vervalt; een bezette runner of een minimale pool blijft
   clearTimeout(runner.idleTimer);
   runner.idleTimer = null;
   if (runner.huidige || runners.length <= MIN_RUNNERS) return;

   runner.idleTimer = setTimeout(function () {
      // intussen opnieuw bezet of de pool al klein genoeg: niets doen
      if (runner.huidige || !runner.klaar || runners.length <= MIN_RUNNERS) return;

      // haal de runner uit de pool en stop zijn proces
      runner.stoppend = true;
      runners.splice(runners.indexOf(runner), 1);
      console.log(`Idle runner afgebouwd (${runners.length} actief).`);
      try {
         runner.proc.kill();
      } catch (fout) {
         // het proces was al gestopt
      }
   }, RUNNER_IDLE_MS);
}

/**
 * Verwerkt één regel uitvoer van een runner: het resultaat van de lopende
 * aanvraag.
 *
 * @param {object} runner - De runner uit de pool
 * @param {string} regel - Een JSON-regel van de runner
 */
function verwerkResultaat(runner, regel) {
   // zonder lopende aanvraag (bv. na een timeout) is het resultaat niet meer nodig
   if (!runner.huidige) return;
   const { resolve, timer } = runner.huidige;
   runner.huidige = null;
   clearTimeout(timer);

   // geef het resultaat door
   try {
      resolve(JSON.parse(regel));
   } catch (fout) {
      resolve(mislukt(`Parse fout: ${fout.message}`));
   }

   // de runner is vrij voor de volgende aanvraag
   verwerkWachtrij();
   planAfbouw(runner);
}

/**
 * Verwerkt het stoppen van een runnerproces: een afgebouwde runner blijft weg,
 * een gecrashte start opnieuw.
 *
 * @param {object} runner - De runner uit de pool
 * @param {number|null} code - De exitcode
 */
function verwerkStop(runner, code) {
   // bewust afgebouwd: niet herstarten
   if (runner.stoppend) return;

   // een lopende aanvraag krijgt een leeg resultaat
   console.warn(`Runner gestopt (exit ${code}), herstart over ${HERSTART_MS / 1000}s...`);
   runner.klaar = false;
   runner.proc = null;
   if (runner.huidige) {
      clearTimeout(runner.huidige.timer);
      runner.huidige.resolve({ dll: null, errors: [] });
      runner.huidige = null;
   }

   // start opnieuw
   setTimeout(() => startProces(runner), HERSTART_MS);
}

/**
 * Start het dotnet-proces van een runner, of start het opnieuw.
 *
 * @param {object} runner - De runner uit de pool
 */
function startProces(runner) {
   // de gepubliceerde runner, of anders rechtstreeks uit de broncode
   const args = fs.existsSync(RUNNER_DLL) ? [RUNNER_DLL] : ['run', '--project', RUNNER_PROJECT];
   const proc = spawn('dotnet', args, { stdio: ['pipe', 'pipe', 'pipe'] });
   runner.proc = proc;
   runner.klaar = false;
   runner.stoppend = false;

   // stdout: één JSON-regel per resultaat
   readline.createInterface({ input: proc.stdout }).on('line', regel => verwerkResultaat(runner, regel));

   // stderr: READY zodra de runner opgewarmd is
   readline.createInterface({ input: proc.stderr }).on('line', function (regel) {
      if (regel.trim() !== 'READY') return;
      runner.klaar = true;
      console.log(`C# runner klaar (${runners.length} actief).`);
      verwerkWachtrij();
      planAfbouw(runner);
   });

   // een gestopt proces
   proc.on('exit', code => verwerkStop(runner, code));
}

/**
 * Voegt een runner toe aan de pool en start zijn proces.
 */
function voegRunnerToe() {
   const runner = { proc: null, klaar: false, huidige: null, idleTimer: null, stoppend: false };
   runners.push(runner);
   startProces(runner);
}

/**
 * Laat de pool meegroeien als er meer aanvragen wachten dan er vrije runners
 * zijn, tot MAX_RUNNERS.
 */
function zorgVoorCapaciteit() {
   if (runners.length >= MAX_RUNNERS) return;

   const vrij = runners.filter(runner => !runner.huidige).length;
   if (wachtrij.length > vrij) voegRunnerToe();
}

/**
 * Geeft een aanvraag aan de runnerpool: ze wacht in de wachtrij tot een
 * runner vrij is, en wordt na COMPILEER_TIMEOUT_MS opgegeven.
 *
 * @param {{type: string, files: Array<object>}} aanvraag - Wat de runner krijgt
 * @returns {Promise<{dll: string|null, errors: Array<object>}>} Het resultaat van de runner
 */
function vraag(aanvraag) {
   return new Promise(function (resolve) {
      // een volle wachtrij weigert meteen
      if (wachtrij.length >= MAX_WACHTRIJ) {
         resolve(mislukt('Server bezet, probeer opnieuw.'));
         return;
      }

      // een compilatie die te lang duurt, wordt opgegeven
      const timer = setTimeout(function () {
         vergeetAanvraag(resolve);
         resolve(mislukt('Compile timeout.'));
      }, COMPILEER_TIMEOUT_MS);

      // in de wachtrij, en meteen verdelen
      wachtrij.push({ aanvraag, resolve, timer });
      zorgVoorCapaciteit();
      verwerkWachtrij();
   });
}

/**
 * Compileert de bestanden van een student samen tot een DLL. Ongeldige
 * bestanden geven meteen een fout; de rest wordt eerst voorbereid (zie
 * bronbestanden). Een fout vermeldt haar bestand.
 *
 * @param {object} bestanden - Pad → inhoud, bv. { "Program.cs": "...", "classes/Persoon.cs": "..." }
 * @returns {Promise<{dll: string|null, errors: Array<object>}>} De DLL in base64, of null met de fouten
 */
async function compileer(bestanden) {
   // ongeldige bestanden komen niet bij de runner
   const fout = controleer(bestanden);
   if (fout) return mislukt(fout);

   // de voorbereide bronbestanden
   return vraag({ type: 'compile', files: bronbestanden(bestanden) });
}

/**
 * Controleert enkel de syntax van de .cs-bestanden van een student, zonder
 * te compileren. De bestanden gaan ongewijzigd mee, zodat regel en kolom
 * kloppen met de editor.
 *
 * @param {object} bestanden - Pad → inhoud
 * @returns {Promise<{dll: null, errors: Array<object>}>} De syntaxfouten; leeg als alles in orde is
 */
async function controleerSyntax(bestanden) {
   // ongeldige bestanden komen niet bij de runner
   const fout = controleer(bestanden);
   if (fout) return mislukt(fout);

   // enkel de .cs-bestanden, zoals ze in de editor staan
   const files = Object.entries(bestanden)
      .filter(([pad]) => pad.endsWith('.cs'))
      .map(([pad, inhoud]) => ({ path: pad, code: inhoud }));
   return vraag({ type: 'syntax', files });
}

/**
 * Compileert de bestanden van een student en controleert, als dat lukt,
 * de stijl; zonder stijlfouten lopen de C#-tests. De runner compileert de
 * voorbereide bestanden (zie bronbestanden) en controleert en test de
 * .cs-bestanden zoals ze in de editor staan.
 *
 * @param {object} bestanden - Pad → inhoud
 * @param {Array<object>} tests - De cs*-tests uit properties.json
 * @returns {Promise<{dll: string|undefined, errors: Array<object>, style: Array<object>|undefined, tests: Array<object>|undefined}>} De DLL, de stijlfouten, en per test geslaagd, omschrijving en reden
 */
async function test(bestanden, tests) {
   // ongeldige bestanden komen niet bij de runner
   const fout = controleer(bestanden);
   if (fout) return mislukt(fout);

   // de voorbereide bestanden om te compileren, de oorspronkelijke om te testen
   const sources = Object.entries(bestanden)
      .filter(([pad]) => pad.endsWith('.cs'))
      .map(([pad, inhoud]) => ({ path: pad, code: inhoud }));
   return vraag({ type: 'test', files: bronbestanden(bestanden), sources, tests });
}

/**
 * Start de ondergrens van de pool alvast op, voor een snelle eerste respons.
 */
function start() {
   for (let i = 0; i < MIN_RUNNERS; i++) voegRunnerToe();
}

module.exports = { start, compileer, controleerSyntax, test };
