/*
 * CSBox — interactieve uitvoering op de server, via een WebSocket
 *
 * De terugval voor omgevingen zonder WASM (bv. zonder SharedArrayBuffer). De
 * client stuurt de code; de server compileert ze met de runnerpool en voert de
 * DLL uit in een afgeschermd proces (zie sandbox.js). Uitvoer gaat als stream
 * naar de client, invoer komt regel per regel terug.
 *
 * Berichten van de client: { type: 'start', bestanden }, { type: 'input', data },
 * { type: 'stop' }. Naar de client: { type: 'output', data } en
 * { type: 'exit', code, errors }.
 */

const fs = require('fs');
const { spawn } = require('child_process');
const { WebSocketServer } = require('ws');
const runner = require('./runner');
const sandbox = require('./sandbox');

// maximale duur van één programma
const MAX_DUUR_MS = 30000;

/**
 * Zet regeleinden van Windows en oude Mac om naar \n.
 *
 * @param {Buffer} stuk - Een stuk uitvoer
 * @returns {string} De tekst met enkel \n
 */
function normaliseer(stuk) {
   return stuk.toString().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Behandelt één WebSocket-verbinding: hoogstens één programma tegelijk.
 *
 * @param {import('ws').WebSocket} ws - De verbinding
 */
function behandelVerbinding(ws) {
   // het lopende programma, zijn werkmap en zijn timer
   let proc = null;
   let werkmap = null;
   let timer = null;

   /**
    * Stopt het programma en ruimt de werkmap op.
    */
   function ruimOp() {
      // de timer en het proces
      clearTimeout(timer);
      timer = null;
      if (proc) {
         try {
            proc.kill();
         } catch (fout) {
            // het proces was al gestopt
         }
         proc = null;
      }

      // de werkmap
      if (werkmap) {
         fs.rm(werkmap, { recursive: true, force: true }, () => {});
         werkmap = null;
      }
   }

   /**
    * Stuurt een bericht naar de client, als de verbinding nog open is.
    *
    * @param {object} bericht - Het bericht
    */
   function stuur(bericht) {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(bericht));
   }

   /**
    * Voert een gecompileerde DLL uit in een afgeschermd proces.
    *
    * @param {string} dll - De DLL in base64
    */
   function voerUit(dll) {
      // schrijf DLL en runtimeconfig naar een afgeschermde werkmap
      const programma = sandbox.schrijfProgramma(dll);
      werkmap = programma.werkmap;
      const dllPad = programma.dllPad;

      // voer de DLL uit, zonder de omgeving van de server
      proc = spawn('dotnet', ['exec', dllPad], sandbox.spawnOpties(werkmap));

      // uitvoer en runtimefouten (onbehandelde exceptions) gaan naar de client
      proc.stdout.on('data', stuk => stuur({ type: 'output', data: normaliseer(stuk) }));
      proc.stderr.on('data', stuk => stuur({ type: 'output', data: normaliseer(stuk) }));

      // het einde van het programma
      proc.on('close', function (code) {
         stuur({ type: 'exit', code: code ?? 0, errors: [] });
         ruimOp();
      });
      proc.on('error', function (fout) {
         stuur({ type: 'exit', code: -1, errors: [{ file: null, line: 0, col: 0, severity: 'error', message: `Kon dotnet niet starten: ${fout.message}` }] });
         ruimOp();
      });

      // een programma dat te lang loopt, wordt gestopt
      timer = setTimeout(function () {
         stuur({ type: 'exit', code: -1, errors: [{ file: null, line: 0, col: 0, severity: 'error', message: `Timeout: programma duurde langer dan ${MAX_DUUR_MS / 1000} seconden.` }] });
         ruimOp();
      }, MAX_DUUR_MS);
   }

   /**
    * Compileert de bestanden en voert ze uit; compileerfouten gaan terug naar
    * de client.
    *
    * @param {object} bestanden - Pad → inhoud; de runner controleert ze
    */
   async function start(bestanden) {
      // hoogstens één programma tegelijk
      if (proc) return;

      // compileer; bij fouten stoppen
      const resultaat = await runner.compileer(bestanden);
      if (!resultaat.dll) {
         stuur({ type: 'exit', code: 1, errors: resultaat.errors || [] });
         return;
      }

      // de verbinding kan intussen gesloten zijn
      if (ws.readyState !== ws.OPEN) return;
      voerUit(resultaat.dll);
   }

   /**
    * Verwerkt een bericht van de client.
    *
    * @param {Buffer} ruw - Het bericht als JSON
    */
   function verwerkBericht(ruw) {
      // enkel geldige JSON
      let bericht;
      try {
         bericht = JSON.parse(ruw);
      } catch (fout) {
         return;
      }

      // starten, invoer doorgeven of stoppen
      if (bericht.type === 'start') {
         start(bericht.bestanden);
      } else if (bericht.type === 'input') {
         if (proc && proc.stdin.writable) proc.stdin.write(`${bericht.data ?? ''}\n`);
      } else if (bericht.type === 'stop') {
         ruimOp();
         stuur({ type: 'exit', code: -1, errors: [] });
      }
   }

   // koppel de events van de verbinding
   ws.on('message', verwerkBericht);
   ws.on('close', ruimOp);
   ws.on('error', ruimOp);
}

/**
 * Koppelt de WebSocket-server aan de HTTP-server.
 *
 * @param {import('http').Server} server - De HTTP-server van Express
 */
function koppel(server) {
   const wss = new WebSocketServer({ server });
   wss.on('connection', behandelVerbinding);
}

module.exports = { koppel };
