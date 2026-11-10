/**
 * Página de registro (`registro.html`).
 *
 * Necesita del HTML: `#formulario-registro` con los campos `usuario`, `correo`, `clave`,
 * `repetirClave` y `aceptacion`, su botón de envío, la caja de error `#error-usuario` y la lista
 * `#requisitos-clave` con un `li[data-requisito]` por requisito (`longitud`, `minuscula`,
 * `mayuscula` y `cifra`). Además inicia los avisos, la portada y el ojo de la contraseña.
 *
 * @module paginas/registro
 */
import { dejarAviso, iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarEscena } from '../componentes/escena.js';
import { iniciarPisadas } from '../componentes/pisadas.js';
import { iniciarVerClave } from '../componentes/ver-clave.js';
import { guardarSesion } from '../datos/sesion.js';
import { existeUsuario, registrarUsuario } from '../datos/usuarios.js';
import { requisitosClave, validadores } from '../logica/validadores.js';

const NOMBRE_OCUPADO = 'Ese usuario ya existe. Elige otro nombre.';

/**
 * Marca con `data-cumple` los requisitos que cumple la contraseña. El CSS pone la huella en los que
 * se cumplen y enciende un dedo de la huella del formulario por cada uno.
 * @param {HTMLElement} lista La lista `#requisitos-clave`.
 * @param {string} clave
 */
function marcarRequisitos(lista, clave) {
  const cumplidos = requisitosClave(clave);
  lista.querySelectorAll('[data-requisito]').forEach((requisito) => {
    requisito.dataset.cumple = String(cumplidos[requisito.dataset.requisito]);
  });
}

/**
 * Da error si el nombre de usuario ya está ocupado: el mensaje va a `setCustomValidity`, a la caja
 * de error y a `aria-invalid`, y el campo se marca con `is-invalid`.
 * @param {HTMLInputElement} campo
 * @param {HTMLElement} caja La caja de error del campo.
 * @param {Storage} almacen Donde están los usuarios (`localStorage`).
 */
function comprobarNombreLibre(campo, caja, almacen) {
  const mensaje = existeUsuario(almacen, campo.value) ? NOMBRE_OCUPADO : '';
  campo.setCustomValidity(mensaje);
  campo.classList.toggle('is-invalid', mensaje !== '');
  campo.setAttribute('aria-invalid', String(mensaje !== ''));
  caja.textContent = mensaje;
}

/**
 * Antes de dar de alta, pone en cada campo el mensaje de sus reglas propias (`setCustomValidity`)
 * y pregunta al navegador si todo el formulario es válido: también cuenta `required`, `type` y la
 * casilla de aceptación. La validación campo a campo, con sus mensajes a la vista, llega en S2-18.
 * @param {HTMLFormElement} formulario
 * @param {Storage} almacen Donde están los usuarios.
 * @returns {boolean}
 */
function datosValidos(formulario, almacen) {
  const { usuario, correo, clave, repetirClave } = formulario.elements;
  const ocupado = existeUsuario(almacen, usuario.value) ? NOMBRE_OCUPADO : '';
  usuario.setCustomValidity(validadores.usuario(usuario.value) || ocupado);
  correo.setCustomValidity(validadores.correo(correo.value));
  clave.setCustomValidity(validadores.clave(clave.value));
  repetirClave.setCustomValidity(
    repetirClave.value === clave.value ? '' : 'Las contraseñas no coinciden.',
  );
  return formulario.checkValidity();
}

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
 * Inicia el formulario de registro: requisitos de la contraseña en vivo, aviso de nombre ocupado y
 * alta. Al registrarse guarda el usuario, inicia la sesión, deja un aviso para el listado y va a él.
 * Mientras se calcula el resumen de la contraseña, otro envío (un clic o Intro) no hace nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenUsuarios Donde se guardan los usuarios (`localStorage`).
 * @param {Storage} dependencias.almacenSesion Donde va la sesión y el aviso (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {function(string): Promise<string>} [dependencias.resumir] Calcula el resumen de la
 *   contraseña; por defecto, `resumirClave`.
 * @listens input
 * @listens blur
 * @listens submit
 * @fires aviso
 */
export function iniciarRegistro(documento, { almacenUsuarios, almacenSesion, navegar, resumir }) {
  const formulario = documento.querySelector('#formulario-registro');
  const usuario = formulario.elements.usuario;
  const cajaUsuario = documento.querySelector('#error-usuario');
  const requisitos = documento.querySelector('#requisitos-clave');
  let enviando = false;

  formulario.elements.clave.addEventListener('input', (evento) => {
    marcarRequisitos(requisitos, evento.target.value);
  });

  usuario.addEventListener('blur', () =>
    comprobarNombreLibre(usuario, cajaUsuario, almacenUsuarios),
  );
  usuario.addEventListener('input', () => {
    if (usuario.classList.contains('is-invalid')) {
      comprobarNombreLibre(usuario, cajaUsuario, almacenUsuarios);
    }
  });

  formulario.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (enviando) {
      return;
    }
    if (!datosValidos(formulario, almacenUsuarios)) {
      lanzarAviso(formulario, 'Revisa el formulario: hay campos vacíos o con errores.', 'danger');
      return;
    }

    enviando = true;
    marcarEnvio(formulario, true);
    const { correo, clave } = formulario.elements;
    const nuevo = await registrarUsuario(
      almacenUsuarios,
      { usuario: usuario.value, correo: correo.value, clave: clave.value },
      resumir,
    );
    if (!nuevo) {
      enviando = false;
      marcarEnvio(formulario, false);
      comprobarNombreLibre(usuario, cajaUsuario, almacenUsuarios);
      lanzarAviso(formulario, NOMBRE_OCUPADO, 'danger');
      return;
    }

    guardarSesion(almacenSesion, nuevo);
    dejarAviso(
      almacenSesion,
      `Te has registrado, ${nuevo.usuario}. Ya puedes dar de alta a tus animales.`,
    );
    navegar('listado.html');
  });
}

iniciarAvisos(document, sessionStorage);
iniciarEscena(document.querySelector('#escena'));
iniciarPisadas(document.querySelector('#pisadas'));
iniciarVerClave(document.querySelector('#formulario-registro'));
iniciarRegistro(document, {
  almacenUsuarios: localStorage,
  almacenSesion: sessionStorage,
  navegar: (pagina) => location.assign(pagina),
});
