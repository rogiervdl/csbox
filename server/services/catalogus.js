/*
 * CSBox — de catalogus van schijf
 *
 * Overloopt content/<vak>/<module>/<oefening>/ en leest per map de
 * properties.json. De mapnaam is de identiteit; de volgorde is de alfabetische
 * volgorde van de mappen.
 *
 * De catalogus staat in het geheugen: de server leest hem één keer bij het
 * opstarten. De contentroutes lezen enkel die kopie. Een wijziging in content/
 * wordt pas zichtbaar na een herstart.
 */

const fs = require('fs/promises');
const path = require('path');
const paden = require('./paden');
const testschema = require('./testschema');

// waar de oefeningen staan
const CONTENT_DIR = path.resolve(__dirname, '..', '..', 'content');

// het bestand dat een map beschrijft, en de opgave; die staan niet in de boom
const PROPERTIES = 'properties.json';
const OPGAVE = 'readme.md';

// de catalogus in het geheugen
let catalogus = { vakken: [] };

/**
 * Geeft de submappen van een map met een properties.json, alfabetisch.
 * Mappen die met _ of . beginnen, horen nooit bij de catalogus.
 *
 * @param {string} map - Het absolute pad
 * @returns {Promise<Array<{mapnaam: string, pad: string, props: object}>>} De submappen met hun eigenschappen
 */
async function leesSubmappen(map) {
   // neem alleen gewone mappen
   const items = await fs.readdir(map, { withFileTypes: true });
   const namen = items
      .filter(item => item.isDirectory() && !/^[_.]/.test(item.name))
      .map(item => item.name)
      .sort();

   // lees per map de eigenschappen; een map zonder properties.json telt niet mee
   const submappen = [];
   for (const mapnaam of namen) {
      const pad = path.join(map, mapnaam);
      const bestand = path.join(pad, PROPERTIES);

      let tekst;
      try {
         tekst = await fs.readFile(bestand, 'utf8');
      } catch (fout) {
         console.warn(`Catalogus: geen ${PROPERTIES} in ${path.relative(CONTENT_DIR, pad)}, overgeslagen`);
         continue;
      }

      // een ongeldig bestand is een fout van de auteur en moet opvallen
      try {
         submappen.push({ mapnaam, pad, props: JSON.parse(tekst) });
      } catch (fout) {
         throw new Error(`Catalogus: ongeldige JSON in ${path.relative(CONTENT_DIR, bestand)}: ${fout.message}`);
      }
   }

   return submappen;
}

/**
 * Geeft alle bestanden in een oefeningmap als paden met /, zonder wat onder
 * een _- of .-segment staat.
 *
 * @param {string} map - De absolute map van de oefening
 * @returns {Promise<Array<string>>} Bv. ["Program.cs", "classes/Persoon.cs"]
 */
async function leesBestandspaden(map) {
   const items = await fs.readdir(map, { recursive: true, withFileTypes: true });

   return items
      .filter(item => item.isFile())
      .map(item => path.relative(map, path.join(item.parentPath, item.name)).split(path.sep).join('/'))
      .filter(pad => !pad.split('/').some(segment => /^[_.]/.test(segment)))
      .sort();
}

/**
 * Leest de bestanden van een oefening van schijf, behalve properties.json en
 * readme.md. Wat de padregel bewerkbaar noemt, is een startbestand; de
 * afbeeldingen in media/ zijn alleen-lezen. Welke bestanden bij het openen een
 * paneel krijgen, staat in geopend van properties.json, standaard Program.cs.
 * Al de rest, een ontbrekende Program.cs en een onbekend pad in geopend komen
 * als melding terug.
 *
 * @param {object} props - De properties.json van de oefening
 * @param {string} map - De absolute map van de oefening
 * @returns {Promise<{startbestanden: Array<string>, alleenLezen: Array<string>, geopend: Array<string>, meldingen: Array<string>}>}
 */
async function leesBestanden(props, map) {
   const opSchijf = (await leesBestandspaden(map)).filter(pad => pad !== PROPERTIES && pad !== OPGAVE);

   // indelen volgens de padregel
   const startbestanden = opSchijf.filter(paden.isBewerkbaar);
   const alleenLezen = opSchijf.filter(paden.isMedia);

   // wat niet in de regel past, valt weg; Program.cs moet er zijn
   const meldingen = opSchijf
      .filter(pad => !startbestanden.includes(pad) && !alleenLezen.includes(pad))
      .map(pad => `"${pad}" past niet in de vaste mappen en wordt niet getoond`);
   if (!startbestanden.includes(paden.HOOFDBESTAND)) meldingen.push(`${paden.HOOFDBESTAND} ontbreekt`);

   // de bestanden die meteen een paneel krijgen; enkel bestaande
   const gevraagd = Array.isArray(props.geopend) ? props.geopend : [paden.HOOFDBESTAND];
   const toonbaar = [...startbestanden, ...alleenLezen];
   const geopend = gevraagd.filter(pad => toonbaar.includes(pad));
   gevraagd.filter(pad => !toonbaar.includes(pad)).forEach(pad => meldingen.push(`"${pad}" in geopend bestaat niet`));

   return { startbestanden, alleenLezen, geopend, meldingen };
}

/**
 * Leest de catalogus van schijf in het geheugen.
 *
 * @returns {Promise<{vakken: number, modules: number, oefeningen: number}>} De tellingen
 */
async function laad() {
   const tellingen = { vakken: 0, modules: 0, oefeningen: 0 };
   const vakken = [];

   // de vakken
   for (const vak of await leesSubmappen(CONTENT_DIR)) {
      const modules = [];
      vakken.push({ mapnaam: vak.mapnaam, label: vak.props.label ?? vak.mapnaam, cursusmodus: vak.props.cursusmodus ?? null, modules });
      tellingen.vakken++;

      // de modules binnen het vak
      for (const mod of await leesSubmappen(vak.pad)) {
         const oefeningen = [];
         modules.push({ mapnaam: mod.mapnaam, label: mod.props.label ?? mod.mapnaam, oefeningen });
         tellingen.modules++;

         // de oefeningen binnen de module; een fout in de bestanden meldt zich, de oefening laadt toch
         for (const oef of await leesSubmappen(mod.pad)) {
            const { startbestanden, alleenLezen, geopend, meldingen } = await leesBestanden(oef.props, oef.pad);
            meldingen.forEach(melding => console.warn(`Catalogus: ${path.relative(CONTENT_DIR, oef.pad)}: ${melding}`));

            // de tests; een ongeldige test meldt zich en valt weg
            const controle = testschema.controleer(oef.props.tests);
            controle.meldingen.forEach(melding => console.warn(`Catalogus: ${path.relative(CONTENT_DIR, oef.pad)}: ${melding}`));

            oefeningen.push({
               mapnaam: oef.mapnaam,
               label: oef.props.label ?? oef.mapnaam,
               startbestanden,
               alleenLezen,
               geopend,
               tests: controle.tests,
               verborgen: oef.props.verborgen === true,
            });
            tellingen.oefeningen++;
         }
      }
   }

   // vervang de vorige catalogus in één keer
   catalogus = { vakken };

   return tellingen;
}

/**
 * Geeft de catalogus voor de client: zonder verborgen oefeningen, en zonder
 * vakken of modules die daardoor leeg vallen.
 *
 * @returns {object} { vakken: [{ mapnaam, label, modules: [{ mapnaam, label, oefeningen: [{ mapnaam, label, geopend, feedback }] }] }] }
 */
function zichtbaar() {
   const vakken = catalogus.vakken
      .map(vak => ({
         mapnaam: vak.mapnaam,
         label: vak.label,
         modules: vak.modules
            .map(mod => ({
               mapnaam: mod.mapnaam,
               label: mod.label,
               oefeningen: mod.oefeningen
                  .filter(oef => !oef.verborgen)
                  .map(oef => ({ mapnaam: oef.mapnaam, label: oef.label, geopend: oef.geopend, feedback: oef.tests.length > 0 })),
            }))
            .filter(mod => mod.oefeningen.length > 0),
      }))
      .filter(vak => vak.modules.length > 0);

   return { vakken };
}

/**
 * Zoekt een oefening op mapnamen. Dit is meteen de controle of het pad
 * bestaat: wat hier niet uit komt, wordt nooit van schijf gelezen.
 *
 * @param {string} vakNaam - De mapnaam van het vak
 * @param {string} moduleNaam - De mapnaam van de module
 * @param {string} oefeningNaam - De mapnaam van de oefening
 * @returns {{oefening: object, map: string}|null} De oefening en haar absolute map; of null
 */
function zoekOefening(vakNaam, moduleNaam, oefeningNaam) {
   // zoek elk niveau op zijn mapnaam
   const vak = catalogus.vakken.find(v => v.mapnaam === vakNaam);
   const mod = vak?.modules.find(m => m.mapnaam === moduleNaam);
   const oefening = mod?.oefeningen.find(o => o.mapnaam === oefeningNaam);
   if (!oefening) return null;

   return { oefening, map: path.join(CONTENT_DIR, vak.mapnaam, mod.mapnaam, oefening.mapnaam) };
}

module.exports = { laad, zichtbaar, zoekOefening, OPGAVE };
