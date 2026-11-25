using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 3: abstracte members");
      Console.WriteLine("-------------");

      // De klassen ValidatieRegel, MinLengteRegel en BevatHoofdletterRegel zijn al gegeven in de map classes.
      //
      // 1. Markeer ValidatieRegel abstract; verwijder de implementatie van IsGeldig en de standaardwaarde van FoutBoodschap
      // 2. Voeg override toe aan IsGeldig en FoutBoodschap in MinLengteRegel en BevatHoofdletterRegel
      // 3. Maak twee nieuwe klassen: BevatCijferRegel en MagNietBevattenRegel
      // 4. Haal de twee commentaarregels in de lijst hieronder uit commentaar

      List<ValidatieRegel> regels = new List<ValidatieRegel>()
      {
         new MinLengteRegel(8),
         new BevatHoofdletterRegel(),
         //new BevatCijferRegel(),
         //new MagNietBevattenRegel(new List<string> { "wachtwoord", "1234", "Azerty" }),
      };

      string wachtwoord;
      do
      {
         Console.Write("Voer een wachtwoord in: ");
         wachtwoord = Console.ReadLine() ?? string.Empty;
         Console.WriteLine();
         if (string.IsNullOrEmpty(wachtwoord)) continue;

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

// 3. Voeg hier BevatCijferRegel toe (tip: gebruik char.IsDigit)

// 3. Voeg hier MagNietBevattenRegel toe
