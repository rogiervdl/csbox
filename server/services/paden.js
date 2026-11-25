/*
 * CSBox — paden van bestanden in een oefening
 *
 * Eén regel voor wat een geldig bestandspad is: voor de startbestanden op
 * schijf, en later voor wat een student bewaart, toevoegt of hernoemt. Een pad
 * is gebruikersinvoer, dus de regel is streng: een bestand staat in de hoofdmap
 * of in één van de vaste mappen, met een extensie die bij die map hoort. Zie
 * "Bestanden" in docs/plan-webbox.md.
 */

// een segment: letters, cijfers, punt, liggend streepje en underscore, niet beginnend met een punt of _
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

// een begrensde lengte
const MAX_LENGTE = 100;

// de bewerkbare extensies per map; '' is de hoofdmap
const BEWERKBAAR = {
   '': ['.cs'],
   classes: ['.cs'],
   files: ['.txt', '.csv', '.tsv', '.json'],
};

// de map met de afbeeldingen, en welke bestanden afbeeldingen zijn; die zijn alleen-lezen
const MEDIAMAP = 'media';
const AFBEELDING = /\.(png|jpe?g|gif|svg|webp|ico)$/i;

// de taal per extensie, voor Monaco
const TALEN = { '.cs': 'csharp', '.txt': 'plaintext', '.csv': 'plaintext', '.tsv': 'plaintext', '.json': 'json' };

// het bestand dat er altijd is
const HOOFDBESTAND = 'Program.cs';

/**
 * Splitst een pad in map en bestandsnaam, als het pad aan de vorm voldoet:
 * hoogstens één map diep, elk segment volgens de regel.
 *
 * @param {*} pad - Bv. classes/Persoon.cs
 * @returns {{map: string, naam: string}|null} De map ('' voor de hoofdmap) en de naam; of null
 */
function splits(pad) {
   // tekst van een redelijke lengte
   if (typeof pad !== 'string' || pad.length === 0 || pad.length > MAX_LENGTE) return null;

   // hoogstens één map diep, elk segment volgens de regel
   const segmenten = pad.split('/');
   if (segmenten.length > 2) return null;
   if (!segmenten.every(segment => SEGMENT.test(segment))) return null;

   return segmenten.length === 1 ? { map: '', naam: segmenten[0] } : { map: segmenten[0], naam: segmenten[1] };
}

/**
 * Geeft de extensie van een bestandsnaam, in kleine letters.
 *
 * @param {string} naam - Bv. Persoon.cs
 * @returns {string} Bv. .cs; leeg zonder extensie
 */
function extensieVan(naam) {
   const punt = naam.lastIndexOf('.');

   return punt === -1 ? '' : naam.slice(punt).toLowerCase();
}

/**
 * Zegt of een pad een geldig bewerkbaar bestand is: in de hoofdmap, classes/
 * of files/, met een extensie die bij die map hoort.
 *
 * @param {*} pad - Bv. classes/Persoon.cs
 * @returns {boolean}
 */
function isBewerkbaar(pad) {
   const delen = splits(pad);
   if (!delen) return false;

   // de map moet bestaan in de vaste lijst, en de extensie erbij horen
   const extensies = BEWERKBAAR[delen.map];

   return Array.isArray(extensies) && extensies.includes(extensieVan(delen.naam));
}

/**
 * Zegt of een pad een geldige afbeelding in media/ is.
 *
 * @param {*} pad - Bv. media/logo.png
 * @returns {boolean}
 */
function isMedia(pad) {
   const delen = splits(pad);

   return delen !== null && delen.map === MEDIAMAP && AFBEELDING.test(delen.naam);
}

/**
 * Geeft de taal van een bestand volgens zijn extensie.
 *
 * @param {string} pad - Bv. classes/Persoon.cs
 * @returns {string|null} csharp, plaintext of json; null bij een onbekende extensie
 */
function taalVan(pad) {
   return TALEN[extensieVan(pad)] ?? null;
}

module.exports = { isBewerkbaar, isMedia, taalVan, HOOFDBESTAND };
