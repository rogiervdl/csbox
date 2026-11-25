using System;
using System.Collections.Generic;
using System.Linq;

public class ProfielInfo
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

   // Berekende properties
   public bool IsVolledig
   {
      get
      {
         return !string.IsNullOrEmpty(Voornaam) && !string.IsNullOrEmpty(Achternaam) && !string.IsNullOrEmpty(Biografie) && !string.IsNullOrEmpty(Website);
      }
   }

   // Verplichte constructor — minimale gegevens om een geldig profiel te maken
   public ProfielInfo(int id, string gn, string em)
   {
      Id = id;
      Gebruikersnaam = gn;
      Email = em;
      AanmaakDatum = DateTime.Now;
   }

   // Uitgebreide constructor — verplichte én optionele gegevens in één keer
   public ProfielInfo(int id, string gn, string em, string vn, string an,
      string bio, string ws, bool isP) : this(id, gn, em) // roept de verplichte constructor aan
   {
      Voornaam = vn;
      Achternaam = an;
      Biografie = bio;
      Website = ws;
      IsPubliek = isP;
   }

   // ToString override
   public override string ToString()
   {
      return $"{Gebruikersnaam} - {(IsPubliek ? "publiek" : "privé")}";
   }
}
