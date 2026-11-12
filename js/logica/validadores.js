/**
 * Validadores de formato: funciones puras, sin DOM, que reciben el texto escrito y devuelven el
 * mensaje de error, o `''` si es válido.
 *
 * Devuelven un mensaje (y no `true` o `false`) porque así se pasa tal cual a
 * `campo.setCustomValidity(mensaje)`. Un campo vacío se da por bueno: de eso se encarga el atributo
 * `required` del HTML, con su propio mensaje.
 *
 * Se reúnen en el objeto `validadores`, con el mismo nombre que el atributo `data-validar` de cada
 * campo (`data-validar="usuario"` usa `validadores.usuario`).
 *
 * @module logica/validadores
 */

/** Usuario: empieza por una letra y sigue con 2 a 19 letras, cifras, puntos, guiones o guiones bajos. */
const USUARIO = /^\p{L}[\p{L}\d_.-]{2,19}$/u;

/** Correo: algo, una arroba, algo, un punto y algo, sin espacios ni más arrobas. */
const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Nombre: empieza por una letra y sigue con 1 a 29 letras, espacios, apóstrofos o guiones. */
const NOMBRE = /^\p{L}[\p{L} '-]{1,29}$/u;

/** Microchip: exactamente 15 dígitos. */
const MICROCHIP = /^\d{15}$/;

/** Teléfono: 9 cifras, empezando por 6, 7 o 9. */
const TELEFONO = /^[679]\d{8}$/;

/** Los cuatro requisitos de la contraseña, cada uno con su expresión regular. */
const REQUISITOS_CLAVE = Object.freeze({
  longitud: /^.{8,}$/u,
  minuscula: /\p{Ll}/u,
  mayuscula: /\p{Lu}/u,
  cifra: /\d/,
});

/**
 * Dice qué requisitos cumple una contraseña. El registro lo usa para marcarlos mientras se escribe.
 * @param {string} clave
 * @returns {{ longitud: boolean, minuscula: boolean, mayuscula: boolean, cifra: boolean }}
 * @example
 * requisitosClave('huellas1'); // { longitud: true, minuscula: true, mayuscula: false, cifra: true }
 */
export function requisitosClave(clave) {
  return Object.fromEntries(
    Object.entries(REQUISITOS_CLAVE).map(([requisito, regla]) => [requisito, regla.test(clave)]),
  );
}

/**
 * Valida el nombre de usuario. Los espacios del principio y del final no cuentan.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarUsuario('lola_23'); // ''
 * validarUsuario('23lola'); // 'El usuario empieza por una letra…'
 */
export function validarUsuario(valor) {
  const usuario = valor.trim();
  if (usuario === '' || USUARIO.test(usuario)) {
    return '';
  }
  return 'El usuario empieza por una letra y tiene de 3 a 20 caracteres: letras, cifras, puntos o guiones.';
}

/**
 * Valida el correo electrónico. Los espacios del principio y del final no cuentan.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarCorreo('lola@ejemplo.org'); // ''
 * validarCorreo('lola@ejemplo'); // 'Escribe un correo como nombre@ejemplo.org.'
 */
export function validarCorreo(valor) {
  const correo = valor.trim();
  if (correo === '' || CORREO.test(correo)) {
    return '';
  }
  return 'Escribe un correo como nombre@ejemplo.org.';
}

/**
 * Valida la contraseña: tiene que cumplir los cuatro requisitos.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válida.
 * @example
 * validarClave('Huellas123'); // ''
 * validarClave('huellas'); // 'La contraseña necesita…'
 */
export function validarClave(valor) {
  if (valor === '' || Object.values(requisitosClave(valor)).every(Boolean)) {
    return '';
  }
  return 'La contraseña necesita 8 caracteres o más, una minúscula, una mayúscula y una cifra.';
}

/**
 * Valida un nombre: el del animal y el del adoptante. Los espacios del principio y del final no
 * cuentan.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarNombre("Toñi d'Ávila"); // ''
 * validarNombre('L'); // 'El nombre empieza por una letra…'
 */
export function validarNombre(valor) {
  const nombre = valor.trim();
  if (nombre === '' || NOMBRE.test(nombre)) {
    return '';
  }
  return 'El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones';
}

/**
 * Valida el microchip del animal. Los espacios del principio y del final no cuentan.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarMicrochip('941000024680135'); // ''
 * validarMicrochip('94100002468013'); // 'El microchip tiene 15 dígitos'
 */
export function validarMicrochip(valor) {
  const microchip = valor.trim();
  if (microchip === '' || MICROCHIP.test(microchip)) {
    return '';
  }
  return 'El microchip tiene 15 dígitos';
}

/**
 * Valida el teléfono del adoptante. Los espacios del principio y del final no cuentan.
 * @param {string} valor
 * @returns {string} El mensaje de error, o `''` si es válido.
 * @example
 * validarTelefono('612345678'); // ''
 * validarTelefono('812345678'); // 'El teléfono tiene 9 cifras y empieza por 6, 7 o 9'
 */
export function validarTelefono(valor) {
  const telefono = valor.trim();
  if (telefono === '' || TELEFONO.test(telefono)) {
    return '';
  }
  return 'El teléfono tiene 9 cifras y empieza por 6, 7 o 9';
}

/**
 * Los validadores de formato, por el nombre que lleva el campo en `data-validar`.
 * @type {Object<string, function(string): string>}
 */
export const validadores = Object.freeze({
  usuario: validarUsuario,
  correo: validarCorreo,
  clave: validarClave,
  nombre: validarNombre,
  microchip: validarMicrochip,
  telefono: validarTelefono,
});
