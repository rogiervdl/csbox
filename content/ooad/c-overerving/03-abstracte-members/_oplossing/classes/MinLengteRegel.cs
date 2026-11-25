using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

internal class MinLengteRegel : ValidatieRegel
{
   public int MinLengte { get; private set; } = 10;
   public MinLengteRegel(int minLengte)
   {
      MinLengte = minLengte;
   }

   public override bool IsGeldig(string waarde) => waarde.Length >= MinLengte;

   public override string FoutBoodschap => $"Waarde moet minstens {MinLengte} tekens bevatten.";
}
