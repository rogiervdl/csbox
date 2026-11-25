# Tests-schema in properties.json

Formaat voor het `tests`-blok in `properties.json`, waarmee een oefening
deterministisch (zonder AI) gecontroleerd wordt. Zelfde opbouw als in WebBox;
de asserts komen uit `reposchecker/courses/OOAD/OOAD.json5`, met sleutels in
kleine letters.

1. [Structuur](#structuur)
2. [Velden die bij elke test gelden](#velden-die-bij-elke-test-gelden)
3. [Console-asserts](#console-asserts)
4. [C#-asserts](#c-asserts)
5. [Score](#score)

## Structuur

```json
{
   "label": "02. Properties",
   "tests": [
      { "assert": "csClassExists", "name": "Recept", "caption": "Klasse Recept" },
      { "assert": "csPropertyExists", "class": "Recept", "name": "Titel", "types": ["string"], "isAuto": true, "caption": "Klasse Recept" },
      { "assert": "consoleContains", "contains": "vegetarische recepten in het kookboek: 1", "caption": "Uitvoer" }
   ]
}
```

`tests` is een lijst en optioneel; een oefening zonder tests krijgt geen
feedback. De soort van een test volgt uit het voorvoegsel van `assert`:
`console*` of `cs*`. De feedback toont de tests in de volgorde van de lijst,
gegroepeerd per caption.

Zolang de code niet compileert, lopen er geen tests; de feedback toont dan de
compileerfouten.

**Geen gratis punten waar het te vermijden is.** Een test die al slaagt op de
startcode, geeft punten zonder dat de student iets doet. Test daarom wat de
student moet toevoegen, niet wat de startcode al geeft.

Bij het opstarten controleert de server elke lijst: een onbekende assert of een
onbekend veld komt in het logboek, met de oefening erbij. De oefening laadt wel.

## Velden die bij elke test gelden

| Veld | Verplicht | Betekenis |
|---|---|---|
| `assert` | ja | naam van de assert |
| `caption` | nee | groepstitel in de feedback; tests zonder caption staan onder "Andere"; heeft geen enkele test een caption, dan toont de feedback geen groepstitels |
| `description` | nee | vaste, korte omschrijving naast ✓/✗; zonder opgave maakt de runner er zelf één |
| `points` | nee | gewicht in de score: elk getal ≥ 0, ook kommagetallen zoals `0.5`; standaard `1`; `0` toont de test wel, maar telt niet mee |
| `tips` | nee | extra hint, enkel getoond bij falen |

Een naam of tekstwaarde (`name`, `class`, `contains`) mag ook een reguliere
expressie zijn, geschreven als `/patroon/vlaggen` (bv. `/^_?couponRegex$/i`);
anders is het een gewone match: exact bij namen, case-insensitive substring bij
tekst. Een test met een regex heeft een eigen `description`.

## Console-asserts

| Assert | Extra velden | Betekenis |
|---|---|---|
| `consoleContains` | `contains`, `input` | de tekst staat in de uitvoer |
| `consoleNotContains` | `contains`, `input` | de tekst staat niet in de uitvoer |

- `input` is een lijst van regels die het programma na elkaar krijgt bij
  `Console.ReadLine()`, bv. `["3", "Jan"]`; standaard leeg.
- Hoofdletters tellen niet mee. Bij een gewone tekst telt witruimte niet mee
  (`\n` in `contains` is gewoon witruimte); een regex loopt op de uitvoer met
  elke reeks witruimte als één spatie.
- Tests met dezelfde `input` delen één uitvoering.
- Het programma draait op de server, afgeschermd, met een timeout en een limiet
  op de uitvoer, en met de cultuur `nl-BE` (bv. `4,3` en `€ 34,50`).
- Een uitzondering of timeout doet de test falen; de feedback vermeldt de
  uitzondering.

## C#-asserts

De C#-asserts lopen op het syntaxmodel van Roslyn, over alle `.cs`-bestanden
van de oefening samen, zonder de code uit te voeren.

| Assert | Extra velden | Betekenis |
|---|---|---|
| `csClassExists` | `name`, `modifiers`, `base` | klasse bestaat, met die modifiers en eventueel die basisklasse |
| `csEnumExists` | `name`, `modifiers`, `values` | enum bestaat, eventueel met precies die waarden |
| `csInheritsFrom` | `class`, `bases` | klasse erft van een van de `bases` |
| `csPropertyExists` | `class`, `name`, `types`, `modifiers`, `accessors`, `isAuto` | property bestaat met een van de `types` |
| `csPropertyAuto` | `class`, `name` | property is een auto-property |
| `csPropertyNotAuto` | `class`, `name` | property heeft een eigen getter of setter |
| `csPropertyReadonly` | `class`, `name` | property heeft enkel een getter |
| `csSetterThrowsException` | `class`, `name` | de setter gooit een exception |
| `csMethodExists` | `class`, `name`, `modifiers`, `paramTypes`, `returnType` | methode bestaat |
| `csConstructorExists` | `class`, `paramTypes` of `numParameters` | constructor met die parametertypes of dat aantal parameters |
| `csVariableExists` | `class`, `name`, `types`, `modifiers`, `value` | veld bestaat; zonder `modifiers` telt ook een lokale variabele in een methode of constructor |
| `csContainsText` | `class`, `contains`, `min`, `count` | de klasse bevat de tekst minstens `min` keer (standaard 1) of precies `count` keer |
| `csNotContainsText` | `class`, `contains` | de klasse bevat de tekst niet |

- `modifiers`: bv. `["public", "static"]`; de gevonden member moet ze allemaal
  hebben. Zonder `modifiers` telt elke toegankelijkheid.
- `types`, `paramTypes`, `returnType`: zoals in de code geschreven, bv.
  `List<string>`, `decimal`, `string[]`.
- `accessors`: bv. `["get", "private set"]`.
- `class` ontbreekt bij `csContainsText`/`csNotContainsText`: de test loopt
  op alle code samen.

## Score

De score is `floor(behaalde punten / totaal × 100)`, zodat enkel 100 betekent
dat elke test geslaagd is. Hebben alle tests 0 punten, dan is de score 0. De
server berekent de score; de client stuurt er geen door.
