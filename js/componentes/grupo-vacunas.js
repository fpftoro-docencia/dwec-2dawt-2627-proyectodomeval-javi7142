/**
 * Grupo dinámico de vacunas de la ficha: de 0 a 3 filas, cada una con su vacuna y su fecha,
 * copiadas de la plantilla `#plantilla-vacuna`.
 *
 * La plantilla no lleva `id` (se copia varias veces y los `id` no se pueden repetir): al copiarla,
 * el componente da a cada campo un `id` único con un número que nunca se repite, aunque se quiten
 * filas, y con él enlaza su etiqueta (`htmlFor`) y su caja de error (`aria-describedby`).
 *
 * «Añadir vacuna» y los botones «Quitar» se atienden con dos oyentes de `click`: uno en el botón de
 * añadir y otro en el grupo, que sirve para todas las filas, también las que se añadan después
 * (delegación con `closest`). En el máximo, «Añadir vacuna» se desactiva con `disabled`. Cada vez
 * que cambia el número de filas, el grupo lanza el evento propio `cambio-vacunas` (con burbuja).
 *
 * @module componentes/grupo-vacunas
 */
import { MAX_VACUNAS } from './tarjeta-animal.js';

/**
 * Los elementos de la ficha que usa el grupo de vacunas.
 * @typedef {object} ElementosVacunas
 * @property {HTMLElement} grupo El contenedor `#grupo-vacunas`, donde van las filas.
 * @property {HTMLButtonElement} boton El botón `#anadir-vacuna`.
 * @property {HTMLElement} contador El párrafo `#contador-vacunas` («1 de 3 vacunas»).
 * @property {HTMLTemplateElement} plantilla La plantilla `#plantilla-vacuna`.
 */

/**
 * Lo que devuelve `iniciarGrupoVacunas` para que la página pueda añadir filas desde el código.
 * @typedef {object} GrupoVacunas
 * @property {function(?module:datos/animales~Vacuna=): boolean} anadir Añade una fila, vacía o con
 *   una vacuna ya guardada. Devuelve `false` si ya estaba en el máximo.
 */

/**
 * Escribe cuántas vacunas hay en el grupo.
 * @param {number} cantidad
 * @returns {string}
 * @example
 * textoContador(1); // '1 de 3 vacunas'
 */
export function textoContador(cantidad) {
  return `${cantidad} de ${MAX_VACUNAS} vacunas`;
}

/**
 * Enlaza un campo de la fila con su etiqueta y su caja de error, a partir de su `id`.
 * @param {HTMLElement} fila La fila `.vacuna`.
 * @param {HTMLElement} campo El campo, que ya tiene su `id`.
 * @param {string} nombre El `data-campo` de su etiqueta (`'tipo'` o `'fecha'`).
 */
function enlazarCampo(fila, campo, nombre) {
  const caja = fila.querySelector(`[data-campo="error-${nombre}"]`);
  fila.querySelector(`[data-campo="${nombre}"]`).htmlFor = campo.id;
  caja.id = `error-${campo.id}`;
  campo.setAttribute('aria-describedby', caja.id);
}

/**
 * Crea una fila de vacuna copiando la plantilla, con sus `id` y sus enlaces.
 * @param {HTMLTemplateElement} plantilla La plantilla `#plantilla-vacuna`.
 * @param {number} numero El número de la fila, que no se ha usado antes en la página.
 * @param {?module:datos/animales~Vacuna} [vacuna] Una vacuna guardada para rellenarla, o `null`.
 * @returns {HTMLElement} La fila `.vacuna`, lista para añadir al grupo.
 * @example
 * crearFilaVacuna(plantilla, 2); // campos #vacuna-tipo-2 y #vacuna-fecha-2
 */
export function crearFilaVacuna(plantilla, numero, vacuna = null) {
  const fila = plantilla.content.cloneNode(true).querySelector('.vacuna');
  const tipo = fila.querySelector('select');
  const fecha = fila.querySelector('input');
  tipo.id = `vacuna-tipo-${numero}`;
  fecha.id = `vacuna-fecha-${numero}`;
  enlazarCampo(fila, tipo, 'tipo');
  enlazarCampo(fila, fecha, 'fecha');
  if (vacuna) {
    tipo.value = vacuna.tipo;
    fecha.value = vacuna.fecha;
  }
  return fila;
}

/**
 * Pone en marcha el grupo de vacunas: añadir y quitar filas, el contador y el botón de añadir
 * desactivado en el máximo. Al añadir con el botón, el foco va a la vacuna nueva; al quitar, al
 * botón de añadir.
 * @param {ElementosVacunas} elementos Los elementos de la ficha.
 * @returns {GrupoVacunas}
 * @listens click
 * @fires cambio-vacunas
 * @example
 * const vacunas = iniciarGrupoVacunas({ grupo, boton, contador, plantilla });
 * vacunas.anadir({ tipo: 'rabia', fecha: '2026-10-15' });
 */
export function iniciarGrupoVacunas(elementos) {
  const { grupo, boton, contador, plantilla } = elementos;
  let siguiente = 1;

  /**
   * Pone el contador y activa o desactiva «Añadir vacuna» según cuántas filas hay. Después lanza
   * `cambio-vacunas`, que sube hasta el formulario: añadir o quitar una fila no lanza `input` ni
   * `change`, y así la cartilla también se entera.
   */
  function actualizar() {
    const cantidad = grupo.querySelectorAll('.vacuna').length;
    boton.disabled = cantidad >= MAX_VACUNAS;
    contador.textContent = textoContador(cantidad);
    grupo.dispatchEvent(new CustomEvent('cambio-vacunas', { bubbles: true, detail: { cantidad } }));
  }

  /**
   * Añade una fila al final del grupo, si no está en el máximo.
   * @param {?module:datos/animales~Vacuna} [vacuna]
   * @returns {boolean}
   */
  function anadir(vacuna = null) {
    if (grupo.querySelectorAll('.vacuna').length >= MAX_VACUNAS) {
      return false;
    }
    grupo.append(crearFilaVacuna(plantilla, siguiente, vacuna));
    siguiente += 1;
    actualizar();
    return true;
  }

  boton.addEventListener('click', () => {
    if (anadir()) {
      grupo.lastElementChild.querySelector('select').focus();
    }
  });

  grupo.addEventListener('click', (evento) => {
    const quitar = evento.target.closest('[data-accion="quitar"]');
    if (quitar) {
      quitar.closest('.vacuna').remove();
      actualizar();
      boton.focus();
    }
  });

  actualizar();
  return { anadir };
}
