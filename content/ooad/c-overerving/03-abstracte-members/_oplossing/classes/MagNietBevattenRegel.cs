using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

internal class MagNietBevattenRegel : ValidatieRegel
{
   public List<string> VerbodenWoorden { get; private set; } = new List<string>();
   public bool CaseSensitive { get; set; } = false;
   public MagNietBevattenRegel(List<string> verb, bool ci = false)
   {
      VerbodenWoorden = verb;
      CaseSensitive = ci;
   }

   public override bool IsGeldig(string waarde)
   {
      return !VerbodenWoorden.Any(w => CaseSensitive ? waarde.Contains(w) : waarde.ToLower().Contains(w.ToLower()));
   }

   public override string FoutBoodschap => $"Waarde mag geen van de volgende woorden bevatten: {string.Join(", ", VerbodenWoorden)}.";
}
