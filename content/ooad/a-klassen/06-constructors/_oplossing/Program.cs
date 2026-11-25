using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("\nOefening 6: constructors");
      Console.WriteLine("-------------");
      // 1. gegeven de klasse ProfielInfo; breid uit met twee constructors:
      //   - een constructor met enkel de verplichte gegevens als parameters (Id, Gebruikersnaam, Email)
      //   - een constructor met alle properties als parameters neemt 
      //     -> gebruik :this() om de code van de eerste constructor te hergebruiken
      // test met onderstaande code (haal uit commentaar):
      ProfielInfo p1 = new(1, "kaito99", "kaito@example.com");
      ProfielInfo p2 = new(2, "priya_s", "priya@example.com", "Priya", "Sharma", "Softwareontwikkelaar uit Gent.", "https://priya.dev", true);
      ProfielInfo p3 = new(3, "carlos_m", "carlos@example.com", "Carlos", "Mendoza", "", "", false);

      // 2. breid uit met een property IsVolledig die true geeft als alle optionele gegevens ingevuld zijn
      // 3. override ToString() naar voorbeeld van de screenshot
      // test met onderstaande code (haal uit commentaar):
      List<ProfielInfo> profielen = new() { p1, p2, p3 };
      foreach (ProfielInfo p in profielen)
      {
         Console.WriteLine($"{p} | profiel is {(p.IsVolledig ? "volledig" : "onvolledig")}");
      }
   }
}
