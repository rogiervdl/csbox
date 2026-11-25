using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

internal class CouponCode
{
   private static string couponRegex = @"^[A-Z]{3}\d{2}-[A-Z]{2}$";

   public string Code { get; set; }
   public bool IsGeldig
   {
      get
      {
         return ControleerCode(Code);
      }
   }

   public CouponCode(string code)
   {
      Code = code;
   }

   public static bool ControleerCode(string code)
   {
      return Regex.IsMatch(code, couponRegex);
   }

   public static string Beschrijf(string code)
   {
      if (!ControleerCode(code))
      {
         return "ongeldige code";
      }
      string prefix = code.Substring(0, 3);
      string nummer = code.Substring(3, 2);
      string regio = code.Substring(6, 2);
      return $"Prefix={prefix}, Nummer={nummer}, Regio={regio}";
   }
}
