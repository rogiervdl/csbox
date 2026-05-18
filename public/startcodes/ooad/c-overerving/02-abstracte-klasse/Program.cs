Console.WriteLine("Oefening 2: eigen basisklasse en afgeleiden");
Console.WriteLine("-------------");

// De klassen Boek, FilmDvd en EBoek zijn al gegeven onderaan.
// Ze hebben elk de properties Titel en InventarisNummer — die zijn gemeenschappelijk.
//
// 1. Maak een abstracte basisklasse CatalogusItem met Titel en InventarisNummer
// 2. Laat Boek, FilmDvd en EBoek overerven van CatalogusItem
// 3. Verwijder Titel en InventarisNummer uit de drie subklassen
// 4. Controleer of onderstaande testcode nog steeds werkt

Boek roman = new Boek
{
   Titel = "De hemel is altijd paars",
   InventarisNummer = "B-10042",
   Auteur = "Ruta Sepetys",
   AantalPaginas = 412,
};

FilmDvd film = new FilmDvd
{
   Titel = "Koko",
   InventarisNummer = "D-08821",
   Regisseur = "Taika Waititi",
   SpeelduurMinuten = 101,
};

EBoek handleiding = new EBoek
{
   Titel = "C# in een notendop",
   InventarisNummer = "E-00003",
   BestandsgrootteMB = 4.2,
   Formaat = EboekFormaat.Pdf,
};

Console.WriteLine($"[{roman.InventarisNummer}] {roman.Titel}");
Console.WriteLine($"  Boek — {roman.Auteur}, {roman.AantalPaginas} pagina's");
Console.WriteLine();

Console.WriteLine($"[{film.InventarisNummer}] {film.Titel}");
Console.WriteLine($"  DVD — {film.Regisseur}, {film.SpeelduurMinuten} min");
Console.WriteLine();

Console.WriteLine($"[{handleiding.InventarisNummer}] {handleiding.Titel}");
Console.WriteLine($"  E-book — {handleiding.Formaat}, {handleiding.BestandsgrootteMB:F1} MB");

// ============================================================
// Klassen en enums
// ============================================================

// 1. Maak hier de abstracte basisklasse CatalogusItem

class Boek
{
   public string Titel { get; set; } = string.Empty;
   public string InventarisNummer { get; set; } = string.Empty;
   public string Auteur { get; set; } = string.Empty;
   public int AantalPaginas { get; set; }
}

class FilmDvd
{
   public string Titel { get; set; } = string.Empty;
   public string InventarisNummer { get; set; } = string.Empty;
   public string Regisseur { get; set; } = string.Empty;
   public int SpeelduurMinuten { get; set; }
}

class EBoek
{
   public string Titel { get; set; } = string.Empty;
   public string InventarisNummer { get; set; } = string.Empty;
   public double BestandsgrootteMB { get; set; }
   public EboekFormaat Formaat { get; set; }
}

enum EboekFormaat
{
   Epub,
   Pdf,
   Mobi,
}
