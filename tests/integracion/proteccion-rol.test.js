// Test de integración de la protección por rol: la página real `usuarios.html` (y todos sus módulos)
// en happy-dom, con el usuario simulado (UD5, tema 9 y UD6, tema 7; requisito 21). Solo se sustituyen
// el almacenamiento (`AlmacenFalso`), la navegación (`vi.fn()`) y la dirección (un doble con `leer` y
// `guardar`). Se comprueba que a la zona de administración solo entran los administradores y que a
// los demás se les lleva a otra página, sin dejarles ver nada.
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { cargarPagina } from '../pagina.js';
import { CLAVE_AVISO } from '../../js/componentes/avisos.js';
import { CLAVE_SESION, leerSesion } from '../../js/datos/sesion.js';
import { CLAVE_USUARIOS } from '../../js/datos/usuarios.js';

/** La función de la página; se importa en `beforeAll`, después de dejar lista una sesión (ver allí). */
let iniciarUsuarios;

const AVISO_SOLO_ADMINISTRADORES = 'Solo los administradores pueden entrar en «Usuarios».';

/**
 * Un usuario guardado con los datos justos para que la lista lo dé por bueno.
 * @param {string} nombre
 * @param {'administrador' | 'usuario'} rol
 */
const usuario = (nombre, rol) => ({
  usuario: nombre,
  correo: `${nombre.toLowerCase()}@ejemplo.org`,
  rol,
  resumen: 'a'.repeat(64), // el resumen de una contraseña: aquí solo importa que tenga la forma
});

/** Dos usuarios: Lola, administradora, e Iker, que no lo es. */
const LOLA = usuario('lola', 'administrador');
const IKER = usuario('iker', 'usuario');

/** La sesión tal y como se guarda: `sesionDe('lola', 'usuario')`. */
const sesionDe = (nombre, rol) => JSON.stringify({ usuario: nombre, rol });

/**
 * Carga `usuarios.html` y la inicia con dobles.
 * @param {object} [opciones]
 * @param {?string} [opciones.sesion] Lo guardado como sesión, tal cual (`null`: no hay sesión).
 * @param {Array<object>} [opciones.usuarios] La lista de usuarios guardada.
 */
function preparar({ sesion = null, usuarios = [LOLA, IKER] } = {}) {
  cargarPagina('usuarios.html');
  // `cargarPagina` solo cambia el contenido del `<body>`: la marca de la página anterior se quita aquí
  delete document.body.dataset.sesionComprobada;
  const almacenSesion = new AlmacenFalso();
  const almacenUsuarios = new AlmacenFalso();
  if (sesion !== null) {
    almacenSesion.setItem(CLAVE_SESION, sesion);
  }
  almacenUsuarios.setItem(CLAVE_USUARIOS, JSON.stringify(usuarios));
  let direccionActual = '';
  const navegar = vi.fn();
  const direccion = {
    leer: vi.fn(() => direccionActual),
    guardar: vi.fn((nueva) => {
      direccionActual = nueva;
    }),
  };
  iniciarUsuarios(document, { almacenSesion, almacenUsuarios, navegar, direccion });
  return { almacenSesion, almacenUsuarios, navegar, direccion };
}

const chapas = () => [...document.querySelectorAll('#lista-usuarios .voluntario')];
const avisoDejado = (almacenSesion) => JSON.parse(almacenSesion.getItem(CLAVE_AVISO));
const enlaceUsuarios = () => document.querySelector('[data-solo-admin]');

describe('usuarios.html: protección por rol, en happy-dom', () => {
  beforeAll(async () => {
    // El `<body>` de la página trae su `<script type="module">`, que happy-dom no carga: que lo dé
    // por bueno en vez de escribir un error en la consola con cada página cargada
    window.happyDOM.settings.handleDisabledFileLoadingAsSuccess = true;
    // `usuarios.js` se inicia sola al importarla, con `sessionStorage`, `localStorage` y `location`
    // reales. Se importa una vez, con la página y un administrador reales a mano, para que esa primera
    // puesta en marcha no navegue ni falle; después cada test inicia la página con sus dobles.
    cargarPagina('usuarios.html');
    sessionStorage.setItem(CLAVE_SESION, sesionDe('lola', 'administrador'));
    localStorage.setItem(CLAVE_USUARIOS, JSON.stringify([LOLA]));
    ({ iniciarUsuarios } = await import('../../js/paginas/usuarios.js'));
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('un usuario que no es administrador', () => {
    it('no se queda: se le lleva a listado.html y se deja un aviso de error para esa página', () => {
      const { almacenSesion, navegar } = preparar({ sesion: sesionDe('iker', 'usuario') });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
      expect(avisoDejado(almacenSesion)).toEqual({
        mensaje: AVISO_SOLO_ADMINISTRADORES,
        tipo: 'danger',
      });
    });

    it('no ve nada de la zona: ni una chapa, ni el resumen, y la página sigue sin mostrarse', () => {
      preparar({ sesion: sesionDe('iker', 'usuario') });
      expect(chapas()).toHaveLength(0);
      expect(document.querySelector('#resumen').textContent).toBe('');
      expect(document.querySelector('#contador').textContent).toBe('');
      expect(document.body.dataset).not.toHaveProperty('sesionComprobada');
    });

    it('conserva su sesión: solo se le impide quedarse, no se le cierra', () => {
      const { almacenSesion } = preparar({ sesion: sesionDe('iker', 'usuario') });
      expect(leerSesion(almacenSesion)).toEqual({ usuario: 'iker', rol: 'usuario' });
    });
  });

  describe('una sesión con rol de administrador que ya no vale', () => {
    it.each([
      [
        'el usuario guardado ya no es administrador',
        [usuario('lola', 'usuario'), usuario('marcos', 'administrador')],
      ],
      ['el usuario guardado ya no existe en la lista', [IKER]],
      ['la lista de usuarios está vacía', []],
    ])('si %s, se le lleva a listado.html con el aviso de error', (_motivo, usuarios) => {
      const { almacenSesion, navegar } = preparar({
        sesion: sesionDe('lola', 'administrador'),
        usuarios,
      });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
      expect(avisoDejado(almacenSesion)).toEqual({
        mensaje: AVISO_SOLO_ADMINISTRADORES,
        tipo: 'danger',
      });
      expect(chapas()).toHaveLength(0);
    });

    it('pone la sesión al día con el rol guardado, no con su copia vieja', () => {
      const { almacenSesion } = preparar({
        sesion: sesionDe('lola', 'administrador'),
        usuarios: [usuario('lola', 'usuario'), usuario('marcos', 'administrador')],
      });
      expect(leerSesion(almacenSesion)).toEqual({ usuario: 'lola', rol: 'usuario' });
    });

    it('compara el nombre sin distinguir mayúsculas: «LOLA» en la sesión es «lola» en la lista', () => {
      const { navegar } = preparar({
        sesion: sesionDe('LOLA', 'administrador'),
        usuarios: [usuario('lola', 'usuario'), usuario('marcos', 'administrador')],
      });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('listado.html');
    });
  });

  describe('sin una sesión válida', () => {
    it.each([
      ['no hay sesión', null],
      ['la sesión no es JSON', 'esto no es JSON'],
      ['la sesión no tiene usuario', JSON.stringify({ rol: 'administrador' })],
      ['el rol de la sesión no existe', sesionDe('lola', 'superadministrador')],
    ])('si %s, se le lleva a index.html, sin aviso y sin enseñar nada', (_motivo, sesion) => {
      const { almacenSesion, navegar } = preparar({ sesion });
      expect(navegar).toHaveBeenCalledExactlyOnceWith('index.html');
      expect(almacenSesion.getItem(CLAVE_AVISO)).toBeNull();
      expect(chapas()).toHaveLength(0);
    });
  });

  describe('un administrador', () => {
    it('se queda en la página: no navega ni deja ningún aviso', () => {
      const { almacenSesion, navegar } = preparar({ sesion: sesionDe('lola', 'administrador') });
      expect(navegar).not.toHaveBeenCalled();
      expect(almacenSesion.getItem(CLAVE_AVISO)).toBeNull();
    });

    it('ve a todos los usuarios, el resumen y el enlace «Usuarios» de la cabecera', () => {
      preparar({ sesion: sesionDe('lola', 'administrador') });
      expect(chapas().map((chapa) => chapa.dataset.usuario)).toEqual(['lola', 'iker']);
      expect(document.querySelector('#resumen').textContent).toBe(
        '2 personas en la protectora, 1 con rol de administrador.',
      );
      expect(enlaceUsuarios().hidden).toBe(false);
      expect(document.body.dataset).toHaveProperty('sesionComprobada');
    });

    it('manda el rol guardado también al revés: con la sesión de usuario pero administrador en la lista, entra', () => {
      const { almacenSesion, navegar } = preparar({
        sesion: sesionDe('iker', 'usuario'),
        usuarios: [LOLA, usuario('iker', 'administrador')],
      });
      expect(navegar).not.toHaveBeenCalled();
      expect(leerSesion(almacenSesion)).toEqual({ usuario: 'iker', rol: 'administrador' });
      expect(chapas()).toHaveLength(2);
    });
  });
});
