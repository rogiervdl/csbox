Console.WriteLine("Oefening 5: compositie");
Console.WriteLine("-------------");

// Gegeven: lijst van 10 producten
List<Product> producten = new List<Product>
{
    new Product { ProductId = 9112, Naam = "Laptop",          Beschrijving = "14-inch, 16GB RAM",          Prijs = 999.99m, Voorraad = 12 },
    new Product { ProductId = 2876, Naam = "Bureaulamp",      Beschrijving = "LED, dimbaar",                Prijs = 34.50m,  Voorraad = 0  },
    new Product { ProductId = 3033, Naam = "Rugzak",          Beschrijving = "Waterbestendig, 30L",         Prijs = 59.95m,  Voorraad = 8  },
    new Product { ProductId = 4441, Naam = "Koptelefoon",     Beschrijving = "Noise-cancelling",            Prijs = 149.00m, Voorraad = 3  },
    new Product { ProductId = 5508, Naam = "Muis",            Beschrijving = "Draadloos, ergonomisch",      Prijs = 29.99m,  Voorraad = 20 },
    new Product { ProductId = 6274, Naam = "Toetsenbord",     Beschrijving = "Mechanisch, RGB",             Prijs = 89.95m,  Voorraad = 7  },
    new Product { ProductId = 7390, Naam = "Webcam",          Beschrijving = "Full HD, 1080p",              Prijs = 64.50m,  Voorraad = 5  },
    new Product { ProductId = 8115, Naam = "USB-hub",         Beschrijving = "7 poorten, USB-C",            Prijs = 24.99m,  Voorraad = 0  },
    new Product { ProductId = 8823, Naam = "Monitor",         Beschrijving = "27-inch, 4K IPS",             Prijs = 449.00m, Voorraad = 4  },
    new Product { ProductId = 9647, Naam = "Telefoonhouder",  Beschrijving = "Verstelbaar, bureaumodel",    Prijs = 14.75m,  Voorraad = 15 },
};

// 1. Voeg een property List<Product> Producten toe aan Bestelling, en maak twee bestellingen aan:
//    - bestelling1: id = 1, klantnaam = "Amara Diallo", producten = Laptop, Rugzak en Webcam
//    - bestelling2: id = 2, klantnaam = "Yuna Kim", producten = Laptop en Monitor
//    tip: bestelling1.Producten.Add(producten[0]) voegt de Laptop toe
// ...

// 2. Implementeer TotaalBedrag in de klasse Bestelling en test of het correct is
// Console.WriteLine($"Totaalbedrag bestelling 1: {bestelling1.TotaalBedrag}");

// 3. Toon de details van bestelling 1 en alle producten erin
// ...

// 4. Geef 5% korting op alle producten in bestelling 2 en toon de details
// ...

// ============================================================
// Klassen
// ============================================================

class Product
{
    public int ProductId { get; set; }
    public string Naam { get; set; }
    public string Beschrijving { get; set; }
    public decimal Prijs { get; set; }
    public int Voorraad { get; set; }
    public bool IsInVoorraad { get { return Voorraad > 0; } }
    public double Korting
    {
        get;
        set
        {
            if (value < 0 || value > 100)
            {
                throw new ArgumentException("Percentage moet tussen 0 en 100 liggen.");
            }
            field = value;
        }
    } = 0;
    public decimal PrijsMetKorting
    {
        get { return Prijs * (1 - ((decimal)Korting) / 100); }
    }
    public override string ToString()
    {
        return $"[{ProductId}] {Naam} - € {PrijsMetKorting:F2} | {(IsInVoorraad ? "" : "niet ")}in voorraad";
    }
}

class Bestelling
{
    public int BestellingId { get; set; }
    public DateTime Datum { get; set; } = DateTime.Now;
    public string KlantNaam { get; set; }
    // 1. Voeg hier een property Producten toe van type List<Product>

    public string Status
    {
        get;
        set
        {
            string[] toegelaten = { "Bezig", "Afgerond", "Geannuleerd" };
            if (!toegelaten.Contains(value)) throw new ArgumentException($"Ongeldige status: {value}");
            field = value;
        }
    } = "Bezig";

    // 2. Implementeer TotaalBedrag: som van PrijsMetKorting van alle producten in de lijst
    public decimal TotaalBedrag
    {
        get
        {
            return 0; // vervang door echte implementatie
        }
    }

    public override string ToString()
    {
        return $"#{BestellingId} — {KlantNaam} | 0 product(en) | € {TotaalBedrag:F2} | {Status}"; // pas het aantal producten aan
    }
}
