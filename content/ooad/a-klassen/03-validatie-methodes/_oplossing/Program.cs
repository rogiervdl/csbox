using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("\nOefening 3: niet-automatische properties (validatie, berekende properties), methodes");
      Console.WriteLine("-------------");
      // 1. maak in de map "classes" een klasse "Werknemer" met volgende properties:
      //   - Id
      //   - Naam
      //   - Salaris
      //   - InDienstSinds (type DateOnly)
      // test met onderstaande code (haal uit commentaar):
      Werknemer w1 = new()
      {
         Id = 9,
         Naam = "Kaito Nakamura",
         Salaris = 2800,
         InDienstSinds = new DateOnly(2025, 6, 1)
      };
      Werknemer w2 = new()
      {
         Id = 13,
         Naam = "Priya Sharma",
         Salaris = 3400,
         InDienstSinds = new DateOnly(2022, 3, 15)
      };
      Werknemer w3 = new()
      {
         Id = 67,
         Naam = "Carlos Mendoza",
         Salaris = 4100,
         InDienstSinds = new DateOnly(2018, 9, 20)
      };
      List<Werknemer> werknemers = new() { w1, w2, w3 };

      // 2. Voeg validatie toe:
      //   - valideer in de setter van "Salaris" dat het salaris niet negatief kan zijn, en gooi anders een ArgumentException met de boodschap "Salaris kan niet negatief zijn"
      //   - valideer in de setter van "InDienstSinds" dat de datum niet in de toekomst kan liggen, en gooi anders een ArgumentException met de boodschap "Datum indiensttreding kan niet in de toekomst liggen"
      // test met onderstaande code (haal uit commentaar), één keer zonder fouten, en één keer met een fout (b.v. negatief salaris):
      Werknemer LeesNieuweWerknemer(int id)
      {
         Console.Write("Naam nieuwe werknemer: ");
         string naam = Console.ReadLine();
         Console.Write("Salaris: ");
         decimal salaris = decimal.Parse(Console.ReadLine());
         Console.Write("In dienst sinds (yyyy-MM-dd): ");
         DateOnly inDienstSinds = DateOnly.Parse(Console.ReadLine()!);
         Werknemer nieuweWerknemer = new()
         {
            Id = id,
            Naam = naam,
            Salaris = salaris,
            InDienstSinds = inDienstSinds
         };
         return nieuweWerknemer;
      }
      try
      {
         int maxId = werknemers.Max(w => w.Id);
         werknemers.Add(LeesNieuweWerknemer(maxId + 1));
         Console.WriteLine();
         werknemers.Add(LeesNieuweWerknemer(maxId + 2));
      }
      catch (ArgumentException ex)
      {
         Console.ForegroundColor = ConsoleColor.Red;
         Console.WriteLine($"Fout: {ex.Message}");
         Console.ForegroundColor = ConsoleColor.White;
      }
      catch (FormatException ex)
      {
         Console.ForegroundColor = ConsoleColor.Red;
         Console.WriteLine($"Fout: {ex.Message}");
         Console.ForegroundColor = ConsoleColor.White;
      }

      // 3. voeg twee properties toe:
      //   - "Ancienniteit" die berekent hoeveel jaar de werknemer al in dienst is
      //   - "Seniority" die op basis van de ancienniteit "Junior" (<2), "Medior" (<5) of "Senior" teruggeeft
      // test met onderstaande code (haal uit commentaar):
      Console.WriteLine();
      foreach (Werknemer w in werknemers)
      {
         Console.WriteLine($"{w.Naam,-20} | {w.Seniority,-6} | {w.Ancienniteit} jaar | €{w.Salaris:F2}");
      }

      // 4. voeg een methode "GeefOpslag" toe die een percentage opslag geeft op het salaris
      // test met onderstaande code (haal uit commentaar):
      w3.GeefOpslag(10);
      Console.WriteLine($"Na opslag verdient {w3.Naam} nu €{w3.Salaris:F2}");
   }
}
