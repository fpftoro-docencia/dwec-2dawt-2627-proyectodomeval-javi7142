/**
 * Paginación: la función pura `paginar`, que reparte una lista en páginas. No usa el DOM, ni la
 * dirección, ni el almacenamiento, y no cambia la lista que recibe. La comparten el listado de
 * animales y la zona de administración.
 *
 * La página que se pide se corrige siempre a una que existe, para que la interfaz tenga siempre
 * algo que mostrar:
 * - se acepta un número o el texto de un número (`'2'`, como lo da `URLSearchParams`), y los
 *   decimales se redondean hacia abajo (`2.7` es la página 2);
 * - lo que no es un número (`NaN`, `'abc'`, `null` si la dirección no trae `?pagina=`) es la
 *   página 1;
 * - por debajo de 1 (`0`, `-3`) es la página 1, y por encima del total (`99`), la última;
 * - una lista vacía tiene una página, la 1, sin elementos.
 *
 * @module logica/paginacion
 */

/**
 * Lo que devuelve `paginar`.
 * @typedef {object} Paginacion
 * @property {Array<*>} elementos Los elementos de la página, en el orden de la lista. Es una lista
 *   nueva: cambiarla no cambia la original.
 * @property {number} pagina La página que se muestra, ya corregida: de 1 a `totalPaginas`.
 * @property {number} totalPaginas Cuántas páginas hay. Como mínimo 1, aunque la lista esté vacía.
 */

/**
 * Devuelve los elementos de una página de la lista, la página corregida a la más cercana que
 * existe y el total de páginas.
 * @param {Array<*>} lista Los elementos que se reparten. No se modifica.
 * @param {number|string} pagina La página que se pide, empezando en 1. Si no existe, se corrige
 *   como explica el módulo.
 * @param {number} porPagina Cuántos elementos caben en cada página: un número entero mayor que 0.
 * @returns {Paginacion}
 * @throws {RangeError} Si `porPagina` no es un número entero mayor que 0: es un fallo del código
 *   que llama, no de lo que escribe quien usa la web.
 * @example
 * const letras = ['a', 'b', 'c', 'd', 'e'];
 * paginar(letras, 2, 2); // { elementos: ['c', 'd'], pagina: 2, totalPaginas: 3 }
 * paginar(letras, '3', 2); // { elementos: ['e'], pagina: 3, totalPaginas: 3 }
 * paginar(letras, 99, 2); // { elementos: ['e'], pagina: 3, totalPaginas: 3 }
 * paginar(letras, 0, 2); // { elementos: ['a', 'b'], pagina: 1, totalPaginas: 3 }
 * paginar([], 4, 2); // { elementos: [], pagina: 1, totalPaginas: 1 }
 */
export function paginar(lista, pagina, porPagina) {
  if (!Number.isInteger(porPagina) || porPagina < 1) {
    throw new RangeError(`porPagina tiene que ser un número entero mayor que 0, y es ${porPagina}`);
  }

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const pedida = Math.floor(Number(pagina));
  const valida = Number.isNaN(pedida) ? 1 : pedida;
  const corregida = Math.min(Math.max(valida, 1), totalPaginas);
  const inicio = (corregida - 1) * porPagina;

  return {
    elementos: lista.slice(inicio, inicio + porPagina),
    pagina: corregida,
    totalPaginas,
  };
}
