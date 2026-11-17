/**
 * Galería de fotos de la ficha: al elegir la especie, muestra sus fotos como botones de opción
 * (`name="foto"`), copiando la plantilla `#plantilla-foto`. La foto elegida se lee después con
 * `FormData` (el `value` es el archivo sin extensión, como se guarda en el animal).
 *
 * Todo lo que cambia lo hace el HTML y el CSS a partir de atributos: el componente solo copia la
 * plantilla, escribe `data-fondo` y `data-lado` (que el CSS lee para colocar la foto), rellena
 * atributos y texto con `textContent` y activa o desactiva el bloque con `disabled`. No usa
 * `innerHTML` ni estilos.
 *
 * @module componentes/galeria-fotos
 */
import { fotosDeEspecie } from '../datos/fotos.js';

/** Lo que dice la ayuda mientras no hay especie elegida. */
export const AYUDA_SIN_ESPECIE = 'Elige la especie y aquí aparecerán las fotos disponibles.';

/** Lo que dice la ayuda cuando ya se pueden elegir fotos. */
export const AYUDA_CON_FOTOS = 'Elige la que más se le parezca.';

/**
 * Los elementos de la ficha que usa la galería.
 * @typedef {object} ElementosGaleria
 * @property {HTMLSelectElement} especie La lista `#especie`.
 * @property {HTMLFieldSetElement} bloque El `<fieldset>` `#bloque-foto`, desactivado mientras no
 *   hay fotos que elegir.
 * @property {HTMLElement} galeria El contenedor `#galeria-fotos` donde se ponen las fotos.
 * @property {HTMLTemplateElement} plantilla La plantilla `#plantilla-foto`.
 * @property {HTMLElement} ayuda El párrafo `#ayuda-foto`, cuyo texto cambia con la especie.
 */

/**
 * Rellena la galería con las fotos de una especie. Marca la foto `elegida` si es de esa especie y,
 * si no, la primera. Sin fotos (especie sin elegir), vacía la galería y desactiva el bloque.
 * @param {ElementosGaleria} elementos Los elementos de la ficha.
 * @param {string} especie El `value` de la lista de especies (`'perro'`, `''`…).
 * @param {?string} [elegida] El archivo de la foto guardada en el animal (`'perro-3'`), o `null`.
 * @returns {number} Cuántas fotos se han puesto.
 * @example
 * pintarGaleria(elementos, 'gato'); // 7 fotos, marcada gato-1
 * pintarGaleria(elementos, 'gato', 'gato-4'); // 7 fotos, marcada gato-4
 */
export function pintarGaleria(elementos, especie, elegida = null) {
  const { bloque, galeria, plantilla, ayuda } = elementos;
  const fotos = fotosDeEspecie(especie);
  const hayElegida = fotos.some((foto) => foto.archivo === elegida);
  const opciones = fotos.map((foto, indice) => {
    const copia = plantilla.content.cloneNode(true);
    const opcion = copia.querySelector('.foto-opcion');
    const radio = copia.querySelector('input');
    opcion.dataset.fondo = foto.fondo;
    opcion.dataset.lado = foto.lado;
    copia.querySelector('img').src = `img/fotos/${foto.archivo}.webp`;
    radio.value = foto.archivo;
    radio.checked = hayElegida ? foto.archivo === elegida : indice === 0;
    radio.setAttribute('aria-label', `Foto ${indice + 1} de ${fotos.length}`);
    return copia;
  });
  galeria.replaceChildren(...opciones);
  bloque.disabled = fotos.length === 0;
  ayuda.textContent = fotos.length === 0 ? AYUDA_SIN_ESPECIE : AYUDA_CON_FOTOS;
  return fotos.length;
}

/**
 * Hace que la galería siga a la lista de especies: pinta las fotos de la especie que haya ahora y
 * las vuelve a pintar cada vez que cambia (con la primera foto marcada).
 * @param {ElementosGaleria} elementos Los elementos de la ficha.
 * @returns {void}
 * @example
 * iniciarGaleriaFotos({ especie, bloque, galeria, plantilla, ayuda });
 */
export function iniciarGaleriaFotos(elementos) {
  const pintar = () => pintarGaleria(elementos, elementos.especie.value);
  elementos.especie.addEventListener('change', pintar);
  pintar();
}
