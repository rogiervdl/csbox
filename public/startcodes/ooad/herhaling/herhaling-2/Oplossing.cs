using System;
using System.Collections.Generic;

// Herhalingsoefening 2: sportclubleden
// ====================================

// Stap 1: schrijf hier een enumeratie Lidtype
// - waarden: Junior, Senior, Veteraan
enum Lidtype
{
   Junior,
   Senior,
   Veteraan,
}

// Stap 2: schrijf hier een klasse Lid
// - property die bijhoudt hoeveel Lid-objecten er ooit aangemaakt zijn
// - property die bijhoudt hoeveel leden er momenteel actief zijn
// - property met uniek volgnummer van dit lid, automatisch toegekend bij aanmaak (private setter)
// - property met de naam van dit lid
// - property met het lidtype van dit lid
// - property of dit lid actief is (standaard true, private setter)
// - constructor met naam en lidtype: kent automatisch een oplopend lidnummer toe
// - methode GeefKortingsPercentage() met lidtype als parameter: Junior 50%, Senior 10%, Veteraan 30%
// - methode Deactiveer(): stelt dit lid inactief; doet niets als al inactief
// - ToString() naar dit voorbeeld: "#1 Jana Peeters | Senior | actief"
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

// Stap 3: haal de testcode uit commentaar (verwijder /* en */)
class Program
{
   static void Main(string[] args)
   {
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
   }
}
