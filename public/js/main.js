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

  // ── ANSI color tables (SGR codes) ────────────────────
  const ANSI_FG = {
    30:'#555',   31:'#cd3131', 32:'#0dbc79', 33:'#e5e510',
    34:'#2472c8',35:'#bc3fbc', 36:'#11a8cd', 37:'#e5e5e5',
    90:'#666',   91:'#f14c4c', 92:'#23d18b', 93:'#f5f543',
    94:'#3b8eea',95:'#d670d6', 96:'#29b8db', 97:'#ffffff',
  };
  const ANSI_BG = {
    40:'#555',   41:'#cd3131', 42:'#0dbc79', 43:'#e5e510',
    44:'#2472c8',45:'#bc3fbc', 46:'#11a8cd', 47:'#e5e5e5',
   100:'#666',  101:'#f14c4c',102:'#23d18b',103:'#f5f543',
   104:'#3b8eea',105:'#d670d6',106:'#29b8db',107:'#ffffff',
  };

  // ── C# formatter ─────────────────────────────────────

  // Splits een regel in segmenten: {text, protected}
  // protected = true voor strings, char literals en commentaar (niet aanpassen)
  function splitSegments(line) {
    const segs = [];
    let i = 0, cur = '';

    function flush(prot) { if (cur !== '') { segs.push({ text: cur, prot: prot }); cur = ''; } }

    while (i < line.length) {
      // Regelcommentaar
      if (line[i] === '/' && line[i + 1] === '/') {
        flush(false);
        segs.push({ text: line.slice(i), prot: true });
        return segs;
      }
      // Verbatim string @"..."
      if (line[i] === '@' && line[i + 1] === '"') {
        flush(false);
        cur = '@"'; i += 2;
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') { cur += '""'; i += 2; }
          else if (line[i] === '"') { cur += '"'; i++; break; }
          else { cur += line[i++]; }
        }
        flush(true); continue;
      }
      // Interpolated / gewone string
      if (line[i] === '"') {
        flush(false);
        cur = '"'; i++;
        while (i < line.length) {
          if (line[i] === '\\') { cur += line[i] + (line[i + 1] || ''); i += 2; }
          else if (line[i] === '"') { cur += '"'; i++; break; }
          else { cur += line[i++]; }
        }
        flush(true); continue;
      }
      // Char literal
      if (line[i] === '\'') {
        flush(false);
        cur = '\''; i++;
        while (i < line.length) {
          if (line[i] === '\\') { cur += line[i] + (line[i + 1] || ''); i += 2; }
          else if (line[i] === '\'') { cur += '\''; i++; break; }
          else { cur += line[i++]; }
        }
        flush(true); continue;
      }
      cur += line[i++];
    }
    flush(false);
    return segs;
  }

  function applySpacing(s) {
    // Compound assignments eerst (voor enkelvoudige = en < >)
    s = s.replace(/\s*(\+=|-=|\*=|\/=|%=|&=|\|=|\^=)\s*/g, ' $1 ');
    // Vergelijkingen en logische operatoren (multi-char eerst)
    s = s.replace(/\s*(===|!==|==|!=|<=|>=|&&|\|\||\?\?|=>)\s*/g, ' $1 ');
    // < vergelijking: spatie NA maar niet VOOR (asymmetrisch), of gevolgd door cijfer
    s = s.replace(/([a-z0-9_)\]])<( )/g, '$1 <$2');
    s = s.replace(/([a-z0-9_)\]])<([0-9])/g, '$1 < $2');
    // > vergelijking: gevolgd door cijfer of spatie+cijfer
    s = s.replace(/([0-9_)\]])>(?!=)(\s)/g, '$1 >$2');
    s = s.replace(/([0-9_)\]])>([0-9])/g, '$1 > $2');
    // Enkelvoudige = (niet onderdeel van ander operator)
    s = s.replace(/([^=!<>+\-*/%&|^])\s*=\s*([^=>])/g, '$1 = $2');
    // Rekenkundige operatoren (alleen als voorafgegaan door identifier/getal/)/)
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\+\s*([^+=])/g, '$1 + $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*-\s*([^\-=])/g, '$1 - $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\*\s*([^=])/g,  '$1 * $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\/\s*([^/=])/g, '$1 / $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*%\s*([^=])/g,   '$1 % $2');
    // Komma
    s = s.replace(/,\s*/g, ', ');
    // Spatie na keywords
    s = s.replace(/\b(if|else if|for|foreach|while|switch|catch|using)\s*\(/g, '$1 (');
    // Eén spatie voor {
    s = s.replace(/\s*\{/g, ' {').replace(/^\s*\{/, '{');
    // Meerdere spaties samenvoegen
    s = s.replace(/ {2,}/g, ' ');
    return s;
  }

  function spaceLine(line) {
    return splitSegments(line)
      .map(function (seg) { return seg.prot ? seg.text : applySpacing(seg.text); })
      .join('');
  }

  function formatCSharp(code) {
    const TAB = '    ';
    const lines = code.split('\n').map(function (l) { return l.trimEnd(); });
    const result = [];
    let indent = 0;

    for (var i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') { result.push(''); continue; }

      const startsClose = line.startsWith('}');
      if (startsClose) indent = Math.max(0, indent - 1);

      result.push(TAB.repeat(indent) + spaceLine(line));

      // Netto accolade-delta (skip strings/commentaar)
      let delta = 0, inStr = false, inChar = false;
      for (var j = 0; j < line.length; j++) {
        const c = line[j];
        if (!inStr && !inChar && c === '/' && line[j + 1] === '/') break;
        if (c === '"' && !inChar) { inStr  = !inStr;  continue; }
        if (c === '\'' && !inStr) { inChar = !inChar; continue; }
        if (inStr || inChar) continue;
        if (c === '{') delta++;
        if (c === '}') delta--;
      }

      if (delta > 0) indent += delta;
      else if (delta < 0 && !startsClose) indent = Math.max(0, indent + delta);
    }

    return result.join('\n');
  }

  require(['vs/editor/editor.main'], function () {

    // Registreer formatter voor C#
    monaco.languages.registerDocumentFormattingEditProvider('csharp', {
      provideDocumentFormattingEdits: function (model) {
        return [{ range: model.getFullModelRange(), text: formatCSharp(model.getValue()) }];
      }
    });

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

    // ── Terminal ─────────────────────────────────────────
    const termOutput  = document.getElementById('terminal-output');
    const termInput   = document.getElementById('terminal-input');
    const termStatus  = document.getElementById('terminal-status');
    const btnRun      = document.getElementById('btn-run');
    const btnStop     = document.getElementById('btn-stop');

    let ws = null;
    let readKeyMode = false;

    // ── ANSI rendering ────────────────────────────────
    let ansiState = { fg: null, bg: null };

    function termAppend(text) {
      if (ansiState.fg || ansiState.bg) {
        const span = document.createElement('span');
        if (ansiState.fg) span.style.color = ansiState.fg;
        if (ansiState.bg) span.style.backgroundColor = ansiState.bg;
        span.textContent = text;
        termOutput.appendChild(span);
      } else {
        termOutput.appendChild(document.createTextNode(text));
      }
      termOutput.scrollTop = termOutput.scrollHeight;
    }

    function termClear() {
      termOutput.textContent = '';
      ansiState = { fg: null, bg: null };
    }

    function setStatus(text) {
      termStatus.textContent = text;
    }

    let inputPauseTimer = null;

    function setRunning(running) {
      btnRun.style.display  = running ? 'none' : '';
      btnStop.style.display = running ? '' : 'none';
      termInput.disabled    = true; // standaard uitgeschakeld, enkel aan bij pauze
      if (running) termInput.focus();
    }

    function scheduleInputEnable() {
      clearTimeout(inputPauseTimer);
      termInput.disabled = true;
      inputPauseTimer = setTimeout(function () {
        if (ws) {
          termInput.disabled = false;
          termInput.focus();
        }
      }, 120);
    }

    // ── Fouten panel ─────────────────────────────────────
    const errorsPanel = document.getElementById('errors-panel');
    const errorsBody  = document.getElementById('errors-body');
    const errorsBadge = document.getElementById('errors-badge');
    let errorCount = 0;

    function clearErrors() {
      errorsBody.innerHTML = '';
      errorCount = 0;
      errorsBadge.textContent = '';
      errorsBadge.classList.remove('visible');
    }

    function showErrors(errors) {
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

        if (err.severity !== 'warning') errorCount++;
      });

      if (errorCount > 0) {
        errorsBadge.textContent = errorCount;
        errorsBadge.classList.add('visible');
        errorsPanel.classList.remove('is-collapsed');
      }
    }

    // ── WebSocket run ─────────────────────────────────────
    function runCode() {
      if (ws) return;

      const code = editor.getValue();
      termClear();
      clearErrors();
      setRunning(true);
      setStatus('Compileren...');
      let firstOutput = true;
      let hadBuildOutput = false;

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(protocol + '//' + location.host);

      ws.onopen = function () {
        ws.send(JSON.stringify({ type: 'start', code: code }));
      };

      ws.onmessage = function (e) {
        const data = JSON.parse(e.data);

        if (data.type === 'build') {
          hadBuildOutput = true;
          setStatus('');
          termAppend(data.data);
        }

        if (data.type === 'output') {
          if (firstOutput) { firstOutput = false; setStatus(''); if (hadBuildOutput) termAppend('\n\n'); }
          termAppend(data.data);
          scheduleInputEnable();
        }

        if (data.type === 'readkey') {
          clearTimeout(inputPauseTimer);
          readKeyMode = true;
          termInput.value = '';
          termInput.disabled = false;
          termInput.focus();
        }

        if (data.type === 'color') {
          if ('fg' in data) ansiState.fg = data.fg !== null ? ANSI_FG[data.fg] : null;
          if ('bg' in data) ansiState.bg = data.bg !== null ? ANSI_BG[data.bg] : null;
        }

        if (data.type === 'clear') {
          termClear();
        }

        if (data.type === 'exit') {
          ansiState = { fg: null, bg: null };
          readKeyMode = false;
          setStatus('');
          setRunning(false);
          ws = null;
          if (data.errors && data.errors.length > 0) {
            showErrors(data.errors);
          }
          if (data.code !== 0 && data.errors && data.errors.length === 0) {
            termAppend('\n[Programma gestopt met exitcode ' + data.code + ']');
          }
        }
      };

      ws.onclose = function () {
        setStatus('');
        setRunning(false);
        ws = null;
      };

      ws.onerror = function () {
        termAppend('\n[Verbindingsfout]');
        setStatus('');
        setRunning(false);
        ws = null;
      };
    }

    function stopCode() {
      if (ws) ws.send(JSON.stringify({ type: 'stop' }));
    }

    // ── Terminal invoer ───────────────────────────────────
    termInput.addEventListener('keydown', function (e) {
      if (readKeyMode && e.key.length === 1) {
        // Één toets sturen zonder Enter
        e.preventDefault();
        readKeyMode = false;
        const val = e.key;
        termInput.value = '';
        termAppend(val + '\n');
        if (ws) ws.send(JSON.stringify({ type: 'input', data: val }));
        scheduleInputEnable();
        return;
      }
      if (e.key === 'Enter' && !readKeyMode) {
        const val = termInput.value;
        termInput.value = '';
        termAppend(val + '\n');
        if (ws) ws.send(JSON.stringify({ type: 'input', data: val }));
        scheduleInputEnable();
      }
    });

    document.getElementById('terminal-clear').addEventListener('click', termClear);

    // ── Fouten panel toggle ───────────────────────────────
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

    // ── Format ────────────────────────────────────────────
    document.getElementById('btn-format').addEventListener('click', function () {
      editor.getAction('editor.action.formatDocument').run();
    });

    // ── Keyboard shortcut ─────────────────────────────────
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode);

    // ── Buttons ───────────────────────────────────────────
    btnRun.addEventListener('click', runCode);
    btnStop.addEventListener('click', stopCode);

    // ── Download ──────────────────────────────────────────
    document.getElementById('btn-download').addEventListener('click', function () {
      const blob = new Blob([editor.getValue()], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'Program.cs'; a.click();
      URL.revokeObjectURL(url);
    });

    // ── Upload ────────────────────────────────────────────
    document.getElementById('input-upload').addEventListener('change', function (e) {
      const file = e.target.files[0];
      if (!file) return;

      if (file.name.endsWith('.zip')) {
        JSZip.loadAsync(file).then(function (zip) {
          const csFile = Object.values(zip.files).find(f => f.name.endsWith('.cs') && !f.dir);
          if (!csFile) { alert('Geen .cs bestand gevonden in de ZIP.'); return; }
          csFile.async('string').then(function (content) { editor.setValue(content); });
        }).catch(function () { alert('Kon de ZIP niet lezen.'); });
      } else {
        const reader = new FileReader();
        reader.onload = function (ev) { editor.setValue(ev.target.result); };
        reader.readAsText(file);
      }
      e.target.value = '';
    });

    // ── Thema toggle ──────────────────────────────────────
    (function () {
      const saved = localStorage.getItem('csbox-theme');
      if (saved === 'light') {
        document.body.classList.add('theme-light');
        monaco.editor.setTheme('vs');
      }
      document.getElementById('btn-theme').addEventListener('click', function () {
        const light = document.body.classList.toggle('theme-light');
        monaco.editor.setTheme(light ? 'vs' : 'vs-dark');
        localStorage.setItem('csbox-theme', light ? 'light' : 'dark');
      });
    })();

    // ── Layout toggle ─────────────────────────────────────
    const workspace = document.getElementById('workspace');

    document.getElementById('btn-layout').addEventListener('click', function () {
      workspace.classList.toggle('layout-stacked');
      document.getElementById('editor-panel').style.flex = '';
      document.getElementById('right-panel').style.flex = '';
      document.getElementById('terminal-panel').style.flex = '';
      document.getElementById('errors-panel').style.flex = '';
      editor.layout();
    });

    // ── Resizers ──────────────────────────────────────────
    function initResizer(resizerEl, getPanelA, getPanelB, isVerticalFn) {
      let startPos, startSizeA;

      resizerEl.addEventListener('mousedown', function (e) {
        e.preventDefault();
        resizerEl.classList.add('is-dragging');
        const vert = isVerticalFn();
        startPos   = vert ? e.clientY : e.clientX;
        startSizeA = vert ? getPanelA().offsetHeight : getPanelA().offsetWidth;

        function onMove(e) {
          const vert  = isVerticalFn();
          const delta = (vert ? e.clientY : e.clientX) - startPos;
          const newA  = Math.max(80, startSizeA + delta);
          const total = vert
            ? getPanelA().parentElement.offsetHeight
            : getPanelA().parentElement.offsetWidth;
          getPanelA().style.flex = '0 0 ' + ((newA / total) * 100) + '%';
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
      function () { return document.getElementById('terminal-panel'); },
      function () { return document.getElementById('errors-panel'); },
      function () { return !workspace.classList.contains('layout-stacked'); }
    );

  });

})();
