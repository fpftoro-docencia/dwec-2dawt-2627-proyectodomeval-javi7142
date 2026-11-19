/**
 * Botón del ojo en los campos de contraseña: enseña u oculta lo escrito cambiando el campo entre
 * `type="password"` y `type="text"`.
 *
 * El HTML pone el botón `[data-ver-clave]` dentro de la caja del campo, con `aria-pressed` y
 * `aria-label`. El código solo cambia esos atributos y el tipo del campo; el CSS lee `aria-pressed`
 * para enseñar el ojo abierto o tachado.
 *
 * @module componentes/ver-clave
 */

/**
 * Conecta con un único oyente todos los botones `[data-ver-clave]` de un formulario (delegación).
 * @param {HTMLFormElement} formulario
 * @listens click
 * @example
 * iniciarVerClave(document.querySelector('#formulario-acceso'));
 */
export function iniciarVerClave(formulario) {
  formulario.addEventListener('click', (evento) => {
    const boton = evento.target.closest('[data-ver-clave]');
    if (!boton) {
      return;
    }
    const campo = boton.parentElement.querySelector('input');
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    boton.setAttribute('aria-pressed', String(mostrar));
    boton.setAttribute('aria-label', mostrar ? 'Ocultar la contraseña' : 'Mostrar la contraseña');
  });
}
