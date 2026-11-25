# Constructors

**Doel:** constructors met parameters; constructor chaining met `:this()`.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Met een **constructor** geef je aan hoe een object kan aangemaakt worden uit de klasse. Je kan meerdere constructors voorzien met verschillende parameters. Met `:this()` roep je een andere constructor van dezelfde klasse op (**constructor chaining**), zodat je code niet herhaalt.

```csharp
public class Adres
{
    public string Straat { get; set; }
    public int Huisnummer { get; set; }
    public string Gemeente { get; set; }
    public string Land { get; set; } = "België";

    // constructor met verplichte velden
    public Adres(string straat, int huisnummer, string gemeente)
    {
        Straat = straat;
        Huisnummer = huisnummer;
        Gemeente = gemeente;
    }

    // uitgebreide constructor — hergebruikt de eerste via :this()
    public Adres(string straat, int huisnummer, string gemeente, string land)
        : this(straat, huisnummer, gemeente) // roep eerst de vorige constructor op
    {
        Land = land; // stel dan dit in
    }

    public override string ToString() => $"{Straat} {Huisnummer}, {Gemeente} ({Land})";
}
```

Gebruik van de twee constructors:

```csharp
Adres a1 = new Adres("Kerkstraat", 12, "Aalst"); // constructor 1
Console.WriteLine(a1); // Kerkstraat 12, Aalst (België)

Adres a2 = new Adres("Rue Neuve", 5, "Bruxelles", "France"); // constructor 2
Console.WriteLine(a2); // Rue Neuve 5, Bruxelles (France)
```

## Opgave

Gegeven is de klasse `ProfielInfo` met properties voor verplichte info (`Id`, `Gebruikersnaam`, `Email`, `AanmaakDatum`) en optionele info (`Voornaam`, `Achternaam`, `Biografie`, `Website`, `IsPubliek`).

1. Breid de klasse uit met twee constructors:
   - Een constructor met enkel de verplichte gegevens als parameters: `Id`, `Gebruikersnaam`, `Email`. Stel ook `AanmaakDatum` in op `DateTime.Now`.
   - Een constructor met alle properties als parameters — gebruik `:this()` om de code van de eerste constructor te hergebruiken.

2. Voeg een berekende property `IsVolledig` toe die `true` geeft als alle optionele gegevens (`Voornaam`, `Achternaam`, `Biografie`, `Website`) ingevuld zijn.

3. Voeg een `override ToString()` toe naar voorbeeld van het verwacht resultaat.

## Verwacht resultaat

```
Oefening 6: constructors
-------------
kaito99 - publiek | profiel is onvolledig
priya_s - publiek | profiel is volledig
carlos_m - privé | profiel is onvolledig
```
