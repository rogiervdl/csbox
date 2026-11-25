/*
 * CSBox — oefeningen van schijf
 *
 * De oefeningen staan in content/, buiten de webroot. Alleen deze module leest
 * er bestanden uit, en alleen langs de weg van de catalogus: een vak, module
 * of oefening die niet in de catalogus staat, bestaat voor de server niet. Zo
 * kan een pad uit de URL nooit rechtstreeks in een bestandsnaam terechtkomen.
 */

const fs = require('fs/promises');
const path = require('path');
const catalogus = require('./catalogus');

/**
 * Zet een relatief pad uit de asset-route om in een absoluut pad binnen de
 * oefeningmap, of geeft null als dat niet lukt. Vangt directory traversal op
 * en weigert elk segment dat met _ begint, zoals _oplossing/.
 *
 * @param {string} map - De absolute map van de oefening
 * @param {string} relatief - Het pad uit de URL, na /asset/
 * @returns {string|null} Het absolute pad, of null als het geweigerd wordt
 */
function veiligAssetPad(map, relatief) {
   const doel = path.resolve(map, relatief);

   // het resultaat moet binnen de oefeningmap blijven
   if (!doel.startsWith(map + path.sep)) return null;

   // niets onder een _-segment gaat naar de client
   const delen = path.relative(map, doel).split(path.sep);
   if (delen.some(deel => deel.startsWith('_'))) return null;

   return doel;
}

/**
 * Leest één bestand uit een oefeningmap, langs dezelfde controle als de
 * asset-route.
 *
 * @param {string} map - De absolute map van de oefening
 * @param {string} pad - Het pad binnen de oefening, bv. classes/Persoon.cs
 * @returns {Promise<string|null>} De inhoud, of null als het bestand ontbreekt of geweigerd wordt
 */
async function leesBestand(map, pad) {
   const bestand = veiligAssetPad(map, pad);
   if (!bestand) return null;

   try {
      return await fs.readFile(bestand, 'utf8');
   } catch (fout) {
      return null;
   }
}

/**
 * Leest de startcode en de opgave van een oefening.
 *
 * @param {object} oefening - De oefening uit de catalogus
 * @param {string} map - De absolute map van de oefening
 * @returns {Promise<{bestanden: object, alleenLezen: Array<string>, readme: string|null}>} De startbestanden (pad → inhoud), de alleen-lezen bestanden en de opgave
 */
async function leesOefening(oefening, map) {
   // lees alleen wat de catalogus als startbestand kent; een bestand dat intussen weg is, begint leeg
   const inhoud = await Promise.all(oefening.startbestanden.map(pad => leesBestand(map, pad)));
   const bestanden = {};
   oefening.startbestanden.forEach(function (pad, index) {
      bestanden[pad] = inhoud[index] ?? '';
   });

   return {
      bestanden,
      alleenLezen: oefening.alleenLezen,
      readme: await leesBestand(map, catalogus.OPGAVE),
   };
}

module.exports = { leesOefening, veiligAssetPad };
