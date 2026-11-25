using System;
using System.Collections.Generic;

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
