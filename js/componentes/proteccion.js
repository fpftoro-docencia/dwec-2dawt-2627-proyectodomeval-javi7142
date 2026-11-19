/**
 * Protección de las páginas privadas y «Cerrar sesión».
 *
 * Las redirecciones usan la función `navegar` que recibe cada página (en la web,
 * `location.replace`): así la página protegida no se queda en el historial y el botón «Atrás» no
 * vuelve a ella.
 *
 * @module componentes/proteccion
 */
import { dejarAviso } from './avisos.js';
import { borrarSesion, ROLES } from '../datos/sesion.js';

/**
 * Decide si se puede seguir en una página privada. Sin sesión, lleva a `index.html`. Si la página
 * es solo para administradores y el usuario no lo es, deja un aviso de error y lleva al listado.
 * @param {?module:datos/sesion~Sesion} sesion La sesión leída con `leerSesion`, o `null`.
 * @param {object} opciones
 * @param {Storage} opciones.almacenSesion Donde se deja el aviso (`sessionStorage`).
 * @param {function(string): void} opciones.navegar Cómo ir a otra página sin dejar esta en el
 *   historial.
 * @param {boolean} [opciones.soloAdministradores] Si la página es solo para administradores.
 * @returns {boolean} `true` si se puede seguir en la página.
 * @example
 * if (protegerPagina(leerSesion(sessionStorage), { almacenSesion: sessionStorage, navegar })) {
 *   // iniciar la página
 * }
 */
export function protegerPagina(sesion, { almacenSesion, navegar, soloAdministradores = false }) {
  if (!sesion) {
    navegar('index.html');
    return false;
  }
  if (soloAdministradores && sesion.rol !== ROLES.administrador) {
    dejarAviso(almacenSesion, 'Solo los administradores pueden entrar en «Usuarios».', 'danger');
    navegar('listado.html');
    return false;
  }
  return true;
}

/**
 * Conecta el botón «Cerrar sesión»: borra la sesión, deja un aviso y vuelve a `index.html`.
 * @param {HTMLButtonElement} boton El botón `#cerrar-sesion` de la cabecera.
 * @param {object} opciones
 * @param {Storage} opciones.almacenSesion Donde está la sesión (`sessionStorage`).
 * @param {function(string): void} opciones.navegar Cómo ir a otra página.
 * @listens click
 */
export function iniciarCierreSesion(boton, { almacenSesion, navegar }) {
  boton.addEventListener('click', () => {
    borrarSesion(almacenSesion);
    dejarAviso(almacenSesion, 'Has cerrado la sesión. ¡Hasta pronto!', 'info');
    navegar('index.html');
  });
}
