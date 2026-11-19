/**
 * Cartilla de la ficha: la vista previa `#cartilla` que se rellena sola mientras se escribe.
 *
 * Lee todo el formulario con `FormData` cada vez que algo cambia y escribe los textos con
 * `textContent`. Lo que cambia de aspecto lo hace el CSS a partir de atributos: `data-estado`
 * (enseña el sello «Adoptado»), `data-fondo` y `data-lado` (el arco de color y cómo se coloca la
 * foto) y `hidden` (la foto o, mientras no hay foto, la huella de fondo). Los sellos de las vacunas
 * se crean con `createElement`, sin `innerHTML`.
 *
 * @module componentes/cartilla
 */
import { buscarFoto } from '../datos/fotos.js';
import { fechaCorta } from '../logica/fechas.js';
import { CAMPOS_OBLIGATORIOS, datosPendientes, textoProgreso } from '../logica/progreso-ficha.js';
import { ESPECIES, MAX_VACUNAS, SEXOS, textoPeso } from './tarjeta-animal.js';

/** Lo que pone un dato de la cartilla mientras no se ha rellenado. */
export const SIN_DATO = 'Por indicar';

/** Lo que pone el nombre de la cartilla mientras no se ha escrito. */
export const SIN_NOMBRE = 'Sin nombre';

/**
 * Cómo se lee cada vacuna (el `value` de la lista de la vacuna).
 * @type {Readonly<Record<string, string>>}
 */
export const NOMBRES_VACUNAS = Object.freeze({
  rabia: 'Rabia',
  polivalente: 'Polivalente',
  'triple-felina': 'Triple felina',
  'leucemia-felina': 'Leucemia felina',
  mixomatosis: 'Mixomatosis',
  otra: 'Otra',
});

/**
 * Los elementos de la cartilla.
 * @typedef {object} ElementosCartilla
 * @property {HTMLElement} cartilla El contenedor `#cartilla`.
 * @property {HTMLImageElement} foto La foto `#cartilla-foto`.
 * @property {SVGElement} silueta La huella de fondo `#cartilla-silueta`.
 * @property {HTMLElement} nombre `#cartilla-nombre`.
 * @property {HTMLElement} especie `#cartilla-especie`.
 * @property {HTMLElement} sexo `#cartilla-sexo`.
 * @property {HTMLElement} ingreso `#cartilla-ingreso`.
 * @property {HTMLElement} peso `#cartilla-peso`.
 * @property {HTMLElement} microchip `#cartilla-microchip`.
 * @property {HTMLElement} sellos La lista `#cartilla-sellos`.
 * @property {HTMLProgressElement} progreso La barra `#progreso-ficha`.
 * @property {HTMLElement} textoProgreso El texto `#progreso-texto`.
 */

/**
 * Lee las vacunas de la ficha que ya tienen elegida la vacuna, en el orden del formulario.
 * @param {FormData} datos
 * @returns {Array<{tipo: string, fecha: string}>}
 */
function vacunasElegidas(datos) {
  const fechas = datos.getAll('vacunaFecha');
  return datos
    .getAll('vacunaTipo')
    .map((tipo, indice) => ({ tipo, fecha: fechas[indice] ?? '' }))
    .filter((vacuna) => vacuna.tipo !== '');
}

/**
 * Crea los tres sellos de la cartilla: uno puesto por cada vacuna (con su nombre y, si la tiene, su
 * fecha) y vacíos los que sobran.
 * @param {Document} documento
 * @param {Array<{tipo: string, fecha: string}>} vacunas
 * @returns {HTMLLIElement[]}
 * @example
 * lista.replaceChildren(...crearSellos(document, [{ tipo: 'rabia', fecha: '2026-10-15' }]));
 */
export function crearSellos(documento, vacunas) {
  return Array.from({ length: MAX_VACUNAS }, (_, indice) => {
    const sello = documento.createElement('li');
    const vacuna = vacunas[indice];
    sello.className = vacuna ? 'sello sello--puesto' : 'sello sello--vacio';
    if (vacuna) {
      const nombre = documento.createElement('strong');
      nombre.textContent = NOMBRES_VACUNAS[vacuna.tipo] ?? vacuna.tipo;
      sello.append(nombre);
      if (vacuna.fecha) {
        const fecha = documento.createElement('small');
        fecha.textContent = fechaCorta(vacuna.fecha);
        sello.append(fecha);
      }
    }
    return sello;
  });
}

/**
 * Pone la foto elegida en la cartilla, con su fondo y su lado; sin foto, enseña la huella de fondo.
 * @param {ElementosCartilla} elementos
 * @param {?string} archivo El `value` de la foto elegida (`'perro-3'`), o `null`.
 */
function pintarFoto(elementos, archivo) {
  const { cartilla, foto, silueta } = elementos;
  const elegida = buscarFoto(archivo);
  cartilla.dataset.fondo = elegida?.fondo ?? 'sol';
  cartilla.dataset.lado = elegida?.lado ?? 'centro';
  foto.hidden = !elegida;
  silueta.toggleAttribute('hidden', Boolean(elegida));
  if (elegida) {
    const ruta = `img/fotos/${elegida.archivo}.webp`;
    // Solo si cambia: así la foto no se vuelve a cargar (ni a animar) con cada tecla
    if (foto.getAttribute('src') !== ruta) {
      foto.src = ruta;
    }
  }
}

/**
 * Rellena la cartilla con lo que hay ahora en el formulario (menos los sellos).
 * @param {ElementosCartilla} elementos
 * @param {FormData} datos Lo leído del formulario de la ficha.
 */
function pintarDatos(elementos, datos) {
  const texto = (nombre) => String(datos.get(nombre) ?? '').trim();
  const dato = (elemento, valor) => {
    elemento.textContent = valor || SIN_DATO;
  };
  const pendientes = datosPendientes(datos);

  elementos.nombre.textContent = texto('nombre') || SIN_NOMBRE;
  dato(elementos.especie, ESPECIES[texto('especie')]);
  dato(elementos.sexo, SEXOS[texto('sexo')]);
  dato(elementos.ingreso, fechaCorta(texto('ingreso')));
  dato(elementos.peso, texto('peso') && textoPeso(Number(texto('peso'))));
  dato(elementos.microchip, texto('microchip'));
  elementos.cartilla.dataset.estado = texto('estado') || 'acogida';
  pintarFoto(elementos, datos.get('foto'));

  elementos.progreso.max = CAMPOS_OBLIGATORIOS.length;
  elementos.progreso.value = CAMPOS_OBLIGATORIOS.length - pendientes;
  elementos.textoProgreso.textContent = textoProgreso(pendientes);
}

/**
 * Hace que la cartilla siga al formulario: la rellena ahora y cada vez que se escribe (`input`),
 * se elige algo (`change`) o se añade o quita una vacuna (`cambio-vacunas`, que lanza el grupo de
 * vacunas y sube hasta el formulario).
 * @param {HTMLFormElement} formulario El formulario `#formulario-animal`.
 * @param {ElementosCartilla} elementos
 * @returns {function(): void} La función que la vuelve a rellenar, para cuando la página cambia el
 *   formulario desde el código (al rellenar una ficha guardada).
 * @listens input
 * @listens change
 * @listens cambio-vacunas
 * @example
 * const actualizarCartilla = iniciarCartilla(formulario, elementos);
 */
export function iniciarCartilla(formulario, elementos) {
  let sellosPuestos = '';

  /** Vuelve a rellenar la cartilla; los sellos, solo si han cambiado (así no se reanima ninguno). */
  function actualizar() {
    const datos = new FormData(formulario);
    pintarDatos(elementos, datos);
    const vacunas = vacunasElegidas(datos);
    const clave = JSON.stringify(vacunas);
    if (clave !== sellosPuestos) {
      sellosPuestos = clave;
      elementos.sellos.replaceChildren(...crearSellos(formulario.ownerDocument, vacunas));
    }
  }

  formulario.addEventListener('input', actualizar);
  formulario.addEventListener('change', actualizar);
  formulario.addEventListener('cambio-vacunas', actualizar);
  actualizar();
  return actualizar;
}
