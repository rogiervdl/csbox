# Enum conversies

**Doel:** een enum omzetten naar `int` en omgekeerd.

## Theorie

Zie ook het hoofdstuk [Static & Enum](https://rogiervdl.github.io/CS-course/11_static_enum.html) in de cursus.

Elke enum-waarde heeft intern een `int`-waarde (standaard 0, 1, 2, …). Je kan heen en weer casten:

```csharp
public enum SeizoenType { Lente, Zomer, Herfst, Winter } // Lente = 0, Zomer = 1...
SeizoenType s = SeizoenType.Herfst; // 2

int getal = (int)s;                // enum → int: 2
SeizoenType s2 = (SeizoenType)3;   // int → enum: Winter
string tekst = s.ToString();       // enum → string: "Herfst"
SeizoenType volgend = s + 1;       // rekenkundige operatie op enum: Winter
```

## Opgave

1. Maak een enum `Prioriteit` met de waarden:
   `Laag`, `Normaal`, `Hoog`, `Kritiek`.

2. Test de volgende conversies:
   - Een enumwaarde tonen als tekst (bv. `"Hoog"`).
   - Dezelfde enumwaarde omzetten naar `int`.
   - De prioriteit met 1 ophogen via een rekenkundige operatie (`p1 + 1`) en het resultaat tonen.

## Verwacht resultaat

```
Oefening 5: enum conversies
-------------
Enumwaarde: Hoog
Als int: 2
Nog hogere prioriteit: Kritiek
```
