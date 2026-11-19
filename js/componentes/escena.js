// Escena de las portadas: cada cierto tiempo cambia de animal y, con él, el color de todo el fondo.
// Es solo decoración: el JavaScript mueve la clase `activo` y el atributo `data-mundo`; el fundido es CSS.

const SEGUNDOS_POR_ANIMAL = 6;

/**
 * Pone en marcha el pase de animales.
 * @param {HTMLElement} escena Contenedor con `[data-animal]` (con `data-mundo` y `data-pie`) y un
 *   `[data-pie-texto]` para el texto.
 */
export function iniciarEscena(escena) {
  // Quien prefiere menos movimiento ve siempre el primer animal
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const animales = [...escena.querySelectorAll('[data-animal]')];
  const pie = escena.querySelector('[data-pie-texto]');
  let actual = 0;

  setInterval(() => {
    animales[actual].classList.remove('activo');
    actual = (actual + 1) % animales.length;
    const animal = animales[actual];
    animal.classList.add('activo');
    escena.dataset.mundo = animal.dataset.mundo;
    pie.textContent = animal.dataset.pie;
  }, SEGUNDOS_POR_ANIMAL * 1000);
}
