/**
 * Progreso de la ficha: cuántos datos obligatorios faltan y cómo se dice. Lo usa la cartilla, que
 * lo enseña en su barra `<progress>` mientras se rellena el formulario.
 *
 * Son funciones puras: reciben lo leído del formulario con `FormData` y no tocan la página.
 *
 * @module logica/progreso-ficha
 */

/**
 * Los `name` de los datos obligatorios de la ficha (los de la tabla «La entidad» del README que no
 * dependen de otra opción).
 * @type {ReadonlyArray<string>}
 */
export const CAMPOS_OBLIGATORIOS = Object.freeze([
  'nombre',
  'especie',
  'sexo',
  'ingreso',
  'peso',
  'microchip',
  'foto',
  'estado',
]);

/**
 * Cuenta los datos obligatorios que faltan: los que no están o solo tienen espacios.
 * @param {FormData} datos Lo leído del formulario de la ficha.
 * @returns {number}
 * @example
 * datosPendientes(new FormData(formulario)); // 7 en una ficha nueva: el estado ya viene marcado
 */
export function datosPendientes(datos) {
  return CAMPOS_OBLIGATORIOS.filter((campo) => String(datos.get(campo) ?? '').trim() === '').length;
}

/**
 * Escribe cuántos datos obligatorios faltan.
 * @param {number} pendientes
 * @returns {string}
 * @example
 * textoProgreso(6); // 'Faltan 6 datos obligatorios'
 * textoProgreso(1); // 'Falta 1 dato obligatorio'
 * textoProgreso(0); // 'Lista para guardar'
 */
export function textoProgreso(pendientes) {
  if (pendientes === 0) {
    return 'Lista para guardar';
  }
  if (pendientes === 1) {
    return 'Falta 1 dato obligatorio';
  }
  return `Faltan ${pendientes} datos obligatorios`;
}
