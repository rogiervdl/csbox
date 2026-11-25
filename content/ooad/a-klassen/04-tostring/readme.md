# ToString()

**Doel:** de methode `ToString()` overschrijven voor een mooie tekstweergave van een object.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Elke klasse in C# erft impliciet over van `object`, en dus ook de methode `ToString()`. Standaard geeft die de typenaam terug, maar je kan ze **overschrijven** met `override` voor een zinvolle tekstweergave.

```csharp
public class Film
{
    public string Titel { get; set; }
    public int Jaar { get; set; }
    public double Score { get; set; }

    public override string ToString()
    {
        return $"{Titel} ({Jaar}) — ★ {Score:F1}";
    }
}
```

In een string context als `Console.WriteLine()` en string interpolatie wordt automatisch `ToString()` aangeroepen:

```csharp
Film f = new Film { Titel = "Inception", Jaar = 2010, Score = 8.8 };

Console.WriteLine(f);            // Inception (2010) — ★ 8.8
Console.WriteLine($"Film: {f}"); // Film: Inception (2010) — ★ 8.8
```

## Opgave

De klasse `Product` is gegeven met volgende properties: `ProductId`, `Naam`, `Beschrijving`, `Prijs`, `Voorraad`, `IsInVoorraad`, `Korting` en `PrijsMetKorting`.

1. Voeg een `override ToString()` toe zodat een product als volgt weergegeven wordt:

```
[9112] Laptop - € 999,99 | in voorraad
```

Als het product niet in voorraad is, staat er `"niet in voorraad"`.

## Verwacht resultaat

```
Oefening 4: toString()
-------------
product #0: [9112] Laptop - € 999,99 | in voorraad
product #1: [2876] Bureaulamp - € 34,50 | niet in voorraad
product #2: [3033] Rugzak - € 59,95 | in voorraad
product #3: [4441] Koptelefoon - € 149,00 | in voorraad
```
