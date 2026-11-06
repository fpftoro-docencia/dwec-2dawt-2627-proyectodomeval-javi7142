/**
 * Sesión: quién tiene la sesión iniciada en esta pestaña y con qué rol.
 *
 * Cada función recibe el almacenamiento como parámetro: en la aplicación es `sessionStorage` y en
 * los tests, un `AlmacenFalso`. La sesión vive en `sessionStorage` porque debe acabar al cerrar la
 * pestaña. Es una simulación: quien abra las DevTools puede cambiarla, así que no es segura.
 *
 * @module datos/sesion
 */

/** Clave con la que se guarda la sesión. */
export const CLAVE_SESION = 'huellas.sesion';

/** Los dos roles de la aplicación. */
export const ROLES = Object.freeze({ administrador: 'administrador', usuario: 'usuario' });

/**
 * @typedef {object} Sesion
 * @property {string} usuario Nombre del usuario con la sesión iniciada.
 * @property {'administrador' | 'usuario'} rol Su rol.
 */

/**
 * Comprueba que lo leído tiene la forma de una sesión: un objeto con un usuario y un rol conocido.
 * @param {unknown} valor
 * @returns {valor is Sesion}
 */
function esSesion(valor) {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof valor.usuario === 'string' &&
    valor.usuario.trim() !== '' &&
    Object.values(ROLES).includes(valor.rol)
  );
}

/**
 * Guarda la sesión. Solo guarda el usuario y el rol: nunca la contraseña.
 * @param {Storage} almacen `sessionStorage` o un `AlmacenFalso`.
 * @param {Sesion} sesion
 * @example
 * guardarSesion(sessionStorage, { usuario: 'ana', rol: 'administrador' });
 */
export function guardarSesion(almacen, { usuario, rol }) {
  almacen.setItem(CLAVE_SESION, JSON.stringify({ usuario, rol }));
}

/**
 * Lee la sesión. Si no hay ninguna, o lo guardado está estropeado (no es JSON, no es un objeto o
 * le falta el usuario o el rol), devuelve `null` en lugar de fallar.
 * @param {Storage} almacen
 * @returns {Sesion | null}
 * @example
 * leerSesion(sessionStorage); // { usuario: 'ana', rol: 'administrador' } o null
 */
export function leerSesion(almacen) {
  try {
    const sesion = JSON.parse(almacen.getItem(CLAVE_SESION));
    return esSesion(sesion) ? { usuario: sesion.usuario, rol: sesion.rol } : null;
  } catch {
    return null;
  }
}

/**
 * Borra la sesión (cerrar sesión).
 * @param {Storage} almacen
 */
export function borrarSesion(almacen) {
  almacen.removeItem(CLAVE_SESION);
}
