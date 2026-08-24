Console.WriteLine("Oefening 3: niet-automatische properties (validatie, berekende properties), methodes");
Console.WriteLine("-------------");

// 1. Voeg properties toe aan de klasse Werknemer onderaan: Id (int), Naam (string), Salaris (decimal), InDienstSinds (DateOnly)
// test met onderstaande code (haal uit commentaar):
/*
Werknemer w1 = new Werknemer { Id = 9,  Naam = "Kaito Nakamura", Salaris = 2800, InDienstSinds = new DateOnly(2025, 6, 1)  };
Werknemer w2 = new Werknemer { Id = 13, Naam = "Priya Sharma",   Salaris = 3400, InDienstSinds = new DateOnly(2022, 3, 15) };
Werknemer w3 = new Werknemer { Id = 67, Naam = "Carlos Mendoza", Salaris = 4100, InDienstSinds = new DateOnly(2018, 9, 20) };
List<Werknemer> werknemers = new List<Werknemer> { w1, w2, w3 };
*/

// 2. Voeg validatie toe aan de setters:
//    - Salaris: gooi ArgumentException("Salaris kan niet negatief zijn.") als het salaris negatief is
//    - InDienstSinds: gooi ArgumentException("Datum indiensttreding kan niet in de toekomst liggen.") als de datum in de toekomst ligt
// test door onderstaande code uit commentaar te halen en eens foutieve gegevens in te voeren:
/*
Werknemer LeesNieuweWerknemer(int id)
{
   Console.Write("Naam nieuwe werknemer: ");
   string naam = Console.ReadLine();
   Console.Write("Salaris: ");
   decimal salaris = decimal.Parse(Console.ReadLine());
   Console.Write("In dienst sinds (yyyy-MM-dd): ");
   DateOnly inDienstSinds = DateOnly.Parse(Console.ReadLine()!);
   return new Werknemer { Id = id, Naam = naam, Salaris = salaris, InDienstSinds = inDienstSinds };
}
try
{
   int maxId = werknemers.Max(w => w.Id);
   werknemers.Add(LeesNieuweWerknemer(maxId + 1));
   Console.WriteLine();
   werknemers.Add(LeesNieuweWerknemer(maxId + 2));
}
catch (ArgumentException ex)
{
   Console.ForegroundColor = ConsoleColor.Red;
   Console.WriteLine($"Fout: {ex.Message}");
   Console.ForegroundColor = ConsoleColor.White;
}
catch (FormatException ex)
{
   Console.ForegroundColor = ConsoleColor.Red;
   Console.WriteLine($"Fout: {ex.Message}");
   Console.ForegroundColor = ConsoleColor.White;
}
*/

// 3. Voeg twee berekende properties toe:
//    - Ancienniteit (int): aantal jaar dat de werknemer al in dienst is
//    - Seniority (string): "Junior" (< 2 jaar), "Medior" (< 5 jaar), "Senior"
// test met onderstaande code (haal uit commentaar):
/*
Console.WriteLine();
foreach (Werknemer w in werknemers)
{
   Console.WriteLine($"{w.Naam,-20} | {w.Seniority,-6} | {w.Ancienniteit} jaar | €{w.Salaris:F2}");
}
*/

// 4. Voeg een methode GeefOpslag(decimal percentage) toe die het salaris verhoogt met het opgegeven percentage
// test met onderstaande code (haal uit commentaar):
/*
w3.GeefOpslag(10);
Console.WriteLine($"Na opslag verdient {w3.Naam} nu €{w3.Salaris:F2}");
*/

// ============================================================
// Klassen
// ============================================================

class Werknemer
{
   // 1. Voeg properties toe: Id, Naam, Salaris, InDienstSinds

   // 2a. Voeg validatie toe aan Salaris: gooi ArgumentException("Salaris kan niet negatief zijn.") als het salaris negatief is

   // 2b. Voeg validatie toe aan InDienstSinds: gooi ArgumentException("Datum indiensttreding kan niet in de toekomst liggen.") als de datum in de toekomst ligt

   // 3a. Berekende property Ancienniteit (int): aantal jaar in dienst

   // 3b. Berekende property Seniority (string): "Junior" (< 2 jaar), "Medior" (< 5 jaar), "Senior"

   // 4. Methode GeefOpslag(decimal percentage): verhoog Salaris met het opgegeven percentage
}
