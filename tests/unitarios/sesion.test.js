// Tests del módulo de sesión, con los dos almacenamientos que debe aceptar: `AlmacenFalso` y el
// `sessionStorage` real (en happy-dom).
import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { borrarSesion, CLAVE_SESION, guardarSesion, leerSesion } from '../../js/datos/sesion.js';

const ANA = { usuario: 'ana', rol: 'administrador' };

describe.each([
  ['AlmacenFalso', () => new AlmacenFalso()],
  ['sessionStorage', () => sessionStorage],
])('sesión con %s', (_nombre, crearAlmacen) => {
  let almacen;

  beforeEach(() => {
    almacen = crearAlmacen();
    almacen.clear();
  });

  it('sin sesión guardada devuelve null', () => {
    expect(leerSesion(almacen)).toBeNull();
  });

  it('guarda la sesión y la lee igual', () => {
    guardarSesion(almacen, ANA);
    expect(leerSesion(almacen)).toEqual(ANA);
  });

  it('solo guarda el usuario y el rol', () => {
    guardarSesion(almacen, { ...ANA, clave: 'secreta' });
    expect(JSON.parse(almacen.getItem(CLAVE_SESION))).toEqual(ANA);
  });

  it('guardar otra sesión sustituye a la anterior', () => {
    guardarSesion(almacen, ANA);
    guardarSesion(almacen, { usuario: 'marcos', rol: 'usuario' });
    expect(leerSesion(almacen)).toEqual({ usuario: 'marcos', rol: 'usuario' });
  });

  it('borrar la sesión la quita, y borrarla dos veces no falla', () => {
    guardarSesion(almacen, ANA);
    borrarSesion(almacen);
    borrarSesion(almacen);
    expect(leerSesion(almacen)).toBeNull();
  });

  // Datos estropeados: nadie debería poder romper la página editando el almacenamiento
  it.each([
    ['no es JSON', '{usuario:'],
    ['es texto suelto', 'ana'],
    ['es un número', '42'],
    ['es null', 'null'],
    ['es una lista', '["ana","administrador"]'],
    ['falta el rol', '{"usuario":"ana"}'],
    ['falta el usuario', '{"rol":"usuario"}'],
    ['el usuario está vacío', '{"usuario":"  ","rol":"usuario"}'],
    ['el usuario no es texto', '{"usuario":7,"rol":"usuario"}'],
    ['el rol no existe', '{"usuario":"ana","rol":"superadministrador"}'],
  ])('si lo guardado estropeado (%s), devuelve null', (_motivo, guardado) => {
    almacen.setItem(CLAVE_SESION, guardado);
    expect(leerSesion(almacen)).toBeNull();
  });
});

describe('sesión con un almacenamiento que falla', () => {
  it('leer devuelve null si el almacenamiento lanza un error', () => {
    const roto = {
      getItem() {
        throw new Error('almacenamiento no disponible');
      },
    };
    expect(leerSesion(roto)).toBeNull();
  });
});
