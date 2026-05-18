# Constructors

**Doel:** constructors met parameters; constructor chaining met `:this()`.

## Opgave

Gegeven is de klasse `ProfielInfo` met properties voor verplichte info (`Id`, `Gebruikersnaam`, `Email`, `AanmaakDatum`) en optionele info (`Voornaam`, `Achternaam`, `Biografie`, `Website`, `IsPubliek`).

1. Breid de klasse uit met twee constructors:
   - Een constructor met enkel de verplichte gegevens als parameters: `Id`, `Gebruikersnaam`, `Email`. Stel ook `AanmaakDatum` in op `DateTime.Now`.
   - Een constructor met alle properties als parameters — gebruik `:this()` om de code van de eerste constructor te hergebruiken.

2. Voeg een berekende property `IsVolledig` toe die `true` geeft als alle optionele gegevens (`Voornaam`, `Achternaam`, `Biografie`, `Website`) ingevuld zijn.

3. Voeg een `override ToString()` toe naar voorbeeld van het verwacht resultaat.

## Verwacht resultaat

```
Oefening 6: constructors
-------------
kaito99 - publiek | profiel is onvolledig
priya_s - publiek | profiel is volledig
carlos_m - privé | profiel is onvolledig
```
