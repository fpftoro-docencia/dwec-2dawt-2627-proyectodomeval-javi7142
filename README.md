# Huellas · Gestión de una protectora de animales

<!-- Sprint 2: la insignia de tu workflow, con tu organización y tu repositorio. -->
![Integración continua](https://github.com/<organización>/<repositorio>/actions/workflows/ci.yml/badge.svg)

<!-- Completa cada sección a medida que avanzas en los sprints. Borra los comentarios como este
     cuando termines. Este README es también la portada de la documentación que genera `npm run docs`.
     No cambies los títulos de las secciones (##): la corrección los busca por su nombre. -->

## Mi proyecto

**Huellas** es una aplicación web para los voluntarios de una protectora de animales. Cada voluntario (o casa de acogida) lleva el control de los animales que tiene a su cargo: los da de alta, los edita, anota sus vacunas y marca cuándo los adoptan. El coordinador de la protectora, que es el administrador, gestiona además a los voluntarios.

Está hecha con JavaScript sin librerías (solo el CSS de Bootstrap) y sin APIs remotas: los usuarios y los animales se guardan en el navegador.

> ⚠️ **Todos los datos de ejemplo son inventados.** El repositorio y la web publicada son públicos, así que ningún nombre, DNI, teléfono ni microchip del proyecto pertenece a una persona o a un animal reales.

**Roles:**

| Rol | Quién es | Qué puede hacer |
|-----|----------|-----------------|
| Usuario | Voluntario o casa de acogida | Ver y gestionar solo sus animales |
| Administrador | Coordinador. Es el primer usuario que se registra | Lo mismo que un usuario, y además entrar en «Usuarios» para dar o quitar el rol de administrador a otros |

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

### La entidad

La entidad es el **animal** que el voluntario tiene a su cargo. La ficha (`ficha.html`) tiene un campo por fila de esta tabla, y la última columna dice dónde queda cada dato en el objeto que se guarda. Ese objeto está descrito con `@typedef` en `js/datos/animales.js` (`Animal`, `Vacuna` y `Adopcion`), y los valores que guarda son los `value` del formulario.

| Campo | Control en la ficha | Obligatorio | Regla de validación | Mensaje si no se cumple | Se guarda en |
|-------|---------------------|:-----------:|---------------------|-------------------------|--------------|
| Nombre | Texto (`#nombre`) | Sí | Expresión regular `^\p{L}[\p{L} '-]{1,29}$` con la bandera `u` | «El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones.» | `nombre`, sin espacios a los lados |
| Especie | Lista desplegable (`#especie`) | Sí | Una de la lista: `perro`, `gato`, `conejo` u `otro` | «Elige una especie.» | `especie` |
| Sexo | Botones de opción (`sexo`) | Sí | `hembra` o `macho` | «Elige el sexo.» | `sexo` |
| Fecha de ingreso | Fecha (`#ingreso`) | Sí | No posterior a hoy (el `max` lo pone el código) | «La fecha de ingreso no puede ser futura.» | `ingreso`, como `AAAA-MM-DD` |
| Peso (kg) | Número (`#peso`) | Sí | Entre 0,1 y 100, con un decimal como mucho (`step="0.1"`) | «El peso debe estar entre 0,1 y 100 kg, con un decimal como mucho.» | `peso`, como número |
| Microchip | Texto (`#microchip`) | Sí | Expresión regular `^\d{15}$` | «El microchip tiene 15 dígitos.» | `microchip`, como texto (así no se pierden los ceros del principio) |
| Foto | Galería de botones de opción con fotos (`foto`, en `#galeria-fotos`) | Sí | Una de las fotos de su especie; la galería se activa al elegir la especie | «Elige una foto.» | `foto`: el nombre del archivo de `img/fotos/` sin la extensión (`perro-1`) |
| Estado | Botones de opción (`estado`; empieza en «En acogida») | Sí | `acogida`, `disponible` o `adoptado` | «Elige el estado.» | `estado` |
| Esterilizado | Casilla (`#esterilizado`) | No | — | — | `esterilizado`, `true` o `false` |
| **Fecha de esterilización** (campo condicional: solo si la casilla está marcada) | Fecha (`#fecha-esterilizacion`) | Sí, si está esterilizado | No futura y no anterior al ingreso | «La esterilización no puede ser futura ni anterior al ingreso.» | `fechaEsterilizacion`, o `null` si no está esterilizado |
| **Adoptante: nombre** (campo condicional: solo si el estado es «Adoptado») | Texto (`#adoptante-nombre`) | Sí, si está adoptado | El mismo validador que el nombre (`data-validar="nombre"`) | «Escribe el nombre del adoptante.» si falta; si no cumple la regla, el mismo mensaje que el nombre | `adopcion.nombre` |
| **Adoptante: DNI** (campo condicional) | Texto (`#adoptante-dni`) | Sí, si está adoptado | Expresión regular `^\d{8}[A-Z]$` **y** letra de control (abajo) | «El DNI tiene 8 cifras y una letra, como 12345678Z.» / «La letra no corresponde al número del DNI.» | `adopcion.dni` |
| **Adoptante: teléfono** (campo condicional) | Teléfono (`#adoptante-telefono`) | No | Expresión regular `^[679]\d{8}$` | «El teléfono tiene 9 cifras y empieza por 6, 7 o 9.» | `adopcion.telefono`, o `null` si se deja vacío |
| **Vacunas** (grupo dinámico, de **0 a 3**): tipo | Lista desplegable (`vacunaTipo`, desde `#plantilla-vacuna`) | Sí, en cada vacuna | `rabia`, `polivalente`, `triple-felina`, `leucemia-felina`, `mixomatosis` u `otra` | «Elige la vacuna.» | `vacunas[i].tipo` |
| **Vacunas** (grupo dinámico, de **0 a 3**): fecha | Fecha (`vacunaFecha`, desde `#plantilla-vacuna`) | Sí, en cada vacuna | No futura y no anterior al ingreso | «La fecha de la vacuna no puede ser futura ni anterior al ingreso.» | `vacunas[i].fecha` |

Además, cada animal tiene un `id` único, que pone el módulo de datos al darlo de alta, y `adopcion` vale `null` si el estado no es «Adoptado». Las fechas se guardan como las da el campo de fecha (`AAAA-MM-DD`).

**Cómo cumple los mínimos del requisito 13:**

- **Cinco campos o más, con tres tipos de control o más:** nueve campos fijos, más los condicionales y las vacunas, con siete controles distintos (texto, número, fecha, lista desplegable, botones de opción, casilla y teléfono).
- **Campo condicional:** la fecha de esterilización solo aparece con la casilla marcada, y los datos del adoptante, con el estado «Adoptado». Mientras no tocan están ocultos y desactivados (`hidden` y `disabled`), así que no se envían ni se guardan.
- **Grupo dinámico:** las vacunas, de 0 a 3, se añaden desde el `<template>` `#plantilla-vacuna` y cada una se puede quitar. «Añadir vacuna» se desactiva al llegar a 3.
- **Tres validadores con expresión regular o más:** nombre, microchip, DNI y teléfono, los cuatro propios del tema. El del DNI comprueba además con código la letra de control.

**La letra de control va en el DNI del adoptante,** no en un código de ficha: el DNI es un dato que se pide de verdad al adoptar, ya está en la ficha y su regla es conocida, mientras que un código de ficha sería un dato inventado solo para tener algo que comprobar. La regla: 8 cifras y una letra, que es la de `TRWAGMYFPDXBNJZSQVHLCKE` en la posición del resto de dividir el número entre 23. Por ejemplo, 12345678 entre 23 da de resto 14, la posición de la `Z`: `12345678Z` es válido y `12345678A` no. En la aplicación se usan siempre DNI inventados.

Las fotos de los animales son recortes de imágenes de Unsplash (licencia gratuita); sus autores están en [img/fotos/CREDITOS.md](img/fotos/CREDITOS.md). Los animales y sus datos son inventados.

### El registro de usuarios

Las reglas de formato están en `js/logica/validadores.js`: cada validador devuelve el mensaje de error, o nada si el valor es válido. Un campo vacío lo controla el atributo `required`.

| Campo | Control | Regla | Mensaje |
|-------|---------|-------|---------|
| Usuario | Texto | Expresión regular `^\p{L}[\p{L}\d_.-]{2,19}$` con la bandera `u`, y que no esté ocupado | «El usuario empieza por una letra y tiene de 3 a 20 caracteres: letras, cifras, puntos o guiones.» / «Ese usuario ya existe» |
| Correo | Correo | Expresión regular `^[^\s@]+@[^\s@]+\.[^\s@]+$` | «Escribe un correo como nombre@ejemplo.org.» |
| Contraseña | Contraseña | Al menos 8 caracteres, una minúscula `\p{Ll}`, una mayúscula `\p{Lu}` y una cifra `\d`. Los requisitos se marcan mientras se escribe | «La contraseña necesita 8 caracteres o más, una minúscula, una mayúscula y una cifra.» |
| Repetir contraseña | Contraseña | Igual que la contraseña | «Las contraseñas no coinciden» |
| Aceptación | Casilla | Marcada | «Debes aceptar las condiciones» |

### Páginas

| Página | Acceso | Qué hace |
|--------|--------|----------|
| `index.html` | Pública | Inicio de sesión. Si ya hay sesión, lleva directamente al listado |
| `registro.html` | Pública | Alta de un voluntario con la validación de la contraseña en vivo. El primero que se registra es administrador |
| `listado.html` | Usuarios | Los animales del usuario en tarjetas, con buscador, contador, paginación y borrado con confirmación |
| `ficha.html` | Usuarios | Alta y edición de un animal, con campo condicional y grupo dinámico de vacunas |
| `usuarios.html` | Administradores | Listado de voluntarios con buscador y paginación, para dar o quitar el rol de administrador |

## Arquitectura y módulos

<!-- 1. Un diagrama (Mermaid) de tus módulos y de qué usa cada uno.
     2. Tabla con cada módulo: qué hace, si usa el DOM y qué exporta.
     3. Cómo están hechos tus objetos (funciones fábrica o clases) y qué patrones de diseño usas
        (al menos dos): dónde y por qué.
     4. Cómo reciben las páginas lo que necesitan (almacenamiento, sesión, navegación) y por qué así
        se pueden probar.
     5. Qué documenta tu JSDoc y cómo se genera la documentación (`npm run docs`). -->

## Cómo ejecutarlo

<!-- Cómo abrir el proyecto en el Dev Container y ver la web, y cómo pasar los tests, la cobertura,
     las pruebas de extremo a extremo, ESLint y Prettier, generar la documentación y preparar la web
     publicable (`npm run build`). -->

## Almacenamiento y sesión

<!-- 1. Tabla con cada clave que usas: dónde está (localStorage o sessionStorage), qué guarda y un
        ejemplo de su contenido.
     2. Por qué cada dato va donde va.
     3. Cómo guardas el rol y cómo proteges las páginas por sesión y por rol.
     4. Por qué este inicio de sesión NO es seguro: qué podría hacer alguien con las DevTools y cómo
        se hace en una aplicación real. -->

## Funcionalidad y formularios

<!-- Una subsección por parte de la aplicación (sesión y registro, listado y paginación, ficha,
     zona de administración): qué hace y cómo lo has resuelto. Incluye:
     - cómo lees los datos (FormData: get, getAll), cómo creas y numeras el grupo dinámico, cómo
       funciona el campo condicional, qué atributos pones desde el código y cómo rellenas el
       formulario al editar;
     - la validación: cuándo validas cada campo, de dónde salen los mensajes (validity,
       setCustomValidity y tus validadores), qué haces para que los errores sean accesibles y cómo
       evitas el doble envío;
     - las expresiones regulares: tabla con cada una, en qué validador está, qué acepta (un ejemplo)
       y qué significan sus partes y sus flags; qué parte de la validación hace la expresión y qué
       parte el código. -->

## Eventos

### Eventos en el HTML

<!-- Qué consigues con el HTML sin escribir oyentes (envío con Intro, novalidate y los atributos de
     validación, dialog, label for…) y por qué no usas atributos on…. -->

### Tipos de eventos

<!-- Tabla con los eventos que usas y por qué has elegido cada uno frente a otros parecidos
     (submit frente a click, input frente a change, blur frente a focusout…). -->

### Propagación

<!-- 1. Tabla con TODOS tus oyentes: evento, dónde lo registras, en qué fase actúa
        (captura, objetivo o burbuja) y para qué.
     2. Dónde usas la delegación y qué ganas con ella.
     3. Tu uso de la captura y por qué no servía la burbuja.
     4. Si usas stopPropagation, por qué. -->

## Pruebas y cobertura

| Tipo | Fichero | Qué prueba | Tests |
|------|---------|------------|------:|
| Unitario | `tests/unitarios/sesion.test.js` | El módulo de sesión con `AlmacenFalso` y con `sessionStorage`: guardar y leer, que no guarda la contraseña, borrar y diez formas de datos estropeados | 31 |
| Unitario | `tests/unitarios/usuarios.test.js` | El módulo de usuarios con `AlmacenFalso`: el primero es administrador, nombres repetidos, contraseña correcta e incorrecta, que solo se guarda el resumen y los datos estropeados | 20 |
| Unitario | `tests/unitarios/validadores.test.js` | Los validadores del registro con tablas `it.each`: casos válidos con los límites (3 y 20 caracteres, 8 en la contraseña, tildes y ñ) y al menos un caso no válido por cada regla, con su motivo | 40 |

Son unitarios porque prueban módulos de datos sin DOM: reciben el almacenamiento como parámetro y se les da un `AlmacenFalso`. La función que calcula el resumen de la contraseña también se puede sustituir por un doble (`vi.fn`).

<!-- 1. Tabla de la pirámide: tipo (unitario, de integración o de extremo a extremo), fichero,
        qué prueba y cuántos tests tiene. Por qué cada cosa se prueba en ese nivel y no en otro.
     2. Cómo simulas al usuario (eventos, requestSubmit), los servicios (AlmacenFalso, el resumen
        de la contraseña, la navegación) y el tiempo (temporizadores falsos).
     3. Cómo se ejecutan las mismas pruebas de extremo a extremo con serve y contra la web
        desplegada (BASE_URL).
     4. Pega la salida de `npm run coverage` (con el resumen de la cobertura) y de `npm run e2e`.
        Explica qué umbral has puesto, a qué ficheros y qué queda sin probar y por qué. -->

## Integración continua

### ESLint y Prettier

Además de las reglas recomendadas y de `no-var`, `prefer-const` y `eqeqeq`, que ya traía el punto de partida, `eslint.config.js` añade estas cuatro:

| Regla | Qué comprueba | Por qué la quiero |
|-------|---------------|-------------------|
| `camelcase` (con `properties: 'never'`) | Que las variables y funciones se llamen en *camelCase*: `leerSesion`, no `leer_sesion` | Todo el proyecto nombra así y un nombre distinto despista al leer. Las propiedades quedan fuera porque algunas vienen de fuera, como las claves que guarda el navegador |
| `curly` (con `multi-line`) | Que un `if`, `else`, `for` o `while` que ocupe más de una línea lleve llaves | Sin llaves, añadir una segunda línea a un `if` la deja fuera de él sin que se note. En una sola línea se permite, como en `tests/integracion/ejemplo.test.js` |
| `no-param-reassign` | Que no se asigne otro valor a un parámetro (`valor = valor.trim()`) | Los módulos reciben el almacenamiento, la sesión o la navegación como parámetros: si una función los cambiara, quien la llama dejaría de saber con qué trabaja. Se usa una variable nueva (`const usuario = valor.trim()`) |
| `no-else-return` | Que no haya un `else` después de un `if` que ya termina en `return` | El `else` sobra: el código queda más plano y se lee de arriba abajo, con los casos que salen antes, como en `iniciarAcceso` |

No se usa `no-console`: fallaría en `scripts/construir.js`, que escribe en la terminal y no se modifica.

Para comprobar que funcionan, un fichero con un fallo de cada una da cuatro errores:

```text
  2:17  error  Identifier 'con_guion_bajo' is not in camel case  camelcase
  3:3   error  Assignment to function parameter 'valor'          no-param-reassign
  5:5   error  Expected { after 'if' condition                   curly
  8:10  error  Unnecessary 'else' after 'return'                 no-else-return
✖ 4 problems (4 errors, 0 warnings)
```

Con el código del proyecto, las dos órdenes terminan sin errores:

```text
$ npm run lint
> eslint .

$ npm run format:check
> prettier --check .
Checking formatting...
All matched files use Prettier code style!
```

<!-- Pendiente: un problema real que encontraras con el depurador de las DevTools y cómo lo
     resolviste, contado por ti. -->

### El workflow

`.github/workflows/ci.yml` se ejecuta con cada `push` a `main` y con cada *pull request* hacia `main`. Solo tiene permiso para leer el código (`permissions: contents: read`). Cada trabajo empieza en una máquina limpia de `ubuntu-latest`: descarga el código, instala Node.js 24 con la caché de npm (así no descarga los paquetes cada vez) y las dependencias exactas de `package-lock.json` con `npm ci`.

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | `npm run lint` y `npm run format:check` | — |
| `Tests` | `Calidad` (`needs`) | `npm test` | — |
| `E2E` | | | |

**Por qué en ese orden:** revisar el código es lo más rápido y barato. Si falla, no tiene sentido gastar minutos en los tests: `needs` hace que `Tests` ni empiece. En el sprint 2 se añade `E2E`, que espera a `Tests` por la misma razón.

<!-- Sprint 2: los artefactos (coverage/ y playwright-report/), concurrency y el trabajo E2E. -->

**Ejecución en verde con sus artefactos:** <!-- enlace -->

## Despliegue continuo

<!-- Sprint 3. 1. Cómo has configurado Vercel: build, carpeta de salida, protección de los
        despliegues y Deployment Checks (qué comprobaciones exige y por qué).
     2. Qué hacen despliegue.yml y release.yml, y qué comprueba tu prueba de humo.
     3. El camino de un cambio, con tus palabras: desde tu git push en una rama hasta que se ve en
        la web, qué se comprueba en cada paso y qué pasa si algo falla. -->

**Web publicada:** <!-- https://<proyecto>.vercel.app -->

| Evidencia | Enlace | Captura |
|-----------|--------|---------|
| *Pull request* con su vista previa y `E2E desplegado` | <!-- enlace a la pull request --> | `img/pr-comprobaciones.png` |
| Versión retenida por Vercel | <!-- enlace a la ejecución en rojo --> | `img/vercel-retenido.png` |
| Release `v1.0` | <!-- enlace a la Release --> | — |

<!-- Qué rompiste a propósito para la versión retenida, qué viste en Vercel y cómo comprobaste que la
     web seguía con la versión anterior. -->

## Organización del trabajo

### Definición de Hecho

Una tarea pasa a «Hecho» en Trello solo cuando cumple **todas** estas condiciones. Cada una se comprueba con una orden, con el tablero o con lo que se ve en GitHub, no con una opinión.

| Nº | Condición | Cómo se comprueba |
|----|-----------|-------------------|
| 1 | Cumple el «Hecho cuando» de su tarjeta | Se prueba a mano en el navegador o en la terminal, y se tacha la tarjeta solo después |
| 2 | El código vive en una rama propia y llega a `main` por una *pull request* fusionada con *merge* | La pestaña de la *pull request* en GitHub: rama, fusión y rama conservada |
| 3 | `npm run lint` y `npm run format:check` terminan sin errores | Se ejecutan en el contenedor y no sale ningún aviso |
| 4 | Si la tarea tiene lógica, sus tests están en esa tarea o en la tarjeta de tests que la cubre, y `npm test` pasa | Un test unitario para la lógica pura y los datos, y uno de integración para una página; la salida de `npm test` está en verde. Si los tests tienen tarjeta propia (S1-16, S1-17 y S2-22 a S2-25), la tarea se comprueba a mano y sus tests llegan con esa tarjeta |
| 5 | Desde el sprint 2: `npm run coverage` supera el umbral y, si la tarea toca un recorrido, `npm run e2e` pasa | La salida de ambas órdenes, sin fallos |
| 6 | Desde que existe el *workflow* (tarjeta S1-18): sus trabajos están en verde en la *pull request* antes de fusionar | La pestaña **Checks** de la *pull request* |
| 7 | No quedan `console.log`, código comentado, `TODO` sueltos, `var`, `==` ni variables globales | `npm run lint` y una búsqueda de `console.log` y `TODO` en el código |
| 8 | No hay `innerHTML` con datos, estilos escritos desde JavaScript ni atributos `on…` en el HTML | Una búsqueda de `innerHTML`, `.style` y `onclick=` (o `onsubmit=`…) en `js/` y en las páginas |
| 9 | Ningún dato es real: nombres, DNI, teléfonos y microchips son inventados | Se revisan los ficheros de la *pull request* antes de fusionar |
| 10 | Los commits son pequeños y su mensaje dice qué cambia | `git log --oneline` de la rama se lee sin abrir los ficheros |
| 11 | Si la tarea añade o cambia algo explicado en el README, el JSDoc o la tabla de oyentes, ya está actualizado | Se compara el código de la *pull request* con la sección correspondiente |
| 12 | Se puede explicar: qué hace cada línea y qué pasaría si se cambiara | Se cuenta en voz alta antes de fusionar, como en la exposición |

**Cambios en la definición:** si se modifica en un sprint, se anota aquí qué cambió y por qué.

- **Sprint 1, 6 de noviembre:** la condición 4 admite que los tests lleguen en su tarjeta propia. El tablero separa los módulos de sus tests (S1-16, S1-17 y S2-22 a S2-25) y la condición pedía lo contrario, así que una tarjeta de módulo no podía cerrarse.

### Sprints

<!-- Una fila por sprint. La reflexión: qué salió bien, qué no, qué cambias para el siguiente
     (cuatro o cinco líneas, sobre tu trabajo y no sobre el enunciado). -->

| Sprint | *Tag* | Qué incluye | Reflexión |
|--------|-------|-------------|-----------|
| 1 | `v0.1` | Las cinco páginas con su diseño; registro con requisitos de la contraseña en vivo; inicio de sesión; roles (el primero es administrador); cabecera común; protección de las páginas por sesión y por rol; cierre de sesión; avisos con evento propio; cuatro reglas de ESLint; 91 tests unitarios; *workflow* con `Calidad` y `Tests` | Salió bien trabajar por tarjetas pequeñas, cada una en su rama y su *pull request*, y que los módulos reciban el almacenamiento y la navegación como parámetros: así los tests con `AlmacenFalso` fueron directos. Salió mal adelantarme: rehíce el diseño con una versión que ya funcionaba entera y tuve que quitar el código que no tocaba todavía (PR 7 a 9). Al revisar la Definición de Hecho vi que la condición 4 chocaba con las tarjetas de tests y la cambié. Para el sprint 2: una tarjeta cada vez, comprobar en el navegador antes de cada *pull request* y no fusionar sin el *workflow* en verde |
| 2 | `v0.2` | | |
| 3 | `v1.0` | | |

**Tablero de Trello:** <https://trello.com/b/P3FzyJnK/huellas-proyecto-dom-protectora-de-animales>

**Blog del proyecto:** [blog/README.md](blog/README.md) <!-- dificultades y problemas conceptuales de cada sprint -->

### Ramas y versiones

<!-- 1. Tabla con tus ramas: nombre, qué funcionalidad y enlace a su pull request.
     2. Si integras con merge o con rebase, y por qué.
     3. Qué deja fuera tu .gitignore y por qué. -->

| Rama | Funcionalidad | *Pull request* |
|------|---------------|----------------|
| `estructura-inicial` | `.gitignore` y esqueleto vacío de páginas y módulos | [#2](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/2) |
| `package-lock` | `package-lock.json` y saltos de línea LF con `.gitattributes` | [#3](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/3) |
| `mi-proyecto` | Sección «Mi proyecto» del README | [#4](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/4) |
| `definicion-de-hecho` | Definición de Hecho del README | [#5](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/5) |
| `paginas-base` | Las cinco páginas HTML, `css/estilos.css`, las fotos y los SVG de la marca | [#6](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/6) |
| `limpieza-repositorio` | Deja el repositorio a la par de lo hecho: quita los módulos vacíos que aún no tocan, sus scripts y los estilos del botón de pausa | [#9](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/9) |
| `definicion-de-hecho-tests` | Ajusta la condición 4 de la Definición de Hecho a las tarjetas de tests | [#10](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/10) |
| `modulo-sesion` | `js/datos/sesion.js`: guardar, leer y borrar la sesión (usuario y rol) | [#11](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/11) |
| `cabecera` | Cabecera común de las páginas privadas y sus módulos de página | [#12](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/12) |
| `modulo-usuarios` | `js/datos/usuarios.js`: alta con rol, nombres repetidos y comprobación de la contraseña | [#13](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/13) |
| `validadores-registro` | `js/logica/validadores.js`: usuario, correo y requisitos de la contraseña | [#14](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/14) |
| `avisos` | `js/componentes/avisos.js`: evento propio `aviso`, un único oyente y avisos para la página siguiente | [#15](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/15) |
| `registro-requisitos` | Registro: requisitos de la contraseña en vivo y error con un nombre ocupado | [#16](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/16) |
| `ver-clave` | Botón del ojo para ver u ocultar la contraseña | [#17](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/17) |
| `huella-campo-valido` | La huella de los campos válidos aparece y se va, y deja sitio al ojo | [#18](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/18) |
| `registro-alta` | Registro: alta, sesión iniciada, aviso y paso al listado, sin doble envío | [#19](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/19) |
| `inicio-sesion` | Inicio de sesión: entrar, contraseña incorrecta y redirección si ya hay sesión | [#20](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/20) |
| `proteger-paginas` | Protección de las páginas privadas por sesión y por rol, y «Cerrar sesión» | [#21](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/21) |
| `reglas-eslint` | Cuatro reglas de ESLint propias, explicadas en el README | [#22](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/22) |
| `tests-usuarios-sesion` | Tests unitarios de los módulos de sesión y de usuarios | [#23](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/23) |
| `tests-validadores` | Tests unitarios de los validadores del registro con `it.each` | [#24](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/24) |
| `workflow-ci` | Workflow de integración continua, paso 1: trabajos `Calidad` y `Tests` | [#25](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/25) |
| `blog-sprint-1` | Entrada del sprint 1 en el blog | [#26](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/26) |
| `cierre-sprint-1` | Reflexión del sprint 1 y enlace al tablero | [#27](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/27) |
| `paginas-privadas-sin-parpadeo` | Las páginas privadas no se ven antes de redirigir sin sesión | [#28](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/28) |
| `contexto-agente` | Fichero de contexto para continuar o recrear el proyecto | [#29](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/29) |
| `agentes-de-trabajo` | Agentes de trabajo: desarrollador, probador e integrador, y contexto actualizado | [#30](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/30) |
| `entidad-animal` | Entidad Animal: tabla de la entidad, letra de control del DNI y `@typedef` | [#31](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/31) |
| `agentes-paralelo` | Agentes en paralelo, bajo demanda, agentes extra y control de calidad | [#32](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/32) |
| `puerto-fijo` | La web siempre en el puerto 3901, para no perder las cuentas guardadas | [#33](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/33) |
| `validadores-ficha` | Validadores de nombre, microchip y teléfono de la ficha | [#34](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/34) |
| `validador-dni` | Validador del DNI con su letra de control | [#35](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/35) |
| `modulo-animales` | Módulo de animales: alta, lectura, edición y borrado por usuario | [#36](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/36) |
| `catalogo-fotos` | Catálogo de fotos por especie | [#37](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/37) |
| `paginar` | Función pura paginar | [#38](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/38) |
| `busqueda` | Búsqueda sin tildes ni mayúsculas, y debounce | [#39](https://github.com/fpftoro-docencia/dwec-2dawt-2627-proyectodomeval-javi7142/pull/39) |

**Integración con *merge*.** Cada rama llega a `main` con una *pull request* fusionada con *merge*, no con *rebase*:

- El *merge* no reescribe nada: los commits conservan su identificador y la historia refleja lo que pasó de verdad, con la rama y el momento en que se fusionó.
- Con *rebase* los commits se vuelven a crear con otros identificadores. Es más limpio de leer, pero obliga a forzar el `push` si la rama ya estaba subida, y eso es arriesgado cuando el repositorio es el que se corrige.
- El enunciado pide no borrar las ramas: con *merge* se ven en el grafo como líneas que salen de `main` y vuelven a él.
- Los *tags* `v0.1`, `v0.2` y `v1.0` apuntan a commits de `main` que no cambian de identificador.

**`.gitignore`.** Deja fuera `node_modules/` (se reinstala con `npm ci`), lo que generan las herramientas (`dist/`, `docs/`, `coverage/`, `playwright-report/`, `test-results/`), los ficheros del sistema y del editor, los `.env` (por si algún día hubiera un secreto, en un repositorio público) y los registros. **No** deja fuera `package-lock.json`: sin él, `npm ci` falla en el *workflow*.

**Versión de entrega:** `v1.0`
