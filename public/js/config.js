/*
 * App configuration
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

export const Config = {
   defaultCode: `using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hallo, wereld!");

        for (int i = 1; i <= 5; i++)
        {
            Console.WriteLine($"Regel {i}");
        }
    }
}`,

   editor: {
      automaticLayout: true,
      fontSize: 14,
      language: 'csharp',
      lineHeight: 22,
      minimap: { enabled: false },
      renderLineHighlight: 'line',
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      tabSize: 4,
      theme: 'vs-dark',
      wordWrap: 'off',
   },
};
