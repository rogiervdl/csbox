using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;

/// <summary>
/// De eigen stijlregels, die StyleCop niet heeft: geen var, en geen
/// underscore in een naam (behalve vooraan bij een veld). Ze lopen op het
/// syntaxmodel, zonder compilatie.
/// </summary>
static class StijlRegels
{
    // de codes van de eigen regels
    public const string GeenVar = "CSB001";
    public const string GeenUnderscore = "CSB002";

    /// <summary>
    /// Geeft de overtredingen in één bestand: per overtreding de code, de
    /// plaats en de naam waarover het gaat.
    /// </summary>
    public static List<(string Code, Location Plaats, string Naam)> Controleer(SyntaxTree tree)
    {
        // alle knopen van het bestand
        List<(string, Location, string)> overtredingen = [];
        IEnumerable<SyntaxNode> knopen = tree.GetRoot().DescendantNodes();

        // var bij een lokale variabele, in foreach en bij out var of deconstructie
        foreach (SyntaxNode knoop in knopen)
        {
            TypeSyntax? type = knoop switch
            {
                LocalDeclarationStatementSyntax lokaal => lokaal.Declaration.Type,
                ForEachStatementSyntax lus => lus.Type,
                DeclarationExpressionSyntax declaratie => declaratie.Type,
                _ => null,
            };
            if (type != null && type.IsVar) overtredingen.Add((GeenVar, type.GetLocation(), "var"));
        }

        // underscores in de namen van types, members, variabelen en parameters
        foreach (SyntaxNode knoop in knopen)
        {
            // de naam, en of een _ vooraan mag (enkel bij een veld)
            (SyntaxToken? naam, bool isVeld) = knoop switch
            {
                BaseTypeDeclarationSyntax typeDeclaratie => (typeDeclaratie.Identifier, false),
                MethodDeclarationSyntax methode => (methode.Identifier, false),
                PropertyDeclarationSyntax property => (property.Identifier, false),
                EnumMemberDeclarationSyntax enumWaarde => (enumWaarde.Identifier, false),
                LocalFunctionStatementSyntax functie => (functie.Identifier, false),
                ParameterSyntax parameter => (parameter.Identifier, false),
                VariableDeclaratorSyntax variabele => (variabele.Identifier, variabele.Parent?.Parent is FieldDeclarationSyntax),
                SingleVariableDesignationSyntax designatie => (designatie.Identifier, false),
                _ => ((SyntaxToken?)null, false),
            };
            if (naam == null) continue;

            // een discard (_) mag; anders geen underscore, behalve vooraan bij een veld
            string tekst = naam.Value.Text;
            if (tekst.Trim('_').Length == 0) continue;
            string teControleren = isVeld ? tekst.TrimStart('_') : tekst;
            if (teControleren.Contains('_')) overtredingen.Add((GeenUnderscore, naam.Value.GetLocation(), tekst));
        }

        return overtredingen;
    }
}
