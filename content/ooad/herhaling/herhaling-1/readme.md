# Herhalingsoefening 1: muziekalbum

**Doel:** herhaling van klassen, properties, validatie, berekende properties, methodes, `ToString()`, compositie en constructors.

## Klasse `Nummer`

Maak een klasse `Nummer` met volgende members:

- Automatische property `Titel` met standaardwaarde "onbekend nummer"
- Property `DuurInSeconden`: geheel getal, met validatie: de waarde moet groter dan nul zijn, anders gooi je een `ArgumentException` met als waarde "Duur moet groter zijn dan nul."
- Berekende property `DuurAlsTekst`: de duur in formaat `3:42` (tip: gebruik gehele deling en rest na deling om minuten en seconden te berekenen uit de duur)
- Twee constructors:
  - constructor met één parameter: duur in seconden
  - constructor met drie parameters: titel, minuten en seconden: roep de eerste constructor aan waarbij je de duur in seconden meegeeft als minuten * 60 + seconden, en stel daarna de titel in
- `ToString()` naar dit voorbeeld: `"Alone Again (4:02)"`

## Klasse `Album`

Maak een klasse `Album` met volgende members:

- Property `Titel` met standaardwaarde "onbekend album"
- Properties `Jaar` en `Nummers` (standaard lege lijst)
- Constructor met twee parameters: titel en jaar
- Berekende property `IsEp`: `true` als het album 4 of minder nummers bevat
- Methode `VoegNummerToe()`: voegt een nummer toe aan de lijst
- `ToString()`: zie verwacht resultaat hieronder

## Testcode

Haal de testcode uit commentaar en controleer of het overeenkomt met het verwachte resultaat:

```
After Hours (2020) | 5 nummer(s) | LP
  1. Alone Again (4:02)
  2. Too Late (3:59)
  3. Hardest to Love (4:09)
  4. Scared to Live (3:11)
  5. Onbekend nummer (5:10)

Nacht (2017) | 3 nummer(s) | EP
  1. Goud (3:47)
  2. Chaos (4:12)
  3. Wolf (2:34)

```
