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
const vendorDir = path.join(root, 'public', 'vendor');

// Copy Monaco Editor
const monacoSrc = path.join(root, 'node_modules', 'monaco-editor', 'min');
const monacoDest = path.join(vendorDir, 'monaco-editor', 'min');
console.log('Kopieer Monaco Editor...');
copyDir(monacoSrc, monacoDest);

// Copy JSZip
const jszipSrc = path.join(root, 'node_modules', 'jszip', 'dist', 'jszip.min.js');
const jszipDest = path.join(vendorDir, 'jszip.min.js');
console.log('Kopieer JSZip...');
fs.mkdirSync(vendorDir, { recursive: true });
fs.copyFileSync(jszipSrc, jszipDest);

// Copy JSON5
const json5Src = path.join(root, 'node_modules', 'json5', 'dist', 'index.min.js');
const json5Dest = path.join(vendorDir, 'json5.min.js');
console.log('Kopieer JSON5...');
fs.copyFileSync(json5Src, json5Dest);

// Copy marked
const markedSrc = path.join(root, 'node_modules', 'marked', 'lib', 'marked.umd.js');
const markedDest = path.join(vendorDir, 'marked.min.js');
console.log('Kopieer marked...');
fs.copyFileSync(markedSrc, markedDest);

console.log('Klaar! Vendor bestanden gekopieerd naar public/vendor/');
