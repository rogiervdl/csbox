Console.WriteLine("Oefening 1: deelnemers registreren");
Console.WriteLine("-------------");

// WorkshopDeelnemer is al gegeven onderaan met properties Naam en IsAanwezig en een constructor.
//
// 1. Voeg twee static properties toe:
//    - AantalAangemaakt (private setter)
//    - AantalAanwezig (private setter)
//
// 2. Pas de constructor aan zodat beide statische properties correct bijgehouden worden bij elke aanmaak.
//
// 3. Voeg een instantiemethode ZetAfwezig() toe:
//    - past de aanwezigheidsstatus aan én houdt AantalAanwezig correct bij
//    - let op: als een deelnemer al afwezig is, mag de teller niet nogmaals verlaagd worden

// Testcode (haal uit commentaar):
//WorkshopDeelnemer d1 = new WorkshopDeelnemer("Amira", true);
//WorkshopDeelnemer d2 = new WorkshopDeelnemer("Bram", false);
//WorkshopDeelnemer d3 = new WorkshopDeelnemer("Noor", true);
//Console.WriteLine($"Aantal aangemaakt: {WorkshopDeelnemer.AantalAangemaakt}");
//Console.WriteLine($"Aantal aanwezig: {WorkshopDeelnemer.AantalAanwezig}");
//d3.ZetAfwezig();
//d3.ZetAfwezig();
//Console.WriteLine($"Aantal aanwezig na wijziging: {WorkshopDeelnemer.AantalAanwezig}");

// ============================================================
// Klassen
// ============================================================

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
