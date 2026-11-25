using System;
using System.Collections.Generic;
using System.Linq;

internal class Recept
{
   // Properties
   public string Titel { get; set; }
   public int Rating { get; set; }
   public bool IsVegetarisch { get; set; } = false;
   public List<string> Ingredienten { get; set; } = new List<string>();
}
