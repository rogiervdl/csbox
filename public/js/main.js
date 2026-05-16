/*
 * Main entry point
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Config }    from './config.js';
import { Formatter } from './modules/formatter.js';
import { Terminal }  from './modules/terminal.js';
import { Errors }    from './modules/errors.js';
import { Wasm }      from './modules/wasm.js';
import { Toolbar }   from './modules/toolbar.js';
import { Resizer }   from './modules/resizer.js';

require(['vs/editor/editor.main'], initApp);

function initApp() {
   monaco.languages.registerDocumentFormattingEditProvider('csharp', {
      provideDocumentFormattingEdits: model => [{
         range: model.getFullModelRange(),
         text: Formatter.formatCSharp(model.getValue()),
      }],
   });

   const editor = monaco.editor.create(document.querySelector('#editor-cs'), {
      ...Config.editor,
      value: Config.defaultCode,
   });

   if (document.documentElement.classList.contains('theme-light')) {
      monaco.editor.setTheme('vs');
   }

   Terminal.init(Wasm.provideInput);
   Errors.init();
   Wasm.init(Terminal, Errors);
   Toolbar.init(editor, Wasm);
   Resizer.init(editor);

   const handleEditorRunShortcut = () => Wasm.run(editor.getValue());
   editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleEditorRunShortcut);
}
