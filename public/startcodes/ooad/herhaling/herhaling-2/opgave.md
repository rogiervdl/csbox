# Herhalingsoefening 2: sportclubleden

**Doel:** herhaling van enumeraties en statische en niet-statische members — je beslist zelf wat static moet zijn en wat niet.

## Enum `Lidtype`

Maak een enumeratie `Lidtype` met de waarden `Junior`, `Senior` en `Veteraan`.

## Klasse `Lid`

Maak een klasse `Lid` met de volgende members. Beslis voor elke member zelf of die `static` moet zijn of niet.

- Property die bijhoudt hoeveel `Lid`-objecten er ooit aangemaakt zijn (private setter)
- Property die bijhoudt hoeveel leden er momenteel actief zijn (private setter)
- Property met unieke volgnummer van dit lid, automatisch toegekend bij aanmaak (private setter)
- Property met de naam van dit lid
- Property met het lidtype van dit lid
- Property of dit lid actief is (standaard `true`, private setter)
- Constructor met naam en lidtype als parameters: kent automatisch een oplopend lidnummer toe
- Methode `GeefKortingsPercentage(Lidtype type)`: geeft het kortingspercentage terug — Junior: 50%, Senior: 10%, Veteraan: 30%
- Methode `Deactiveer()`: stelt dit lid in als inactief en past de actieve teller aan; doet niets als het lid al inactief is
- `ToString()`: zie verwacht resultaat

## Testcode

Haal de testcode uit commentaar en controleer of het overeenkomt met het verwachte resultaat:

```
Totaal aangemaakt: 5
Actief: 5
Actief na wijzigingen: 3
Korting Junior: 50%
Korting Senior: 10%
Korting Veteraan: 30%

#1 Jana Peeters | Senior | actief
#2 Mathis Dubois | Junior | inactief
#3 Rosa Martínez | Veteraan | actief
#4 Luca De Smet | Senior | inactief
#5 Amira Khalil | Junior | actief
```
