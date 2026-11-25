/*
 * Aanvulling (IntelliSense) voor C#
 *
 * Monaco kent C# enkel voor de kleuren. Deze module stelt voor wat bij de
 * plaats past, uit een vaste lijst (zie csharp-api.js) en uit de eigen code
 * (zie csharp-code.js):
 * - na using: de namespaces;
 * - na een punt: de leden van een type, variabele, eigen klasse (met de
 *   geërfde leden) of namespace, volgens hun toegang;
 * - elders: sleutelwoorden, snippets, de types van de geïmporteerde
 *   namespaces, de eigen types, variabelen en leden van de huidige klasse.
 * Het type van een variabele kent ze enkel als het uit de declaratie blijkt;
 * anders komen er geen voorstellen.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Bestanden } from './bestanden.js';
import { CSharpApi } from './csharp-api.js';
import { CSharpCode } from './csharp-code.js';

// DECLARATIES
// ===========

// het type van enkele statische leden; een methode eindigt op ()
const STATISCHE_TYPES = {
   'DateTime.Now': 'DateTime',
   'DateTime.Today': 'DateTime',
   'string.Empty': 'string',
   'Environment.NewLine': 'string',
   'Console.ReadLine()': 'string',
   'Console.ReadKey()': 'ConsoleKeyInfo',
   'File.ReadAllText()': 'string',
   'File.ReadAllLines()': 'string[]',
   'string.Join()': 'string',
   'string.Format()': 'string',
};

// het type van enkele leden van een object; een methode eindigt op ()
const INSTANTIE_TYPES = {
   'Length': 'int',
   'Count': 'int',
   'Message': 'string',
   'Elapsed': 'TimeSpan',
   'Date': 'DateTime',
   'KeyChar': 'char',
   'Key': 'ConsoleKey',
   'ToString()': 'string',
   'ToUpper()': 'string',
   'ToLower()': 'string',
   'Trim()': 'string',
   'Substring()': 'string',
   'Replace()': 'string',
   'Split()': 'string[]',
   'Next()': 'int',
};

// FUNCTIES
// ========

/**
 * Zet een .NET-typenaam om naar zijn C#-alias, bv. String → string.
 *
 * @param {string} naam
 * @returns {string}
 */
function alias(naam) {
   return CSharpApi.ALIASSEN[naam] ?? naam;
}

/**
 * Geeft het type van een element van een verzameling: bij een index ([...])
 * of in een foreach.
 *
 * @param {string} type - bv. List<Knikker>, int[], Dictionary<string, int>
 * @param {boolean} isIndex - true bij een index, false bij foreach
 * @returns {string|null}
 */
function elementVan(type, isIndex) {
   const { basis, args, isArray } = CSharpCode.ontleedType(type);
   if (isArray) return basis;
   if (alias(basis) === 'string') return 'char';
   if (basis === 'Dictionary') return isIndex ? args[1] : `KeyValuePair<${args.join(', ')}>`;
   return args[0] ?? null;
}

/**
 * Splitst een uitdrukking als a.B(x.y)[0].c op de punten die niet tussen
 * haakjes staan.
 *
 * @param {string} uitdrukking
 * @returns {Array<string>} bv. ["a", "B(x.y)[0]", "c"]
 */
function splitsDelen(uitdrukking) {
   const delen = [];
   let diepte = 0;
   let huidig = '';
   for (const teken of uitdrukking) {
      if ('(['.includes(teken)) diepte++;
      if (')]'.includes(teken)) diepte--;
      if (teken === '.' && diepte === 0) {
         delen.push(huidig.trim());
         huidig = '';
      } else {
         huidig += teken;
      }
   }
   delen.push(huidig.trim());
   return delen;
}

/**
 * Verzamelt wat de aanvulling over de code moet weten: de ontdane code van
 * het huidige bestand, alle eigen types, de variabelen, de usings en de
 * klasse waarin de cursor staat.
 *
 * @param {object} model - het Monaco-model van het huidige bestand
 * @param {number} offset - de positie van de cursor
 * @returns {object}
 */
function maakContext(model, offset) {
   // het huidige bestand, ontdaan
   const origineel = model.getValue();
   const code = CSharpCode.ontdoe(origineel);
   const eigenTypes = CSharpCode.zoekTypes(code);

   // de eigen types van de andere .cs-bestanden
   const huidigPad = model.uri.path.replace(/^\//, '');
   const anderen = Object.entries(Bestanden.alle())
      .filter(([pad]) => pad.endsWith('.cs') && pad !== huidigPad)
      .flatMap(([, inhoud]) => CSharpCode.zoekTypes(CSharpCode.ontdoe(inhoud)));
   const types = new Map([...anderen, ...eigenTypes].map(type => [type.naam, type]));

   // de binnenste klasse rond de cursor
   const rond = eigenTypes.filter(type => type.begin < offset && offset <= type.einde);
   const klasse = rond.sort((a, b) => b.begin - a.begin)[0] ?? null;

   return { origineel, code, offset, types, klasse, variabelen: CSharpCode.zoekVariabelen(origineel, code), usings: CSharpCode.zoekUsings(code) };
}

/**
 * Geeft alle leden van een eigen type, ook de geërfde: eerst de eigen, dan
 * die van de basistypes. Een lid dat het type zelf al heeft (override,
 * new), komt niet nog eens. Erft het type van een bekend type, zoals
 * Exception, dan komen diens leden erbij.
 *
 * @param {string} naam - de naam van het type
 * @param {object} ctx - zie maakContext
 * @returns {Array<object>} de leden, elk met eigenaar: het type dat het lid declareert
 */
function alleLeden(naam, ctx) {
   const leden = [];
   const gezien = new Set();
   const bezocht = new Set();

   // daal af langs de basistypes; elk type één keer, tegen een kringloop
   function voegToe(typeNaam) {
      if (bezocht.has(typeNaam)) return;
      bezocht.add(typeNaam);
      const type = ctx.types.get(typeNaam);

      // een bekend type: zijn leden op een object, publiek
      if (!type) {
         (CSharpApi.INSTANTIE[typeNaam] ?? []).forEach(item => {
            const lid = { naam: item.replace(/\(\)$/, ''), type: '', isMethode: item.endsWith('()'), isStatisch: false, toegang: 'public', eigenaar: typeNaam };
            if (!gezien.has(lid.naam)) leden.push(lid);
            gezien.add(lid.naam);
         });
         return;
      }

      // de eigen leden, dan de basistypes
      type.leden.forEach(lid => {
         if (!gezien.has(lid.naam)) leden.push({ ...lid, eigenaar: typeNaam });
         gezien.add(lid.naam);
      });
      type.basen.forEach(voegToe);
   }
   voegToe(naam);
   return leden;
}

/**
 * Gaat na of een type van een ander type erft, rechtstreeks of verder.
 *
 * @param {string} naam - het afgeleide type
 * @param {string} basis - het mogelijke basistype
 * @param {object} ctx - zie maakContext
 * @returns {boolean}
 */
function erftVan(naam, basis, ctx) {
   const bezocht = new Set();
   const teBekijken = [naam];
   while (teBekijken.length > 0) {
      const huidig = teBekijken.pop();
      if (huidig === basis) return true;
      if (bezocht.has(huidig)) continue;
      bezocht.add(huidig);
      teBekijken.push(...(ctx.types.get(huidig)?.basen ?? []));
   }
   return false;
}

/**
 * Gaat na of een lid zichtbaar is vanuit de klasse rond de cursor: public
 * altijd, private enkel in de eigen klasse, protected ook in een afgeleide.
 *
 * @param {object} lid - met toegang en eigenaar
 * @param {object} ctx - zie maakContext
 * @returns {boolean}
 */
function isZichtbaar(lid, ctx) {
   if (lid.toegang === 'public') return true;
   if (!ctx.klasse) return false;
   if (lid.toegang === 'private') return ctx.klasse.naam === lid.eigenaar;
   return erftVan(ctx.klasse.naam, lid.eigenaar, ctx);
}

/**
 * Zoekt het type van een variabele: de laatste declaratie vóór de cursor.
 *
 * @param {string} naam
 * @param {object} ctx - zie maakContext
 * @returns {string|null}
 */
function typeVanVariabele(naam, ctx) {
   // de laatste declaratie vóór de cursor, of anders de eerste
   const kandidaten = ctx.variabelen.filter(variabele => variabele.naam === naam);
   const ervoor = kandidaten.filter(variabele => variabele.positie <= ctx.offset);
   const variabele = ervoor[ervoor.length - 1] ?? kandidaten[0];
   if (!variabele) return null;

   // foreach (var x in y): het element van y
   if (variabele.elementVan) {
      const lijst = loopAf(splitsDelen(variabele.elementVan), ctx);
      return lijst?.instantie ? elementVan(lijst.instantie, false) : null;
   }
   return variabele.type;
}

/**
 * Bepaalt waar het eerste deel van een uitdrukking naar verwijst.
 *
 * @param {string} naam - bv. knikkers, Console, System, this, base
 * @param {boolean} isAanroep - true als het een methodeaanroep is
 * @param {object} ctx - zie maakContext
 * @returns {object|null} { instantie: type }, { statisch: type } of { namespace: naam }
 */
function beginVan(naam, isAanroep, ctx) {
   // een methode of property van de huidige klasse, ook een geërfde
   const eigenLeden = ctx.klasse ? alleLeden(ctx.klasse.naam, ctx) : [];
   const lid = eigenLeden.find(item => item.naam === naam && item.isMethode === isAanroep && item.type);
   if (isAanroep) return lid ? { instantie: lid.type } : null;

   // this en base: de huidige klasse of haar eerste basistype
   if (naam === 'this') return ctx.klasse ? { instantie: ctx.klasse.naam } : null;
   if (naam === 'base') return ctx.klasse?.basen[0] ? { instantie: ctx.klasse.basen[0] } : null;

   // een variabele of een veld van de huidige klasse
   const type = typeVanVariabele(naam, ctx) ?? lid?.type;
   if (type) return { instantie: type };

   // een eigen of bekend type
   const naamType = alias(naam);
   if (ctx.types.has(naamType) || CSharpApi.STATISCH[naamType] || CSharpApi.ENUMS[naamType] || CSharpApi.TYPES[naamType]) return { statisch: naamType };

   // een namespace
   if (CSharpApi.NAMESPACES.some(ns => ns === naam || ns.startsWith(`${naam}.`))) return { namespace: naam };
   return null;
}

/**
 * Bepaalt waar het volgende deel van een uitdrukking naar verwijst.
 *
 * @param {object} vorige - het resultaat tot nu, zie beginVan
 * @param {string} naam - het volgende deel
 * @param {boolean} isAanroep - true als het een methodeaanroep is
 * @param {object} ctx - zie maakContext
 * @returns {object|null}
 */
function volgendeVan(vorige, naam, isAanroep, ctx) {
   const sleutel = isAanroep ? `${naam}()` : naam;

   // in een namespace: een dieper namespace of een type
   if (vorige.namespace) {
      const ns = `${vorige.namespace}.${naam}`;
      if (CSharpApi.NAMESPACES.some(item => item === ns || item.startsWith(`${ns}.`))) return { namespace: ns };
      return CSharpApi.TYPES[naam] === vorige.namespace ? { statisch: naam } : null;
   }

   // statisch: een enumwaarde, een statisch lid van een eigen type, of een bekend statisch lid
   if (vorige.statisch) {
      const eigen = ctx.types.get(vorige.statisch);
      if (eigen?.isEnum || CSharpApi.ENUMS[vorige.statisch]) return { instantie: vorige.statisch };
      const lid = eigen ? alleLeden(eigen.naam, ctx).find(item => item.naam === naam && item.isStatisch && item.isMethode === isAanroep) : null;
      if (lid?.type) return { instantie: lid.type };
      const bekend = STATISCHE_TYPES[`${vorige.statisch}.${sleutel}`];
      return bekend ? { instantie: bekend } : null;
   }

   // een lid van een object: van een eigen type (ook geërfd), van KeyValuePair, of een bekend lid
   const { basis, args } = CSharpCode.ontleedType(vorige.instantie);
   const lid = ctx.types.has(basis) ? alleLeden(basis, ctx).find(item => item.naam === naam && item.isMethode === isAanroep) : null;
   if (lid?.type) return { instantie: lid.type };
   if (basis === 'KeyValuePair' && (naam === 'Key' || naam === 'Value')) return { instantie: args[naam === 'Key' ? 0 : 1] };
   return INSTANTIE_TYPES[sleutel] ? { instantie: INSTANTIE_TYPES[sleutel] } : null;
}

/**
 * Loopt een uitdrukking als a.B()[0].c af en bepaalt waar ze naar verwijst.
 *
 * @param {Array<string>} delen - bv. ["a", "B()[0]", "c"]
 * @param {object} ctx - zie maakContext
 * @returns {object|null}
 */
function loopAf(delen, ctx) {
   let huidig = null;
   for (let i = 0; i < delen.length; i++) {
      // de naam, en of het een aanroep is en er een index volgt
      const naam = delen[i].replace(/[([].*$/s, '');
      const isAanroep = /^\w+\s*\(/.test(delen[i]);
      const isIndex = /\]\s*$/.test(delen[i]);

      // het begin of het volgende deel
      huidig = i === 0 ? beginVan(naam, isAanroep, ctx) : volgendeVan(huidig, naam, isAanroep, ctx);
      if (!huidig) return null;

      // een index geeft het element
      if (isIndex) {
         const element = huidig.instantie ? elementVan(huidig.instantie, true) : null;
         if (!element) return null;
         huidig = { instantie: element };
      }
   }
   return huidig;
}

/**
 * Maakt één voorstel.
 *
 * @param {string} label - wat getoond wordt; een methode eindigt op ()
 * @param {string} soort - een naam uit monaco.languages.CompletionItemKind, bv. Method
 * @param {object} range - het woord dat vervangen wordt
 * @param {string} [detail] - uitleg rechts
 * @returns {object}
 */
function voorstel(label, soort, range, detail = '') {
   // een methode krijgt haakjes, met de cursor ertussen
   const isMethode = label.endsWith('()');
   const naam = isMethode ? label.slice(0, -2) : label;
   return {
      label: naam,
      kind: monaco.languages.CompletionItemKind[isMethode ? 'Method' : soort],
      insertText: isMethode ? `${naam}($0)` : naam,
      insertTextRules: isMethode ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
      detail,
      range,
   };
}

/**
 * Maakt het voorstel van een lid van een eigen type, met zijn type en het
 * type dat het declareert als uitleg.
 *
 * @param {object} lid - zie alleLeden
 * @param {object} range
 * @returns {object}
 */
function voorstelVanLid(lid, range) {
   const detail = [lid.type, lid.eigenaar].filter(Boolean).join(' · ');
   return voorstel(lid.isMethode ? `${lid.naam}()` : lid.naam, 'Field', range, detail);
}

/**
 * Geeft de leden van wat een uitdrukking voor de punt is.
 *
 * @param {object} doel - zie loopAf
 * @param {object} ctx - zie maakContext
 * @param {object} range
 * @returns {Array<object>}
 */
function ledenVan(doel, ctx, range) {
   // een namespace: dieper namespaces en de types erin
   if (doel.namespace) {
      const diepere = CSharpApi.NAMESPACES
         .filter(ns => ns.startsWith(`${doel.namespace}.`))
         .map(ns => ns.slice(doel.namespace.length + 1).split('.')[0]);
      const types = Object.keys(CSharpApi.TYPES).filter(type => CSharpApi.TYPES[type] === doel.namespace);
      return [...new Set(diepere)].map(naam => voorstel(naam, 'Module', range))
         .concat(types.map(type => voorstel(type, 'Class', range)));
   }

   // statisch: de enumwaarden en de zichtbare statische leden van een eigen type, ook geërfd
   if (doel.statisch) {
      const eigen = ctx.types.get(doel.statisch);
      if (eigen) {
         const zichtbaar = alleLeden(eigen.naam, ctx).filter(lid => lid.isStatisch && isZichtbaar(lid, ctx));
         return eigen.waarden.map(waarde => voorstel(waarde, 'EnumMember', range, eigen.naam))
            .concat(zichtbaar.map(lid => voorstelVanLid(lid, range)));
      }

      // of de statische leden en enumwaarden van een bekend type
      return (CSharpApi.STATISCH[doel.statisch] ?? []).map(lid => voorstel(lid, 'Property', range, doel.statisch))
         .concat((CSharpApi.ENUMS[doel.statisch] ?? []).map(waarde => voorstel(waarde, 'EnumMember', range, doel.statisch)));
   }

   // een object van een eigen type: de zichtbare leden, ook geërfd
   const { basis, isArray } = CSharpCode.ontleedType(doel.instantie);
   const objectleden = CSharpApi.OBJECT.map(lid => voorstel(lid, 'Method', range, 'object'));
   if (!isArray && ctx.types.has(basis)) {
      const zichtbaar = alleLeden(basis, ctx).filter(lid => !lid.isStatisch && isZichtbaar(lid, ctx));
      const namen = new Set(zichtbaar.map(lid => lid.naam));
      return zichtbaar.map(lid => voorstelVanLid(lid, range))
         .concat(objectleden.filter(item => !namen.has(item.label)));
   }

   // een object van een bekend type, met LINQ op een verzameling
   const sleutel = isArray ? 'array' : alias(basis);
   const metLinq = ctx.usings.has('System.Linq') && CSharpApi.VERZAMELINGEN.includes(sleutel);
   return (CSharpApi.INSTANTIE[sleutel] ?? []).concat(metLinq ? CSharpApi.LINQ : [])
      .map(lid => voorstel(lid, 'Property', range, doel.instantie))
      .concat(objectleden);
}

/**
 * Geeft de voorstellen buiten een punt: sleutelwoorden, snippets, types,
 * variabelen en de zichtbare leden van de huidige klasse, ook geërfd.
 *
 * @param {object} ctx - zie maakContext
 * @param {object} range
 * @returns {Array<object>}
 */
function algemeen(ctx, range) {
   // de sleutelwoorden
   const sleutelwoorden = CSharpApi.SLEUTELWOORDEN.map(woord => voorstel(woord, 'Keyword', range));

   // de snippets, met de naam van de huidige klasse in ctor
   const snippets = CSharpApi.SNIPPETS.map(snippet => ({
      label: snippet.naam,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: snippet.tekst.replace('{{klasse}}', ctx.klasse?.naam ?? 'Klasse'),
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      detail: snippet.uitleg,
      range,
   }));

   // de types van de geïmporteerde namespaces en de eigen types
   const bekend = Object.keys(CSharpApi.TYPES).filter(type => ctx.usings.has(CSharpApi.TYPES[type]));
   const types = [...bekend, ...ctx.types.keys()].map(type => voorstel(type, 'Class', range));

   // de variabelen en de zichtbare leden van de huidige klasse, elk één keer
   const variabelen = [...new Set(ctx.variabelen.map(variabele => variabele.naam))].map(naam => voorstel(naam, 'Variable', range));
   const leden = ctx.klasse ? alleLeden(ctx.klasse.naam, ctx).filter(lid => isZichtbaar(lid, ctx)).map(lid => voorstelVanLid(lid, range)) : [];

   return [...sleutelwoorden, ...snippets, ...types, ...variabelen, ...leden];
}

/**
 * Geeft de voorstellen op de plaats van de cursor; Monaco filtert ze op wat
 * er al getypt is.
 *
 * @param {object} model
 * @param {object} position
 * @returns {{suggestions: Array<object>}}
 */
function geefVoorstellen(model, position) {
   // het woord dat vervangen wordt
   const woord = model.getWordUntilPosition(position);
   const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: woord.startColumn, endColumn: woord.endColumn };

   // in commentaar of een string: niets
   const offset = model.getOffsetAt(position);
   const ctx = maakContext(model, offset);
   if (offset > 0 && ctx.code[offset - 1] !== ctx.origineel[offset - 1]) return { suggestions: [] };

   // na using: de namespaces, één deel per keer
   const regel = ctx.code.slice(ctx.code.lastIndexOf('\n', offset - 1) + 1, offset);
   const using = regel.match(/^\s*using\s+([\w.]*)$/);
   if (using) {
      const voor = using[1].includes('.') ? using[1].slice(0, using[1].lastIndexOf('.') + 1) : '';
      const delen = CSharpApi.NAMESPACES.filter(ns => ns.startsWith(voor)).map(ns => ns.slice(voor.length).split('.')[0]);
      return { suggestions: [...new Set(delen)].map(deel => voorstel(deel, 'Module', range)) };
   }

   // na een stringliteral en een punt: de leden van string
   if (/"\s*\.\w*$/.test(regel)) return { suggestions: ledenVan({ instantie: 'string' }, ctx, range) };

   // na een punt: de leden van de uitdrukking ervoor (namen, aanroepen en indexen), of niets als die onbekend is
   const deel = '[A-Za-z_]\\w*(?:\\s*\\([^()]*\\))?(?:\\[[^\\]]*\\])?';
   const toegang = regel.match(new RegExp(`(${deel}(?:\\s*\\.\\s*${deel})*)\\s*\\.\\s*\\w*$`));
   if (toegang) {
      const doel = loopAf(splitsDelen(toegang[1]), ctx);
      return { suggestions: doel ? ledenVan(doel, ctx, range) : [] };
   }

   // na een punt achter iets anders (een getal, een geneste aanroep): niets
   if (/\.\w*$/.test(regel)) return { suggestions: [] };

   // elders: de algemene voorstellen
   return { suggestions: algemeen(ctx, range) };
}

/**
 * Registreert de aanvulling voor C#; na een punt verschijnt ze meteen.
 */
function init() {
   monaco.languages.registerCompletionItemProvider('csharp', {
      triggerCharacters: ['.'],
      provideCompletionItems: geefVoorstellen,
   });
}

// EXPORTS
// =======

export const Aanvulling = { init };
