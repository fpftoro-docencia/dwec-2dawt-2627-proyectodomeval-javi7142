// Tests de los validadores del registro (requisito 10): tablas `it.each` con casos válidos, incluidos
// los límites, y al menos un caso no válido por cada regla, con su motivo.
import { describe, expect, it } from 'vitest';
import {
  requisitosClave,
  validadores,
  validarClave,
  validarCorreo,
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

describe('validadores', () => {
  it('reúne los validadores por el nombre de su data-validar', () => {
    expect(validadores).toEqual({
      usuario: validarUsuario,
      correo: validarCorreo,
      clave: validarClave,
    });
  });

  it('no se puede cambiar desde fuera', () => {
    expect(Object.isFrozen(validadores)).toBe(true);
  });
});
