using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Oefening 4 — is en as: type controle en veilige cast bij overerving
/// </summary>
public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 4: is en as");
      Console.WriteLine("-------------");

      List<Workout> workouts = new()
      {
         new Cardio
         {
            Naam = "Ochtendrun",
            Beschrijving = "Rustig tempo door het park",
            AfstandInKm = 5.2
         },
         new Krachttraining
         {
            Naam = "Bench press",
            Beschrijving = "Borstspieren",
            Gewicht = 60,
            Reps = 12
         },
         new Stretching
         {
            Naam = "Rugstretching",
            Beschrijving = "Na het tillen",
            LichaamsDeel = LichaamsDeel.Rug
         },
         new Cardio
         {
            Naam = "Fietstocht",
            Beschrijving = "Intervaltraining",
            AfstandInKm = 22.0
         },
         new Krachttraining
         {
            Naam = "Squat",
            Beschrijving = "Beenspieren",
            Gewicht = 80,
            Reps = 8
         },
         new Stretching
         {
            Naam = "Nekrol",
            Beschrijving = "Ontspanning na beeldschermwerk",
            LichaamsDeel = LichaamsDeel.Nek
         },
      };

      // TODO 1: toon info per workout met is/as of pattern matching
      Console.WriteLine("Overzicht workouts:");
      foreach (Workout w in workouts)
      {
         if (w is Cardio c)
         {
            Console.WriteLine($"  [Cardio]         {c.Naam} — {c.AfstandInKm} km");
         }
         else if (w is Krachttraining k)
         {
            Console.WriteLine($"  [Krachttraining] {k.Naam} — {k.Gewicht} kg × {k.Reps} reps");
         }
         else if (w is Stretching s)
         {
            Console.WriteLine($"  [Stretching]     {s.Naam} — {s.LichaamsDeel}");
         }
      }
      Console.WriteLine();

      // TODO 2: bereken en toon de totale punten per type (Cardio, Krachttraining, Stretching)
      int puntenCardio = 0, puntenKracht = 0, puntenStretching = 0;
      foreach (Workout w in workouts)
      {
         if (w is Cardio)
         {
            puntenCardio += w.Punten;
         }
         else if (w is Krachttraining)
         {
            puntenKracht += w.Punten;
         }
         else if (w is Stretching)
         {
            puntenStretching += w.Punten;
         }
      }
      Console.WriteLine("Totale punten per type:");
      Console.WriteLine($"  Cardio:         {puntenCardio}");
      Console.WriteLine($"  Krachttraining: {puntenKracht}");
      Console.WriteLine($"  Stretching:     {puntenStretching}");
   }
}
