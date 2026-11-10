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

La entidad es el **animal** que el voluntario tiene en acogida. Este es el diseño inicial; en el sprint 2 se cierra con el código y los tests.

| Campo | Control | Obligatorio | Regla de validación | Mensaje si no se cumple |
|-------|---------|:-----------:|---------------------|-------------------------|
| Nombre | Texto | Sí | Expresión regular `^\p{L}[\p{L} '-]{1,29}$` con la bandera `u` | «El nombre empieza por una letra y tiene de 2 a 30 caracteres: letras, espacios, apóstrofos o guiones» |
| Especie | Lista desplegable | Sí | Una de la lista (perro, gato, conejo, otro) | «Elige una especie» |
| Sexo | Botones de opción | Sí | Hembra o macho | «Elige el sexo» |
| Fecha de ingreso | Fecha | Sí | No posterior a hoy (el `max` lo pone el código) | «La fecha de ingreso no puede ser futura» |
| Peso (kg) | Número | Sí | Entre 0,1 y 100 | «El peso debe estar entre 0,1 y 100 kg» |
| Microchip | Texto | Sí | Expresión regular `^\d{15}$` | «El microchip tiene 15 dígitos» |
| Foto | Galería de botones de opción con fotos | Sí | Una de las fotos de su especie; la galería se activa al elegir la especie | «Elige una foto» |
| Estado | Botones de opción | Sí | En acogida, disponible o adoptado | «Elige el estado» |
| Esterilizado | Casilla | No | — | — |
| **Fecha de esterilización** (campo condicional) | Fecha | Solo si está esterilizado | No futura y no anterior al ingreso | «La esterilización no puede ser futura ni anterior al ingreso» |
| **Adoptante: nombre** (campo condicional) | Texto | Solo si está adoptado | La misma expresión regular que el nombre | «Escribe el nombre del adoptante» |
| **Adoptante: DNI** (campo condicional) | Texto | Solo si está adoptado | Expresión regular `^\d{8}[A-Z]$` **y** letra de control: la letra de `TRWAGMYFPDXBNJZSQVHLCKE` en la posición del número módulo 23 | «DNI no válido: la letra no corresponde al número» |
| **Adoptante: teléfono** (campo condicional) | Texto | No | Expresión regular `^[679]\d{8}$` | «El teléfono tiene 9 cifras y empieza por 6, 7 o 9» |
| **Vacunas** (grupo dinámico, de **0 a 3**): tipo | Lista desplegable | Sí, en cada vacuna | Una de la lista | «Elige la vacuna» |
| **Vacunas** (grupo dinámico, de **0 a 3**): fecha | Fecha | Sí, en cada vacuna | No futura y no anterior al ingreso | «La fecha de la vacuna no puede ser futura ni anterior al ingreso» |

Los campos en negrita son el **campo condicional** y el **grupo dinámico** que pide el enunciado. Los cuatro validadores con expresión regular (nombre, microchip, DNI y teléfono) son propios del tema, y el del DNI comprueba además con código la letra de control.

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

<!-- Sprint 1. Las reglas que has añadido a eslint.config.js (al menos tres): qué comprueba cada una
     y por qué la quieres. Pega la salida de `npm run lint` y de `npm run format:check`. Cuenta un
     problema real que encontraras con el depurador de las DevTools y cómo lo resolviste. -->

### El workflow

<!-- Sprints 1 y 2. Qué hace ci.yml: cuándo se ejecuta, la tabla de sus trabajos y por qué están en
     ese orden, qué artefactos sube y para qué sirven, y qué hace concurrency. -->

| Trabajo | Espera a | Pasos | Artefacto |
|---------|----------|-------|-----------|
| `Calidad` | — | | — |
| `Tests` | | | |
| `E2E` | | | |

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
| 1 | `v0.1` | | |
| 2 | `v0.2` | | |
| 3 | `v1.0` | | |

**Tablero de Trello:** <!-- enlace (compartido con el profesor) -->

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

**Integración con *merge*.** Cada rama llega a `main` con una *pull request* fusionada con *merge*, no con *rebase*:

- El *merge* no reescribe nada: los commits conservan su identificador y la historia refleja lo que pasó de verdad, con la rama y el momento en que se fusionó.
- Con *rebase* los commits se vuelven a crear con otros identificadores. Es más limpio de leer, pero obliga a forzar el `push` si la rama ya estaba subida, y eso es arriesgado cuando el repositorio es el que se corrige.
- El enunciado pide no borrar las ramas: con *merge* se ven en el grafo como líneas que salen de `main` y vuelven a él.
- Los *tags* `v0.1`, `v0.2` y `v1.0` apuntan a commits de `main` que no cambian de identificador.

**`.gitignore`.** Deja fuera `node_modules/` (se reinstala con `npm ci`), lo que generan las herramientas (`dist/`, `docs/`, `coverage/`, `playwright-report/`, `test-results/`), los ficheros del sistema y del editor, los `.env` (por si algún día hubiera un secreto, en un repositorio público) y los registros. **No** deja fuera `package-lock.json`: sin él, `npm ci` falla en el *workflow*.

**Versión de entrega:** `v1.0`
