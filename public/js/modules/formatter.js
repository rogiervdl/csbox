/*
 * C# code formatter module
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// FUNCTIES
// ========

/**
 * Splits a C# source line into protected (string/comment) and unprotected segments.
 *
 * @param {string} line - A single line of C# source code
 * @returns {{ text: string, prot: boolean }[]} Array of segments
 */
function splitSegments(line) {
   const segs = [];
   let i = 0;
   let cur = '';

   function flush(prot) {
      if (cur !== '') {
         segs.push({ text: cur, prot: prot });
         cur = '';
      }
   }

   while (i < line.length) {
      if (line[i] === '/' && line[i + 1] === '/') {
         flush(false);
         segs.push({ text: line.slice(i), prot: true });
         return segs;
      }
      if (line[i] === '@' && line[i + 1] === '"') {
         flush(false);
         cur = '@"';
         i += 2;
         while (i < line.length) {
            if (line[i] === '"' && line[i + 1] === '"') { cur += '""'; i += 2; }
            else if (line[i] === '"') { cur += '"'; i++; break; }
            else { cur += line[i++]; }
         }
         flush(true);
         continue;
      }
      if (line[i] === '"') {
         flush(false);
         cur = '"';
         i++;
         while (i < line.length) {
            if (line[i] === '\\') { cur += line[i] + (line[i + 1] || ''); i += 2; }
            else if (line[i] === '"') { cur += '"'; i++; break; }
            else { cur += line[i++]; }
         }
         flush(true);
         continue;
      }
      if (line[i] === '\'') {
         flush(false);
         cur = '\'';
         i++;
         while (i < line.length) {
            if (line[i] === '\\') { cur += line[i] + (line[i + 1] || ''); i += 2; }
            else if (line[i] === '\'') { cur += '\''; i++; break; }
            else { cur += line[i++]; }
         }
         flush(true);
         continue;
      }
      cur += line[i++];
   }
   flush(false);
   return segs;
}

/**
 * Applies C# operator spacing rules to an unprotected code segment.
 *
 * @param {string} s - Unprotected code segment
 * @returns {string} Segment with normalized spacing
 */
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
   s = s.replace(/([a-zA-Z0-9_)\]])\s*\*\s*([^=])/g, '$1 * $2');
   s = s.replace(/([a-zA-Z0-9_)\]])\s*\/\s*([^/=])/g, '$1 / $2');
   s = s.replace(/([a-zA-Z0-9_)\]])\s*%\s*([^=])/g, '$1 % $2');
   s = s.replace(/,\s*/g, ', ');
   s = s.replace(/\b(if|else if|for|foreach|while|switch|catch|using)\s*\(/g, '$1 (');
   s = s.replace(/\s*\{/g, ' {').replace(/^\s*\{/, '{');
   s = s.replace(/ {2,}/g, ' ');
   return s;
}

/**
 * Applies spacing rules to a full C# line, skipping protected segments.
 *
 * @param {string} line - A single line of C# source code
 * @returns {string} Line with normalized spacing
 */
function spaceLine(line) {
   return splitSegments(line)
      .map(seg => seg.prot ? seg.text : applySpacing(seg.text))
      .join('');
}

/**
 * Formats a block of C# source code: normalizes indentation and operator spacing.
 *
 * @param {string} code - Raw C# source code
 * @returns {string} Formatted C# source code
 */
function formatCSharp(code) {
   const TAB = '    ';
   const lines = code.split('\n').map(l => l.trimEnd());
   const result = [];
   let indent = 0;

   for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line === '') { result.push(''); continue; }

      const startsClose = line.startsWith('}');
      if (startsClose) indent = Math.max(0, indent - 1);

      result.push(TAB.repeat(indent) + spaceLine(line));

      let delta = 0;
      let inStr = false;
      let inChar = false;

      for (let j = 0; j < line.length; j++) {
         const c = line[j];
         if (!inStr && !inChar && c === '/' && line[j + 1] === '/') break;
         if (c === '"' && !inChar) { inStr = !inStr; continue; }
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

export const Formatter = { formatCSharp };
