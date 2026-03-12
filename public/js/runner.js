/* =====================================================
   CSBox — C# Runner (server-side via /api/run)
   ===================================================== */

window.CSRunner = (function () {
  'use strict';

  /**
   * Stuur C# code naar de server, ontvang output + fouten.
   * @param {string} code
   * @returns {Promise<{ output: string[], errors: Array<{message,line,col,severity}> }>}
   */
  async function runCSharp(code) {
    const res = await fetch('/api/run', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ code }),
    });

    if (!res.ok) {
      return {
        output: [],
        errors: [{ message: 'Server fout: ' + res.status, line: 0, col: 0, severity: 'error' }],
      };
    }

    return res.json();
  }

  return { runCSharp };
})();
