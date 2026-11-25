/*
 * App configuration
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

export const Config = {
   // de bestanden zonder gekozen oefening; deze Program.cs komt ook in de plaats van een lege of ontbrekende
   defaultBestanden: {
      'Program.cs': `using System;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("Hello World");
   }
}
`,
   },

   // de inspringing overal (editor, formatter): spaties, ook bij Tab
   inspringing: 3,

   // de opties van elke editor; thema en taal zetten ThemeSwitcher en het model
   editor: {
      automaticLayout: true,
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      renderLineHighlight: 'line',
      scrollBeyondLastLine: false,
      // drie lege regels onder de laatste regel, zodat duidelijk is dat het bestand daar eindigt
      padding: { bottom: 3 * 22 },
      smoothScrolling: true,
      // geen woorden uit het bestand voorstellen: de aanvulling (Aanvulling) doet dat beter
      wordBasedSuggestions: 'off',
      wordWrap: 'off',
      // suggesties en hovers vallen niet weg achter de rand van een klein paneel
      fixedOverflowWidgets: true,
   },

   // tip onderaan de opgave
   readmeTip: `
      <div class="readme-tip">
         💡 <strong>Tip:</strong> je kan deze opgave altijd opnieuw openen via de <strong>🕮 Opgave</strong> knop bovenaan,
         of openen in een nieuw tabblad via de <img src="img/icon-external.svg" alt="extern"> knop rechtsboven.
      </div>
   `,
};
