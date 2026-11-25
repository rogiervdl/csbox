using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

internal abstract class ValidatieRegel
{
   public abstract bool IsGeldig(string waarde);
   public abstract string FoutBoodschap { get; }
}
