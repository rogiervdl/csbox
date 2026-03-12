/* =====================================================
   CSBox — Hoofdlogica
   ===================================================== */

(function () {
  'use strict';

  const DEFAULT_CS = `using System;

class Program
{
    static void Main(string[] args)
    {
        Console.WriteLine("Hallo, wereld!");

        for (int i = 1; i <= 5; i++)
        {
            Console.WriteLine($"Regel {i}");
        }
    }
}`;

  // ── Monaco initialisatie ─────────────────────────────
  require(['vs/editor/editor.main'], function () {

    const editor = monaco.editor.create(document.getElementById('editor-cs'), {
      theme: 'vs-dark',
      value: DEFAULT_CS,
      language: 'csharp',
      fontSize: 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      automaticLayout: true,
      tabSize: 4,
      renderLineHighlight: 'line',
      smoothScrolling: true,
    });

    // ── Output panel ────────────────────────────────────
    const outputBody  = document.getElementById('output-body');
    const errorsBody  = document.getElementById('errors-body');
    const errorsPanel = document.getElementById('errors-panel');
    const errorsBadge = document.getElementById('errors-badge');
    let errorCount = 0;

    function clearOutput() {
      outputBody.innerHTML = '';
    }

    function clearErrors() {
      errorsBody.innerHTML = '';
      errorCount = 0;
      errorsBadge.textContent = '';
      errorsBadge.classList.remove('visible');
    }

    function appendOutput(lines) {
      lines.forEach(function (line) {
        const el = document.createElement('div');
        el.className = 'output-line';
        el.textContent = line;
        outputBody.appendChild(el);
      });
      outputBody.scrollTop = outputBody.scrollHeight;
    }

    function appendErrors(errors) {
      errors.forEach(function (err) {
        const entry = document.createElement('div');
        entry.className = 'error-entry' + (err.severity === 'warning' ? ' error-entry--warning' : '');

        const loc = document.createElement('span');
        loc.className = 'error-entry__location';
        loc.textContent = err.line ? `r${err.line}:${err.col || 0}` : '';

        const text = document.createElement('span');
        text.className = 'error-entry__text';
        text.textContent = err.message;

        entry.appendChild(loc);
        entry.appendChild(text);
        errorsBody.appendChild(entry);

        if (err.severity !== 'warning') {
          errorCount++;
        }
      });

      if (errorCount > 0) {
        errorsBadge.textContent = errorCount;
        errorsBadge.classList.add('visible');

        // Open errors panel als het ingeklapt is
        errorsPanel.classList.remove('is-collapsed');
      }

      errorsBody.scrollTop = errorsBody.scrollHeight;
    }

    // ── Run ──────────────────────────────────────────────
    const btnRun = document.getElementById('btn-run');

    async function runCode() {
      if (btnRun.classList.contains('is-running')) return;

      const code = editor.getValue();
      clearOutput();
      clearErrors();

      btnRun.classList.add('is-running');
      btnRun.querySelector('span').textContent = 'Bezig...';

      try {
        const result = await window.CSRunner.runCSharp(code);

        if (result.output && result.output.length > 0) {
          appendOutput(result.output);
        }

        if (result.errors && result.errors.length > 0) {
          appendErrors(result.errors);
        }
      } catch (e) {
        appendErrors([{ message: 'Onverwachte fout: ' + e.message, line: 0, col: 0, severity: 'error' }]);
      } finally {
        btnRun.classList.remove('is-running');
        btnRun.querySelector('span').textContent = 'Run';
      }
    }

    // ── Errors panel toggle ──────────────────────────────
    document.getElementById('errors-toggle').addEventListener('click', function (e) {
      if (e.target === document.getElementById('errors-clear')) return;
      errorsPanel.classList.toggle('is-collapsed');
      if (!errorsPanel.classList.contains('is-collapsed')) {
        errorCount = 0;
        errorsBadge.textContent = '';
        errorsBadge.classList.remove('visible');
      }
    });

    document.getElementById('errors-clear').addEventListener('click', function (e) {
      e.stopPropagation();
      clearErrors();
    });

    document.getElementById('output-clear').addEventListener('click', clearOutput);

    // ── Keyboard shortcut Ctrl+Enter = Run ──────────────
    editor.addCommand(
      monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
      runCode
    );

    // ── Layout toggle ────────────────────────────────────
    const workspace = document.getElementById('workspace');

    document.getElementById('btn-layout').addEventListener('click', function () {
      workspace.classList.toggle('layout-stacked');

      // Reset inline flex-sizes zodat de layout netjes herverdeelt
      document.getElementById('editor-panel').style.flex = '';
      document.getElementById('right-panel').style.flex = '';
      document.getElementById('output-panel').style.flex = '';
      document.getElementById('errors-panel').style.flex = '';

      editor.layout();
    });

    // ── Button events ────────────────────────────────────
    btnRun.addEventListener('click', runCode);

    // ── Download .cs ─────────────────────────────────────
    document.getElementById('btn-download').addEventListener('click', function () {
      const code = editor.getValue();
      const blob = new Blob([code], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'Program.cs';
      a.click();
      URL.revokeObjectURL(url);
    });

    // ── Upload .cs of .zip ───────────────────────────────
    document.getElementById('input-upload').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (file.name.endsWith('.zip')) {
        JSZip.loadAsync(file).then(function (zip) {
          // Zoek eerste .cs bestand in de ZIP
          const csFile = Object.values(zip.files).find(f => f.name.endsWith('.cs') && !f.dir);
          if (!csFile) {
            alert('Geen .cs bestand gevonden in de ZIP.');
            return;
          }
          csFile.async('string').then(function (content) {
            editor.setValue(content);
          });
        }).catch(function () {
          alert('Kon de ZIP niet lezen.');
        });
      } else {
        const reader = new FileReader();
        reader.onload = function (ev) {
          editor.setValue(ev.target.result);
        };
        reader.readAsText(file);
      }

      e.target.value = '';
    });

    // ── Resizer: editor ↔ right panel ───────────────────
    function initResizer(resizerEl, getPanelA, getPanelB, isVerticalFn) {
      let startPos, startSizeA, startSizeB;

      resizerEl.addEventListener('mousedown', function (e) {
        e.preventDefault();
        resizerEl.classList.add('is-dragging');
        const vert = isVerticalFn();
        startPos   = vert ? e.clientY : e.clientX;
        startSizeA = vert ? getPanelA().offsetHeight : getPanelA().offsetWidth;
        startSizeB = vert ? getPanelB().offsetHeight : getPanelB().offsetWidth;

        function onMove(e) {
          const vert  = isVerticalFn();
          const delta = (vert ? e.clientY : e.clientX) - startPos;
          const newA  = Math.max(80, startSizeA + delta);
          const total = vert
            ? getPanelA().parentElement.offsetHeight
            : getPanelA().parentElement.offsetWidth;
          const pct = (newA / total) * 100;
          getPanelA().style.flex = '0 0 ' + pct + '%';
          getPanelB().style.flex = '1 1 0';
          editor.layout();
        }

        function onUp() {
          resizerEl.classList.remove('is-dragging');
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
        }

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    }

    initResizer(
      document.getElementById('main-resizer'),
      function () { return document.getElementById('editor-panel'); },
      function () { return document.getElementById('right-panel'); },
      function () { return workspace.classList.contains('layout-stacked'); }
    );

    initResizer(
      document.getElementById('right-resizer'),
      function () { return document.getElementById('output-panel'); },
      function () { return document.getElementById('errors-panel'); },
      function () { return !workspace.classList.contains('layout-stacked'); }
    );

  });

})();
