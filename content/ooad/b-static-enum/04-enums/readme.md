# Enums

**Doel:** een enum definiëren en gebruiken als type van een property.

## Theorie

Zie ook het hoofdstuk [Static & Enum](https://rogiervdl.github.io/CS-course/11_static_enum.html) in de cursus.

Een **enum** is een type met een vaste set benoemde waarden. Het maakt code leesbaarder dan losse getallen of strings.

```csharp
public enum SeizoenType
{
   Lente,
   Zomer,
   Herfst,
   Winter
}
```

Je gebruikt een enum zoals elk ander gegevenstype, b.v. voor een property in een klasse:

```csharp
public class Activiteit
{
   public string Naam { get; set; }
   public SeizoenType BesteSeizoen { get; set; }
}

Activiteit a = new Activiteit { Naam = "Zwemmen", BesteSeizoen = SeizoenType.Zomer };

if (a.BesteSeizoen == SeizoenType.Zomer)
{
   Console.WriteLine("Ideaal in de zomer!");
}
```

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
