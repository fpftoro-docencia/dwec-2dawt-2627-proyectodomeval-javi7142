// Recorrido de la sesión de extremo a extremo (requisito 21): registrarse como primer usuario,
// cerrar la sesión y volver a entrar. Cada prueba empieza con el almacenamiento vacío porque
// Playwright le da un contexto de navegador nuevo.
import { test, expect } from '@playwright/test';
import {
  URL_LISTADO,
  USUARIO_PRUEBA,
  enlaceUsuarios,
  entrar,
  registrarse,
  salir,
} from './ayudas.js';

const { usuario, clave } = USUARIO_PRUEBA;

test.describe('Sesión', () => {
  test('el primer usuario se registra, entra en el listado y ve «Usuarios» porque es administrador', async ({
    page,
  }) => {
    await registrarse(page);

    await expect(page.getByText(`Te has registrado, ${usuario}.`)).toBeVisible();
    await expect(page.getByText(usuario, { exact: true })).toBeVisible();
    await expect(page.getByText('administrador', { exact: true })).toBeVisible();
    await expect(enlaceUsuarios(page)).toBeVisible();
  });

  test('cierra la sesión, vuelve a la página de acceso y vuelve a entrar con sus datos', async ({
    page,
  }) => {
    await registrarse(page);
    await salir(page);
    await expect(page.getByText('Has cerrado la sesión. ¡Hasta pronto!')).toBeVisible();

    await entrar(page, usuario, clave);

    await expect(page).toHaveURL(URL_LISTADO);
    await expect(page.getByText(`Hola de nuevo, ${usuario}.`)).toBeVisible();
    await expect(page.getByText('administrador', { exact: true })).toBeVisible();
    await expect(enlaceUsuarios(page)).toBeVisible();
  });

  test('con una contraseña incorrecta avisa y se queda en la página de acceso', async ({
    page,
  }) => {
    await registrarse(page);
    await salir(page);

    await entrar(page, usuario, 'OtraClave123');

    await expect(page.getByText('El usuario o la contraseña no son correctos.')).toBeVisible();
    await expect(page).toHaveURL(/index\.html$/);
    await expect(page.getByLabel('Contraseña', { exact: true })).toBeEmpty();
  });

  test('un segundo usuario entra como usuario normal y no ve «Usuarios»', async ({ page }) => {
    await registrarse(page);
    await salir(page);

    await registrarse(page, { usuario: 'pablo', correo: 'pablo@ejemplo.es', clave });

    await expect(page.getByText('pablo', { exact: true })).toBeVisible();
    await expect(page.getByText('usuario', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar sesión' })).toBeVisible();
    await expect(enlaceUsuarios(page)).toBeHidden();
  });

  test('sin sesión, el listado lleva a la página de acceso', async ({ page }) => {
    await page.goto('/listado.html');

    await expect(page).toHaveURL(/index\.html$/);
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('con la sesión iniciada, la página de acceso lleva directamente al listado', async ({
    page,
  }) => {
    await registrarse(page);

    await page.goto('/index.html');

    await expect(page).toHaveURL(URL_LISTADO);
  });
});
