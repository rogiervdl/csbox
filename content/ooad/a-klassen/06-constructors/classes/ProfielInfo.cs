using System;
using System.Collections.Generic;

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
