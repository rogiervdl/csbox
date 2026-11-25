using System;
using System.Collections.Generic;
using System.Linq;

/// <summary>
/// Gemeenschappelijke basisklasse voor uitleenbare media in de catalogus.
/// </summary>
internal abstract class CatalogusItem
{
   public string Titel { get; set; } = string.Empty;
   public string InventarisNummer { get; set; } = string.Empty;
}
