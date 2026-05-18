Console.WriteLine("Herhalingsoefening 2: sportclubleden");
Console.WriteLine("-------------------------------------");


// ==============================================================
// Hoofdprogramma - HAAL UIT COMMENTAAR ALS JE KLASSEN KLAAR ZIJN
// ==============================================================

// // maak vijf leden aan
// Lid l1 = new("Jana Peeters", Lidtype.Senior);
// Lid l2 = new("Mathis Dubois", Lidtype.Junior);
// Lid l3 = new("Rosa Martínez", Lidtype.Veteraan);
// Lid l4 = new("Luca De Smet", Lidtype.Senior);
// Lid l5 = new("Amira Khalil", Lidtype.Junior);

// // tellers na aanmaak
// Console.WriteLine($"Totaal aangemaakt: {Lid.AantalLeden}");
// Console.WriteLine($"Actief: {Lid.AantalActief}");

// // deactiveer twee leden
// l2.Deactiveer();
// l4.Deactiveer();
// Console.WriteLine($"Actief na wijzigingen: {Lid.AantalActief}");

// // kortingen per lidtype
// Console.WriteLine($"Korting Junior: {Lid.GeefKortingsPercentage(Lidtype.Junior)}%");
// Console.WriteLine($"Korting Senior: {Lid.GeefKortingsPercentage(Lidtype.Senior)}%");
// Console.WriteLine($"Korting Veteraan: {Lid.GeefKortingsPercentage(Lidtype.Veteraan)}%");

// // overzicht
// Console.WriteLine();
// List<Lid> leden = new() { l1, l2, l3, l4, l5 };
// foreach (Lid lid in leden)
// {
//    Console.WriteLine(lid);
// }


// ============================================================
// Klassen en enums - SCHRIJF JE CODE HIERONDER
// ============================================================

// Enum Lidtype:
// - waarden: Junior, Senior, Veteraan

// Klasse Lid:
// - property die bijhoudt hoeveel Lid-objecten er ooit aangemaakt zijn
// - property die bijhoudt hoeveel leden er momenteel actief zijn
// - property met uniek volgnummer van dit lid, automatisch toegekend bij aanmaak (private setter)
// - property met de naam van dit lid
// - property met het lidtype van dit lid
// - property of dit lid actief is (standaard true, private setter)
// - constructor met naam en lidtype: kent automatisch een oplopend lidnummer toe
// - methode GeefKortingsPercentage() met lidtype als parameter: Junior 50%, Senior 10%, Veteraan 30%
// - methode Deactiveer(): stelt dit lid inactief; doet niets als al inactief
// - ToString() naar dit voorbeeld: "#1 Jana Peeters | Senior | actief"
