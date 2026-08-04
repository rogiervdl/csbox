using System;
// Herhalingsoefening 3: voertuigverhuur
// =====================================

// Stap 1: schrijf hier een abstracte klasse Voertuig:
abstract class voertuig {
    // - properties Merk en DagPrijs
    public string Merk {get; set;}
    public decimal DagPrijs {get; set;}
    // - abstracte property MaxPassagiers
    public abstract int MaxPassagiers {get; }
    // - constructor met merk en dagPrijs
    public voertuig (string merk, decimal dagPrijs);
    {
        Merk: merk;
        DagPrijs: dagPrijs;
    }
    // - methode BerekenHuurprijs() met aantal dagen als parameter: geeft DagPrijs × dagen terug
    public BerekenHuurprijs(int aantalDagen)
    {
        return DagPrijs * dagen;
    }

    // - ToString(): "Toyota Yaris (max. 5 passagier(s)) — €45,00/dag"
    public override string ToString()
    {
        return $"{Merk} {(max.MaxPassagier(s))} - €{DagPrijs}/dag";
    }

}

// Stap 2: schrijf hier een klasse Auto (erft over van Voertuig):
class Auto: Voertuig
{
    // - extra property AantalDeuren
    public int AantalDeuren {get; set; }
    // - MaxPassagiers: altijd 5
    public abstract int MaxPassagiers {get; set;} = 5;
    // - constructor met merk, dagPrijs en aantalDeuren — roep base aan
    public Auto (string merk, decimal dagPrijs, int aantalDeuren) : base (merk, dagPrijs)
    {
        AantalDeuren = aantalDeuren
    }
    // - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 5 deuren"
    public override string ToString()
    {
        return $"{base.Voertuig} - {aantalDeuren}deuren";
    }
}


// Stap 3: schrijf hier een klasse Bestelwagen (erft over van Voertuig):
class Bestelwagen : Voertuig
{
    // - extra property LaadruimteM3 (double)
    public double LaadruimteM3 {get; set;}
    // - MaxPassagiers: altijd 2
    public abstract int MaxPassagiers {get; set; } = 2;
    // - constructor met merk, dagPrijs en laadruimteM3 — roep base aan
    public Bestelwagen(string merk, decimal dagPrijs, double laadruimteM3) : base (merk, dagPrijs)
    {
        LaadruimteM3 : laadruimteM3
    }
    // - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 8,5 m³ laadruimte"
    public override string ToString()
    {
        return $"{base.Voertuig} - {LaadruimteM3} m³ laadruimte";
    }
}


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