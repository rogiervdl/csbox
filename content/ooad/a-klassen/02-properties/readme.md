# Properties

**Doel:** gebruik van properties in een klasse; standaardwaarden; object initializer syntax.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Properties zijn (meestal) publiek beschikbare eigenschappen van een object. Voorlopig beperken we ons tot properties die je vrij kan lezen en schrijven met `{ get; set; }`; dit noemt men **automatische properties**.

```csharp
public class Auto
{
    public string Merk { get; set; }
    public int Bouwjaar { get; set; }
    public bool IsElektrisch { get; set; } = false;  // standaardwaarde
    public List<string> Opties { get; set; } = new List<string>(); // standaard lege lijst
}
```

Properties instellen kan op twee manieren. De eerste manier is door ze één voor één in te stellen na het aanmaken van het object:

```csharp
Auto a1 = new Auto();
a1.Merk = "Toyota";
a1.Bouwjaar = 2021;
a1.IsElektrisch = true;
a1.Opties = new List<string> { "Autopilot", "Panoramadak" };
```

Of compacter met de **object initializer syntax** (alles in één stap):

```csharp
Auto a1 = new Auto
{
    Merk = "Toyota",
    Bouwjaar = 2021,
    IsElektrisch = true,
    Opties = new List<string> { "Autopilot", "Panoramadak" }
};
```

## Opgave

1. Maak in de map `classes` een klasse `Recept` met volgende properties:
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
