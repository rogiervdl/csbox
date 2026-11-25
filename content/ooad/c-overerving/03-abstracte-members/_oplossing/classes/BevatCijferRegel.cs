using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

internal class BevatCijferRegel : ValidatieRegel
{
   public override bool IsGeldig(string waarde) => waarde.Any(char.IsDigit);

   public override string FoutBoodschap => "Waarde moet minstens één cijfer bevatten.";
}
