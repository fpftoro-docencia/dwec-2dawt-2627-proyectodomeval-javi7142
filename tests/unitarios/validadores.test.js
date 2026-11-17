// Tests de los validadores del registro y de la ficha (requisitos 10 y 21): tablas `it.each` con
// casos válidos, incluidos los límites, y al menos un caso no válido por cada regla, con su motivo.
import { describe, expect, it } from 'vitest';
import {
  letraDni,
  requisitosClave,
  validadores,
  validarClave,
  validarCorreo,
  validarDni,
  validarMicrochip,
  validarNombre,
  validarTelefono,
  validarUsuario,
} from '../../js/logica/validadores.js';

describe('validarUsuario', () => {
  it.each([
    ['lol', '3 caracteres, el mínimo'],
    ['a'.repeat(20), '20 caracteres, el máximo'],
    ['lola', 'solo letras'],
    ['Íker', 'empieza por una letra con tilde'],
    ['ñu_23', 'ñ, guion bajo y cifras'],
    ['ana.b-c', 'punto y guion'],
    ['  lola  ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: de eso se encarga required'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarUsuario(valor)).toBe('');
  });

  it.each([
    ['lo', 'tiene 2 caracteres, menos del mínimo'],
    ['a'.repeat(21), 'tiene 21 caracteres, más del máximo'],
    ['1lola', 'empieza por una cifra'],
    ['_lola', 'empieza por un guion bajo'],
    ['lo la', 'tiene un espacio en medio'],
    ['lola!', 'tiene un signo que no está permitido'],
  ])('«%s» no es válido porque %s', (valor) => {
    expect(validarUsuario(valor)).toContain('empieza por una letra');
  });
});

describe('validarCorreo', () => {
  it.each([
    ['lola@ejemplo.org', 'un correo normal'],
    ['a.b+c@sub.dominio.es', 'puntos y más en el nombre, y subdominio'],
    [' lola@ejemplo.org ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: de eso se encarga required'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarCorreo(valor)).toBe('');
  });

  it.each([
    ['lola', 'no tiene arroba'],
    ['@ejemplo.org', 'no tiene nada antes de la arroba'],
    ['lola@', 'no tiene dominio'],
    ['lola@ejemplo', 'el dominio no tiene punto'],
    ['lola@@ejemplo.org', 'tiene dos arrobas'],
    ['lo la@ejemplo.org', 'tiene un espacio'],
  ])('«%s» no es válido porque %s', (valor) => {
    expect(validarCorreo(valor)).toContain('nombre@ejemplo.org');
  });
});

describe('validarClave', () => {
  it.each([
    ['Huellas1', '8 caracteres, el mínimo, con las cuatro reglas'],
    ['Ñandú2026', 'mayúscula y minúscula con tilde o ñ'],
    ['PERROs99', 'una sola minúscula'],
    ['', 'vacía: de eso se encarga required'],
  ])('«%s» es válida (%s)', (valor) => {
    expect(validarClave(valor)).toBe('');
  });

  it.each([
    ['Huella1', 'tiene 7 caracteres, menos de 8'],
    ['HUELLAS123', 'no tiene minúscula'],
    ['huellas123', 'no tiene mayúscula'],
    ['Huellasss', 'no tiene cifra'],
  ])('«%s» no es válida porque %s', (valor) => {
    expect(validarClave(valor)).toContain('8 caracteres o más');
  });
});

describe('requisitosClave', () => {
  it.each([
    ['', { longitud: false, minuscula: false, mayuscula: false, cifra: false }],
    ['h', { longitud: false, minuscula: true, mayuscula: false, cifra: false }],
    ['huellas1', { longitud: true, minuscula: true, mayuscula: false, cifra: true }],
    ['Ñ', { longitud: false, minuscula: false, mayuscula: true, cifra: false }],
    ['12345678', { longitud: true, minuscula: false, mayuscula: false, cifra: true }],
    ['Huellas1', { longitud: true, minuscula: true, mayuscula: true, cifra: true }],
  ])('«%s» cumple %o', (clave, esperado) => {
    expect(requisitosClave(clave)).toEqual(esperado);
  });
});

// Los validadores de la ficha del animal (S2-02 y S2-03). Todos los datos son inventados.

describe('validarNombre', () => {
  it.each([
    ['Lu', '2 caracteres, el mínimo'],
    ['a'.repeat(30), '30 caracteres, el máximo'],
    ['Luna', 'solo letras'],
    ['Toñi', 'ñ en el nombre'],
    ['Ángel', 'empieza por una letra con tilde'],
    ['Ana María', 'un espacio en medio'],
    ["D'Ávila", 'un apóstrofo'],
    ['Ana-María', 'un guion'],
    ['Ana  Mar', 'dos espacios seguidos: la regla es permisiva'],
    ['  Luna  ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: de eso se encarga required'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarNombre(valor)).toBe('');
  });

  it.each([
    ['L', 'tiene 1 carácter, menos del mínimo'],
    [' L ', 'con los espacios quitados tiene 1 carácter'],
    ['a'.repeat(31), 'tiene 31 caracteres, más del máximo'],
    ['1Luna', 'empieza por una cifra'],
    ['-Luna', 'empieza por un guion'],
    ["'Luna", 'empieza por un apóstrofo'],
    ['Luna2', 'tiene una cifra'],
    ['Lu_na', 'tiene un guion bajo, que no está permitido'],
    ['Luna!', 'tiene un signo que no está permitido'],
  ])('«%s» no es válido porque %s', (valor) => {
    expect(validarNombre(valor)).toContain('El nombre empieza por una letra');
  });
});

describe('validarMicrochip', () => {
  it.each([
    ['941000024681357', '15 dígitos'],
    ['000000000000000', 'ceros al principio: es texto, no un número'],
    ['  941000024681357  ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: de eso se encarga required'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarMicrochip(valor)).toBe('');
  });

  it.each([
    ['94100002468135', 'tiene 14 dígitos, uno menos del mínimo'],
    ['9410000246813571', 'tiene 16 dígitos, uno más del máximo'],
    ['94100002468135a', 'tiene una letra'],
    ['941 000 024 681 3', 'tiene espacios en medio'],
    ['9410000246.1357', 'tiene un punto'],
    ['-41000024681357', 'tiene un signo menos'],
  ])('«%s» no es válido porque %s', (valor) => {
    expect(validarMicrochip(valor)).toBe('El microchip tiene 15 dígitos.');
  });
});

describe('validarTelefono', () => {
  it.each([
    ['600000000', '9 cifras y empieza por 6'],
    ['712345678', 'empieza por 7'],
    ['999999999', 'empieza por 9, el máximo'],
    ['  612345678  ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: el teléfono es opcional'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarTelefono(valor)).toBe('');
  });

  it.each([
    ['512345678', 'empieza por 5'],
    ['812345678', 'empieza por 8'],
    ['012345678', 'empieza por 0'],
    ['61234567', 'tiene 8 cifras, una menos del mínimo'],
    ['6123456789', 'tiene 10 cifras, una más del máximo'],
    ['61234567a', 'tiene una letra'],
    ['612 345 678', 'tiene espacios en medio'],
    ['+34612345678', 'lleva el prefijo del país'],
  ])('«%s» no es válido porque %s', (valor) => {
    expect(validarTelefono(valor)).toBe('El teléfono tiene 9 cifras y empieza por 6, 7 o 9.');
  });
});

describe('letraDni', () => {
  it.each([
    ['00000000', 'T', 'resto 0'],
    ['00000001', 'R', 'resto 1'],
    ['00000022', 'E', 'resto 22, el último'],
    ['00000023', 'T', 'resto 0 otra vez: el resto da la vuelta'],
    ['12345678', 'Z', 'resto 14'],
    ['99999999', 'R', 'el número más alto, resto 1'],
  ])('la letra de %s es %s (%s)', (numero, esperada) => {
    expect(letraDni(numero)).toBe(esperada);
  });

  it('con los restos del 0 al 22 da las 23 letras de la tabla, en su orden', () => {
    const letras = Array.from({ length: 23 }, (_, resto) => letraDni(String(resto)));
    expect(letras.join('')).toBe('TRWAGMYFPDXBNJZSQVHLCKE');
  });
});

describe('validarDni', () => {
  it.each([
    ['12345678Z', 'un DNI con su letra correcta'],
    ['00000000T', 'ceros al principio, resto 0'],
    ['00000022E', 'la última letra de la tabla'],
    ['  12345678Z  ', 'los espacios de alrededor no cuentan'],
    ['', 'vacío: de eso se encarga required'],
  ])('«%s» es válido (%s)', (valor) => {
    expect(validarDni(valor)).toBe('');
  });

  it.each([
    ['1234567Z', 'tiene 7 cifras, una menos del mínimo'],
    ['123456789Z', 'tiene 9 cifras, una más del máximo'],
    ['12345678', 'no tiene letra'],
    ['Z12345678', 'la letra va delante'],
    ['12345678z', 'la letra está en minúscula'],
    ['12345678ZZ', 'tiene dos letras'],
    ['12345678 Z', 'tiene un espacio antes de la letra'],
    ['1234567AZ', 'tiene una letra donde iría una cifra'],
    ['1234567A', 'tiene 7 cifras y letra: el formato falla antes que la letra'],
  ])('«%s» no es válido de formato porque %s', (valor) => {
    expect(validarDni(valor)).toBe('El DNI tiene 8 cifras y una letra, como 12345678Z.');
  });

  it.each([
    ['12345678A', 'la letra correcta es Z'],
    ['00000000R', 'la letra correcta es T'],
    ['00000023R', 'la letra correcta es T'],
    ['12345678U', 'la U es una letra de formato válido, pero no está en la tabla'],
  ])('«%s» no es válido de letra porque %s', (valor) => {
    expect(validarDni(valor)).toBe('La letra no corresponde al número del DNI.');
  });
});

describe('validadores', () => {
  it('reúne los validadores por el nombre de su data-validar', () => {
    expect(validadores).toEqual({
      usuario: validarUsuario,
      correo: validarCorreo,
      clave: validarClave,
      nombre: validarNombre,
      microchip: validarMicrochip,
      telefono: validarTelefono,
      dni: validarDni,
    });
  });

  it('no se puede cambiar desde fuera', () => {
    expect(Object.isFrozen(validadores)).toBe(true);
  });
});
