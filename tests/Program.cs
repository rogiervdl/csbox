using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ConsoleJackpot
{
    class Program
    {
        static void Main(string[] args)
        {
            double saldo = 500;
            List<double> historiek = new List<double>();
            char opnieuw;

            do
            {
                Console.WriteLine("CONSOLE JACKPOT");
                Console.WriteLine("===============");
                Console.WriteLine($"Huidige saldo: {saldo}");
                Console.Write("Hoeveel wil je inzetten: ");
                double inzet = Convert.ToDouble(Console.ReadLine());

                if (inzet <= saldo)
                {
                    int[] getallen = GenereerGetallen();
                    Console.WriteLine($"Getallen: {string.Join(" - ", getallen)}");
                    double winst = BepaalWinst(getallen, inzet);

                    double resultaat = winst - inzet;
                    Console.WriteLine($"Resultaat: {resultaat}");

                    saldo += resultaat;
                    historiek.Add(resultaat);
                }
                else
                {
                    Console.WriteLine("Je saldo ligt te laag!");
                }

                Console.Write("Wil je nog eens spelen (j/n): ");
                opnieuw = Convert.ToChar(Console.ReadLine());

                Console.Clear();

            } while (opnieuw != 'n');

            ToonHistoriek(historiek);
            Console.ReadLine();
        }

        static int[] GenereerGetallen()
        {
            int[] getallen = new int[3];
            Random rnd = new Random();

            for (int i = 0; i < getallen.Length; i++)
            {
                getallen[i] = rnd.Next(1, 6);
            }

            return getallen;
        }

        static double BepaalWinst(int[] getallen, double inzet)
        {
            if (getallen[0] == getallen[1] && getallen[1] == getallen[2])
            {
                return inzet * 5;
            }
            else if (getallen[0] == getallen[1] || getallen[1] == getallen[2] || getallen[0] == getallen[2])
            {
                return inzet * 2;
            }

            return 0;
        }

        static void ToonHistoriek(List<double> historiek)
        {
            double som = 0;

            Console.WriteLine("HISTORIEK");
            Console.WriteLine("=========");

            for(int i = 0; i < historiek.Count; i++)
            {
                double bedrag = historiek[i];

                if(bedrag < 0)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine($"Ronde {i + 1}: {bedrag} euro verlies");
                }
                else
                {
                    Console.ForegroundColor = ConsoleColor.Green;
                    Console.WriteLine($"Ronde {i + 1}: {bedrag} euro winst");
                }

                som += bedrag;
            }

            Console.ResetColor();

            Console.WriteLine();
            Console.WriteLine($"TOTAAL: {som} euro");
        }
    }
}
