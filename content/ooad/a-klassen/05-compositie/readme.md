# Compositie

**Doel:** compositie — een klasse gebruiken als type van een property in een andere klasse.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Bij **compositie** gebruik je een klasse als type van een property in een andere klasse. Zo bouw je complexe objecten op uit eenvoudigere bouwstenen ("heeft een"-relatie).

```csharp
public class Speler
{
    public string Naam { get; set; }
    public int Rugnummer { get; set; }
    public override string ToString() => $"#{Rugnummer} {Naam}";
}

public class Team
{
    public string Naam { get; set; }
    public string Stad { get; set; }
    public List<Speler> Spelers { get; set; } = new List<Speler>(); // compositie: gebruik klasse Speler in klasse Team
    public int AantalSpelers => Spelers.Count;
}
```

Gebruik:

```csharp
Team t = new Team { Naam = "FC Demo", Stad = "Gent" };
t.Spelers.Add(new Speler { Naam = "Ali Bouazza", Rugnummer = 9 }); // voeg Speler toe aan Team
t.Spelers.Add(new Speler { Naam = "Nora Claes", Rugnummer = 7 }); // voeg Speler toe aan Team

Console.WriteLine($"{t.Naam} heeft {t.AantalSpelers} spelers:");
foreach (Speler s in t.Spelers)
{
   Console.WriteLine($"  {s}"); 
}
```

## Opgave

Gegeven zijn de klassen `Product` en `Bestelling`. `Bestelling` bevat een `List<Product>` (compositie). Ook gegeven is een lijst van 10 producten.

1. Maak twee bestellingen aan:
   - **Bestelling 1**: id = 1, klantnaam = "Amara Diallo", producten = Laptop, Rugzak en Webcam
   - **Bestelling 2**: id = 2, klantnaam = "Yuna Kim", producten = Laptop en Monitor

2. Implementeer de property `TotaalBedrag` in de klasse `Bestelling` en test of het totaalbedrag van bestelling 1 correct is.

3. Toon de details van bestelling 1 en van elk product dat erin zit (gebruik `ToString()`).

4. Geef 5% korting op alle producten in bestelling 2 (gebruik de property `Korting`) en toon daarna de details.

## Verwacht resultaat

```
Oefening 5: compositie
-------------
Totaalbedrag bestelling 1: 1124,44
details bestelling 1: #1 — Amara Diallo | 3 product(en) | € 1124,44 | Bezig
  - [9112] Laptop - € 999,99 | in voorraad
  - [3033] Rugzak - € 59,95 | in voorraad
  - [7390] Webcam - € 64,50 | in voorraad
details bestelling 2: #2 — Yuna Kim | 2 product(en) | € 1376,54 | Bezig
  - [9112] Laptop - € 949,99 | in voorraad
  - [8823] Monitor - € 426,55 | in voorraad
```
