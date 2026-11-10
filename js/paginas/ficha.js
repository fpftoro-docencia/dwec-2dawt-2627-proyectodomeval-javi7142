import { iniciarCabecera } from '../componentes/cabecera.js';
import { leerSesion } from '../datos/sesion.js';

iniciarCabecera(document.querySelector('.cabecera'), leerSesion(sessionStorage));
