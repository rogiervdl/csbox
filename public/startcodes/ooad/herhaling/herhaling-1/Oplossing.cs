// Oplossing — Herhalingsoefening 1: muziekalbum

Console.WriteLine("Herhalingsoefening 1: muziekalbum");
Console.WriteLine("----------------------------------");

// nummers met constructor met 3 parameters
Nummer n1 = new("Alone Again", 4, 2);
Nummer n2 = new("Too Late", 3, 59);
Nummer n3 = new("Hardest to Love", 4, 9);
Nummer n4 = new("Scared to Live", 3, 11);
Nummer n8 = new("Wolf", 2, 34);

// nummers met constructor met 1 parameter
Nummer n5 = new(310);
Nummer n6 = new(227) { Titel = "Goud" };
Nummer n7 = new(252) { Titel = "Chaos" };

// albums aanmaken en nummers toevoegen
Album afterHours = new("After Hours", "The Weeknd", 2020);
afterHours.VoegNummerToe(n1);
afterHours.VoegNummerToe(n2);
afterHours.VoegNummerToe(n3);
afterHours.VoegNummerToe(n4);
afterHours.VoegNummerToe(n5);

Album nacht = new("Nacht", "Bazart", 2017);
nacht.VoegNummerToe(n6);
nacht.VoegNummerToe(n7);
nacht.VoegNummerToe(n8);

// toon elk album met zijn nummers
List<Album> albums = new() { afterHours, nacht };
foreach (Album album in albums)
{
    Console.WriteLine(album);
    for (int i = 0; i < album.Nummers.Count; i++)
    {
        Console.WriteLine($"  {i + 1}. {album.Nummers[i]}");
    }
    Console.WriteLine();
}

// ============================================================
// Klassen
// ============================================================

/// <summary>
/// Stelt één muzieknummer voor met titel en duur.
/// </summary>
class Nummer
{
    // properties
    public string Titel { get; set; } = "Onbekend nummer";

    public int DuurInSeconden
    {
        get;
        set
        {
            if (value <= 0)
            {
                throw new ArgumentException("Duur moet groter zijn dan nul.");
            }
            field = value;
        }
    }

    // berekende property: minuten en seconden als tekst
    public string DuurAlsTekst
    {
        get
        {
            int minuten = DuurInSeconden / 60;
            int seconden = DuurInSeconden % 60;
            return $"{minuten}:{seconden:D2}";
        }
    }

    // constructor met totaal seconden
    public Nummer(int duurInSeconden)
    {
        DuurInSeconden = duurInSeconden;
    }

    // constructor met titel, minuten en seconden
    public Nummer(string titel, int minuten, int seconden) : this(minuten * 60 + seconden)
    {
        Titel = titel;
    }

    // tekstweergave: "Alone Again (4:02)"
    public override string ToString()
    {
        return $"{Titel} ({DuurAlsTekst})";
    }
}

/// <summary>
/// Stelt een muziekalbum voor met artiest, jaar en een lijst van nummers.
/// </summary>
class Album
{
    // properties
    public string Titel { get; set; }
    public string Artiest { get; set; }
    public int Jaar { get; set; }
    public List<Nummer> Nummers { get; set; } = new();

    // berekende property: som van alle duren in seconden
    public int TotaalDuurInSeconden
    {
        get
        {
            int totaal = 0;
            foreach (Nummer nummer in Nummers)
            {
                totaal += nummer.DuurInSeconden;
            }
            return totaal;
        }
    }

    // berekende property: totale duur als tekst
    public string TotaalDuurAlsTekst
    {
        get
        {
            int minuten = TotaalDuurInSeconden / 60;
            int seconden = TotaalDuurInSeconden % 60;
            return $"{minuten}:{seconden:D2}";
        }
    }

    // berekende property: EP als 4 of minder nummers, anders LP
    public bool IsEp
    {
        get { return Nummers.Count <= 4; }
    }

    // constructor
    public Album(string titel, string artiest, int jaar)
    {
        Titel = titel;
        Artiest = artiest;
        Jaar = jaar;
    }

    /// <summary>
    /// Voegt een nummer toe aan de lijst van dit album.
    /// </summary>
    public void VoegNummerToe(Nummer nummer)
    {
        Nummers.Add(nummer);
    }

    // tekstweergave: "After Hours — The Weeknd (2020) | 5 nummer(s) | 20:31 | LP"
    public override string ToString()
    {
        return $"{Titel} — {Artiest} ({Jaar}) | {Nummers.Count} nummer(s) | {TotaalDuurAlsTekst} | {(IsEp ? "EP" : "LP")}";
    }
}
