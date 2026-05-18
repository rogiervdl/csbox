Console.WriteLine("Oefening 3: tekst analyseren");
Console.WriteLine("-------------");

// Maak onderaan een statische klasse TekstAnalyse:
//   - private static string[] verbodenWoorden = { "delete", "drop", "truncate" }
//   - private static char[] verbodenKarakters = { '!', '@', '#', '$', '%' }
//   - static methode AantalWoorden(string tekst): telt woorden op basis van spaties
//   - static methode BevatVerbodenWoord(string tekst): true als de tekst een verboden woord bevat
//   - static methode BevatVerbodenKarakter(string tekst): true als de tekst een verboden karakter bevat
//   - static methode IsGeschiktVoorTitel(string tekst): true als:
//       * de tekst niet leeg is
//       * de tekst minimaal 5 en maximaal 30 tekens lang is
//       * de tekst geen verboden woorden of karakters bevat
//   Zorg dat alle methodes null- en lege-string-veilig zijn.

// Testcode (haal uit commentaar):
//Console.WriteLine();
//string[] teksten = { "dit is een test", "gratis truncate aanbieding", "Workshop C# basis", "delete titel", "" };
//foreach (string tekst in teksten)
//{
//    Console.WriteLine($"'{tekst}':");
//    Console.WriteLine($" - bevat {TekstAnalyse.AantalWoorden(tekst)} woorden");
//    if (TekstAnalyse.BevatVerbodenWoord(tekst)) Console.WriteLine(" - bevat verboden woord");
//    if (TekstAnalyse.BevatVerbodenKarakter(tekst)) Console.WriteLine(" - bevat verboden karakter");
//    Console.WriteLine($" - is {(TekstAnalyse.IsGeschiktVoorTitel(tekst) ? "geschikt" : "niet geschikt")} voor een titel");
//}

// ============================================================
// Klassen
// ============================================================

static class TekstAnalyse
{
   // Voeg hier de implementatie toe
}
