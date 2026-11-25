/*
 * C#-code ontleden voor de aanvulling
 *
 * Een benadering met reguliere expressies, geen echte parser: ze vindt de
 * usings, de eigen types met hun leden, en de variabelen met hun type. Dat
 * volstaat voor de code van een eerstejaars; wat ze niet herkent, krijgt
 * gewoon geen voorstellen.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// de modifiers vóór een declaratie
const MODIFIERS = ['public', 'private', 'protected', 'internal', 'static', 'readonly', 'const', 'virtual', 'override', 'abstract', 'sealed', 'new', 'async', 'partial'];

// woorden die op de plaats van een type kunnen staan maar er geen zijn
const GEEN_TYPE = new Set([...MODIFIERS, 'return', 'else', 'case', 'throw', 'using', 'goto', 'await', 'is', 'as', 'in', 'out', 'ref', 'namespace', 'class', 'struct', 'enum', 'interface', 'record', 'yield', 'params', 'this', 'base']);

// een type: naam, eventueel generiek, array en nullable
const TYPE = '[A-Za-z_][\\w.]*(?:<[^;(){}=]*?>)?(?:\\[\\])*\\??';

// een lid op het hoogste niveau van een type, met zijn modifiers, type, naam (eventueel generiek) en soort (de lookahead verbruikt niets)
const LID = new RegExp(`(?:^|[;}\\]])\\s*((?:(?:${MODIFIERS.join('|')})\\s+)*)(${TYPE})\\s+([A-Za-z_]\\w*)(?:<[^;(){}=]*>)?(?=\\s*(=>|\\(|=|;|\\{|,))`, 'g');

// een variabele of parameter met een expliciet type
const VARIABELE = new RegExp(`(?:^|[\\s(,;{])(${TYPE})\\s+([A-Za-z_]\\w*)(?=\\s*(?:[=;,)]|in\\b))`, 'g');

// een eigen type: class, struct, record, interface of enum
const EIGEN_TYPE = /\b(class|struct|record|interface|enum)\s+([A-Za-z_]\w*)/g;

// het type van een var, afgeleid uit wat erop volgt
const AFLEIDINGEN = [
   { patroon: /^\s*=\s*new\s+([A-Za-z_][\w.]*(?:<[^;(]*>)?)\s*\[/, type: m => `${m[1]}[]` },
   { patroon: /^\s*=\s*new\s+([A-Za-z_][\w.]*(?:<[^;(]*>)?)/, type: m => m[1] },
   { patroon: /^\s*=\s*[$@]*"/, type: () => 'string' },
   { patroon: /^\s*=\s*'/, type: () => 'char' },
   { patroon: /^\s*=\s*\d+\.\d/, type: () => 'double' },
   { patroon: /^\s*=\s*\d+m\b/, type: () => 'decimal' },
   { patroon: /^\s*=\s*\d/, type: () => 'int' },
   { patroon: /^\s*=\s*(?:true|false)\b/, type: () => 'bool' },
   { patroon: /^\s*=\s*Console\.ReadLine\b/, type: () => 'string' },
   { patroon: /^\s*=\s*Console\.ReadKey\b/, type: () => 'ConsoleKeyInfo' },
   { patroon: /^\s*=\s*(int|long|double|decimal|bool|char|DateTime)\.Parse\b/, type: m => m[1] },
   { patroon: /^\s*=\s*Convert\.ToInt32\b/, type: () => 'int' },
   { patroon: /^\s*=\s*Convert\.ToDouble\b/, type: () => 'double' },
   { patroon: /^\s*=\s*File\.ReadAllLines\b/, type: () => 'string[]' },
   { patroon: /^\s*=\s*File\.ReadAllText\b/, type: () => 'string' },
   { patroon: /^\s*=\s*DateTime\.(?:Now|Today)\b/, type: () => 'DateTime' },
];

// FUNCTIES
// ========

/**
 * Vervangt commentaar en de inhoud van strings en tekens door spaties. De
 * aanhalingstekens blijven, en de lengte blijft gelijk, zodat posities kloppen.
 *
 * @param {string} code
 * @returns {string}
 */
function ontdoe(code) {
   let uit = '';
   let i = 0;
   while (i < code.length) {
      // regelcommentaar tot het einde van de regel
      if (code.startsWith('//', i)) {
         const einde = code.indexOf('\n', i);
         const tot = einde === -1 ? code.length : einde;
         uit += ' '.repeat(tot - i);
         i = tot;
         continue;
      }

      // blokcommentaar, met behoud van de regeleinden
      if (code.startsWith('/*', i)) {
         const einde = code.indexOf('*/', i + 2);
         const tot = einde === -1 ? code.length : einde + 2;
         uit += code.slice(i, tot).replace(/[^\n]/g, ' ');
         i = tot;
         continue;
      }

      // een string of teken: de aanhalingstekens blijven, de inhoud wordt spaties (verbatim zonder escapes)
      const teken = code[i];
      if (teken === '"' || teken === '\'') {
         const isVerbatim = teken === '"' && /[@]\$?$|\$@$/.test(code.slice(Math.max(0, i - 2), i));
         uit += teken;
         i++;
         while (i < code.length && code[i] !== teken && code[i] !== '\n') {
            const stap = !isVerbatim && code[i] === '\\' ? 2 : 1;
            uit += ' '.repeat(Math.min(stap, code.length - i));
            i += stap;
         }
         if (i < code.length && code[i] === teken) {
            uit += teken;
            i++;
         }
         continue;
      }

      // gewone code
      uit += teken;
      i++;
   }
   return uit;
}

/**
 * Geeft de positie van de accolade die de gegeven accolade sluit.
 *
 * @param {string} code - ontdane code
 * @param {number} open - de positie van {
 * @returns {number} de positie van }, of het einde van de code
 */
function sluitendeAccolade(code, open) {
   let diepte = 0;
   for (let i = open; i < code.length; i++) {
      if (code[i] === '{') diepte++;
      if (code[i] === '}' && --diepte === 0) return i;
   }
   return code.length;
}

/**
 * Houdt van een blok enkel het hoogste niveau over: geneste blokken worden {}.
 *
 * @param {string} romp - de code tussen de accolades van een type
 * @returns {string}
 */
function hoogsteNiveau(romp) {
   let uit = '';
   let diepte = 0;
   for (const teken of romp) {
      if (teken === '{' && diepte++ === 0) uit += '{';
      else if (teken === '}' && --diepte === 0) uit += '}';
      else if (diepte === 0) uit += teken;
   }
   return uit;
}

/**
 * Splitst tekst op komma's die niet tussen haakjes, accolades of < > staan.
 *
 * @param {string} tekst
 * @returns {Array<string>}
 */
function splitsOpKomma(tekst) {
   const delen = [];
   let diepte = 0;
   let huidig = '';
   for (const teken of tekst) {
      if ('([{<'.includes(teken)) diepte++;
      if (')]}>'.includes(teken)) diepte--;
      if (teken === ',' && diepte === 0) {
         delen.push(huidig);
         huidig = '';
      } else {
         huidig += teken;
      }
   }
   delen.push(huidig);
   return delen;
}

/**
 * Bepaalt de toegang van een lid uit zijn modifiers; zonder modifier is een
 * lid private, behalve in een interface.
 *
 * @param {Array<string>} modifiers
 * @param {boolean} isInterface
 * @returns {string} 'public', 'protected' of 'private'
 */
function toegangVan(modifiers, isInterface) {
   if (isInterface || modifiers.includes('public') || modifiers.includes('internal')) return 'public';
   return modifiers.includes('protected') ? 'protected' : 'private';
}

/**
 * Zoekt de leden van een type op zijn hoogste niveau. Bij int a, b; worden
 * het twee velden.
 *
 * @param {string} romp - de code tussen de accolades
 * @param {boolean} isInterface - in een interface is alles publiek
 * @returns {Array<{naam: string, type: string, isMethode: boolean, isStatisch: boolean, toegang: string}>}
 */
function zoekLeden(romp, isInterface) {
   const leden = [];
   const tekst = hoogsteNiveau(romp);
   for (const m of tekst.matchAll(LID)) {
      // een constructor heeft een modifier op de plaats van het type
      if (GEEN_TYPE.has(m[2])) continue;

      // het lid
      const modifiers = m[1].split(/\s+/);
      const lid = {
         naam: m[3],
         type: m[2],
         isMethode: m[4] === '(',
         isStatisch: modifiers.includes('static') || modifiers.includes('const'),
         toegang: toegangVan(modifiers, isInterface),
      };
      leden.push(lid);

      // de andere velden in dezelfde declaratie, na een komma
      if (lid.isMethode || m[4] === '{' || m[4] === '=>') continue;
      const begin = m.index + m[0].length;
      const einde = tekst.indexOf(';', begin);
      const rest = splitsOpKomma(tekst.slice(begin, einde === -1 ? tekst.length : einde)).slice(1);
      rest.map(deel => deel.match(/^\s*([A-Za-z_]\w*)/)?.[1]).filter(Boolean).forEach(naam => leden.push({ ...lid, naam }));
   }
   return leden;
}

/**
 * Leest de kop van een type tussen zijn naam en zijn {: de basistypes na de
 * dubbelpunt en de parameters van een record, die publieke properties zijn.
 *
 * @param {string} kop - bv. "(int X, int Y) : Vorm"
 * @returns {{basen: Array<string>, parameters: Array<object>}}
 */
function leesKop(kop) {
   // de basistypes, zonder generieke argumenten en voorwaarden (where)
   const dubbelpunt = kop.match(/^[^:]*:\s*([^{]*)$/s);
   const basen = dubbelpunt
      ? splitsOpKomma(dubbelpunt[1].split(/\bwhere\b/)[0]).map(deel => deel.replace(/[<(].*$/s, '').trim()).filter(Boolean)
      : [];

   // de parameters van een record
   const haakjes = kop.match(/^\s*(?:<[^>]*>)?\s*\(([^)]*)\)/);
   const parameters = (haakjes ? splitsOpKomma(haakjes[1]) : [])
      .map(deel => deel.trim().match(new RegExp(`^(${TYPE})\\s+([A-Za-z_]\\w*)`)))
      .filter(Boolean)
      .map(m => ({ naam: m[2], type: m[1], isMethode: false, isStatisch: false, toegang: 'public' }));
   return { basen, parameters };
}

/**
 * Zoekt de eigen types in de code, met hun basistypes en leden of, bij een
 * enum, hun waarden.
 *
 * @param {string} code - ontdane code
 * @returns {Array<{naam: string, isEnum: boolean, basen: Array<string>, leden: Array<object>, waarden: Array<string>, begin: number, einde: number}>}
 */
function zoekTypes(code) {
   const types = [];
   for (const m of code.matchAll(EIGEN_TYPE)) {
      // de kop tot de { en de romp tussen de accolades
      const open = code.indexOf('{', m.index);
      if (open === -1) continue;
      const einde = sluitendeAccolade(code, open);
      const romp = code.slice(open + 1, einde);
      const kop = leesKop(code.slice(m.index + m[0].length, open));

      // een enum heeft waarden, de rest leden (bij een record ook zijn parameters)
      const isEnum = m[1] === 'enum';
      const waarden = isEnum ? romp.split(',').map(deel => deel.split('=')[0].trim()).filter(naam => /^[A-Za-z_]\w*$/.test(naam)) : [];
      const leden = isEnum ? [] : [...kop.parameters, ...zoekLeden(romp, m[1] === 'interface')];
      types.push({ naam: m[2], isEnum, basen: isEnum ? [] : kop.basen, leden, waarden, begin: open, einde });
   }
   return types;
}

/**
 * Zoekt de variabelen en parameters met hun type. Bij var wordt het type
 * afgeleid uit wat erop volgt; bij foreach (var x in y) onthoudt ze y.
 *
 * @param {string} origineel - de code zoals ze in de editor staat
 * @param {string} code - dezelfde code, ontdaan
 * @returns {Array<{naam: string, type: string|null, elementVan: string|null, positie: number}>}
 */
function zoekVariabelen(origineel, code) {
   const variabelen = [];
   for (const m of code.matchAll(VARIABELE)) {
      if (GEEN_TYPE.has(m[1])) continue;
      const positie = m.index + m[0].length;

      // een expliciet type
      if (m[1] !== 'var') {
         variabelen.push({ naam: m[2], type: m[1], elementVan: null, positie });
         continue;
      }

      // foreach (var x in y): het element van y
      const vervolg = origineel.slice(positie, positie + 200);
      const inLijst = vervolg.match(/^\s*in\s+([A-Za-z_][\w.]*)/);
      if (inLijst) {
         variabelen.push({ naam: m[2], type: null, elementVan: inLijst[1], positie });
         continue;
      }

      // var x = ...: het type uit de eerste afleiding die past
      const afleiding = AFLEIDINGEN.find(item => item.patroon.test(vervolg));
      variabelen.push({ naam: m[2], type: afleiding ? afleiding.type(vervolg.match(afleiding.patroon)) : null, elementVan: null, positie });
   }
   return variabelen;
}

/**
 * Geeft de geïmporteerde namespaces.
 *
 * @param {string} code - ontdane code
 * @returns {Set<string>}
 */
function zoekUsings(code) {
   return new Set([...code.matchAll(/^\s*using\s+([\w.]+)\s*;/gm)].map(m => m[1]));
}

/**
 * Ontleedt een type in zijn basis, zijn generieke argumenten en of het een
 * array is.
 *
 * @param {string} type - bv. List<Knikker>, int[], string?
 * @returns {{basis: string, args: Array<string>, isArray: boolean}}
 */
function ontleedType(type) {
   // nullable en array
   const zonderVraag = type.replace(/\?$/, '').trim();
   if (zonderVraag.endsWith('[]')) return { basis: zonderVraag.slice(0, -2), args: [], isArray: true };

   // de generieke argumenten, op het hoogste niveau gesplitst
   const haak = zonderVraag.indexOf('<');
   if (haak === -1) return { basis: zonderVraag, args: [], isArray: false };
   const binnen = zonderVraag.slice(haak + 1, zonderVraag.lastIndexOf('>'));
   const args = [];
   let diepte = 0;
   let huidig = '';
   for (const teken of binnen) {
      if (teken === '<') diepte++;
      if (teken === '>') diepte--;
      if (teken === ',' && diepte === 0) {
         args.push(huidig.trim());
         huidig = '';
      } else {
         huidig += teken;
      }
   }
   args.push(huidig.trim());
   return { basis: zonderVraag.slice(0, haak), args, isArray: false };
}

// EXPORTS
// =======

export const CSharpCode = { ontdoe, zoekTypes, zoekVariabelen, zoekUsings, ontleedType };
