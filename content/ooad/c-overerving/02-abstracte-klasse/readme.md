# Abstracte klasse

**Doel:** klassen maken die moeten overgeërfd worden om te kunnen gebruiken.

## Theorie

Zie ook het hoofdstuk [Overerving](https://rogiervdl.github.io/CS-course/12_overerving.html) in de cursus.

Een **abstracte klasse** is een klasse die je _niet rechtstreeks_ kan instantiëren. Ze dient enkel als basisklasse voor subklassen. Je markeert ze met het keyword `abstract`.

```csharp
// Kan niet rechtstreeks aangemaakt worden: new Vorm() → fout!
public abstract class Vorm
{
   public string Kleur { get; set; }
}
```

Je moet ze overerven om te kunnen gebruiken:

```csharp
// Erf over om te gebruiken
public class Cirkel : Vorm
{
   public double Straal { get; set; }
}
public class Rechthoek : Vorm
{
   public double Breedte { get; set; }
   public double Hoogte { get; set; }
}
```

Gebruik een abstracte klasse wanneer het concept te algemeen is om rechtstreeks te gebruiken (`Vorm`, `Dier`, …)

```csharp
Cirkel c1 = new Cirkel { Kleur = "groen", Straal = 13.7 }; // ok
Rechthoek r1 = new Rechthoek { Kleur = "blauw", Breedte = 210, Hoogte = 133 }; // ok
Vorm v1 = new Vorm { Kleur = "rood" }; // fout! Vorm mag niet rechtstreeks gebruikt worden
```

## Opgave

De klassen `Boek`, `FilmDvd` en `EBoek` zijn al gegeven. Ze hebben elk de properties `Titel` en `InventarisNummer` — die zijn gemeenschappelijk.

1. Maak een abstracte basisklasse `CatalogusItem` met de gemeenschappelijke properties `Titel` en `InventarisNummer`.
2. Laat `Boek`, `FilmDvd` en `EBoek` overerven van `CatalogusItem`.
3. Verwijder `Titel` en `InventarisNummer` uit de drie subklassen (ze worden nu geërfd).
4. Controleer of de testcode nog steeds correct werkt.

## Verwacht resultaat

```
Oefening 2: eigen basisklasse en afgeleiden
-------------
[B-10042] De hemel is altijd paars
  Boek — Ruta Sepetys, 412 pagina's

[D-08821] Koko
  DVD — Taika Waititi, 101 min

[E-00003] C# in een notendop
  E-book — Pdf, 4,2 MB
```
