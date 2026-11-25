using System;
using System.Collections.Generic;
using System.Linq;

internal class Bestelling
{
   // Properties
   public int BestellingId { get; set; }
   public DateTime Datum { get; set; } = DateTime.Now;
   public string KlantNaam { get; set; }
   public List<Product> Producten { get; set; } = new List<Product>();
   public string Status
   {
      get;
      set
      {
         string[] toegelaten = { "Bezig", "Afgerond", "Geannuleerd" };
         if (!toegelaten.Contains(value))
         {
            throw new ArgumentException($"Ongeldige status: {value}");
         }

         field = value;
      }
   } = "Bezig";

   // Berekende properties
   public decimal TotaalBedrag
   {
      get
      {
         // return 0; // verwijder deze regel en implementeer deze property
         // ...
         return Producten.Sum(p => p.PrijsMetKorting);
      }
   }

   // ToString override
   public override string ToString()
   {
      return $"#{BestellingId} — {KlantNaam} | {Producten.Count} product(en) | € {TotaalBedrag:F2} | {Status}";
   }
}
