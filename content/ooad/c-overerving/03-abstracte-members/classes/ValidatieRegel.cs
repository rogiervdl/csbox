using System;
using System.Collections.Generic;
using System.Linq;

// 1. Maak ValidatieRegel abstract (verwijder de implementaties)
class ValidatieRegel
{
   public bool IsGeldig(string waarde) { return true; }
   public string FoutBoodschap { get; } = "";
}
