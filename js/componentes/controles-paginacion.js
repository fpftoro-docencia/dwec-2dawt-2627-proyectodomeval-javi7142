/**
 * Controles de paginación: «Anterior», los números de página y «Siguiente», creados desde el
 * código. Los comparten el listado de animales y la zona de administración.
 *
 * El componente no conoce el listado, ni los datos, ni la dirección: recibe el contenedor
 * (`#paginacion`), la página actual y el total, y avisa del número de la página que se pulsa. Quien
 * lo usa decide qué hacer (pintar esa página, guardarla en `?pagina=`…). Son dos funciones
 * separadas porque se llaman en momentos distintos:
 * - `iniciarControles` se llama una sola vez, al arrancar la página, y conecta el único oyente;
 * - `pintarControles` se llama cada vez que cambia la página o el número de páginas (al buscar,
 *   filtrar o borrar), y vuelve a crear los botones.
 *
 * Como el oyente está en el contenedor y no en cada botón, sigue funcionando aunque los botones se
 * creen de nuevo (delegación de eventos con `closest`).
 *
 * Los estilos son los de `.pagination` de `estilos.css`; el código solo pone clases y atributos
 * (`disabled`, `aria-current`, `data-pagina`, `hidden`).
 *
 * @module componentes/controles-paginacion
 */

/**
 * Crea un botón de la paginación dentro de su `li`.
 * @param {string|number} texto Lo que se lee en el botón: «Anterior», «Siguiente» o el número.
 * @param {number} pagina La página a la que lleva; se guarda en `data-pagina`.
 * @param {object} [opciones]
 * @param {boolean} [opciones.desactivada] `true` en «Anterior» y «Siguiente» cuando están en un extremo.
 * @param {boolean} [opciones.actual] `true` en el número de la página que se está viendo.
 * @returns {HTMLLIElement}
 */
function crearControl(texto, pagina, { desactivada = false, actual = false } = {}) {
  const elemento = document.createElement('li');
  elemento.className = 'page-item';
  elemento.classList.toggle('disabled', desactivada);
  elemento.classList.toggle('active', actual);
  const boton = document.createElement('button');
  boton.className = 'page-link';
  boton.type = 'button';
  boton.textContent = String(texto);
  boton.dataset.pagina = String(pagina);
  boton.disabled = desactivada;
  if (typeof texto === 'number') {
    boton.setAttribute('aria-label', `Página ${texto}`);
  }
  if (actual) {
    boton.setAttribute('aria-current', 'page');
  }
  elemento.append(boton);
  return elemento;
}

/**
 * Pinta los controles dentro del contenedor, sustituyendo lo que hubiera: «Anterior», un número
 * por página y «Siguiente». «Anterior» se desactiva en la página 1 y «Siguiente» en la última; el
 * número de la página actual lleva `aria-current="page"`.
 *
 * Con una sola página (`total` 1 o menos) no hay nada que elegir: el contenedor se vacía y se
 * oculta con `hidden`. Al volver a haber varias páginas, se muestra otra vez.
 *
 * Si el foco estaba dentro de los controles (se acaba de pulsar uno con el teclado), pasa al
 * número de la página actual: los botones antiguos desaparecen y, sin esto, el foco se perdería.
 *
 * No corrige los números: se espera la página ya corregida que devuelve `paginar`.
 * @param {HTMLElement} contenedor El elemento donde van los controles (`#paginacion`).
 * @param {number} pagina La página actual, de 1 a `total`.
 * @param {number} total Cuántas páginas hay (`totalPaginas` de `paginar`).
 * @example
 * const { elementos, pagina, totalPaginas } = paginar(animales, 2, 6);
 * pintarControles(document.querySelector('#paginacion'), pagina, totalPaginas);
 */
export function pintarControles(contenedor, pagina, total) {
  const teniaFoco = contenedor.contains(document.activeElement);
  if (total <= 1) {
    contenedor.replaceChildren();
    contenedor.hidden = true;
    return;
  }
  const lista = document.createElement('ul');
  lista.className = 'pagination';
  lista.append(crearControl('Anterior', pagina - 1, { desactivada: pagina <= 1 }));
  for (let numero = 1; numero <= total; numero += 1) {
    lista.append(crearControl(numero, numero, { actual: numero === pagina }));
  }
  lista.append(crearControl('Siguiente', pagina + 1, { desactivada: pagina >= total }));
  contenedor.replaceChildren(lista);
  contenedor.hidden = false;
  if (teniaFoco) {
    lista.querySelector('[aria-current="page"]')?.focus();
  }
}

/**
 * Conecta los controles con un único oyente en el contenedor (delegación). Cuando se pulsa un
 * botón que no está desactivado, llama a `alCambiar` con el número de su página. No pinta nada:
 * quien recibe el aviso vuelve a pintar la lista y, con ella, los controles (`pintarControles`).
 * @param {HTMLElement} contenedor El mismo elemento que se usa en `pintarControles`.
 * @param {function(number): void} alCambiar Recibe la página pulsada, como número. También se
 *   llama si se pulsa el número de la página que ya se está viendo.
 * @listens click
 * @example
 * iniciarControles(document.querySelector('#paginacion'), (pagina) => {
 *   paginaActual = pagina;
 *   pintarListado();
 * });
 */
export function iniciarControles(contenedor, alCambiar) {
  contenedor.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-pagina]:not(:disabled)');
    if (boton) {
      alCambiar(Number(boton.dataset.pagina));
    }
  });
}
