using System;
using System.Collections.Generic;
using System.Linq;

internal class Bestelling
{
   public string KlantNaam { get; set; }
   public string ProductNaam { get; set; }
   public BestelStatus Status { get; set; }

   public bool KanNogGewijzigdWorden
   {
      get
      {
         return Status == BestelStatus.Nieuw || Status == BestelStatus.InBehandeling;
      }
   }

   public override string ToString()
   {
      return $"{ProductNaam} - {Status} - wijzigbaar: {(KanNogGewijzigdWorden ? "ja" : "nee")}";
   }
}
