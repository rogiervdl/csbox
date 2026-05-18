// Oplossing — Herhalingsoefening 3: voertuigverhuur

Console.WriteLine("Herhalingsoefening 3: voertuigverhuur");
Console.WriteLine("---------------------------------------");
Console.OutputEncoding = System.Text.Encoding.UTF8;

// vloot aanmaken
List<Voertuig> vloot = new()
{
   new Auto("Toyota Yaris", 45m, 5),
   new Auto("BMW X5", 90m, 5),
   new Bestelwagen("Ford Transit", 75m, 8.5),
   new Bestelwagen("Mercedes Sprinter", 85m, 12.0),
   new Fiets("Trek", 15m, false),
   new Fiets("Gazelle", 20m, true),
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
   else if (v is Fiets fiets)
   {
      Console.WriteLine($"  Fiets: {v.Merk} — {(fiets.IsElektrisch ? "elektrisch" : "klassiek")}");
   }
}

// ============================================================
// Klassen
// ============================================================

/// <summary>
/// Abstracte basisklasse voor alle voertuigen in het verhuurpark.
/// </summary>
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

   /// <summary>
   /// Berekent de totale huurprijs voor het opgegeven aantal dagen.
   /// </summary>
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

/// <summary>
/// Een personenwagen met een vast aantal deuren.
/// </summary>
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

/// <summary>
/// Een bestelwagen met een bepaald laadvolume.
/// </summary>
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

/// <summary>
/// Een fiets, eventueel met elektrische ondersteuning.
/// </summary>
class Fiets : Voertuig
{
   // extra property
   public bool IsElektrisch { get; set; }
   public override int MaxPassagiers { get { return 1; } }

   // constructor
   public Fiets(string merk, decimal dagPrijs, bool isElektrisch) : base(merk, dagPrijs)
   {
      IsElektrisch = isElektrisch;
   }

   // tekstweergave: bouw verder op de basisklasse
   public override string ToString()
   {
      return $"{base.ToString()} — {(IsElektrisch ? "elektrisch" : "klassiek")}";
   }
}
