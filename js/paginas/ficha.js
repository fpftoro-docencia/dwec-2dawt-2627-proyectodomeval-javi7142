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
import { iniciarGaleriaFotos, pintarGaleria } from '../componentes/galeria-fotos.js';
import { iniciarGrupoVacunas } from '../componentes/grupo-vacunas.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { rellenarFicha } from '../componentes/rellenar-ficha.js';
import { buscarAnimal, crearAnimal, editarAnimal } from '../datos/animales.js';
import { leerSesion } from '../datos/sesion.js';
import { fechaDeHoy } from '../logica/fechas.js';
import { normalizarAnimal } from '../logica/normalizar-animal.js';
import { validadores } from '../logica/validadores.js';

/** El aviso que sale al intentar guardar una ficha con campos vacíos o con errores. */
export const AVISO_REVISAR_FICHA = 'Revisa la ficha: hay campos vacíos o con errores.';

/** El aviso del listado cuando se pide editar un animal que no existe (o ya no existe). */
export const FICHA_NO_ENCONTRADA =
  'No hemos encontrado esa ficha. Puede que se haya borrado: elige un animal de tu lista.';

/** El texto de debajo del título cuando se edita un animal guardado. */
const SUBTITULO_EDICION = 'Cambia lo que necesites: la cartilla se actualiza sola.';

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
 * Con `ficha.html?id=…` edita: rellena el formulario con el animal guardado (también los campos
 * condicionales, la foto y las vacunas). Si ese `id` no es de ningún animal del usuario, vuelve al
 * listado con un aviso de error, sin llegar a enseñar la página.
 *
 * Al enviar, si todo es válido, lee el formulario con `FormData` y lo normaliza con
 * `normalizarAnimal`; después da de alta el animal o, si se está editando, sustituye sus datos
 * (conserva su `id`, así que no se duplica). Al acabar deja un aviso y vuelve al listado. Mientras
 * se guarda, otro envío (un doble clic o Intro) no hace nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {Storage} dependencias.almacenAnimales Donde están los animales (`localStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {string} [dependencias.busqueda] La parte de la dirección desde `?` (`location.search`),
 *   donde va el `id` del animal que se edita; vacía para dar de alta uno nuevo.
 * @param {string} [dependencias.hoy] La fecha de hoy (`AAAA-MM-DD`); por defecto, la del equipo.
 * @listens submit
 * @fires aviso
 */
export function iniciarFicha(
  documento,
  { almacenSesion, almacenAnimales, navegar, busqueda = '', hoy = fechaDeHoy() },
) {
  const sesion = leerSesion(almacenSesion);
  if (!protegerPagina(sesion, { almacenSesion, navegar })) {
    return;
  }
  const id = new URLSearchParams(busqueda).get('id');
  const editado = id === null ? null : buscarAnimal(almacenAnimales, sesion.usuario, id);
  if (id !== null && !editado) {
    dejarAviso(almacenSesion, FICHA_NO_ENCONTRADA, 'danger');
    navegar('listado.html');
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

  const galeria = {
    especie: buscar('#especie'),
    bloque: buscar('#bloque-foto'),
    galeria: buscar('#galeria-fotos'),
    plantilla: buscar('#plantilla-foto'),
    ayuda: buscar('#ayuda-foto'),
  };
  iniciarGaleriaFotos(galeria);
  const actualizarCondicionales = iniciarCamposCondicionales(formulario, {
    esterilizacion: buscar('#bloque-esterilizacion'),
    adopcion: buscar('#bloque-adopcion'),
  });
  const vacunas = iniciarGrupoVacunas(
    {
      grupo: buscar('#grupo-vacunas'),
      boton: buscar('#anadir-vacuna'),
      contador: buscar('#contador-vacunas'),
      plantilla: buscar('#plantilla-vacuna'),
    },
    { hoy },
  );
  // La última: así se rellena por primera vez con la galería y las vacunas ya puestas
  const actualizarCartilla = iniciarCartilla(formulario, {
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

  if (editado) {
    buscar('#titulo-ficha').textContent = editado.nombre;
    buscar('#subtitulo-ficha').textContent = SUBTITULO_EDICION;
    documento.title = `Cartilla de ${editado.nombre} | Huellas`;
    rellenarFicha(formulario, editado);
    pintarGaleria(galeria, editado.especie, editado.foto);
    editado.vacunas.forEach((vacuna) => vacunas.anadir(vacuna));
    // Cambiar los campos desde el código no lanza `change`: se vuelven a poner a mano
    actualizarCondicionales();
    actualizarCartilla();
  }

  /**
   * Guarda el animal de la ficha (lo da de alta o, si se está editando, cambia el que había),
   * deja el aviso para el listado y vuelve a él.
   */
  function guardar() {
    const animal = normalizarAnimal(new FormData(formulario));
    if (!editado) {
      crearAnimal(almacenAnimales, sesion.usuario, animal);
      dejarAviso(almacenSesion, `Has guardado la ficha de ${animal.nombre}.`);
    } else if (editarAnimal(almacenAnimales, sesion.usuario, editado.id, animal)) {
      dejarAviso(almacenSesion, `Has guardado los cambios de ${animal.nombre}.`);
    } else {
      // Se ha borrado mientras tanto (por ejemplo, en otra pestaña)
      dejarAviso(almacenSesion, FICHA_NO_ENCONTRADA, 'danger');
    }
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
  busqueda: location.search,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
