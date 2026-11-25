using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("\nOefening 5: enum conversies");
      Console.WriteLine("-------------");

      // 1. Maak in de map "classes" een enum "Prioriteit" met deze waarden:
      //  - Laag
      //  - Normaal
      //  - Hoog
      //  - Kritiek
      //
      //  Test daarna:
      //  - een enumwaarde tonen als tekst
      //  - dezelfde enumwaarde omzetten naar int
      //  - een int omzetten naar enum

      Prioriteit p1 = Prioriteit.Hoog;
      Console.WriteLine($"Enumwaarde: {p1}");

      int cijfer = (int)p1;
      Console.WriteLine($"Als int: {cijfer}");

      Prioriteit p2 = p1 + 1;
      Console.WriteLine($"Nog hogere prioriteit: {p2}");
   }
}
