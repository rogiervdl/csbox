# Statische klassen

**Doel:** een statische klasse met uitsluitend statische methodes gebruiken als utility class.

## Opgave

1. Maak een **statische klasse** `TekstAnalyse` met:
   - Privaat static veld `verbodenWoorden`: array met `"delete"`, `"drop"`, `"truncate"`
   - Privaat static veld `verbodenKarakters`: array met `'!'`, `'@'`, `'#'`, `'$'`, `'%'`

2. Voeg deze static methodes toe:
   - `AantalWoorden(string tekst)`: telt woorden op basis van spaties
   - `BevatVerbodenWoord(string tekst)`: geeft `true` als de tekst een verboden woord bevat
   - `BevatVerbodenKarakter(string tekst)`: geeft `true` als de tekst een verboden karakter bevat
   - `IsGeschiktVoorTitel(string tekst)`: geeft `true` als de tekst niet leeg is, minimaal 5 en maximaal 30 tekens lang is, en geen verboden woorden of karakters bevat

3. Zorg dat alle methodes null- en lege-string-veilig zijn.

## Verwacht resultaat

```
Oefening 3: tekst analyseren

'dit is een test':
 - bevat 4 woorden
 - is geschikt voor een titel
'gratis truncate aanbieding':
 - bevat 3 woorden
 - bevat verboden woord
 - is niet geschikt voor een titel
'Workshop C# basis':
 - bevat 3 woorden
 - bevat verboden karakter
 - is niet geschikt voor een titel
'delete titel':
 - bevat 2 woorden
 - bevat verboden woord
 - is niet geschikt voor een titel
'':
 - bevat 0 woorden
 - is niet geschikt voor een titel
```
