using System;
using System.Collections.Generic;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 1: Overerving");
      Console.WriteLine("-------------");

      // 1. Klant is al gegeven in de map classes
      //
      // 2. Maak in de map classes een klasse ProfessioneleKlant die overerft van Klant, met
      //    properties BedrijfsNaam en BtwNummer, en een eigen ToString()
      //
      // 3. Voeg hieronder twee instanties toe van ProfessioneleKlant:
      //    - Niels Verhoeven, niels@studio42.be, Studio 42 BV, BE0123.456.789
      //    - Sofia Dimitriou, sofia@ateliernova.eu, Atelier Nova, BE0897.654.321

      List<Klant> klanten = new List<Klant>();
      klanten.Add(new Klant { Naam = "Lotte Peeters", Email = "lotte.peeters@mail.be" });
      klanten.Add(new Klant { Naam = "Youssef El Amrani", Email = "youssef.elamrani@outlook.com" });
      klanten.Add(new Klant { Naam = "Chloé Van den Broeck", Email = "chloe.vdbroeck@gmail.com" });
      klanten.Add(new Klant { Naam = "Milan De Vos", Email = "milan.devos@yahoo.com" });
      // voeg hier de twee ProfessioneleKlant instanties toe
      // ...

      Console.WriteLine("Overzicht klanten:");
      foreach (Klant klant in klanten)
      {
         Console.WriteLine($"- {klant}");
      }
   }
}
