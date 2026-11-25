using System;
using System.Collections.Generic;

// Stap 1: schrijf in de map classes een abstracte klasse Voertuig:
// - properties Merk en DagPrijs
// - abstracte property MaxPassagiers
// - constructor met merk en dagPrijs
// - methode BerekenHuurprijs() met aantal dagen als parameter: geeft DagPrijs × dagen terug
// - ToString(): "Toyota Yaris (max. 5 passagier(s)) — €45,00/dag"
abstract class Voertuig
{
   // properties
   public string Merk { get; set; }
   public decimal DagPrijs { get; set; }
   public abstract int MaxPassagiers { get; }

   // constructor
   public Voertuig(string merk, decimal dagPrijs)
   {
      Merk = merk;
      DagPrijs = dagPrijs;
   }

   // Berekent de totale huurprijs voor het opgegeven aantal dagen.
   public decimal BerekenHuurprijs(int dagen)
   {
      return DagPrijs * dagen;
   }

   // tekstweergave: "Toyota Yaris (max. 5 passagier(s)) — €45,00/dag"
   public override string ToString()
   {
      return $"{Merk} (max. {MaxPassagiers} passagier(s)) — €{DagPrijs:F2}/dag";
   }
}
