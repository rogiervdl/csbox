# is en as

**Doel:** het type van een object controleren met `is` en casten naar een subklasse met `as`.

## Opgave

De klassen `Workout`, `Cardio`, `Krachttraining`, `Stretching` en de enum `LichaamsDeel` zijn al gegeven.

1. Voeg in elke subklasse een readonly property `Punten` (type `int`) toe:
   - `Cardio`: `AfstandInKm * 6` (afronden naar int)
   - `Krachttraining`: `(Gewicht * Reps) / 5` (afronden naar int)
   - `Stretching`: altijd `10`
2. Haal `Workout.ToString()` uit commentaar.
3. Vervang `// TODO 1` door code die per workout de info toont (gebruik `is`/`as` of pattern matching).
4. Vervang `// TODO 2` door code die de totale punten per type berekent en toont.

## Verwacht resultaat

```
Oefening 4: is en as
-------------
Overzicht workouts:
  [Cardio]         Ochtendrun — 5,2 km
  [Krachttraining] Bench press — 60 kg × 12 reps
  [Stretching]     Rugstretching — Rug
  [Cardio]         Fietstocht — 22 km
  [Krachttraining] Squat — 80 kg × 8 reps
  [Stretching]     Nekrol — Nek

Totale punten per type:
  Cardio:         163
  Krachttraining: 272
  Stretching:     20
```
