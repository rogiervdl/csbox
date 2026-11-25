using System;
using System.Collections.Generic;

// Stap 3: haal de testcode uit commentaar (verwijder /* en */)
class Program
{
   static void Main(string[] args)
   {
      // maak vijf leden aan
      Lid l1 = new("Jana Peeters", Lidtype.Senior);
      Lid l2 = new("Mathis Dubois", Lidtype.Junior);
      Lid l3 = new("Rosa Martínez", Lidtype.Veteraan);
      Lid l4 = new("Luca De Smet", Lidtype.Senior);
      Lid l5 = new("Amira Khalil", Lidtype.Junior);

      // teller na aanmaak
      Console.WriteLine($"Actief: {Lid.AantalActief}");

      // deactiveer twee leden
      l2.Deactiveer();
      l4.Deactiveer();
      Console.WriteLine($"Actief na wijzigingen: {Lid.AantalActief}");

      // kortingen per lidtype
      Console.WriteLine($"Korting Junior: {Lid.BerekenKortingsPercentage(Lidtype.Junior)}%");
      Console.WriteLine($"Korting Senior: {Lid.BerekenKortingsPercentage(Lidtype.Senior)}%");
      Console.WriteLine($"Korting Veteraan: {Lid.BerekenKortingsPercentage(Lidtype.Veteraan)}%");

      // overzicht
      Console.WriteLine();
      List<Lid> leden = new() { l1, l2, l3, l4, l5 };
      foreach (Lid lid in leden)
      {
         Console.WriteLine(lid);
      }
   }
}
