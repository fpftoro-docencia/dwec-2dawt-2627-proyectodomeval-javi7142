/**
 * Usuarios: el registro de voluntarios, la comprobación de su contraseña y su rol.
 *
 * Se guardan en `localStorage`, en JSON, bajo una sola clave. De cada usuario se guarda el nombre,
 * el correo, el rol y el **resumen** de su contraseña (`resumirClave`), nunca la contraseña.
 * Cada función recibe el almacenamiento como parámetro (`localStorage` en la web, `AlmacenFalso` en
 * los tests). Las que necesitan el resumen reciben también la función que lo calcula, para que los
 * tests puedan sustituirla.
 *
 * @module datos/usuarios
 */
import { resumirClave } from '../clave.js';
import { ROLES } from './sesion.js';

/** Clave con la que se guarda la lista de usuarios. */
export const CLAVE_USUARIOS = 'huellas.usuarios';

/**
 * @typedef {object} Usuario
 * @property {string} usuario Nombre con el que entra.
 * @property {string} correo Correo electrónico.
 * @property {'administrador' | 'usuario'} rol Su rol.
 * @property {string} resumen Resumen SHA-256 de su contraseña, en hexadecimal.
 */

/**
 * Comprueba que un elemento leído tiene la forma de un usuario guardado.
 * @param {*} valor
 * @returns {boolean}
 */
function esUsuario(valor) {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof valor.usuario === 'string' &&
    valor.usuario.trim() !== '' &&
    typeof valor.correo === 'string' &&
    typeof valor.resumen === 'string' &&
    /^[0-9a-f]{64}$/.test(valor.resumen) &&
    Object.values(ROLES).includes(valor.rol)
  );
}

/**
 * Dos nombres son el mismo usuario aunque cambien las mayúsculas: «Lola» y «lola» no pueden convivir.
 * @param {string} nombre
 * @returns {string}
 */
function normalizarNombre(nombre) {
  return nombre.trim().toLocaleLowerCase('es');
}

/**
 * Lee la lista de usuarios. Si no hay ninguna o lo guardado no es una lista, devuelve `[]`; si la
 * lista tiene elementos estropeados, los descarta y devuelve los que están bien.
 * @param {Storage} almacen `localStorage` o un `AlmacenFalso`.
 * @returns {Usuario[]}
 */
export function leerUsuarios(almacen) {
  try {
    const lista = JSON.parse(almacen.getItem(CLAVE_USUARIOS));
    return Array.isArray(lista) ? lista.filter(esUsuario) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda la lista completa de usuarios.
 * @param {Storage} almacen
 * @param {Usuario[]} usuarios
 */
function guardarUsuarios(almacen, usuarios) {
  almacen.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
}

/**
 * Busca un usuario por su nombre, sin distinguir mayúsculas.
 * @param {Storage} almacen
 * @param {string} nombre
 * @returns {Usuario | undefined}
 */
function buscarUsuario(almacen, nombre) {
  const buscado = normalizarNombre(nombre);
  return leerUsuarios(almacen).find((usuario) => normalizarNombre(usuario.usuario) === buscado);
}

/**
 * Dice si un nombre de usuario ya está ocupado, sin distinguir mayúsculas.
 * @param {Storage} almacen
 * @param {string} nombre
 * @returns {boolean}
 * @example
 * existeUsuario(localStorage, 'Lola'); // true si ya existe «lola»
 */
export function existeUsuario(almacen, nombre) {
  return buscarUsuario(almacen, nombre) !== undefined;
}

/**
 * Da de alta un usuario. El primero que se registra es administrador; los demás, usuarios.
 * Es asíncrona porque el resumen de la contraseña se calcula con una promesa.
 * @param {Storage} almacen
 * @param {{ usuario: string, correo: string, clave: string }} datos Lo escrito en el registro.
 * @param {function(string): Promise<string>} [resumir] Calcula el resumen; por defecto, `resumirClave`.
 * @returns {Promise<{ usuario: string, rol: string } | null>} El usuario y su rol para iniciar la
 *   sesión, o `null` si el nombre ya estaba ocupado.
 * @example
 * const nuevo = await registrarUsuario(localStorage, { usuario: 'lola', correo: 'lola@ejemplo.org', clave: 'Huellas123' });
 */
export async function registrarUsuario(
  almacen,
  { usuario, correo, clave },
  resumir = resumirClave,
) {
  if (existeUsuario(almacen, usuario)) {
    return null;
  }
  const usuarios = leerUsuarios(almacen);
  const rol = usuarios.length === 0 ? ROLES.administrador : ROLES.usuario;
  const resumen = await resumir(clave);
  const nuevo = { usuario: usuario.trim(), correo: correo.trim(), rol, resumen };
  guardarUsuarios(almacen, [...usuarios, nuevo]);
  return { usuario: nuevo.usuario, rol };
}

/**
 * Comprueba el usuario y la contraseña al iniciar sesión, comparando resúmenes.
 * @param {Storage} almacen
 * @param {string} nombre
 * @param {string} clave La contraseña escrita.
 * @param {function(string): Promise<string>} [resumir] Calcula el resumen; por defecto, `resumirClave`.
 * @returns {Promise<{ usuario: string, rol: string } | null>} El usuario y su rol, o `null` si el
 *   usuario no existe o la contraseña no coincide.
 */
export async function comprobarCredenciales(almacen, nombre, clave, resumir = resumirClave) {
  const encontrado = buscarUsuario(almacen, nombre);
  if (!encontrado) {
    return null;
  }
  const resumen = await resumir(clave);
  return resumen === encontrado.resumen
    ? { usuario: encontrado.usuario, rol: encontrado.rol }
    : null;
}
