/**
 * Campos condicionales de la ficha: la fecha de esterilización solo existe si la casilla
 * «Está esterilizado» está marcada, y los datos del adoptante, solo si el estado es «Adoptado».
 *
 * Mientras no tocan, su bloque está oculto (`hidden`) y sus campos, desactivados (`disabled`). Un
 * campo desactivado no se valida ni lo lee `FormData`, así que lo escrito en él no se guarda. Lo
 * escrito no se borra: si se vuelve a marcar la opción, el campo aparece con lo que tenía.
 *
 * @module componentes/campos-condicionales
 */

/**
 * Los bloques condicionales de la ficha.
 * @typedef {object} BloquesCondicionales
 * @property {HTMLElement} esterilizacion El bloque `#bloque-esterilizacion`.
 * @property {HTMLElement} adopcion El bloque `#bloque-adopcion`.
 */

/**
 * Enseña u oculta un bloque condicional y activa o desactiva todos sus campos.
 * @param {HTMLElement} bloque
 * @param {boolean} visible
 * @example
 * mostrarCondicional(documento.querySelector('#bloque-adopcion'), true);
 */
export function mostrarCondicional(bloque, visible) {
  bloque.hidden = !visible;
  bloque.querySelectorAll('input, select, textarea').forEach((campo) => {
    campo.disabled = !visible;
  });
}

/**
 * Pone cada bloque condicional como corresponde a lo marcado ahora en el formulario.
 * @param {HTMLFormElement} formulario El formulario `#formulario-animal`.
 * @param {BloquesCondicionales} bloques
 */
export function actualizarCondicionales(formulario, bloques) {
  mostrarCondicional(bloques.esterilizacion, formulario.elements.esterilizado.checked);
  mostrarCondicional(bloques.adopcion, formulario.elements.estado.value === 'adoptado');
}

/**
 * Hace que los bloques condicionales sigan a la casilla y al estado: los pone como toca ahora y
 * los vuelve a poner con cada cambio del formulario (un solo oyente `change`, al que llegan por
 * burbuja los cambios de la casilla y de los botones de estado).
 * @param {HTMLFormElement} formulario El formulario `#formulario-animal`.
 * @param {BloquesCondicionales} bloques
 * @returns {function(): void} La función que los vuelve a poner, para cuando la página cambia los
 *   campos desde el código (al rellenar una ficha guardada).
 * @listens change
 * @example
 * const actualizar = iniciarCamposCondicionales(formulario, { esterilizacion, adopcion });
 */
export function iniciarCamposCondicionales(formulario, bloques) {
  const actualizar = () => actualizarCondicionales(formulario, bloques);
  formulario.addEventListener('change', actualizar);
  actualizar();
  return actualizar;
}
