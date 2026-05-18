Console.WriteLine("Oefening 4: bestelstatus");
Console.WriteLine("-------------");

// 1. Maak onderaan een enum BestelStatus met waarden:
//    Nieuw, InBehandeling, Verzonden, Geleverd, Geannuleerd
//
// 2. Maak een klasse Bestelling met properties:
//    KlantNaam (string), ProductNaam (string), Status (van type BestelStatus)
//
// 3. Voeg een berekende property KanNogGewijzigdWorden toe:
//    true zolang de bestelling nog niet Geleverd of Geannuleerd is
//
// 4. Override ToString() zodat klantnaam, productnaam en status netjes getoond worden

// Testcode (haal uit commentaar):
//Bestelling b1 = new Bestelling { KlantNaam = "Sara", ProductNaam = "Laptop", Status = BestelStatus.Nieuw };
//Bestelling b2 = new Bestelling { KlantNaam = "Imran", ProductNaam = "Muis", Status = BestelStatus.Verzonden };
//Console.WriteLine(b1);
//Console.WriteLine(b2);

// ============================================================
// Klassen en enums
// ============================================================

enum BestelStatus
{
    // Voeg hier de waarden toe
}

class Bestelling
{
    // Voeg hier de implementatie toe
}
