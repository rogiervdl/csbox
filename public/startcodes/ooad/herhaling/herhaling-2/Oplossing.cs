// Oplossing — Herhalingsoefening 2: sportclubleden

Console.WriteLine("Herhalingsoefening 2: sportclubleden");
Console.WriteLine("-------------------------------------");

// maak vijf leden aan
Lid l1 = new("Jana Peeters", Lidtype.Senior);
Lid l2 = new("Mathis Dubois", Lidtype.Junior);
Lid l3 = new("Rosa Martínez", Lidtype.Veteraan);
Lid l4 = new("Luca De Smet", Lidtype.Senior);
Lid l5 = new("Amira Khalil", Lidtype.Junior);

// tellers na aanmaak
Console.WriteLine($"Totaal aangemaakt: {Lid.AantalLeden}");
Console.WriteLine($"Actief: {Lid.AantalActief}");

// deactiveer twee leden
l2.Deactiveer();
l4.Deactiveer();
Console.WriteLine($"Actief na wijzigingen: {Lid.AantalActief}");

// kortingen per lidtype
Console.WriteLine($"Korting Junior: {Lid.GeefKortingsPercentage(Lidtype.Junior)}%");
Console.WriteLine($"Korting Senior: {Lid.GeefKortingsPercentage(Lidtype.Senior)}%");
Console.WriteLine($"Korting Veteraan: {Lid.GeefKortingsPercentage(Lidtype.Veteraan)}%");

// overzicht
Console.WriteLine();
List<Lid> leden = new() { l1, l2, l3, l4, l5 };
foreach (Lid lid in leden)
{
   Console.WriteLine(lid);
}

// ============================================================
// Klassen en enums
// ============================================================

/// <summary>
/// Soort lidmaatschap van een sportclub.
/// </summary>
enum Lidtype
{
   Junior,
   Senior,
   Veteraan,
}

/// <summary>
/// Stelt een lid van een sportclub voor.
/// </summary>
class Lid
{
   // statische properties: gedeeld over alle instanties
   public static int AantalLeden { get; private set; }
   public static int AantalActief { get; private set; }

   // instantieproperties: eigen aan dit lid
   public int LidNummer { get; private set; }
   public string Naam { get; set; }
   public Lidtype Lidtype { get; set; }
   public bool IsActief { get; private set; } = true;

   // constructor: ken een oplopend lidnummer toe en verhoog de tellers
   public Lid(string naam, Lidtype lidtype)
   {
      Naam = naam;
      Lidtype = lidtype;
      AantalLeden++;
      AantalActief++;
      LidNummer = AantalLeden;
   }

   /// <summary>
   /// Geeft het kortingspercentage terug voor een bepaald lidtype.
   /// </summary>
   public static int GeefKortingsPercentage(Lidtype type)
   {
      if (type == Lidtype.Junior) return 50;
      if (type == Lidtype.Veteraan) return 30;
      return 10;
   }

   /// <summary>
   /// Stelt dit lid in als inactief en verlaagt de actieve teller.
   /// Doet niets als het lid al inactief is.
   /// </summary>
   public void Deactiveer()
   {
      if (!IsActief) return;
      IsActief = false;
      AantalActief--;
   }

   // tekstweergave: "#1 Jana Peeters | Senior | actief"
   public override string ToString()
   {
      return $"#{LidNummer} {Naam} | {Lidtype} | {(IsActief ? "actief" : "inactief")}";
   }
}
