using System;
using System.Collections.Generic;

class Krachttraining : Workout
{
   public double Gewicht { get; set; }
   public int Reps { get; set; }
   // 1. Voeg Punten toe: (Gewicht * Reps) / 5 (afronden naar int)
}
