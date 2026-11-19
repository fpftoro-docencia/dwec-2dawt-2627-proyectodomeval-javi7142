/**
 * Cabecera común de las páginas privadas: muestra quién tiene la sesión iniciada y enseña el enlace
 * «Usuarios» solo a los administradores.
 *
 * El HTML ya trae los huecos (`[data-usuario-actual]`, `[data-rol-actual]`,
 * `[data-usuario-inicial]`) y el enlace `[data-solo-admin]` oculto con `hidden`: este módulo solo
 * escribe texto con `textContent` y quita o pone `hidden`, nunca estilos.
 *
 * @module componentes/cabecera
 */
import { ROLES } from '../datos/sesion.js';

/**
 * Rellena la cabecera con la sesión. Sin sesión deja los huecos vacíos y «Usuarios» oculto.
 * @param {HTMLElement} cabecera El `<header class="cabecera">` de la página.
 * @param {?module:datos/sesion~Sesion} sesion La sesión leída con `leerSesion`, o `null`.
 * @example
 * iniciarCabecera(document.querySelector('.cabecera'), leerSesion(sessionStorage));
 */
export function iniciarCabecera(cabecera, sesion) {
  const usuario = sesion?.usuario ?? '';
  const esAdministrador = sesion?.rol === ROLES.administrador;

  cabecera.querySelector('[data-usuario-actual]').textContent = usuario;
  cabecera.querySelector('[data-rol-actual]').textContent = sesion?.rol ?? '';
  cabecera.querySelector('[data-usuario-inicial]').textContent = usuario
    .charAt(0)
    .toLocaleUpperCase('es');
  cabecera.querySelectorAll('[data-solo-admin]').forEach((elemento) => {
    elemento.hidden = !esAdministrador;
  });
}
