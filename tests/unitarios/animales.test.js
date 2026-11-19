// Tests del módulo de animales (requisito 21): alta, lectura, búsqueda, edición y borrado, con
// `AlmacenFalso` en lugar de `localStorage` y con `generarId` inyectado para saber qué `id` sale.
// Incluyen los datos estropeados: editar el almacenamiento a mano no debe romper la lectura.
// Todos los datos son inventados.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlmacenFalso } from '../AlmacenFalso.js';
import {
  borrarAnimal,
  buscarAnimal,
  claveAnimales,
  crearAnimal,
  editarAnimal,
  leerAnimales,
  PREFIJO_ANIMALES,
} from '../../js/datos/animales.js';

/** Datos de un animal tal como los leería la ficha, todavía sin `id`. */
const LUNA = {
  nombre: 'Luna',
  especie: 'perro',
  sexo: 'hembra',
  ingreso: '2026-10-13',
  peso: 18.4,
  microchip: '941000024681357',
  foto: 'perro-1',
  estado: 'disponible',
  esterilizado: true,
  fechaEsterilizacion: '2026-10-20',
  adopcion: null,
  vacunas: [{ tipo: 'rabia', fecha: '2026-10-15' }],
};
const TOBY = { ...LUNA, nombre: 'Toby', sexo: 'macho', foto: 'perro-2', vacunas: [] };
const NALA = { ...LUNA, nombre: 'Nala', especie: 'gato', foto: 'gato-1', vacunas: [] };

/** Un `generarId` que da `a1`, `a2`, `a3`… para que los tests sepan qué `id` sale. */
function contadorDeIds() {
  let siguiente = 0;
  return vi.fn(() => `a${++siguiente}`);
}

describe('claveAnimales', () => {
  it('es el prefijo y el nombre del usuario', () => {
    expect(claveAnimales('lola')).toBe('huellas.animales.lola');
    expect(PREFIJO_ANIMALES).toBe('huellas.animales.');
  });

  it.each([
    ['con mayúsculas', 'Lola'],
    ['todo en mayúsculas', 'LOLA'],
    ['con espacios alrededor', '  lola  '],
  ])('el nombre %s da la misma clave que «lola»', (_motivo, nombre) => {
    expect(claveAnimales(nombre)).toBe(claveAnimales('lola'));
  });

  it('dos usuarios distintos tienen claves distintas', () => {
    expect(claveAnimales('lola')).not.toBe(claveAnimales('iker'));
  });
});

describe('animales', () => {
  let almacen;

  beforeEach(() => {
    almacen = new AlmacenFalso();
  });

  describe('leerAnimales', () => {
    it('sin datos, la lista está vacía', () => {
      expect(leerAnimales(almacen, 'lola')).toEqual([]);
    });

    it('lee la lista guardada, con todos sus campos y en su orden', () => {
      const guardados = [
        { ...LUNA, id: 'a1' },
        { ...TOBY, id: 'a2' },
      ];
      almacen.setItem(claveAnimales('lola'), JSON.stringify(guardados));
      expect(leerAnimales(almacen, 'lola')).toEqual(guardados);
    });

    it('«Lola» y «lola» ven la misma lista', () => {
      almacen.setItem(claveAnimales('lola'), JSON.stringify([{ ...LUNA, id: 'a1' }]));
      expect(leerAnimales(almacen, 'Lola')).toHaveLength(1);
      expect(leerAnimales(almacen, ' LOLA ')).toHaveLength(1);
    });

    it('cada usuario ve solo sus animales', () => {
      almacen.setItem(claveAnimales('lola'), JSON.stringify([{ ...LUNA, id: 'a1' }]));
      expect(leerAnimales(almacen, 'iker')).toEqual([]);
    });

    // Datos estropeados: lo guardado entero no es una lista
    it.each([
      ['no es JSON', '{roto'],
      ['es texto vacío', ''],
      ['es texto', '"Luna"'],
      ['es un número', '42'],
      ['es null', 'null'],
      ['es un objeto suelto', '{"id":"a1","nombre":"Luna","vacunas":[]}'],
    ])('si lo guardado no es una lista (%s), lee una lista vacía', (_motivo, guardado) => {
      almacen.setItem(claveAnimales('lola'), guardado);
      expect(leerAnimales(almacen, 'lola')).toEqual([]);
    });

    // Datos estropeados: elementos sueltos que no tienen la forma de un animal
    it.each([
      ['es null', null],
      ['es un número', 7],
      ['es un texto', 'Luna'],
      ['es una lista', [{ id: 'a9', nombre: 'Luna', vacunas: [] }]],
      ['no tiene id', { nombre: 'Luna', vacunas: [] }],
      ['tiene un id vacío', { id: '', nombre: 'Luna', vacunas: [] }],
      ['tiene un id que no es texto', { id: 9, nombre: 'Luna', vacunas: [] }],
      ['no tiene nombre', { id: 'a9', vacunas: [] }],
      ['tiene un nombre vacío', { id: 'a9', nombre: '', vacunas: [] }],
      ['tiene un nombre de solo espacios', { id: 'a9', nombre: '   ', vacunas: [] }],
      ['tiene un nombre que no es texto', { id: 'a9', nombre: 5, vacunas: [] }],
      ['no tiene vacunas', { id: 'a9', nombre: 'Luna' }],
      ['tiene las vacunas como texto', { id: 'a9', nombre: 'Luna', vacunas: 'rabia' }],
      ['tiene las vacunas como objeto', { id: 'a9', nombre: 'Luna', vacunas: {} }],
    ])('descarta un elemento que %s y se queda con el bueno', (_motivo, estropeado) => {
      const bueno = { ...LUNA, id: 'a1' };
      almacen.setItem(claveAnimales('lola'), JSON.stringify([estropeado, bueno]));
      expect(leerAnimales(almacen, 'lola')).toEqual([bueno]);
    });

    it('si todos los elementos están estropeados, lee una lista vacía', () => {
      almacen.setItem(claveAnimales('lola'), JSON.stringify([null, 3, {}]));
      expect(leerAnimales(almacen, 'lola')).toEqual([]);
    });

    it('un animal con la forma mínima vale, aunque le falten el resto de campos', () => {
      const minimo = { id: 'a1', nombre: 'Luna', vacunas: [] };
      almacen.setItem(claveAnimales('lola'), JSON.stringify([minimo]));
      expect(leerAnimales(almacen, 'lola')).toEqual([minimo]);
    });
  });

  describe('buscarAnimal', () => {
    beforeEach(() => {
      almacen.setItem(
        claveAnimales('lola'),
        JSON.stringify([
          { ...LUNA, id: 'a1' },
          { ...TOBY, id: 'a2' },
        ]),
      );
    });

    it('devuelve el animal con ese id', () => {
      expect(buscarAnimal(almacen, 'lola', 'a2')).toEqual({ ...TOBY, id: 'a2' });
    });

    it.each([
      ['un id que no existe', 'a9'],
      ['un id vacío', ''],
      ['un id con otras mayúsculas', 'A1'],
      ['un id que no es texto', 1],
      ['undefined, porque la dirección no trae ?id=', undefined],
      ['null, porque la dirección no trae ?id=', null],
    ])('con %s devuelve null', (_motivo, id) => {
      expect(buscarAnimal(almacen, 'lola', id)).toBeNull();
    });

    it('no encuentra el animal de otro usuario', () => {
      expect(buscarAnimal(almacen, 'iker', 'a1')).toBeNull();
    });

    it('con los datos estropeados devuelve null', () => {
      almacen.setItem(claveAnimales('lola'), '{roto');
      expect(buscarAnimal(almacen, 'lola', 'a1')).toBeNull();
    });

    it('no encuentra un animal estropeado, aunque tenga ese id', () => {
      almacen.setItem(claveAnimales('lola'), JSON.stringify([{ id: 'a1', nombre: '' }]));
      expect(buscarAnimal(almacen, 'lola', 'a1')).toBeNull();
    });
  });

  describe('crearAnimal', () => {
    it('guarda el animal con el id que da generarId y lo devuelve', () => {
      const generarId = vi.fn(() => 'a1');
      const nuevo = crearAnimal(almacen, 'lola', LUNA, generarId);
      expect(nuevo).toEqual({ ...LUNA, id: 'a1' });
      expect(generarId).toHaveBeenCalledTimes(1);
      expect(leerAnimales(almacen, 'lola')).toEqual([{ ...LUNA, id: 'a1' }]);
    });

    it('lo guarda como JSON en la clave del usuario', () => {
      crearAnimal(almacen, 'Lola', LUNA, () => 'a1');
      expect(JSON.parse(almacen.getItem('huellas.animales.lola'))).toEqual([{ ...LUNA, id: 'a1' }]);
    });

    it('añade al final y conserva los que ya había, cada uno con su id', () => {
      const generarId = contadorDeIds();
      crearAnimal(almacen, 'lola', LUNA, generarId);
      crearAnimal(almacen, 'lola', TOBY, generarId);
      crearAnimal(almacen, 'lola', NALA, generarId);
      expect(leerAnimales(almacen, 'lola').map(({ id, nombre }) => [id, nombre])).toEqual([
        ['a1', 'Luna'],
        ['a2', 'Toby'],
        ['a3', 'Nala'],
      ]);
    });

    it('pone su propio id aunque los datos ya traigan uno', () => {
      const nuevo = crearAnimal(almacen, 'lola', { ...LUNA, id: 'de-otro' }, () => 'a1');
      expect(nuevo.id).toBe('a1');
      expect(leerAnimales(almacen, 'lola')).toHaveLength(1);
    });

    it('no cambia el objeto con los datos que recibe', () => {
      const datos = { ...LUNA };
      crearAnimal(almacen, 'lola', datos, () => 'a1');
      expect(datos).toEqual(LUNA);
      expect(datos).not.toHaveProperty('id');
    });

    it('sin generarId usa un id de verdad, distinto en cada alta', () => {
      const uno = crearAnimal(almacen, 'lola', LUNA);
      const otro = crearAnimal(almacen, 'lola', TOBY);
      expect(uno.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(otro.id).not.toBe(uno.id);
    });

    it('no toca la lista de otro usuario', () => {
      crearAnimal(almacen, 'lola', LUNA, () => 'a1');
      crearAnimal(almacen, 'iker', TOBY, () => 'a2');
      expect(leerAnimales(almacen, 'lola').map(({ nombre }) => nombre)).toEqual(['Luna']);
      expect(leerAnimales(almacen, 'iker').map(({ nombre }) => nombre)).toEqual(['Toby']);
    });

    it('con los datos estropeados se puede dar de alta, y solo queda el nuevo', () => {
      almacen.setItem(claveAnimales('lola'), '{roto');
      crearAnimal(almacen, 'lola', LUNA, () => 'a1');
      expect(leerAnimales(almacen, 'lola')).toEqual([{ ...LUNA, id: 'a1' }]);
    });

    it('con elementos estropeados en la lista, al guardar desaparecen y se conservan los buenos', () => {
      const bueno = { ...TOBY, id: 'a1' };
      almacen.setItem(claveAnimales('lola'), JSON.stringify([null, bueno, { id: 'a8' }]));
      crearAnimal(almacen, 'lola', LUNA, () => 'a2');
      expect(JSON.parse(almacen.getItem(claveAnimales('lola')))).toEqual([
        bueno,
        { ...LUNA, id: 'a2' },
      ]);
    });
  });

  describe('editarAnimal', () => {
    beforeEach(() => {
      const generarId = contadorDeIds();
      crearAnimal(almacen, 'lola', LUNA, generarId);
      crearAnimal(almacen, 'lola', TOBY, generarId);
      crearAnimal(almacen, 'lola', NALA, generarId);
    });

    it('guarda los datos nuevos, conserva el id y devuelve el animal', () => {
      const datos = { ...TOBY, peso: 12.5, estado: 'acogida' };
      expect(editarAnimal(almacen, 'lola', 'a2', datos)).toEqual({ ...datos, id: 'a2' });
      expect(buscarAnimal(almacen, 'lola', 'a2')).toEqual({ ...datos, id: 'a2' });
    });

    it('conserva la posición en la lista y no toca a los demás', () => {
      editarAnimal(almacen, 'lola', 'a2', { ...TOBY, nombre: 'Tobi' });
      expect(leerAnimales(almacen, 'lola')).toEqual([
        { ...LUNA, id: 'a1' },
        { ...TOBY, nombre: 'Tobi', id: 'a2' },
        { ...NALA, id: 'a3' },
      ]);
    });

    it('sustituye todos los datos: un campo que ya no viene desaparece', () => {
      const sinAdopcion = { ...TOBY, estado: 'adoptado' };
      delete sinAdopcion.adopcion;
      editarAnimal(almacen, 'lola', 'a2', sinAdopcion);
      expect(buscarAnimal(almacen, 'lola', 'a2')).not.toHaveProperty('adopcion');
    });

    it('pone el id del animal que se edita aunque los datos traigan otro', () => {
      expect(editarAnimal(almacen, 'lola', 'a2', { ...TOBY, id: 'a1' })?.id).toBe('a2');
      expect(leerAnimales(almacen, 'lola').map(({ id }) => id)).toEqual(['a1', 'a2', 'a3']);
    });

    it('no cambia el objeto con los datos que recibe', () => {
      const datos = { ...TOBY };
      editarAnimal(almacen, 'lola', 'a2', datos);
      expect(datos).toEqual(TOBY);
    });

    it.each([
      ['un id que no existe', 'a9'],
      ['un id vacío', ''],
      ['undefined', undefined],
    ])('con %s devuelve null y no guarda nada', (_motivo, id) => {
      const antes = almacen.getItem(claveAnimales('lola'));
      const guardar = vi.spyOn(almacen, 'setItem');
      expect(editarAnimal(almacen, 'lola', id, { ...TOBY, nombre: 'Otro' })).toBeNull();
      expect(guardar).not.toHaveBeenCalled();
      expect(almacen.getItem(claveAnimales('lola'))).toBe(antes);
    });

    it('no edita el animal de otro usuario', () => {
      expect(editarAnimal(almacen, 'iker', 'a1', { ...LUNA, nombre: 'Otra' })).toBeNull();
      expect(buscarAnimal(almacen, 'lola', 'a1')?.nombre).toBe('Luna');
      expect(almacen.getItem(claveAnimales('iker'))).toBeNull();
    });

    it('con los datos estropeados devuelve null y no guarda nada', () => {
      almacen.setItem(claveAnimales('lola'), '{roto');
      expect(editarAnimal(almacen, 'lola', 'a1', LUNA)).toBeNull();
      expect(almacen.getItem(claveAnimales('lola'))).toBe('{roto');
    });
  });

  describe('borrarAnimal', () => {
    beforeEach(() => {
      const generarId = contadorDeIds();
      crearAnimal(almacen, 'lola', LUNA, generarId);
      crearAnimal(almacen, 'lola', TOBY, generarId);
      crearAnimal(almacen, 'lola', NALA, generarId);
    });

    it('borra el animal, devuelve true y los demás siguen en su orden', () => {
      expect(borrarAnimal(almacen, 'lola', 'a2')).toBe(true);
      expect(leerAnimales(almacen, 'lola').map(({ id }) => id)).toEqual(['a1', 'a3']);
      expect(buscarAnimal(almacen, 'lola', 'a2')).toBeNull();
    });

    it('al borrar el último animal queda una lista vacía guardada', () => {
      borrarAnimal(almacen, 'lola', 'a1');
      borrarAnimal(almacen, 'lola', 'a2');
      borrarAnimal(almacen, 'lola', 'a3');
      expect(almacen.getItem(claveAnimales('lola'))).toBe('[]');
      expect(leerAnimales(almacen, 'lola')).toEqual([]);
    });

    it('borrarlo dos veces devuelve false la segunda', () => {
      expect(borrarAnimal(almacen, 'lola', 'a1')).toBe(true);
      expect(borrarAnimal(almacen, 'lola', 'a1')).toBe(false);
    });

    it.each([
      ['un id que no existe', 'a9'],
      ['un id vacío', ''],
      ['undefined', undefined],
    ])('con %s devuelve false y no guarda nada', (_motivo, id) => {
      const antes = almacen.getItem(claveAnimales('lola'));
      const guardar = vi.spyOn(almacen, 'setItem');
      expect(borrarAnimal(almacen, 'lola', id)).toBe(false);
      expect(guardar).not.toHaveBeenCalled();
      expect(almacen.getItem(claveAnimales('lola'))).toBe(antes);
    });

    it('no borra el animal de otro usuario', () => {
      expect(borrarAnimal(almacen, 'iker', 'a1')).toBe(false);
      expect(leerAnimales(almacen, 'lola')).toHaveLength(3);
    });

    it('sin ningún dato devuelve false y no crea nada', () => {
      const vacio = new AlmacenFalso();
      expect(borrarAnimal(vacio, 'lola', 'a1')).toBe(false);
      expect(vacio.length).toBe(0);
    });

    it('con los datos estropeados devuelve false y no guarda nada', () => {
      almacen.setItem(claveAnimales('lola'), '{roto');
      expect(borrarAnimal(almacen, 'lola', 'a1')).toBe(false);
      expect(almacen.getItem(claveAnimales('lola'))).toBe('{roto');
    });

    it('con elementos estropeados en la lista, al guardar desaparecen y se conservan los buenos', () => {
      const bueno = { ...TOBY, id: 'a1' };
      almacen.setItem(
        claveAnimales('lola'),
        JSON.stringify([null, bueno, { id: 'a8' }, { ...LUNA, id: 'a2' }]),
      );
      expect(borrarAnimal(almacen, 'lola', 'a2')).toBe(true);
      expect(JSON.parse(almacen.getItem(claveAnimales('lola')))).toEqual([bueno]);
    });
  });
});
