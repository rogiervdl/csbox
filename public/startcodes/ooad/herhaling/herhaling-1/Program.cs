Console.WriteLine("Herhalingsoefening 1: muziekalbum");
Console.WriteLine("----------------------------------");


// ==============================================================
// Hoofdprogramma - HAAL UIT COMMENTAAR ALS JE KLASSEN KLAAR ZIJN
// ==============================================================

// // nummers met constructor met 3 parameters
// Nummer n1 = new("Alone Again", 4, 2);
// Nummer n2 = new("Too Late", 3, 59);
// Nummer n3 = new("Hardest to Love", 4, 9);
// Nummer n4 = new("Scared to Live", 3, 11);
// Nummer n8 = new("Wolf", 2, 34);

// // nummers met constructor met 1 parameter
// Nummer n5 = new(310);
// Nummer n6 = new(227) { Titel = "Goud" };
// Nummer n7 = new(252) { Titel = "Chaos" };

// // albums aanmaken en nummers toevoegen
// Album afterHours = new("After Hours", "The Weeknd", 2020);
// afterHours.VoegNummerToe(n1);
// afterHours.VoegNummerToe(n2);
// afterHours.VoegNummerToe(n3);
// afterHours.VoegNummerToe(n4);
// afterHours.VoegNummerToe(n5);

// Album nacht = new("Nacht", "Bazart", 2017);
// nacht.VoegNummerToe(n6);
// nacht.VoegNummerToe(n7);
// nacht.VoegNummerToe(n8);

// // toon elk album met zijn nummers
// List<Album> albums = new() { afterHours, nacht };
// foreach (Album album in albums)
// {
//     Console.WriteLine(album);
//     for (int i = 0; i < album.Nummers.Count; i++)
//     {
//         Console.WriteLine($"  {i + 1}. {album.Nummers[i]}");
//     }
//     Console.WriteLine();
// }


// ============================================================
// Klassen - SCHRIJF JE KLASSEN HIERONDER
// ============================================================

// Klasse Nummer:
// - Properties: Titel, DuurInSeconden
// - Berekende property: DuurAlsTekst
// - Constructor met 1 parameter: duurInSeconden
// - Constructor met 3 parameters: titel, minuten, seconden
// - ToString()

// Klasse Album:
// - Properties: Titel, Artiest, Jaar, Nummers
// - Constructor met 3 parameters: titel, artiest, jaar
// - Berekende property TotaalDuurInSeconden
// - Berekende property TotaalDuurAlsTekst
// - Berekende property IsEp
// - Methode VoegNummerToe() 
// - ToString()
