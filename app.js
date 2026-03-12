const express = require('express');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const crypto  = require('crypto');
const { spawn } = require('child_process');

const app  = express();
const PORT = process.env.PORT || 3003;

const TIMEOUT_MS = 10_000;

const CSPROJ = `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>`;

// Parses dotnet build/run error lines:
// /tmp/csbox-xxx/Program.cs(5,3): error CS0001: bericht [project.csproj]
const ERROR_RE = /^.*\.cs\((\d+),(\d+)\):\s*(error|warning)\s+\S+:\s*(.+)$/;

function parseErrors(text) {
  const seen = new Set();
  const errors = [];
  for (const line of text.split('\n')) {
    const m = line.replace(/\r$/, '').match(ERROR_RE);
    if (m) {
      // Strip het [csproj pad] achteraan
      const message = m[4].replace(/\s*\[.*\]\s*$/, '').trim();
      const key = m[1] + ':' + m[2] + ':' + message;
      if (seen.has(key)) continue;
      seen.add(key);
      errors.push({
        line:     parseInt(m[1], 10),
        col:      parseInt(m[2], 10),
        severity: m[3],
        message,
      });
    }
  }
  return errors;
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1mb' }));

app.post('/api/run', function (req, res) {
  const code = (req.body && req.body.code) || '';
  if (!code.trim()) {
    return res.json({ output: [], errors: [{ line: 0, col: 0, severity: 'error', message: 'Geen code opgegeven.' }] });
  }

  // Maak tijdelijke projectmap
  const id      = crypto.randomBytes(8).toString('hex');
  const tmpDir  = path.join(os.tmpdir(), 'csbox-' + id);
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, 'csbox.csproj'), CSPROJ, 'utf8');
  fs.writeFileSync(path.join(tmpDir, 'Program.cs'),   code,   'utf8');

  let stdout = '';
  let stderr = '';
  let timedOut = false;

  const proc = spawn('dotnet', ['run', '--project', tmpDir, '--no-launch-profile'], {
    cwd: tmpDir,
    timeout: TIMEOUT_MS,
  });

  proc.stdout.on('data', d => { stdout += d.toString(); });
  proc.stderr.on('data', d => { stderr += d.toString(); });

  const timer = setTimeout(() => {
    timedOut = true;
    proc.kill();
  }, TIMEOUT_MS);

  proc.on('close', function (code) {
    clearTimeout(timer);

    // Ruim tijdelijke map op
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});

    if (timedOut) {
      return res.json({
        output: stdout.split('\n').filter(l => l !== ''),
        errors: [{ line: 0, col: 0, severity: 'error', message: 'Timeout: programma duurde langer dan 10 seconden.' }],
      });
    }

    const errors = parseErrors(stderr + '\n' + stdout);
    const output = stdout
      .split('\n')
      .map(l => l.replace(/\r$/, ''))
      .filter(l => !ERROR_RE.test(l));
    if (output.length > 0 && output[output.length - 1] === '') output.pop();

    res.json({ output, errors });
  });

  proc.on('error', function (err) {
    clearTimeout(timer);
    fs.rm(tmpDir, { recursive: true, force: true }, () => {});
    res.json({
      output: [],
      errors: [{ line: 0, col: 0, severity: 'error', message: 'Kon dotnet niet starten: ' + err.message }],
    });
  });
});

app.listen(PORT, () => {
  console.log(`CSBox draait op http://localhost:${PORT}`);
});
