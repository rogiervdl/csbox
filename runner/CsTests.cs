using System.Text;
using System.Text.RegularExpressions;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

/// <summary>
/// De C#-asserts uit docs/tests-schema.md: ze lopen op het syntaxmodel van
/// Roslyn, over alle bestanden van de student samen, zonder de code uit te
/// voeren. Elke test geeft een omschrijving en, bij falen, een reden.
/// </summary>
static class CsTests
{
    // de toegankelijkheden: zonder een ervan is een member private en een type internal
    static readonly string[] Toegankelijkheden = ["public", "private", "protected", "internal"];

    /// <summary>
    /// Voert de C#-tests uit, in hun volgorde.
    /// </summary>
    public static List<CsTestResult> Run(List<SyntaxTree> trees, List<CsTest> tests)
    {
        // alle types en enums, ook geneste
        List<SyntaxNode> roots = trees.Select(tree => tree.GetRoot()).ToList();
        List<TypeDeclarationSyntax> types = roots.SelectMany(root => root.DescendantNodes().OfType<TypeDeclarationSyntax>()).ToList();
        List<EnumDeclarationSyntax> enums = roots.SelectMany(root => root.DescendantNodes().OfType<EnumDeclarationSyntax>()).ToList();

        // elke test apart; een fout in een test doet enkel die test falen
        List<CsTestResult> results = [];
        foreach (CsTest test in tests)
        {
            try
            {
                results.Add(RunTest(test, types, enums, roots));
            }
            catch (Exception ex)
            {
                results.Add(new CsTestResult(false, $"test `{test.Assert}`", $"de test kon niet lopen: {ex.Message}"));
            }
        }
        return results;
    }

    /// <summary>
    /// Voert één test uit volgens zijn assert.
    /// </summary>
    static CsTestResult RunTest(CsTest test, List<TypeDeclarationSyntax> types, List<EnumDeclarationSyntax> enums, List<SyntaxNode> roots)
    {
        // de testen zonder klasse
        switch (test.Assert)
        {
            case "csClassExists": return ClassExists(test, types);
            case "csEnumExists": return EnumExists(test, enums);
            case "csContainsText" when string.IsNullOrEmpty(test.Class): return ContainsText(test, roots, "de code");
            case "csNotContainsText" when string.IsNullOrEmpty(test.Class): return NotContainsText(test, roots, "de code");
        }

        // de testen op een klasse: zonder die klasse falen ze meteen
        TypeDeclarationSyntax? type = types.FirstOrDefault(t => MatchesName(test.Class, t.Identifier.Text));
        string omschrijving = Omschrijving(test);
        if (type == null) return new CsTestResult(false, omschrijving, $"klasse `{Leesbaar(test.Class)}` ontbreekt");

        // de assert op de klasse
        return test.Assert switch
        {
            "csInheritsFrom" => InheritsFrom(test, type, omschrijving),
            "csPropertyExists" => PropertyExists(test, type, omschrijving),
            "csPropertyAuto" => PropertyCheck(test, type, omschrijving, IsAuto, "is geen auto-property"),
            "csPropertyNotAuto" => PropertyCheck(test, type, omschrijving, p => !IsAuto(p), "is een auto-property"),
            "csPropertyReadonly" => PropertyCheck(test, type, omschrijving, p => !HasAccessor(p, "set") && !HasAccessor(p, "init"), "heeft een setter"),
            "csSetterThrowsException" => PropertyCheck(test, type, omschrijving, SetterThrows, "de setter gooit geen exception"),
            "csMethodExists" => MethodExists(test, type, omschrijving),
            "csConstructorExists" => ConstructorExists(test, type, omschrijving),
            "csVariableExists" => VariableExists(test, type, omschrijving),
            "csContainsText" => ContainsText(test, [type], $"klasse `{type.Identifier.Text}`"),
            "csNotContainsText" => NotContainsText(test, [type], $"klasse `{type.Identifier.Text}`"),
            _ => new CsTestResult(false, omschrijving, $"onbekende assert `{test.Assert}`"),
        };
    }

    // ── Asserts ───────────────────────────────────────────────────────────────

    /// <summary>
    /// Een klasse bestaat, met de gevraagde modifiers en eventueel basisklasse.
    /// </summary>
    static CsTestResult ClassExists(CsTest test, List<TypeDeclarationSyntax> types)
    {
        // de omschrijving
        string modifiers = test.Modifiers.Count > 0 ? $"{string.Join(" ", test.Modifiers)} " : "";
        string basis = string.IsNullOrEmpty(test.Base) ? "" : $" die erft van `{test.Base}`";
        string omschrijving = $"{modifiers}klasse `{Leesbaar(test.Name)}`{basis}";

        // de klasse, haar modifiers en haar basisklasse
        TypeDeclarationSyntax? type = types.FirstOrDefault(t => t is ClassDeclarationSyntax && MatchesName(test.Name, t.Identifier.Text));
        if (type == null) return new CsTestResult(false, omschrijving, "ontbreekt");
        string? ontbrekend = MissingModifier(test.Modifiers, type.Modifiers, "internal");
        if (ontbrekend != null) return new CsTestResult(false, omschrijving, $"is niet `{ontbrekend}`");
        if (!string.IsNullOrEmpty(test.Base) && !BaseNames(type).Contains(test.Base)) return new CsTestResult(false, omschrijving, $"erft niet van `{test.Base}`");

        return new CsTestResult(true, omschrijving, null);
    }

    /// <summary>
    /// Een enum bestaat, met de gevraagde modifiers en eventueel precies die waarden.
    /// </summary>
    static CsTestResult EnumExists(CsTest test, List<EnumDeclarationSyntax> enums)
    {
        // de omschrijving
        string waarden = test.Values.Count > 0 ? $" met waarden {string.Join(", ", test.Values)}" : "";
        string omschrijving = $"enum `{Leesbaar(test.Name)}`{waarden}";

        // de enum, haar modifiers en haar waarden
        EnumDeclarationSyntax? declaratie = enums.FirstOrDefault(e => MatchesName(test.Name, e.Identifier.Text));
        if (declaratie == null) return new CsTestResult(false, omschrijving, "ontbreekt");
        string? ontbrekend = MissingModifier(test.Modifiers, declaratie.Modifiers, "internal");
        if (ontbrekend != null) return new CsTestResult(false, omschrijving, $"is niet `{ontbrekend}`");
        List<string> gevonden = declaratie.Members.Select(m => m.Identifier.Text).ToList();
        if (test.Values.Count > 0 && !gevonden.SequenceEqual(test.Values)) return new CsTestResult(false, omschrijving, $"heeft de waarden {string.Join(", ", gevonden)}");

        return new CsTestResult(true, omschrijving, null);
    }

    /// <summary>
    /// Een klasse erft van een van de gevraagde basisklassen.
    /// </summary>
    static CsTestResult InheritsFrom(CsTest test, TypeDeclarationSyntax type, string omschrijving)
    {
        List<string> basen = BaseNames(type);
        if (test.Bases.Any(basen.Contains)) return new CsTestResult(true, omschrijving, null);

        return new CsTestResult(false, omschrijving, basen.Count > 0 ? $"erft van `{string.Join(", ", basen)}`" : "erft van geen klasse");
    }

    /// <summary>
    /// Een property bestaat, met een van de types, de modifiers, de accessors
    /// en eventueel als auto-property of niet.
    /// </summary>
    static CsTestResult PropertyExists(CsTest test, TypeDeclarationSyntax type, string omschrijving)
    {
        // de property
        PropertyDeclarationSyntax? property = FindProperty(test, type);
        if (property == null) return new CsTestResult(false, omschrijving, "ontbreekt");

        // type en modifiers
        string? fout = TypeError(test.Types, property.Type) ?? ModifierError(test.Modifiers, property.Modifiers);
        if (fout != null) return new CsTestResult(false, omschrijving, fout);

        // de accessors: precies de gevraagde
        List<string> accessors = Accessors(property);
        if (test.Accessors.Count > 0 && !SameSet(accessors.Select(Normalize), test.Accessors.Select(Normalize))) return new CsTestResult(false, omschrijving, $"heeft de accessors `{string.Join("; ", accessors)}`");

        // auto-property of niet
        if (test.IsAuto == true && !IsAuto(property)) return new CsTestResult(false, omschrijving, "is geen auto-property");
        if (test.IsAuto == false && IsAuto(property)) return new CsTestResult(false, omschrijving, "is een auto-property");

        return new CsTestResult(true, omschrijving, null);
    }

    /// <summary>
    /// Een property bestaat en voldoet aan een voorwaarde.
    /// </summary>
    static CsTestResult PropertyCheck(CsTest test, TypeDeclarationSyntax type, string omschrijving, Func<PropertyDeclarationSyntax, bool> voorwaarde, string reden)
    {
        PropertyDeclarationSyntax? property = FindProperty(test, type);
        if (property == null) return new CsTestResult(false, omschrijving, "property ontbreekt");

        return voorwaarde(property) ? new CsTestResult(true, omschrijving, null) : new CsTestResult(false, omschrijving, reden);
    }

    /// <summary>
    /// Een methode bestaat, met de modifiers, de parametertypes en het returntype.
    /// </summary>
    static CsTestResult MethodExists(CsTest test, TypeDeclarationSyntax type, string omschrijving)
    {
        // de methodes met die naam; zonder enige: ontbreekt
        List<MethodDeclarationSyntax> methodes = type.Members.OfType<MethodDeclarationSyntax>().Where(m => MatchesName(test.Name, m.Identifier.Text)).ToList();
        if (methodes.Count == 0) return new CsTestResult(false, omschrijving, "ontbreekt");

        // een overload die aan alles voldoet
        string? fout = null;
        foreach (MethodDeclarationSyntax methode in methodes)
        {
            fout = ModifierError(test.Modifiers, methode.Modifiers)
                ?? ParameterError(test, methode.ParameterList)
                ?? (string.IsNullOrEmpty(test.ReturnType) ? null : TypeError([test.ReturnType], methode.ReturnType, "returntype"));
            if (fout == null) return new CsTestResult(true, omschrijving, null);
        }
        return new CsTestResult(false, omschrijving, fout);
    }

    /// <summary>
    /// Een constructor bestaat, met de parametertypes of het aantal parameters.
    /// </summary>
    static CsTestResult ConstructorExists(CsTest test, TypeDeclarationSyntax type, string omschrijving)
    {
        // de constructors; een record met parameters telt als constructor
        List<ParameterListSyntax> lijsten = type.Members.OfType<ConstructorDeclarationSyntax>().Select(c => c.ParameterList).ToList();
        if (type.ParameterList != null) lijsten.Add(type.ParameterList);

        // een constructor die voldoet
        if (lijsten.Any(lijst => ParameterError(test, lijst) == null)) return new CsTestResult(true, omschrijving, null);
        return new CsTestResult(false, omschrijving, lijsten.Count == 0 ? "er is geen constructor" : "geen constructor met die parameters");
    }

    /// <summary>
    /// Een veld of, zonder gevraagde modifiers, een lokale variabele bestaat, met
    /// een van de types, de modifiers en eventueel de beginwaarde.
    /// </summary>
    static CsTestResult VariableExists(CsTest test, TypeDeclarationSyntax type, string omschrijving)
    {
        // eerst een veld van de klasse
        var veld = type.Members.OfType<FieldDeclarationSyntax>()
            .SelectMany(f => f.Declaration.Variables.Select(v => (Declaratie: f.Declaration, Variabele: v, Modifiers: f.Modifiers, IsLokaal: false)))
            .FirstOrDefault(p => MatchesName(test.Name, p.Variabele.Identifier.Text));

        // anders een lokale variabele in een methode of constructor, zoals in reposchecker; die heeft geen toegankelijkheid
        if (veld.Declaratie == null && test.Modifiers.Count == 0)
        {
            veld = type.DescendantNodes().OfType<LocalDeclarationStatementSyntax>()
                .SelectMany(l => l.Declaration.Variables.Select(v => (Declaratie: l.Declaration, Variabele: v, Modifiers: l.Modifiers, IsLokaal: true)))
                .FirstOrDefault(p => MatchesName(test.Name, p.Variabele.Identifier.Text));
        }
        if (veld.Declaratie == null) return new CsTestResult(false, omschrijving, "ontbreekt");

        // het type: bij var het type na new
        TypeSyntax typeSyntax = veld.Declaratie.Type.IsVar && veld.Variabele.Initializer?.Value is ObjectCreationExpressionSyntax nieuw ? nieuw.Type : veld.Declaratie.Type;

        // type en modifiers; een lokale variabele heeft enkel het type
        string? fout = TypeError(test.Types, typeSyntax) ?? (veld.IsLokaal ? null : ModifierError(test.Modifiers, veld.Modifiers));
        if (fout != null) return new CsTestResult(false, omschrijving, fout);

        // de beginwaarde
        string? waarde = veld.Variabele.Initializer?.Value.ToString();
        if (!string.IsNullOrEmpty(test.Value) && (waarde == null || !MatchesText(test.Value, waarde, true))) return new CsTestResult(false, omschrijving, "heeft niet de gevraagde beginwaarde");

        return new CsTestResult(true, omschrijving, null);
    }

    /// <summary>
    /// De code bevat een tekst minstens min keer, of precies count keer.
    /// </summary>
    static CsTestResult ContainsText(CsTest test, IEnumerable<SyntaxNode> nodes, string waar)
    {
        // de omschrijving en het aantal keer
        string omschrijving = test.Description ?? $"`{test.Contains}` in {waar}";
        int aantal = CountText(test.Contains ?? "", string.Concat(nodes.Select(CodeWithoutComments)));

        // exact of minimum
        if (test.Count.HasValue) return aantal == test.Count.Value ? new CsTestResult(true, omschrijving, null) : new CsTestResult(false, omschrijving, $"{aantal} keer gevonden in plaats van {test.Count.Value} keer");
        int minimum = test.Min ?? 1;
        return aantal >= minimum ? new CsTestResult(true, omschrijving, null) : new CsTestResult(false, omschrijving, aantal == 0 ? "niet gevonden" : $"{aantal} keer gevonden in plaats van minstens {minimum} keer");
    }

    /// <summary>
    /// De code bevat een tekst niet.
    /// </summary>
    static CsTestResult NotContainsText(CsTest test, IEnumerable<SyntaxNode> nodes, string waar)
    {
        string omschrijving = test.Description ?? $"geen `{test.Contains}` in {waar}";
        int aantal = CountText(test.Contains ?? "", string.Concat(nodes.Select(CodeWithoutComments)));

        return aantal == 0 ? new CsTestResult(true, omschrijving, null) : new CsTestResult(false, omschrijving, "toch gevonden");
    }

    // ── Omschrijvingen ────────────────────────────────────────────────────────

    /// <summary>
    /// De standaardomschrijving van een test op een klasse.
    /// </summary>
    static string Omschrijving(CsTest test)
    {
        // de klasse en de naam van de member
        string klasse = Leesbaar(test.Class);
        string lid = $"`{klasse}.{Leesbaar(test.Name)}`";
        string types = test.Types.Count > 0 ? $" ({string.Join(" of ", test.Types.Select(t => $"`{t}`"))})" : "";
        string modifiers = test.Modifiers.Count > 0 ? $"{string.Join(" ", test.Modifiers)} " : "";

        // per assert
        return test.Assert switch
        {
            "csInheritsFrom" => $"klasse `{klasse}` erft van {string.Join(" of ", test.Bases.Select(b => $"`{b}`"))}",
            "csPropertyExists" => $"{modifiers}property {lid}{types}",
            "csPropertyAuto" => $"property {lid} is een auto-property",
            "csPropertyNotAuto" => $"property {lid} heeft een eigen getter of setter",
            "csPropertyReadonly" => $"property {lid} is alleen-lezen",
            "csSetterThrowsException" => $"de setter van {lid} gooit een exception bij een ongeldige waarde",
            "csMethodExists" => $"{modifiers}methode `{klasse}.{Leesbaar(test.Name)}()`",
            "csConstructorExists" => test.NumParameters.HasValue
                ? $"constructor van `{klasse}` met {test.NumParameters} parameter{(test.NumParameters == 1 ? "" : "s")}"
                : $"constructor `{klasse}({string.Join(", ", test.ParamTypes ?? [])})`",
            "csVariableExists" => $"{modifiers}variabele `{Leesbaar(test.Name)}`{types} in `{klasse}`",
            _ => $"test `{test.Assert}` op `{klasse}`",
        };
    }

    /// <summary>
    /// Maakt een naam leesbaar: een regex wordt de tekst zonder de tekens
    /// rond het patroon.
    /// </summary>
    static string Leesbaar(string? naam)
    {
        if (string.IsNullOrEmpty(naam)) return "";
        Match regex = Regex.Match(naam, @"^/(.*)/([a-z]*)$");
        return regex.Success ? Regex.Replace(regex.Groups[1].Value, @"[\^\$\\?*+()\[\]|]", "") : naam;
    }

    // ── Vergelijken ───────────────────────────────────────────────────────────

    /// <summary>
    /// Zet een tekst in de vorm /patroon/vlaggen om in een regex, of geeft null.
    /// </summary>
    static Regex? AsRegex(string patroon)
    {
        // enkel /…/vlaggen; i maakt hem case-insensitive
        Match vorm = Regex.Match(patroon, @"^/(.*)/([a-z]*)$", RegexOptions.Singleline);
        if (!vorm.Success) return null;
        RegexOptions opties = vorm.Groups[2].Value.Contains('i') ? RegexOptions.IgnoreCase : RegexOptions.None;
        return new Regex(vorm.Groups[1].Value, opties, TimeSpan.FromSeconds(1));
    }

    /// <summary>
    /// Zegt of een naam overeenkomt met een gevraagde naam: exact, of als regex.
    /// </summary>
    static bool MatchesName(string? gevraagd, string naam)
    {
        if (string.IsNullOrEmpty(gevraagd)) return false;
        Regex? regex = AsRegex(gevraagd);
        return regex != null ? regex.IsMatch(naam) : gevraagd == naam;
    }

    /// <summary>
    /// Zegt of een tekst overeenkomt met een patroon: als regex, of anders
    /// case-insensitive, exact of als deel van de tekst.
    /// </summary>
    static bool MatchesText(string patroon, string tekst, bool exact)
    {
        Regex? regex = AsRegex(patroon);
        if (regex != null) return regex.IsMatch(tekst);
        return exact ? Normalize(patroon).Equals(Normalize(tekst), StringComparison.OrdinalIgnoreCase) : tekst.Contains(patroon, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Telt hoe vaak een patroon in een tekst voorkomt.
    /// </summary>
    static int CountText(string patroon, string tekst)
    {
        // een regex: het aantal matches
        Regex? regex = AsRegex(patroon);
        if (regex != null) return regex.Matches(tekst).Count;

        // een tekst: het aantal voorkomens, case-insensitive
        if (patroon.Length == 0) return 0;
        int aantal = 0;
        for (int index = tekst.IndexOf(patroon, StringComparison.OrdinalIgnoreCase); index >= 0; index = tekst.IndexOf(patroon, index + patroon.Length, StringComparison.OrdinalIgnoreCase)) aantal++;
        return aantal;
    }

    /// <summary>
    /// Haalt alle witruimte weg, om types en accessors te vergelijken.
    /// </summary>
    static string Normalize(string tekst) => Regex.Replace(tekst, @"\s+", "");

    /// <summary>
    /// Zegt of twee lijsten dezelfde elementen hebben, ongeacht de volgorde.
    /// </summary>
    static bool SameSet(IEnumerable<string> a, IEnumerable<string> b) => a.OrderBy(x => x).SequenceEqual(b.OrderBy(x => x));

    /// <summary>
    /// Geeft de fout als het type niet een van de gevraagde is, of null.
    /// </summary>
    static string? TypeError(List<string> gevraagd, TypeSyntax type, string wat = "type")
    {
        if (gevraagd.Count == 0 || gevraagd.Any(t => Normalize(t) == Normalize(type.ToString()))) return null;
        return $"heeft {wat} `{type}`";
    }

    /// <summary>
    /// Geeft de fout als een gevraagde modifier ontbreekt, of null.
    /// </summary>
    static string? ModifierError(List<string> gevraagd, SyntaxTokenList modifiers)
    {
        string? ontbrekend = MissingModifier(gevraagd, modifiers, "private");
        return ontbrekend == null ? null : $"is niet `{ontbrekend}`";
    }

    /// <summary>
    /// Geeft de eerste gevraagde modifier die ontbreekt, of null. Zonder
    /// toegankelijkheid geldt de standaard (private of internal).
    /// </summary>
    static string? MissingModifier(List<string> gevraagd, SyntaxTokenList modifiers, string standaard)
    {
        // de modifiers in de code, met de standaardtoegankelijkheid als er geen staat
        List<string> aanwezig = modifiers.Select(m => m.Text).ToList();
        if (!aanwezig.Any(Toegankelijkheden.Contains)) aanwezig.Add(standaard);

        return gevraagd.FirstOrDefault(m => !aanwezig.Contains(m));
    }

    /// <summary>
    /// Geeft de fout als de parameters niet de gevraagde zijn, of null.
    /// </summary>
    static string? ParameterError(CsTest test, ParameterListSyntax lijst)
    {
        // het aantal parameters
        if (test.NumParameters.HasValue) return lijst.Parameters.Count == test.NumParameters.Value ? null : $"heeft {lijst.Parameters.Count} parameters";

        // de types, in volgorde; zonder paramTypes telt elke parameterlijst
        if (test.ParamTypes == null) return null;
        List<string> types = lijst.Parameters.Select(p => Normalize(p.Type?.ToString() ?? "")).ToList();
        return types.SequenceEqual(test.ParamTypes.Select(Normalize)) ? null : $"heeft de parameters ({string.Join(", ", lijst.Parameters.Select(p => p.Type?.ToString()))})";
    }

    // ── Syntaxmodel ───────────────────────────────────────────────────────────

    /// <summary>
    /// De namen in de basislijst van een type, zonder generieke argumenten.
    /// </summary>
    static List<string> BaseNames(TypeDeclarationSyntax type) =>
        type.BaseList?.Types.Select(b => Regex.Replace(b.Type.ToString(), @"<.*$", "")).ToList() ?? [];

    /// <summary>
    /// De property met de naam van de test, of null.
    /// </summary>
    static PropertyDeclarationSyntax? FindProperty(CsTest test, TypeDeclarationSyntax type) =>
        type.Members.OfType<PropertyDeclarationSyntax>().FirstOrDefault(p => MatchesName(test.Name, p.Identifier.Text));

    /// <summary>
    /// De accessors van een property, bv. "get" en "private set"; een
    /// property met => heeft enkel een getter.
    /// </summary>
    static List<string> Accessors(PropertyDeclarationSyntax property)
    {
        if (property.AccessorList == null) return ["get"];
        return property.AccessorList.Accessors
            .Select(a => string.Join(" ", a.Modifiers.Select(m => m.Text).Append(a.Keyword.Text)))
            .ToList();
    }

    /// <summary>
    /// Zegt of een property een accessor van die soort heeft (get, set of init).
    /// </summary>
    static bool HasAccessor(PropertyDeclarationSyntax property, string soort) =>
        Accessors(property).Any(a => a.Split(' ').Last() == soort);

    /// <summary>
    /// Zegt of een property een auto-property is: accessors zonder body.
    /// </summary>
    static bool IsAuto(PropertyDeclarationSyntax property) =>
        property.AccessorList != null && property.AccessorList.Accessors.All(a => a.Body == null && a.ExpressionBody == null);

    /// <summary>
    /// Zegt of de setter van een property een exception gooit.
    /// </summary>
    static bool SetterThrows(PropertyDeclarationSyntax property)
    {
        AccessorDeclarationSyntax? setter = property.AccessorList?.Accessors.FirstOrDefault(a => a.Keyword.IsKind(SyntaxKind.SetKeyword) || a.Keyword.IsKind(SyntaxKind.InitKeyword));
        return setter != null && setter.DescendantNodes().Any(n => n is ThrowStatementSyntax or ThrowExpressionSyntax);
    }

    /// <summary>
    /// De code van een knoop zonder commentaar, met de gewone witruimte.
    /// </summary>
    static string CodeWithoutComments(SyntaxNode node)
    {
        // per token de witruimte en de tekst, zonder commentaar
        StringBuilder code = new StringBuilder();
        foreach (SyntaxToken token in node.DescendantTokens())
        {
            AppendTrivia(code, token.LeadingTrivia);
            code.Append(token.Text);
            AppendTrivia(code, token.TrailingTrivia);
        }
        return code.ToString();
    }

    /// <summary>
    /// Voegt de trivia toe, behalve commentaar.
    /// </summary>
    static void AppendTrivia(StringBuilder code, SyntaxTriviaList trivia)
    {
        foreach (SyntaxTrivia stuk in trivia)
        {
            if (stuk.IsKind(SyntaxKind.SingleLineCommentTrivia) || stuk.IsKind(SyntaxKind.MultiLineCommentTrivia)
                || stuk.IsKind(SyntaxKind.SingleLineDocumentationCommentTrivia) || stuk.IsKind(SyntaxKind.MultiLineDocumentationCommentTrivia)) continue;
            code.Append(stuk.ToFullString());
        }
    }
}

/// <summary>
/// Een C#-test zoals in properties.json; enkel de velden die de runner nodig heeft.
/// </summary>
record CsTest(
    string? Assert,
    string? Name,
    string? Class,
    string? Base,
    string? Description,
    string? ReturnType,
    string? Value,
    string? Contains,
    bool? IsAuto,
    int? NumParameters,
    int? Min,
    int? Count,
    List<string>? ParamTypes)
{
    public List<string> Modifiers { get; init; } = [];
    public List<string> Types { get; init; } = [];
    public List<string> Accessors { get; init; } = [];
    public List<string> Bases { get; init; } = [];
    public List<string> Values { get; init; } = [];
}

/// <summary>
/// Het resultaat van één C#-test: geslaagd, de omschrijving en bij falen de reden.
/// </summary>
record CsTestResult(bool Geslaagd, string Omschrijving, string? Reden);
