// Test de integración del listado: la página real (`listado.html` y todos sus módulos) en happy-dom,
// con el usuario simulado (UD5, tema 9 y UD6, tema 7; requisito 21). Solo se sustituyen el
// almacenamiento (`AlmacenFalso`), la navegación (`vi.fn()`) y la dirección (un doble con `leer` y
// `guardar`); el tiempo del buscador se adelanta con `vi.useFakeTimers()`, sin esperas reales.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { cargarPagina, escribir } from '../pagina.js';
import { claveAnimales } from '../../js/datos/animales.js';
import { CLAVE_SESION } from '../../js/datos/sesion.js';

/** La función de la página; se importa en `beforeAll`, después de dejar lista una sesión (ver allí). */
let iniciarListado;

const USUARIO = 'lola';

/**
 * Un animal con los datos justos para pintarlo en el listado.
 * @param {number} numero Distingue un animal de otro (id y nombre).
 * @param {object} [cambios] Datos que sustituyen a los de por defecto.
 */
function animal(numero, cambios = {}) {
  return {
    id: `a${numero}`,
    nombre: `Animal ${numero}`,
    especie: 'perro',
    sexo: 'hembra',
    peso: 10,
    estado: 'acogida',
    foto: 'perro-1',
    microchip: '',
    vacunas: [],
    ...cambios,
  };
}

/** Una lista de `cantidad` animales: «Animal 1», «Animal 2»… */
const variosAnimales = (cantidad) =>
  Array.from({ length: cantidad }, (_, indice) => animal(indice + 1));

/**
 * Carga `listado.html` y la inicia con dobles. La dirección es un doble con memoria: `guardar`
 * cambia lo que devuelve `leer`, como haría `history.replaceState`.
 * @param {object} [opciones]
 * @param {Array<object>} [opciones.animales] Los animales de Lola.
 * @param {string} [opciones.consulta] La dirección con la que se abre la página, p. ej. `'?pagina=2'`.
 * @param {boolean} [opciones.conSesion] `false` para entrar sin haber iniciado sesión.
 */
function preparar({ animales = [], consulta = '', conSesion = true } = {}) {
  cargarPagina('listado.html');
  const almacenSesion = new AlmacenFalso();
  const almacenAnimales = new AlmacenFalso();
  if (conSesion) {
    almacenSesion.setItem(CLAVE_SESION, JSON.stringify({ usuario: USUARIO, rol: 'usuario' }));
  }
  almacenAnimales.setItem(claveAnimales(USUARIO), JSON.stringify(animales));
  let direccionActual = consulta;
  const navegar = vi.fn();
  const direccion = {
    leer: vi.fn(() => direccionActual),
    guardar: vi.fn((nueva) => {
      direccionActual = nueva;
    }),
  };
  iniciarListado(document, { almacenSesion, almacenAnimales, navegar, direccion });
  return { almacenSesion, almacenAnimales, navegar, direccion };
}

const buscador = () => document.querySelector('#buscador');
const nombresPintados = () =>
  [...document.querySelectorAll('#lista-animales .animal__nombre')].map((n) => n.textContent);
const contador = () => document.querySelector('#contador').textContent;
const sinResultados = () => document.querySelector('#sin-resultados');
const botonFiltro = (filtro) => document.querySelector(`[data-filtro="${filtro}"]`);
const cifra = (estadistica) => document.querySelector(`[data-estadistica="${estadistica}"]`);
const botonPagina = (texto) =>
  [...document.querySelectorAll('#paginacion .page-link')].find((b) => b.textContent === texto);

/** Teclea en el buscador y deja pasar el *debounce* (250 ms) con el reloj falso. */
function buscar(texto) {
  escribir(buscador(), texto);
  vi.advanceTimersByTime(250);
}

describe('listado.html en happy-dom', () => {
  beforeAll(async () => {
    // El `<body>` de la página trae su `<script type="module">`, que happy-dom no carga: que lo dé
    // por bueno en vez de escribir un error en la consola con cada página cargada
    window.happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
    // `listado.js` se inicia sola al importarla, con `sessionStorage`, `localStorage` y `location`
    // reales. Se importa una vez, con la página y una sesión reales a mano, para que esa primera puesta
    // en marcha no navegue ni falle; después cada test inicia la página con sus dobles.
    cargarPagina('listado.html');
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: USUARIO, rol: 'usuario' }));
    ({ iniciarListado } = await import('../../js/paginas/listado.js'));
    sessionStorage.clear();
    localStorage.clear();
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  describe('al abrir la página', () => {
    it('sin sesión, lleva a index.html y no pinta ningún animal', () => {
      const { navegar } = preparar({ animales: variosAnimales(3), conSesion: false });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('index.html');
      expect(nombresPintados()).toEqual([]);
    });

    it('pinta seis animales por página, el contador con el total y dos páginas', () => {
      preparar({ animales: variosAnimales(8) });
      expect(nombresPintados()).toEqual([
        'Animal 1',
        'Animal 2',
        'Animal 3',
        'Animal 4',
        'Animal 5',
        'Animal 6',
      ]);
      expect(contador()).toBe('8 animales');
      expect(
        document.querySelectorAll('#paginacion .page-link[aria-label^="Página"]'),
      ).toHaveLength(2);
      expect(document.querySelector('#saludo').textContent).toBe('Hola, lola');
    });

    it('solo enseña los animales del usuario con la sesión iniciada', () => {
      const { almacenAnimales } = preparar({ animales: variosAnimales(2) });
      almacenAnimales.setItem(claveAnimales('marcos'), JSON.stringify([animal(9)]));
      expect(nombresPintados()).toEqual(['Animal 1', 'Animal 2']);
    });

    it('con una sola página, oculta los controles de paginación', () => {
      preparar({ animales: variosAnimales(6) });
      expect(document.querySelector('#paginacion').hidden).toBe(true);
    });
  });

  describe('contador y mensaje de «no hay nada»', () => {
    it('sin animales, dice 0 animales, enseña el mensaje de bienvenida y oculta «Limpiar»', () => {
      preparar({ animales: [] });
      expect(contador()).toBe('0 animales');
      expect(sinResultados().hidden).toBe(false);
      expect(document.querySelector('#vacio-titulo').textContent).toBe(
        'Todavía no tienes animales',
      );
      expect(document.querySelector('#limpiar-filtros').hidden).toBe(true);
    });

    it('con un solo animal, el contador va en singular', () => {
      preparar({ animales: variosAnimales(1) });
      expect(contador()).toBe('1 animal');
      expect(sinResultados().hidden).toBe(true);
    });

    it('una búsqueda sin coincidencias enseña el mensaje de «ningún animal con ese nombre»', () => {
      preparar({ animales: variosAnimales(3) });
      buscar('zzz');
      expect(nombresPintados()).toEqual([]);
      expect(contador()).toBe('0 animales');
      expect(sinResultados().hidden).toBe(false);
      expect(document.querySelector('#vacio-titulo').textContent).toBe(
        'No hay ningún animal con ese nombre',
      );
    });

    it('«Limpiar» vacía el buscador, vuelve a enseñar todos y pone el foco en el buscador', () => {
      preparar({ animales: variosAnimales(3) });
      buscar('zzz');
      document.querySelector('#limpiar-filtros').click();
      expect(buscador().value).toBe('');
      expect(nombresPintados()).toHaveLength(3);
      expect(sinResultados().hidden).toBe(true);
      expect(document.activeElement).toBe(buscador());
    });
  });

  describe('el buscador y su debounce de 250 ms', () => {
    const animales = [
      animal(1, { nombre: 'Simón', especie: 'gato', microchip: '941000012345678' }),
      animal(2, { nombre: 'Luna' }),
      animal(3, { nombre: 'Lupe', especie: 'conejo' }),
    ];

    it('antes de que pasen los 250 ms no filtra, y después sí', () => {
      preparar({ animales });
      escribir(buscador(), 'lu');
      vi.advanceTimersByTime(249);
      expect(nombresPintados()).toEqual(['Simón', 'Luna', 'Lupe']);
      vi.advanceTimersByTime(1);
      expect(nombresPintados()).toEqual(['Luna', 'Lupe']);
      expect(contador()).toBe('2 animales');
    });

    it('si se sigue tecleando, la cuenta empieza de nuevo y solo se busca una vez al final', () => {
      preparar({ animales });
      escribir(buscador(), 'l');
      vi.advanceTimersByTime(200);
      escribir(buscador(), 'lun');
      vi.advanceTimersByTime(200); // 400 ms desde la primera tecla, pero solo 200 desde la última
      expect(nombresPintados()).toEqual(['Simón', 'Luna', 'Lupe']);
      vi.advanceTimersByTime(50);
      expect(nombresPintados()).toEqual(['Luna']);
    });

    it.each([
      ['sin tildes ni mayúsculas', 'SIMON', ['Simón']],
      ['por la especie, como se lee', 'conejo', ['Lupe']],
      ['por el microchip', '12345', ['Simón']],
      ['con espacios alrededor', '  luna  ', ['Luna']],
      ['un texto de solo espacios no filtra', '   ', ['Simón', 'Luna', 'Lupe']],
    ])('encuentra %s', (_motivo, texto, esperados) => {
      preparar({ animales });
      buscar(texto);
      expect(nombresPintados()).toEqual(esperados);
    });

    it('al buscar desde otra página, vuelve a la página 1 y lo escribe en la dirección', () => {
      const { direccion } = preparar({ animales: variosAnimales(8), consulta: '?pagina=2' });
      expect(nombresPintados()).toEqual(['Animal 7', 'Animal 8']);
      buscar('animal');
      expect(nombresPintados()).toHaveLength(6);
      expect(direccion.guardar).toHaveBeenLastCalledWith('?pagina=1');
    });
  });

  describe('el cambio de página', () => {
    it('al pulsar un número, enseña esa página y la escribe en la dirección', () => {
      const { direccion } = preparar({ animales: variosAnimales(8) });
      botonPagina('2').click();
      expect(nombresPintados()).toEqual(['Animal 7', 'Animal 8']);
      expect(direccion.guardar).toHaveBeenLastCalledWith('?pagina=2');
      expect(botonPagina('2').getAttribute('aria-current')).toBe('page');
      expect(botonPagina('1').hasAttribute('aria-current')).toBe(false);
    });

    it('«Siguiente» y «Anterior» van de una página a otra', () => {
      const { direccion } = preparar({ animales: variosAnimales(8) });
      botonPagina('Siguiente').click();
      expect(direccion.guardar).toHaveBeenLastCalledWith('?pagina=2');
      botonPagina('Anterior').click();
      expect(direccion.guardar).toHaveBeenLastCalledWith('?pagina=1');
      expect(nombresPintados()[0]).toBe('Animal 1');
    });

    it('en los extremos, «Anterior» y «Siguiente» están desactivados', () => {
      preparar({ animales: variosAnimales(8) });
      expect(botonPagina('Anterior').disabled).toBe(true);
      expect(botonPagina('Siguiente').disabled).toBe(false);
      botonPagina('2').click();
      expect(botonPagina('Anterior').disabled).toBe(false);
      expect(botonPagina('Siguiente').disabled).toBe(true);
    });

    it('con ?pagina=2 en la dirección, empieza en la página 2', () => {
      preparar({ animales: variosAnimales(8), consulta: '?pagina=2' });
      expect(nombresPintados()).toEqual(['Animal 7', 'Animal 8']);
    });

    it.each([
      [
        'una página que no existe, enseña la última',
        '?pagina=99',
        ['Animal 7', 'Animal 8'],
        '?pagina=2',
      ],
      ['cero, enseña la primera', '?pagina=0', 6, '?pagina=1'],
      ['un texto, enseña la primera', '?pagina=abc', 6, '?pagina=1'],
      ['un negativo, enseña la primera', '?pagina=-3', 6, '?pagina=1'],
      ['sin ?pagina, enseña la primera y la escribe', '', 6, '?pagina=1'],
    ])('con %s', (_caso, consulta, esperado, corregida) => {
      const { direccion } = preparar({ animales: variosAnimales(8), consulta });
      if (Array.isArray(esperado)) {
        expect(nombresPintados()).toEqual(esperado);
      } else {
        expect(nombresPintados()).toHaveLength(esperado);
      }
      expect(direccion.guardar).toHaveBeenLastCalledWith(corregida);
    });

    it('conserva los demás parámetros de la dirección', () => {
      const { direccion } = preparar({ animales: variosAnimales(8), consulta: '?otro=1&pagina=2' });
      expect(direccion.guardar).toHaveBeenLastCalledWith('?otro=1&pagina=2');
    });
  });

  describe('los filtros por estado', () => {
    const animales = [
      animal(1, { estado: 'acogida' }),
      animal(2, { estado: 'disponible' }),
      animal(3, { estado: 'disponible' }),
      animal(4, { estado: 'adoptado' }),
    ];

    it('cada botón cuenta los animales de su estado y las cifras suman el total', () => {
      preparar({ animales });
      expect(cifra('total').textContent).toBe('4');
      expect(cifra('acogida').textContent).toBe('1');
      expect(cifra('disponible').textContent).toBe('2');
      expect(cifra('adoptado').textContent).toBe('1');
    });

    it('al elegir un estado, solo salen los de ese estado y el botón queda marcado', () => {
      preparar({ animales });
      botonFiltro('disponible').click();
      expect(nombresPintados()).toEqual(['Animal 2', 'Animal 3']);
      expect(contador()).toBe('2 animales');
      expect(botonFiltro('disponible').getAttribute('aria-pressed')).toBe('true');
      expect(botonFiltro('todos').getAttribute('aria-pressed')).toBe('false');
    });

    it('«Todos» devuelve la lista entera', () => {
      preparar({ animales });
      botonFiltro('adoptado').click();
      botonFiltro('todos').click();
      expect(nombresPintados()).toHaveLength(4);
    });

    it('se combina con el buscador', () => {
      preparar({ animales });
      botonFiltro('disponible').click();
      buscar('3');
      expect(nombresPintados()).toEqual(['Animal 3']);
    });

    it('un estado sin animales enseña su mensaje, distinto del de la búsqueda', () => {
      preparar({ animales: [animal(1, { estado: 'acogida' })] });
      botonFiltro('adoptado').click();
      expect(sinResultados().hidden).toBe(false);
      expect(document.querySelector('#vacio-titulo').textContent).toBe(
        'No hay animales en ese estado',
      );
    });

    it('al cambiar de filtro desde otra página, vuelve a la página 1', () => {
      const muchos = variosAnimales(8).map((a, i) => ({
        ...a,
        estado: i < 7 ? 'acogida' : 'disponible',
      }));
      const { direccion } = preparar({ animales: muchos, consulta: '?pagina=2' });
      botonFiltro('acogida').click();
      expect(direccion.guardar).toHaveBeenLastCalledWith('?pagina=1');
      expect(nombresPintados()).toHaveLength(6);
    });
  });

  describe('borrar un animal con el diálogo', () => {
    const botonBorrar = (numero) =>
      document.querySelector(`.animal[data-id="a${numero}"] [data-accion="borrar"]`);

    it('«Borrar» abre el diálogo con el nombre del animal y no borra nada todavía', () => {
      const { almacenAnimales } = preparar({ animales: variosAnimales(3) });
      botonBorrar(2).click();
      expect(document.querySelector('#dialogo-borrar').open).toBe(true);
      expect(document.querySelector('#dialogo-nombre').textContent).toBe('Animal 2');
      expect(JSON.parse(almacenAnimales.getItem(claveAnimales(USUARIO)))).toHaveLength(3);
    });

    it('al confirmar, borra el animal, vuelve a pintar, avisa y lleva el foco a la primera tarjeta', () => {
      const { almacenAnimales } = preparar({ animales: variosAnimales(3) });
      botonBorrar(2).click();
      document.querySelector('#dialogo-borrar').close('confirmar');
      expect(nombresPintados()).toEqual(['Animal 1', 'Animal 3']);
      expect(contador()).toBe('2 animales');
      expect(JSON.parse(almacenAnimales.getItem(claveAnimales(USUARIO)))).toHaveLength(2);
      expect(document.querySelector('#avisos').textContent).toBe(
        'Has borrado la ficha de Animal 2.',
      );
      expect(document.activeElement).toBe(document.querySelector('.animal__retrato'));
    });

    it.each([
      ['Cancelar', 'cancelar'],
      ['cerrar con Esc, que no deja valor', ''],
    ])('al %s, no se borra nada', (_caso, valor) => {
      const { almacenAnimales } = preparar({ animales: variosAnimales(3) });
      botonBorrar(2).click();
      document.querySelector('#dialogo-borrar').close(valor);
      expect(nombresPintados()).toHaveLength(3);
      expect(JSON.parse(almacenAnimales.getItem(claveAnimales(USUARIO)))).toHaveLength(3);
      expect(document.querySelector('#avisos').textContent).toBe('');
    });

    it('al borrar el último animal, enseña el mensaje de bienvenida y el foco pasa al buscador', () => {
      preparar({ animales: variosAnimales(1) });
      botonBorrar(1).click();
      document.querySelector('#dialogo-borrar').close('confirmar');
      expect(nombresPintados()).toEqual([]);
      expect(document.querySelector('#vacio-titulo').textContent).toBe(
        'Todavía no tienes animales',
      );
      expect(document.activeElement).toBe(buscador());
    });
  });
});
