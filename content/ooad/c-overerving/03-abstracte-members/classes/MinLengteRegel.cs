using System;
using System.Collections.Generic;
using System.Linq;

// 2. Voeg override toe
class MinLengteRegel : ValidatieRegel
{
   public int MinLengte { get; private set; } = 10;

   public MinLengteRegel(int minLengte)
   {
      MinLengte = minLengte;
   }

   public bool IsGeldig(string waarde) => waarde.Length >= MinLengte;
   public string FoutBoodschap => $"Waarde moet minstens {MinLengte} tekens bevatten.";
}
