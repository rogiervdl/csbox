using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using Microsoft.CodeAnalysis.Scripting;

// invoer en uitvoer in UTF-8, zoals Node ze schrijft en leest (op Windows is dat niet de standaard)
Console.InputEncoding = System.Text.Encoding.UTF8;
Console.OutputEncoding = System.Text.Encoding.UTF8;

// JSON met camelCase, zoals Node het verwacht; lege velden gaan niet mee
var jsonOptions = new JsonSerializerOptions
{
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
};

// warm op met een leeg script: dat triggert de JIT en laadt de assemblies die
// CompileCode als referenties meegeeft
try { await CSharpScript.RunAsync("", ScriptOptions.Default); } catch { }

// laad de analyzers van de stijlcontrole alvast
try { StijlControle.Warmop(); } catch (Exception ex) { Console.Error.WriteLine($"Stijlcontrole niet geladen: {ex.Message}"); }

// signaal naar Node.js dat de runner klaar is
Console.Error.WriteLine("READY");
Console.Error.Flush();

// verwerk de aanvragen, één JSON-regel per aanvraag
while (true)
{
    // lees de volgende regel; einde van de invoer stopt de runner
    string? line = Console.In.ReadLine();
    if (line == null) break;

    // lees de aanvraag; ongeldige invoer krijgt een fout terug
    RunRequest? request = null;
    try { request = JsonSerializer.Deserialize<RunRequest>(line, jsonOptions); } catch { }
    if (request?.Files == null || request.Files.Count == 0)
    {
        WriteCompileResult(new CompileResult(null, [new RunError(null, 0, 0, "error", "Ongeldige invoer.")]));
        continue;
    }

    // enkel de syntax controleren, compileren en testen, of compileren tot een DLL; uitvoeren gebeurt in WASM of in een afgeschermd proces
    WriteCompileResult(request.Type switch
    {
        "syntax" => CheckSyntax(ParseFiles(request.Files)),
        "test" => CompileAndTest(request.Files, request.Sources ?? [], request.Tests ?? []),
        _ => CompileCode(request.Files),
    });
}

// ── Testen ────────────────────────────────────────────────────────────────────

/// <summary>
/// Compileert de bronbestanden en controleert, als dat lukt, de stijl van de
/// bestanden zoals de student ze schreef (sources), zonder de omzettingen van
/// de server. Zonder stijlfouten lopen de C#-tests, en gaat de DLL mee terug
/// voor de console-tests; met stijlfouten komen enkel die terug.
/// </summary>
static CompileResult CompileAndTest(List<SourceFile> files, List<SourceFile> sources, List<CsTest> tests)
{
    // compileren; bij fouten geen stijlcontrole en geen tests
    CompileResult compiled = CompileCode(files);
    if (compiled.Dll == null) return compiled;

    // de stijl van de oorspronkelijke bestanden; bij stijlfouten geen tests, en een fout in de controle zelf houdt de tests niet tegen
    List<SyntaxTree> trees = ParseFiles(sources);
    List<RunError> style = [];
    try
    {
        style = StijlControle.Controleer(trees, GetReferences());
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Stijlcontrole mislukt: {ex.Message}");
    }
    if (style.Count > 0) return new CompileResult(null, [], Style: style);

    // de tests op de oorspronkelijke bestanden
    return compiled with { Tests = CsTests.Run(trees, tests) };
}

// ── Compileren ────────────────────────────────────────────────────────────────

/// <summary>
/// Compileert de bronbestanden samen tot één DLL. Elk bestand is een eigen
/// syntax tree met zijn pad, zodat elke fout haar bestand kent. Bestanden
/// onder __csbox/ voegt de server zelf toe; hun fouten tonen we niet.
/// </summary>
static CompileResult CompileCode(List<SourceFile> files)
{
    // een syntax tree per bestand; bij syntaxfouten of top-level statements compileren we niet
    List<SyntaxTree> trees = ParseFiles(files);
    CompileResult syntax = CheckSyntax(trees);
    if (syntax.Errors.Any(error => error.Severity == "error")) return syntax;

    // de referenties: de assemblies die de opwarming geladen heeft
    List<MetadataReference> references = GetReferences();

    // compileer als consoleapplicatie, zonder nullable-waarschuwingen; string? mag wel (CS8632 uit)
    CSharpCompilation compilation = CSharpCompilation.Create(
        "StudentCode",
        syntaxTrees: trees,
        references: references,
        options: new CSharpCompilationOptions(
            OutputKind.ConsoleApplication,
            allowUnsafe: false,
            optimizationLevel: OptimizationLevel.Release,
            nullableContextOptions: NullableContextOptions.Disable,
            specificDiagnosticOptions: new Dictionary<string, ReportDiagnostic> { ["CS8632"] = ReportDiagnostic.Suppress }));

    // gelukt: de DLL in base64
    using MemoryStream stream = new MemoryStream();
    Microsoft.CodeAnalysis.Emit.EmitResult emitResult = compilation.Emit(stream);
    if (emitResult.Success)
    {
        return new CompileResult(Convert.ToBase64String(stream.ToArray()), []);
    }

    // mislukt: de fouten en waarschuwingen in de bestanden van de student, en de fouten zonder bestand (bv. geen Main)
    List<RunError> errors = [];
    foreach (Diagnostic diagnostic in emitResult.Diagnostics)
    {
        // verborgen meldingen en meldingen in de toegevoegde bestanden niet
        if (diagnostic.Severity is DiagnosticSeverity.Hidden) continue;
        string? path = diagnostic.Location.SourceTree?.FilePath;
        if (path != null && path.StartsWith("__csbox/")) continue;

        // bestand, regel en kolom, voor zover gekend
        FileLinePositionSpan span = diagnostic.Location.GetLineSpan();
        bool hasLocation = path != null;
        errors.Add(new RunError(
            path,
            hasLocation ? span.StartLinePosition.Line + 1 : 0,
            hasLocation ? span.StartLinePosition.Character + 1 : 0,
            diagnostic.Severity == DiagnosticSeverity.Warning ? "warning" : "error",
            diagnostic.GetMessage()));
    }
    return new CompileResult(null, errors);
}

/// <summary>
/// Controleert enkel de syntax van de bestanden, zonder te compileren: de
/// parseerfouten, en als die er niet zijn de top-level statements (een
/// parseerfout kan losse statements opleveren). Een DLL komt er niet uit.
/// </summary>
static CompileResult CheckSyntax(List<SyntaxTree> trees)
{
    // de parseerfouten van elk bestand
    List<RunError> errors = [];
    foreach (SyntaxTree tree in trees)
    {
        foreach (Diagnostic diagnostic in tree.GetDiagnostics())
        {
            if (diagnostic.Severity is DiagnosticSeverity.Hidden) continue;
            LinePosition start = diagnostic.Location.GetLineSpan().StartLinePosition;
            errors.Add(new RunError(
                tree.FilePath,
                start.Line + 1,
                start.Character + 1,
                diagnostic.Severity == DiagnosticSeverity.Warning ? "warning" : "error",
                diagnostic.GetMessage()));
        }
    }

    // zonder parseerfouten: de top-level statements
    if (!errors.Any(error => error.Severity == "error")) errors.AddRange(FindTopLevelStatements(trees));
    return new CompileResult(null, errors);
}

// ── Hulpfuncties ──────────────────────────────────────────────────────────────

/// <summary>
/// Geeft de referenties voor een compilatie: de assemblies die de opwarming
/// geladen heeft, zonder die van StyleCop.
/// </summary>
static List<MetadataReference> GetReferences()
{
    return AppDomain.CurrentDomain.GetAssemblies()
        .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location) && !a.Location.Contains("StyleCop"))
        .Select(a => (MetadataReference)MetadataReference.CreateFromFile(a.Location))
        .ToList();
}

/// <summary>
/// Maakt een syntax tree per bestand, met zijn pad, zodat elke fout haar
/// bestand kent. Usings voegen we niet toe: de student schrijft ze zelf.
/// </summary>
static List<SyntaxTree> ParseFiles(List<SourceFile> files)
{
    CSharpParseOptions parseOptions = CSharpParseOptions.Default.WithLanguageVersion(LanguageVersion.Preview);
    return files
        .Select(file => CSharpSyntaxTree.ParseText(file.Code ?? "", parseOptions, path: file.Path ?? ""))
        .ToList();
}

/// <summary>
/// Zoekt top-level statements, die niet toegelaten zijn: één fout per
/// bestand, bij het eerste statement buiten een klasse.
/// </summary>
static List<RunError> FindTopLevelStatements(List<SyntaxTree> trees)
{
    List<RunError> errors = [];
    foreach (SyntaxTree tree in trees)
    {
        // het eerste statement buiten een klasse, als er een is
        GlobalStatementSyntax? statement = tree.GetRoot().DescendantNodes().OfType<GlobalStatementSyntax>().FirstOrDefault();
        if (statement == null) continue;

        // de fout op zijn plaats
        LinePosition start = statement.GetLocation().GetLineSpan().StartLinePosition;
        errors.Add(new RunError(tree.FilePath, start.Line + 1, start.Character + 1, "error",
            "Top-level statements zijn niet toegelaten: zet de code in de methode Main van een klasse."));
    }
    return errors;
}

/// <summary>
/// Schrijft een compileerresultaat als één JSON-regel naar stdout, voor Node.
/// </summary>
void WriteCompileResult(CompileResult result)
{
    // één regel per resultaat, meteen doorgestuurd
    Console.Out.WriteLine(JsonSerializer.Serialize(result, jsonOptions));
    Console.Out.Flush();
}

record RunRequest(string? Type, List<SourceFile>? Files, List<SourceFile>? Sources, List<CsTest>? Tests);
record SourceFile(string? Path, string? Code);
record RunError(string? File, int Line, int Col, string Severity, string Message);
record CompileResult(string? Dll, List<RunError> Errors, List<CsTestResult>? Tests = null, List<RunError>? Style = null);
