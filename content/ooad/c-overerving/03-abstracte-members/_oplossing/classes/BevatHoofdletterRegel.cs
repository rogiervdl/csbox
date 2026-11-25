using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

internal class BevatHoofdletterRegel : ValidatieRegel
{
   public override bool IsGeldig(string waarde) => waarde.Any(char.IsUpper);

   public override string FoutBoodschap => "Waarde moet minstens één hoofdletter bevatten.";
}
