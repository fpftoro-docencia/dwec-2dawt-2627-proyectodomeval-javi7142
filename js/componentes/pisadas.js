// Rastro de pisadas: el puntero deja huellas que se desvanecen al pasar por la portada.
// La posición no se calcula: el contenedor es una rejilla de casillas invisibles y la casilla por la
// que pasa el puntero recibe una clase. Así el JavaScript no escribe ningún estilo.

/** Casillas de la rejilla: de sobra para cubrir una pantalla grande. El CSS recorta las que sobran. */
const CASILLAS = 700;

/**
 * Crea las casillas y deja las pisadas con un solo oyente (delegación).
 * @param {HTMLElement} contenedor Elemento vacío con la clase `pisadas`.
 * @listens pointerover
 * @listens animationend
 */
export function iniciarPisadas(contenedor) {
  const casillas = document.createDocumentFragment();
  for (let i = 0; i < CASILLAS; i += 1) {
    const casilla = document.createElement('span');
    casilla.className = 'pisada';
    casillas.append(casilla);
  }
  contenedor.replaceChildren(casillas);

  contenedor.addEventListener('pointerover', (evento) => {
    const casilla = evento.target.closest('.pisada');
    if (casilla) {
      casilla.classList.add('pisada--marcada');
    }
  });

  // Al terminar la animación la casilla queda libre para otra pisada
  contenedor.addEventListener('animationend', (evento) => {
    evento.target.classList.remove('pisada--marcada');
  });
}
