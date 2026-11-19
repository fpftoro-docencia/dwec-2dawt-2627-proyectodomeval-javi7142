/**
 * Página de la ficha de un animal (`ficha.html`).
 *
 * Necesita del HTML: el formulario `#formulario-animal` con sus campos, la galería de fotos
 * (`#bloque-foto`, `#galeria-fotos`, `#plantilla-foto` y `#ayuda-foto`), los bloques condicionales
 * `#bloque-esterilizacion` y `#bloque-adopcion`, el grupo de vacunas (`#grupo-vacunas`,
 * `#anadir-vacuna`, `#contador-vacunas` y `#plantilla-vacuna`), la cartilla `#cartilla` con sus
 * datos, sus sellos y su barra de progreso, y la cabecera común.
 * Además inicia los avisos, la cabecera y «Cerrar sesión».
 *
 * @module paginas/ficha
 */
import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarCamposCondicionales } from '../componentes/campos-condicionales.js';
import { iniciarCartilla } from '../componentes/cartilla.js';
import { iniciarGaleriaFotos } from '../componentes/galeria-fotos.js';
import { iniciarGrupoVacunas } from '../componentes/grupo-vacunas.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { leerSesion } from '../datos/sesion.js';

/**
 * Inicia la ficha. Sin sesión, la página protegida lleva a `index.html`. Con sesión, conecta la
 * galería de fotos con la lista de especies y los campos condicionales con la casilla de
 * esterilización y el estado, pone en marcha el grupo de vacunas y hace que la cartilla se
 * rellene sola.
 * @param {Document} documento
 * @param {object} dependencias
 * @param {Storage} dependencias.almacenSesion Donde está la sesión y los avisos (`sessionStorage`).
 * @param {function(string): void} dependencias.navegar Cómo ir a otra página.
 */
export function iniciarFicha(documento, { almacenSesion, navegar }) {
  const sesion = leerSesion(almacenSesion);
  if (!protegerPagina(sesion, { almacenSesion, navegar })) {
    return;
  }
  // Puede quedarse: con esta marca el CSS deja ver la página, que hasta ahora estaba oculta
  documento.body.dataset.sesionComprobada = '';
  iniciarAvisos(documento, almacenSesion);
  iniciarCabecera(documento.querySelector('.cabecera'), sesion);
  iniciarCierreSesion(documento.querySelector('#cerrar-sesion'), { almacenSesion, navegar });

  const formulario = documento.querySelector('#formulario-animal');
  const buscar = (selector) => documento.querySelector(selector);

  iniciarGaleriaFotos({
    especie: buscar('#especie'),
    bloque: buscar('#bloque-foto'),
    galeria: buscar('#galeria-fotos'),
    plantilla: buscar('#plantilla-foto'),
    ayuda: buscar('#ayuda-foto'),
  });
  iniciarCamposCondicionales(formulario, {
    esterilizacion: buscar('#bloque-esterilizacion'),
    adopcion: buscar('#bloque-adopcion'),
  });
  iniciarGrupoVacunas({
    grupo: buscar('#grupo-vacunas'),
    boton: buscar('#anadir-vacuna'),
    contador: buscar('#contador-vacunas'),
    plantilla: buscar('#plantilla-vacuna'),
  });
  // La última: así se rellena por primera vez con la galería y las vacunas ya puestas
  iniciarCartilla(formulario, {
    cartilla: buscar('#cartilla'),
    foto: buscar('#cartilla-foto'),
    silueta: buscar('#cartilla-silueta'),
    nombre: buscar('#cartilla-nombre'),
    especie: buscar('#cartilla-especie'),
    sexo: buscar('#cartilla-sexo'),
    ingreso: buscar('#cartilla-ingreso'),
    peso: buscar('#cartilla-peso'),
    microchip: buscar('#cartilla-microchip'),
    sellos: buscar('#cartilla-sellos'),
    progreso: buscar('#progreso-ficha'),
    textoProgreso: buscar('#progreso-texto'),
  });
}

iniciarFicha(document, {
  almacenSesion: sessionStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
