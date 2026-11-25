/*
 * CSBox — compileren voor WASM
 *
 * Compileert de code van de student tot een DLL, die de browser in WASM
 * uitvoert. Voorlopig zonder sessie: dat komt in stap 6 van docs/plan-webbox.md.
 */

const express = require('express');
const runner = require('../services/runner');

const router = express.Router();

/*
 * Compileert { bestanden } (pad → inhoud) en geeft { dll, errors } terug; de
 * runner controleert de bestanden.
 */
router.post('/', async function (req, res) {
   res.json(await runner.compileer(req.body?.bestanden));
});

/*
 * Controleert enkel de syntax van { bestanden }, zonder te compileren, en
 * geeft { dll: null, errors } terug; errors is leeg als alles in orde is.
 */
router.post('/syntax', async function (req, res) {
   res.json(await runner.controleerSyntax(req.body?.bestanden));
});

module.exports = router;
