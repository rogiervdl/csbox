using System;
using System.Collections.Generic;
using System.Linq;

internal static class TekstAnalyse
{
   private static string[] verbodenWoorden = { "delete", "drop", "truncate" };
   private static char[] verbodenKarakters = { '!', '@', '#', '$', '%' };
   public static int AantalWoorden(string tekst)
   {
      if (string.IsNullOrWhiteSpace(tekst))
      {
         return 0;
      }
      string[] woorden = tekst.Split(' ', StringSplitOptions.RemoveEmptyEntries);
      return woorden.Length;
   }

   public static bool BevatVerbodenWoord(string tekst)
   {
      if (string.IsNullOrWhiteSpace(tekst))
      {
         return false;
      }
      return verbodenWoorden.Any(w => tekst.ToLower().Contains(w));
   }

   public static bool BevatVerbodenKarakter(string tekst)
   {
      if (string.IsNullOrWhiteSpace(tekst))
      {
         return false;
      }
      return verbodenKarakters.Any(k => tekst.Contains(k));
   }

   public static bool IsGeschiktVoorTitel(string tekst)
   {
      if (string.IsNullOrWhiteSpace(tekst))
      {
         return false;
      }
      if (tekst.Length < 5 || tekst.Length > 30)
      {
         return false;
      }
      if (BevatVerbodenWoord(tekst) || BevatVerbodenKarakter(tekst))
      {
         return false;
      }
      return true;
   }
}
