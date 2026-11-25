/*
 * CSBox — controle van de tests in properties.json
 *
 * Bij het opstarten controleert de catalogus de tests van elke oefening tegen
 * docs/tests-schema.md: een onbekende assert, een onbekend veld, een ongeldige
 * points, een ontbrekend verplicht veld of een ongeldige regex wordt gemeld.
 * De oefening laadt wel; een ongeldige test valt weg.
 */

// de velden die bij elke test mogen
const ALGEMEEN = ['assert', 'caption', 'description', 'points', 'tips'];

// per assert de extra velden, en welke daarvan verplicht zijn
const ASSERTS = {
   consoleContains: { velden: ['contains', 'input'], verplicht: ['contains'] },
   consoleNotContains: { velden: ['contains', 'input'], verplicht: ['contains'] },
   csClassExists: { velden: ['name', 'modifiers', 'base'], verplicht: ['name'] },
   csEnumExists: { velden: ['name', 'modifiers', 'values'], verplicht: ['name'] },
   csInheritsFrom: { velden: ['class', 'bases'], verplicht: ['class', 'bases'] },
   csPropertyExists: { velden: ['class', 'name', 'types', 'modifiers', 'accessors', 'isAuto'], verplicht: ['class', 'name'] },
   csPropertyAuto: { velden: ['class', 'name'], verplicht: ['class', 'name'] },
   csPropertyNotAuto: { velden: ['class', 'name'], verplicht: ['class', 'name'] },
   csPropertyReadonly: { velden: ['class', 'name'], verplicht: ['class', 'name'] },
   csSetterThrowsException: { velden: ['class', 'name'], verplicht: ['class', 'name'] },
   csMethodExists: { velden: ['class', 'name', 'modifiers', 'paramTypes', 'returnType'], verplicht: ['class', 'name'] },
   csConstructorExists: { velden: ['class', 'paramTypes', 'numParameters'], verplicht: ['class'] },
   csVariableExists: { velden: ['class', 'name', 'types', 'modifiers', 'value'], verplicht: ['class', 'name'] },
   csContainsText: { velden: ['class', 'contains', 'min', 'count'], verplicht: ['contains'] },
   csNotContainsText: { velden: ['class', 'contains'], verplicht: ['contains'] },
};

// een tekst in de vorm /patroon/vlaggen
const REGEX_PATROON = /^\/(.*)\/([a-z]*)$/s;

/**
 * Geeft de regex van een tekst in de vorm /patroon/vlaggen, of null als de
 * tekst geen regex is. Een ongeldige regex geeft een fout.
 *
 * @param {string} tekst - De tekst uit de test
 * @returns {RegExp|null} De regex, of null voor een gewone tekst
 */
function alsRegex(tekst) {
   const vorm = REGEX_PATROON.exec(tekst);
   return vorm ? new RegExp(vorm[1], vorm[2]) : null;
}

/**
 * Controleert één test en geeft de meldingen.
 *
 * @param {object} test - De test uit properties.json
 * @returns {Array<string>} De meldingen; leeg als de test in orde is
 */
function controleerTest(test) {
   // een object met een gekende assert
   if (!test || typeof test !== 'object' || Array.isArray(test)) return ['een test is geen object'];
   const schema = ASSERTS[test.assert];
   if (!schema) return [`onbekende assert "${test.assert}"`];

   // onbekende velden en ontbrekende verplichte velden
   const meldingen = [];
   const toegelaten = [...ALGEMEEN, ...schema.velden];
   Object.keys(test).filter(veld => !toegelaten.includes(veld)).forEach(veld => meldingen.push(`${test.assert}: onbekend veld "${veld}"`));
   schema.verplicht.filter(veld => test[veld] === undefined).forEach(veld => meldingen.push(`${test.assert}: verplicht veld "${veld}" ontbreekt`));

   // points is een getal ≥ 0
   if (test.points !== undefined && (typeof test.points !== 'number' || !Number.isFinite(test.points) || test.points < 0)) meldingen.push(`${test.assert}: points moet een getal ≥ 0 zijn`);

   // input is een lijst van regels
   if (test.input !== undefined && (!Array.isArray(test.input) || test.input.some(regel => typeof regel !== 'string'))) meldingen.push(`${test.assert}: input moet een lijst van teksten zijn`);

   // een regex moet geldig zijn en heeft een eigen description
   for (const veld of ['name', 'class', 'contains']) {
      if (typeof test[veld] !== 'string') continue;
      try {
         if (alsRegex(test[veld]) && !test.description) meldingen.push(`${test.assert}: een regex in "${veld}" vraagt een description`);
      } catch (fout) {
         meldingen.push(`${test.assert}: ongeldige regex in "${veld}": ${fout.message}`);
      }
   }

   return meldingen;
}

/**
 * Controleert de tests van een oefening. Geeft de geldige tests terug en de
 * meldingen over de ongeldige.
 *
 * @param {*} tests - Het tests-veld uit properties.json
 * @returns {{tests: Array<object>, meldingen: Array<string>}} De geldige tests en de meldingen
 */
function controleer(tests) {
   // zonder tests: niets te controleren
   if (tests === undefined) return { tests: [], meldingen: [] };
   if (!Array.isArray(tests)) return { tests: [], meldingen: ['tests is geen lijst'] };

   // per test; een ongeldige test valt weg
   const geldig = [];
   const meldingen = [];
   tests.forEach(function (test, index) {
      const fouten = controleerTest(test);
      if (fouten.length === 0) geldig.push(test);
      else fouten.forEach(fout => meldingen.push(`test ${index + 1}: ${fout}`));
   });

   return { tests: geldig, meldingen };
}

module.exports = { controleer, alsRegex };
