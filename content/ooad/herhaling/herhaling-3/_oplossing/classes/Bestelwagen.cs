using System;
using System.Collections.Generic;

// Stap 3: schrijf in de map classes een klasse Bestelwagen (erft over van Voertuig):
// - extra property LaadruimteM3 (double)
// - MaxPassagiers: altijd 2
// - constructor met merk, dagPrijs en laadruimteM3 — roep base aan
// - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 8,5 m³ laadruimte"
class Bestelwagen : Voertuig
{
   // extra property
   public double LaadruimteM3 { get; set; }
   public override int MaxPassagiers { get { return 2; } }

   // constructor
   public Bestelwagen(string merk, decimal dagPrijs, double laadruimteM3) : base(merk, dagPrijs)
   {
      LaadruimteM3 = laadruimteM3;
   }

   // tekstweergave: bouw verder op de basisklasse
   public override string ToString()
   {
      return $"{base.ToString()} — {LaadruimteM3:F1} m³ laadruimte";
   }
}
