/*
 * Main entry point
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Formatter } from './modules/formatter.js';
import { Terminal } from './modules/terminal.js';
import { Errors } from './modules/errors.js';
import { Wasm } from './modules/wasm.js';
import { Toolbar } from './modules/toolbar.js';
import { Resizer } from './modules/resizer.js';
import { Panelen } from './modules/panelen.js';
import { Bestandsbrowser } from './modules/bestandsbrowser.js';
import { Bestandsbeheer } from './modules/bestandsbeheer.js';
import { Exercises } from './modules/exercises.js';
import { ThemeSwitcher } from './modules/themeswitcher.js';
import { Layout } from './modules/layout.js';
import { Syntax } from './modules/syntax.js';
import { Bestanden } from './modules/bestanden.js';
import { Aanvulling } from './modules/aanvulling.js';
import { Feedback } from './modules/feedback.js';
import { PrismKleuren } from './modules/prism-kleuren.js';

// FUNCTIES
// ========

/**
 * Zet de sneltoetsen op een editor: Ctrl+Enter voert uit, Ctrl+S slaat op
 * en controleert de syntax.
 *
 * @param {object} editor - een Monaco-editor uit een paneel
 */
function zetSneltoetsen(editor) {
   editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, Toolbar.voerUit);
   editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, bewaarEnControleer);
}

/**
 * Slaat alle bestanden op en toont daarna hun syntaxfouten in het
 * foutenpaneel, zonder te compileren.
 */
async function bewaarEnControleer() {
   // meteen opslaan
   Exercises.bewaar();

   // de syntaxfouten; een mislukte of verouderde controle verandert niets
   const fouten = await Syntax.controleer(Bestanden.alle());
   if (!fouten) return;
   Errors.clear();
   Errors.show(fouten);
}

// event handlers

function handleDocumentKeydown(e) {
   // Ctrl+S buiten de editor doet hetzelfde, in plaats van de pagina te bewaren
   if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
   e.preventDefault();
   bewaarEnControleer();
}

/**
 * Start de app zodra Monaco geladen is: formatter, kleurschema en modules.
 */
function initApp() {
   // de eigen formatter voor C#
   monaco.languages.registerDocumentFormattingEditProvider('csharp', {
      provideDocumentFormattingEdits: model => [{
         range: model.getFullModelRange(),
         text: Formatter.formatCSharp(model.getValue()),
      }],
   });

   // de eigen aanvulling en de kleuring met Prism voor C#
   Aanvulling.init();
   PrismKleuren.init();

   // het bewaarde kleurschema, voor alle editors
   ThemeSwitcher.init();

   // terminal, fouten (een klik opent het bestand) en uitvoering
   Terminal.init(Wasm.provideInput);
   Errors.init(Panelen.toonPositie);
   Wasm.init(Terminal, Errors);

   // toolbar, grenzen, panelen en bestanden
   Toolbar.init(Wasm);
   Layout.init();
   Resizer.init(Panelen.herschik);
   Panelen.bijNieuweEditor(zetSneltoetsen);
   Bestandsbrowser.init();
   Bestandsbeheer.init();

   // de feedback, en de oefeningen die haar laten weten welke oefening gekozen is;
   // laadt de standaardbestanden of de laatste oefening
   Feedback.init(Errors);
   Exercises.init(Feedback.kiesOefening);
   document.addEventListener('keydown', handleDocumentKeydown);
}

// START
// =====

// laad Monaco via de AMD-loader en start dan de app
require(['vs/editor/editor.main'], initApp);
