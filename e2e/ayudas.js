// Funciones de ayuda para las pruebas de extremo a extremo: los pasos que repiten varios recorridos
// (registrarse, entrar y salir) hechos como los haría una persona, buscando cada elemento por su
// rol, su etiqueta o su texto y con direcciones relativas, para que valgan igual con `serve` que
// contra la web desplegada (`BASE_URL`).
import { expect } from '@playwright/test';

/** La dirección del listado, con o sin el `?pagina=` que la página le añade al cargar. */
export const URL_LISTADO = /listado\.html(\?.*)?$/;

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
  await expect(page).toHaveURL(URL_LISTADO);
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

/** Un animal de prueba con todos los campos de la ficha, con datos inventados y válidos. */
export const ANIMAL_PRUEBA = {
  nombre: 'Thor',
  especie: 'Perro',
  sexo: 'Macho',
  ingreso: '2025-09-10',
  peso: '12.5',
  microchip: '982000123456789',
  // La tercera foto de la galería de la especie
  numeroFoto: 3,
  estado: 'Disponible',
  fechaEsterilizacion: '2025-09-25',
  vacuna: { tipo: 'Rabia', fecha: '2025-10-15' },
};

/**
 * Escribe en un campo de texto como una persona: lo rellena y sale de él con la tecla Tab.
 * @param {import('@playwright/test').Locator} campo
 * @param {string} texto
 */
export async function escribir(campo, texto) {
  await campo.fill(texto);
  await campo.press('Tab');
}

/**
 * Rellena una fecha y sale del campo. En un campo de fecha la tecla Tab solo pasa de un trozo
 * (día, mes, año) al siguiente, así que se sale quitándole el foco.
 * @param {import('@playwright/test').Locator} campo
 * @param {string} fecha La fecha como `AAAA-MM-DD`.
 */
export async function escribirFecha(campo, fecha) {
  await campo.fill(fecha);
  await campo.blur();
}

/**
 * Elige una opción de un grupo de botones de opción (Sexo o Estado) pulsando su etiqueta: los
 * botones de verdad no reciben clics, los recibe su etiqueta.
 * @param {import('@playwright/test').Page} page
 * @param {string} grupo El nombre del grupo, tal como lo lee un lector de pantalla (`'Sexo *'`).
 * @param {string} opcion El texto de la opción (`'Macho'`).
 */
export async function elegirOpcion(page, grupo, opcion) {
  await page.getByRole('group', { name: grupo }).getByText(opcion, { exact: true }).click();
  await expect(page.getByRole('radio', { name: opcion, exact: true })).toBeChecked();
}

/**
 * Elige una foto de la galería de la ficha por su número. El botón de opción de cada foto está
 * oculto dentro de su etiqueta, así que se pulsa la etiqueta (la foto).
 * @param {import('@playwright/test').Page} page
 * @param {number} numero El número de la foto, desde 1 (`Foto 3 de 9`).
 */
export async function elegirFoto(page, numero) {
  const radio = page.getByRole('radio', { name: new RegExp(`^Foto ${numero} de `) });
  await page.locator('label', { has: radio }).click();
  await expect(radio).toBeChecked();
}

/**
 * Rellena la ficha de un animal nuevo (`ficha.html`) campo a campo, sin enviarla. Lo que depende
 * de otra cosa se rellena después: la foto, cuando hay especie, y la fecha de esterilización,
 * cuando se marca el interruptor.
 * @param {import('@playwright/test').Page} page
 * @param {typeof ANIMAL_PRUEBA} [animal]
 */
export async function rellenarFicha(page, animal = ANIMAL_PRUEBA) {
  await escribir(page.getByRole('textbox', { name: 'Nombre *', exact: true }), animal.nombre);
  await page.getByLabel('Especie *').selectOption({ label: animal.especie });
  await elegirOpcion(page, 'Sexo *', animal.sexo);
  await escribirFecha(page.getByLabel('Fecha de ingreso *'), animal.ingreso);
  await escribir(page.getByLabel('Peso en kilos *'), animal.peso);
  await escribir(page.getByLabel('Microchip *'), animal.microchip);

  await elegirFoto(page, animal.numeroFoto);

  await elegirOpcion(page, 'Estado *', animal.estado);
  await page.getByRole('switch', { name: 'Está esterilizado' }).check();
  await escribirFecha(page.getByLabel('Fecha de esterilización *'), animal.fechaEsterilizacion);

  await page.getByRole('button', { name: 'Añadir vacuna' }).click();
  await page.getByLabel('Vacuna *').selectOption({ label: animal.vacuna.tipo });
  await escribirFecha(page.getByLabel('Fecha *', { exact: true }), animal.vacuna.fecha);
}

/**
 * Pulsa «Guardar la ficha» y espera a estar de vuelta en el listado.
 * @param {import('@playwright/test').Page} page
 */
export async function guardarFicha(page) {
  await page.getByRole('button', { name: 'Guardar la ficha' }).click();
  await expect(page).toHaveURL(URL_LISTADO);
}

/**
 * Da de alta un animal desde el listado: «Registrar un animal», rellena la ficha y la guarda.
 * @param {import('@playwright/test').Page} page Una página que ya está en el listado.
 * @param {typeof ANIMAL_PRUEBA} [animal]
 */
export async function darDeAlta(page, animal = ANIMAL_PRUEBA) {
  await page.getByRole('link', { name: 'Registrar un animal' }).click();
  await expect(page).toHaveURL(/ficha\.html$/);
  await rellenarFicha(page, animal);
  await guardarFicha(page);
}

/**
 * La tarjeta de un animal en el listado, buscada por su nombre.
 * @param {import('@playwright/test').Page} page
 * @param {string} nombre
 * @returns {import('@playwright/test').Locator}
 */
export function tarjetaDe(page, nombre) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByRole('heading', { name: nombre, exact: true }) });
}
