using System;
using System.Collections.Generic;
using System.Linq;

internal class Boek : CatalogusItem
{
   //public string Titel { get; set; } = string.Empty;
   //public string InventarisNummer { get; set; } = string.Empty;
   public string Auteur { get; set; } = string.Empty;
   public int AantalPaginas { get; set; }
}
