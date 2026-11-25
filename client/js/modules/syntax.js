/*
 * Syntaxcontrole
 *
 * Laat de server de syntax van de bestanden controleren, zonder te
 * compileren (bij Ctrl+S). Een antwoord op een oudere controle wordt
 * genegeerd, zodat snel na elkaar opslaan geen verouderde fouten toont.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// het nummer van de laatste controle
let laatste = 0;

// FUNCTIES
// ========

/**
 * Vraagt de syntaxfouten van de bestanden aan de server.
 *
 * @param {object} bestanden - pad → inhoud
 * @returns {Promise<Array<object>|null>} de fouten ({ file, line, col, severity, message }),
 *    of null als de controle mislukte of intussen een nieuwere gestart is
 */
async function controleer(bestanden) {
   const nummer = ++laatste;

   // de controle op de server
   try {
      const resp = await fetch('/api/compile/syntax', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ bestanden }),
      });
      if (!resp.ok) return null;
      const resultaat = await resp.json();

      // enkel het antwoord op de laatste controle telt
      return nummer === laatste ? resultaat.errors ?? [] : null;
   } catch {
      return null;
   }
}

// EXPORTS
// =======

export const Syntax = { controleer };
