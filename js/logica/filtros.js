/**
 * Filtros por estado del listado de animales: dejar los de un estado y contar cuántos hay de cada
 * uno. Son funciones puras: no usan el DOM, ni la dirección, ni el almacenamiento, y no cambian lo
 * que reciben.
 *
 * Un animal guardado con un estado que no se reconoce cuenta como «En acogida», igual que lo
 * enseña su tarjeta. Así los tres estados siempre suman el total.
 *
 * @module logica/filtros
 */

/**
 * Los estados por los que se puede filtrar, tal como se guardan en el animal.
 * @type {ReadonlyArray<string>}
 */
export const ESTADOS_FILTRABLES = Object.freeze(['acogida', 'disponible', 'adoptado']);

/**
 * El valor del filtro que no deja fuera a ningún animal.
 * @type {string}
 */
export const FILTRO_TODOS = 'todos';

/**
 * Da el estado con el que cuenta un animal: el suyo o, si no se reconoce, «acogida».
 * @param {module:datos/animales~Animal} animal
 * @returns {string}
 */
function estadoDe(animal) {
  return ESTADOS_FILTRABLES.includes(animal.estado) ? animal.estado : 'acogida';
}

/**
 * Deja los animales del estado pedido, en el mismo orden. Con `'todos'` (o con un filtro que no
 * existe) devuelve todos.
 * @param {Array<module:datos/animales~Animal>} animales No se modifica.
 * @param {string} filtro `'todos'`, `'acogida'`, `'disponible'` o `'adoptado'`.
 * @returns {Array<module:datos/animales~Animal>} Una lista nueva.
 * @example
 * filtrarPorEstado([{ estado: 'acogida' }, { estado: 'adoptado' }], 'adoptado'); // [{ estado: 'adoptado' }]
 */
export function filtrarPorEstado(animales, filtro) {
  if (!ESTADOS_FILTRABLES.includes(filtro)) {
    return [...animales];
  }
  return animales.filter((animal) => estadoDe(animal) === filtro);
}

/**
 * Cuenta cuántos animales hay de cada estado y cuántos en total.
 * @param {Array<module:datos/animales~Animal>} animales
 * @returns {{total: number, acogida: number, disponible: number, adoptado: number}} La suma de los
 *   tres estados es siempre `total`.
 * @example
 * contarPorEstado([{ estado: 'acogida' }, { estado: 'adoptado' }]);
 * // { total: 2, acogida: 1, disponible: 0, adoptado: 1 }
 */
export function contarPorEstado(animales) {
  const cuentas = { total: animales.length, acogida: 0, disponible: 0, adoptado: 0 };
  animales.forEach((animal) => {
    cuentas[estadoDe(animal)] += 1;
  });
  return cuentas;
}
