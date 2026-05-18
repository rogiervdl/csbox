Console.WriteLine("Herhalingsoefening 3: voertuigverhuur");
Console.WriteLine("---------------------------------------");
Console.OutputEncoding = System.Text.Encoding.UTF8;


// ==============================================================
// Hoofdprogramma - HAAL UIT COMMENTAAR ALS JE KLASSEN KLAAR ZIJN
// ==============================================================

// List<Voertuig> vloot = new()
// {
//    new Auto("Toyota Yaris", 45m, 5),
//    new Auto("BMW X5", 90m, 5),
//    new Bestelwagen("Ford Transit", 75m, 8.5),
//    new Bestelwagen("Mercedes Sprinter", 85m, 12.0),
//    new Fiets("Trek", 15m, false),
//    new Fiets("Gazelle", 20m, true),
// };

// // toon alle voertuigen
// Console.WriteLine("Volledig aanbod:");
// foreach (Voertuig v in vloot)
// {
//    Console.WriteLine($"  {v}");
// }

// // huurprijs voor 3 dagen
// Console.WriteLine("\nHuurprijs voor 3 dagen:");
// foreach (Voertuig v in vloot)
// {
//    Console.WriteLine($"  {v.Merk}: €{v.BerekenHuurprijs(3):F2}");
// }


// ============================================================
// Klassen - SCHRIJF JE KLASSEN HIERONDER
// ============================================================

// Abstracte klasse Voertuig:
// - properties Merk en DagPrijs
// - abstracte property MaxPassagiers
// - constructor met merk en dagPrijs
// - methode BerekenHuurprijs() met aantal dagen als parameter: geeft DagPrijs × dagen terug
// - ToString(): "Toyota Yaris (max. 5 passagier(s)) — €45,00/dag"

// Klasse Auto (erft over van Voertuig):
// - extra property AantalDeuren
// - MaxPassagiers: altijd 5
// - constructor met merk, dagPrijs en aantalDeuren — roep base aan
// - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 5 deuren"

// Klasse Bestelwagen (erft over van Voertuig):
// - extra property LaadruimteM3 (double)
// - MaxPassagiers: altijd 2
// - constructor met merk, dagPrijs en laadruimteM3 — roep base aan
// - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — 8,5 m³ laadruimte"

// Klasse Fiets (erft over van Voertuig):
// - extra property IsElektrisch
// - MaxPassagiers: altijd 1
// - constructor met merk, dagPrijs en isElektrisch — roep basisimplementatie van Voertuig aan
// - ToString(): roep ToString() van de basisklasse Voertuig op en vul aan: "... — elektrisch"  (of "klassiek")
