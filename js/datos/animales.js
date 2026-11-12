/**
 * Animales: la entidad de la aplicación, el animal que un voluntario tiene a su cargo.
 *
 * De momento este módulo solo describe la forma de los datos con `@typedef`, tal como se guardan
 * después de leer el formulario de `ficha.html`. Los valores de `especie`, `sexo`, `estado` y del
 * tipo de vacuna son los `value` de ese formulario. La tabla «La entidad» del README explica cada
 * campo, su control y su validación.
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
