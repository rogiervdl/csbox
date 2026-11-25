using System;
using System.Collections.Generic;

class Product
{
   // Properties (gegeven)
   public int ProductId { get; set; }
   public string Naam { get; set; }
   public string Beschrijving { get; set; }
   public decimal Prijs { get; set; }
   public int Voorraad { get; set; }
   public bool IsInVoorraad { get { return Voorraad > 0; } }
   public double Korting
   {
      get;
      set
      {
         if (value < 0 || value > 100)
         {
            throw new ArgumentException("Percentage moet tussen 0 en 100 liggen.");
         }
         field = value;
      }
   } = 0;
   public decimal PrijsMetKorting
   {
      get { return Prijs * (1 - ((decimal)Korting) / 100); }
   }

   // 1. Voeg een override ToString() toe:
   //    "[ProductId] Naam - € PrijsMetKorting | in voorraad"  (of "niet in voorraad")
   // public override string ToString()
   // {
   //     ...
   // }
}
