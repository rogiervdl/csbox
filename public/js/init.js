/*
 * Early synchronous setup — runs before DOM and other scripts.
 * No imports, no exports.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// Monaco AMD loader config — must precede loader.js
// eslint-disable-next-line no-var
var require = { paths: { vs: '/vendor/monaco-editor/min/vs' } };

// Apply saved theme before first paint to avoid flash
if (localStorage.getItem('csbox-theme') === 'light') {
   document.documentElement.classList.add('theme-light');
}
