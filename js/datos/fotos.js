/**
 * Fotos: el catálogo de las fotos de `img/fotos/` entre las que se elige la de cada animal.
 *
 * Cada foto dice de qué especie es y cómo se coloca sobre el arco de color del listado, la cartilla,
 * el perfil y la galería de la ficha. La página copia `fondo` y `lado` en los atributos
 * `data-fondo` y `data-lado`, y `css/estilos.css` hace el resto: el JavaScript no escribe estilos.
 *
 * La lista está congelada (y cada foto también): nadie puede cambiarla sin querer. Solo cambia si
 * se añade o se quita una foto de la carpeta.
 *
 * @module datos/fotos
 * @example
 * // La galería de la ficha al elegir «Gato»
 * fotosDeEspecie('gato'); // [{ archivo: 'gato-1', especie: 'gato', fondo: 'sol', lado: 'derecha' }, …]
 */

/**
 * Una foto del catálogo.
 * @typedef {object} Foto
 * @property {string} archivo Nombre del archivo en `img/fotos/`, sin la extensión: `'perro-1'` es
 *   `img/fotos/perro-1.webp`. Es lo que se guarda en el campo `foto` del animal.
 * @property {'perro' | 'gato' | 'conejo' | 'otro'} especie La especie del animal de la foto: uno
 *   de los `value` de la lista `#especie` de la ficha.
 * @property {'sol' | 'azul' | 'cielo'} fondo El color del arco que mejor le va, para `data-fondo`.
 *   `sol` es el color que el CSS pone si no hay otro.
 * @property {'centro' | 'derecha' | 'izquierda'} lado Por dónde corta al animal la foto original,
 *   para `data-lado`: ese lado se pega al borde del arco y no se ve el corte. `centro` es la
 *   posición que el CSS pone si no hay otra.
 */

/**
 * Todas las fotos de `img/fotos/`, ordenadas por especie.
 * @type {ReadonlyArray<Foto>}
 */
export const FOTOS = Object.freeze(
  [
    { archivo: 'perro-1', especie: 'perro', fondo: 'sol', lado: 'centro' },
    { archivo: 'perro-2', especie: 'perro', fondo: 'sol', lado: 'derecha' },
    { archivo: 'perro-3', especie: 'perro', fondo: 'azul', lado: 'centro' },
    { archivo: 'perro-4', especie: 'perro', fondo: 'sol', lado: 'centro' },
    { archivo: 'perro-5', especie: 'perro', fondo: 'azul', lado: 'derecha' },
    { archivo: 'perro-6', especie: 'perro', fondo: 'azul', lado: 'centro' },
    { archivo: 'perro-7', especie: 'perro', fondo: 'cielo', lado: 'derecha' },
    { archivo: 'perro-8', especie: 'perro', fondo: 'cielo', lado: 'derecha' },
    { archivo: 'perro-9', especie: 'perro', fondo: 'cielo', lado: 'centro' },
    { archivo: 'gato-1', especie: 'gato', fondo: 'sol', lado: 'derecha' },
    { archivo: 'gato-2', especie: 'gato', fondo: 'sol', lado: 'derecha' },
    { archivo: 'gato-3', especie: 'gato', fondo: 'sol', lado: 'centro' },
    { archivo: 'gato-4', especie: 'gato', fondo: 'sol', lado: 'izquierda' },
    { archivo: 'gato-5', especie: 'gato', fondo: 'azul', lado: 'centro' },
    { archivo: 'gato-6', especie: 'gato', fondo: 'azul', lado: 'centro' },
    { archivo: 'gato-7', especie: 'gato', fondo: 'cielo', lado: 'centro' },
    { archivo: 'conejo-1', especie: 'conejo', fondo: 'sol', lado: 'centro' },
    { archivo: 'conejo-3', especie: 'conejo', fondo: 'azul', lado: 'centro' },
    { archivo: 'conejo-4', especie: 'conejo', fondo: 'cielo', lado: 'centro' },
    { archivo: 'otro-1', especie: 'otro', fondo: 'azul', lado: 'derecha' },
    { archivo: 'otro-2', especie: 'otro', fondo: 'azul', lado: 'centro' },
    { archivo: 'otro-3', especie: 'otro', fondo: 'azul', lado: 'centro' },
    { archivo: 'otro-4', especie: 'otro', fondo: 'sol', lado: 'centro' },
  ].map((foto) => Object.freeze(foto)),
);

/**
 * Devuelve las fotos de una especie, en el orden del catálogo. Es lo que pinta la galería de la
 * ficha al elegir la especie.
 * @param {string} especie El `value` elegido en la lista `#especie` (`'perro'`, `'gato'`…).
 * @returns {Foto[]} Una lista nueva con sus fotos; vacía si la especie no existe o está sin elegir.
 * @example
 * fotosDeEspecie('conejo').map((foto) => foto.archivo); // ['conejo-1', 'conejo-3', 'conejo-4']
 * fotosDeEspecie(''); // []
 */
export function fotosDeEspecie(especie) {
  return FOTOS.filter((foto) => foto.especie === especie);
}

/**
 * Busca una foto por su archivo: así el listado, el perfil y la cartilla saben qué `fondo` y qué
 * `lado` ponerle a la foto guardada en un animal.
 * @param {string} archivo El campo `foto` del animal, sin extensión (`'perro-1'`).
 * @returns {Foto | null} La foto, o `null` si no está en el catálogo.
 * @example
 * buscarFoto('gato-4'); // { archivo: 'gato-4', especie: 'gato', fondo: 'sol', lado: 'izquierda' }
 * buscarFoto('loro-1'); // null
 */
export function buscarFoto(archivo) {
  return FOTOS.find((foto) => foto.archivo === archivo) ?? null;
}
