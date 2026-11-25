/*
 * Vroege, synchrone setup: loopt voor de DOM en de modules, zonder imports.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// configureer de AMD-loader van Monaco; moet voor loader.js staan
// eslint-disable-next-line no-var
var require = { paths: { vs: '/vendor/monaco-editor/min/vs' } };

// zet de basis en het kleurschema voor de eerste weergave, zonder te wachten op Monaco;
// geweigerde opslag (examenbrowser) betekent gewoon het standaardschema
try {
   const csboxTheme = localStorage.getItem('csbox-theme');
   const csboxSchema = localStorage.getItem('csbox-schema');
   if (csboxTheme) document.documentElement.dataset.theme = csboxTheme;
   if (csboxSchema || csboxTheme) document.documentElement.dataset.schema = csboxSchema || csboxTheme;
} catch (e) {
   // opslag niet beschikbaar: standaardschema
}
