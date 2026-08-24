using System;
using System.Collections.Generic;

// Herhalingsoefening 3: voertuigverhuur
// =====================================

// Stap 1: schrijf hier een abstracte klasse Voertuig:
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

// Stap 2: schrijf hier een klasse Auto (erft over van Voertuig):
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

// Stap 3: schrijf hier een klasse Bestelwagen (erft over van Voertuig):
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

// Stap 4: haal de testcode uit commentaar (verwijder /* en */)
class Program
{
   static void Main(string[] args)
   {
      Console.OutputEncoding = System.Text.Encoding.UTF8;

      // maak vloot aan
      List<Voertuig> vloot = new()
      {
         new Auto("Toyota Yaris", 45m, 5),
         new Auto("BMW X5", 90m, 5),
         new Bestelwagen("Ford Transit", 75m, 8.5),
         new Bestelwagen("Mercedes Sprinter", 85m, 12.0),
      };

      // toon alle voertuigen
      Console.WriteLine("Volledig aanbod:");
      foreach (Voertuig v in vloot)
      {
         Console.WriteLine($"  {v}");
      }

      // huurprijs voor 3 dagen
      Console.WriteLine("\nHuurprijs voor 3 dagen:");
      foreach (Voertuig v in vloot)
      {
         Console.WriteLine($"  {v.Merk}: €{v.BerekenHuurprijs(3):F2}");
      }

      // type-specifieke info via is/pattern matching
      Console.WriteLine("\nDetails per voertuig:");
      foreach (Voertuig v in vloot)
      {
         if (v is Auto auto)
         {
            Console.WriteLine($"  Auto: {auto}");
         }
         else if (v is Bestelwagen bestel)
         {
            Console.WriteLine($"  Bestelwagen: {bestel}");
         }
      }
   }
}
