Console.WriteLine("Oefening 4: is en as");
Console.WriteLine("-------------");

// De klassen Workout, Cardio, Krachttraining, Stretching en enum LichaamsDeel zijn al gegeven.
//
// 1. Voeg in elke subklasse een readonly property Punten toe:
//    - Cardio: AfstandInKm * 6 (afronden naar int)
//    - Krachttraining: (Gewicht * Reps) / 5 (afronden naar int)
//    - Stretching: altijd 10
// 2. Haal Workout.ToString() uit commentaar
// 3. Vervang "// TODO 1" door code die per workout de info toont (gebruik is/as of pattern matching)
// 4. Vervang "// TODO 2" door code die de totale punten per type berekent en toont

List<Workout> workouts = new List<Workout>
{
   new Cardio { Naam = "Ochtendrun", Beschrijving = "Rustig tempo door het park", AfstandInKm = 5.2 },
   new Krachttraining { Naam = "Bench press", Beschrijving = "Borstspieren", Gewicht = 60, Reps = 12 },
   new Stretching { Naam = "Rugstretching", Beschrijving = "Na het tillen", LichaamsDeel = LichaamsDeel.Rug },
   new Cardio { Naam = "Fietstocht", Beschrijving = "Intervaltraining", AfstandInKm = 22.0 },
   new Krachttraining { Naam = "Squat", Beschrijving = "Beenspieren", Gewicht = 80, Reps = 8 },
   new Stretching { Naam = "Nekrol", Beschrijving = "Ontspanning na beeldschermwerk", LichaamsDeel = LichaamsDeel.Nek },
};

Console.WriteLine("Overzicht workouts:");
// TODO 1: toon info per workout met is/as of pattern matching
// ...

Console.WriteLine();
Console.WriteLine("Totale punten per type:");
// TODO 2: bereken en toon de totale punten per type (Cardio, Krachttraining, Stretching)
// ...

// ============================================================
// Klassen en enums
// ============================================================

abstract class Workout
{
   public string Naam { get; set; } = string.Empty;
   public string Beschrijving { get; set; } = string.Empty;

   // 2. Haal dit uit commentaar (nadat je Punten hebt toegevoegd aan de subklassen)
   //public override string ToString()
   //{
   //    return $"{Naam} ({Punten} punten) — {Beschrijving}";
   //}
}

class Cardio : Workout
{
   public double AfstandInKm { get; set; }
   // 1. Voeg Punten toe: AfstandInKm * 6 (afronden naar int)
}

class Krachttraining : Workout
{
   public double Gewicht { get; set; }
   public int Reps { get; set; }
   // 1. Voeg Punten toe: (Gewicht * Reps) / 5 (afronden naar int)
}

class Stretching : Workout
{
   public LichaamsDeel LichaamsDeel { get; set; }
   // 1. Voeg Punten toe: altijd 10
}

enum LichaamsDeel
{
   Rug,
   Schouders,
   Borst,
   Benen,
   Heupen,
   Nek,
   Armen,
}
