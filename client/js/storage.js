/*
 * Veilige toegang tot localStorage
 *
 * In een afgeschermde omgeving, zoals een examenbrowser, kan opslag geweigerd
 * worden. Elke toegang gooit dan een SecurityError. Deze wrapper vangt dat op,
 * zodat het ontbreken van opslag hooguit betekent dat er niets bewaard wordt.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

// FUNCTIES
// ========

/**
 * Leest een waarde uit localStorage.
 *
 * @param {string} key - de sleutel
 * @returns {string|null} de waarde, of null als opslag niet beschikbaar is
 */
function get(key) {
   try {
      return localStorage.getItem(key);
   } catch (e) {
      return null;
   }
}

/**
 * Bewaart een waarde in localStorage.
 *
 * @param {string} key - de sleutel
 * @param {string} value - de waarde
 */
function set(key, value) {
   try {
      localStorage.setItem(key, value);
   } catch (e) {
      // opslag niet beschikbaar: stilzwijgend overslaan
   }
}

/**
 * Verwijdert een waarde uit localStorage.
 *
 * @param {string} key - de sleutel
 */
function remove(key) {
   try {
      localStorage.removeItem(key);
   } catch (e) {
      // opslag niet beschikbaar: stilzwijgend overslaan
   }
}

// EXPORTS
// =======

export const Store = { get, set, remove };
