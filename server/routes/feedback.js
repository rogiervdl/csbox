/*
 * CSBox — feedback op een oefening
 *
 * POST /api/feedback met { vak, module, oefening, bestanden }. Voorlopig
 * zonder sessie: dat komt in stap 6 van docs/plan-webbox.md. Tot dan beperkt
 * een cooldown per IP-adres hoe vaak de server de tests uitvoert.
 */

const express = require('express');
const catalogus = require('../services/catalogus');
const feedback = require('../services/feedback');

const router = express.Router();

// minimale tijd tussen twee aanvragen van hetzelfde adres, en hoelang een adres onthouden blijft
const COOLDOWN_MS = 3000;
const VERGEET_MS = 60000;

// het tijdstip van de laatste aanvraag per adres
const laatste = new Map();

/**
 * Zegt of een adres nog moet wachten, en onthoudt anders deze aanvraag.
 * Oude adressen vallen weg, zodat de lijst klein blijft.
 *
 * @param {string} adres - Het IP-adres
 * @returns {boolean} Of het adres nog in de cooldown zit
 */
function moetWachten(adres) {
   // oude adressen vergeten
   const nu = Date.now();
   for (const [ander, tijdstip] of laatste) {
      if (nu - tijdstip > VERGEET_MS) laatste.delete(ander);
   }

   // binnen de cooldown: wachten; anders deze aanvraag onthouden
   if (nu - (laatste.get(adres) ?? 0) < COOLDOWN_MS) return true;
   laatste.set(adres, nu);
   return false;
}

/*
 * Voert de tests van de oefening uit op { bestanden } en geeft { errors } bij
 * compileerfouten, of anders { resultaten, score }.
 */
router.post('/', async function (req, res) {
   // niet te vaak
   if (moetWachten(req.ip)) return res.status(429).json({ fout: 'Wacht enkele seconden voor je opnieuw feedback vraagt.' });

   // enkel een oefening uit de catalogus, met tests
   const { vak, module: mod, oefening: oef, bestanden } = req.body ?? {};
   const gevonden = catalogus.zoekOefening(String(vak ?? ''), String(mod ?? ''), String(oef ?? ''));
   if (!gevonden || gevonden.oefening.verborgen) return res.status(404).json({ fout: 'Onbekende oefening.' });
   if (gevonden.oefening.tests.length === 0) return res.status(404).json({ fout: 'Deze oefening heeft geen feedback.' });

   // de feedback; de runner controleert de bestanden
   res.json(await feedback.geefFeedback(gevonden.oefening, bestanden));
});

module.exports = router;
