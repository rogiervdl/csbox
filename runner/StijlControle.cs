using System.Collections.Immutable;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Diagnostics;
using Microsoft.CodeAnalysis.Text;

/// <summary>
/// De stijlcontrole vóór de feedback: een selectie van de regels van
/// StyleCop.Analyzers, plus de eigen regels uit StijlRegels. Elke overtreding
/// komt terug als waarschuwing met bestand, regel en een Nederlandse melding.
/// </summary>
static class StijlControle
{
    // per StyleCop-regel die aan staat de melding; {0} is de naam of het teken op die plaats, {{ en }} zijn accolades
    static readonly Dictionary<string, string> Meldingen = new()
    {
        // naamgeving
        ["SA1300"] = "`{0}` moet met een hoofdletter beginnen",
        ["SA1303"] = "constante `{0}` moet met een hoofdletter beginnen",
        ["SA1306"] = "veld `{0}` moet met een kleine letter beginnen",
        ["SA1307"] = "publiek veld `{0}` moet met een hoofdletter beginnen",
        ["SA1312"] = "variabele `{0}` moet met een kleine letter beginnen",
        ["SA1313"] = "parameter `{0}` moet met een kleine letter beginnen",

        // velden private
        ["SA1401"] = "veld `{0}` moet private zijn; gebruik een property om het naar buiten te tonen",

        // één type per bestand
        ["SA1402"] = "`{0}` hoort in een eigen bestand",
        ["SA1649"] = "de bestandsnaam moet de naam van het type zijn: `{0}.cs`",

        // spaties
        ["SA1001"] = "na een komma komt één spatie, ervoor geen",
        ["SA1002"] = "na een puntkomma komt één spatie, ervoor geen",
        ["SA1003"] = "de spaties rond `{0}` kloppen niet",
        ["SA1008"] = "de spaties rond `(` kloppen niet",
        ["SA1009"] = "de spaties rond `)` kloppen niet",
        ["SA1010"] = "de spaties rond `[` kloppen niet",
        ["SA1011"] = "de spaties rond `]` kloppen niet",
        ["SA1012"] = "de spaties rond `{{` kloppen niet",
        ["SA1013"] = "de spaties rond `}}` kloppen niet",
        ["SA1025"] = "gebruik niet meerdere spaties na elkaar",

        // één statement per regel
        ["SA1106"] = "lege statement: verwijder de overbodige `;`",
        ["SA1107"] = "zet niet meer dan één statement op een regel",

        // accolades
        ["SA1500"] = "zet de accolade op een eigen regel",
        ["SA1501"] = "zet het statement niet op één regel met zijn accolades",
        ["SA1519"] = "accolades mogen enkel weggelaten worden als het hele statement op één regel staat",
        ["SA1520"] = "gebruik in een if/else overal accolades, of nergens",

        // lege regels
        ["SA1505"] = "geen lege regel na `{{`",
        ["SA1507"] = "niet meer dan één lege regel na elkaar",
        ["SA1508"] = "geen lege regel vóór `}}`",
        ["SA1509"] = "geen lege regel vóór `{{`",
        ["SA1517"] = "geen lege regels bovenaan het bestand",

        // volgorde
        ["SA1206"] = "de volgorde van de keywords klopt niet: eerst de toegankelijkheid, bv. `public static` en niet `static public`",
        ["SA1212"] = "zet `get` vóór `set`",

        // inspringing
        ["SA1027"] = "gebruik spaties om in te springen, geen tabs",
        ["SA1137"] = "elementen op hetzelfde niveau springen even ver in",

        // ingebouwde types
        ["SA1121"] = "gebruik `{1}` in plaats van `{0}`",
    };

    // de meldingen van de eigen regels
    static readonly Dictionary<string, string> EigenMeldingen = new()
    {
        [StijlRegels.GeenVar] = "gebruik het type in plaats van `var`",
        [StijlRegels.GeenUnderscore] = "`{0}`: gebruik geen underscore in een naam",
    };

    // de ingebouwde types voor SA1121
    static readonly Dictionary<string, string> Aliassen = new()
    {
        ["Boolean"] = "bool", ["Byte"] = "byte", ["Char"] = "char", ["Decimal"] = "decimal", ["Double"] = "double",
        ["Int16"] = "short", ["Int32"] = "int", ["Int64"] = "long", ["Object"] = "object", ["Single"] = "float", ["String"] = "string",
    };

    // de instellingen van StyleCop: 3 spaties, en één type per bestand geldt ook voor enums, structs en interfaces
    const string Instellingen = """
        {
          "settings": {
            "indentation": { "indentationSize": 3, "useTabs": false },
            "maintainabilityRules": { "topLevelTypes": [ "class", "interface", "struct", "enum" ] }
          }
        }
        """;

    // de analyzers die minstens één van de regels melden; één keer geladen
    static readonly Lazy<ImmutableArray<DiagnosticAnalyzer>> Analyzers = new(LaadAnalyzers);

    /// <summary>
    /// Laadt de analyzers uit StyleCop.Analyzers.dll naast de runner, enkel
    /// die met minstens één regel die aan staat.
    /// </summary>
    static ImmutableArray<DiagnosticAnalyzer> LaadAnalyzers()
    {
        // de assembly naast de runner
        string pad = Path.Combine(AppContext.BaseDirectory, "analyzers", "StyleCop.Analyzers.dll");
        Assembly assembly = Assembly.LoadFrom(pad);

        // elke analyzer met een regel uit de lijst
        return assembly.GetTypes()
            .Where(type => !type.IsAbstract && typeof(DiagnosticAnalyzer).IsAssignableFrom(type) && type.GetConstructor(Type.EmptyTypes) != null)
            .Select(type => (DiagnosticAnalyzer)Activator.CreateInstance(type)!)
            .Where(analyzer => analyzer.SupportedDiagnostics.Any(regel => Meldingen.ContainsKey(regel.Id)))
            .ToImmutableArray();
    }

    /// <summary>
    /// Laadt de analyzers alvast, zodat de eerste controle niet trager is.
    /// </summary>
    public static void Warmop()
    {
        _ = Analyzers.Value;
    }

    /// <summary>
    /// Controleert de stijl van de bestanden van de student en geeft de
    /// overtredingen, gesorteerd op bestand en regel.
    /// </summary>
    public static List<RunError> Controleer(List<SyntaxTree> trees, List<MetadataReference> references)
    {
        // enkel de regels uit de lijst; alle andere van StyleCop staan uit
        Dictionary<string, ReportDiagnostic> regels = Analyzers.Value
            .SelectMany(analyzer => analyzer.SupportedDiagnostics)
            .Select(regel => regel.Id)
            .Distinct()
            .ToDictionary(id => id, id => Meldingen.ContainsKey(id) ? ReportDiagnostic.Warn : ReportDiagnostic.Suppress);

        // een compilatie als bibliotheek, enkel voor de analyzers
        CSharpCompilation compilation = CSharpCompilation.Create(
            "StijlControle",
            syntaxTrees: trees,
            references: references,
            options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, nullableContextOptions: NullableContextOptions.Disable, specificDiagnosticOptions: regels));

        // de analyzers met stylecop.json als instellingen
        AnalyzerOptions opties = new AnalyzerOptions([new TekstBestand("stylecop.json", Instellingen)]);
        CompilationWithAnalyzers metAnalyzers = compilation.WithAnalyzers(Analyzers.Value, opties);
        ImmutableArray<Diagnostic> diagnostics = metAnalyzers.GetAnalyzerDiagnosticsAsync().GetAwaiter().GetResult();

        // de meldingen van StyleCop, enkel de regels uit de lijst
        List<RunError> fouten = [];
        foreach (Diagnostic diagnostic in diagnostics)
        {
            if (!Meldingen.TryGetValue(diagnostic.Id, out string? melding)) continue;
            if (IsPropertyInitializer(diagnostic)) continue;
            fouten.Add(AlsFout(diagnostic.Id, diagnostic.Location, Vul(diagnostic.Id, melding, diagnostic.Location)));
        }

        // de eigen regels
        foreach (SyntaxTree tree in trees)
        {
            foreach ((string code, Location plaats, string naam) in StijlRegels.Controleer(tree))
            {
                fouten.Add(AlsFout(code, plaats, string.Format(EigenMeldingen[code], naam)));
            }
        }

        // gesorteerd op bestand en regel
        return fouten.OrderBy(fout => fout.File).ThenBy(fout => fout.Line).ThenBy(fout => fout.Col).ToList();
    }

    /// <summary>
    /// Zegt of een melding van SA1500 over de sluitaccolade van een property
    /// met beginwaarde gaat (<c>} = 0;</c>): die syntax kent StyleCop niet.
    /// </summary>
    static bool IsPropertyInitializer(Diagnostic diagnostic)
    {
        // enkel SA1500 op een } van een accessorlijst
        if (diagnostic.Id != "SA1500" || diagnostic.Location.SourceTree == null) return false;
        SyntaxToken token = diagnostic.Location.SourceTree.GetRoot().FindToken(diagnostic.Location.SourceSpan.Start);

        // van een property met beginwaarde
        return token.IsKind(SyntaxKind.CloseBraceToken)
            && token.Parent is Microsoft.CodeAnalysis.CSharp.Syntax.AccessorListSyntax lijst
            && lijst.Parent is Microsoft.CodeAnalysis.CSharp.Syntax.PropertyDeclarationSyntax property
            && property.Initializer != null;
    }

    /// <summary>
    /// Vult een melding aan met de naam of het teken op de plaats van de
    /// overtreding; bij SA1121 ook het ingebouwde type.
    /// </summary>
    static string Vul(string code, string melding, Location plaats)
    {
        // de tekst op de plaats; bij een naam enkel het laatste deel (System.Int32 → Int32)
        string tekst = plaats.SourceTree?.GetText().ToString(plaats.SourceSpan) ?? "";
        if (tekst.Length == 0 && plaats.SourceTree != null) tekst = plaats.SourceTree.GetRoot().FindToken(plaats.SourceSpan.Start).Text;
        string naam = tekst.Split('.').Last().Trim();

        // de naam, en bij SA1121 het ingebouwde type
        string alias = Aliassen.GetValueOrDefault(naam, naam.ToLowerInvariant());
        return string.Format(melding, naam, alias);
    }

    /// <summary>
    /// Maakt een waarschuwing met bestand, regel en kolom, en de code achteraan.
    /// </summary>
    static RunError AlsFout(string code, Location plaats, string melding)
    {
        LinePosition start = plaats.GetLineSpan().StartLinePosition;
        return new RunError(plaats.SourceTree?.FilePath, start.Line + 1, start.Character + 1, "warning", $"{melding} ({code})");
    }

    /// <summary>
    /// Een bijkomend bestand voor de analyzers, zoals stylecop.json.
    /// </summary>
    sealed class TekstBestand(string pad, string inhoud) : AdditionalText
    {
        public override string Path { get; } = pad;

        public override SourceText GetText(CancellationToken cancellationToken = default)
        {
            return SourceText.From(inhoud);
        }
    }
}
