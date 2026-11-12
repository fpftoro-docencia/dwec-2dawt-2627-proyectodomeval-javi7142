import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { iniciarCierreSesion, protegerPagina } from '../componentes/proteccion.js';
import { leerSesion } from '../datos/sesion.js';

const sesion = leerSesion(sessionStorage);
// `replace`: la página protegida no se queda en el historial, así «Atrás» no vuelve a ella
const navegar = (pagina) => location.replace(pagina);

if (protegerPagina(sesion, { almacenSesion: sessionStorage, navegar })) {
  // Puede quedarse: con esta marca el CSS deja ver la página, que hasta ahora estaba oculta
  document.body.dataset.sesionComprobada = '';
  iniciarAvisos(document, sessionStorage);
  iniciarCabecera(document.querySelector('.cabecera'), sesion);
  iniciarCierreSesion(document.querySelector('#cerrar-sesion'), {
    almacenSesion: sessionStorage,
    navegar,
  });
}
