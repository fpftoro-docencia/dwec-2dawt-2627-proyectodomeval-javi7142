/**
 * Atajo de teclado del buscador: al pulsar la tecla `/` el foco pasa al buscador de la página, como
 * en muchas webs. Lo comparten el listado de animales y la zona de administración.
 *
 * No actúa si quien pulsa la tecla está escribiendo en otro sitio (un campo, una lista, un cuadro
 * de texto o un elemento editable), porque ahí la barra es parte de lo que se escribe, ni si lleva
 * pulsada otra tecla como Ctrl o Alt.
 *
 * @module componentes/atajo-busqueda
 */

/**
 * Conecta la tecla `/` con el buscador con un único oyente en el documento.
 * @param {Document} documento El documento donde se escucha el teclado.
 * @param {HTMLInputElement} buscador El campo al que se lleva el foco.
 * @listens keydown
 * @example
 * iniciarAtajoBusqueda(document, document.querySelector('#buscador'));
 */
export function iniciarAtajoBusqueda(documento, buscador) {
  documento.addEventListener('keydown', (evento) => {
    const escribiendo = evento.target.closest('input, select, textarea, [contenteditable]');
    if (evento.key !== '/' || escribiendo || evento.ctrlKey || evento.metaKey || evento.altKey) {
      return;
    }
    // Sin esto, la barra se escribiría en el buscador nada más recibir el foco
    evento.preventDefault();
    buscador.focus();
  });
}
