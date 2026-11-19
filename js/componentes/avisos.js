/**
 * Avisos: mensajes breves («Te has registrado», «Revisa los campos marcados») que aparecen arriba
 * de la página y se van solos.
 *
 * Funcionan con un evento propio, `aviso`: cualquier elemento lo lanza con `lanzarAviso`, el evento
 * sube por el DOM (`bubbles: true`) y un único oyente en `document` lo muestra en la región
 * `#avisos` (`role="status"`, así los lectores de pantalla lo leen). El aviso es un `div` con las
 * clases de alerta de Bootstrap según su tipo.
 *
 * Un aviso también se puede dejar guardado en `sessionStorage` para la página siguiente, porque al
 * navegar se pierde todo lo que hay en la página actual.
 *
 * @module componentes/avisos
 */

/** Clave del aviso guardado para la página siguiente. */
export const CLAVE_AVISO = 'huellas.aviso';

/** Tiempo que se ve un aviso antes de quitarse solo, en milisegundos. */
const DURACION = 6000;

/** Los tipos de aviso, que coinciden con las clases de alerta de Bootstrap (`alert-success`…). */
const TIPOS = ['success', 'info', 'warning', 'danger'];

/**
 * @typedef {object} Aviso
 * @property {string} mensaje El texto que se muestra.
 * @property {'success' | 'info' | 'warning' | 'danger'} tipo Su tipo.
 */

/**
 * Lanza el evento `aviso` desde un elemento. Sube hasta `document`, donde se muestra.
 * @param {EventTarget} origen El elemento desde el que se avisa (un formulario, un botón…).
 * @param {string} mensaje
 * @param {string} [tipo] `success` (por defecto), `info`, `warning` o `danger`.
 * @fires aviso
 * @example
 * lanzarAviso(formulario, 'Revisa los campos marcados en rojo.', 'danger');
 */
export function lanzarAviso(origen, mensaje, tipo = 'success') {
  origen.dispatchEvent(new CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } }));
}

/**
 * Deja un aviso guardado para que se muestre al llegar a la página siguiente.
 * @param {Storage} almacen `sessionStorage` o un `AlmacenFalso`.
 * @param {string} mensaje
 * @param {string} [tipo] `success` (por defecto), `info`, `warning` o `danger`.
 * @example
 * dejarAviso(sessionStorage, 'Te has registrado.');
 * location.href = 'listado.html';
 */
export function dejarAviso(almacen, mensaje, tipo = 'success') {
  almacen.setItem(CLAVE_AVISO, JSON.stringify({ mensaje, tipo }));
}

/**
 * Lee y borra el aviso guardado. Si no hay ninguno o está estropeado, devuelve `null`.
 * @param {Storage} almacen
 * @returns {Aviso | null}
 */
function recogerAviso(almacen) {
  try {
    const aviso = JSON.parse(almacen.getItem(CLAVE_AVISO));
    almacen.removeItem(CLAVE_AVISO);
    return typeof aviso?.mensaje === 'string' && aviso.mensaje !== '' ? aviso : null;
  } catch {
    almacen.removeItem(CLAVE_AVISO);
    return null;
  }
}

/**
 * Muestra un aviso en la región: sustituye al anterior y se quita solo al cabo de unos segundos.
 * @param {HTMLElement} region
 * @param {Aviso} aviso
 */
function mostrarAviso(region, { mensaje, tipo }) {
  const alerta = region.ownerDocument.createElement('div');
  alerta.className = `alert alert-${TIPOS.includes(tipo) ? tipo : 'info'}`;
  alerta.textContent = mensaje;
  region.replaceChildren(alerta);
  setTimeout(() => alerta.remove(), DURACION);
}

/**
 * Pone el único oyente de avisos en `document` y muestra el aviso guardado, si lo hay. Cada página
 * lo llama una vez al arrancar.
 * @param {Document} documento
 * @param {Storage} almacen Donde se guardan los avisos para la página siguiente (`sessionStorage`).
 * @listens aviso
 * @example
 * iniciarAvisos(document, sessionStorage);
 */
export function iniciarAvisos(documento, almacen) {
  const region = documento.querySelector('#avisos');
  documento.addEventListener('aviso', (evento) => mostrarAviso(region, evento.detail));

  const guardado = recogerAviso(almacen);
  if (guardado) {
    lanzarAviso(documento.body, guardado.mensaje, guardado.tipo);
  }
}
