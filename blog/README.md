# Blog del proyecto

## 10/11/2026 · Sprint 1 · La web sin estilos, una huella testaruda y los clics de más

### Dificultades y cómo las resolví

**Bootstrap no cargaba y la web parecía de 1998.** Al abrir la web en Chrome todo tenía un marco blanco alrededor, la letra era Times y los formularios eran cajas grises sin estilo. Primero pensé que había roto `css/estilos.css`, pero mi hoja sí cargaba. En la pestaña Red de las DevTools vi el problema: `node_modules/bootstrap/dist/css/bootstrap.min.css` daba un 404. La carpeta `node_modules` existía, pero estaba vacía y su dueño era `root`. La había creado Docker al montar un volumen sobre ella en unas pruebas, y el `npm install` del Dev Container, que corre con el usuario `node`, no podía escribir dentro y fallaba sin que me diera cuenta. Lo arreglé borrando la carpeta vacía y ejecutando `npm ci`. Aprendí dos cosas: cuando algo «se ve raro», lo primero es mirar la pestaña Red y buscar errores en rojo, y no conviene que mi CSS dependa de Bootstrap para lo básico. Por eso `estilos.css` pone ahora sus propios márgenes, letra y `box-sizing`, y la página se sigue viendo bien aunque Bootstrap falle.

**La huella de los campos válidos tapaba el ojo de la contraseña.** Cuando un campo está bien rellenado aparece una pequeña huella a la derecha. En el campo de la contraseña quedaba justo encima del botón del ojo, aunque yo tenía una regla para moverla a la izquierda:

```css
.campo__caja:has(.campo__ojo)::after {
  right: 3.4rem;
}
```

La regla estaba bien escrita, pero no ganaba. La que dibuja la huella era `.campo__caja:has(.form-control:user-valid:not(:placeholder-shown))::after`, y `:has(...)` cuenta con la especificidad del selector más específico que tiene dentro: tres clases y pseudoclases, frente a una sola de la mía. Por mucho que mi regla fuera después en el fichero, la otra pesaba más. En vez de inflar la especificidad, cambié la idea: cada caja guarda en una variable dónde debe ir su huella, y la regla que la dibuja solo lee la variable.

```css
.campo__caja {
  --huella-derecha: 0.9rem;
}

.campo__caja:has(.campo__ojo) {
  --huella-derecha: 3.4rem;
}
```

Así no compiten dos reglas por la misma propiedad: la posición la decide la caja según lo que lleva dentro (ojo, desplegable o calendario). Además, la huella ahora aparece, se queda un momento y se va, en lugar de quedarse fija para siempre.

**Que varios clics rápidos no creen dos usuarios.** El enunciado pide que, si pulsas «Crear mi cuenta» muchas veces seguidas, solo se cree un usuario. Al principio no veía cómo podía colarse un segundo, si el código va en orden. El motivo es que `resumirClave` devuelve una promesa: mientras el navegador calcula el resumen de la contraseña, la página sigue respondiendo y cada clic lanza otro `submit`, que empieza su propio registro antes de que el primero termine. Desactivar el botón ayuda, pero no lo tapa todo (también se puede enviar con Intro), así que en `js/paginas/registro.js` uso una variable que corta cualquier envío mientras hay uno en marcha:

```js
if (enviando) {
  return;
}
// …
enviando = true;
marcarEnvio(formulario, true);
const nuevo = await registrarUsuario(almacenUsuarios, datos, resumir);
```

`marcarEnvio` pone `aria-busy` en el formulario y desactiva el botón, y la variable descarta el resto. El inicio de sesión hace lo mismo.

### Problemas conceptuales

**Que un evento «suba» por el DOM.** Al principio no veía por qué un aviso lanzado desde un formulario podía mostrarse con un único oyente en `document`. La clave es `bubbles: true`: el evento empieza en el elemento que lo lanza y va subiendo por sus padres hasta `document`, y cualquiera por el camino puede escucharlo. En `js/componentes/avisos.js`:

```js
origen.dispatchEvent(new CustomEvent('aviso', { bubbles: true, detail: { mensaje, tipo } }));
```

Da igual que el aviso salga del formulario de registro o del botón de cerrar sesión: sube hasta `document`, y allí `iniciarAvisos` lo muestra en `#avisos`. Si no subiera, tendría que poner un oyente en cada sitio que avisa.

**`location.replace` no es lo mismo que cambiar `location.href`.** Pensaba que las dos llevaban a otra página y ya está. La diferencia está en el historial: `location.assign` (o `href`) añade una entrada nueva, y `location.replace` sustituye la actual. Si una página privada sin sesión redirigiera con `assign`, al pulsar «Atrás» volverías a ella, que te volvería a echar, y así en bucle. Con `replace`, la página protegida desaparece del historial y «Atrás» te lleva a donde estabas antes. Por eso las páginas privadas navegan así (`js/paginas/listado.js`):

```js
const navegar = (pagina) => location.replace(pagina);
```
