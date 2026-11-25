using System;
using System.Collections.Generic;

// Stap 2: schrijf in de map classes een klasse Auto (erft over van Voertuig):
// - extra property AantalDeuren
// - MaxPassagiers: altijd 5
// - constructor met merk, dagPrijs en aantalDeuren — roep base aan
// - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 5 deuren"
class Auto : Voertuig
{
   // extra property
   public int AantalDeuren { get; set; }
   public override int MaxPassagiers { get { return 5; } }

   // constructor
   public Auto(string merk, decimal dagPrijs, int aantalDeuren) : base(merk, dagPrijs)
   {
      AantalDeuren = aantalDeuren;
   }

   // tekstweergave: bouw verder op de basisklasse
   public override string ToString()
   {
      return $"{base.ToString()} — {AantalDeuren} deuren";
   }
}
