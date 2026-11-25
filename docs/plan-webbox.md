# CSBox — gelijktrekken met WebBox

> **Opgesteld:** 20 november 2026.

1. [Context](#context)
2. [Functioneel ontwerp](#functioneel-ontwerp)
3. [Technische uitwerking](#technische-uitwerking)
4. [Stappen](#stappen)

---

## Context

**Aanleiding.** WebBox (`../webbox-ai`) heeft intussen een bestandsbrowser met
panelen, meerdere kleurschema's, aanmelden, voortgang, feedback, een AI-tutor,
suggesties, een dashboard en examens. CSBox moet daar zoveel mogelijk op lijken.
Waar dit plan niets anders zegt, geldt het gedrag uit
`webbox-ai/docs/ontwerp.md` en `webbox-ai/docs/plan-examens.md`.

**Randvoorwaarden.**

- CSBox en WebBox blijven twee aparte apps: eigen repo, eigen Railway-service,
  eigen Postgres, eigen accounts en eigen dashboard. Code uit WebBox wordt
  gekopieerd, niet gedeeld.
- CSBox draait al op Railway, zonder databank. De Postgres komt erbij.
- De client blijft ES modules gebruiken. Overgenomen WebBox-modules worden
  omgezet van RMP naar ES modules.
- De C#-uitvoering blijft zoals nu: compileren met Roslyn op de server,
  uitvoeren in WASM in de browser, met de WebSocket-runner als terugval.
- De randvoorwaarden van Schoolyear gelden ook hier (zie de skill `schoolyear`).
- Railway rekent geheugen aan; de runnerpool blijft begrensd met `MIN_RUNNERS`
  en `MAX_RUNNERS`.
- OOAD heeft ook WPF-oefeningen. WPF draait enkel op Windows, dus niet in de
  browser en niet op de Linux-server van Railway. CSBox voert WPF-oefeningen niet
  uit, maar geeft er wel feedback op. Een WPF-praktijkexamen kan voorlopig niet:
  Schoolyear laat Visual Studio niet toe.

**Status**

| Stap | Staat |
|---|---|
| Plan | ✅ |
| 1 — runner afschermen | ✅ lokaal getest; op Railway nog niet |
| 2 — herstructureren | ✅ server lokaal getest; client in de browser nog niet |
| 3 — toolbar en kleurschema's | ✅ getest in de browser |
| 4 — meerdere bestanden | ✅ getest in de browser |
| 5 — bestanden toevoegen, hernoemen en verwijderen | ✅ geschreven; in de browser nog niet getest |
| 6 – 8 | — |
| 9 — feedback | runner, server en tests lokaal getest; feedbackvenster in de browser nog niet; score nog niet bewaard (wacht op de databank) |
| 10 — stijlcontrole | runner, server en inhoud lokaal getest; feedbackvenster in de browser nog niet |
| 11 – 15 | — |

---

## Functioneel ontwerp

### Werkruimte

```
┌──────────────┬─────────────────────────────┬──────────────────────┐
│ BESTANDEN  + │ Program.cs              ⧉ × │ Terminal             │
│ ▾ classes    ├─────────────────────────────┤                      │
│   Persoon.cs │ class Program …             │                      │
│   Adres.cs   ├─────────────────────────────┤                      │
│ Program.cs   │ classes/Persoon.cs      ⧉ × ├──────────────────────┤
│              │ class Persoon …             │ Fouten               │
└──────────────┴─────────────────────────────┴──────────────────────┘
```

- **Toolbar** zoals in WebBox: logo, vak, module, oefening, opgave,
  kleurschema, layout, 🏆, Opslaan en aanmelden. Run en Stop blijven.
- **Kleurschema's**: dezelfde schema's als WebBox, ook voor Monaco en de
  terminal.
- **Bestandsbrowser en panelen** zoals in WebBox. Rechts staan de terminal en
  het foutenpaneel in plaats van preview en console.
- **Fouten** vermelden bestand en regel, bv. `classes/Persoon.cs:12`. Een klik opent
  het bestand op die regel.
- **De opgave** opent in het losse, verplaatsbare paneel van WebBox.

### Bestanden

- Een oefening heeft een of meer `.cs`-bestanden; Run compileert ze samen.
- Naast de hoofdmap zijn er enkel drie vaste mappen:
  - `classes/`: alle klassen, enums, interfaces en records, als `.cs`,
    bewerkbaar;
  - `files/`: bestanden die het programma inleest of wegschrijft, als `.txt`,
    `.csv`, `.tsv` of `.json`, bewerkbaar;
  - `media/`: afbeeldingen, alleen-lezen, zoals `img/` in WebBox.

  In de hoofdmap staan enkel `.cs`-bestanden.

  De student kan geen mappen aanmaken, verwijderen of hernoemen.
- De student kan een bewerkbaar bestand toevoegen in de hoofdmap, `classes/` of
  `files/`, het hernoemen binnen zijn map en het verwijderen, dat laatste na
  bevestiging. De vaste mappen staan altijd in de bestandsbrowser, ook leeg.
  Toevoegen: een klik op de map kiest ze, de knop `+` in de kop voegt er een
  bestand in toe; zonder gekozen map, of bij `media/`, is de `+` uitgeschakeld.
  In de hoofdmap voegt de student niets toe. Hernoemen en verwijderen gaan via
  knoppen die naast het bestand verschijnen bij hover. De bestanden in `media/`
  komen enkel uit de oefening.
- Een naam zonder extensie krijgt de standaardextensie van zijn map (`.cs` of
  `.txt`). Een nieuw `.cs`-bestand begint met een lege klasse met die naam.
  Twee namen die enkel in hoofdletters verschillen, kunnen niet naast elkaar.
- `Program.cs` staat altijd in de hoofdmap en kan niet hernoemd of verwijderd
  worden.
- Bewaren, herstellen en de tutor nemen alle bestanden mee, ook toegevoegde.
  Een bewaarde versie bepaalt welke bestanden er zijn: een verwijderd
  startbestand komt bij het herladen niet terug.

### Aanmelden en voortgang

Zoals in WebBox: aanmelden is verplicht, met e-mailadres en pincode van vijf
cijfers en "Mail mijn code". Opslaan op de server met Opslaan of Ctrl+S,
tijdmeting, sterren en percentages in de keuzelijsten, de keuze tussen bewaarde
versie en startcode, de waarschuwing bij onbewaarde wijzigingen, en high scores.

### Feedback

Een venster rechtsonder via 📝 Feedback, deterministisch en zonder AI:

- eerst compileert de code; zolang er compileerfouten zijn, toont het venster
  die in plaats van feedback;
- daarna lopen de tests uit `properties.json`: per test ✓ of ✗, gegroepeerd per
  caption, met een tip bij falen;
- score, sterren, 🏆, cooldown en verversknop zoals in WebBox.

Twee soorten tests:

- **uitvoertests**: het programma krijgt invoer en de uitvoer moet een tekst of
  regex bevatten;
- **structuurtests**: een klasse, property, methode, constructor, enum of
  overerving bestaat, met het juiste type, de juiste toegankelijkheid of
  `static`/`abstract`/`override`.

### Stijlcontrole

Zoals de linting in WebBox: na het compileren en vóór de tests controleert
📝 Feedback de stijl. Zolang er stijlfouten zijn, toont het venster die, met
bestand, regel en de code van de regel, in plaats van feedback. De controles:

- **naamgeving:** types, properties en methodes met een hoofdletter; velden,
  lokale variabelen en parameters met een kleine letter; geen underscores in
  namen (een veld mag wel met `_` beginnen);
- **velden private;**
- **één type per bestand**, met de bestandsnaam gelijk aan de typenaam;
- **geen `var`;**
- **spaties:** rond komma's, puntkomma's, operatoren, haakjes en accolades;
  geen dubbele spaties;
- **één statement per regel;**
- **accolades:** op een eigen regel; weglaten mag enkel als het hele
  statement op één regel staat;
- **lege regels:** geen lege regel na `{` of voor `}`, nooit twee lege regels
  na elkaar, geen lege regels bovenaan;
- **volgorde:** `public static` en niet `static public`, `get` vóór `set`;
- **inspringing:** spaties, en elementen op hetzelfde niveau even ver;
- **ingebouwde types:** `int` en `string`, niet `Int32` en `String`.

Nullable-waarschuwingen komen er niet: `string?` mag, maar hoeft niet.

### WPF-oefeningen

- De student maakt een WPF-oefening in Visual Studio en voert ze daar uit. In
  CSBox kiest de student de oefening en leest de opgave; de editor, de
  bestandsbrowser, Run en Stop zijn bij een WPF-oefening uitgeschakeld.
- 📝 Feedback vraagt eerst de projectmap. CSBox stuurt daaruit enkel de
  `.xaml`-, `.cs`- en `.csproj`-bestanden en de tekstbestanden (`.txt`, `.csv`,
  `.tsv`, `.json`) door; `bin/`, `obj/` en `.vs/` vallen weg. Van afbeeldingen
  en geluiden gaan enkel pad en grootte mee. Voor het versturen toont CSBox
  hoeveel bestanden meegaan.
- Elke feedbackaanvraag vraagt de map opnieuw, zodat altijd de laatste versie
  meegaat.
- Een map zonder WPF-project (`.csproj` met `UseWPF`) of boven de limiet wordt
  geweigerd met een melding.
- Het feedbackvenster is hetzelfde als bij console-oefeningen. Eerst
  compileert de code; daarna lopen drie soorten tests:
  - **C#-tests**: de structuurtests en controles op het project, bv. dat
    afbeeldingen als content ingesteld zijn;
  - **XAML-tests**: een element bestaat of bestaat niet, met de juiste
    attributen, tekst of kinderen, bv. een `Button` met `Margin` 30,20;
  - **UI-tests**: het venster of de pagina wordt geladen zonder scherm, de test
    vult velden in, klikt op knoppen en controleert wat er verschijnt.
- Score, sterren en 🏆 zoals bij console-oefeningen. De score komt van de
  server.
- WPF-oefeningen staan niet in examens.

### AI-tutor en suggesties

- De AI-tutor zoals in WebBox: vraag en antwoord, geen oplossing en geen
  deeloplossing, dagquotum, maandbudget. De links gaan naar de cursus
  [CS-course](https://rogiervdl.github.io/CS-course/) in pro-modus.
- 💬 Suggestie zoals in WebBox.

### Dashboard

Op `/dashboard` met de pincode van de beheerder, met dezelfde weergaven als
WebBox: activiteit, studenten, AI-verbruik, aanmeldingen, incidenten,
suggesties, examens en opties, plus de exports naar Excel.

### Examens

Zoals `webbox-ai/docs/plan-examens.md`: Schoolyear herkennen, enkel
examenoefeningen, geen tutor, feedback, suggesties of high scores, examenwerk
bewaren per examensessie, herstelcode, incidentdetectie bij plakken en
nakijken in het dashboard met de tests van de oefening. Code uit de cursus
[CS-course](https://rogiervdl.github.io/CS-course/) is een toegelaten bron.

---

## Technische uitwerking

### Structuur

Dezelfde indeling als WebBox:

```
app.js            ← enkel opstarten: Express, routes, WebSocket
client/           ← de frontend (nu public/)
server/
├── db/           ← alle SQL, schema.sql
├── middleware/
├── routes/
├── services/     ← o.a. runner.js: de pool en de code-transformaties uit app.js
└── prompts/      ← coach.md, vak-ooad.md
content/ooad/<module>/<oefening>/
├── Program.cs  classes/Persoon.cs  readme.md  properties.json
└── _oplossing/   ← nu Oplossing.cs
runner/  wasm-host/
```

- `content/` staat buiten de webroot; de middleware die `Oplossing.cs` blokkeert
  vervalt.
- `index.json` vervalt: de catalogus komt van schijf, met een `properties.json`
  per map, zoals in WebBox.
- `opgave.md` wordt `readme.md`.
- **De padregel** (in `server/services/paden.js` en in `bestanden.js`): een
  bestandsnaam in de hoofdmap of in `classes/`, `files/` of `media/`, segmenten van
  letters, cijfers, `.`, `_` en `-`, niet beginnend met `.` of `_`, met een
  extensie die bij de map hoort. De mappen en hun extensies staan op één plaats
  in de code. De server controleert de regel bij
  bewaren, bij examenwerk en bij incidenten.

### AI-tutor

- De cursusmodus hoort bij het vak: `"cursusmodus": "pro"` in
  `content/ooad/properties.json`. Een later vak zoals ADF kan zo de n00b-modus
  krijgen, met een eigen `vak-<vak>.md`.
- `npm run inhoudstafel` leest de hoofdstukken van
  `https://rogiervdl.github.io/CS-course/` en schrijft per vak de sectie
  "## Cursus" in `vak-<vak>.md`: per hoofdstuk de URL in de modus van dat vak,
  met de h2- en h3-titels en hun anker, zonder de titels die enkel in de andere
  modus staan.
- De incidentdetectie leest dezelfde cursus in als toegelaten bron
  (`server/services/cursus.js`).

### Runner

- **Meerdere bestanden.** Een compileeraanvraag krijgt `bestanden` (pad →
  inhoud); elk bestand wordt een eigen syntax tree met zijn pad, zodat elke
  fout bestand en regel meekrijgt. `transformeer` loopt per bestand; de
  helperklasse komt er als apart bestand bij.
- **Gegevensbestanden.** De bestanden in `files/` gaan als base64 mee in een
  gegenereerde module-initializer, die ze bij het starten in de werkmap
  schrijft. Zo werkt `File.ReadAllText("files/...")` in WASM en op de server.
- **Klassieke C#.** De runner voegt geen usings toe en weigert top-level
  statements; elk programma heeft een klasse met `Main`. Een lege of
  ontbrekende `Program.cs` krijgt een standaardprogramma met `using System;`
  en `public static void Main()`.
- **Syntaxcontrole.** Ctrl+S slaat op en vraagt `/api/compile/syntax`: de
  runner parseert de .cs-bestanden ongewijzigd (aanvraagtype `syntax`), zonder
  te compileren, en geeft de syntaxfouten en top-level statements terug. Ze
  verschijnen in het foutenpaneel. Uitvoeren kan enkel met Run of Ctrl+Enter.
- **Cultuur.** De hulpklasse zet bij het starten van elk programma een cultuur
  met de opmaak van nl-BE (getallen, bedragen, datums), gebouwd op de
  invariante cultuur, zodat de uitvoer in WASM (zonder ICU) en op de server
  dezelfde is.
- **Scriptmodus weg.** `/api/run` en de `CSharpScript`-tak in de runner
  vervallen; WASM en WebSocket gebruiken allebei de compileermodus.
- **Afscherming.** `/api/compile` en de WebSocket vereisen een sessie; de
  WebSocket leest de sessiecookie bij de upgrade.
- **Uitvoering op de server.** Het proces van `dotnet exec` krijgt een minimale
  omgeving in plaats van `process.env`, zodat studentencode geen sleutels of
  connectiestrings kan lezen. Het draait als een gebruiker zonder schrijfrechten
  buiten zijn tijdelijke map.

### Tests

- Een nieuw aanvraagtype `test` in de runner: compileren, en de structuurtests
  uitvoeren op het syntaxmodel van Roslyn, zonder de code te draaien.
- Uitvoertests draaien het gecompileerde programma via `dotnet exec`, met
  dezelfde afscherming als de WebSocket-runner, een timeout en een limiet op de
  uitvoer.
- De server berekent de score en bewaart ze in `checkers_feedback`; de client
  stuurt geen score door.
- Het formaat komt in `docs/tests-schema.md`.

### Stijlcontrole

- **StyleCop.Analyzers** (`StyleCop.Analyzers.Unstable` 1.2.0.556) in de
  runner, enkel als DLL in `runner-bin/analyzers/`, niet als analyzer op de
  runner zelf. Het aanvraagtype `test` laat na het compileren de analyzers
  lopen (`CompilationWithAnalyzers`, in `runner/StijlControle.cs`) en geeft
  de stijlfouten terug in `style`; met stijlfouten lopen de tests niet en
  geeft `/api/feedback` `{ stijl }` terug.
- **Uitzondering.** SA1500 op de `}` van een property met beginwaarde
  (`} = 0;`) valt weg: StyleCop kent die syntax niet.
- **Regels.** Enkel deze staan aan, op `warning`; alle andere StyleCop-regels
  staan uit:

  | Groep | Regels |
  |---|---|
  | Naamgeving | SA1300, SA1303, SA1306, SA1307, SA1312, SA1313 |
  | Velden private | SA1401 |
  | Eén type per bestand | SA1402, SA1649 |
  | Spaties | SA1001–SA1003, SA1008–SA1013, SA1025 |
  | Eén statement per regel | SA1106, SA1107 |
  | Accolades | SA1500, SA1501, SA1519, SA1520 |
  | Lege regels | SA1505, SA1507, SA1508, SA1509, SA1517 |
  | Volgorde | SA1206, SA1212 |
  | Inspringing | SA1027, SA1137 |
  | Ingebouwde types | SA1121 |

- **Eigen regels** in `runner/StijlRegels.cs`, op het syntaxmodel: geen `var`
  bij een lokale variabele of in `foreach`, en geen underscore in een naam
  behalve een `_` vooraan bij een veld (in plaats van CA1707, dat niet in
  StyleCop zit).
- **Meldingen** in het Nederlands, per regelcode een vaste tekst in de runner,
  met bestand en regel; de client toont ze zoals `bericht--controle` in WebBox.
- **Nullable uit.** De runner compileert met `NullableContextOptions.Disable`
  en onderdrukt CS8632, zodat `string?` toegelaten is zonder waarschuwing.
- **Inhoud.** Elk type in een eigen bestand in `classes/`; de startcodes en
  oplossingen worden daarop aangepast en mogen zelf geen stijlfouten geven.
- **WPF.** De `.cs`-bestanden van een WPF-project krijgen dezelfde controle,
  behalve `App.xaml.cs`, `AssemblyInfo.cs` en de gegenereerde bestanden.

### WPF-tests

**Doorsturen.** Een `<input type="file" webkitdirectory>` geeft de bestanden
van de map met hun relatieve pad. De client filtert op pad en extensie, leest
enkel de doorgestuurde tekstbestanden in en stuurt ze als JSON naar
`/api/feedback/wpf`. Limieten per aanvraag, in client en server: 100 tekstbestanden met samen
1 MB, en 500 afbeeldingen en geluiden (enkel pad en grootte).
De server past de padregel toe met de WPF-extensies en bewaart de bestanden
niet, enkel de score.

**Tests uit reposchecker.** Het testformaat en de tests van de WPF-oefeningen
komen uit `reposchecker/courses/OOAD/OOAD.json5`, per oefening in
`properties.json`, in hetzelfde formaat als `docs/tests-schema.md`: één lijst
`tests`, met de voorvoegsels `xaml*`, `cs*` en `wpf*` in `assert`:

- `xaml`: `xamlExists`, `xamlNotExists` en `xamlChildren` met een selector op
  elementen en attributen (`DockPanel.Dock` als `DockPanelDock`), `contains`,
  `count` en `min`;
- `cs`: o.a. `ResourceIsContent` op de `.csproj`;
- `wpf`: een C#-script per test, met `FindControl<T>`, `RaiseEvent` en de
  meldingen als JSON op de uitvoer.

De XAML- en C#-tests lopen in de runner (aanvraagtype `wpftest`), met de logica
van `XamlChecker.cs` en `CsTestAsserts.cs` uit reposchecker. De XAML wordt
gelezen met DTD's uitgeschakeld.

**Compileren in twee stappen.**

1. De runner genereert per `.xaml` wat Visual Studio genereert: de partial class
   uit `x:Class`, een veld per `x:Name` met zijn type, `InitializeComponent` en
   de `Main` uit `App.xaml`. Daarna compileert hij alles tegen de
   WPF-referentie-assemblies (`Microsoft.WindowsDesktop.App.Ref`, gedownload bij
   het bouwen van de image). De foutmeldingen uit deze stap gaan naar de
   student.
2. Lukt stap 1, dan compileert de runner dezelfde code tegen de stubs. Mislukt
   stap 2, dan meldt de feedback dat de UI-tests niet konden lopen, zonder
   aftrek.

**Stubs.** Een eigen assembly `runner/wpf-stubs/` met de namespaces van WPF.
Ze tekent niets; ze heeft de properties, events en methodes die de cursus
gebruikt:

- layout: `Grid` met `RowDefinition` en `ColumnDefinition`, `StackPanel`,
  `DockPanel`, `WrapPanel`, `ScrollViewer`, `Border`, `TabControl` met
  `TabItem`, `Menu` met `MenuItem` en `Separator`, `StatusBar` met
  `StatusBarItem`;
- vensters: `Window`, `Page`, `Frame` met `Navigate` en `Content`,
  `Application`;
- controls: `TextBlock`, `TextBox`, `PasswordBox`, `RichTextBox` met
  `FlowDocument` en `Paragraph`, `Button`, `Label`, `Image`, `ListBox` met
  `ListBoxItem`, `ComboBox` met `ComboBoxItem`, `RadioButton`, `CheckBox`,
  `Slider`, `DatePicker`;
- inlines: `Run`, `Bold`, `Italic`, `Underline`, `LineBreak`;
- verder: `Uri`, `BitmapImage`, `Thickness`, `SolidColorBrush`, `Brushes`,
  `Color`, `FontWeights`, `Visibility`, `IsEnabled`, `Tag`, `Children`,
  `MessageBox`, `OpenFileDialog`, `SaveFileDialog`, `OpenFolderDialog`,
  `SoundPlayer` en `MediaPlayer`.

Niet in de stubs: `Canvas`, `Ellipse`, `Rectangle`, `MediaElement`, styles,
templates, data binding en animaties. De `MainWindow` van de oefenbladen
gebruikt `DataTemplate` en binding voor de navigatie; `properties.json` sluit
zulke startbestanden uit van stap 2.

De stubs bootsen het gedrag na waar de tests op steunen: een property zetten
vuurt het bijhorende event (`IsChecked` → `Checked`/`Unchecked`,
`SelectedIndex` → `SelectionChanged`, `Text` → `TextChanged`, `Value` →
`ValueChanged`), `RadioButton`s met dezelfde `GroupName` sluiten elkaar uit,
`RaiseEvent(ClickEvent)` roept de handlers aan, en eigen subklassen van
`Button` werken.

**Bestanden en resources.**

- Tekstbestanden worden echt gelezen: de runner zet ze in de tijdelijke map met
  hun relatieve pad, naast de gecompileerde `.dll`. Een relatief pad en
  `AppDomain.CurrentDomain.BaseDirectory` komen zo allebei bij het bestand uit;
  de gestubde bestandsdialogen geven een vast bestand in die map terug.
- Afbeeldingen en geluiden worden niet geladen. `BitmapImage` bewaart enkel zijn
  `Uri`, zodat een test kan nagaan naar welk bestand een `Image` wijst.
  `SoundPlayer` en `MediaPlayer` spelen niets af, maar onthouden het bestand en
  de aanroepen van `Open`, `Play`, `Pause` en `Stop`.
- Een C#-test controleert per bestand de instelling in de `.csproj`, met de
  patronen (`Include`, `Exclude`, `Update`) toegepast op de doorgestuurde
  paden:
  - afbeeldingen via een relatieve `Uri`: `Resource`, of `Content` met
    Copy to Output Directory;
  - bestanden die met `File.*` gelezen worden: `Content` of `None` met
    Copy to Output Directory `PreserveNewest` of `Always`.
- Of een afbeelding er goed uitziet of een bestand een geldige afbeelding is,
  wordt niet getest.

**XAML-lader.** `InitializeComponent` roept in stap 2 een lader in de stubs
aan. Die maakt de objecten uit de XAML, zet attributen om (`"8,3"` →
`Thickness`, `"2*"` → `GridLength`, kleurnamen en `#666` → `Brush`, enums),
verwerkt attached properties (`Grid.Row`, `DockPanel.Dock`), vult de velden
per `x:Name` en koppelt de events aan de handlers van de code-behind.

**Uitvoeren.** Per UI-test laadt een gegenereerde `Main` het venster of de
pagina uit het `file` van de test, voert het script uit en schrijft de
meldingen als JSON, zoals `WpfTestInjector.cs` in reposchecker. Dat gebeurt via
`dotnet exec` met dezelfde afscherming, timeout en uitvoerlimiet als de
uitvoertests. `HOME` wijst naar de tijdelijke map, zodat
`Environment.GetFolderPath` en de gestubde dialogen daarin lezen en schrijven;
de doorgestuurde tekstbestanden staan daar met hun relatieve pad.

### Server en databank

- `server/` wordt gekopieerd uit WebBox, zonder wat enkel voor HTML/CSS/JS
  bestaat: `lint/`, `basisdocument.js`, `nakijkhost.js`, de migratie- en
  samenvoegscripts en `testpagina.js`.
- Het schema blijft gelijk; de vakkentabel bevat enkel `ooad`.
- Nakijken van examens gebruikt de runner op de server; een apart nakijkdomein
  is niet nodig.
- Variabelen in Railway: `DATABASE_URL`, `ANTHROPIC_API_KEY`, `ADMIN_PINCODE`,
  de mailsleutels; lokaal in `.env`.

### Client

Over te nemen uit WebBox en om te zetten naar ES modules: `storage`,
`themeswitcher`, `layout`, `resizer`, `clipboard`, `bestanden`, `panelen`,
`bestandsbrowser`, `omgeving`, `auth`, `voortgang`, `feedbacktekst`,
`assistent`, `suggesties`, `highscores`, `incidenten`, `exercises` en de
dashboardmodules.

Niet over te nemen: `preview`, `paginabouw`, `omzetting`, `lorem`,
`tagcompletion`, `tagwrap`, `linkedtags`, `csssuggesties`, `toetsen*` en
`match`.

CSBox-eigen modules die blijven: `wasm`, `terminal`, `errors`, `formatter`,
`syntax`, en `aanvulling` met `csharp-api` en `csharp-code`: een eigen
aanvulling uit een vaste lijst die bij de cursus past (namespaces, types,
leden, sleutelwoorden, snippets) en uit de eigen code (klassen, leden,
variabelen met een herkenbaar type), zonder server. De woordsuggesties van
Monaco staan uit. `prism-kleuren` kleurt C# met Prism, zoals de opgavepagina's
van de oefenbladen: in de editor via een tokens provider, in de opgave via
`Prism.highlight`, met één kleurtabel per schema. `feedback` en
`feedbacktekst` tonen de feedback.

---

## Stappen

Elke stap is apart te deployen.

1. **Runner afschermen.** Minimale omgeving voor `dotnet exec`, aparte
   gebruiker in de Dockerfile. Moet klaar zijn vóór er sleutels in de
   Railway-variabelen komen.
2. **Herstructureren.** `public/` → `client/`, `app.js` opsplitsen in
   `server/`, oefeningen naar `content/` met `properties.json`, `readme.md` en
   `_oplossing/`, catalogus van schijf met `/api/content`. `index.json` en de
   scriptmodus weg.
3. **Toolbar en kleurschema's.** Toolbar, `storage`, `themeswitcher`, `layout`
   en de CSS-thema's uit WebBox; ook de terminal volgt het schema.
4. **Meerdere bestanden.** `bestanden`, `panelen` en `bestandsbrowser`; de
   runner compileert meerdere bestanden; fouten met bestand en regel,
   klikbaar; kopieerknop per bestand. De layoutknop wisselt dan, zoals in
   WebBox, de stapeling van de editorpanelen.
5. **Bestanden toevoegen, hernoemen en verwijderen.** De vaste lijst mappen,
   knoppen in de boom, de padregel in client en server, `Program.cs`
   beschermd.
6. **Databank en aanmelden.** Postgres op Railway, `server/db/`, aanmelden met
   pincode, sessies, "Mail mijn code", verplicht aanmelden; `/api/compile` en
   de WebSocket achter een sessie.
7. **Voortgang.** Opslaan op de server, tijdmeting, sterren en percentages in
   de keuzelijsten, onbewaarde wijzigingen, high scores.
8. **Dashboard.** Aanmelden als beheerder, studenten met import en exports,
   activiteit, aanmeldingen, logboek en opties.
9. **Feedback.** Testformaat, aanvraagtype `test` in de runner, uitvoertests in
   een afgeschermd proces, feedbackvenster rechtsonder, score in
   `checkers_feedback`, de tests van de bestaande oefeningen.
10. **Stijlcontrole.** StyleCop.Analyzers en de eigen regels in de runner,
    Nederlandse meldingen, stijlfouten vóór de tests in het feedbackvenster;
    elk type in een eigen bestand in de startcodes en oplossingen.
11. **WPF-feedback.** Projectmap kiezen en filteren, `/api/feedback/wpf`,
    aanvraagtype `wpftest` met de XAML- en C#-tests, compileren tegen de
    WPF-referentie-assemblies, de stubs en de XAML-lader, de UI-tests, de tests
    van de WPF-oefeningen uit reposchecker.
12. **AI-tutor.** `coach.md` en `vak-ooad.md` (uit de skill `course-ooad`),
    de inhoudstafel van CS-course in pro-modus, quotum, budget, uitvoercontrole tegen `_oplossing/`, AI-verbruik in het
    dashboard.
13. **Suggesties.** Knop en modal, weergave in het dashboard.
14. **Examens.** Schoolyear herkennen, examencontext en -afscherming,
    examenwerk met herstelcode, incidentdetectie, nakijken en Excel in het
    dashboard.
15. **Documentatie.** `CLAUDE.md`, `docs/ontwerp.md`, `docs/checklist.md` en
    `readme.md` naar het model van WebBox; dit plan verwijderen.
