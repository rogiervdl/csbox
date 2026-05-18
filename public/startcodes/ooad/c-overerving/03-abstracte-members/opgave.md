# Abstracte property of methode

**Doel:** methodes maken die verplicht geïmplementeerd moeten worden in overgeërfde klassen.

## Opgave

De klassen `ValidatieRegel`, `MinLengteRegel` en `BevatHoofdletterRegel` zijn al gegeven.

1. Markeer de klasse `ValidatieRegel` zelf als `abstract`. Verwijder de body van `IsGeldig` en de standaardwaarde van `FoutBoodschap` — maak ze beide `abstract`.
2. Voeg het keyword `override` toe aan `IsGeldig` en `FoutBoodschap` in `MinLengteRegel` en `BevatHoofdletterRegel`.
3. Voeg twee nieuwe validatieregels toe:
   - `BevatCijferRegel`: geeft een fout als er geen cijfer in de waarde zit (tip: gebruik `char.IsDigit`)
   - `MagNietBevattenRegel`: ontvangt een lijst verboden woorden en geeft een fout als de waarde er één bevat
4. Haal de twee commentaarregels in de lijst onderaan uit commentaar en controleer of het programma correct werkt.

## Verwacht resultaat

```
Voer een wachtwoord in: azerty1

✗ Waarde moet minstens 8 tekens bevatten.
✗ Waarde moet minstens één hoofdletter bevatten.
✓ BevatCijferRegel geslaagd
✗ Waarde mag geen van de volgende woorden bevatten: wachtwoord, 1234, Azerty.


Voer een wachtwoord in: !è12HjK?

✓ MinLengteRegel geslaagd
✓ BevatHoofdletterRegel geslaagd
✓ BevatCijferRegel geslaagd
✓ MagNietBevattenRegel geslaagd
```
