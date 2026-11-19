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

/**
 * Da la fecha de hoy como `AAAA-MM-DD`, en la hora del equipo (no en la de Greenwich, como haría
 * `toISOString`): es el `max` de las fechas de la ficha, que no pueden ser futuras.
 * @param {Date} [ahora] El momento del que se saca el día; por defecto, ahora mismo. Los tests
 *   pueden pasar otro.
 * @returns {string}
 * @example
 * fechaDeHoy(new Date(2026, 10, 19)); // '2026-11-19'
 */
export function fechaDeHoy(ahora = new Date()) {
  const dosCifras = (numero) => String(numero).padStart(2, '0');
  return `${ahora.getFullYear()}-${dosCifras(ahora.getMonth() + 1)}-${dosCifras(ahora.getDate())}`;
}
