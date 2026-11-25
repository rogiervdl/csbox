# is en as

**Doel:** het type van een object controleren met `is` en casten naar een subklasse met `as`.

## Theorie

Zie ook het hoofdstuk [Overerving](https://rogiervdl.github.io/CS-course/12_overerving.html) in de cursus.

Met `is` controleer je of een object van een bepaald type is. Met `as` cast je naar een subklasse — het resultaat is `null` als het type niet klopt (geen exception). Codevoorbeeld:

```csharp
// basisklasse
class Gebruiker {
   public int Id { get; set; }
   public string Naam { get; set; }
}

// afgeleide klassen
class Medewerker : Gebruiker {
   public int ToegangsCode { get; set; }
}
class Klant : Gebruiker {
   public string KlantNummer { get; set; }
}

// maak enkele gebruikers
List<Gebruiker> gebruikers = new List<Gebruiker>();
gebruikers.Add(new Medewerker() { Id = 1, Naam = "An Janssen", ToegangsCode = 4872 });
gebruikers.Add(new Klant() { Id = 2, Naam = "Marc Pieters", KlantNummer = "KL-00123" });
gebruikers.Add(new Medewerker() { Id = 3, Naam = "Sara Leclercq", ToegangsCode = 9341 });
gebruikers.Add(new Klant() { Id = 4, Naam = "Jonas De Smet", KlantNummer = "KL-00456" });

// itereer over gebruikers, en parse telkens met "is" en "as"
foreach (Gebruiker user in gebruikers) {
   if (user is Medewerker) {
      Medewerker mw = user as Medewerker;
      Console.WriteLine($"Medewerker {mw.Naam} heeft toegangscode {mw.ToegangsCode}");
   }
   if (g is Klant) {
      Klant kl = user as Klant;
      Console.WriteLine($"Klant {kl.Naam} heeft klantnummer {kl.KlantNummer}");
   }
}
```

In moderne C# kan je `is` en `as` in één stap combineren:

```csharp
// "is" en "as" in één stap gecombineerd
if (user is Medewerker as mw) {
   Console.WriteLine($"Medewerker {mw.Naam} heeft toegangscode {mw.ToegangsCode}");
}
```

## Opgave

De klassen `Workout`, `Cardio`, `Krachttraining`, `Stretching` en de enum `LichaamsDeel` zijn al gegeven.

1. Voeg in elke subklasse een readonly property `Punten` (type `int`) toe:
   - `Cardio`: `AfstandInKm * 6` (afronden naar int)
   - `Krachttraining`: `(Gewicht * Reps) / 5` (afronden naar int)
   - `Stretching`: altijd `10`
2. Haal `Workout.ToString()` uit commentaar.
3. Vervang `// TODO 1` door code die per workout de info toont (gebruik `is`/`as` of pattern matching).
4. Vervang `// TODO 2` door code die de totale punten per type berekent en toont.

## Verwacht resultaat

```
Oefening 4: is en as
-------------
Overzicht workouts:
  [Cardio]         Ochtendrun — 5,2 km
  [Krachttraining] Bench press — 60 kg × 12 reps
  [Stretching]     Rugstretching — Rug
  [Cardio]         Fietstocht — 22 km
  [Krachttraining] Squat — 80 kg × 8 reps
  [Stretching]     Nekrol — Nek

Totale punten per type:
  Cardio:         163
  Krachttraining: 272
  Stretching:     20
```
