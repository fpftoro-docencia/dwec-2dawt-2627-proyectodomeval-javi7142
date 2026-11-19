// Tests de `paginar` (requisito 21): la primera y la última página, una página que no existe y una
// lista vacía, además de lo que corrige y de cuándo falla. Es una función pura: no hace falta DOM.
import { describe, expect, it } from 'vitest';
import { paginar } from '../../js/logica/paginacion.js';

const LETRAS = ['a', 'b', 'c', 'd', 'e']; // con 2 por página: [a, b], [c, d], [e]

describe('paginar', () => {
  describe('páginas que existen', () => {
    it.each([
      [1, ['a', 'b'], 'la primera página'],
      [2, ['c', 'd'], 'una página del medio'],
      [3, ['e'], 'la última página, con menos elementos que las demás'],
    ])('la página %i trae %o (%s)', (pagina, elementos) => {
      expect(paginar(LETRAS, pagina, 2)).toEqual({ elementos, pagina, totalPaginas: 3 });
    });

    it('un número entero escrito como texto vale, como lo da URLSearchParams', () => {
      expect(paginar(LETRAS, '2', 2)).toEqual({
        elementos: ['c', 'd'],
        pagina: 2,
        totalPaginas: 3,
      });
    });

    it('los decimales se redondean hacia abajo', () => {
      expect(paginar(LETRAS, 2.7, 2).pagina).toBe(2);
    });
  });

  describe('páginas que no existen', () => {
    it.each([
      [4, 3, 'justo después de la última'],
      [99, 3, 'muy por encima del total'],
      ['99', 3, 'muy por encima del total, escrita como texto'],
      [Infinity, 3, 'infinito'],
      [0, 1, 'cero'],
      [-3, 1, 'negativa'],
      [0.5, 1, 'un decimal por debajo de 1'],
      [-Infinity, 1, 'menos infinito'],
    ])('la página %j se corrige a la %i (%s)', (pedida, corregida) => {
      const resultado = paginar(LETRAS, pedida, 2);
      expect(resultado.pagina).toBe(corregida);
      expect(resultado.totalPaginas).toBe(3);
      expect(resultado.elementos).toEqual(corregida === 1 ? ['a', 'b'] : ['e']);
    });

    it.each([
      [NaN, 'NaN'],
      ['abc', 'texto que no es un número'],
      [null, 'null: la dirección no trae ?pagina='],
      [undefined, 'undefined: no se pasa la página'],
      [{}, 'un objeto'],
    ])('la página %j es la 1 porque es %s', (pedida) => {
      expect(paginar(LETRAS, pedida, 2)).toEqual({
        elementos: ['a', 'b'],
        pagina: 1,
        totalPaginas: 3,
      });
    });
  });

  describe('lista vacía', () => {
    it.each([[1], [4], [0], [-1], ['abc']])(
      'con la página %j tiene una sola página, la 1, sin elementos',
      (pagina) => {
        expect(paginar([], pagina, 2)).toEqual({ elementos: [], pagina: 1, totalPaginas: 1 });
      },
    );
  });

  describe('cuántas páginas hay', () => {
    it.each([
      [0, 3, 1, 'lista vacía: una página'],
      [1, 3, 1, 'un elemento'],
      [3, 3, 1, 'justo los que caben en una página'],
      [4, 3, 2, 'uno más de los que caben: una segunda página'],
      [6, 3, 2, 'justo el doble: no hay una página de más, vacía'],
      [7, 3, 3, 'dos páginas llenas y un elemento suelto'],
      [5, 1, 5, 'un elemento por página'],
      [5, 100, 1, 'caben muchos más de los que hay'],
    ])('con %i elementos y %i por página hay %i páginas (%s)', (cuantos, porPagina, total) => {
      const lista = Array.from({ length: cuantos }, (_, indice) => indice);
      expect(paginar(lista, 1, porPagina).totalPaginas).toBe(total);
    });

    it('la última página de una lista que se reparte exacta trae todos sus elementos', () => {
      expect(paginar([1, 2, 3, 4, 5, 6], 2, 3)).toEqual({
        elementos: [4, 5, 6],
        pagina: 2,
        totalPaginas: 2,
      });
    });
  });

  describe('porPagina no válido', () => {
    it.each([
      [0, 'cero'],
      [-2, 'negativo'],
      [1.5, 'decimal'],
      [NaN, 'NaN'],
      [Infinity, 'infinito'],
      ['2', 'texto, aunque sea un número'],
      [null, 'null'],
      [undefined, 'no se pasa'],
    ])('con %j lanza un RangeError porque es %s', (porPagina) => {
      expect(() => paginar(LETRAS, 1, porPagina)).toThrow(RangeError);
    });

    it('el mensaje dice qué valor llegó', () => {
      expect(() => paginar(LETRAS, 1, 0)).toThrow('porPagina tiene que ser un número entero');
      expect(() => paginar(LETRAS, 1, 0)).toThrow('y es 0');
    });

    it('falla también con una lista vacía', () => {
      expect(() => paginar([], 1, 0)).toThrow(RangeError);
    });
  });

  describe('no modifica lo que recibe', () => {
    it('no cambia la lista original, aunque esté congelada', () => {
      const lista = Object.freeze(['a', 'b', 'c']);
      expect(() => paginar(lista, 1, 2)).not.toThrow();
      expect(lista).toEqual(['a', 'b', 'c']);
    });

    it('devuelve una lista nueva: cambiarla no cambia la original', () => {
      const lista = ['a', 'b', 'c'];
      const { elementos } = paginar(lista, 1, 5);
      elementos.push('z');
      expect(lista).toEqual(['a', 'b', 'c']);
    });

    it('conserva el orden de la lista y los mismos objetos, sin copiarlos', () => {
      const primero = { id: 1 };
      const segundo = { id: 2 };
      const { elementos } = paginar([primero, segundo], 1, 2);
      expect(elementos[0]).toBe(primero);
      expect(elementos[1]).toBe(segundo);
    });
  });
});
