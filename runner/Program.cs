using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Scripting;
using Microsoft.CodeAnalysis.Scripting;

var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

// Trigger JIT door een lege script te draaien bij opstart
try { await CSharpScript.RunAsync("", ScriptOptions.Default); } catch { }

// Signaal naar Node.js dat de runner klaar is
Console.Error.WriteLine("READY");
Console.Error.Flush();

while (true)
{
    var line = Console.In.ReadLine();
    if (line == null) break;

    RunRequest? req = null;
    try { req = JsonSerializer.Deserialize<RunRequest>(line, jsonOptions); } catch { }
    if (req?.Code == null) { WriteResult(Error("Ongeldige invoer.")); continue; }

    var code = PrepareCode(req.Code);
    var outputLines = new List<string>();
    var errors = new List<RunError>();

    var sb = new StringBuilder();
    var oldOut = Console.Out;
    var oldIn  = Console.In;

    Console.SetOut(new StringWriter(sb));
    Console.SetIn(new StringReader(req.Input ?? ""));

    try
    {
        using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(10));

        var opts = ScriptOptions.Default
            .WithLanguageVersion(LanguageVersion.Latest)
            .WithReferences(AppDomain.CurrentDomain.GetAssemblies()
                .Where(a => !a.IsDynamic && !string.IsNullOrEmpty(a.Location)))
            .WithImports(
                "System", "System.Collections.Generic", "System.Linq",
                "System.Text", "System.Text.Json", "System.IO",
                "System.Threading", "System.Threading.Tasks"
            );

        await CSharpScript.RunAsync(code, opts, cancellationToken: cts.Token);

        outputLines = SplitOutput(sb.ToString());
    }
    catch (CompilationErrorException ex)
    {
        foreach (var d in ex.Diagnostics)
        {
            if (d.Severity is DiagnosticSeverity.Error or DiagnosticSeverity.Warning)
            {
                var span = d.Location.GetLineSpan();
                // Herstel regelnummer: aftrekken van de automatisch toegevoegde aanroep
                var line1 = span.StartLinePosition.Line + 1;
                errors.Add(new RunError(line1, span.StartLinePosition.Character + 1,
                    d.Severity == DiagnosticSeverity.Warning ? "warning" : "error",
                    d.GetMessage()));
            }
        }
    }
    catch (OperationCanceledException)
    {
        outputLines = SplitOutput(sb.ToString());
        errors.Add(new RunError(0, 0, "error", "Timeout: code duurde langer dan 10 seconden."));
    }
    catch (Exception ex)
    {
        outputLines = SplitOutput(sb.ToString());
        errors.Add(new RunError(0, 0, "error", ex.GetType().Name + ": " + ex.Message));
    }
    finally
    {
        Console.SetOut(oldOut);
        Console.SetIn(oldIn);
    }

    WriteResult(new RunResult(outputLines, errors));
}

// ── Hulpfuncties ──────────────────────────────────────

// Detecteer class+Main stijl en voeg een reflectie-aanroep toe (werkt ook als Main private is)
static string PrepareCode(string code)
{
    var hasMain    = Regex.IsMatch(code, @"\bstatic\s+(?:(?:async\s+)?Task|void)\s+Main\s*\(");
    var classMatch = Regex.Match(code, @"\bclass\s+(\w+)");
    if (hasMain && classMatch.Success)
    {
        var cls = classMatch.Groups[1].Value;
        // Gebruik reflectie zodat private Main ook werkt
        return code + $@"
{{
    var __t = System.Reflection.Assembly.GetExecutingAssembly()?.GetTypes()
              .FirstOrDefault(t => t.Name == ""{cls}"");
    var __m = __t?.GetMethod(""Main"",
        System.Reflection.BindingFlags.Static |
        System.Reflection.BindingFlags.Public  |
        System.Reflection.BindingFlags.NonPublic);
    if (__m != null)
    {{
        var __p = __m.GetParameters();
        var __arg = __p.Length > 0 ? new object[] {{ Array.Empty<string>() }} : Array.Empty<object>();
        var __r = __m.Invoke(null, __arg);
        if (__r is Task __task) await __task;
    }}
}}";
    }
    return code;
}

static List<string> SplitOutput(string raw)
{
    var lines = raw.Split('\n').Select(l => l.TrimEnd('\r')).ToList();
    if (lines.Count > 0 && lines[^1] == "") lines.RemoveAt(lines.Count - 1);
    return lines;
}

void WriteResult(RunResult result)
{
    Console.Out.WriteLine(JsonSerializer.Serialize(result, jsonOptions));
    Console.Out.Flush();
}

static RunResult Error(string msg) =>
    new RunResult([], [new RunError(0, 0, "error", msg)]);

record RunRequest(string Code, string? Input);
record RunError(int Line, int Col, string Severity, string Message);
record RunResult(List<string> Output, List<RunError> Errors);
