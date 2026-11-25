using System;
using System.Collections.Generic;

// Stap 1: schrijf in de map classes een klasse Nummer (details zie opgave):
// - Properties: Titel, DuurInSeconden
// - Berekende property: DuurAlsTekst
// - Constructor met 1 parameter: duurInSeconden
// - Constructor met 3 parameters: titel, minuten, seconden
// - ToString()
class Nummer
{
   // properties
   public string Titel { get; set; } = "Onbekend nummer";

   public int DuurInSeconden
   {
      get;
      set
      {
         if (value <= 0)
         {
            throw new ArgumentException("Duur moet groter zijn dan nul.");
         }
         field = value;
      }
   }

   // berekende property: minuten en seconden als tekst
   public string DuurAlsTekst
   {
      get
      {
         int minuten = DuurInSeconden / 60;
         int seconden = DuurInSeconden % 60;
         return $"{minuten}:{seconden:D2}";
      }
   }

   // constructor met totaal seconden
   public Nummer(int duurInSeconden)
   {
      DuurInSeconden = duurInSeconden;
   }

   // constructor met titel, minuten en seconden
   public Nummer(string titel, int minuten, int seconden) : this(minuten * 60 + seconden)
   {
      Titel = titel;
   }

   // tekstweergave: "Alone Again (4:02)"
   public override string ToString()
   {
      return $"{Titel} ({DuurAlsTekst})";
   }
}
