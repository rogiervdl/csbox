# Herhalingsoefening 3: voertuigverhuur

**Doel:** herhaling van overerving — abstracte klasse, abstracte members, `base`, `override` en `is`/`as`.

## Klasse-hiërarchie

Maak de volgende klasse-hiërarchie voor een voertuigverhuurbedrijf.

### Abstracte basisklasse `Voertuig`

- Properties `Merk` en `DagPrijs`
- Abstracte property `MaxPassagiers`
- Constructor met `merk` en `dagPrijs` als parameters
- Methode `BerekenHuurprijs()` met aantal dagen als parameter: geeft `DagPrijs × dagen` terug
- `ToString()` naar dit voorbeeld: `"Toyota Yaris (max. 5 passagier(s)) — €45,00/dag"`

### Klasse `Auto` (erft over van `Voertuig`)

- Extra property `AantalDeuren`
- `MaxPassagiers`: altijd 5
- Constructor met parameters `merk`, `dagPrijs` en `aantalDeuren`: roep de basisconstructor van `Voertuig` aan en stel aantal deuren in
- `ToString()`: roep `ToString()` van de basisklasse Voertuig op en vul aan tot: `"Toyota Yaris (max. 5 passagier(s)) — €45,00/dag — 5 deuren"`

### Klasse `Bestelwagen` (erft over van `Voertuig`)

- Extra property `LaadruimteM3` (double)
- `MaxPassagiers`: altijd 2
- Constructor met parameters `merk`, `dagPrijs` en `laadruimteM3`; roep de basisconstructor van `Voertuig` aan en stel laadruimte in
- `ToString()`: roep `ToString()` van de basisklasse Voertuig op en vul aan tot: `"Ford Transit (max. 2 passagier(s)) — €75,00/dag — 8,5 m³ laadruimte"`

### Klasse `Fiets` (erft over van `Voertuig`)

- Extra property `IsElektrisch` (bool)
- `MaxPassagiers`: altijd 1
- Constructor met parameters `merk`, `dagPrijs` en `isElektrisch`; roep de basisconstructor van `Voertuig` aan en stel is elektrisch in
- `ToString()`: roep `ToString()` van de basisklasse Voertuig op en vul aan tot: `"Trek (max. 1 passagier(s)) — €15,00/dag — klassiek"` (of `"elektrisch"`)

## Testcode

Haal de testcode uit commentaar en controleer of het overeenkomt met het verwachte resultaat:

```
Volledig aanbod:
  Toyota Yaris (max. 5 passagier(s)) — €45.00/dag — 5 deuren
  BMW X5 (max. 5 passagier(s)) — €90.00/dag — 5 deuren
  Ford Transit (max. 2 passagier(s)) — €75.00/dag — 8.5 m³ laadruimte
  Mercedes Sprinter (max. 2 passagier(s)) — €85.00/dag — 12.0 m³ laadruimte
  Trek (max. 1 passagier(s)) — €15.00/dag — klassiek
  Gazelle (max. 1 passagier(s)) — €20.00/dag — elektrisch

Huurprijs voor 3 dagen:
  Toyota Yaris: €135.00
  BMW X5: €270.00
  Ford Transit: €225.00
  Mercedes Sprinter: €255.00
  Trek: €45.00
  Gazelle: €60.00

Details per voertuig:
  Auto: Toyota Yaris (max. 5 passagier(s)) — €45.00/dag — 5 deuren
  Auto: BMW X5 (max. 5 passagier(s)) — €90.00/dag — 5 deuren
  Bestelwagen: Ford Transit (max. 2 passagier(s)) — €75.00/dag — 8.5 m³ laadruimte
  Bestelwagen: Mercedes Sprinter (max. 2 passagier(s)) — €85.00/dag — 12.0 m³ laadruimte
  Fiets: Trek — klassiek
  Fiets: Gazelle — elektrisch
```
