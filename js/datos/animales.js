/**
 * Animales: la entidad de la aplicación, el animal que un voluntario tiene a su cargo.
 *
 * Los `@typedef` de abajo describen la forma de los datos, tal como se guardan después de leer el
 * formulario de `ficha.html`. Los valores de `especie`, `sexo`, `estado` y del tipo de vacuna son
 * los `value` de ese formulario. La tabla «La entidad» del README explica cada campo, su control y
 * su validación.
 *
 * Las funciones dan de alta, leen, editan y borran animales. Cada usuario tiene su propia lista en
 * `localStorage`, en JSON, bajo su propia clave (`claveAnimales`): un usuario nunca ve los animales
 * de otro. Cada función recibe el almacenamiento como primer parámetro (`localStorage` en la web,
 * `AlmacenFalso` en los tests) y el nombre del usuario con la sesión iniciada. No validan los campos:
 * eso lo hacen la ficha y los validadores; este módulo solo guarda y lee.
 *
 * Los datos de los ejemplos son inventados: el repositorio es público.
 *
 * @module datos/animales
 * @example
 * // Un animal adoptado, esterilizado y con una vacuna
 * const animal = {
 *   id: 'a1',
 *   nombre: 'Luna',
 *   especie: 'perro',
 *   sexo: 'hembra',
 *   ingreso: '2026-10-13',
 *   peso: 18.4,
 *   microchip: '941000024681357',
 *   foto: 'perro-1',
 *   estado: 'adoptado',
 *   esterilizado: true,
 *   fechaEsterilizacion: '2026-10-20',
 *   adopcion: { nombre: 'Marta Prueba', dni: '12345678Z', telefono: null },
 *   vacunas: [{ tipo: 'rabia', fecha: '2026-10-15' }],
 * };
 */
import { normalizarNombre } from './usuarios.js';

/**
 * Una vacuna puesta al animal: una fila del grupo dinámico de la ficha.
 * @typedef {object} Vacuna
 * @property {'rabia' | 'polivalente' | 'triple-felina' | 'leucemia-felina' | 'mixomatosis' | 'otra'} tipo
 *   Qué vacuna es: el `value` elegido en la lista de la vacuna.
 * @property {string} fecha Cuándo se puso, como `AAAA-MM-DD`. No es futura ni anterior al ingreso.
 */

/**
 * Los datos de quien adopta al animal: el campo condicional que solo existe si está adoptado.
 * @typedef {object} Adopcion
 * @property {string} nombre Nombre del adoptante, sin espacios al principio ni al final.
 * @property {string} dni DNI inventado: 8 cifras y la letra de control en mayúscula (`12345678Z`).
 * @property {?string} telefono Teléfono de 9 cifras que empieza por 6, 7 o 9, o `null` si no se da.
 */

/**
 * Un animal tal como se guarda en `localStorage`, en la lista del usuario que lo tiene a su cargo.
 * @typedef {object} Animal
 * @property {string} id Identificador único del animal. Lo pone el módulo de datos al darlo de alta.
 * @property {string} nombre Su nombre, de 2 a 30 caracteres, sin espacios al principio ni al final.
 * @property {'perro' | 'gato' | 'conejo' | 'otro'} especie La especie elegida en la lista.
 * @property {'hembra' | 'macho'} sexo Hembra o macho.
 * @property {string} ingreso Fecha de ingreso en la protectora, como `AAAA-MM-DD`. No es futura.
 * @property {number} peso Peso en kilos, entre 0,1 y 100, con un decimal como mucho.
 * @property {string} microchip Los 15 dígitos del microchip. Es texto y no número, para no perder
 *   los ceros del principio.
 * @property {string} foto Nombre de su foto en `img/fotos/`, sin la extensión: `'perro-1'` es
 *   `img/fotos/perro-1.webp`. Es siempre una foto de su especie.
 * @property {'acogida' | 'disponible' | 'adoptado'} estado En acogida, disponible para adoptar o
 *   adoptado.
 * @property {boolean} esterilizado Si está esterilizado.
 * @property {?string} fechaEsterilizacion Fecha de la esterilización, como `AAAA-MM-DD`, o `null`
 *   si no está esterilizado. No es futura ni anterior al ingreso.
 * @property {?Adopcion} adopcion Quién lo ha adoptado, solo si `estado` es `'adoptado'`; si no,
 *   `null`.
 * @property {Vacuna[]} vacunas Sus vacunas, de 0 a 3, en el orden de la ficha.
 */

/** Principio de la clave de cada usuario: detrás va su nombre normalizado. */
export const PREFIJO_ANIMALES = 'huellas.animales.';

/**
 * Construye la clave con la que se guardan los animales de un usuario. Usa el nombre normalizado
 * (sin espacios a los lados y en minúsculas), igual que el módulo de usuarios: «Lola» y «lola» son
 * el mismo usuario y ven la misma lista.
 * @param {string} usuario Nombre del usuario con la sesión iniciada.
 * @returns {string}
 * @example
 * claveAnimales('Lola'); // 'huellas.animales.lola'
 */
export function claveAnimales(usuario) {
  return PREFIJO_ANIMALES + normalizarNombre(usuario);
}

/**
 * Comprueba que un elemento leído tiene la forma mínima de un animal: un objeto con `id` y `nombre`
 * de texto no vacíos y una lista de vacunas. Es lo que necesitan el listado y la ficha para no
 * fallar al mostrarlo.
 * @param {*} valor
 * @returns {boolean}
 */
function esAnimal(valor) {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof valor.id === 'string' &&
    valor.id !== '' &&
    typeof valor.nombre === 'string' &&
    valor.nombre.trim() !== '' &&
    Array.isArray(valor.vacunas)
  );
}

/**
 * Lee los animales de un usuario. Si no tiene ninguno o lo guardado está estropeado (no es JSON o
 * no es una lista), devuelve `[]`; si la lista tiene elementos estropeados, los descarta y devuelve
 * los que están bien.
 * @param {Storage} almacen `localStorage` o un `AlmacenFalso`.
 * @param {string} usuario Nombre del usuario con la sesión iniciada.
 * @returns {Animal[]}
 * @example
 * leerAnimales(localStorage, 'lola'); // [{ id: '…', nombre: 'Luna', … }] o []
 */
export function leerAnimales(almacen, usuario) {
  try {
    const lista = JSON.parse(almacen.getItem(claveAnimales(usuario)));
    return Array.isArray(lista) ? lista.filter(esAnimal) : [];
  } catch {
    return [];
  }
}

/**
 * Guarda la lista completa de animales de un usuario. Quien la llama parte siempre de lo que
 * devuelve `leerAnimales`, así que los elementos estropeados desaparecen en cuanto se guarda algo.
 * @param {Storage} almacen
 * @param {string} usuario
 * @param {Animal[]} animales
 */
function guardarAnimales(almacen, usuario, animales) {
  almacen.setItem(claveAnimales(usuario), JSON.stringify(animales));
}

/**
 * Busca un animal del usuario por su `id`.
 * @param {Storage} almacen
 * @param {string} usuario
 * @param {string} id
 * @returns {Animal | null} El animal, o `null` si ese usuario no tiene ninguno con ese `id`.
 * @example
 * buscarAnimal(localStorage, 'lola', new URLSearchParams(location.search).get('id'));
 */
export function buscarAnimal(almacen, usuario, id) {
  return leerAnimales(almacen, usuario).find((animal) => animal.id === id) ?? null;
}

/**
 * Da de alta un animal en la lista del usuario. Le pone un `id` único, aunque los datos ya traigan
 * uno.
 * @param {Storage} almacen
 * @param {string} usuario
 * @param {object} datos Los datos del animal leídos de la ficha, sin `id`.
 * @param {function(): string} [generarId] Crea el `id`; por defecto, `crypto.randomUUID()`. Los
 *   tests pueden pasar otra función para saber qué `id` sale.
 * @returns {Animal} El animal guardado, con su `id`.
 * @example
 * const nuevo = crearAnimal(localStorage, 'lola', { nombre: 'Luna', especie: 'perro', vacunas: [] });
 * nuevo.id; // por ejemplo '3b241101-e2bb-4255-8caf-4136c566a962'
 */
export function crearAnimal(almacen, usuario, datos, generarId = () => crypto.randomUUID()) {
  const nuevo = { ...datos, id: generarId() };
  guardarAnimales(almacen, usuario, [...leerAnimales(almacen, usuario), nuevo]);
  return nuevo;
}

/**
 * Edita un animal del usuario: sustituye todos sus datos por los nuevos y conserva su `id` y su
 * posición en la lista.
 * @param {Storage} almacen
 * @param {string} usuario
 * @param {string} id El `id` del animal que se edita.
 * @param {object} datos Los datos nuevos leídos de la ficha.
 * @returns {Animal | null} El animal guardado, o `null` si ese usuario no tiene ninguno con ese
 *   `id` (entonces no se guarda nada).
 * @example
 * editarAnimal(localStorage, 'lola', 'a1', { nombre: 'Luna', especie: 'perro', vacunas: [] });
 */
export function editarAnimal(almacen, usuario, id, datos) {
  const animales = leerAnimales(almacen, usuario);
  const posicion = animales.findIndex((animal) => animal.id === id);
  if (posicion === -1) {
    return null;
  }
  const editado = { ...datos, id };
  animales[posicion] = editado;
  guardarAnimales(almacen, usuario, animales);
  return editado;
}

/**
 * Borra un animal del usuario.
 * @param {Storage} almacen
 * @param {string} usuario
 * @param {string} id El `id` del animal que se borra.
 * @returns {boolean} `true` si lo ha borrado, o `false` si ese usuario no tenía ninguno con ese
 *   `id` (entonces no se guarda nada).
 * @example
 * borrarAnimal(localStorage, 'lola', 'a1'); // true
 */
export function borrarAnimal(almacen, usuario, id) {
  const animales = leerAnimales(almacen, usuario);
  const quedan = animales.filter((animal) => animal.id !== id);
  if (quedan.length === animales.length) {
    return false;
  }
  guardarAnimales(almacen, usuario, quedan);
  return true;
}
