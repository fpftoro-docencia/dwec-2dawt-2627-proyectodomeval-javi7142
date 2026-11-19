/**
 * Perfil lateral de un animal del listado: el `<dialog id="perfil">` de `listado.html`, que se abre
 * con `showModal()` y se rellena con `textContent` y atributos (nunca con `innerHTML` ni con
 * estilos).
 *
 * El componente no conoce el listado ni los datos: recibe el `<dialog>` y un animal. Quien lo usa
 * decide cuándo abrirlo (el listado, al pulsar la foto de una tarjeta).
 *
 * El perfil se cierra de tres maneras: con Esc y con el botón «Cerrar» (un `<form method="dialog">`
 * dentro del HTML) lo hace el propio navegador; con un clic fuera del panel, `iniciarPerfil`.
 *
 * Lo que cambia según el animal lo hace el CSS a partir de `data-fondo` y `data-lado` del retrato,
 * igual que en la tarjeta.
 *
 * @module componentes/perfil-animal
 */
import { buscarFoto } from '../datos/fotos.js';
import { ESPECIES, ESTADOS, textoPeso } from './tarjeta-animal.js';

/**
 * Cómo se lee cada tipo de vacuna (el `value` guardado en cada vacuna del animal).
 * @type {Readonly<Record<string, string>>}
 */
export const VACUNAS = Object.freeze({
  rabia: 'Rabia',
  polivalente: 'Polivalente',
  'triple-felina': 'Triple felina',
  'leucemia-felina': 'Leucemia felina',
  mixomatosis: 'Mixomatosis',
  otra: 'Otra',
});

/**
 * Escribe una fecha guardada como `AAAA-MM-DD` con el formato español. Se construye con el día, el
 * mes y el año por separado (y no con `new Date('2026-10-13')`) para que la zona horaria no la
 * cambie de día. Si no es una fecha, devuelve el texto tal cual.
 * @param {string} fecha La fecha como `AAAA-MM-DD`.
 * @returns {string}
 * @example
 * textoFecha('2026-10-13'); // '13/10/2026'
 */
export function textoFecha(fecha) {
  const [anio, mes, dia] = String(fecha).split('-').map(Number);
  const resultado = new Date(anio, mes - 1, dia);
  return Number.isNaN(resultado.getTime()) ? String(fecha) : resultado.toLocaleDateString('es-ES');
}

/**
 * Escribe la línea de debajo del nombre: la especie y, o bien quién lo ha adoptado, o bien su
 * estado.
 * @param {module:datos/animales~Animal} animal
 * @returns {string}
 * @example
 * // 'Perro, adoptado por Ana' o 'Gato, en acogida'
 */
function textoSubtituloPerfil(animal) {
  const estado = Object.hasOwn(ESTADOS, animal.estado) ? animal.estado : 'acogida';
  const adoptante = animal.adopcion?.nombre;
  const situacion = adoptante ? `adoptado por ${adoptante}` : ESTADOS[estado].toLowerCase();
  return [ESPECIES[animal.especie], situacion].filter(Boolean).join(', ');
}

/**
 * Crea la lista de vacunas del perfil: una fila por vacuna, con su nombre y su fecha, o una sola
 * fila de aviso si no tiene ninguna.
 * @param {Document} documento El documento que crea los elementos.
 * @param {Array<module:datos/animales~Vacuna>} vacunas Las vacunas del animal.
 * @returns {HTMLLIElement[]}
 */
function crearFilasVacunas(documento, vacunas) {
  if (vacunas.length === 0) {
    const aviso = documento.createElement('li');
    aviso.className = 'perfil__sin-vacunas';
    aviso.textContent = 'Todavía no tiene ninguna vacuna anotada.';
    return [aviso];
  }
  return vacunas.map((vacuna) => {
    const fila = documento.createElement('li');
    const nombre = documento.createElement('span');
    const fecha = documento.createElement('span');
    nombre.textContent = VACUNAS[vacuna.tipo] ?? VACUNAS.otra;
    fecha.textContent = textoFecha(vacuna.fecha);
    fila.append(nombre, fecha);
    return fila;
  });
}

/**
 * Rellena el perfil con los datos de un animal, sin abrirlo: nombre, subtítulo, peso, ingreso,
 * microchip, esterilización («Pendiente» si no hay fecha), vacunas, el fondo y el lado de la foto
 * y el enlace «Editar la ficha». Si la foto del animal no está en el catálogo, no se pone `src` ni
 * `data-fondo` y `data-lado` (el CSS usa sus valores por defecto) y la imagen se oculta con
 * `hidden`.
 * @param {HTMLDialogElement} perfil El `<dialog id="perfil">`.
 * @param {module:datos/animales~Animal} animal El animal que se muestra.
 * @example
 * rellenarPerfil(document.querySelector('#perfil'), animal);
 */
export function rellenarPerfil(perfil, animal) {
  const retrato = perfil.querySelector('#perfil-retrato');
  const imagen = perfil.querySelector('#perfil-foto');
  const foto = buscarFoto(animal.foto);

  if (foto) {
    retrato.dataset.fondo = foto.fondo;
    retrato.dataset.lado = foto.lado;
    imagen.src = `img/fotos/${foto.archivo}.webp`;
  } else {
    // El perfil se reutiliza: sin foto válida hay que quitar lo del animal anterior
    delete retrato.dataset.fondo;
    delete retrato.dataset.lado;
    imagen.removeAttribute('src');
  }
  imagen.hidden = foto === null;

  perfil.querySelector('#perfil-nombre').textContent = animal.nombre;
  perfil.querySelector('#perfil-subtitulo').textContent = textoSubtituloPerfil(animal);
  perfil.querySelector('#perfil-peso').textContent = Number.isFinite(animal.peso)
    ? textoPeso(animal.peso)
    : '—';
  perfil.querySelector('#perfil-ingreso').textContent = animal.ingreso
    ? textoFecha(animal.ingreso)
    : '—';
  perfil.querySelector('#perfil-microchip').textContent = animal.microchip || '—';
  perfil.querySelector('#perfil-esterilizacion').textContent = animal.fechaEsterilizacion
    ? textoFecha(animal.fechaEsterilizacion)
    : 'Pendiente';
  perfil
    .querySelector('#perfil-vacunas')
    .replaceChildren(...crearFilasVacunas(perfil.ownerDocument, animal.vacunas));
  perfil.querySelector('#perfil-editar').href =
    `ficha.html?${new URLSearchParams({ id: animal.id })}`;
}

/**
 * Rellena el perfil con los datos de un animal y lo abre como diálogo modal.
 * @param {HTMLDialogElement} perfil El `<dialog id="perfil">`.
 * @param {module:datos/animales~Animal} animal El animal que se muestra.
 */
export function abrirPerfil(perfil, animal) {
  rellenarPerfil(perfil, animal);
  perfil.showModal();
}

/**
 * Conecta el cierre con un clic fuera del panel. Un clic en la zona oscura de detrás llega al propio
 * `<dialog>` (el objetivo es el diálogo y no un elemento de dentro), pero también lo recibe la zona
 * vacía del panel por debajo de su contenido: por eso se comprueba además que el clic cae fuera del
 * rectángulo del panel. Esc y el botón «Cerrar» no necesitan código: los hace el navegador.
 * @param {HTMLDialogElement} perfil El `<dialog id="perfil">`.
 * @listens click
 * @example
 * iniciarPerfil(document.querySelector('#perfil'));
 */
export function iniciarPerfil(perfil) {
  perfil.addEventListener('click', (evento) => {
    if (evento.target !== perfil) {
      return;
    }
    const panel = perfil.getBoundingClientRect();
    const fuera =
      evento.clientX < panel.left ||
      evento.clientX > panel.right ||
      evento.clientY < panel.top ||
      evento.clientY > panel.bottom;
    if (fuera) {
      perfil.close();
    }
  });
}
