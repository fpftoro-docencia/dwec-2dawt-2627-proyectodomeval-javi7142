/**
 * Resumen de la portada de la zona de administración: cuántas personas hay en la protectora y
 * cuántas tienen el rol de administrador. Es una función pura: no usa el DOM ni el almacenamiento,
 * y no cambia lo que recibe.
 *
 * @module logica/resumen-usuarios
 */
import { ROLES } from '../datos/sesion.js';
import { textoContador } from './busqueda.js';

/**
 * Escribe la frase de la portada de `usuarios.html`, con «persona» en singular o en plural.
 * @param {Array<module:datos/usuarios~Usuario>} usuarios Todos los usuarios registrados.
 * @returns {string}
 * @example
 * textoResumenUsuarios([{ rol: 'administrador' }, { rol: 'usuario' }]);
 * // '2 personas en la protectora, 1 con rol de administrador.'
 */
export function textoResumenUsuarios(usuarios) {
  const administradores = usuarios.filter((usuario) => usuario.rol === ROLES.administrador);
  const personas = textoContador(usuarios.length, 'persona', 'personas');
  return `${personas} en la protectora, ${administradores.length} con rol de administrador.`;
}
