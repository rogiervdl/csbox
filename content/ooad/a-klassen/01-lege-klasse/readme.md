# Lege klasse

**Doel:** een lege klasse aanmaken en instanties uit maken.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Een **klasse** is een blauwdruk voor objecten. Je maakt het aan met `class`:

```csharp
// een lege klasse — geen properties, geen constructors
public class Auto
{
}
```

Daarna kan je zoveel instanties maken als je wil met `new`:

```csharp
// instanties aanmaken
Auto mijnFord = new Auto();
Auto mijnKever = new Auto();
Auto autoX = new Auto();
...
```

Je kan de klasse en de instanties die je eruit maakt gebruiken zoals elk gegevenstype en variabelen, zoals in lijsten of methodes:

```csharp
// gebruik in een methode
public static void ToonAuto(Auto a) {
   ...
}

// gebruik in een List
List<Auto> wagenpark = new List<Auto>() { mijnFord, mijnKever, autoX };
Console.WriteLine($"Aantal auto's: {wagenpark.Count}"); // 3
```

## Opgave

1. Maak in de map `classes` een lege klasse `Knikker`, zonder properties of constructors.
2. Maak een `List<Knikker>` met de naam `potje`.
3. Voeg met een lus 10 knikkers toe aan de lijst.
4. Toon hoeveel knikkers er in het potje zitten.

## Verwacht resultaat

```
Oefening 1: lege klasse
-------------
Er zitten 10 knikkers in het potje.
```
