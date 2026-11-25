/*
 * CSBox — afscherming van studentenprogramma's op de server
 *
 * Een gecompileerd studentenprogramma draait in een eigen tijdelijke map, met
 * een minimale omgeving zonder sleutels of connectiestrings, en in de container
 * als een gebruiker zonder rechten (RUN_UID en RUN_GID, zie de Dockerfile).
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// gebruiker zonder rechten voor de code van studenten (enkel in de container; lokaal leeg)
const SANDBOX_UID = process.env.RUN_UID ? parseInt(process.env.RUN_UID, 10) : null;
const SANDBOX_GID = process.env.RUN_GID ? parseInt(process.env.RUN_GID, 10) : null;

// bovengrens voor de managed heap van een studentenprogramma: 256 MB, hexadecimaal zoals .NET het verwacht
const HEAP_LIMIET = '0x10000000';

// omgevingsvariabelen die dotnet nodig heeft en die niets geheims bevatten
const DOORGEGEVEN = ['PATH', 'LANG', 'LC_ALL', 'DOTNET_ROOT', 'DOTNET_SYSTEM_GLOBALIZATION_INVARIANT', 'SystemRoot', 'windir'];

// runtimeconfig voor dotnet exec (versie 1.0.0 + latestMajor → altijd de geïnstalleerde versie)
const RUNTIMECONFIG = JSON.stringify({
   runtimeOptions: {
      tfm: 'net10.0',
      framework: { name: 'Microsoft.NETCore.App', version: '1.0.0' },
      rollForward: 'latestMajor',
   },
}, null, 2);

/**
 * Bouwt een minimale omgeving voor een studentenprogramma, zonder sleutels of
 * connectiestrings uit process.env.
 *
 * @param {string} werkmap - De tijdelijke map van het programma, ook gebruikt als home- en tempmap
 * @returns {object} De omgevingsvariabelen voor spawn
 */
function bouwOmgeving(werkmap) {
   // neem enkel de toegelaten variabelen over
   const omgeving = {};
   for (const naam of DOORGEGEVEN) {
      if (process.env[naam] !== undefined) omgeving[naam] = process.env[naam];
   }

   // home- en tempmap wijzen naar de eigen tijdelijke map
   omgeving.HOME = werkmap;
   omgeving.USERPROFILE = werkmap;
   omgeving.TMPDIR = werkmap;
   omgeving.TEMP = werkmap;
   omgeving.TMP = werkmap;

   // geen logo of telemetrie, en een begrensde heap
   omgeving.DOTNET_NOLOGO = '1';
   omgeving.DOTNET_CLI_TELEMETRY_OPTOUT = '1';
   omgeving.DOTNET_GCHeapHardLimit = HEAP_LIMIET;

   return omgeving;
}

/**
 * Maakt een tijdelijke map voor één programma, enkel toegankelijk voor de
 * gebruiker die het uitvoert.
 *
 * @returns {string} Het pad van de map
 */
function maakWerkmap() {
   // maak de map aan, enkel voor de eigenaar
   const map = path.join(os.tmpdir(), `csbox-${crypto.randomBytes(8).toString('hex')}`);
   fs.mkdirSync(map, { recursive: true, mode: 0o700 });

   // in de container wordt de gebruiker zonder rechten eigenaar
   if (SANDBOX_UID !== null) fs.chownSync(map, SANDBOX_UID, SANDBOX_GID);

   return map;
}

/**
 * Bouwt de opties voor spawn van een studentenprogramma: de werkmap, een
 * minimale omgeving en, in de container, de gebruiker zonder rechten.
 *
 * @param {string} werkmap - De tijdelijke map van het programma
 * @returns {object} De opties voor spawn
 */
function spawnOpties(werkmap) {
   // werkmap en omgeving
   const opties = { cwd: werkmap, env: bouwOmgeving(werkmap) };

   // in de container: uitvoeren als de gebruiker zonder rechten
   if (SANDBOX_UID !== null) {
      opties.uid = SANDBOX_UID;
      opties.gid = SANDBOX_GID;
   }

   return opties;
}

/**
 * Schrijft een gecompileerde DLL met haar runtimeconfig naar een nieuwe
 * afgeschermde werkmap, klaar voor dotnet exec.
 *
 * @param {string} dll - De DLL in base64
 * @returns {{werkmap: string, dllPad: string}} De werkmap en het pad van de DLL
 */
function schrijfProgramma(dll) {
   // de werkmap, de DLL en de runtimeconfig
   const werkmap = maakWerkmap();
   const dllPad = path.join(werkmap, 'StudentCode.dll');
   fs.writeFileSync(dllPad, Buffer.from(dll, 'base64'));
   fs.writeFileSync(path.join(werkmap, 'StudentCode.runtimeconfig.json'), RUNTIMECONFIG, 'utf8');

   return { werkmap, dllPad };
}

module.exports = { maakWerkmap, spawnOpties, schrijfProgramma };
