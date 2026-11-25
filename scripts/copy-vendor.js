const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

const root = path.join(__dirname, '..');
const vendorDir = path.join(root, 'client', 'vendor');

// Copy Monaco Editor
const monacoSrc = path.join(root, 'node_modules', 'monaco-editor', 'min');
const monacoDest = path.join(vendorDir, 'monaco-editor', 'min');
console.log('Kopieer Monaco Editor...');
copyDir(monacoSrc, monacoDest);

// Copy marked
const markedSrc = path.join(root, 'node_modules', 'marked', 'lib', 'marked.umd.js');
const markedDest = path.join(vendorDir, 'marked.min.js');
console.log('Kopieer marked...');
fs.copyFileSync(markedSrc, markedDest);

// Copy Prism: de kern (met clike) en de C#-grammatica in één bestand
const prismDir = path.join(root, 'node_modules', 'prismjs');
const prismCode = [
  fs.readFileSync(path.join(prismDir, 'prism.js'), 'utf8'),
  fs.readFileSync(path.join(prismDir, 'components', 'prism-csharp.js'), 'utf8'),
].join('\n');
console.log('Kopieer Prism...');
fs.writeFileSync(path.join(vendorDir, 'prism.js'), prismCode);

console.log('Klaar! Vendor bestanden gekopieerd naar client/vendor/');
