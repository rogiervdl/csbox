Console.WriteLine("Oefening 4: toString()");
Console.WriteLine("-------------");

List<Product> producten = new List<Product>
{
    new Product { ProductId = 9112, Naam = "Laptop",      Beschrijving = "14-inch, 16GB RAM",     Prijs = 999.99m, Voorraad = 12 },
    new Product { ProductId = 2876, Naam = "Bureaulamp",  Beschrijving = "LED, dimbaar",           Prijs = 34.50m,  Voorraad = 0  },
    new Product { ProductId = 3033, Naam = "Rugzak",      Beschrijving = "Waterbestendig, 30L",    Prijs = 59.95m,  Voorraad = 8  },
    new Product { ProductId = 4441, Naam = "Koptelefoon", Beschrijving = "Noise-cancelling",       Prijs = 149.00m, Voorraad = 3  },
};
for (int i = 0; i < producten.Count; i++)
{
    Product p = producten[i];
    Console.WriteLine($"product #{i}: {p}");
}

// ============================================================
// Klassen
// ============================================================

class Product
{
    // Properties (gegeven)
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

    // 1. Voeg een override ToString() toe:
    //    "[ProductId] Naam - € PrijsMetKorting | in voorraad"  (of "niet in voorraad")
    // public override string ToString()
    // {
    //     ...
    // }
}
