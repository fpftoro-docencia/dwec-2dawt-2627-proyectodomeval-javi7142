// Tests del módulo de sesión (requisito 10). Se prueba con los dos almacenamientos que tiene que
// aceptar: `AlmacenFalso` y el `sessionStorage` de happy-dom.
import { beforeEach, describe, expect, it } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import { borrarSesion, CLAVE_SESION, guardarSesion, leerSesion } from '../../js/datos/sesion.js';

const LOLA = { usuario: 'lola', rol: 'administrador' };

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
    guardarSesion(almacen, LOLA);
    expect(leerSesion(almacen)).toEqual(LOLA);
  });

  it('solo guarda el usuario y el rol, nunca la contraseña', () => {
    guardarSesion(almacen, { ...LOLA, clave: 'Huellas123' });
    expect(JSON.parse(almacen.getItem(CLAVE_SESION))).toEqual(LOLA);
  });

  it('guardar otra sesión sustituye a la anterior', () => {
    guardarSesion(almacen, LOLA);
    guardarSesion(almacen, { usuario: 'iker', rol: 'usuario' });
    expect(leerSesion(almacen)).toEqual({ usuario: 'iker', rol: 'usuario' });
  });

  it('borrar la sesión la quita, y borrarla dos veces no falla', () => {
    guardarSesion(almacen, LOLA);
    borrarSesion(almacen);
    borrarSesion(almacen);
    expect(leerSesion(almacen)).toBeNull();
  });

  // Datos estropeados: editar el almacenamiento a mano no debe romper la página
  it.each([
    ['no es JSON', '{usuario:'],
    ['es texto suelto', 'lola'],
    ['es un número', '42'],
    ['es null', 'null'],
    ['es una lista', '["lola","administrador"]'],
    ['falta el rol', '{"usuario":"lola"}'],
    ['falta el usuario', '{"rol":"usuario"}'],
    ['el usuario está vacío', '{"usuario":"  ","rol":"usuario"}'],
    ['el usuario no es texto', '{"usuario":7,"rol":"usuario"}'],
    ['el rol no existe', '{"usuario":"lola","rol":"jefe"}'],
  ])('si lo guardado está estropeado (%s), devuelve null', (_motivo, guardado) => {
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
