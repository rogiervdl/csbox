using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Oefening 5 — base: basisklasse constructor en methodes aanroepen vanuit een subklasse
/// </summary>
public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 5: base");
      Console.WriteLine("-------------");

      List<Medewerker> personeel = new()
      {
         new Medewerker("Lotte Peeters", "Marketing"),
         new Manager("Niels Verhoeven", "IT", 8),
         new Medewerker("Youssef El Amrani", "Sales"),
         new Manager("Sofia Dimitriou", "HR", 5),
         new Medewerker("Chloé Van den Broeck", "Finance"),
      };

      foreach (Medewerker m in personeel)
      {
         Console.WriteLine(m);
      }
   }
}
