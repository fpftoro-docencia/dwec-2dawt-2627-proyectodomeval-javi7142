// Tests de `resumirClave`, el resumen SHA-256 de las contraseñas: una función pura, sin DOM y sin
// almacenamiento (UD3, tema 9). Los tests del módulo de usuarios la sustituyen por un doble, así
// que aquí se comprueba la real, con resúmenes conocidos.
import { describe, it, expect } from 'vitest';
import { resumirClave } from '../../js/clave.js';

describe('resumirClave', () => {
  // Una tabla de casos: cada fila es un test, con el motivo en su nombre
  it.each([
    ['abc', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
    ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ])('el resumen de «%s» es %s', async (clave, esperado) => {
    expect(await resumirClave(clave)).toBe(esperado);
  });

  it('la misma contraseña da siempre el mismo resumen, y otra, uno distinto', async () => {
    expect(await resumirClave('secreto')).toBe(await resumirClave('secreto'));
    expect(await resumirClave('secreto')).not.toBe(await resumirClave('Secreto'));
  });
});
