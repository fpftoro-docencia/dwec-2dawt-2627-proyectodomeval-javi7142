/**
 * Fila de un usuario en la zona de administración: una «chapa de collar» creada desde la plantilla
 * `#plantilla-usuario` de `usuarios.html`, con la inicial, el nombre, el correo y el rol.
 *
 * Solo escribe texto con `textContent` y pone atributos (`data-rol`, `data-usuario`, `hidden`,
 * `disabled` y `aria-describedby`): el color de la chapa lo decide el CSS a partir de `data-rol`.
 * El botón no tiene oyente propio: lo atiende la página con uno solo en la lista (delegación).
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

/** El `id` de la nota que explica por qué no puedes cambiar tu propio rol (solo hay una). */
const ID_NOTA_PROPIA = 'nota-rol-propio';

/**
 * Crea la chapa de un usuario a partir de la plantilla, con su botón para dar o quitar el rol de
 * administrador. Si es quien tiene la sesión iniciada, su nombre lleva «(tú)» detrás y su botón
 * está desactivado, con una nota que explica por qué.
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

  const boton = fila.querySelector('[data-accion="cambiar-rol"]');
  boton.textContent =
    usuario.rol === ROLES.administrador
      ? 'Quitar rol de administrador'
      : 'Dar rol de administrador';
  // Nadie puede cambiar su propio rol: el botón se desactiva y la nota explica por qué
  boton.disabled = esLaSesion;
  const nota = fila.querySelector('.voluntario__nota');
  nota.hidden = !esLaSesion;
  if (esLaSesion) {
    nota.id = ID_NOTA_PROPIA;
    nota.textContent = 'No puedes quitarte tu propio rol: siempre debe quedar un administrador.';
    // Los lectores de pantalla leen la nota al llegar al botón desactivado
    boton.setAttribute('aria-describedby', ID_NOTA_PROPIA);
  }
  return fila;
}
