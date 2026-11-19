// Recorrido del CRUD de extremo a extremo (requisito 21): dar de alta un animal con la ficha
// completa, verlo en el listado, editarlo y borrarlo con confirmación, comprobando en cada paso que
// lo guardado sigue ahí al recargar. Cada prueba empieza con el almacenamiento vacío (Playwright da
// un contexto nuevo) y con el usuario de prueba ya registrado, como administrador.
import { test, expect } from '@playwright/test';
import {
  ANIMAL_PRUEBA,
  darDeAlta,
  elegirOpcion,
  escribir,
  escribirFecha,
  guardarFicha,
  registrarse,
  tarjetaDe,
} from './ayudas.js';

const { nombre } = ANIMAL_PRUEBA;

test.describe('CRUD de animales', () => {
  test.beforeEach(async ({ page }) => {
    await registrarse(page);
  });

  test('da de alta un animal con la ficha completa y lo ve en el listado, también tras recargar', async ({
    page,
  }) => {
    await expect(page.getByText('Ahora mismo cuidas de 0 animales.')).toBeVisible();

    await darDeAlta(page);

    await expect(page.getByText(`Has guardado la ficha de ${nombre}.`)).toBeVisible();
    await expect(page.getByText('Ahora mismo cuidas de 1 animal.')).toBeVisible();
    const tarjeta = tarjetaDe(page, nombre);
    await expect(tarjeta).toHaveCount(1);
    await expect(tarjeta.getByText('Perro, macho. 12,5 kg')).toBeVisible();
    await expect(tarjeta.getByText('Disponible', { exact: true })).toBeVisible();
    await expect(tarjeta.getByText('1 de 3 vacunas')).toBeVisible();
    await expect(tarjeta.locator('img.animal__foto')).toHaveAttribute('src', /perro-3\.webp$/);

    await page.reload();

    await expect(tarjetaDe(page, nombre)).toHaveCount(1);
    await expect(page.getByText('Ahora mismo cuidas de 1 animal.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Disponibles 1$/ })).toBeVisible();
  });

  test('la ficha guardada se abre desde «Editar» con todos sus datos, también tras recargar', async ({
    page,
  }) => {
    await darDeAlta(page);

    await tarjetaDe(page, nombre).getByRole('link', { name: 'Editar' }).click();

    await expect(page).toHaveURL(/ficha\.html\?id=/);
    for (const recargar of [false, true]) {
      if (recargar) {
        await page.reload();
      }
      await expect(page.getByRole('heading', { name: nombre, level: 1 })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Nombre *', exact: true })).toHaveValue(
        nombre,
      );
      await expect(page.getByLabel('Especie *')).toHaveValue('perro');
      await expect(page.getByRole('radio', { name: 'Macho' })).toBeChecked();
      await expect(page.getByLabel('Fecha de ingreso *')).toHaveValue(ANIMAL_PRUEBA.ingreso);
      await expect(page.getByLabel('Peso en kilos *')).toHaveValue('12.5');
      await expect(page.getByLabel('Microchip *')).toHaveValue(ANIMAL_PRUEBA.microchip);
      await expect(page.getByRole('radio', { name: /^Foto 3 de / })).toBeChecked();
      await expect(page.getByRole('radio', { name: 'Disponible' })).toBeChecked();
      await expect(page.getByRole('switch', { name: 'Está esterilizado' })).toBeChecked();
      await expect(page.getByLabel('Fecha de esterilización *')).toHaveValue(
        ANIMAL_PRUEBA.fechaEsterilizacion,
      );
      await expect(page.getByLabel('Vacuna *')).toHaveValue('rabia');
      await expect(page.getByLabel('Fecha *', { exact: true })).toHaveValue(
        ANIMAL_PRUEBA.vacuna.fecha,
      );
      await expect(page.getByText('1 de 3 vacunas')).toBeVisible();
    }
  });

  test('edita el animal: cambia sus datos, no se duplica y los cambios siguen al recargar', async ({
    page,
  }) => {
    await darDeAlta(page);
    await tarjetaDe(page, nombre).getByRole('link', { name: 'Editar' }).click();
    await expect(page).toHaveURL(/ficha\.html\?id=/);

    await escribir(page.getByRole('textbox', { name: 'Nombre *', exact: true }), 'Thor Grande');
    await escribir(page.getByLabel('Peso en kilos *'), '13.4');
    await elegirOpcion(page, 'Estado *', 'Adoptado');
    // Al elegir «Adoptado» aparece «Quién lo adopta», con su propio campo «Nombre *»
    await escribir(page.getByRole('textbox', { name: 'Nombre *', exact: true }).nth(1), 'Lucía');
    await escribir(page.getByLabel('DNI *'), '12345678Z');
    await page.getByRole('button', { name: 'Añadir vacuna' }).click();
    await page.getByLabel('Vacuna *').nth(1).selectOption({ label: 'Polivalente' });
    await escribirFecha(page.getByLabel('Fecha *', { exact: true }).nth(1), '2025-10-20');
    await guardarFicha(page);

    await expect(page.getByText('Has guardado los cambios de Thor Grande.')).toBeVisible();
    // Un animal adoptado ya no está a su cuidado, pero sigue en el listado: no se ha duplicado
    await expect(page.getByText('Ahora mismo cuidas de 0 animales.')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Todos 1$/ })).toBeVisible();
    await expect(tarjetaDe(page, 'Thor Grande')).toHaveCount(1);
    await expect(tarjetaDe(page, nombre)).toHaveCount(0);

    await page.reload();

    const tarjeta = tarjetaDe(page, 'Thor Grande');
    await expect(tarjeta).toHaveCount(1);
    await expect(tarjeta.getByText('Perro, macho. 13,4 kg')).toBeVisible();
    await expect(tarjeta.getByText('2 de 3 vacunas')).toBeVisible();
    await expect(page.getByRole('button', { name: /^Adoptados 1$/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Disponibles 0$/ })).toBeVisible();
  });

  test('al borrar, si se cancela en el diálogo el animal sigue ahí, también tras recargar', async ({
    page,
  }) => {
    await darDeAlta(page);

    await tarjetaDe(page, nombre).getByRole('button', { name: 'Borrar' }).click();
    const dialogo = page.getByRole('dialog', { name: `¿Borrar la ficha de ${nombre}?` });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Cancelar' }).click();

    await expect(dialogo).toBeHidden();
    await expect(tarjetaDe(page, nombre)).toHaveCount(1);
    await expect(page.getByText('Ahora mismo cuidas de 1 animal.')).toBeVisible();
    await expect(page.getByText(`Has borrado la ficha de ${nombre}.`)).toBeHidden();

    await page.reload();

    await expect(tarjetaDe(page, nombre)).toHaveCount(1);
  });

  test('borra el animal al confirmar en el diálogo y sigue borrado al recargar', async ({
    page,
  }) => {
    await darDeAlta(page);

    await tarjetaDe(page, nombre).getByRole('button', { name: 'Borrar' }).click();
    const dialogo = page.getByRole('dialog', { name: `¿Borrar la ficha de ${nombre}?` });
    await expect(dialogo).toBeVisible();
    await dialogo.getByRole('button', { name: 'Borrar la ficha' }).click();

    await expect(dialogo).toBeHidden();
    await expect(page.getByText(`Has borrado la ficha de ${nombre}.`)).toBeVisible();
    await expect(tarjetaDe(page, nombre)).toHaveCount(0);
    await expect(page.getByText('Ahora mismo cuidas de 0 animales.')).toBeVisible();

    await page.reload();

    await expect(tarjetaDe(page, nombre)).toHaveCount(0);
    await expect(page.getByText('Ahora mismo cuidas de 0 animales.')).toBeVisible();
  });
});
