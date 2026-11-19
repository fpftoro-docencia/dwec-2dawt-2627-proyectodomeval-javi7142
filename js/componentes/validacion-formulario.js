/**
 * Validación de formularios en tiempo real: cada campo se valida la primera vez al salir de él
 * (`blur`) y, a partir de ahí, con cada cambio (`input`), así el error no salta mientras se escribe
 * por primera vez y desaparece en cuanto se corrige.
 *
 * El componente no conoce ningún formulario concreto. Elige la regla de cada campo por su
 * `data-validar` en el objeto `validadores` de `logica/validadores.js` y, si hace falta, añade
 * reglas propias de la página (`reglasExtra`), también las que miran otro campo (repetir la
 * contraseña). Para lo que ya ve el navegador (vacío, mínimos, máximos…) cada página puede dar sus
 * propios textos (`mensajes`); si no, sale un mensaje general. El error se escribe en la caja `.invalid-feedback` del campo (el CSS la enseña
 * cuando tiene texto), el campo se marca con `is-invalid` y `aria-invalid`, y el mensaje también va
 * a `setCustomValidity`, de modo que `checkValidity()` del formulario coincide con lo que se ve.
 *
 * Al enviar con errores, no se envía: se marcan todos los campos, se avisa («Revisa los campos
 * marcados en rojo.») y el foco va al primero que falla. El botón de enviar nunca se desactiva.
 *
 * @module componentes/validacion-formulario
 */

import { validadores } from '../logica/validadores.js';
import { lanzarAviso } from './avisos.js';

/** El aviso que sale al enviar un formulario con errores. */
export const AVISO_REVISAR = 'Revisa los campos marcados en rojo.';

/** Tipos de `input` que no son campos para escribir ni elegir. */
const TIPOS_SIN_VALIDAR = ['hidden', 'submit', 'button', 'reset', 'image'];

/**
 * Una regla propia de un campo: recibe lo escrito, el campo y su formulario, y devuelve el mensaje
 * de error o `''` si es válido. Como mira el formulario, puede depender de otro campo.
 * @callback ReglaExtra
 * @param {string} valor
 * @param {HTMLInputElement} campo
 * @param {HTMLFormElement} formulario
 * @returns {string}
 */

/**
 * Lo que devuelve `iniciarValidacion` para que la página pueda validar por su cuenta.
 * @typedef {object} ValidacionFormulario
 * @property {function(): boolean} validarTodo Valida todos los campos a la vez (y los da por
 *   tocados, así luego se revisan con cada cambio). Devuelve `true` si no hay ningún error.
 * @property {function(HTMLElement): boolean} validarCampo Valida un solo campo y pinta su error.
 *   Devuelve `true` si es válido.
 * @property {function(): void} reiniciar Quita todos los errores y olvida qué campos se tocaron
 *   (por ejemplo, tras guardar o al vaciar el formulario).
 */

/**
 * Dice si un elemento del formulario es un campo que se valida.
 * @param {Element} elemento
 * @returns {boolean}
 */
function esCampo(elemento) {
  return (
    elemento.matches('input, select, textarea') &&
    !TIPOS_SIN_VALIDAR.includes(/** @type {HTMLInputElement} */ (elemento).type)
  );
}

/**
 * Pasa una fecha `AAAA-MM-DD` a `DD/MM/AAAA` para los mensajes; si no tiene esa forma, la deja igual.
 * @param {string} fecha
 * @returns {string}
 */
function fechaLegible(fecha) {
  const [anio, mes, dia] = fecha.split('-');
  return dia ? `${dia}/${mes}/${anio}` : fecha;
}

/**
 * Los fallos que el navegador ya sabe ver en un campo (las propiedades de `validity`), en el orden
 * en que se miran.
 */
const FALLOS_NATIVOS = [
  'valueMissing',
  'typeMismatch',
  'badInput',
  'rangeUnderflow',
  'rangeOverflow',
  'tooShort',
  'tooLong',
  'patternMismatch',
  'stepMismatch',
];

/**
 * Los mensajes propios de un campo, uno por fallo del navegador (`valueMissing`, `rangeOverflow`…).
 * Los que falten usan el mensaje general del componente.
 * @typedef {Object<string, string>} MensajesCampo
 * @example
 * { valueMissing: 'Elige una especie.' }
 */

/**
 * Escribe el mensaje de error de lo que el navegador ya sabe del campo (`validity`): vacío, formato,
 * mínimos y máximos. Usa el mensaje propio del campo si la página lo ha dado y, si no, el general.
 * Devuelve `''` si el navegador no ve ningún problema.
 * @param {HTMLInputElement} campo
 * @param {MensajesCampo} [propios] Los mensajes propios de ese campo.
 * @returns {string}
 */
function mensajeNativo(campo, propios = {}) {
  const fallo = FALLOS_NATIVOS.find((nombre) => campo.validity[nombre]);
  if (!fallo) {
    return '';
  }
  return propios[fallo] ?? mensajeGeneral(campo);
}

/**
 * El mensaje general de lo que el navegador ve en un campo, para cuando la página no da uno propio.
 * @param {HTMLInputElement} campo
 * @returns {string}
 */
function mensajeGeneral(campo) {
  const { validity } = campo;
  const esFecha = campo.type === 'date';
  if (validity.valueMissing) {
    if (campo.type === 'checkbox') {
      return 'Marca esta casilla para continuar.';
    }
    return campo.type === 'radio' || campo.localName === 'select'
      ? 'Elige una opción.'
      : 'Rellena este campo.';
  }
  if (validity.typeMismatch || validity.badInput) {
    return campo.type === 'email'
      ? 'Escribe un correo como nombre@ejemplo.org.'
      : 'Escribe un valor con el formato correcto.';
  }
  if (validity.rangeUnderflow) {
    return esFecha
      ? `La fecha no puede ser anterior al ${fechaLegible(campo.min)}.`
      : `El valor mínimo es ${campo.min}.`;
  }
  if (validity.rangeOverflow) {
    return esFecha
      ? `La fecha no puede ser posterior al ${fechaLegible(campo.max)}.`
      : `El valor máximo es ${campo.max}.`;
  }
  if (validity.tooShort) {
    return `Escribe al menos ${campo.minLength} caracteres.`;
  }
  if (validity.tooLong) {
    return `Escribe como máximo ${campo.maxLength} caracteres.`;
  }
  if (validity.patternMismatch) {
    return campo.title || 'Escribe un valor con el formato correcto.';
  }
  if (validity.stepMismatch) {
    return 'Escribe un número con los decimales que se admiten.';
  }
  return '';
}

/**
 * Busca la caja `.invalid-feedback` de un campo: la que nombra su `aria-describedby` (o el de su
 * `fieldset`, en los grupos de opciones) o, si no, la que haya dentro de su `.campo`.
 * @param {HTMLElement} campo
 * @returns {HTMLElement | null}
 */
function buscarCaja(campo) {
  const descripcion =
    campo.getAttribute('aria-describedby') ??
    campo.closest('fieldset[aria-describedby]')?.getAttribute('aria-describedby') ??
    '';
  for (const id of descripcion.split(/\s+/)) {
    const caja = id ? campo.ownerDocument.getElementById(id) : null;
    if (caja?.classList.contains('invalid-feedback')) {
      return caja;
    }
  }
  return campo.closest('.campo')?.querySelector('.invalid-feedback') ?? null;
}

/**
 * Los campos que comparten estado de error con uno: todas las opciones de un grupo de radios o,
 * si es un campo suelto, solo él.
 * @param {HTMLFormElement} formulario
 * @param {HTMLInputElement} campo
 * @returns {HTMLInputElement[]}
 */
function gemelos(formulario, campo) {
  if (campo.type !== 'radio' || campo.name === '') {
    return [campo];
  }
  return [...formulario.elements].filter(
    (otro) => /** @type {HTMLInputElement} */ (otro).type === 'radio' && otro.name === campo.name,
  );
}

/**
 * Pone el componente de validación a un formulario.
 *
 * Un solo oyente de `blur` (en captura, porque `blur` no sube), uno de `input` y otro de `submit`
 * sobre el propio formulario: sirven también para los campos que se añadan después (las vacunas).
 *
 * @param {HTMLFormElement} formulario
 * @param {object} [opciones]
 * @param {function(SubmitEvent): void} [opciones.alEnviar] Qué hacer cuando se envía y todo es
 *   válido. Si se da, el componente ya ha hecho `preventDefault()` del envío.
 * @param {Object<string, ReglaExtra>} [opciones.reglasExtra] Reglas propias, por el `data-validar`
 *   del campo (o por su `name` si no lo lleva). Se miran después de la regla de `validadores`.
 * @param {Object<string, MensajesCampo>} [opciones.mensajes] Los textos propios de la página para
 *   lo que ve el navegador (vacío, mínimos, máximos…), por el `name` del campo: así todas las
 *   opciones de un grupo comparten mensaje. Sin ellos, sale el mensaje general.
 * @param {function(EventTarget, string, string): void} [opciones.avisar] Cómo avisar al enviar con
 *   errores; por defecto, `lanzarAviso`.
 * @returns {ValidacionFormulario}
 * @listens blur
 * @listens input
 * @listens submit
 * @fires aviso
 * @example
 * const validacion = iniciarValidacion(formulario, {
 *   reglasExtra: {
 *     'repetir-clave': (valor, campo, f) =>
 *       valor === f.elements.clave.value ? '' : 'Las contraseñas no coinciden.',
 *   },
 *   mensajes: { aceptacion: { valueMissing: 'Debes aceptar las condiciones.' } },
 *   alEnviar: guardar,
 * });
 */
export function iniciarValidacion(
  formulario,
  { alEnviar, reglasExtra = {}, mensajes = {}, avisar = lanzarAviso } = {},
) {
  /** Los campos por los que ya se ha pasado: desde entonces se validan con cada cambio. */
  const tocados = new WeakSet();

  // El formulario se valida con este componente, no con los globos del navegador
  formulario.noValidate = true;

  /**
   * Calcula el mensaje de error de un campo: lo vacío, la regla de `validadores`, la regla extra
   * y, por último, lo que sepa el navegador (formato, mínimos y máximos).
   * @param {HTMLInputElement} campo
   * @returns {string}
   */
  function calcularMensaje(campo) {
    campo.setCustomValidity('');
    if (!campo.willValidate) {
      return '';
    }
    const propios = mensajes[campo.name];
    if (campo.validity.valueMissing) {
      return mensajeNativo(campo, propios);
    }
    const nombre = campo.dataset.validar ?? '';
    const reglaExtra = reglasExtra[nombre || campo.name];
    return (
      validadores[nombre]?.(campo.value) ||
      reglaExtra?.(campo.value, campo, formulario) ||
      mensajeNativo(campo, propios)
    );
  }

  /**
   * Valida un campo y enseña o quita su error.
   * @param {HTMLInputElement} campo
   * @returns {boolean} `true` si es válido.
   */
  function validarCampo(campo) {
    const mensaje = calcularMensaje(campo);
    campo.setCustomValidity(mensaje);
    gemelos(formulario, campo).forEach((opcion) => {
      opcion.classList.toggle('is-invalid', mensaje !== '');
      opcion.setAttribute('aria-invalid', String(mensaje !== ''));
    });
    const caja = buscarCaja(campo);
    if (caja) {
      caja.textContent = mensaje;
    }
    return mensaje === '';
  }

  /** @returns {HTMLInputElement[]} Los campos del formulario que se validan. */
  function campos() {
    return [...formulario.elements].filter(esCampo);
  }

  /**
   * Valida todos los campos, sin cortarse en el primer error, y los da por tocados.
   * @returns {boolean}
   */
  function validarTodo() {
    return campos()
      .map((campo) => {
        tocados.add(campo);
        return validarCampo(campo);
      })
      .every(Boolean);
  }

  /** Quita todos los errores y olvida qué campos se tocaron. */
  function reiniciar() {
    campos().forEach((campo) => {
      campo.setCustomValidity('');
      campo.classList.remove('is-invalid');
      campo.removeAttribute('aria-invalid');
      const caja = buscarCaja(campo);
      if (caja) {
        caja.textContent = '';
      }
      tocados.delete(campo);
    });
  }

  // `blur` no sube por el DOM, así que se oye en la fase de captura
  formulario.addEventListener(
    'blur',
    (evento) => {
      const campo = /** @type {HTMLInputElement} */ (evento.target);
      if (esCampo(campo)) {
        // En un grupo de botones de opción se tocan todas sus opciones: así, al elegir otra, el
        // error del grupo se quita en el momento
        gemelos(formulario, campo).forEach((opcion) => tocados.add(opcion));
        validarCampo(campo);
      }
    },
    true,
  );

  formulario.addEventListener('input', (evento) => {
    const campo = /** @type {HTMLInputElement} */ (evento.target);
    if (!esCampo(campo)) {
      return;
    }
    if (tocados.has(campo)) {
      validarCampo(campo);
    }
    // Los campos tocados con regla extra pueden depender de este (repetir la contraseña): se vuelven
    // a mirar aunque este aún no se haya tocado, así su error se quita en cuanto deja de serlo
    campos()
      .filter((otro) => otro !== campo && tocados.has(otro))
      .filter((otro) => reglasExtra[otro.dataset.validar || otro.name])
      .forEach(validarCampo);
  });

  formulario.addEventListener('submit', (evento) => {
    if (!validarTodo()) {
      evento.preventDefault();
      evento.stopImmediatePropagation();
      avisar(formulario, AVISO_REVISAR, 'danger');
      /** @type {HTMLElement | null} */ (
        formulario.querySelector('[aria-invalid="true"]')
      )?.focus();
      return;
    }
    if (alEnviar) {
      evento.preventDefault();
      alEnviar(/** @type {SubmitEvent} */ (evento));
    }
  });

  return { validarTodo, validarCampo, reiniciar };
}
