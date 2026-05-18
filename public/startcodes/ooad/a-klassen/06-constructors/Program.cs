Console.WriteLine("Oefening 6: constructors");
Console.WriteLine("-------------");

// 1. Breid de klasse ProfielInfo uit met twee constructors:
//    - een constructor met enkel de verplichte gegevens als parameters (Id, Gebruikersnaam, Email)
//      -> stel ook AanmaakDatum in op DateTime.Now
//    - een constructor met alle properties als parameters
//      -> gebruik :this() om de code van de eerste constructor te hergebruiken
// test met onderstaande code (haal uit commentaar):
/*
ProfielInfo p1 = new ProfielInfo(1, "kaito99", "kaito@example.com");
ProfielInfo p2 = new ProfielInfo(2, "priya_s", "priya@example.com", "Priya", "Sharma", "Softwareontwikkelaar uit Gent.", "https://priya.dev", true);
ProfielInfo p3 = new ProfielInfo(3, "carlos_m", "carlos@example.com", "Carlos", "Mendoza", "", "", false);
*/

// 2. Voeg een berekende property IsVolledig toe die true geeft als alle optionele gegevens ingevuld zijn
// 3. Override ToString() naar voorbeeld van het verwacht resultaat
// test met onderstaande code (haal uit commentaar):
/*
List<ProfielInfo> profielen = new List<ProfielInfo> { p1, p2, p3 };
foreach (ProfielInfo p in profielen)
{
   Console.WriteLine($"{p} | profiel is {(p.IsVolledig ? "volledig" : "onvolledig")}");
}
*/

// ============================================================
// Klassen
// ============================================================

class ProfielInfo
{
   // Properties (verplichte info)
   public int Id { get; set; }
   public string Gebruikersnaam { get; set; }
   public string Email { get; set; }
   public DateTime AanmaakDatum { get; private set; }

   // Properties (optionele info)
   public string Voornaam { get; set; } = "";
   public string Achternaam { get; set; } = "";
   public string Biografie { get; set; } = "";
   public string Website { get; set; } = "";
   public bool IsPubliek { get; set; } = true;

   // 2. Berekende property IsVolledig: true als Voornaam, Achternaam, Biografie én Website allemaal ingevuld zijn

   // 1a. Constructor met verplichte gegevens (Id, Gebruikersnaam, Email)
   //     -> stel ook AanmaakDatum in op DateTime.Now

   // 1b. Constructor met alle properties -> gebruik :this() voor de verplichte gegevens

   // 3. Override ToString(): "Gebruikersnaam - publiek"  (of "privé")
}
