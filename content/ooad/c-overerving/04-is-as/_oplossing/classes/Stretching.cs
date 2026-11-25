using System;
using System.Collections.Generic;
using System.Linq;

internal class Stretching : Workout
{
   public LichaamsDeel LichaamsDeel { get; set; }

   // vaste waarde: stretching levert altijd 10 punten op
   public override int Punten => 10;
}
