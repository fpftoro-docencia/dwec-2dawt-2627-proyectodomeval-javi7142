/**
 * Página de registro (`registro.html`).
 *
 * Necesita del HTML: `#formulario-registro` con los campos `usuario`, `correo`, `clave`,
 * `repetirClave` y `aceptacion`, su botón de envío, una caja de error `.invalid-feedback` por
 * campo y la lista `#requisitos-clave` con un `li[data-requisito]` por requisito (`longitud`,
 * `minuscula`, `mayuscula` y `cifra`). Además inicia los avisos, la portada y el ojo de la
 * contraseña.
 *
 * @module paginas/registro
 */
import { dejarAviso, iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarEscena } from '../componentes/escena.js';
import { iniciarPisadas } from '../componentes/pisadas.js';
import { iniciarValidacion } from '../componentes/validacion-formulario.js';
import { iniciarVerClave } from '../componentes/ver-clave.js';
import { guardarSesion } from '../datos/sesion.js';
import { existeUsuario, registrarUsuario } from '../datos/usuarios.js';
import { requisitosClave } from '../logica/validadores.js';

const NOMBRE_OCUPADO = 'Ese usuario ya existe. Elige otro nombre.';

/** El error de la repetición cuando no es igual que la contraseña. */
const CLAVES_DISTINTAS = 'Las contraseñas no coinciden.';

/**
 * Los textos del registro para lo que ve el navegador, por el `name` de cada campo: si falta un
 * campo obligatorio, qué hay que escribir, y el de la casilla de la tabla del README. Los errores
 * de formato los dan los validadores.
 * @type {Object<string, module:componentes/validacion-formulario~MensajesCampo>}
 */
const MENSAJES_REGISTRO = {
  usuario: { valueMissing: 'Escribe un nombre de usuario.' },
  correo: { valueMissing: 'Escribe tu correo, como nombre@ejemplo.org.' },
  clave: { valueMissing: 'Escribe una contraseña.' },
  repetirClave: { valueMissing: 'Repite la contraseña.' },
  aceptacion: { valueMissing: 'Debes aceptar las condiciones.' },
};

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
 * Las reglas del registro que el formato no basta para decidir, para `iniciarValidacion`: el
 * nombre no puede estar ya registrado y la repetición tiene que ser igual que la contraseña (por
 * eso, al cambiar la contraseña, el componente vuelve a mirar la repetición).
 * @param {Storage} almacen Donde están los usuarios (`localStorage`).
 * @returns {Object<string, module:componentes/validacion-formulario~ReglaExtra>}
 */
function reglasRegistro(almacen) {
  return {
    usuario: (valor) => (existeUsuario(almacen, valor) ? NOMBRE_OCUPADO : ''),
    'repetir-clave': (valor, campo, formulario) =>
      valor === formulario.elements.clave.value ? '' : CLAVES_DISTINTAS,
  };
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
 * Inicia el formulario de registro: requisitos de la contraseña en vivo, validación en tiempo real
 * con `iniciarValidacion` (formato de cada campo, nombre ya registrado y repetición de la
 * contraseña) y alta. Al registrarse guarda el usuario, inicia la sesión, deja un aviso para el
 * listado y va a él. Mientras se calcula el resumen de la contraseña, otro envío (un clic o Intro)
 * no hace nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenUsuarios Donde se guardan los usuarios (`localStorage`).
 * @param {Storage} dependencias.almacenSesion Donde va la sesión y el aviso (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {function(string): Promise<string>} [dependencias.resumir] Calcula el resumen de la
 *   contraseña; por defecto, `resumirClave`.
 * @listens input
 * @fires aviso
 */
export function iniciarRegistro(documento, { almacenUsuarios, almacenSesion, navegar, resumir }) {
  const formulario = documento.querySelector('#formulario-registro');
  const { usuario, correo, clave } = formulario.elements;
  const requisitos = documento.querySelector('#requisitos-clave');
  let enviando = false;

  clave.addEventListener('input', () => marcarRequisitos(requisitos, clave.value));

  const validacion = iniciarValidacion(formulario, {
    reglasExtra: reglasRegistro(almacenUsuarios),
    mensajes: MENSAJES_REGISTRO,
    alEnviar: registrar,
  });

  /** Da de alta al usuario, inicia su sesión y va al listado. */
  async function registrar() {
    if (enviando) {
      return;
    }
    enviando = true;
    marcarEnvio(formulario, true);
    const nuevo = await registrarUsuario(
      almacenUsuarios,
      { usuario: usuario.value, correo: correo.value, clave: clave.value },
      resumir,
    );
    if (!nuevo) {
      // Alguien ha usado ese nombre mientras tanto (por ejemplo, en otra pestaña)
      enviando = false;
      marcarEnvio(formulario, false);
      validacion.validarCampo(usuario);
      usuario.focus();
      lanzarAviso(formulario, NOMBRE_OCUPADO, 'danger');
      return;
    }

    guardarSesion(almacenSesion, nuevo);
    dejarAviso(
      almacenSesion,
      `Te has registrado, ${nuevo.usuario}. Ya puedes dar de alta a tus animales.`,
    );
    navegar('listado.html');
  }
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
