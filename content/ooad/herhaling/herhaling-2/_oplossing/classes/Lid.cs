using System;
using System.Collections.Generic;

// Stap 2: schrijf in de map classes een klasse Lid
// - property die bijhoudt hoeveel leden er momenteel actief zijn
// - property met de naam van dit lid
// - property met het lidtype van dit lid
// - property of dit lid actief is (standaard true, private setter)
// - constructor met naam en lidtype: kent automatisch een oplopend lidnummer toe
// - methode BerekenKortingsPercentage() met lidtype als parameter: Junior 50%, Senior 10%, Veteraan 30%
// - methode Deactiveer(): stelt dit lid inactief; doet niets als al inactief
// - ToString() naar dit voorbeeld: "#1 Jana Peeters | Senior | actief"
class Lid
{
   // statische property: gedeeld over alle instanties
   public static int AantalActief { get; private set; }

   // instantieproperties: eigen aan dit lid
   public string Naam { get; set; }
   public Lidtype Lidtype { get; set; }
   public bool IsActief { get; private set; } = true;

   // constructor: ken een oplopend lidnummer toe en verhoog de tellers
   public Lid(string naam, Lidtype lidtype)
   {
      Naam = naam;
      Lidtype = lidtype;
      AantalActief++;
   }

   /// Geeft het kortingspercentage terug voor een bepaald lidtype.
   public static int BerekenKortingsPercentage(Lidtype type)
   {
      if (type == Lidtype.Junior) return 50;
      if (type == Lidtype.Veteraan) return 30;
      return 10;
   }

   /// Stelt dit lid in als inactief en verlaagt de actieve teller.
   /// Doet niets als het lid al inactief is.
   public void Deactiveer()
   {
      if (!IsActief) return;
      IsActief = false;
      AantalActief--;
   }

   // tekstweergave: "Jana Peeters | Senior | actief"
   public override string ToString()
   {
      return $"{Naam} | {Lidtype} | {(IsActief ? "actief" : "inactief")}";
   }
}
