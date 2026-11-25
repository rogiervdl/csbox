/*
 * Toolbar module — run en stop
 *
 * Run en Ctrl+Enter voeren alle bestanden van de oefening uit; Stop breekt
 * het programma af.
 *
 * @author Rogier van der Linde <rogier@bitmatters.be>
 */

import { Bestanden } from './bestanden.js';

// DECLARATIES
// ===========

// de uitvoermodule
let wasm = null;

// private DOM
const btnRun = document.querySelector('#btn-run');
const btnStop = document.querySelector('#btn-stop');

// FUNCTIES
// ========

/**
 * Voert alle bestanden van de oefening uit.
 */
function voerUit() {
   wasm.run(Bestanden.alle());
}

/**
 * Initialiseert de toolbar.
 *
 * @param {object} wasmModule - de uitvoermodule
 */
function init(wasmModule) {
   wasm = wasmModule;
   btnRun.addEventListener('click', handleBtnRunClick);
   btnStop.addEventListener('click', handleBtnStopClick);
}

// event handlers

function handleBtnRunClick() {
   voerUit();
}

function handleBtnStopClick() {
   wasm.stop();
}

// EXPORTS
// =======

export const Toolbar = { init, voerUit };
