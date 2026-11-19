/**
 * Página de la zona de administración (`usuarios.html`), solo para administradores.
 *
 * Necesita del HTML: la lista `#lista-usuarios`, la plantilla `#plantilla-usuario`, el contenedor
 * `#paginacion`, el buscador (`#buscador`, `#contador`, `#sin-resultados` y `#limpiar-filtros`), la
 * portada (`#resumen`) y la cabecera común. Además inicia los avisos, la cabecera y «Cerrar sesión».
 *
 * No tiene código propio de búsqueda ni de paginación: usa los mismos módulos que el listado de
 * animales (`busqueda.js`, `paginacion.js`, `pagina-url.js`, `controles-paginacion.js` y
 * `atajo-busqueda.js`).
 *
 * @module paginas/usuarios
 */
import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarControles, pintarControles } from '../componentes/controles-paginacion.js';
import { iniciarAtajoBusqueda } from '../componentes/atajo-busqueda.js';
import { crearFilaUsuario } from '../componentes/fila-usuario.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { leerSesion } from '../datos/sesion.js';
import { leerUsuarios, normalizarNombre } from '../datos/usuarios.js';
import { debounce, filtrarPorTexto, textoContador } from '../logica/busqueda.js';
import { paginar } from '../logica/paginacion.js';
import { escribirPagina, leerPagina } from '../logica/pagina-url.js';
import { textoResumenUsuarios } from '../logica/resumen-usuarios.js';

/** Cuántos usuarios se ven en cada página. */
const POR_PAGINA = 6;

/** Los milisegundos sin teclear que se esperan antes de buscar (los mismos que en el listado). */
const ESPERA_BUSCADOR = 250;

/** Los campos de cada usuario en los que mira el buscador. */
const CAMPOS_BUSQUEDA = ['usuario', 'correo'];

/**
 * Inicia la zona de administración. Sin sesión lleva a `index.html`, y a quien no es administrador
 * lo devuelve al listado con un aviso. Con permiso, pinta a todos los usuarios de seis en seis como
 * chapas de collar (inicial, nombre, correo y rol; el propio, con «(tú)») y debajo los controles de
 * paginación. La portada dice cuántas personas hay y cuántas son administradoras.
 *
 * La página actual va en la dirección (`?pagina=2`), como en el listado: se lee al empezar y se
 * escribe, ya corregida, cada vez que se pinta, sin añadir pasos al historial.
 *
 * El buscador filtra por nombre y correo, sin importar mayúsculas ni tildes, cuando se deja de
 * teclear 250 ms (`debounce`), y vuelve a la página 1. El contador dice cuántas personas coinciden
 * en total y, si no hay ninguna, se enseña `#sin-resultados`. «Limpiar la búsqueda» vacía el
 * buscador y la tecla `/` lleva el foco a él.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {Storage} dependencias.almacenUsuarios Donde están los usuarios (`localStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {object} dependencias.direccion Cómo leer y cambiar la dirección de la página.
 * @param {function(): string} dependencias.direccion.leer Devuelve la consulta de la dirección
 *   (`location.search`).
 * @param {function(string): void} dependencias.direccion.guardar Cambia la consulta de la
 *   dirección sin recargar la página ni añadir un paso al historial (`history.replaceState`).
 * @listens click
 * @listens input
 */
export function iniciarUsuarios(documento, { almacenSesion, almacenUsuarios, navegar, direccion }) {
  const sesion = leerSesion(almacenSesion);
  if (!protegerPagina(sesion, { almacenSesion, navegar, soloAdministradores: true })) {
    return;
  }
  // Puede quedarse: con esta marca el CSS deja ver la página, que hasta ahora estaba oculta
  documento.body.dataset.sesionComprobada = '';
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento.querySelector('.cabecera'), sesion);
  iniciarCierreSesion(documento.querySelector('#cerrar-sesion'), { almacenSesion, navegar });

  const lista = documento.querySelector('#lista-usuarios');
  const plantilla = documento.querySelector('#plantilla-usuario');
  const controles = documento.querySelector('#paginacion');
  const buscador = documento.querySelector('#buscador');
  let textoBuscado = '';
  // Sin corregir: `paginar` la lleva a una página que exista la primera vez que se pinta
  let paginaActual = leerPagina(direccion.leer());

  /**
   * Dice si un usuario es el que tiene la sesión iniciada, sin distinguir mayúsculas.
   * @param {module:datos/usuarios~Usuario} usuario
   * @returns {boolean}
   */
  function esLaSesion(usuario) {
    return normalizarNombre(usuario.usuario) === normalizarNombre(sesion.usuario);
  }

  /**
   * Pinta la página actual de los usuarios que coinciden con la búsqueda: las chapas, los
   * controles, el contador, el mensaje de «no hay nadie» y la portada.
   */
  function pintar() {
    const usuarios = leerUsuarios(almacenUsuarios);
    const encontrados = filtrarPorTexto(usuarios, textoBuscado, CAMPOS_BUSQUEDA);
    const { elementos, pagina, totalPaginas } = paginar(encontrados, paginaActual, POR_PAGINA);
    paginaActual = pagina;
    direccion.guardar(escribirPagina(direccion.leer(), pagina));
    lista.replaceChildren(
      ...elementos.map((usuario) => crearFilaUsuario(plantilla, usuario, esLaSesion(usuario))),
    );
    pintarControles(controles, pagina, totalPaginas);
    documento.querySelector('#contador').textContent = textoContador(
      encontrados.length,
      'persona',
      'personas',
    );
    documento.querySelector('#sin-resultados').hidden = encontrados.length > 0;
    documento.querySelector('#resumen').textContent = textoResumenUsuarios(usuarios);
  }

  // Se busca al dejar de teclear, no con cada tecla; al buscar se vuelve a la página 1
  buscador.addEventListener(
    'input',
    debounce(() => {
      textoBuscado = buscador.value;
      paginaActual = 1;
      pintar();
    }, ESPERA_BUSCADOR),
  );

  documento.querySelector('#limpiar-filtros').addEventListener('click', () => {
    buscador.value = '';
    textoBuscado = '';
    paginaActual = 1;
    pintar();
    // El botón desaparece al volver a haber resultados: el foco pasa al buscador
    buscador.focus();
  });

  iniciarAtajoBusqueda(documento, buscador);

  iniciarControles(controles, (pagina) => {
    paginaActual = pagina;
    pintar();
  });
  pintar();
}

iniciarUsuarios(document, {
  almacenSesion: sessionStorage,
  almacenUsuarios: localStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
  direccion: {
    leer: () => location.search,
    // `replaceState`: cambiar de página no llena el historial, y «Atrás» sale de la página
    guardar: (consulta) => history.replaceState(null, '', consulta),
  },
});
