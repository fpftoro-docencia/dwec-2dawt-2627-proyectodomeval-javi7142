/**
 * Página de la ficha de un animal (`ficha.html`).
 *
 * Necesita del HTML: el formulario `#formulario-animal` con sus campos, la galería de fotos
 * (`#bloque-foto`, `#galeria-fotos`, `#plantilla-foto` y `#ayuda-foto`), los bloques condicionales
 * `#bloque-esterilizacion` y `#bloque-adopcion`, el grupo de vacunas (`#grupo-vacunas`,
 * `#anadir-vacuna`, `#contador-vacunas` y `#plantilla-vacuna`) y la cabecera común.
 * Además inicia los avisos, la cabecera y «Cerrar sesión».
 *
 * @module paginas/ficha
 */
import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarCamposCondicionales } from '../componentes/campos-condicionales.js';
import { iniciarGaleriaFotos } from '../componentes/galeria-fotos.js';
import { iniciarGrupoVacunas } from '../componentes/grupo-vacunas.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { leerSesion } from '../datos/sesion.js';

/**
 * Inicia la ficha. Sin sesión, la página protegida lleva a `index.html`. Con sesión, conecta la
 * galería de fotos con la lista de especies y los campos condicionales con la casilla de
 * esterilización y el estado, y pone en marcha el grupo de vacunas.
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

  iniciarGaleriaFotos({
    especie: documento.querySelector('#especie'),
    bloque: documento.querySelector('#bloque-foto'),
    galeria: documento.querySelector('#galeria-fotos'),
    plantilla: documento.querySelector('#plantilla-foto'),
    ayuda: documento.querySelector('#ayuda-foto'),
  });
  iniciarCamposCondicionales(documento.querySelector('#formulario-animal'), {
    esterilizacion: documento.querySelector('#bloque-esterilizacion'),
    adopcion: documento.querySelector('#bloque-adopcion'),
  });
  iniciarGrupoVacunas({
    grupo: documento.querySelector('#grupo-vacunas'),
    boton: documento.querySelector('#anadir-vacuna'),
    contador: documento.querySelector('#contador-vacunas'),
    plantilla: documento.querySelector('#plantilla-vacuna'),
  });
}

iniciarFicha(document, {
  almacenSesion: sessionStorage,
  // `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
  navegar: (pagina) => location.replace(pagina),
});
