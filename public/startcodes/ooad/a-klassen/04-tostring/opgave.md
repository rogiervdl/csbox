# ToString()

**Doel:** de methode `ToString()` overschrijven voor een mooie tekstweergave van een object.

## Opgave

De klasse `Product` is gegeven met volgende properties: `ProductId`, `Naam`, `Beschrijving`, `Prijs`, `Voorraad`, `IsInVoorraad`, `Korting` en `PrijsMetKorting`.

1. Voeg een `override ToString()` toe zodat een product als volgt weergegeven wordt:

```
[9112] Laptop - € 999,99 | in voorraad
```

Als het product niet in voorraad is, staat er `"niet in voorraad"`.

## Verwacht resultaat

```
Oefening 4: toString()
-------------
product #0: [9112] Laptop - € 999,99 | in voorraad
product #1: [2876] Bureaulamp - € 34,50 | niet in voorraad
product #2: [3033] Rugzak - € 59,95 | in voorraad
product #3: [4441] Koptelefoon - € 149,00 | in voorraad
```
