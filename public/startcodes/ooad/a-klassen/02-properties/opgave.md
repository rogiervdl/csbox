# Properties

**Doel:** gebruik van properties in een klasse; standaardwaarden; object initializer syntax.

## Opgave

1. Maak onderaan een klasse `Recept` met volgende properties:
   - `Titel` (string)
   - `Rating` (int)
   - `IsVegetarisch` (bool, standaardwaarde `false`)
   - `Ingredienten` (List van strings, standaard lege lijst)

2. Het recept **Pasta Carbonara** wordt aangemaakt met de lege constructor en properties worden één voor één ingesteld (code is al gegeven).

3. Maak de volgende recepten aan met de **object initializer syntax** (code is al gegeven):
   - **Vegetarische Lasagne**: Rating 5, IsVegetarisch true, ingrediënten: Lasagnebladen, Tomatensaus, Courgette, Aubergine, Mozzarella
   - **Salade Niçoise**: Rating 4, ingrediënten: Sla, Tonijn, Eieren, Pindakaas, Olijven, Tomaten

4. Pas de Salade Niçoise aan: verwijder de pindakaas en zet `IsVegetarisch` op `false`.

5. Maak een lijst `kookboek` en voeg de drie recepten toe.

6. Toon het aantal vegetarische recepten en de gemiddelde rating.

## Verwacht resultaat

```
Oefening 2: properties, standaardwaarden, object initializer syntax
-------------
Aantal vegetarische recepten in het kookboek: 1
De gemiddelde rating is 4,3.
```
