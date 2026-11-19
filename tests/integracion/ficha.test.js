// Test de integración de la ficha: la página real (`ficha.html` y todos sus módulos) en happy-dom, con
// el usuario simulado (UD5, tema 9 y UD6, tema 7; requisito 21). Solo se sustituyen el almacenamiento
// (`AlmacenFalso`), la navegación (`vi.fn()`), la fecha de hoy y la dirección (la cadena `?id=…`); la
// ficha no usa el resumen de la contraseña. Se comprueba la validación al salir y al escribir, el
// envío con errores y, sobre todo, el objeto completo que se guarda.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { cargarPagina, escribir, salir } from '../pagina.js';
import { CLAVE_AVISO } from '../../js/componentes/avisos.js';
import { claveAnimales } from '../../js/datos/animales.js';
import { CLAVE_SESION } from '../../js/datos/sesion.js';

/** La función de la página; se importa en `beforeAll`, después de dejar lista una sesión (ver allí). */
let iniciarFicha;

const USUARIO = 'lola';
const HOY = '2026-11-19';

/** El aviso de la página cuando se pide editar una ficha que no existe (`FICHA_NO_ENCONTRADA`). */
const AVISO_FICHA_NO_ENCONTRADA =
  'No hemos encontrado esa ficha. Puede que se haya borrado: elige un animal de tu lista.';

/** El `id` que se da a los animales nuevos (la página usa `crypto.randomUUID()`). */
const ID_NUEVO = 'id-de-prueba';

/**
 * Carga `ficha.html` y la inicia con dobles.
 * @param {object} [opciones]
 * @param {Array<object>} [opciones.animales] Los animales ya guardados de Lola.
 * @param {Array<object>} [opciones.deMarcos] Los de otro usuario, Marcos.
 * @param {string} [opciones.busqueda] La dirección con la que se abre la página, p. ej. `'?id=a1'`.
 * @param {boolean} [opciones.conSesion] `false` para entrar sin haber iniciado sesión.
 */
function preparar({ animales = [], deMarcos = [], busqueda = '', conSesion = true } = {}) {
  cargarPagina('ficha.html');
  // happy-dom da por mal un peso como 12.5 con `step="0.1"` (calcula `12.5 % 0.1` con decimales de
  // máquina y no da 0), cosa que un navegador de verdad no hace: se quita el paso y se siguen
  // comprobando los límites (`min` y `max`). El paso de los decimales lo cubren los E2E.
  campo('peso').step = 'any';
  // En un navegador, que una opción de un grupo sea `required` obliga a todo el grupo; happy-dom
  // mira cada botón por separado, así que `required` se pone también en el segundo del sexo
  campo('sexo-macho').required = true;
  // `cargarPagina` solo cambia el contenido del `<body>`: la marca de la página anterior se quita aquí
  delete document.body.dataset.sesionComprobada;
  const almacenSesion = new AlmacenFalso();
  const almacenAnimales = new AlmacenFalso();
  if (conSesion) {
    almacenSesion.setItem(CLAVE_SESION, JSON.stringify({ usuario: USUARIO, rol: 'usuario' }));
  }
  almacenAnimales.setItem(claveAnimales(USUARIO), JSON.stringify(animales));
  almacenAnimales.setItem(claveAnimales('marcos'), JSON.stringify(deMarcos));
  const navegar = vi.fn();
  iniciarFicha(document, { almacenSesion, almacenAnimales, navegar, hoy: HOY, busqueda });
  return { almacenSesion, almacenAnimales, navegar };
}

const formulario = () => document.querySelector('#formulario-animal');
const campo = (id) => document.querySelector(`#${id}`);
const textoError = (id) => document.querySelector(`#error-${id}`).textContent;
const guardados = (almacenAnimales) => JSON.parse(almacenAnimales.getItem(claveAnimales(USUARIO)));
const avisoDejado = (almacenSesion) => JSON.parse(almacenSesion.getItem(CLAVE_AVISO));
const botonGuardar = () => document.querySelector('[type="submit"]');

/** Hace lo que el navegador al cambiar una lista: `input` y después `change`. */
function elegir(lista, valor) {
  lista.value = valor;
  lista.dispatchEvent(new Event('input', { bubbles: true }));
  lista.dispatchEvent(new Event('change', { bubbles: true }));
}

/** Pulsa un botón de opción, un interruptor o una foto, como el usuario (lanza `change`). */
const pulsar = (elemento) => elemento.click();

/** Escribe en un campo de texto y sale de él, como el usuario que pasa al siguiente. */
function rellenar(id, valor) {
  escribir(campo(id), valor);
  salir(campo(id));
}

/** Añade una vacuna con el botón y rellena su lista y su fecha (la fila número `numero`). */
function anadirVacuna(numero, tipo, fecha) {
  pulsar(campo('anadir-vacuna'));
  elegir(campo(`vacuna-tipo-${numero}`), tipo);
  escribir(campo(`vacuna-fecha-${numero}`), fecha);
}

/** Rellena los campos obligatorios de un perro (sin foto elegida a mano: sale la primera). */
function rellenarPerro() {
  rellenar('nombre', 'Toby');
  elegir(campo('especie'), 'perro');
  pulsar(campo('sexo-macho'));
  escribir(campo('ingreso'), '2026-10-13');
  escribir(campo('peso'), '12.5');
  rellenar('microchip', '941000024681357');
}

/** Envía el formulario como el usuario (botón o Intro): lanza `submit`. */
const enviar = () => formulario().requestSubmit();

/** Un animal ya guardado, para probar la edición. */
const LUNA = {
  id: 'a1',
  nombre: 'Luna',
  especie: 'gato',
  sexo: 'hembra',
  ingreso: '2026-10-01',
  peso: 4.2,
  microchip: '941000011112222',
  foto: 'gato-3',
  estado: 'adoptado',
  esterilizado: true,
  fechaEsterilizacion: '2026-10-10',
  adopcion: { nombre: 'Marta Prueba', dni: '12345678Z', telefono: '612345678' },
  vacunas: [{ tipo: 'triple-felina', fecha: '2026-10-05' }],
};
const OTRO = { ...LUNA, id: 'a2', nombre: 'Simón', especie: 'perro', foto: 'perro-2' };

describe('ficha.html en happy-dom', () => {
  beforeAll(async () => {
    // El `<body>` de la página trae su `<script type="module">`, que happy-dom no carga: que lo dé
    // por bueno en vez de escribir un error en la consola con cada página cargada
    window.happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
    // `ficha.js` se inicia sola al importarla, con `sessionStorage`, `localStorage` y `location`
    // reales. Se importa una vez, con la página y una sesión reales a mano, para que esa primera
    // puesta en marcha no navegue ni falle; después cada test inicia la página con sus dobles.
    cargarPagina('ficha.html');
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify({ usuario: USUARIO, rol: 'usuario' }));
    ({ iniciarFicha } = await import('../../js/paginas/ficha.js'));
    sessionStorage.clear();
    localStorage.clear();
    // En happy-dom, `formulario.elements.sexo` (un grupo de botones de opción) solo deja leer `value`;
    // en un navegador también se puede escribir, y `rellenarFicha` lo hace al editar. Se añade aquí.
    const grupo = Object.getPrototypeOf(formulario().elements.sexo);
    const { get } = Object.getOwnPropertyDescriptor(grupo, 'value');
    Object.defineProperty(grupo, 'value', {
      configurable: true,
      get,
      set(valor) {
        this.forEach((radio) => {
          radio.checked = radio.value === valor;
        });
      },
    });
  });

  beforeEach(() => {
    // El `id` que pone el módulo de datos al dar de alta: así se puede comparar el animal entero
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(ID_NUEVO);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  describe('al abrir la página', () => {
    it('sin sesión, lleva a index.html y no enseña la página', () => {
      const { navegar } = preparar({ conSesion: false });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('index.html');
      expect(document.body.dataset.sesionComprobada).toBeUndefined();
    });

    it('con sesión, enseña la ficha vacía de un animal nuevo y pone el máximo de hoy en las fechas', () => {
      const { navegar } = preparar();
      expect(navegar).not.toHaveBeenCalled();
      expect(document.body.dataset.sesionComprobada).toBe('');
      expect(campo('titulo-ficha').textContent).toBe('Nuevo animal');
      expect(campo('nombre').value).toBe('');
      expect(campo('ingreso').max).toBe(HOY);
      expect(campo('fecha-esterilizacion').max).toBe(HOY);
    });

    it('los bloques de esterilización y de adopción empiezan ocultos y sus campos, desactivados', () => {
      preparar();
      expect(campo('bloque-esterilizacion').hidden).toBe(true);
      expect(campo('fecha-esterilizacion').disabled).toBe(true);
      expect(campo('bloque-adopcion').hidden).toBe(true);
      expect(campo('adoptante-dni').disabled).toBe(true);
    });
  });

  describe('la validación al salir y al escribir', () => {
    it('el error no sale al escribir por primera vez, sale al salir del campo y se quita al corregir', () => {
      preparar();
      const nombre = campo('nombre');
      escribir(nombre, 'A');
      expect(textoError('nombre')).toBe('');
      expect(nombre.classList.contains('is-invalid')).toBe(false);

      salir(nombre);
      expect(textoError('nombre')).toBe(
        'El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones.',
      );
      expect(nombre.classList.contains('is-invalid')).toBe(true);
      expect(nombre.getAttribute('aria-invalid')).toBe('true');

      escribir(nombre, 'Toby');
      expect(textoError('nombre')).toBe('');
      expect(nombre.classList.contains('is-invalid')).toBe(false);
      expect(nombre.getAttribute('aria-invalid')).toBe('false');
    });

    it('una vez tocado, el error vuelve a salir con cada letra mientras sigue mal', () => {
      preparar();
      salir(campo('nombre'));
      expect(textoError('nombre')).toBe('Escribe el nombre del animal.');
      escribir(campo('nombre'), 'T');
      expect(textoError('nombre')).toContain('El nombre empieza por una letra');
      escribir(campo('nombre'), 'To');
      expect(textoError('nombre')).toBe('');
    });

    it.each([
      ['el nombre vacío', 'nombre', '', 'Escribe el nombre del animal.'],
      [
        'un nombre que empieza por una cifra',
        'nombre',
        '4toby',
        'El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones.',
      ],
      ['la especie sin elegir', 'especie', '', 'Elige una especie.'],
      ['la fecha de ingreso vacía', 'ingreso', '', 'Escribe la fecha de ingreso.'],
      ['el peso vacío', 'peso', '', 'Escribe el peso en kilos.'],
      [
        'un peso de cero',
        'peso',
        '0',
        'El peso debe estar entre 0,1 y 100 kg, con un decimal como mucho.',
      ],
      [
        'un peso por encima de 100',
        'peso',
        '100.1',
        'El peso debe estar entre 0,1 y 100 kg, con un decimal como mucho.',
      ],
      ['el microchip vacío', 'microchip', '', 'Escribe el microchip: 15 dígitos.'],
      [
        'un microchip de 14 dígitos',
        'microchip',
        '94100002468135',
        'El microchip tiene 15 dígitos.',
      ],
      ['un microchip con letras', 'microchip', '94100002468135a', 'El microchip tiene 15 dígitos.'],
    ])('al salir con %s, el error es el de la tabla del README', (_motivo, id, valor, mensaje) => {
      preparar();
      escribir(campo(id), valor);
      salir(campo(id));
      expect(textoError(id)).toBe(mensaje);
      expect(campo(id).classList.contains('is-invalid')).toBe(true);
    });

    it.each([
      ['un nombre de 2 letras', 'nombre', 'Mo'],
      ['un nombre de 30 caracteres', 'nombre', `A${'b'.repeat(29)}`],
      ['un nombre con tilde, apóstrofo y guion', 'nombre', "Ñu d'Or-Sol"],
      ['el ingreso de hoy', 'ingreso', HOY],
      ['el peso mínimo', 'peso', '0.1'],
      ['el peso máximo', 'peso', '100'],
      ['un microchip de 15 dígitos con ceros delante', 'microchip', '000000000000001'],
    ])('al salir con %s, no hay error', (_motivo, id, valor) => {
      preparar();
      escribir(campo(id), valor);
      salir(campo(id));
      expect(textoError(id)).toBe('');
      expect(campo(id).classList.contains('is-invalid')).toBe(false);
    });

    it('el sexo sin elegir marca en rojo las dos opciones al enviar y se quita al elegir una', () => {
      preparar();
      enviar();
      expect(textoError('sexo')).toBe('Elige el sexo.');
      expect(campo('sexo-hembra').classList.contains('is-invalid')).toBe(true);
      expect(campo('sexo-macho').classList.contains('is-invalid')).toBe(true);
      pulsar(campo('sexo-macho'));
      escribir(campo('sexo-macho'), 'macho');
      expect(textoError('sexo')).toBe('');
      expect(campo('sexo-hembra').classList.contains('is-invalid')).toBe(false);
    });

    it('al salir del sexo sin elegir sale el error y se quita al elegir la otra opción (S2-18b)', () => {
      preparar();
      salir(campo('sexo-hembra'));
      expect(textoError('sexo')).toBe('Elige el sexo.');
      pulsar(campo('sexo-macho'));
      escribir(campo('sexo-macho'), 'macho');
      expect(textoError('sexo')).toBe('');
      expect(campo('sexo-macho').classList.contains('is-invalid')).toBe(false);
    });

    describe('los campos condicionales', () => {
      it('la fecha de esterilización no puede ser anterior al ingreso ni futura', () => {
        preparar();
        escribir(campo('ingreso'), '2026-10-13');
        pulsar(campo('esterilizado'));
        const mensaje = 'La esterilización no puede ser futura ni anterior al ingreso.';
        rellenar('fecha-esterilizacion', '2026-10-12');
        expect(textoError('fecha-esterilizacion')).toBe(mensaje);
        rellenar('fecha-esterilizacion', '2026-11-20');
        expect(textoError('fecha-esterilizacion')).toBe(mensaje);
        escribir(campo('fecha-esterilizacion'), '2026-10-13');
        expect(textoError('fecha-esterilizacion')).toBe('');
      });

      it('si se cambia el ingreso, la fecha de esterilización ya tocada se vuelve a mirar', () => {
        preparar();
        escribir(campo('ingreso'), '2026-10-13');
        pulsar(campo('esterilizado'));
        rellenar('fecha-esterilizacion', '2026-10-20');
        expect(textoError('fecha-esterilizacion')).toBe('');
        escribir(campo('ingreso'), '2026-10-25');
        expect(textoError('fecha-esterilizacion')).toBe(
          'La esterilización no puede ser futura ni anterior al ingreso.',
        );
      });

      it('al ocultar el bloque con error, el error desaparece y no reaparece al volver a enseñarlo', () => {
        preparar();
        pulsar(campo('esterilizado'));
        salir(campo('fecha-esterilizacion'));
        expect(textoError('fecha-esterilizacion')).toBe('Escribe la fecha de esterilización.');
        pulsar(campo('esterilizado'));
        expect(campo('bloque-esterilizacion').hidden).toBe(true);
        expect(textoError('fecha-esterilizacion')).toBe('');
        expect(campo('fecha-esterilizacion').classList.contains('is-invalid')).toBe(false);
        pulsar(campo('esterilizado'));
        expect(textoError('fecha-esterilizacion')).toBe('');
      });

      it.each([
        ['el nombre vacío', 'adoptante-nombre', '', 'Escribe el nombre del adoptante.'],
        [
          'el nombre con una cifra',
          'adoptante-nombre',
          'M4rta',
          'El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones.',
        ],
        ['el DNI vacío', 'adoptante-dni', '', 'Escribe el DNI del adoptante, como 12345678Z.'],
        [
          'un DNI sin letra',
          'adoptante-dni',
          '12345678',
          'El DNI tiene 8 cifras y una letra, como 12345678Z.',
        ],
        [
          'un DNI con la letra de control equivocada',
          'adoptante-dni',
          '12345678A',
          'La letra no corresponde al número del DNI.',
        ],
        [
          'un teléfono que empieza por 5',
          'adoptante-telefono',
          '512345678',
          'El teléfono tiene 9 cifras y empieza por 6, 7 o 9.',
        ],
        [
          'un teléfono de 8 cifras',
          'adoptante-telefono',
          '61234567',
          'El teléfono tiene 9 cifras y empieza por 6, 7 o 9.',
        ],
      ])('al elegir «Adoptado» y salir con %s, sale su error', (_motivo, id, valor, mensaje) => {
        preparar();
        pulsar(campo('estado-adoptado'));
        expect(campo('bloque-adopcion').hidden).toBe(false);
        escribir(campo(id), valor);
        salir(campo(id));
        expect(textoError(id)).toBe(mensaje);
      });

      it('el teléfono del adoptante es opcional y el DNI válido no da error', () => {
        preparar();
        pulsar(campo('estado-adoptado'));
        rellenar('adoptante-telefono', '');
        rellenar('adoptante-dni', '12345678Z');
        expect(textoError('adoptante-telefono')).toBe('');
        expect(textoError('adoptante-dni')).toBe('');
      });
    });

    describe('las vacunas', () => {
      it('sin elegir la vacuna ni la fecha, salir de cada campo da su error', () => {
        preparar();
        pulsar(campo('anadir-vacuna'));
        salir(campo('vacuna-tipo-1'));
        salir(campo('vacuna-fecha-1'));
        expect(textoError('vacuna-tipo-1')).toBe('Elige la vacuna.');
        expect(textoError('vacuna-fecha-1')).toBe('Escribe la fecha de la vacuna.');
      });

      it('la fecha de una vacuna no puede ser anterior al ingreso ni futura', () => {
        preparar();
        escribir(campo('ingreso'), '2026-10-13');
        pulsar(campo('anadir-vacuna'));
        const mensaje = 'La fecha de la vacuna no puede ser futura ni anterior al ingreso.';
        escribir(campo('vacuna-fecha-1'), '2026-10-12');
        salir(campo('vacuna-fecha-1'));
        expect(textoError('vacuna-fecha-1')).toBe(mensaje);
        escribir(campo('vacuna-fecha-1'), '2026-11-20');
        expect(textoError('vacuna-fecha-1')).toBe(mensaje);
        escribir(campo('vacuna-fecha-1'), '2026-10-13');
        expect(textoError('vacuna-fecha-1')).toBe('');
      });

      it('una vacuna añadida después también se valida', () => {
        preparar();
        anadirVacuna(1, 'rabia', '2026-11-01');
        pulsar(campo('anadir-vacuna'));
        salir(campo('vacuna-tipo-2'));
        expect(textoError('vacuna-tipo-1')).toBe('');
        expect(textoError('vacuna-tipo-2')).toBe('Elige la vacuna.');
      });
    });
  });

  describe('el envío con errores', () => {
    it('con la ficha vacía no guarda, no navega, avisa y pone el foco en el primer campo con error', () => {
      const { almacenAnimales, almacenSesion, navegar } = preparar();
      enviar();
      expect(guardados(almacenAnimales)).toEqual([]);
      expect(navegar).not.toHaveBeenCalled();
      expect(avisoDejado(almacenSesion)).toBeNull();
      expect(document.querySelector('#avisos').textContent).toBe(
        'Revisa los campos marcados en rojo.',
      );
      expect(document.querySelector('#avisos .alert-danger')).not.toBeNull();
      expect(document.activeElement).toBe(campo('nombre'));
    });

    it('al enviar se marcan todos los campos que faltan, con el mensaje de la tabla', () => {
      preparar();
      enviar();
      expect(textoError('nombre')).toBe('Escribe el nombre del animal.');
      expect(textoError('especie')).toBe('Elige una especie.');
      expect(textoError('sexo')).toBe('Elige el sexo.');
      expect(textoError('ingreso')).toBe('Escribe la fecha de ingreso.');
      expect(textoError('peso')).toBe('Escribe el peso en kilos.');
      expect(textoError('microchip')).toBe('Escribe el microchip: 15 dígitos.');
      // La especie sin elegir deja la galería sin fotos: sus errores no se ven pero tampoco bloquean
      expect(formulario().getAttribute('aria-busy')).toBeNull();
      expect(botonGuardar().disabled).toBe(false);
    });

    it('con un solo campo mal, el foco va a ese campo y no se guarda nada', () => {
      const { almacenAnimales, navegar } = preparar();
      rellenarPerro();
      escribir(campo('microchip'), '123');
      enviar();
      expect(textoError('microchip')).toBe('El microchip tiene 15 dígitos.');
      expect(document.activeElement).toBe(campo('microchip'));
      expect(guardados(almacenAnimales)).toEqual([]);
      expect(navegar).not.toHaveBeenCalled();
    });

    it('con el foco en el primero de varios errores, no salta a uno posterior', () => {
      preparar();
      rellenarPerro();
      escribir(campo('nombre'), '');
      escribir(campo('microchip'), '123');
      enviar();
      expect(document.activeElement).toBe(campo('nombre'));
    });

    it('un adoptado sin los datos del adoptante no se guarda', () => {
      const { almacenAnimales } = preparar();
      rellenarPerro();
      pulsar(campo('estado-adoptado'));
      enviar();
      expect(textoError('adoptante-nombre')).toBe('Escribe el nombre del adoptante.');
      expect(textoError('adoptante-dni')).toBe('Escribe el DNI del adoptante, como 12345678Z.');
      expect(document.activeElement).toBe(campo('adoptante-nombre'));
      expect(guardados(almacenAnimales)).toEqual([]);
    });

    it('después de corregir los errores, el mismo formulario se puede guardar', () => {
      const { almacenAnimales, navegar } = preparar();
      rellenarPerro();
      escribir(campo('microchip'), '123');
      enviar();
      expect(navegar).not.toHaveBeenCalled();
      escribir(campo('microchip'), '941000024681357');
      expect(textoError('microchip')).toBe('');
      enviar();
      expect(guardados(almacenAnimales)).toHaveLength(1);
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
    });
  });

  describe('el envío válido: lo que se guarda', () => {
    it('un animal no adoptado, con esterilización y dos vacunas, se guarda entero con su id', () => {
      const { almacenAnimales } = preparar();
      rellenar('nombre', '  Toby  ');
      elegir(campo('especie'), 'perro');
      pulsar(document.querySelector('#galeria-fotos input[value="perro-3"]'));
      pulsar(campo('sexo-macho'));
      escribir(campo('ingreso'), '2026-10-13');
      escribir(campo('peso'), '12.5');
      rellenar('microchip', '941000024681357');
      pulsar(campo('estado-disponible'));
      pulsar(campo('esterilizado'));
      escribir(campo('fecha-esterilizacion'), '2026-10-20');
      anadirVacuna(1, 'rabia', '2026-10-15');
      anadirVacuna(2, 'polivalente', '2026-11-01');
      enviar();

      expect(guardados(almacenAnimales)).toEqual([
        {
          id: ID_NUEVO,
          nombre: 'Toby',
          especie: 'perro',
          sexo: 'macho',
          ingreso: '2026-10-13',
          peso: 12.5,
          microchip: '941000024681357',
          foto: 'perro-3',
          estado: 'disponible',
          esterilizado: true,
          fechaEsterilizacion: '2026-10-20',
          adopcion: null,
          vacunas: [
            { tipo: 'rabia', fecha: '2026-10-15' },
            { tipo: 'polivalente', fecha: '2026-11-01' },
          ],
        },
      ]);
    });

    it('un animal adoptado, con el adoptante sin teléfono y una vacuna, se guarda entero', () => {
      const { almacenAnimales } = preparar();
      rellenar('nombre', 'Luna');
      elegir(campo('especie'), 'gato');
      pulsar(campo('sexo-hembra'));
      escribir(campo('ingreso'), '2026-10-01');
      escribir(campo('peso'), '4.2');
      rellenar('microchip', '000000000000042');
      pulsar(campo('estado-adoptado'));
      rellenar('adoptante-nombre', ' Marta Prueba ');
      rellenar('adoptante-dni', '12345678Z');
      anadirVacuna(1, 'triple-felina', '2026-10-05');
      enviar();

      expect(guardados(almacenAnimales)).toEqual([
        {
          id: ID_NUEVO,
          nombre: 'Luna',
          especie: 'gato',
          sexo: 'hembra',
          ingreso: '2026-10-01',
          peso: 4.2,
          microchip: '000000000000042', // texto: no pierde los ceros del principio
          foto: 'gato-1', // sin elegir otra, la primera de su especie
          estado: 'adoptado',
          esterilizado: false,
          fechaEsterilizacion: null,
          adopcion: { nombre: 'Marta Prueba', dni: '12345678Z', telefono: null },
          vacunas: [{ tipo: 'triple-felina', fecha: '2026-10-05' }],
        },
      ]);
    });

    it('un adoptado con teléfono guarda los tres datos del adoptante', () => {
      const { almacenAnimales } = preparar();
      rellenarPerro();
      pulsar(campo('estado-adoptado'));
      rellenar('adoptante-nombre', 'Marta Prueba');
      rellenar('adoptante-dni', '12345678Z');
      rellenar('adoptante-telefono', '612345678');
      enviar();
      expect(guardados(almacenAnimales)[0]).toEqual({
        id: ID_NUEVO,
        nombre: 'Toby',
        especie: 'perro',
        sexo: 'macho',
        ingreso: '2026-10-13',
        peso: 12.5,
        microchip: '941000024681357',
        foto: 'perro-1',
        estado: 'adoptado',
        esterilizado: false,
        fechaEsterilizacion: null,
        adopcion: { nombre: 'Marta Prueba', dni: '12345678Z', telefono: '612345678' },
        vacunas: [],
      });
    });

    it('lo escrito en un bloque condicional que luego se oculta no se guarda', () => {
      const { almacenAnimales } = preparar();
      rellenarPerro();
      pulsar(campo('esterilizado'));
      escribir(campo('fecha-esterilizacion'), '2026-10-20');
      pulsar(campo('esterilizado'));
      pulsar(campo('estado-adoptado'));
      rellenar('adoptante-nombre', 'Marta Prueba');
      rellenar('adoptante-dni', '12345678Z');
      pulsar(campo('estado-acogida'));
      enviar();
      const [animal] = guardados(almacenAnimales);
      expect(animal.estado).toBe('acogida');
      expect(animal.esterilizado).toBe(false);
      expect(animal.fechaEsterilizacion).toBeNull();
      expect(animal.adopcion).toBeNull();
    });

    it('un animal con tres vacunas se guarda con las tres en el orden de la ficha, y no deja añadir más', () => {
      const { almacenAnimales } = preparar();
      rellenarPerro();
      anadirVacuna(1, 'otra', '2026-10-14');
      anadirVacuna(2, 'rabia', '2026-10-13');
      anadirVacuna(3, 'mixomatosis', HOY);
      expect(campo('anadir-vacuna').disabled).toBe(true);
      enviar();
      expect(guardados(almacenAnimales)[0].vacunas).toEqual([
        { tipo: 'otra', fecha: '2026-10-14' },
        { tipo: 'rabia', fecha: '2026-10-13' },
        { tipo: 'mixomatosis', fecha: HOY },
      ]);
    });

    it('una vacuna quitada antes de enviar no se guarda', () => {
      const { almacenAnimales } = preparar();
      rellenarPerro();
      anadirVacuna(1, 'rabia', '2026-10-15');
      anadirVacuna(2, 'otra', '2026-10-16');
      pulsar(document.querySelector('.vacuna [data-accion="quitar"]'));
      enviar();
      expect(guardados(almacenAnimales)[0].vacunas).toEqual([
        { tipo: 'otra', fecha: '2026-10-16' },
      ]);
    });

    it('al guardar, deja el aviso para el listado y vuelve a él una sola vez', () => {
      const { almacenAnimales, almacenSesion, navegar } = preparar();
      rellenarPerro();
      enviar();
      expect(avisoDejado(almacenSesion)).toEqual({
        mensaje: 'Has guardado la ficha de Toby.',
        tipo: 'success',
      });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
      expect(guardados(almacenAnimales)).toHaveLength(1);
    });

    it('mientras se guarda, el formulario queda ocupado y un segundo envío no duplica el animal', () => {
      const { almacenAnimales, navegar } = preparar();
      rellenarPerro();
      enviar();
      expect(formulario().getAttribute('aria-busy')).toBe('true');
      expect(botonGuardar().disabled).toBe(true);
      enviar();
      enviar();
      expect(guardados(almacenAnimales)).toHaveLength(1);
      expect(navegar).toHaveBeenCalledTimes(1);
    });

    it('el animal se guarda en la lista del usuario y se añade a los que ya había', () => {
      const { almacenAnimales } = preparar({ animales: [LUNA], deMarcos: [OTRO] });
      rellenarPerro();
      enviar();
      expect(guardados(almacenAnimales).map((animal) => animal.id)).toEqual(['a1', ID_NUEVO]);
      expect(JSON.parse(almacenAnimales.getItem(claveAnimales('marcos')))).toEqual([OTRO]);
    });
  });

  describe('la edición con ?id', () => {
    it('rellena el formulario con el animal guardado, con sus campos condicionales, su foto y sus vacunas', () => {
      preparar({ animales: [OTRO, LUNA], busqueda: '?id=a1' });
      expect(campo('titulo-ficha').textContent).toBe('Luna');
      expect(document.title).toBe('Cartilla de Luna | Huellas');
      expect(campo('nombre').value).toBe('Luna');
      expect(campo('especie').value).toBe('gato');
      expect(campo('sexo-hembra').checked).toBe(true);
      expect(campo('ingreso').value).toBe('2026-10-01');
      expect(campo('peso').value).toBe('4.2');
      expect(campo('microchip').value).toBe('941000011112222');
      expect(document.querySelector('#galeria-fotos input:checked').value).toBe('gato-3');
      expect(campo('estado-adoptado').checked).toBe(true);
      expect(campo('bloque-adopcion').hidden).toBe(false);
      expect(campo('adoptante-dni').value).toBe('12345678Z');
      expect(campo('esterilizado').checked).toBe(true);
      expect(campo('bloque-esterilizacion').hidden).toBe(false);
      expect(campo('fecha-esterilizacion').value).toBe('2026-10-10');
      expect(campo('vacuna-tipo-1').value).toBe('triple-felina');
      expect(campo('contador-vacunas').textContent).toBe('1 de 3 vacunas');
    });

    it('al guardar los cambios, sustituye al animal: conserva su id y su sitio y no lo duplica', () => {
      const { almacenAnimales, almacenSesion, navegar } = preparar({
        animales: [LUNA, OTRO],
        busqueda: '?id=a1',
      });
      escribir(campo('peso'), '4.6');
      pulsar(document.querySelector('#galeria-fotos input[value="gato-5"]'));
      pulsar(campo('estado-disponible'));
      enviar();

      expect(guardados(almacenAnimales)).toEqual([
        {
          ...LUNA,
          peso: 4.6,
          foto: 'gato-5',
          estado: 'disponible',
          adopcion: null,
        },
        OTRO,
      ]);
      expect(avisoDejado(almacenSesion)).toEqual({
        mensaje: 'Has guardado los cambios de Luna.',
        tipo: 'success',
      });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
    });

    it('un animal guardado sin cambios vuelve a guardarse igual', () => {
      const { almacenAnimales } = preparar({ animales: [LUNA], busqueda: '?id=a1' });
      enviar();
      expect(guardados(almacenAnimales)).toEqual([LUNA]);
    });

    it.each([
      ['un id que no existe', '?id=zzz'],
      ['un id vacío', '?id='],
    ])('con %s, lleva al listado con un aviso de error y no enseña la ficha', (_caso, busqueda) => {
      const { almacenSesion, navegar } = preparar({ animales: [LUNA], busqueda });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
      expect(avisoDejado(almacenSesion)).toEqual({
        mensaje: AVISO_FICHA_NO_ENCONTRADA,
        tipo: 'danger',
      });
      expect(document.body.dataset.sesionComprobada).toBeUndefined();
    });

    it('un animal de otro usuario no se puede editar', () => {
      const { almacenSesion, navegar } = preparar({ deMarcos: [LUNA], busqueda: '?id=a1' });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
      expect(avisoDejado(almacenSesion).tipo).toBe('danger');
    });
  });
});
