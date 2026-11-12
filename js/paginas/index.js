/**
 * Página de inicio de sesión (`index.html`).
 *
 * Necesita del HTML: `#formulario-acceso` con los campos `usuario` y `clave` y su botón de envío.
 * Además inicia los avisos, la portada y el ojo de la contraseña.
 *
 * @module paginas/index
 */
import { dejarAviso, iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarEscena } from '../componentes/escena.js';
import { iniciarPisadas } from '../componentes/pisadas.js';
import { iniciarVerClave } from '../componentes/ver-clave.js';
import { guardarSesion, leerSesion } from '../datos/sesion.js';
import { comprobarCredenciales } from '../datos/usuarios.js';

/**
 * Pone o quita el estado de envío: el formulario queda `aria-busy` y su botón, desactivado.
 * @param {HTMLFormElement} formulario
 * @param {boolean} enviando
 */
function marcarEnvio(formulario, enviando) {
  formulario.setAttribute('aria-busy', String(enviando));
  formulario.querySelector('[type="submit"]').disabled = enviando;
}

/**
 * Inicia el acceso. Si ya hay sesión, va directamente al listado. Si no, al enviar comprueba el
 * usuario y la contraseña: si son correctos, inicia la sesión, deja un aviso y va al listado; si no,
 * avisa, vacía la contraseña y le da el foco. Mientras se calcula el resumen, otro envío (un clic
 * o Intro) no hace nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenUsuarios Donde están los usuarios (`localStorage`).
 * @param {Storage} dependencias.almacenSesion Donde va la sesión y el aviso (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {function(string): Promise<string>} [dependencias.resumir] Calcula el resumen de la
 *   contraseña; por defecto, `resumirClave`.
 * @listens submit
 * @fires aviso
 */
export function iniciarAcceso(documento, { almacenUsuarios, almacenSesion, navegar, resumir }) {
  if (leerSesion(almacenSesion)) {
    navegar('listado.html');
    return;
  }

  const formulario = documento.querySelector('#formulario-acceso');
  const { usuario, clave } = formulario.elements;
  let enviando = false;

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) {
      return;
    }
    if (!formulario.checkValidity()) {
      lanzarAviso(formulario, 'Escribe tu usuario y tu contraseña.', 'danger');
      return;
    }

    enviando = true;
    marcarEnvio(formulario, true);
    const sesion = await comprobarCredenciales(
      almacenUsuarios,
      usuario.value,
      clave.value,
      resumir,
    );
    if (!sesion) {
      enviando = false;
      marcarEnvio(formulario, false);
      clave.value = '';
      clave.focus();
      lanzarAviso(formulario, 'El usuario o la contraseña no son correctos.', 'danger');
      return;
    }

    guardarSesion(almacenSesion, sesion);
    dejarAviso(almacenSesion, `Hola de nuevo, ${sesion.usuario}. Te estaban esperando.`);
    navegar('listado.html');
  });
}

iniciarAvisos(document, sessionStorage);
iniciarAcceso(document, {
  almacenUsuarios: localStorage,
  almacenSesion: sessionStorage,
  // `replace`: la página de acceso no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
iniciarEscena(document.querySelector('#escena'));
iniciarPisadas(document.querySelector('#pisadas'));
iniciarVerClave(document.querySelector('#formulario-acceso'));
