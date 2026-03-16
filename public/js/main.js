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

  function splitSegments(line) {
    const segs = [];
    let i = 0, cur = '';

    function flush(prot) { if (cur !== '') { segs.push({ text: cur, prot: prot }); cur = ''; } }

    while (i < line.length) {
      if (line[i] === '/' && line[i + 1] === '/') {
        flush(false);
        segs.push({ text: line.slice(i), prot: true });
        return segs;
      }
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
    s = s.replace(/\s*(\+=|-=|\*=|\/=|%=|&=|\|=|\^=)\s*/g, ' $1 ');
    s = s.replace(/\s*(===|!==|==|!=|<=|>=|&&|\|\||\?\?|=>)\s*/g, ' $1 ');
    s = s.replace(/([a-z0-9_)\]])<( )/g, '$1 <$2');
    s = s.replace(/([a-z0-9_)\]])<([0-9])/g, '$1 < $2');
    s = s.replace(/([0-9_)\]])>(?!=)(\s)/g, '$1 >$2');
    s = s.replace(/([0-9_)\]])>([0-9])/g, '$1 > $2');
    s = s.replace(/([^=!<>+\-*/%&|^])\s*=\s*([^=>])/g, '$1 = $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\+\s*([^+=])/g, '$1 + $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*-\s*([^\-=])/g, '$1 - $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\*\s*([^=])/g,  '$1 * $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*\/\s*([^/=])/g, '$1 / $2');
    s = s.replace(/([a-zA-Z0-9_)\]])\s*%\s*([^=])/g,   '$1 % $2');
    s = s.replace(/,\s*/g, ', ');
    s = s.replace(/\b(if|else if|for|foreach|while|switch|catch|using)\s*\(/g, '$1 (');
    s = s.replace(/\s*\{/g, ' {').replace(/^\s*\{/, '{');
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

    // ── WASM setup (main thread) ────────────────────────
    // De .NET runtime draait op de browser main thread zodat
    // WasmEnableThreads werkt. Student-code draait op een
    // thread pool thread (Task.Run); blocking via SemaphoreSlim.

    let wasmExports = null;
    let wasmReady   = false;
    let running     = false;
    let readKeyMode = false;

    const csboxInterop = {
      sendOutput(text) {
        handleOutput(text);
      },
      notifyInputNeeded(mode) {
        readKeyMode = (mode === 'key');
        scheduleInputEnable();
      },
      sendDone(exitCode) {
        ansiState = { fg: null, bg: null };
        readKeyMode = false;
        setStatus('');
        setRunning(false);
        running = false;
        if (exitCode !== 0 && exitCode !== -1) {
          termAppend('\n[Programma gestopt met exitcode ' + exitCode + ']');
        }
      },
      sendError(message) {
        termAppend('\n[Fout: ' + message + ']');
      },
    };

    (async function initWasm() {
      try {
        const { dotnet } = await import('/wasm-dist/dotnet.js');
        const runtime = await dotnet.create();
        runtime.setModuleImports('csbox-interop', csboxInterop);
        wasmExports = await runtime.getAssemblyExports('wasm-host');
        wasmReady = true;
      } catch (err) {
        termAppend('[WASM laad-fout: ' + (err?.message ?? err) + ']');
      }
    })();

    // ── Output parsing (sentinels voor kleur/clear) ────
    const CSBOX_RE  = /__CSBOX_(CLEAR|RS|FG:\d+|BG:\d+)__/;
    const CSBOX_PFX = '__CSBOX_';
    const CSBOX_MAX = '__CSBOX_BG:100__'.length;
    let outBuf = '';

    function handleOutput(raw) {
      const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      outBuf += text;

      let m;
      while ((m = CSBOX_RE.exec(outBuf)) !== null) {
        if (m.index > 0) termAppend(outBuf.slice(0, m.index));
        handleSentinel(m[1]);
        outBuf = outBuf.slice(m.index + m[0].length);
        CSBOX_RE.lastIndex = 0;
      }

      let hold = 0;
      const p = outBuf.lastIndexOf(CSBOX_PFX);
      if (p !== -1 && p + CSBOX_MAX >= outBuf.length) {
        hold = outBuf.length - p;
      } else {
        for (let len = Math.min(outBuf.length, CSBOX_PFX.length - 1); len > 0; len--) {
          if (outBuf.endsWith(CSBOX_PFX.slice(0, len))) { hold = len; break; }
        }
      }

      const toSend = outBuf.slice(0, outBuf.length - hold);
      if (toSend) { termAppend(toSend); outBuf = outBuf.slice(toSend.length); }
    }

    function handleSentinel(tag) {
      if (tag === 'CLEAR') { termClear(); return; }
      if (tag === 'RS')    { ansiState = { fg: null, bg: null }; return; }
      const [ch, code] = tag.split(':');
      if (ch === 'FG') ansiState.fg = ANSI_FG[+code] ?? null;
      if (ch === 'BG') ansiState.bg = ANSI_BG[+code] ?? null;
    }

    // ── ANSI rendering ──────────────────────────────────
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

    function setStatus(text) { termStatus.textContent = text; }

    let inputPauseTimer = null;

    function setRunning(isRunning) {
      btnRun.style.display  = isRunning ? 'none' : '';
      btnStop.style.display = isRunning ? '' : 'none';
      termInput.disabled    = true;
      if (isRunning) termInput.focus();
    }

    function scheduleInputEnable() {
      clearTimeout(inputPauseTimer);
      termInput.disabled = true;
      inputPauseTimer = setTimeout(function () {
        if (running) {
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

    // ── Run via WASM ──────────────────────────────────────
    async function runCode() {
      if (running) return;

      const code = editor.getValue();
      termClear();
      clearErrors();
      outBuf = '';
      setRunning(true);
      running = true;
      setStatus('Compileren...');

      // Stap 1: Compileer op de server (Roslyn → IL-bytes)
      let compileResult;
      try {
        const resp = await fetch('/api/compile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });
        compileResult = await resp.json();
      } catch (err) {
        termAppend('[Netwerkfout: ' + err.message + ']');
        setRunning(false);
        running = false;
        return;
      }

      // Toon compile-fouten
      if (compileResult.errors && compileResult.errors.length > 0) {
        showErrors(compileResult.errors);
      }

      if (!compileResult.dll) {
        setRunning(false);
        running = false;
        setStatus('');
        return;
      }

      setStatus('');

      // Stap 2: Decodeer base64 DLL
      const raw    = atob(compileResult.dll);
      const dll    = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) dll[i] = raw.charCodeAt(i);

      // Stap 3: Wacht tot de WASM runtime klaar is
      if (!wasmReady) {
        setStatus('WASM laden...');
        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (wasmReady) { clearInterval(check); resolve(); }
          }, 100);
          setTimeout(() => { clearInterval(check); resolve(); }, 30000);
        });
        setStatus('');
      }

      if (!wasmExports) {
        termAppend('[WASM runtime niet beschikbaar.]');
        setRunning(false);
        running = false;
        return;
      }

      // Stap 4: Voer DLL uit op thread pool thread (Task.Run in C#)
      wasmExports.WasmExports.RunCode(dll).catch(function (err) {
        termAppend('\n[Fout: ' + (err?.message ?? err) + ']');
        setRunning(false);
        running = false;
      });
    }

    function stopCode() {
      if (wasmExports && running) {
        wasmExports.WasmExports.SetCancelled().catch(function () {});
      }
    }

    // ── Terminal invoer ───────────────────────────────────
    termInput.addEventListener('keydown', function (e) {
      if (readKeyMode && e.key.length === 1) {
        e.preventDefault();
        readKeyMode = false;
        const val = e.key;
        termInput.value = '';
        termAppend(val + '\n');
        wasmExports.WasmExports.ProvideInput(val).catch(function () {});
        scheduleInputEnable();
        return;
      }
      if (e.key === 'Enter' && !readKeyMode) {
        const val = termInput.value;
        termInput.value = '';
        termAppend(val + '\n');
        wasmExports.WasmExports.ProvideInput(val).catch(function () {});
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

    // WASM init start al bij het laden van de pagina (hierboven)

  });

})();
