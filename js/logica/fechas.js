/**
 * Fechas: funciones puras para las fechas de la ficha, que se guardan como `AAAA-MM-DD` (el valor
 * de un `<input type="date">`).
 *
 * @module logica/fechas
 */

/**
 * Escribe una fecha `AAAA-MM-DD` como se lee en España, `DD/MM/AAAA`. No usa `Date`, así que la
 * zona horaria no puede cambiar el día.
 * @param {string} fecha La fecha como la da un campo de fecha.
 * @returns {string} La fecha escrita, o `''` si no tiene la forma `AAAA-MM-DD`.
 * @example
 * fechaCorta('2026-10-13'); // '13/10/2026'
 * fechaCorta(''); // ''
 */
export function fechaCorta(fecha) {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha ?? '');
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : '';
}
