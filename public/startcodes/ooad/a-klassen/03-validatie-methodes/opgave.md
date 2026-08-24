# Validatie & methodes

**Doel:** niet-automatische properties met validatie; berekende properties; methodes.

## Opgave

1. Maak onderaan een klasse `Werknemer` met volgende properties:
   - `Id` (int)
   - `Naam` (string)
   - `Salaris` (decimal)
   - `InDienstSinds` (DateOnly)

2. Voeg validatie toe:
   - Setter van `Salaris`: gooi `ArgumentException("Salaris kan niet negatief zijn.")` als het salaris negatief is.
   - Setter van `InDienstSinds`: gooi `ArgumentException("Datum indiensttreding kan niet in de toekomst liggen.")` als de datum in de toekomst ligt.

   Test de validatie door de applicatie te starten en een negatief salaris of toekomstige datum in te voeren.

3. Voeg twee berekende properties toe:
   - `Ancienniteit` (int): aantal jaar dat de werknemer al in dienst is.
   - `Seniority` (string): `"Junior"` (< 2 jaar), `"Medior"` (< 5 jaar), `"Senior"`.

4. Voeg een methode `GeefOpslag(decimal percentage)` toe die het salaris verhoogt met het opgegeven percentage.

## Verwacht resultaat (correcte invoer)

```
Oefening 3: niet-automatische properties (validatie, berekende properties), methodes
-------------
Naam nieuwe werknemer: Badr
Salaris: 2340
In dienst sinds (yyyy-MM-dd): 2024-01-26

Naam nieuwe werknemer: Cindy
Salaris: 2510
In dienst sinds (yyyy-MM-dd): 2023-03-12

Kaito Nakamura       | Junior | 1 jaar | €2800,00
Priya Sharma         | Medior | 4 jaar | €3400,00
Carlos Mendoza       | Senior | 8 jaar | €4100,00
Badr                 | Medior | 2 jaar | €2340,00
Cindy                | Medior | 3 jaar | €2510,00
Na opslag verdient Carlos Mendoza nu €4510,00
```

## Verwacht resultaat (negatief salaris)

```
Naam nieuwe werknemer: Badr
Salaris: -1000
In dienst sinds (yyyy-MM-dd): 2023-09-18
Fout: Salaris kan niet negatief zijn.

Kaito Nakamura       | Junior | 1 jaar | €2800,00
...
```
