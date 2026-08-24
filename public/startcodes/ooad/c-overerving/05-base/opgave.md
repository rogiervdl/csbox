# base

**Doel:** de constructor en methodes van de basisklasse aanroepen vanuit een subklasse.

## Opgave

De klasse `Medewerker` is al gegeven (met constructor en `ToString()`).

1. Maak een klasse `Manager` die overerft van `Medewerker` en een extra property `TeamGrootte` heeft.
2. Voeg een constructor toe die `base(naam, afdeling)` aanroept.
3. Override `ToString()` en roep `base.ToString()` aan om de output van `Medewerker` te hergebruiken.
4. Haal de commentaarregels in de lijst uit commentaar en controleer de output.

## Verwacht resultaat

```
Oefening 5: base
-------------
Lotte Peeters (Marketing)
Niels Verhoeven (IT), team: 8 personen
Youssef El Amrani (Sales)
Sofia Dimitriou (HR), team: 5 personen
Chloé Van den Broeck (Finance)
```
