using System;

class WorkshopDeelnemer
{
   public string Naam { get; private set; }
   public bool IsAanwezig { get; private set; }

   // 1. Voeg static properties AantalAangemaakt en AantalAanwezig toe (private setter)

   public WorkshopDeelnemer(string naam, bool isAanwezig)
   {
      Naam = naam;
      IsAanwezig = isAanwezig;
      // 2. Pas de constructor aan zodat de statische properties bijgehouden worden
   }

   // 3. Methode ZetAfwezig()
}
