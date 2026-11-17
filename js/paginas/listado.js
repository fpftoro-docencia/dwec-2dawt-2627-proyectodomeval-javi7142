/**
 * Página del listado de animales (`listado.html`).
 *
 * Necesita del HTML: la lista `#lista-animales`, la plantilla `#plantilla-animal`, el contenedor
 * `#paginacion`, la portada (`#saludo`, `#resumen`, `#pendiente` y `#pendiente-texto`) y la
 * cabecera común. Además inicia los avisos, la cabecera y «Cerrar sesión».
 *
 * @module paginas/listado
 */
import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarControles, pintarControles } from '../componentes/controles-paginacion.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { crearTarjeta } from '../componentes/tarjeta-animal.js';
import { leerAnimales } from '../datos/animales.js';
import { leerSesion } from '../datos/sesion.js';
import { paginar } from '../logica/paginacion.js';
import {
  animalesActivos,
  nombresSinVacunas,
  textoPendiente,
  textoResumen,
} from '../logica/resumen.js';

/** Cuántos animales se ven en cada página del listado. */
const POR_PAGINA = 6;

/**
 * Inicia el listado. Sin sesión, la página protegida lleva a `index.html`. Con sesión, pinta los
 * animales del usuario de seis en seis: una tarjeta por animal, creada desde la plantilla, y
 * debajo los controles de paginación. Al pulsar un control, se pinta esa página. La página actual
 * solo vive en memoria. Cada vez que se pinta, también se actualiza la portada (saludo,
 * resumen y aviso de animales sin vacunas), así que cualquier cambio en los animales se ve sin
 * recargar.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {Storage} dependencias.almacenAnimales Donde están los animales (`localStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @listens click
 */
export function iniciarListado(documento, { almacenSesion, almacenAnimales, navegar }) {
  const sesion = leerSesion(almacenSesion);
  if (!protegerPagina(sesion, { almacenSesion, navegar })) {
    return;
  }
  // Puede quedarse: con esta marca el CSS deja ver la página, que hasta ahora estaba oculta
  documento.body.dataset.sesionComprobada = '';
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento.querySelector('.cabecera'), sesion);
  iniciarCierreSesion(documento.querySelector('#cerrar-sesion'), { almacenSesion, navegar });

  const lista = documento.querySelector('#lista-animales');
  const plantilla = documento.querySelector('#plantilla-animal');
  const controles = documento.querySelector('#paginacion');
  let paginaActual = 1;

  /**
   * Rellena la portada: el saludo, cuántos animales cuida el usuario y los nombres de los que no
   * tienen vacunas (el aviso se oculta si no hay ninguno).
   * @param {Array<module:datos/animales~Animal>} animales Todos los animales del usuario.
   */
  function pintarResumen(animales) {
    const sinVacunas = nombresSinVacunas(animales);
    documento.querySelector('#saludo').textContent = `Hola, ${sesion.usuario}`;
    documento.querySelector('#resumen').textContent = textoResumen(
      animalesActivos(animales).length,
    );
    documento.querySelector('#pendiente').hidden = sinVacunas.length === 0;
    documento.querySelector('#pendiente-texto').textContent =
      sinVacunas.length === 0 ? '' : textoPendiente(sinVacunas);
  }

  /** Pinta la página actual: todas las tarjetas a la vez, los controles y la portada. */
  function pintar() {
    const animales = leerAnimales(almacenAnimales, sesion.usuario);
    const { elementos, pagina, totalPaginas } = paginar(animales, paginaActual, POR_PAGINA);
    paginaActual = pagina;
    lista.replaceChildren(...elementos.map((animal) => crearTarjeta(plantilla, animal)));
    pintarControles(controles, pagina, totalPaginas);
    pintarResumen(animales);
  }

  iniciarControles(controles, (pagina) => {
    paginaActual = pagina;
    pintar();
  });
  pintar();
}

iniciarListado(document, {
  almacenSesion: sessionStorage,
  almacenAnimales: localStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
