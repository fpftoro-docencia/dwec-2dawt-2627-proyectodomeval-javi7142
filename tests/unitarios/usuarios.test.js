// Tests del módulo de usuarios (requisitos 3, 4 y 10), con `AlmacenFalso` en lugar de `localStorage`.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  CLAVE_USUARIOS,
  comprobarCredenciales,
  existeUsuario,
  leerUsuarios,
  registrarUsuario,
} from '../../js/datos/usuarios.js';

const LOLA = { usuario: 'lola', correo: 'lola@ejemplo.org', clave: 'Huellas123' };
const IKER = { usuario: 'iker', correo: 'iker@ejemplo.org', clave: 'Perros2026' };

describe('usuarios', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  it('sin datos, la lista está vacía', () => {
    expect(leerUsuarios(almacen)).toEqual([]);
  });

  it('guarda un usuario y lo lee con su nombre, correo y rol', async () => {
    await registrarUsuario(almacen, { ...LOLA, usuario: '  lola  ' });
    const [guardado] = leerUsuarios(almacen);
    expect(guardado).toMatchObject({ usuario: 'lola', correo: 'lola@ejemplo.org' });
  });

  it('el primer usuario es administrador y los demás, usuarios', async () => {
    expect(await registrarUsuario(almacen, LOLA)).toEqual({
      usuario: 'lola',
      rol: 'administrador',
    });
    expect(await registrarUsuario(almacen, IKER)).toEqual({ usuario: 'iker', rol: 'usuario' });
  });

  it('no guarda la contraseña en claro, solo su resumen SHA-256', async () => {
    await registrarUsuario(almacen, LOLA);
    const guardado = almacen.getItem(CLAVE_USUARIOS);
    expect(guardado).not.toContain(LOLA.clave);
    expect(leerUsuarios(almacen)[0].resumen).toMatch(/^[0-9a-f]{64}$/);
  });

  it.each([
    ['el mismo nombre', 'lola'],
    ['el nombre con otras mayúsculas', 'LOLA'],
    ['el nombre con espacios alrededor', ' lola '],
  ])('un nombre repetido (%s) no se registra', async (_motivo, nombre) => {
    await registrarUsuario(almacen, LOLA);
    expect(await registrarUsuario(almacen, { ...IKER, usuario: nombre })).toBeNull();
    expect(leerUsuarios(almacen)).toHaveLength(1);
  });

  it('existeUsuario dice si un nombre está ocupado, sin distinguir mayúsculas', async () => {
    await registrarUsuario(almacen, LOLA);
    expect(existeUsuario(almacen, 'Lola')).toBe(true);
    expect(existeUsuario(almacen, 'nadie')).toBe(false);
  });

  it('con la contraseña correcta devuelve el usuario y su rol', async () => {
    await registrarUsuario(almacen, LOLA);
    expect(await comprobarCredenciales(almacen, 'Lola', LOLA.clave)).toEqual({
      usuario: 'lola',
      rol: 'administrador',
    });
  });

  it.each([
    ['otra contraseña', 'lola', 'Huellas124'],
    ['la contraseña con otras mayúsculas', 'lola', 'huellas123'],
    ['un usuario que no existe', 'nadie', 'Huellas123'],
  ])('con %s devuelve null', async (_motivo, nombre, clave) => {
    await registrarUsuario(almacen, LOLA);
    expect(await comprobarCredenciales(almacen, nombre, clave)).toBeNull();
  });

  it('usa la función de resumen que recibe, para poder sustituirla en los tests', async () => {
    const resumir = vi.fn(async () => 'a'.repeat(64));
    await registrarUsuario(almacen, LOLA, resumir);
    expect(resumir).toHaveBeenCalledWith(LOLA.clave);
    expect(await comprobarCredenciales(almacen, 'lola', 'cualquiera', resumir)).not.toBeNull();
  });

  // Datos estropeados: editar el almacenamiento a mano no debe romper la lectura
  it.each([
    ['no es JSON', '{roto'],
    ['es texto', '"lola"'],
    ['es un número', '42'],
    ['es null', 'null'],
    ['es un objeto suelto', '{"usuario":"lola"}'],
  ])('si lo guardado no es una lista (%s), lee una lista vacía', (_motivo, guardado) => {
    almacen.setItem(CLAVE_USUARIOS, guardado);
    expect(leerUsuarios(almacen)).toEqual([]);
  });

  it('si la lista tiene elementos estropeados, se queda con los buenos', () => {
    const bueno = {
      usuario: 'lola',
      correo: 'l@ejemplo.org',
      rol: 'administrador',
      resumen: 'a'.repeat(64),
    };
    almacen.setItem(
      CLAVE_USUARIOS,
      JSON.stringify([
        bueno,
        null,
        7,
        { usuario: 'sin-rol', correo: 's@ejemplo.org', resumen: 'b'.repeat(64) },
        { usuario: 'jefe', correo: 'j@ejemplo.org', rol: 'jefe', resumen: 'c'.repeat(64) },
        { usuario: 'en-claro', correo: 'c@ejemplo.org', rol: 'usuario', resumen: 'Huellas123' },
      ]),
    );
    expect(leerUsuarios(almacen)).toEqual([bueno]);
  });

  it('con los datos estropeados se puede registrar, y el nuevo es administrador', async () => {
    almacen.setItem(CLAVE_USUARIOS, '{roto');
    expect(await registrarUsuario(almacen, LOLA)).toEqual({
      usuario: 'lola',
      rol: 'administrador',
    });
  });
});
