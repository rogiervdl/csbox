using System;
using System.Collections.Generic;
using System.Linq;

internal class Cardio : Workout
{
   public double AfstandInKm { get; set; }

   // 6 punten per kilometer
   public override int Punten => (int)(AfstandInKm * 6);
}
