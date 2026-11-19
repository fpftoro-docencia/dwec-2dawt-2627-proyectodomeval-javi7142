/**
 * La página del listado en la dirección: leer `?pagina=2` y escribirla sin tocar el resto de la
 * dirección. Son funciones puras: trabajan con el texto de la consulta (lo que hay después del `?`,
 * como `location.search`) y no usan `location` ni `history`; quien las usa es quien lee y cambia
 * la dirección de verdad.
 *
 * Leer no corrige nada: devuelve lo que hay (un número, aunque no sea una página que existe) y
 * `paginar` lo lleva a la página más cercana que sí existe.
 *
 * @module logica/pagina-url
 */

/** El nombre del parámetro de la dirección donde va la página. */
const PARAMETRO = 'pagina';

/**
 * Lee la página de la consulta de la dirección. Si no hay `pagina`, o no es un número, devuelve 1.
 * @param {string} consulta La consulta de la dirección, con o sin el `?` delante (`location.search`).
 * @returns {number} El número que hay, tal cual (puede ser 0, negativo o mayor que el total, o
 *   tener decimales); 1 si no hay ninguno.
 * @example
 * leerPagina('?pagina=3'); // 3
 * leerPagina('?pagina=99'); // 99
 * leerPagina(''); // 1
 * leerPagina('?pagina=abc'); // 1
 */
export function leerPagina(consulta) {
  const texto = new URLSearchParams(consulta).get(PARAMETRO);
  const numero = Number(texto);
  return texto === null || texto.trim() === '' || Number.isNaN(numero) ? 1 : numero;
}

/**
 * Escribe la página en la consulta de la dirección. Los demás parámetros se quedan como estaban.
 * @param {string} consulta La consulta de la dirección, con o sin el `?` delante.
 * @param {number} pagina La página que se guarda.
 * @returns {string} La consulta nueva, siempre con el `?` delante.
 * @example
 * escribirPagina('', 2); // '?pagina=2'
 * escribirPagina('?pagina=2&orden=nombre', 3); // '?pagina=3&orden=nombre'
 */
export function escribirPagina(consulta, pagina) {
  const parametros = new URLSearchParams(consulta);
  parametros.set(PARAMETRO, String(pagina));
  return `?${parametros}`;
}
