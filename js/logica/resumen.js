/**
 * Resumen de la portada del listado: cuántos animales cuida el usuario y a cuáles les faltan las
 * vacunas. Son funciones puras: no usan el DOM, ni la dirección, ni el almacenamiento, y no
 * cambian lo que reciben.
 *
 * Los animales **adoptados** ya no están a su cargo, así que no cuentan ni en el total ni en el
 * aviso de vacunas.
 *
 * @module logica/resumen
 */

/** Escribe una lista de nombres con comas y «y» al final (`Intl.ListFormat` en español). */
const FORMATO_LISTA = new Intl.ListFormat('es', { style: 'long', type: 'conjunction' });

/**
 * Deja los animales que el usuario cuida ahora: todos menos los adoptados.
 * @param {Array<module:datos/animales~Animal>} animales
 * @returns {Array<module:datos/animales~Animal>} Una lista nueva, en el mismo orden.
 * @example
 * animalesActivos([{ estado: 'acogida' }, { estado: 'adoptado' }]); // [{ estado: 'acogida' }]
 */
export function animalesActivos(animales) {
  return animales.filter((animal) => animal.estado !== 'adoptado');
}

/**
 * Da los nombres de los animales activos que no tienen ninguna vacuna anotada, en el orden de la
 * lista.
 * @param {Array<module:datos/animales~Animal>} animales
 * @returns {string[]}
 * @example
 * nombresSinVacunas([{ nombre: 'Simón', estado: 'acogida', vacunas: [] }]); // ['Simón']
 */
export function nombresSinVacunas(animales) {
  return animalesActivos(animales)
    .filter((animal) => animal.vacunas.length === 0)
    .map((animal) => animal.nombre);
}

/**
 * Escribe la frase de la portada con los animales que el usuario cuida.
 * @param {number} cantidad Cuántos animales cuida.
 * @returns {string}
 * @example
 * textoResumen(1); // 'Ahora mismo cuidas de 1 animal.'
 * textoResumen(9); // 'Ahora mismo cuidas de 9 animales.'
 */
export function textoResumen(cantidad) {
  return `Ahora mismo cuidas de ${cantidad} ${cantidad === 1 ? 'animal' : 'animales'}.`;
}

/**
 * Escribe el aviso de los animales sin vacunas, con el verbo en singular o plural.
 * @param {string[]} nombres Los nombres de los animales sin vacunas (al menos uno).
 * @returns {string}
 * @example
 * textoPendiente(['Simón']); // 'Simón no tiene vacunas anotadas.'
 * textoPendiente(['Simón', 'Copito']); // 'Simón y Copito no tienen vacunas anotadas.'
 */
export function textoPendiente(nombres) {
  const verbo = nombres.length === 1 ? 'no tiene' : 'no tienen';
  return `${FORMATO_LISTA.format(nombres)} ${verbo} vacunas anotadas.`;
}
