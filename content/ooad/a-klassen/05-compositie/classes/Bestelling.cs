using System;
using System.Collections.Generic;

class Bestelling
{
   public int BestellingId { get; set; }
   public DateTime Datum { get; set; } = DateTime.Now;
   public string KlantNaam { get; set; }
   // 1. Voeg hier een property Producten toe van type List<Product>

   public string Status
   {
      get;
      set
      {
         string[] toegelaten = { "Bezig", "Afgerond", "Geannuleerd" };
         if (!toegelaten.Contains(value)) throw new ArgumentException($"Ongeldige status: {value}");
         field = value;
      }
   } = "Bezig";

   // 2. Implementeer TotaalBedrag: som van PrijsMetKorting van alle producten in de lijst
   public decimal TotaalBedrag
   {
      get
      {
         return 0; // vervang door echte implementatie
      }
   }

   public override string ToString()
   {
      return $"#{BestellingId} — {KlantNaam} | 0 product(en) | € {TotaalBedrag:F2} | {Status}"; // pas het aantal producten aan
   }
}
