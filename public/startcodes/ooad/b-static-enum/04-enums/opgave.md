# Enums

**Doel:** een enum definiëren en gebruiken als type van een property.

## Opgave

1. Maak een enum `BestelStatus` met de waarden:
   `Nieuw`, `InBehandeling`, `Verzonden`, `Geleverd`, `Geannuleerd`.

2. Maak een klasse `Bestelling` met properties:
   `KlantNaam`, `ProductNaam` en `Status` (van type `BestelStatus`).

3. Voeg een berekende property `KanNogGewijzigdWorden` toe die `true` geeft zolang de bestelling nog wijzigbaar is (niet `Geleverd` of `Geannuleerd`).

4. Voeg een `override ToString()` toe die klantnaam, productnaam en status netjes weergeeft.

## Verwacht resultaat

```
Oefening 4: bestelstatus
-------------
Laptop - Nieuw - wijzigbaar: ja
Muis - Verzonden - wijzigbaar: nee
```
