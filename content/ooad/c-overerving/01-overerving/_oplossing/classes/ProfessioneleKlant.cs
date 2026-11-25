using System;
using System.Collections.Generic;
using System.Linq;

internal class ProfessioneleKlant : Klant
{
   public string BedrijfsNaam { get; set; } = string.Empty;
   public string BtwNummer { get; set; } = string.Empty;

   public override string ToString()
   {
      return $"{Naam} ({Email}) - {BedrijfsNaam} (BTW: {BtwNummer})";
   }
}
