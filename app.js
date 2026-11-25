/*
 * CSBox — Express-server
 *
 * Serveert de statische client uit client/, de WASM-runtime, de API onder /api
 * en de WebSocket voor uitvoering op de server.
 *
 * Start met: node app.js
 */

const path = require('path');
const fs = require('fs');
const express = require('express');

const contentRoutes = require('./server/routes/content');
const compileRoutes = require('./server/routes/compile');
const feedbackRoutes = require('./server/routes/feedback');
const catalogus = require('./server/services/catalogus');
const runner = require('./server/services/runner');
const uitvoering = require('./server/services/uitvoering');

// de gepubliceerde WASM-runtime (na: dotnet publish wasm-host/ -c Release)
const WASM_DIST = path.join(__dirname, 'wasm-host', 'bin', 'Release', 'net10.0', 'browser-wasm', 'AppBundle', '_framework');

const app = express();

// achter de proxy van Railway is req.ip anders het adres van de proxy zelf
app.set('trust proxy', 1);

// verklap niet welk framework er draait
app.disable('x-powered-by');

/*
 * Zet de COOP/COEP-headers: vereist voor SharedArrayBuffer, dat .NET in WASM
 * gebruikt.
 */
app.use(function (req, res, next) {
   res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
   res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
   next();
});

// de API
app.use(express.json({ limit: '1mb' }));
app.use('/api/content', contentRoutes);
app.use('/api/compile', compileRoutes);
app.use('/api/feedback', feedbackRoutes);

// een onbekende API-route mag niet in de statische bestanden belanden
app.use('/api', function (req, res) {
   res.status(404).json({ fout: 'onbekende route' });
});

/*
 * Vangt een onverwachte fout in een API-route op: de details gaan naar de log,
 * de client krijgt JSON zonder stacktrace.
 */
app.use('/api', function (fout, req, res, next) {
   console.error(`Fout bij ${req.method} ${req.originalUrl}`, fout);
   if (res.headersSent) return next(fout);

   res.status(500).json({ fout: 'er ging iets mis op de server; probeer het later opnieuw' });
});

// de client
app.use(express.static(path.join(__dirname, 'client')));

// de WASM-runtime, als ze gepubliceerd is
if (fs.existsSync(WASM_DIST)) {
   app.use('/wasm-dist', express.static(WASM_DIST, {
      setHeaders: res => res.setHeader('Cross-Origin-Resource-Policy', 'same-origin'),
   }));
}

/**
 * Leest de catalogus van schijf, start de runnerpool en de server, en koppelt
 * de WebSocket. Zonder catalogus is er niets te serveren, dus die fout stopt
 * het proces.
 */
async function start() {
   // de catalogus moet in het geheugen staan voor het eerste verzoek
   const tellingen = await catalogus.laad();
   console.log(`Catalogus: ${tellingen.vakken} vakken, ${tellingen.modules} modules, ${tellingen.oefeningen} oefeningen`);

   // warme runners voor de eerste compilatie
   runner.start();

   // start de server en koppel de WebSocket
   const poort = process.env.PORT || 3003;
   const server = app.listen(poort, function () {
      console.log(`CSBox draait op http://localhost:${poort}`);
      if (!fs.existsSync(WASM_DIST)) console.warn('⚠ WASM dist niet gevonden. Voer uit: dotnet publish wasm-host/ -c Release');
   });
   uitvoering.koppel(server);
}

start().catch(function (fout) {
   console.error(fout);
   process.exit(1);
});
