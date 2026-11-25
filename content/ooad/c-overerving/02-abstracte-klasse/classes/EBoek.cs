using System;

class EBoek
{
   public string Titel { get; set; } = string.Empty;
   public string InventarisNummer { get; set; } = string.Empty;
   public double BestandsgrootteMB { get; set; }
   public EboekFormaat Formaat { get; set; }
}
