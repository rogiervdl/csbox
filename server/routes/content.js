/*
 * CSBox — routes voor de oefeningen
 *
 * Voorlopig zonder sessie: aanmelden komt in stap 6 van docs/plan-webbox.md.
 */

const express = require('express');
const catalogus = require('../services/catalogus');
const content = require('../services/content');

const router = express.Router();

/**
 * Zoekt de oefening uit de URL, of antwoordt 404.
 *
 * @param {object} req
 * @param {object} res
 * @returns {object|null} Het resultaat van zoekOefening, of null als er al geantwoord is
 */
function zoekBestaand(req, res) {
   const gevonden = catalogus.zoekOefening(req.params.vak, req.params.module, req.params.oefening);
   if (!gevonden) res.status(404).json({ fout: 'oefening niet gevonden' });

   return gevonden;
}

/*
 * Geeft de catalogus terug.
 */
router.get('/index', function (req, res) {
   res.json(catalogus.zichtbaar());
});

/*
 * Geeft de startcode en de opgave van één oefening in één antwoord.
 */
router.get('/:vak/:module/:oefening', async function (req, res) {
   // de catalogus bepaalt of de oefening bestaat; pas daarna wordt er iets gelezen
   const gevonden = zoekBestaand(req, res);
   if (!gevonden) return;

   // lees de bestanden en de opgave
   try {
      res.json(await content.leesOefening(gevonden.oefening, gevonden.map));
   } catch (fout) {
      console.error('Content: kon de oefening niet lezen', fout);
      res.status(500).json({ fout: 'kon de oefening niet laden' });
   }
});

/*
 * Serveert afbeeldingen uit de oefeningmap, voor de opgave en media/.
 */
router.get('/:vak/:module/:oefening/asset/*', function (req, res) {
   // dezelfde regel als voor de oefening zelf
   const gevonden = zoekBestaand(req, res);
   if (!gevonden) return;

   // normaliseer het pad en controleer dat het binnen de oefeningmap blijft
   const bestand = content.veiligAssetPad(gevonden.map, String(req.params[0] ?? ''));
   if (!bestand) return res.status(400).json({ fout: 'ongeldig pad' });

   // stuur het bestand, of 404 als het niet bestaat
   res.sendFile(bestand, function (fout) {
      if (fout && !res.headersSent) res.status(404).end();
   });
});

module.exports = router;
