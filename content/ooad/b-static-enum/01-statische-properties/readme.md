# Statische properties

**Doel:** statische properties toevoegen die gedeeld worden over alle instanties van een klasse.

## Theorie

Zie ook het hoofdstuk [Static & Enum](https://rogiervdl.github.io/CS-course/11_static_enum.html) in de cursus.

Een **statische property** hoort bij de _klasse_, niet bij een instantie. Ze wordt gedeeld over alle objecten en aangesproken via de klassenaam.

```csharp
public class Teller
{
   public static int AantalAangemaakt { get; private set; }
   public string Naam { get; set; }

   public Teller(string naam)
   {
      Naam = naam;
      AantalAangemaakt++; // verhoog de gemeenschappelijke teller
   }
}

Teller t1 = new Teller("Alice");
Teller t2 = new Teller("Bob");
Console.WriteLine(Teller.AantalAangemaakt); // 2 — via klassenaam 'Teller'
```

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
