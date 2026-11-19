// Funciones de ayuda para las pruebas de extremo a extremo: los pasos que repiten varios recorridos
// (registrarse, entrar y salir) hechos como los haría una persona, buscando cada elemento por su
// rol, su etiqueta o su texto y con direcciones relativas, para que valgan igual con `serve` que
// contra la web desplegada (`BASE_URL`).
import { expect } from '@playwright/test';

/** Un usuario de prueba que cumple todas las reglas del registro. */
export const USUARIO_PRUEBA = {
  usuario: 'marta',
  correo: 'marta@ejemplo.es',
  clave: 'Huellas2026',
};

/**
 * Rellena el formulario de registro y lo envía. Termina cuando la página ha llegado al listado.
 * @param {import('@playwright/test').Page} page
 * @param {{usuario: string, correo: string, clave: string}} [datos]
 */
export async function registrarse(page, datos = USUARIO_PRUEBA) {
  await page.goto('/registro.html');
  await page.getByLabel('Usuario', { exact: true }).fill(datos.usuario);
  await page.getByLabel('Correo electrónico').fill(datos.correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(datos.clave);
  await page.getByLabel('Repite la contraseña').fill(datos.clave);
  await page.getByLabel('Acepto que mis datos se guarden en este navegador.').check();
  await page.getByRole('button', { name: 'Crear mi cuenta' }).click();
  await expect(page).toHaveURL(/listado\.html$/);
}

/**
 * Rellena el formulario de acceso y lo envía. No espera a que cambie de página: así sirve también
 * para probar un acceso que falla.
 * @param {import('@playwright/test').Page} page
 * @param {string} usuario
 * @param {string} clave
 */
export async function entrar(page, usuario, clave) {
  await page.goto('/index.html');
  await page.getByLabel('Usuario', { exact: true }).fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

/**
 * Pulsa «Cerrar sesión» en la cabecera y espera a estar de vuelta en la página de acceso.
 * @param {import('@playwright/test').Page} page
 */
export async function salir(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL(/index\.html$/);
}

/**
 * El enlace «Usuarios» de la cabecera, que solo ven los administradores.
 * @param {import('@playwright/test').Page} page
 * @returns {import('@playwright/test').Locator}
 */
export function enlaceUsuarios(page) {
  return page
    .getByRole('navigation', { name: 'Principal' })
    .getByRole('link', { name: 'Usuarios' });
}
