using System;
using System.Collections.Generic;
using System.Linq;

internal class Werknemer
{
   // Properties
   public int Id { get; set; }
   public string Naam { get; set; }
   public decimal Salaris
   {
      get;
      set
      {
         if (value < 0) throw new ArgumentException("Salaris kan niet negatief zijn.");
         field = value;
      }
   }

   public DateOnly InDienstSinds
   {
      get;
      set
      {
         if (value > DateOnly.FromDateTime(DateTime.Today)) throw new ArgumentException("Datum indiensttreding kan niet in de toekomst liggen.");
         field = value;
      }
   }

   // Berekende properties
   public int Ancienniteit
   {
      get
      {
         return DateTime.Now.Year - InDienstSinds.Year;
      }
   }

   public string Seniority
   {
      get
      {
         if (Ancienniteit < 2)
         {
            return "Junior";
         }
         if (Ancienniteit < 5)
         {
            return "Medior";
         }
         return "Senior";
      }
   }

   // Methodes
   public void GeefOpslag(decimal percentage)
   {
      Salaris += Salaris * percentage / 100;
   }
}
