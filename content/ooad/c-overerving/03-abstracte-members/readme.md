# Abstracte property of methode

**Doel:** methodes maken die verplicht geïmplementeerd moeten worden in overgeërfde klassen.

## Theorie

Zie ook het hoofdstuk [Overerving](https://rogiervdl.github.io/CS-course/12_overerving.html) in de cursus.

Een **abstracte methode of property** heeft geen implementatie in de basisklasse. Elke subklasse is _verplicht_ om ze te implementeren met `override`.

```csharp
public abstract class Vorm
{
   public string Kleur { get; set; }

   // abstracte property: subklasse MOET deze implementeren
   public abstract double Oppervlakte { get; }

   // abstracte methode: subklasse MOET deze implementeren
   public abstract void Herschaal(double factor);
}

public class Cirkel : Vorm
{
   public double Straal { get; set; }
   public override double Oppervlakte { get  { return Math.PI * Straal * Straal; } }
   public override void Herschaal(double factor)
   {
      Straal *= factor;
   }
}

public class Rechthoek : Vorm
{
   public double Breedte { get; set; }
   public double Hoogte { get; set; }
   public override double Oppervlakte { get  { return Breedte * Hoogte; } }
   public override void Herschaal(double factor)
   {
      Breedte *= factor;
      Hoogte *= factor;
   }
}
```

Merk op hoe automatisch de juiste versie van `Oppervlakte` en `Herschaal()` geselecteerd wordt:

```csharp
List<Vorm> vormen = new List<Vorm>();
vormen.Add(new Cirkel { Kleur = "groen", Straal = 13.7 });
vormen.Add(new Rechthoek { Kleur = "blauw", Breedte = 210, Hoogte = 133 });

foreach (Vorm v in vormen)
{
   Console.WriteLine($"oppervlakte: {v.Oppervlakte}"); // compiler kiest automatisch de juiste versie van Oppervlakte
   v.Herschaal(2); // compiler kiest automatisch de juiste versie van Herschaal()
   Console.WriteLine($"na herschaling x2: {v.Oppervlakte}");
}
```

Dit noemt men **polymorfisme** ("meerdere vormen"): één methode voor de buitenwereld, intern verschillende implementaties—een uiterst belangrijk begrip in OO!

Gebruik abstract wanneer je subklassen wil _verplichten_ een methode te implementeren.

## Opgave

De klassen `ValidatieRegel`, `MinLengteRegel` en `BevatHoofdletterRegel` zijn al gegeven.

1. Markeer de klasse `ValidatieRegel` zelf als `abstract`. Verwijder de body van `IsGeldig` en de standaardwaarde van `FoutBoodschap` — maak ze beide `abstract`.
2. Voeg het keyword `override` toe aan `IsGeldig` en `FoutBoodschap` in `MinLengteRegel` en `BevatHoofdletterRegel`.
3. Voeg twee nieuwe validatieregels toe:
   - `BevatCijferRegel`: geeft een fout als er geen cijfer in de waarde zit (tip: gebruik `char.IsDigit`)
   - `MagNietBevattenRegel`: ontvangt een lijst verboden woorden en geeft een fout als de waarde er één bevat
4. Haal de twee commentaarregels in de lijst onderaan uit commentaar en controleer of het programma correct werkt.

## Verwacht resultaat

```
Voer een wachtwoord in: azerty1

✗ Waarde moet minstens 8 tekens bevatten.
✗ Waarde moet minstens één hoofdletter bevatten.
✓ BevatCijferRegel geslaagd
✗ Waarde mag geen van de volgende woorden bevatten: wachtwoord, 1234, Azerty.


Voer een wachtwoord in: !è12HjK?

✓ MinLengteRegel geslaagd
✓ BevatHoofdletterRegel geslaagd
✓ BevatCijferRegel geslaagd
✓ MagNietBevattenRegel geslaagd
```
