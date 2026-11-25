# Eenvoudige overerving

**Doel:** een klasse overerven van een andere klasse.

## Theorie

Zie ook het hoofdstuk [Overerving](https://rogiervdl.github.io/CS-course/12_overerving.html) in de cursus.

Met **overerving** kan een klasse de eigenschappen van een andere klasse overnemen. De klasse die overerft heet de **subklasse**, de klasse waarvan overgeërfd wordt de **basisklasse**.

```csharp
// basisklasse Dier
public class Dier
{
    public string Naam { get; set; }
    public int Leeftijd { get; set; }
}

// Hond erft Naam en Leeftijd over van Dier
public class Hond : Dier
{
   // eigen properties van Hond
   public string Ras { get; set; }       
   public bool IsGetraind { get; set; }
}
```

Voorbeeld van een `Hond` instantie:

```csharp
Hond jacky = new Hond {
   Naam = "Jacky",        // van Dier
   Leeftijd = 3,          // van Dier
   Ras = "Schnauzer",     // eigen
   IsGetraind = true      // eigen
};
```

## Opgave

De klasse `Klant` is al gegeven (in de map `classes`).

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
