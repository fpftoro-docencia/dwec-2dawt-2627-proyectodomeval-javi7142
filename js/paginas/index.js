import { iniciarAvisos } from '../componentes/avisos.js';
import { iniciarEscena } from '../componentes/escena.js';
import { iniciarPisadas } from '../componentes/pisadas.js';

iniciarAvisos(document, sessionStorage);
iniciarEscena(document.querySelector('#escena'));
iniciarPisadas(document.querySelector('#pisadas'));
