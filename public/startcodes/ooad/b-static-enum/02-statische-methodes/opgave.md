# Statische methodes

**Doel:** statische methodes gebruiken die aanroepbaar zijn via de klassenaam, zonder een object aan te maken.

## Opgave

1. Maak een klasse `CouponCode`:
   - Private static veld: `_couponRegex = @"^[A-Z]{3}\d{2}-[A-Z]{2}$"`
   - Property `Code` (string)
   - Berekende property `IsGeldig` (bool, alleen getter): gebruik `Regex.IsMatch()` om te controleren of `Code` aan het patroon voldoet
   - Constructor met één parameter

2. Voeg een static methode `ControleerCode(string code)` toe die `true` of `false` teruggeeft.

3. Voeg een static methode `Beschrijf(string code)` toe:
   - Als de code geldig is: `"Prefix=ABC, Nummer=12, Regio=DE"`
   - Als de code ongeldig is: `"ongeldige code"`

## Verwacht resultaat

```
Oefening 2: couponcodes controleren
-------------

testen IsGeldig() methode:

Code ABC12-DE is geldig
Code AB12-DE is ongeldig
Code XYZ99-BE is geldig

testen Beschrijf() methode:

Code ABC12-DE: Prefix=ABC, Nummer=12, Regio=DE
Code AB12-DE: ongeldige code
Code XYZ99-BE: Prefix=XYZ, Nummer=99, Regio=BE
```
