using System;
using System.Collections.Generic;
using System.Linq;

// 2. Voeg override toe
class BevatHoofdletterRegel : ValidatieRegel
{
   public bool IsGeldig(string waarde) => waarde.Any(char.IsUpper);
   public string FoutBoodschap => "Waarde moet minstens één hoofdletter bevatten.";
}
