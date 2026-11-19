/**
 * Fila de un usuario en la zona de administración: una «chapa de collar» creada desde la plantilla
 * `#plantilla-usuario` de `usuarios.html`, con la inicial, el nombre, el correo y el rol.
 *
 * Solo escribe texto con `textContent` y pone atributos (`data-rol`, `data-usuario`, `hidden`): el
 * color de la chapa lo decide el CSS a partir de `data-rol`.
 *
 * @module componentes/fila-usuario
 */
import { ROLES } from '../datos/sesion.js';

/**
 * Cómo se lee cada rol en la chapa.
 * @type {Readonly<Record<string, string>>}
 */
export const NOMBRES_ROL = Object.freeze({
  [ROLES.administrador]: 'Administrador',
  [ROLES.usuario]: 'Usuario',
});

/**
 * Crea la chapa de un usuario a partir de la plantilla. Si es quien tiene la sesión iniciada, su
 * nombre lleva «(tú)» detrás.
 * @param {HTMLTemplateElement} plantilla La plantilla `#plantilla-usuario`.
 * @param {module:datos/usuarios~Usuario} usuario El usuario que se pinta.
 * @param {boolean} esLaSesion `true` si es el usuario que tiene la sesión iniciada.
 * @returns {HTMLLIElement} El `li.voluntario` relleno, con `data-rol` y `data-usuario`.
 * @example
 * const fila = crearFilaUsuario(plantilla, { usuario: 'ana', correo: 'ana@ejemplo.org', rol: 'usuario' }, false);
 */
export function crearFilaUsuario(plantilla, usuario, esLaSesion) {
  const fila = plantilla.content.firstElementChild.cloneNode(true);
  fila.dataset.rol = usuario.rol;
  fila.dataset.usuario = usuario.usuario;
  fila.querySelector('.voluntario__avatar').textContent = usuario.usuario
    .charAt(0)
    .toLocaleUpperCase('es');
  fila.querySelector('.voluntario__usuario').textContent = esLaSesion
    ? `${usuario.usuario} (tú)`
    : usuario.usuario;
  fila.querySelector('.voluntario__correo').textContent = usuario.correo;
  fila.querySelector('.voluntario__rol').textContent = NOMBRES_ROL[usuario.rol];
  // Cambiar el rol todavía no funciona: el botón se oculta para no ofrecer algo que no hace nada
  fila.querySelector('[data-accion="cambiar-rol"]').hidden = true;
  return fila;
}
