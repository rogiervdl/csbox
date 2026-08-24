# Abstracte klasse

**Doel:** klassen maken die moeten overgeërfd worden om te kunnen gebruiken.

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
