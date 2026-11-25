# Statische methodes

**Doel:** statische methodes gebruiken die aanroepbaar zijn via de klassenaam, zonder een object aan te maken.

## Theorie

Zie ook het hoofdstuk [Static & Enum](https://rogiervdl.github.io/CS-course/11_static_enum.html) in de cursus.

Een **statische methode** roep je aan via de klassenaam, zonder een object aan te maken. Ze heeft enkel toegang tot statische properties, niet object properties.

```csharp
public class Validator
{
   // static methode: aanroepen via Validator.IsGeldigEmail(...)
   public static bool IsGeldigEmail(string email)
   {
      return email.Contains("@") && email.Contains(".");
   }
}

bool ok = Validator.IsGeldigEmail("test@mail.be"); // methode opgeroepen rechtstreeks vanop de klasse
```

Met `Regex.IsMatch()` controleer je een string tegen een **reguliere expressie** (patroon). Enkele veelgebruikte symbolen:

```csharp
// [A-Z]   → één hoofdletter
// \d      → één cijfer
// {3}     → exact 3 keer
// ^...$   → match volledig (begin tot einde)

string patroon = @"^[A-Z]{3}\d{2}$"; // bv. "ABC12"
bool geldig = Regex.IsMatch("ABC12", patroon); // true
bool ongeldig = Regex.IsMatch("ab12", patroon); // false
```

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
