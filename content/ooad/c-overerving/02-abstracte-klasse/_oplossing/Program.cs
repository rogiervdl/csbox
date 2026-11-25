using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Oefening 2 — Eigen basisklasse en afgeleide klassen
/// </summary>
public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 2: eigen basisklasse en afgeleiden");
      Console.WriteLine("-------------");

      Boek roman = new()
      {
         Titel = "De hemel is altijd paars",
         InventarisNummer = "B-10042",
         Auteur = "Ruta Sepetys",
         AantalPaginas = 412,
      };

      FilmDvd film = new()
      {
         Titel = "Koko",
         InventarisNummer = "D-08821",
         Regisseur = "Taika Waititi",
         SpeelduurMinuten = 101,
      };

      EBoek handleiding = new()
      {
         Titel = "C# in een notendop",
         InventarisNummer = "E-00003",
         BestandsgrootteMB = 4.2,
         Formaat = EboekFormaat.Pdf,
      };

      Console.WriteLine($"[{roman.InventarisNummer}] {roman.Titel}");
      Console.WriteLine($"  Boek — {roman.Auteur}, {roman.AantalPaginas} pagina's");
      Console.WriteLine();

      Console.WriteLine($"[{film.InventarisNummer}] {film.Titel}");
      Console.WriteLine($"  DVD — {film.Regisseur}, {film.SpeelduurMinuten} min");
      Console.WriteLine();

      Console.WriteLine($"[{handleiding.InventarisNummer}] {handleiding.Titel}");
      Console.WriteLine($"  E-book — {handleiding.Formaat}, {handleiding.BestandsgrootteMB:F1} MB");
   }
}
