using System;
using System.Collections.Generic;

// Stap 4: haal de testcode uit commentaar (verwijder /* en */)
class Program
{
   static void Main(string[] args)
   {
      Console.OutputEncoding = System.Text.Encoding.UTF8;

      // maak vloot aan
      List<Voertuig> vloot = new()
      {
         new Auto("Toyota Yaris", 45m, 5),
         new Auto("BMW X5", 90m, 5),
         new Bestelwagen("Ford Transit", 75m, 8.5),
         new Bestelwagen("Mercedes Sprinter", 85m, 12.0),
      };

      // toon alle voertuigen
      Console.WriteLine("Volledig aanbod:");
      foreach (Voertuig v in vloot)
      {
         Console.WriteLine($"  {v}");
      }

      // huurprijs voor 3 dagen
      Console.WriteLine("\nHuurprijs voor 3 dagen:");
      foreach (Voertuig v in vloot)
      {
         Console.WriteLine($"  {v.Merk}: €{v.BerekenHuurprijs(3):F2}");
      }

      // type-specifieke info via is/pattern matching
      Console.WriteLine("\nDetails per voertuig:");
      foreach (Voertuig v in vloot)
      {
         if (v is Auto auto)
         {
            Console.WriteLine($"  Auto: {auto}");
         }
         else if (v is Bestelwagen bestel)
         {
            Console.WriteLine($"  Bestelwagen: {bestel}");
         }
      }
   }
}
