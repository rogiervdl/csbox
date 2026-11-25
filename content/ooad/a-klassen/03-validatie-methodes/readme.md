# Validatie & methodes

**Doel:** niet-automatische properties met validatie; berekende properties; methodes.

## Theorie

Zie ook het hoofdstuk [Klassen](https://rogiervdl.github.io/CS-course/10_classes.html) in de cursus.

Er zijn twee redenen om de getter en/of setter van een property zelf te implementeren (**niet-automatische property**):

- **validatie**: controleer de binnenkomende waarde (`value`) voor je het opslaat (in `field`)
- **berekende** property: geeft enkel een waarde terug, geen setter nodig

```csharp
public class BankRekening
{
    public string HouderNaam { get; set; }
    public DateOnly AangemaaktOp { get; set; } = DateOnly.FromDateTime(DateTime.Now);

    // property met validatie
    public decimal Saldo
    {
        get;
        set
        {
            // value: ingestelde waarde, field: opgeslagen waarde
            if (value < 0) throw new ArgumentException("saldo kan niet negatief zijn");
            field = value; 
        }
    }

    // berekende property: enkel getter nodig
    public int AantalJarenOpen
    {
        get { return DateOnly.FromDateTime(DateTime.Today).Year - AangemaaktOp.Year; }
    }

    // methode met validatie
    public void Afhalen(decimal bedrag)
    {
        if (bedrag <= 0) throw new ArgumentException("bedrag moet positief zijn");
        if (saldo - bedrag <= 0) throw new ArgumentException("saldo mag niet negatief worden");
        Saldo -= bedrag;
    }
}
```

Validatie in de setter gooit een `ArgumentException` bij een ongeldige waarde:

```csharp
BankRekening r = new BankRekening { HouderNaam = "Lena", Saldo = 600 };
r.Afhalen(250);
Console.WriteLine(r.Saldo); // 350

r.Saldo = -100; // gooit ArgumentException: "saldo kan niet negatief zijn"
r.Afhalen(1000); // gooit ArgumentException: "saldo mag niet negatief worden"
```

## Opgave

1. Maak in de map `classes` een klasse `Werknemer` met volgende properties:
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
