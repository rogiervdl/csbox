using System;
using System.Collections.Generic;
using System.Linq;

internal class Manager : Medewerker
{
   public int TeamGrootte { get; set; }

   // TODO: roep de constructor van Medewerker op via base(...)
   public Manager(string naam, string afdeling, int teamGrootte) : base(naam, afdeling)
   {
      TeamGrootte = teamGrootte;
   }

   // TODO: roep ToString() van Medewerker op via base.ToString()
   public override string ToString()
   {
      return $"{base.ToString()}, team: {TeamGrootte} personen";
   }
}
