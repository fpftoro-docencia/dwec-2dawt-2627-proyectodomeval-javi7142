/**
 * Tarjeta de un animal del listado: se crea copiando la plantilla `#plantilla-animal` de
 * `listado.html` y se rellena con `textContent` y atributos (nunca con `innerHTML` ni con estilos).
 *
 * El componente no conoce el listado ni los datos: recibe la plantilla y un animal y devuelve el
 * `<li>` ya relleno. Quien lo usa lo coloca donde quiera (el listado, de una vez, con
 * `replaceChildren`).
 *
 * Lo que cambia según el animal lo hace el CSS a partir de `data-*`: `data-estado` (color de la
 * placa y sello «Adoptado»), `data-fondo` y `data-lado` (el arco de color y por dónde se corta la
 * foto) y `data-vacunas` (cuántos puntos de vacuna se encienden).
 *
 * @module componentes/tarjeta-animal
 */
import { buscarFoto } from '../datos/fotos.js';

/** Cuántas vacunas puede tener un animal como máximo: los puntos que dibuja la tarjeta. */
export const MAX_VACUNAS = 3;

/**
 * Cómo se lee cada estado (el `value` guardado en el animal).
 * @type {Readonly<Record<string, string>>}
 */
export const ESTADOS = Object.freeze({
  acogida: 'En acogida',
  disponible: 'Disponible',
  adoptado: 'Adoptado',
});

/**
 * Cómo se lee cada especie (el `value` guardado en el animal).
 * @type {Readonly<Record<string, string>>}
 */
export const ESPECIES = Object.freeze({
  perro: 'Perro',
  gato: 'Gato',
  conejo: 'Conejo',
  otro: 'Otra especie',
});

/**
 * Cómo se lee cada sexo (el `value` guardado en el animal).
 * @type {Readonly<Record<string, string>>}
 */
export const SEXOS = Object.freeze({ hembra: 'hembra', macho: 'macho' });

/**
 * Escribe un peso en kilos, con la coma decimal española.
 * @param {number} peso El peso en kilos.
 * @returns {string}
 * @example
 * textoPeso(5.5); // '5,5 kg'
 */
export function textoPeso(peso) {
  return `${Number(peso).toLocaleString('es-ES')} kg`;
}

/**
 * Escribe cuántas vacunas tiene un animal.
 * @param {number} cantidad Cuántas vacunas tiene.
 * @returns {string}
 * @example
 * textoVacunas(0); // 'Sin vacunas anotadas'
 * textoVacunas(2); // '2 de 3 vacunas'
 */
export function textoVacunas(cantidad) {
  return cantidad === 0 ? 'Sin vacunas anotadas' : `${cantidad} de ${MAX_VACUNAS} vacunas`;
}

/**
 * Escribe la línea de debajo del nombre: especie, sexo y peso. Lo que falte o no se reconozca (un
 * animal guardado a medias) se deja fuera en vez de escribir «undefined».
 * @param {module:datos/animales~Animal} animal
 * @returns {string}
 * @example
 * // 'Perro, hembra. 12,5 kg'
 */
function textoSubtitulo(animal) {
  const especieYSexo = [ESPECIES[animal.especie], SEXOS[animal.sexo]].filter(Boolean).join(', ');
  const peso = Number.isFinite(animal.peso) ? textoPeso(animal.peso) : '';
  return [especieYSexo, peso].filter(Boolean).join('. ');
}

/**
 * Crea la tarjeta de un animal copiando la plantilla.
 *
 * Si la foto del animal no está en el catálogo (`buscarFoto` devuelve `null`), la tarjeta no pone
 * ni `src` ni `data-fondo` y `data-lado` (el CSS usa sus valores por defecto) y oculta la imagen
 * con `hidden`. Si el estado no se reconoce, se trata como «En acogida».
 * @param {HTMLTemplateElement} plantilla La plantilla `#plantilla-animal`.
 * @param {module:datos/animales~Animal} animal El animal que se muestra.
 * @returns {HTMLLIElement} El `<li class="animal">` relleno, listo para añadir a la lista.
 * @example
 * lista.replaceChildren(...animales.map((animal) => crearTarjeta(plantilla, animal)));
 */
export function crearTarjeta(plantilla, animal) {
  const tarjeta = plantilla.content.cloneNode(true).querySelector('.animal');
  const estado = Object.hasOwn(ESTADOS, animal.estado) ? animal.estado : 'acogida';
  const foto = buscarFoto(animal.foto);
  const vacunas = Math.min(animal.vacunas.length, MAX_VACUNAS);

  tarjeta.dataset.id = animal.id;
  tarjeta.dataset.estado = estado;
  if (foto) {
    tarjeta.dataset.fondo = foto.fondo;
    tarjeta.dataset.lado = foto.lado;
    tarjeta.querySelector('.animal__foto').src = `img/fotos/${foto.archivo}.webp`;
  } else {
    // Sin foto válida no hay nada que enseñar: se oculta la imagen para que no salga rota
    tarjeta.querySelector('.animal__foto').hidden = true;
  }
  tarjeta
    .querySelector('.animal__retrato')
    .setAttribute('aria-label', `Ver a ${animal.nombre}, ${ESTADOS[estado].toLowerCase()}`);
  tarjeta.querySelector('.animal__estado').textContent = ESTADOS[estado];
  tarjeta.querySelector('.animal__nombre').textContent = animal.nombre;
  tarjeta.querySelector('.animal__subtitulo').textContent = textoSubtitulo(animal);
  tarjeta.querySelector('.vacunas-puntos').dataset.vacunas = String(vacunas);
  tarjeta.querySelector('.animal__vacunas-texto').textContent = textoVacunas(vacunas);
  tarjeta.querySelector('[data-accion="editar"]').href =
    `ficha.html?${new URLSearchParams({ id: animal.id })}`;
  return tarjeta;
}
