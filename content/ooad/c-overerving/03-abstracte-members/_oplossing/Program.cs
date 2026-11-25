using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

public class Program
{
   public static void Main()
   {
      List<ValidatieRegel> regels = new()
         {
             new MinLengteRegel(8),
             new BevatHoofdletterRegel(),
             new BevatCijferRegel(),
             new MagNietBevattenRegel(new List<string> { "wachtwoord", "1234", "Azerty" })
         };

      string wachtwoord;
      do
      {
         Console.Write("Voer een wachtwoord in: ");
         wachtwoord = Console.ReadLine() ?? string.Empty;
         Console.WriteLine();
         if (string.IsNullOrEmpty(wachtwoord))
         {
            continue;
         }

         foreach (ValidatieRegel regel in regels)
         {
            if (!regel.IsGeldig(wachtwoord))
            {
               Console.ForegroundColor = ConsoleColor.Red;
               Console.WriteLine($"✗ {regel.FoutBoodschap}");
               Console.ResetColor();
            }
            else
            {
               Console.ForegroundColor = ConsoleColor.Green;
               Console.WriteLine($"✓ {regel.GetType().Name} geslaagd");
               Console.ResetColor();
            }
         }
         Console.WriteLine();
         Console.WriteLine();
      }
      while (!string.IsNullOrWhiteSpace(wachtwoord));
      Console.WriteLine("programma is beëindigd");
   }
}
