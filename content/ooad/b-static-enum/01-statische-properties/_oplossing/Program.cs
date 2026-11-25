using System;
using System.Collections.Generic;
using System.Linq;

public class Program
{
   public static void Main()
   {
      Console.WriteLine("Oefening 1: deelnemers registreren");
      Console.WriteLine("-------------");

      // Gegeven in de map "classes" is een klasse "WorkshopDeelnemer" met volgende properties:
      //  - Naam (private setter)
      //  - IsAanwezig (private setter)
      //  - een constructor met parameters voor naam en aanwezigheidsstatus
      //    
      // 1. Voeg volgende static properties toe aan die klasse:
      //  - een static property AantalAangemaakt (private setter)
      //  - een static property AantalAanwezig (private setter)
      //
      // 2. Pas de constructor aan zodat de statische properties aangepast worden.
      //
      // 3. Voeg daarna een (object)methode ZetAfwezig() toe.
      //   - die methode moet de aanwezigheidsstatus aanpassen én het globale aantal aanwezigen correct houden

      // Testcode:

      // maak drie deelnemers aan, waarvan twee aanwezig zijn
      WorkshopDeelnemer d1 = new("Amira", true);
      WorkshopDeelnemer d2 = new("Bram", false);
      WorkshopDeelnemer d3 = new("Noor", true);

      // controle of statische properties correct bijgehouden worden
      Console.WriteLine($"Aantal aangemaakt: {WorkshopDeelnemer.AantalAangemaakt}");
      Console.WriteLine($"Aantal aanwezig: {WorkshopDeelnemer.AantalAanwezig}");

      // let op: het aantal aanwezigen mag maar één keer aangepast worden!
      d3.ZetAfwezig();
      d3.ZetAfwezig();
      Console.WriteLine($"Aantal aanwezig na wijziging: {WorkshopDeelnemer.AantalAanwezig}");
   }
}
