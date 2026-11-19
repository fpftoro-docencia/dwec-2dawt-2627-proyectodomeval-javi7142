/**
 * Rellenar la ficha: pone en los campos del formulario los datos de un animal guardado, para
 * editarlo. Es lo contrario de `normalizarAnimal`: de `adopcion` saca los tres campos del
 * adoptante y de `fechaEsterilizacion` y `telefono` a `null` deja el campo vacío.
 *
 * Solo escribe valores (`value` y `checked`). La foto y las vacunas no van aquí, porque dependen de
 * la galería y del grupo de vacunas; y como cambiar un valor desde el código no lanza `input` ni
 * `change`, quien lo llama vuelve a poner después los campos condicionales y la cartilla.
 *
 * @module componentes/rellenar-ficha
 */

/**
 * Pone en el formulario de la ficha los datos de un animal guardado.
 * @param {HTMLFormElement} formulario El formulario `#formulario-animal`.
 * @param {module:datos/animales~Animal} animal
 * @example
 * rellenarFicha(formulario, buscarAnimal(localStorage, 'lola', id));
 */
export function rellenarFicha(formulario, animal) {
  const campos = formulario.elements;
  campos.nombre.value = animal.nombre;
  campos.especie.value = animal.especie ?? '';
  // En un grupo de botones de opción, dar valor al grupo marca el botón que lo tiene
  campos.sexo.value = animal.sexo ?? '';
  campos.ingreso.value = animal.ingreso ?? '';
  campos.peso.value = Number.isFinite(animal.peso) ? String(animal.peso) : '';
  campos.microchip.value = animal.microchip ?? '';
  campos.estado.value = animal.estado ?? 'acogida';
  campos.esterilizado.checked = animal.esterilizado === true;
  campos.fechaEsterilizacion.value = animal.fechaEsterilizacion ?? '';
  campos.adoptanteNombre.value = animal.adopcion?.nombre ?? '';
  campos.adoptanteDni.value = animal.adopcion?.dni ?? '';
  campos.adoptanteTelefono.value = animal.adopcion?.telefono ?? '';
}
