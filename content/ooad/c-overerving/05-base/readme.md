# base

**Doel:** de constructor en methodes van de basisklasse aanroepen vanuit een subklasse.

## Theorie

Zie ook het hoofdstuk [Overerving](https://rogiervdl.github.io/CS-course/12_overerving.html) in de cursus.

Met `base` roep je iets op uit de basisklasse. Er zijn twee gebruiken:

- `base(...)` in de constructor — roept de constructor van de basisklasse op
- `base.Methode()` in een override — roept de implementatie van de basisklasse op

```csharp
public class Fiets
{
   public string Merk { get; set; }
   public int Versnellingen { get; set; }

   public Fiets(string merk, int versnellingen)
   {
      Merk = merk;
      Versnellingen = versnellingen;
   }

   public override string ToString() => $"{Merk}, {Versnellingen} versnellingen";
}

public class ElektrischeFiets : Fiets
{
   public int Kwh { get; set; }

   // base(...): roept constructor van Fiets op
   public ElektrischeFiets(string merk, int versnellingen, int kwh) : base(merk, versnellingen)
   {
      Kwh = kwh;
   }

   // base.ToString(): bouwt verder op de output van Fiets
   public override string ToString() => $"{base.ToString()}, batterij {Kwh} kWh";
}
```

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
