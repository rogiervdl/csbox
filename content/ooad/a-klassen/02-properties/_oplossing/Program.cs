using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("\nOefening 2: properties, standaardwaarden, object initializer syntax");
      Console.WriteLine("-------------");
      // 1. maak in de map "classes" een klasse "Recept" met volgende properties:
      //   - Titel
      //   - Rating (int)
      //   - IsVegetarisch (standaardwaarde is false)
      //   - Ingredienten (List van strings, standaard lege lijst)

      // 2. maak volgend recept aan met de lege constructor (... = new Recept()) en stel dan één voor één de properties in:
      //   - Pasta Carbonara (Rating 4, Ingrediënten: Pasta, Eieren, Spek, Parmezaanse kaas)
      // ...
      Recept r1 = new();
      r1.Titel = "Pasta Carbonara";
      r1.Rating = 4;
      r1.Ingredienten = new List<string> { "Pasta", "Eieren", "Spek", "Parmezaanse kaas" };

      // 3. maak volgende recepten aan met de object initializer syntax:
      //   - Lasagne (Rating 5, IsVegetarisch false, Ingrediënten: Lasagnebladen, Tomatensaus, Courgette, Aubergine, Mozzarella)
      //   - Salade Niçoise (Rating 4, Ingrediënten: Sla, Tonijn, Eieren, Pindakaas, Olijven, Tomaten)
      // ...
      Recept r2 = new()
      {
         Titel = "Vegetarische Lasagne",
         Rating = 5,
         IsVegetarisch = true,
         Ingredienten = new List<string> { "Lasagnebladen", "Tomatensaus", "Courgette", "Aubergine", "Mozzarella" }
      };
      Recept r3 = new()
      {
         Titel = "Salade Niçoise",
         Rating = 4,
         IsVegetarisch = true,
         Ingredienten = new List<string> { "Sla", "Tonijn", "Eieren", "Pindakaas", "Olijven", "Tomaten" }
      };

      // 4. pas het recept van de salade niçoise aan:
      //  - verwijder de pindakaas
      //  - zet IsVegetarisch op false
      // ...
      r3.Ingredienten.Remove("Pindakaas");
      r3.IsVegetarisch = false;

      // 5. maak een lijst "kookboek" aan en voeg de drie recepten toe
      // ...
      List<Recept> kookboek = new() { r1, r2, r3 };

      // 6. toon het aantal vegetarische recepten (zie screenshot) en de gemiddelde rating
      // ...
      Console.WriteLine($"Aantal vegetarische recepten in het kookboek: {kookboek.Count(r => r.IsVegetarisch)}");
      Console.WriteLine($"De gemiddelde rating is {kookboek.Average(r => r.Rating):F1}.");
   }
}
