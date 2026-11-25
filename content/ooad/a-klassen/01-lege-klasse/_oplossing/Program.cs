using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 1: lege klasse");
      Console.WriteLine("-------------");
      // 1. maak in de map "classes" een lege klasse "Knikker", zonder properties of constructors

      // 2. maak een List van knikkers met de naam "potje"
      // ...
      List<Knikker> potje = new();

      // 3. voeg met een lus 10 knikkers toe aan de lijst
      // ...
      for (int i = 0; i < 10; i++)
      {
         potje.Add(new Knikker());
      }

      // 4. toon hoeveel knikkers er in het potje zitten
      // ...
      Console.WriteLine($"Er zitten {potje.Count} knikkers in het potje.");
   }
}
