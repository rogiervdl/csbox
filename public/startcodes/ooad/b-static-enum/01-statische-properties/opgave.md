# Statische properties

**Doel:** statische properties toevoegen die gedeeld worden over alle instanties van een klasse.

## Opgave

Gegeven is de klasse `WorkshopDeelnemer` met properties `Naam` en `IsAanwezig` (private setters) en een constructor met parameters voor naam en aanwezigheidsstatus.

1. Voeg twee statische properties toe:
   - `AantalAangemaakt` (private setter)
   - `AantalAanwezig` (private setter)

2. Pas de constructor aan zodat beide statische properties correct bijgehouden worden bij elke aanmaak.

3. Voeg een instantiemethode `ZetAfwezig()` toe die de aanwezigheidsstatus aanpast én `AantalAanwezig` correct bijhoudt. Let op: als een deelnemer al afwezig is, mag de teller niet nogmaals verlaagd worden.

## Verwacht resultaat

```
Oefening 1: deelnemers registreren
-------------
Aantal aangemaakt: 3
Aantal aanwezig: 2
Aantal aanwezig na wijziging: 1
```
