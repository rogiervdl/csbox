Console.WriteLine("Oefening 5: base");
Console.WriteLine("-------------");

// Medewerker is al gegeven onderaan.
//
// 1. Maak een klasse Manager die overerft van Medewerker, met extra property TeamGrootte
// 2. Voeg een constructor toe die base(naam, afdeling) aanroept
// 3. Override ToString() en roep base.ToString() aan om de output van Medewerker te hergebruiken
// 4. Haal de commentaarregels hieronder uit commentaar en controleer de output

List<Medewerker> personeel = new List<Medewerker>
{
    //new Medewerker("Lotte Peeters", "Marketing"),
    //new Manager("Niels Verhoeven", "IT", 8),
    //new Medewerker("Youssef El Amrani", "Sales"),
    //new Manager("Sofia Dimitriou", "HR", 5),
    //new Medewerker("Chloé Van den Broeck", "Finance"),
};

foreach (Medewerker m in personeel)
{
    Console.WriteLine(m);
}

// ============================================================
// Klassen
// ============================================================

class Medewerker
{
    public string Naam { get; set; }
    public string Afdeling { get; set; }

    public Medewerker(string naam, string afdeling)
    {
        Naam = naam;
        Afdeling = afdeling;
    }

    public override string ToString()
    {
        return $"{Naam} ({Afdeling})";
    }
}

// 1. Maak hier de klasse Manager
class Manager : Medewerker
{
    // Voeg property TeamGrootte toe
    // Voeg een constructor toe met base(naam, afdeling)
    // Voeg een override ToString() toe met base.ToString()
}
