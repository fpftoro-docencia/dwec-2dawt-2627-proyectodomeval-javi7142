/**
 * Página de registro (`registro.html`).
 *
 * Necesita del HTML: `#formulario-registro` con los campos `usuario` y `clave`, la caja de error
 * `#error-usuario` y la lista `#requisitos-clave` con un `li[data-requisito]` por requisito
 * (`longitud`, `minuscula`, `mayuscula` y `cifra`). Además inicia los avisos y la portada.
 *
 * @module paginas/registro
 */
import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarEscena } from '../componentes/escena.js';
import { iniciarPisadas } from '../componentes/pisadas.js';
import { existeUsuario } from '../datos/usuarios.js';
import { requisitosClave } from '../logica/validadores.js';

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
  const mensaje = existeUsuario(almacen, campo.value)
    ? 'Ese usuario ya existe. Elige otro nombre.'
    : '';
  campo.setCustomValidity(mensaje);
  campo.classList.toggle('is-invalid', mensaje !== '');
  campo.setAttribute('aria-invalid', String(mensaje !== ''));
  caja.textContent = mensaje;
}

/**
 * Inicia el formulario de registro: requisitos de la contraseña en vivo y aviso de nombre ocupado.
 * El nombre se comprueba al salir del campo y, si tenía el error, también mientras se corrige.
 * @param {Document} documento
 * @param {{ almacenUsuarios: Storage }} dependencias
 * @listens input
 * @listens blur
 */
export function iniciarRegistro(documento, { almacenUsuarios }) {
  const formulario = documento.querySelector('#formulario-registro');
  const usuario = formulario.elements.usuario;
  const cajaUsuario = documento.querySelector('#error-usuario');
  const requisitos = documento.querySelector('#requisitos-clave');

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
}

iniciarAvisos(document, sessionStorage);
iniciarEscena(document.querySelector('#escena'));
iniciarPisadas(document.querySelector('#pisadas'));
iniciarRegistro(document, { almacenUsuarios: localStorage });
