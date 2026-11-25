using System;
using System.Collections.Generic;
using System.Linq;

internal class Krachttraining : Workout
{
   public double Gewicht { get; set; }
   public int Reps { get; set; }

   // gewicht (kg) × herhalingen / 5
   public override int Punten => (int)(Gewicht * Reps / 5);
}
