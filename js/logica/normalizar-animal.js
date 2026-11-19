/**
 * Normalizar el animal: pasa lo leído del formulario de la ficha con `FormData` al objeto que se
 * guarda, con la forma de la tabla «La entidad» del README (el `@typedef Animal` de
 * `datos/animales.js`, todavía sin `id`: lo pone el módulo de datos al darlo de alta).
 *
 * Es una función pura: no toca la página ni el almacenamiento, y no valida (eso se hace antes de
 * guardar). Solo ordena los datos:
 * - quita los espacios de los lados a los textos;
 * - pasa el peso a número y la casilla a `true` o `false`;
 * - junta los datos del adoptante (`adoptanteNombre`, `adoptanteDni` y `adoptanteTelefono`) en
 *   `adopcion`, que vale `null` si el estado no es «Adoptado»;
 * - deja `fechaEsterilizacion` a `null` si no está esterilizado, y el teléfono a `null` si está
 *   vacío;
 * - junta cada vacuna con su fecha con `getAll`, en el orden de la ficha.
 *
 * Aunque los campos condicionales desactivados ya no llegan en `FormData`, la función no se fía:
 * decide por la casilla y el estado.
 *
 * @module logica/normalizar-animal
 */

/**
 * Pasa lo leído del formulario de la ficha al animal que se guarda.
 * @param {FormData} datos Lo leído con `new FormData(formulario)`.
 * @returns {object} El animal sin `id`, con los campos del `@typedef Animal`.
 * @example
 * normalizarAnimal(new FormData(formulario));
 * // { nombre: 'Toby', especie: 'perro', …, esterilizado: false, fechaEsterilizacion: null,
 * //   adopcion: null, vacunas: [{ tipo: 'rabia', fecha: '2026-10-15' }] }
 */
export function normalizarAnimal(datos) {
  const texto = (nombre) => String(datos.get(nombre) ?? '').trim();
  const esterilizado = datos.get('esterilizado') !== null;
  const adoptado = texto('estado') === 'adoptado';
  const fechasVacunas = datos.getAll('vacunaFecha');

  return {
    nombre: texto('nombre'),
    especie: texto('especie'),
    sexo: texto('sexo'),
    ingreso: texto('ingreso'),
    peso: Number(texto('peso')),
    microchip: texto('microchip'),
    foto: texto('foto'),
    estado: texto('estado'),
    esterilizado,
    fechaEsterilizacion: esterilizado ? texto('fechaEsterilizacion') || null : null,
    adopcion: adoptado
      ? {
          nombre: texto('adoptanteNombre'),
          dni: texto('adoptanteDni'),
          telefono: texto('adoptanteTelefono') || null,
        }
      : null,
    vacunas: datos.getAll('vacunaTipo').map((tipo, indice) => ({
      tipo: String(tipo).trim(),
      fecha: String(fechasVacunas[indice] ?? '').trim(),
    })),
  };
}
