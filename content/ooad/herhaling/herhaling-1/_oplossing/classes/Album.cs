using System;
using System.Collections.Generic;

// Stap 2: schrijf in de map classes een klasse Album (details zie opgave):
// - Properties: Titel, Jaar, Nummers
// - Constructor met 2 parameters: titel, jaar
// - Berekende property IsEp
// - Methode VoegNummerToe()
// - ToString()
class Album
{
   // properties
   public string Titel { get; set; }
   public int Jaar { get; set; }
   public List<Nummer> Nummers { get; set; } = new();

   // berekende property: EP als 4 of minder nummers, anders LP
   public bool IsEp
   {
      get { return Nummers.Count <= 4; }
   }

   // constructor
   public Album(string titel, int jaar)
   {
      Titel = titel;
      Jaar = jaar;
   }

   /// Voegt een nummer toe aan de lijst van dit album.
   public void VoegNummerToe(Nummer nummer)
   {
      Nummers.Add(nummer);
   }

   // tekstweergave: "After Hours (2020) | 5 nummer(s) | LP"
   public override string ToString()
   {
      return $"{Titel} ({Jaar}) | {Nummers.Count} nummer(s) | {(IsEp ? "EP" : "LP")}";
   }
}
