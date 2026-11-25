using System;
using System.Collections.Generic;
using System.Linq;

internal abstract class Workout
{
   public string Naam { get; set; } = string.Empty;
   public string Beschrijving { get; set; } = string.Empty;

   public abstract int Punten { get; }

   public override string ToString()
   {
      return $"{Naam} ({Punten} punten) — {Beschrijving}";
   }
}
