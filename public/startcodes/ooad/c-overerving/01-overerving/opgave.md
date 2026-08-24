# Eenvoudige overerving

**Doel:** een klasse overerven van een andere klasse.

## Opgave

De klasse `Klant` is al gegeven (onderaan in het bestand).

1. Maak een klasse `ProfessioneleKlant` die overerft van `Klant`.
2. Voeg properties `BedrijfsNaam` en `BtwNummer` toe.
3. Voeg een eigen `override ToString()` toe (tip: gebruik `base.ToString()` voor de basisinfo).
4. Voeg twee instanties toe van `ProfessioneleKlant`:
   - Niels Verhoeven, niels@studio42.be, Studio 42 BV, BE0123.456.789
   - Sofia Dimitriou, sofia@ateliernova.eu, Atelier Nova, BE0897.654.321

## Verwacht resultaat

```
Oefening 1: Overerving
-------------
Overzicht klanten:
- Lotte Peeters (lotte.peeters@mail.be)
- Youssef El Amrani (youssef.elamrani@outlook.com)
- Chloé Van den Broeck (chloe.vdbroeck@gmail.com)
- Milan De Vos (milan.devos@yahoo.com)
- Niels Verhoeven (niels@studio42.be) - Studio 42 BV (BTW: BE0123.456.789)
- Sofia Dimitriou (sofia@ateliernova.eu) - Atelier Nova (BTW: BE0897.654.321)
```
