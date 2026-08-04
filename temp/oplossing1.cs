using System;
// Herhalingsoefening 1: muziekalbum
// =================================

// Stap 1: schrijf hieronder een classe Nummer:
class Nummer {
    // - Properties: Titel, DuurInSeconden
    public string Titel {get; set; } = "onbekend nummer"
    // Property DuurInSeconden: geheel getal, met validatie: de waarde moet groter dan nul zijn,
    // anders gooi je een ArgumentException met als waarde "Duur moet groter zijn dan nul."

    private int _DuurInSeconden; // hulpvariabele

    public int DuurInSeconden
    {
        get {return _DuurInSeconden; }
        set
        {
            if (value <= 0)
            {
                throw new ArgumentException($"Duur moet groter zijn dan nul.");
            }
            _DuurInSeconden = value;
        }
        // - Berekende property: DuurAlsTekst
        // Berekende property DuurAlsTekst: de duur in formaat 3:42
        //(tip: gebruik gehele deling en rest na deling om minuten en seconden te berekenen uit de duur)
        public string DuurAlsTekst
        {
            get
            {
                return ($"DuurInSeconden / 60, DuurInSeconden % 60 :D2");
            }
        }

        // - Constructor met 1 parameter: duurInSeconden
        public Nummer (int duurInSeconden)
        {
            DuurInSeconden = duurInSeconden;

        }
        // - Constructor met 3 parameters: titel, minuten, seconden
        // roep de eerste constructor aan waarbij je de duur in seconden meegeeft
        // als minuten * 60 + seconden, en stel daarna de titel in
        public Nummer (string titel, int minuten, int seconden) : this(minuten * 60 + seconden)
        {
            Titel = titel;
        }
        // - ToString() // voorbeeld: "Alone Again (4:02)"
        public override string ToString()
        {
            return $"{Titel} {(DuurInSeconden:D2)}";
        }

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

// Stap 2: schrijf hieronder een classe Album:
class Album
{
    // - Properties: Titel, Jaar, Nummers
    public string Titel {get; set; } = "onbekend album"
    //  (standaard lege lijst)
    public List<Jaar> Jaren {get; set; } = new List<Jaar>();
    public List<Nummer> Nummers {get; set; } = new List<Nummer>();

    // - Constructor met 2 parameters: titel, jaar
    public Album (string titel, int jaar)
    {
        Titel: titel;
        Jaar: jaar;
    }
    // - Berekende property IsEp: true als het album 4 of minder nummers bevat
    public bool IsEp
    {
        if { value <= 4 } = true;
        else false;

        }

        // - Methode VoegNummerToe()
        public string VoegNummerToe()

        // - ToString()
        public override string ToString()
        {
            string type IsEp = ? "LP" : "EP";
            return $"{Titel} {(Jaar)} | {Nummer.add (s)} | {type} ";
        }


