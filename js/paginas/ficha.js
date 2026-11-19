/**
 * Página de la ficha de un animal (`ficha.html`).
 *
 * Necesita del HTML: el formulario `#formulario-animal` con sus campos y su botón de envío, la
 * galería de fotos (`#bloque-foto`, `#galeria-fotos`, `#plantilla-foto` y `#ayuda-foto`), los
 * bloques condicionales `#bloque-esterilizacion` y `#bloque-adopcion`, el grupo de vacunas
 * (`#grupo-vacunas`, `#anadir-vacuna`, `#contador-vacunas` y `#plantilla-vacuna`), la cartilla
 * `#cartilla` con sus datos, sus sellos y su barra de progreso, y la cabecera común. Además inicia
 * los avisos, la cabecera y «Cerrar sesión».
 *
 * @module paginas/ficha
 */
import { dejarAviso, iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarCamposCondicionales } from '../componentes/campos-condicionales.js';
import { iniciarCartilla } from '../componentes/cartilla.js';
import { iniciarGaleriaFotos } from '../componentes/galeria-fotos.js';
import { iniciarGrupoVacunas } from '../componentes/grupo-vacunas.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { crearAnimal } from '../datos/animales.js';
import { leerSesion } from '../datos/sesion.js';
import { fechaDeHoy } from '../logica/fechas.js';
import { normalizarAnimal } from '../logica/normalizar-animal.js';
import { validadores } from '../logica/validadores.js';

/** El aviso que sale al intentar guardar una ficha con campos vacíos o con errores. */
export const AVISO_REVISAR_FICHA = 'Revisa la ficha: hay campos vacíos o con errores.';

/**
 * Antes de guardar, pone en cada campo con `data-validar` el mensaje de su validador
 * (`setCustomValidity`) y pregunta al navegador si todo el formulario es válido: también cuentan
 * `required`, `min`, `max`, `step` y `pattern`. Los campos desactivados (los condicionales que no
 * tocan) no cuentan. La validación campo a campo, con sus mensajes a la vista, llega en S2-18.
 * @param {HTMLFormElement} formulario
 * @returns {boolean}
 */
function datosValidos(formulario) {
  formulario.querySelectorAll('[data-validar]').forEach((campo) => {
    campo.setCustomValidity(validadores[campo.dataset.validar]?.(campo.value) ?? '');
  });
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
 * Inicia la ficha. Sin sesión, la página protegida lleva a `index.html`. Con sesión, conecta la
 * galería de fotos con la lista de especies y los campos condicionales con la casilla de
 * esterilización y el estado, pone en marcha el grupo de vacunas, hace que la cartilla se rellene
 * sola y pone a las fechas el `max` de hoy (no pueden ser futuras).
 *
 * Al enviar, si todo es válido, lee el formulario con `FormData`, lo normaliza con
 * `normalizarAnimal`, da de alta el animal en la lista del usuario, deja un aviso y vuelve al
 * listado. Mientras se guarda, otro envío (un doble clic o Intro) no hace nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {Storage} dependencias.almacenAnimales Donde están los animales (`localStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {string} [dependencias.hoy] La fecha de hoy (`AAAA-MM-DD`); por defecto, la del equipo.
 * @listens submit
 * @fires aviso
 */
export function iniciarFicha(
  documento,
  { almacenSesion, almacenAnimales, navegar, hoy = fechaDeHoy() },
) {
  const sesion = leerSesion(almacenSesion);
  if (!protegerPagina(sesion, { almacenSesion, navegar })) {
    return;
  }
  // Puede quedarse: con esta marca el CSS deja ver la página, que hasta ahora estaba oculta
  documento.body.dataset.sesionComprobada = '';
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento.querySelector('.cabecera'), sesion);
  iniciarCierreSesion(documento.querySelector('#cerrar-sesion'), { almacenSesion, navegar });

  const formulario = documento.querySelector('#formulario-animal');
  const buscar = (selector) => documento.querySelector(selector);
  let enviando = false;

  formulario.elements.ingreso.max = hoy;
  formulario.elements.fechaEsterilizacion.max = hoy;

  iniciarGaleriaFotos({
    especie: buscar('#especie'),
    bloque: buscar('#bloque-foto'),
    galeria: buscar('#galeria-fotos'),
    plantilla: buscar('#plantilla-foto'),
    ayuda: buscar('#ayuda-foto'),
  });
  iniciarCamposCondicionales(formulario, {
    esterilizacion: buscar('#bloque-esterilizacion'),
    adopcion: buscar('#bloque-adopcion'),
  });
  iniciarGrupoVacunas(
    {
      grupo: buscar('#grupo-vacunas'),
      boton: buscar('#anadir-vacuna'),
      contador: buscar('#contador-vacunas'),
      plantilla: buscar('#plantilla-vacuna'),
    },
    { hoy },
  );
  // La última: así se rellena por primera vez con la galería y las vacunas ya puestas
  iniciarCartilla(formulario, {
    cartilla: buscar('#cartilla'),
    foto: buscar('#cartilla-foto'),
    silueta: buscar('#cartilla-silueta'),
    nombre: buscar('#cartilla-nombre'),
    especie: buscar('#cartilla-especie'),
    sexo: buscar('#cartilla-sexo'),
    ingreso: buscar('#cartilla-ingreso'),
    peso: buscar('#cartilla-peso'),
    microchip: buscar('#cartilla-microchip'),
    sellos: buscar('#cartilla-sellos'),
    progreso: buscar('#progreso-ficha'),
    textoProgreso: buscar('#progreso-texto'),
  });

  /** Guarda el animal de la ficha, deja el aviso para el listado y vuelve a él. */
  function guardar() {
    const animal = normalizarAnimal(new FormData(formulario));
    crearAnimal(almacenAnimales, sesion.usuario, animal);
    dejarAviso(almacenSesion, `Has guardado la ficha de ${animal.nombre}.`);
    navegar('listado.html');
  }

  formulario.addEventListener('submit', (evento) => {
    evento.preventDefault();
    if (enviando) {
      return;
    }
    if (!datosValidos(formulario)) {
      lanzarAviso(formulario, AVISO_REVISAR_FICHA, 'danger');
      return;
    }
    enviando = true;
    marcarEnvio(formulario, true);
    guardar();
  });
}

iniciarFicha(document, {
  almacenSesion: sessionStorage,
  almacenAnimales: localStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
