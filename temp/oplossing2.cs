using System;
// Stap 1: schrijf hier een enumeratie Lidtype
// - waarden: Junior, Senior, Veteraan
// ...
public enum Lidtype {Junior, Senior, Veteraan}
// Stap 2: schrijf hier een klasse Lid
class Lid {
    // - property die bijhoudt hoeveel leden er momenteel actief zijn static
    public static AantalLeden {get; private set; }
    // - property met de naam van dit lid niet-static
    public string LidNaam {get; set; }
    // - property met het lidtype van dit lid niet static
    public Lidtype lidtype {get; set; }
    // - property of dit lid actief is (standaard true, private setter) niet static
    public bool IsActief {get; private set; } = true
    // - constructor met naam en lidtype
    public Lid (string naam, int lidtype)
    // - methode BerekenKortingsPercentage() met lidtype als parameter: Junior 50%, Senior 10%, Veteraan 30%
    public int BerekenKortingsPercentage(Lidtype, lidtype)
    {
        if (Lidtype = Junior.lidtype) = 50;
        else if (Lidtype = Senior.lidtype) = 10;
        else if (Lidtype = Veteraan.lidtype) = 30;
        return = 0;
    }
    // - methode Deactiveer(): stelt dit lid inactief; doet niets als al inactief
    public Deactiveer()
    {
   
        AantalLeden : aantalLeden;
        IsActief--;
       
    }
    // - ToString() naar dit voorbeeld: "Jana Peeters | Senior | actief"
    // ...
    public override string ToString()
    {
        string type IsActief = ? "IsActief" : "InActief"; 
        return $"{LidNaam} | {Lidtype} | {type}";
    }
}



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

      

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hallo, wereld!");

        for (int i = 1; i <= 5; i++)
        {
            Console.WriteLine($"Regel {i}");
        }
    }
}