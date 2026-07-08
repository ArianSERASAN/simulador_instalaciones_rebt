# Simulador REBT — Instalaciones eléctricas de baja tensión

Aplicación educativa para practicar el montaje de instalaciones eléctricas de vivienda según el REBT, pensada para preparar el carné de **instalador de baja tensión categoría básica (IBTB)**.

La app **no usa dependencias ni frameworks** (JavaScript puro, sin build). El código está organizado en módulos que se cargan en orden como scripts clásicos (comparten el mismo ámbito global), acompañados de un service worker (`sw.js`), un manifest y los iconos para instalarse como PWA.

## Estructura del proyecto

```
index.html            markup + <link> css + <script src> en orden
styles.css            todos los estilos
src/
  01-core.js          estado (S), constantes REBT, almacenamiento
  02-catalog.js       DEFS: catálogo de componentes (Fase 1)
  03-draw.js          dibujo SVG de cada componente (drawBody, DIN)
  04-ui.js            render, gestos táctiles, fichas, paleta, toast
  05-engine.js        motor eléctrico (clase UF, unión-búsqueda)
  06-simulate.js      simulate() + panel de resultados (reglas ITC)
  07-modes.js         retos, guardar/cargar, menús, modo/vista, arranque
  08-phase2.js        Fase 2 registrada sobre DEFS (CGP, telerruptor…) +
                      enlace ITC-BT-12 (CPM, CGP 3~, IGM, embarrado, viviendas)
  10-lab.js           laboratorio de circuitos (solver por análisis nodal)
  09-main.js          boot final (se carga el último)
sw.js                 precache offline (subir el nº de versión al publicar)
manifest.webmanifest, icon.svg, apple-touch-icon.png
```

Los archivos se cargan en el orden `01→09`; cada uno depende de los anteriores. Para **crecer**, lo habitual es un componente nuevo en `08-phase2.js` (patrón `Object.assign(DEFS, {…})` con los ganchos `draw`, `links`, `onAct`, `coil`, `load`, `fichaExtra`) y sus reglas en `06-simulate.js`.

## Desarrollo local y control de versiones

```
python3 -m http.server 8000      # y abrir http://localhost:8000
```
Servirlo por http (no abrir con file://) permite probar también el service worker.

Cada versión estable se marca con una **etiqueta git** para poder volver atrás:
```
git tag                          # ver versiones (v1.0.0, v1.1.0, …)
git checkout v1.0.0              # inspeccionar una versión anterior
git revert <commit>              # deshacer un cambio conservando el historial
```
El historial de cambios está en [`CHANGELOG.md`](CHANGELOG.md).

## Instalación en iPhone (PWA con GitHub Pages)

1. **Activar GitHub Pages** (solo una vez, el dueño del repositorio): el repositorio debe ser público (Settings → General → Change visibility) y en **Settings → Pages → Build and deployment** elegir *Deploy from a branch*, seleccionar la rama y la carpeta `/ (root)`. En un minuto la app queda en `https://<usuario>.github.io/Claude/`.
2. En el iPhone, abre esa URL con **Safari**.
3. Toca **Compartir → Añadir a pantalla de inicio**. Se instala como app a pantalla completa y, gracias al service worker, **funciona sin conexión** (modo avión incluido) a partir de la primera visita.

> Nota: el archivo `index.html` también funciona abierto en cualquier navegador de escritorio, o en el iPhone con apps que ejecuten HTML local (p. ej. «Documents» de Readdle). La vista previa de la app Archivos (Quick Look) no ejecuta JavaScript, por eso ahí no funciona.

## Qué incluye

### Fase 1 — núcleo
- **Cuadro (CGMP)**: IGA, diferencial 40 A/30 mA (con botón de prueba) y PIAs sobre carril DIN.
- **Receptores y maniobras**: punto de luz, base schuko, interruptor simple y conmutación.
- **Puesta a tierra**: pica + borne principal.
- **Cableado táctil** con colores normativos (toca un borne y luego otro).
- **Doble vista sincronizada**: realista ⇄ esquema multifilar.
- **Modo Aprendiz**: comprueba el cableado (continuidad, neutro, cortocircuitos, tierra, interruptor que corta el neutro) y lo explica en lenguaje sencillo citando la ITC.
- **Modo Instalador**: secciones y calibres a elegir; calcula intensidad (I = P / (V·cosφ), 230 V) y caída de tensión por circuito; comprueba que **el PIA protege al cable** (ITC-BT-25).
- **Simulación real**: cortocircuitos disparan el PIA, fugas a tierra disparan el diferencial, sobrecargas disparan por calibre.
- **Guardar/cargar** montajes (con degradación segura si no hay almacenamiento).

### Fase 2 — ampliación
- **Instalación de enlace**: acometida, **CGP con fusibles** (se funden con cortos aguas arriba del cuadro y se sustituyen), **contador** con lectura de potencia instantánea e **ICP** que dispara al superar la potencia contratada.
- **Maniobras avanzadas**: cruzamiento (luz desde 3+ puntos), pulsador momentáneo, **telerruptor** (biestable por impulsos), **minutero de escalera** temporizado, detector de presencia, interruptor crepuscular (día/noche global) y programador horario.
- **Receptores extra**: timbre (suena con pulsador) y motor genérico (cos φ = 0,85).
- **Modo Reglamento**: autoevaluación sin pistas y **boletín de conformidad** punto por punto (✓/✗ con su ITC): tierra, diferenciales, 5 circuitos/ID, PIA protege cable, secciones y calibres por circuito, nº máximo de puntos, colores, caída de tensión y orden del enlace.
- **Modo Avería**: 5 partes de avería con un fallo oculto (interruptor que corta el neutro, neutro ausente, conmutada mal cableada, toma sin tierra, PIA sobredimensionado); diagnóstico solo por síntomas y comprobación automática de la reparación.
- **8 retos guiados** en total y paleta organizada por categorías (Cuadro y tierra · Enlace · Maniobras · Receptores).
