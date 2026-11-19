/**
 * Página del listado de animales (`listado.html`).
 *
 * Necesita del HTML: la lista `#lista-animales`, la plantilla `#plantilla-animal`, el contenedor
 * `#paginacion`, los filtros por estado (`.filtros-estado`, con `[data-filtro]` y
 * `[data-estadistica]`), el buscador (`#buscador`, `#contador`, `#sin-resultados`, `#vacio-titulo`,
 * `#vacio-texto` y `#limpiar-filtros`), el perfil `#perfil`, el diálogo de borrado
 * `#dialogo-borrar`, la portada (`#saludo`, `#resumen`, `#pendiente` y `#pendiente-texto`) y la
 * cabecera común. Además inicia los avisos, la cabecera y «Cerrar sesión».
 *
 * @module paginas/listado
 */
import { iniciarAvisos, lanzarAviso } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarControles, pintarControles } from '../componentes/controles-paginacion.js';
import { iniciarAtajoBusqueda } from '../componentes/atajo-busqueda.js';
import { abrirPerfil, iniciarPerfil } from '../componentes/perfil-animal.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { crearTarjeta, ESPECIES } from '../componentes/tarjeta-animal.js';
import { borrarAnimal, buscarAnimal, leerAnimales } from '../datos/animales.js';
import { buscarFoto } from '../datos/fotos.js';
import { leerSesion } from '../datos/sesion.js';
import { debounce, filtrarPorTexto, textoContador } from '../logica/busqueda.js';
import { contarPorEstado, filtrarPorEstado, FILTRO_TODOS } from '../logica/filtros.js';
import { paginar } from '../logica/paginacion.js';
import { escribirPagina, leerPagina } from '../logica/pagina-url.js';
import {
  animalesActivos,
  nombresSinVacunas,
  textoPendiente,
  textoResumen,
} from '../logica/resumen.js';

/** Cuántos animales se ven en cada página del listado. */
const POR_PAGINA = 6;

/** Los milisegundos sin teclear que se esperan antes de buscar. */
const ESPERA_BUSCADOR = 250;

/**
 * Lo que dice el mensaje de `#sin-resultados`, según por qué no hay nada que enseñar.
 * @type {Readonly<Record<string, {titulo: string, texto: string}>>}
 */
const TEXTOS_VACIO = Object.freeze({
  sinAnimales: {
    titulo: 'Todavía no tienes animales',
    texto: 'Pulsa «Registrar un animal» y dale de alta al primero.',
  },
  sinResultados: {
    titulo: 'No hay ningún animal con ese nombre',
    texto: 'Prueba con otra búsqueda o cambia de filtro.',
  },
  sinAnimalesDeEseEstado: {
    titulo: 'No hay animales en ese estado',
    texto: 'Cambia de filtro para ver el resto de tus animales.',
  },
});

/**
 * Inicia el listado. Sin sesión, la página protegida lleva a `index.html`. Con sesión, pinta los
 * animales del usuario de seis en seis: una tarjeta por animal, creada desde la plantilla, y
 * debajo los controles de paginación. Al pulsar un control, se pinta esa página. La página actual
 * va en la dirección (`?pagina=2`): se lee al empezar y se escribe, ya corregida, cada vez que se
 * pinta, sin añadir pasos al historial; así, al recargar sigues en la misma página, y una página
 * que no existe (`?pagina=99`) enseña la última. Cada vez que se pinta, también se actualiza la
 * portada (saludo, resumen y aviso de animales sin vacunas), así que cualquier cambio en los
 * animales se ve sin recargar.
 *
 * El buscador filtra por nombre, especie y microchip, sin importar mayúsculas ni tildes, cuando
 * se deja de teclear 250 ms (`debounce`). Al buscar se vuelve a la página 1. El contador dice
 * cuántos animales coinciden en total (no solo los de la página) y, si no hay ninguno, se enseña
 * `#sin-resultados`: con otro texto si el usuario todavía no tiene ningún animal. «Limpiar la
 * búsqueda» vacía el buscador y quita el filtro, y la tecla `/` lleva el foco al buscador.
 *
 * Los botones de estado (`[data-filtro]`: todos, en acogida, disponibles y adoptados) se atienden
 * con un solo oyente en su contenedor. El filtro activo se marca con `aria-pressed` y se combina
 * con el buscador; al cambiarlo se vuelve a la página 1. Cada botón muestra en `[data-estadistica]`
 * cuántos animales hay de ese estado, sin tener en cuenta la búsqueda, y las tres cifras suman el
 * total. Todo se pinta de una vez y de forma síncrona, así que se pueden pulsar muy deprisa.
 *
 * Los botones de cada tarjeta se atienden con un solo oyente en la lista (delegación con
 * `closest`). La foto (`[data-accion="ver"]`) abre el perfil lateral `#perfil` con los datos del
 * animal; al cerrarlo (Esc, su botón o un clic fuera) el foco vuelve a esa foto. «Borrar» abre
 * `#dialogo-borrar` con el nombre y la foto del animal y, solo si se confirma, se borra, se vuelve
 * a pintar, se avisa y el foco pasa a la primera tarjeta (o al buscador si ya no queda ninguna).
 * Cancelar o pulsar Esc no borra nada.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {Storage} dependencias.almacenAnimales Donde están los animales (`localStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 * @param {object} dependencias.direccion Cómo leer y cambiar la dirección de la página.
 * @param {function(): string} dependencias.direccion.leer Devuelve la consulta de la dirección
 *   (`location.search`).
 * @param {function(string): void} dependencias.direccion.guardar Cambia la consulta de la
 *   dirección sin recargar la página ni añadir un paso al historial (`history.replaceState`).
 * @listens click
 * @listens close
 * @listens input
 * @fires aviso
 */
export function iniciarListado(documento, { almacenSesion, almacenAnimales, navegar, direccion }) {
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
  const dialogo = documento.querySelector('#dialogo-borrar');
  const perfil = documento.querySelector('#perfil');
  const buscador = documento.querySelector('#buscador');
  let textoBuscado = '';
  let filtroActual = FILTRO_TODOS;
  // Sin corregir: `paginar` la lleva a una página que exista la primera vez que se pinta
  let paginaActual = leerPagina(direccion.leer());
  let idParaBorrar = null;
  let retratoDelPerfil = null;

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

  /**
   * Deja los animales que coinciden con lo escrito en el buscador. Se busca en el nombre, en el
   * microchip y en cómo se lee la especie («Perro»), que no es lo mismo que el valor guardado.
   * @param {Array<module:datos/animales~Animal>} animales Todos los animales del usuario.
   * @returns {Array<module:datos/animales~Animal>}
   */
  function buscar(animales) {
    const conEspecie = animales.map((animal) => ({
      ...animal,
      especieTexto: ESPECIES[animal.especie] ?? '',
    }));
    return filtrarPorTexto(conEspecie, textoBuscado, ['nombre', 'especieTexto', 'microchip']);
  }

  /**
   * Pinta los botones de estado: marca el activo con `aria-pressed` y escribe en cada uno cuántos
   * animales hay de su estado.
   * @param {Array<module:datos/animales~Animal>} animales Todos los animales del usuario.
   */
  function pintarFiltros(animales) {
    const cuentas = contarPorEstado(animales);
    documento.querySelectorAll('[data-filtro]').forEach((boton) => {
      boton.setAttribute('aria-pressed', String(boton.dataset.filtro === filtroActual));
    });
    documento.querySelectorAll('[data-estadistica]').forEach((cifra) => {
      cifra.textContent = String(cuentas[cifra.dataset.estadistica]);
    });
  }

  /**
   * Rellena el contador y enseña u oculta el mensaje de «no hay nada»: sin ningún animal, sin
   * animales en el estado elegido o sin resultados de la búsqueda.
   * @param {number} coincidencias Cuántos animales coinciden con la búsqueda y el filtro, en todas
   *   las páginas.
   * @param {number} total Cuántos animales tiene el usuario.
   */
  function pintarBusqueda(coincidencias, total) {
    let textos = TEXTOS_VACIO.sinResultados;
    if (total === 0) {
      textos = TEXTOS_VACIO.sinAnimales;
    } else if (textoBuscado.trim() === '') {
      textos = TEXTOS_VACIO.sinAnimalesDeEseEstado;
    }
    documento.querySelector('#contador').textContent = textoContador(
      coincidencias,
      'animal',
      'animales',
    );
    documento.querySelector('#sin-resultados').hidden = coincidencias > 0;
    documento.querySelector('#vacio-titulo').textContent = textos.titulo;
    documento.querySelector('#vacio-texto').textContent = textos.texto;
    // Sin animales no hay búsqueda que limpiar
    documento.querySelector('#limpiar-filtros').hidden = total === 0;
  }

  /**
   * Pinta la página actual de los animales que coinciden con la búsqueda y el filtro: todas las
   * tarjetas a la vez, los controles, los botones de estado, el contador y la portada.
   */
  function pintar() {
    const animales = leerAnimales(almacenAnimales, sesion.usuario);
    const encontrados = filtrarPorEstado(buscar(animales), filtroActual);
    const { elementos, pagina, totalPaginas } = paginar(encontrados, paginaActual, POR_PAGINA);
    paginaActual = pagina;
    direccion.guardar(escribirPagina(direccion.leer(), pagina));
    lista.replaceChildren(...elementos.map((animal) => crearTarjeta(plantilla, animal)));
    pintarControles(controles, pagina, totalPaginas);
    pintarFiltros(animales);
    pintarBusqueda(encontrados.length, animales.length);
    pintarResumen(animales);
  }

  /**
   * Abre el diálogo de confirmación para el animal de la tarjeta donde se ha pulsado «Borrar».
   * @param {HTMLElement} tarjeta El `li.animal` del animal.
   */
  function pedirConfirmacion(tarjeta) {
    const animal = buscarAnimal(almacenAnimales, sesion.usuario, tarjeta.dataset.id);
    if (!animal) {
      return;
    }
    const foto = buscarFoto(animal.foto);
    idParaBorrar = animal.id;
    // Si no, tras una confirmación anterior `returnValue` seguiría valiendo «confirmar» al pulsar Esc
    dialogo.returnValue = '';
    documento.querySelector('#dialogo-nombre').textContent = animal.nombre;
    const imagen = documento.querySelector('#dialogo-foto');
    imagen.hidden = foto === null;
    if (foto) {
      imagen.src = `img/fotos/${foto.archivo}.webp`;
    }
    dialogo.showModal();
  }

  /**
   * Abre el perfil lateral del animal de la tarjeta donde se ha pulsado la foto y guarda esa foto
   * para devolverle el foco al cerrarlo.
   * @param {HTMLElement} retrato El botón `[data-accion="ver"]` de la tarjeta.
   */
  function verPerfil(retrato) {
    const animal = buscarAnimal(
      almacenAnimales,
      sesion.usuario,
      retrato.closest('.animal').dataset.id,
    );
    if (animal) {
      retratoDelPerfil = retrato;
      abrirPerfil(perfil, animal);
    }
  }

  lista.addEventListener('click', (evento) => {
    const retrato = evento.target.closest('[data-accion="ver"]');
    if (retrato) {
      verPerfil(retrato);
      return;
    }
    const boton = evento.target.closest('[data-accion="borrar"]');
    if (boton) {
      pedirConfirmacion(boton.closest('.animal'));
    }
  });

  // Algunos navegadores no devuelven el foco solos (Safari no enfoca los botones al pulsarlos)
  perfil.addEventListener('close', () => {
    if (retratoDelPerfil?.isConnected) {
      retratoDelPerfil.focus();
    }
    retratoDelPerfil = null;
  });
  iniciarPerfil(perfil);

  dialogo.addEventListener('close', () => {
    const id = idParaBorrar;
    idParaBorrar = null;
    if (dialogo.returnValue !== 'confirmar' || id === null) {
      return;
    }
    const animal = buscarAnimal(almacenAnimales, sesion.usuario, id);
    if (animal && borrarAnimal(almacenAnimales, sesion.usuario, id)) {
      pintar();
      // La tarjeta con el foco ha desaparecido: el foco pasa a la primera tarjeta o, si no queda
      // ninguna, al buscador, y no se pierde en el `body`
      (lista.querySelector('.animal__retrato') ?? documento.querySelector('#buscador'))?.focus();
      // Se avisa desde la lista, porque la tarjeta del animal ya no está en la página
      lanzarAviso(lista, `Has borrado la ficha de ${animal.nombre}.`);
    }
  });

  // Se busca al dejar de teclear, no con cada tecla; al buscar se vuelve a la página 1
  buscador.addEventListener(
    'input',
    debounce(() => {
      textoBuscado = buscador.value;
      paginaActual = 1;
      pintar();
    }, ESPERA_BUSCADOR),
  );

  // Un solo oyente para los cuatro botones de estado (delegación con `closest`)
  documento.querySelector('.filtros-estado').addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-filtro]');
    if (boton) {
      filtroActual = boton.dataset.filtro;
      paginaActual = 1;
      pintar();
    }
  });

  documento.querySelector('#limpiar-filtros').addEventListener('click', () => {
    buscador.value = '';
    textoBuscado = '';
    filtroActual = FILTRO_TODOS;
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

iniciarListado(document, {
  almacenSesion: sessionStorage,
  almacenAnimales: localStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
  direccion: {
    leer: () => location.search,
    // `replaceState`: cambiar de página no llena el historial, y «Atrás» sale del listado
    guardar: (consulta) => history.replaceState(null, '', consulta),
  },
});
