/*
 * Resizer module — drag-to-resize between adjacent panels
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// DECLARATIES
// ===========

let editor    = null;
let workspace = null;

// private DOM
const elmMainResizer  = document.querySelector('#main-resizer');
const elmRightResizer = document.querySelector('#right-resizer');
const elmEditorPanel  = document.querySelector('#editor-panel');
const elmRightPanel   = document.querySelector('#right-panel');
const elmTermPanel    = document.querySelector('#terminal-panel');
const elmErrorsPanel  = document.querySelector('#errors-panel');

// FUNCTIES
// ========

/**
 * Wires up drag-to-resize behaviour between two adjacent panels.
 *
 * @param {Element} resizerEl - The resizer divider element
 * @param {function(): Element} getPanelA - Returns the first panel
 * @param {function(): Element} getPanelB - Returns the second panel
 * @param {function(): boolean} isVerticalFn - Returns true when layout is vertical
 */
function initResizer(resizerEl, getPanelA, getPanelB, isVerticalFn) {
   resizerEl.addEventListener('mousedown', handleResizerMousedown);

   function handleResizerMousedown(e) {
      e.preventDefault();
      resizerEl.classList.add('is-dragging');

      const vert = isVerticalFn();
      const startPos = vert ? e.clientY : e.clientX;
      const startSizeA = vert ? getPanelA().offsetHeight : getPanelA().offsetWidth;

      document.addEventListener('mousemove', handleDocMousemove);
      document.addEventListener('mouseup', handleDocMouseup);

      function handleDocMousemove(ev) {
         const isVert = isVerticalFn();
         const delta = (isVert ? ev.clientY : ev.clientX) - startPos;
         const newA = Math.max(80, startSizeA + delta);
         const total = isVert
            ? getPanelA().parentElement.offsetHeight
            : getPanelA().parentElement.offsetWidth;
         getPanelA().style.flex = `0 0 ${(newA / total) * 100}%`;
         getPanelB().style.flex = '1 1 0';
         editor.layout();
      }

      function handleDocMouseup() {
         resizerEl.classList.remove('is-dragging');
         document.removeEventListener('mousemove', handleDocMousemove);
         document.removeEventListener('mouseup', handleDocMouseup);
      }
   }
}

// EXPORTS
// =======

function init(editorInstance) {
   editor = editorInstance;
   workspace = document.querySelector('#workspace');

   initResizer(
      elmMainResizer,
      () => elmEditorPanel,
      () => elmRightPanel,
      () => workspace.classList.contains('layout-stacked')
   );

   initResizer(
      elmRightResizer,
      () => elmTermPanel,
      () => elmErrorsPanel,
      () => !workspace.classList.contains('layout-stacked')
   );
}

export const Resizer = { init };
