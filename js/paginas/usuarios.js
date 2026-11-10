import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarCabecera } from '../componentes/cabecera.js';
import { leerSesion } from '../datos/sesion.js';

iniciarAvisos(document, sessionStorage);
iniciarCabecera(document.querySelector('.cabecera'), leerSesion(sessionStorage));
