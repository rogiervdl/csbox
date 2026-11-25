/*
 * Feedbacktekst module — de resultaten van de tests als tekst
 *
 * Bouwt de markdown van de feedback uit de resultaten van de tests, en
 * rendert ze veilig: HTML uit de bron wordt tekst, links moeten http of https
 * zijn, afbeeldingen worden hun alt-tekst. Overgenomen uit WebBox.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// FUNCTIES
// ========

/**
 * Maakt tekst veilig om als HTML te tonen.
 *
 * @param {string} tekst - willekeurige tekst
 * @returns {string} de tekst met HTML-tekens als entities
 */
function ontsnap(tekst) {
   return String(tekst)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
}

/**
 * Maakt een eigen markdown-parser met de veilige renderer.
 *
 * @returns {object} een marked.Marked met parse()
 */
function maakMarkdown() {
   const markdown = new marked.Marked({ gfm: true, breaks: true });

   // HTML wordt tekst; links enkel naar http(s), in een nieuw tabblad; geen afbeeldingen
   markdown.use({
      renderer: {
         html(token) {
            return ontsnap(token.text);
         },
         link(token) {
            const tekst = this.parser.parseInline(token.tokens);
            if (!/^https?:\/\//i.test(token.href)) return tekst;
            return `<a href="${ontsnap(token.href)}" target="_blank" rel="noopener noreferrer">${tekst}</a>`;
         },
         image(token) {
            return ontsnap(token.text);
         },
      },
   });

   return markdown;
}

/**
 * Groepeert resultaten op hun caption, in de volgorde van hun eerste voorkomen.
 *
 * @param {Array<object>} resultaten - de resultaten van de tests
 * @returns {Map<string, Array<object>>} per caption de resultaten
 */
function groepeerOpCaption(resultaten) {
   const groepen = new Map();
   resultaten.forEach(item => {
      const sleutel = item.caption || 'Andere';
      if (!groepen.has(sleutel)) groepen.set(sleutel, []);
      groepen.get(sleutel).push(item);
   });
   return groepen;
}

/**
 * Bouwt de regels van resultaten: elke test met ✓/✗ en zijn description,
 * met een tip bij falen.
 *
 * @param {Array<object>} items - de resultaten
 * @returns {string} de regels als markdown
 */
function bouwRegels(items) {
   return items.map(item => {
      const teken = item.geslaagd ? '✓' : '✗';
      const tip = !item.geslaagd && item.tips ? `\n_tip: ${item.tips}_` : '';
      return `${teken} ${item.description}${tip}`;
   }).join('\n');
}

/**
 * Bouwt de tekst van de resultaten, per caption: een titel met de regels
 * eronder. Tests zonder caption komen onder "Andere"; heeft geen enkele test
 * een caption, dan komen er geen titels.
 *
 * @param {Array<object>} resultaten - caption, description, tips, punten en geslaagd per test
 * @returns {string} de feedback als markdown
 */
function bouwToetsTekst(resultaten) {
   // zonder enige caption: enkel de regels
   if (resultaten.every(item => !item.caption)) return bouwRegels(resultaten);

   // per caption een titel met de regels eronder
   return [...groepeerOpCaption(resultaten).entries()]
      .map(([caption, items]) => `**${caption}**\n${bouwRegels(items)}`)
      .join('\n\n');
}

/**
 * Kleurt de ✓/✗-tekens in een gerenderd bericht groen en rood. Gebeurt na
 * het renderen, op de tekstknopen, omdat de veilige renderer HTML in de
 * markdown escapet.
 *
 * @param {HTMLElement} bericht - het gerenderde bericht
 */
function kleurTekens(bericht) {
   // alle tekstknopen, vóór er iets vervangen wordt
   const stapper = document.createTreeWalker(bericht, NodeFilter.SHOW_TEXT);
   const tekstKnopen = [];
   let knoop = stapper.nextNode();
   while (knoop) {
      tekstKnopen.push(knoop);
      knoop = stapper.nextNode();
   }

   // de tekens in een eigen span, de rest blijft tekst
   tekstKnopen.forEach(tekstKnoop => {
      if (!/[✓✗]/.test(tekstKnoop.textContent)) return;
      const span = document.createElement('span');
      span.innerHTML = ontsnap(tekstKnoop.textContent)
         .replace(/✓/g, '<span class="teken-ok">✓</span>')
         .replace(/✗/g, '<span class="teken-fout">✗</span>');
      tekstKnoop.replaceWith(...span.childNodes);
   });
}

// EXPORTS
// =======

export const Feedbacktekst = { maakMarkdown, bouwToetsTekst, kleurTekens };
