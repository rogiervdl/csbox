Console.WriteLine("Oefening 2: couponcodes controleren");
Console.WriteLine("-------------");

// Maak onderaan een klasse CouponCode:
//   - private static string _couponRegex = @"^[A-Z]{3}\d{2}-[A-Z]{2}$"
//   - property Code (string)
//   - berekende property IsGeldig (bool, alleen getter): gebruik Regex.IsMatch() om Code te controleren
//   - constructor met één parameter
//   - static methode ControleerCode(string code): geeft true als de code geldig is
//   - static methode Beschrijf(string code):
//       geldig  → "Prefix=ABC, Nummer=12, Regio=DE"
//       ongeldig → "ongeldige code"

// Testcode (haal uit commentaar):
//string[] codes = { "ABC12-DE", "AB12-DE", "XYZ99-BE" };
//Console.WriteLine("\ntesten IsGeldig() methode:\n");
//foreach (string code in codes)
//{
//    Console.WriteLine($"Code {code} is {(CouponCode.ControleerCode(code) ? "geldig" : "ongeldig")}");
//}
//Console.WriteLine("\ntesten Beschrijf() methode:\n");
//foreach (string code in codes)
//{
//    Console.WriteLine($"Code {code}: {CouponCode.Beschrijf(code)}");
//}

// ============================================================
// Klassen
// ============================================================

class CouponCode
{
    // Voeg hier de implementatie toe
}
