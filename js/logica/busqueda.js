/**
 * Búsqueda: funciones para el buscador del listado de animales y de la zona de administración. No
 * usan el DOM, ni la dirección, ni el almacenamiento, y no cambian lo que reciben.
 *
 * Al buscar no importan las mayúsculas ni las tildes: el texto buscado y el de cada elemento se
 * pasan por `normalizarTexto` antes de compararlos, así que «simon» encuentra a «Simón». Lo mismo
 * pasa con la diéresis («pinguino» encuentra «pingüino») y con la **ñ**: «nino» encuentra «niño».
 * Se ha decidido así porque quien busca muchas veces no escribe la tilde de la ñ, sobre todo con
 * el teclado del móvil; a cambio, «ano» también encuentra «año», algo que en un buscador no molesta.
 *
 * @module logica/busqueda
 */

/**
 * Prepara un texto para compararlo: lo pasa a minúsculas, le quita las tildes, la diéresis y la
 * tilde de la ñ, y le quita los espacios del principio y del final.
 *
 * Para quitar las tildes, `normalize('NFD')` separa cada letra de su tilde («ó» pasa a ser «o» y
 * una tilde aparte) y la expresión `/\p{M}/gu` borra esas marcas sueltas. La ñ también se separa en
 * «n» y su tilde, por eso «niño» queda como «nino».
 * @param {string} texto El texto que se prepara.
 * @returns {string} El texto en minúsculas, sin tildes y sin espacios a los lados.
 * @example
 * normalizarTexto('Simón'); // 'simon'
 * normalizarTexto('  SIMÓN  '); // 'simon'
 * normalizarTexto('Pingüino'); // 'pinguino'
 * normalizarTexto('Niño'); // 'nino'
 */
export function normalizarTexto(texto) {
  return texto.toLocaleLowerCase('es').normalize('NFD').replace(/\p{M}/gu, '').trim();
}

/**
 * Devuelve los elementos de la lista en los que alguno de los campos indicados contiene el texto
 * buscado, sin importar las mayúsculas ni las tildes. Sirve para animales y para usuarios: solo
 * cambian los campos que se miran.
 *
 * Si el texto está vacío o solo tiene espacios, devuelve la lista entera. Un campo que el elemento
 * no tiene, o que no es texto (un número, `null`, una lista…), no se mira y no da error.
 * @param {Array<object>} lista Los elementos en los que se busca. No se modifica.
 * @param {string} texto Lo que se ha escrito en el buscador.
 * @param {Array<string>} campos Los nombres de los campos de cada elemento en los que se busca.
 * @returns {Array<object>} Una lista nueva con los elementos que coinciden, en el mismo orden.
 *   Cambiarla no cambia la original.
 * @example
 * const animales = [
 *   { nombre: 'Simón', microchip: '941000012345678' },
 *   { nombre: 'Luna', microchip: '941000087654321' },
 * ];
 * filtrarPorTexto(animales, 'simon', ['nombre', 'microchip']); // [{ nombre: 'Simón', … }]
 * filtrarPorTexto(animales, '8765', ['nombre', 'microchip']); // [{ nombre: 'Luna', … }]
 * filtrarPorTexto(animales, '   ', ['nombre']); // los dos animales, en una lista nueva
 */
export function filtrarPorTexto(lista, texto, campos) {
  const buscado = normalizarTexto(texto);
  if (buscado === '') {
    return [...lista];
  }

  return lista.filter((elemento) =>
    campos.some((campo) => {
      const valor = elemento[campo];
      return typeof valor === 'string' && normalizarTexto(valor).includes(buscado);
    }),
  );
}

/**
 * Crea una versión «con espera» de una función: la nueva función no llama a la original enseguida,
 * sino cuando han pasado `espera` milisegundos sin que se la vuelva a llamar. Si se la llama otra
 * vez antes, la cuenta empieza de nuevo. Así el buscador filtra cuando se deja de escribir, y no con
 * cada tecla.
 *
 * La original recibe los argumentos de la última llamada. Funciona con `setTimeout` y
 * `clearTimeout`, sin librerías, y no toca el DOM.
 * @param {Function} funcion La función que se llama al terminar la espera.
 * @param {number} espera Los milisegundos que tienen que pasar sin llamadas nuevas.
 * @returns {Function} La función con espera. Recibe los mismos argumentos que `funcion`.
 * @example
 * const buscar = debounce((texto) => filtrar(texto), 300);
 * buscar('s');
 * buscar('si');
 * buscar('simon'); // 300 ms después, se llama una sola vez a filtrar('simon')
 */
export function debounce(funcion, espera) {
  let temporizador;
  return (...argumentos) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => funcion(...argumentos), espera);
  };
}
