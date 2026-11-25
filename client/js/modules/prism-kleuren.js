/*
 * Prism-kleuren module — syntaxkleuring van C# met Prism
 *
 * De editor en de codeblokken in de opgave kleuren C# met Prism, zoals de
 * opgavepagina's van de oefenbladen. De editor krijgt de tokens van Prism
 * regel per regel via een tokens provider; commentaar over meerdere regels
 * (/* ... *\/) houdt de provider zelf bij. De kleuren per kleurschema staan
 * in één tabel, voor de Monaco-thema's en voor de CSS van de opgave.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

// de kleuren van de tokens per Monaco-thema: Licht en Donker naar Visual
// Studio, de andere naar de thema's van Prism (default, Okaidia en Coy)
const KLEUREN = {
   licht: {
      'comment': '008000', 'keyword': '0000ff', 'boolean': '0000ff', 'class-name': '2b91af', 'function': '74531f',
      'string': 'a31515', 'char': 'a31515', 'number': '098658', 'operator': '000000', 'punctuation': '000000',
      'namespace': '000000', 'constant': '0000ff', 'regex': '811f3f',
   },
   donker: {
      'comment': '6a9955', 'keyword': '569cd6', 'boolean': '569cd6', 'class-name': '4ec9b0', 'function': 'dcdcaa',
      'string': 'ce9178', 'char': 'ce9178', 'number': 'b5cea8', 'operator': 'd4d4d4', 'punctuation': 'd4d4d4',
      'namespace': 'd4d4d4', 'constant': '569cd6', 'regex': 'd16969',
   },
   zand: {
      'comment': '708090', 'keyword': '0077aa', 'boolean': '990055', 'class-name': 'dd4a68', 'function': 'dd4a68',
      'string': '669900', 'char': '669900', 'number': '990055', 'operator': '9a6e3a', 'punctuation': '999999',
      'namespace': '4d4d4d', 'constant': '990055', 'regex': 'ee9900',
   },
   okaida: {
      'comment': '8292a2', 'keyword': '66d9ef', 'boolean': 'ae81ff', 'class-name': 'e6db74', 'function': 'e6db74',
      'string': 'a6e22e', 'char': 'a6e22e', 'number': 'ae81ff', 'operator': 'f8f8f2', 'punctuation': 'f8f8f2',
      'namespace': 'bdbdb5', 'constant': 'f92672', 'regex': 'fd971f',
   },
   coy: {
      'comment': '7d8b99', 'keyword': '1990b8', 'boolean': 'c92c2c', 'class-name': '1990b8', 'function': '2f9c0a',
      'string': '2f9c0a', 'char': '2f9c0a', 'number': 'c92c2c', 'operator': 'a67f59', 'punctuation': '5f6364',
      'namespace': '5f6364', 'constant': 'c92c2c', 'regex': 'ee9900',
   },
};

// de tokens met een kleur; de rest krijgt de gewone tekstkleur
const GEKLEURD = Object.keys(KLEUREN.zand);

// het begin en einde van commentaar over meerdere regels
const COMMENTAAR_BEGIN = '/*';
const COMMENTAAR_EINDE = '*/';

// FUNCTIES
// ========

/**
 * De toestand van de tokenizer aan het einde van een regel: of die midden in
 * commentaar over meerdere regels eindigt.
 */
class Toestand {
   /**
    * @param {boolean} inCommentaar - of de regel in commentaar eindigt
    */
   constructor(inCommentaar) {
      this.inCommentaar = inCommentaar;
   }

   clone() {
      return new Toestand(this.inCommentaar);
   }

   equals(andere) {
      return andere instanceof Toestand && andere.inCommentaar === this.inCommentaar;
   }
}

/**
 * Geeft de naam van een Prism-token met kleur: het type of een alias, of null.
 *
 * @param {object} token - een Prism.Token
 * @returns {string|null} bv. class-name
 */
function kleurnaam(token) {
   const aliassen = Array.isArray(token.alias) ? token.alias : [token.alias];
   return [token.type, ...aliassen].find(naam => GEKLEURD.includes(naam)) ?? null;
}

/**
 * Maakt de geneste tokens van Prism plat tot stukken tekst met hun token.
 * Een stuk krijgt de binnenste kleur, bv. string binnen een return-type.
 *
 * @param {Array} tokens - de uitvoer van Prism.tokenize
 * @param {string} buiten - de kleur van het omringende token
 * @param {Array<{tekst: string, naam: string}>} stukken - de lijst die gevuld wordt
 * @returns {Array<{tekst: string, naam: string}>} de stukken
 */
function maakPlat(tokens, buiten, stukken) {
   tokens.forEach(token => {
      // gewone tekst krijgt de kleur van het omringende token
      if (typeof token === 'string') {
         stukken.push({ tekst: token, naam: buiten });
         return;
      }

      // een token, met zijn eigen kleur als het er een heeft
      const naam = kleurnaam(token) ?? buiten;
      if (Array.isArray(token.content)) maakPlat(token.content, naam, stukken);
      else if (typeof token.content === 'string') stukken.push({ tekst: token.content, naam });
      else maakPlat([token.content], naam, stukken);
   });
   return stukken;
}

/**
 * Zoekt in de stukken het begin van commentaar dat niet op deze regel
 * sluit. Prism kleurt zo'n /* tot het einde van de regel als commentaar;
 * de volgende regels moeten dat ook weten.
 *
 * @param {Array<{tekst: string, naam: string}>} stukken - de stukken van de regel
 * @returns {number} de positie in de regel, of -1
 */
function zoekOpenCommentaar(stukken) {
   let positie = 0;
   for (const stuk of stukken) {
      // commentaar met /* zonder */ op het einde
      const isBlok = stuk.naam === 'comment' && stuk.tekst.startsWith(COMMENTAAR_BEGIN);
      if (isBlok && (stuk.tekst.length < COMMENTAAR_BEGIN.length + COMMENTAAR_EINDE.length || !stuk.tekst.endsWith(COMMENTAAR_EINDE))) return positie;
      positie += stuk.tekst.length;
   }
   return -1;
}

/**
 * Zet één regel om naar de tokens van Monaco.
 *
 * @param {string} regel - de tekst van de regel
 * @param {Toestand} toestand - de toestand aan het einde van de vorige regel
 * @returns {{tokens: Array<object>, endState: Toestand}} de tokens en de nieuwe toestand
 */
function tokenizeer(regel, toestand) {
   const tokens = [];
   let begin = 0;

   // nog in commentaar van een vorige regel: tot */ of tot het einde
   if (toestand.inCommentaar) {
      const einde = regel.indexOf(COMMENTAAR_EINDE);
      tokens.push({ startIndex: 0, scopes: 'comment' });
      if (einde < 0) return { tokens, endState: new Toestand(true) };
      begin = einde + COMMENTAAR_EINDE.length;
   }

   // de rest van de regel met Prism
   const rest = regel.slice(begin);
   const stukken = maakPlat(Prism.tokenize(rest, Prism.languages.csharp), '', []);

   // commentaar dat op deze regel begint en niet sluit
   const open = zoekOpenCommentaar(stukken);
   const tot = open >= 0 ? open : rest.length;

   // een token per stuk, tot het open commentaar
   let positie = 0;
   for (const stuk of stukken) {
      if (positie >= tot) break;
      tokens.push({ startIndex: begin + positie, scopes: stuk.naam });
      positie += stuk.tekst.length;
   }
   if (open >= 0) tokens.push({ startIndex: begin + open, scopes: 'comment' });

   return { tokens, endState: new Toestand(open >= 0) };
}

/**
 * Geeft de regels voor een Monaco-thema: één per token met kleur.
 *
 * @param {string} thema - bv. zand
 * @returns {Array<object>} de regels voor monaco.editor.defineTheme
 */
function monacoRegels(thema) {
   return Object.entries(KLEUREN[thema]).map(([token, kleur]) => ({ token, foreground: kleur }));
}

/**
 * Geeft de CSS voor de codeblokken van de opgave in een thema. De regels
 * gelden overal, zodat ook de kopie voor een nieuw tabblad haar kleuren
 * kan overnemen.
 *
 * @param {string} thema - bv. zand
 * @returns {string} de CSS-regels voor .token.<naam>
 */
function css(thema) {
   return Object.entries(KLEUREN[thema])
      .map(([token, kleur]) => `.token.${token} { color: #${kleur}; }`)
      .join('\n');
}

/**
 * Kleurt C#-code met Prism als HTML.
 *
 * @param {string} code - de code
 * @returns {string} de HTML met spans per token
 */
function kleurHtml(code) {
   return Prism.highlight(code, Prism.languages.csharp, 'csharp');
}

/**
 * Geeft de toestand aan het begin van een bestand: niet in commentaar.
 *
 * @returns {Toestand} de begintoestand
 */
function beginToestand() {
   return new Toestand(false);
}

/**
 * Registreert Prism als tokenizer voor C#; die gaat voor op die van Monaco.
 */
function init() {
   monaco.languages.setTokensProvider('csharp', {
      getInitialState: beginToestand,
      tokenize: tokenizeer,
   });
}

// EXPORTS
// =======

export const PrismKleuren = { init, monacoRegels, css, kleurHtml };
