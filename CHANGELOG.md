# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Cada versión estable tiene su etiqueta git (`git tag`); para volver atrás:
`git checkout vX.Y.Z`.

## [Sin publicar]

### Añadido — Fase 2: enlace unifamiliar completo (esquema 2.1)
- **CPM · Caja de Protección y Medida** (pestaña Enlace): fusibles y contador
  en la misma envolvente para un solo usuario, sin LGA (ITC-BT-12/13). Sus
  fusibles se funden ante cortos sin protección aguas abajo y se sustituyen
  tocándola, como la CGP.
- **Derivación individual** detectada automáticamente (tramo medida → ICP/IGA)
  con sus reglas de la ITC-BT-15: sección mínima 6 mm² y caída ≤ 1,5 %
  (un solo usuario, sin LGA), en modos con cálculo. Punto nuevo del boletín.
- Secciones de enlace **16 y 25 mm²** disponibles en la ficha del cable.
- `ordenEnlaceOK` valida también el esquema con CPM (y rechaza mezclarla con
  CGP/contador sueltos).
- Reto **«Chalet: enlace con CPM»** (r9) y avería **«El chalet a media luz»**
  (a6, DI subdimensionada), con `montarChalet()` de referencia.
- 6 escenarios nuevos en `tests/run.mjs` (30 en total). Caché SW `rebt-v8`.

### Añadido — Fase 1: suministro trifásico
- **Red trifásica 400/230 V** (`red3`, pestaña Enlace): bornes L1·L2·L3·N.
  El motor eléctrico ahora es multifase: detecta cortocircuitos fase-fase
  (400 V) y fase-neutro con la misma selectividad, fugas a tierra por
  cualquier fase, y bobinas/ICP/diferenciales alimentados desde cualquier fase.
- Un receptor de 230 V conectado **entre dos fases se quema** (400 V):
  insignia parpadeante, aviso con su ITC y botón **Sustituir** en la ficha.
  Las tomas entre dos fases se detectan y explican antes de enchufar nada.
- **Motor trifásico** (`motor3`, pestaña Receptores): necesita las tres fases
  distintas y su carcasa a tierra; avisa si le falta alguna fase o si se
  conecta a la red monofásica. I = P/(√3·400·cos φ) en los cálculos.
- Los cables desde bornes L2/L3 se tienden por defecto en negro/gris.
- 8 escenarios trifásicos nuevos en `tests/run.mjs` (24 en total).
- Caché del SW subida a `rebt-v7`.

### Añadido
- `ROADMAP.md`: plan por fases de las mejoras acordadas (instalaciones de
  enlace ITC-BT-12 completas con trifásica, laboratorio de circuitos con
  solver real, modos examen y proyecto).
- `tests/run.mjs`: harness de verificación headless (Playwright). Sirve la
  app por http, ejecuta 16 escenarios contra el motor real (cortos, fugas,
  sobrecargas, selectividad, conmutadas, telerruptor, enlace, guardado) y
  falla si hay errores JS. Ejecutar con `node tests/run.mjs`.

## [v1.1.0] — Estructura modular

### Cambiado
- El código, antes en un único `index.html` (~3.000 líneas), se ha dividido en
  `styles.css` y `src/01-core.js` … `src/09-main.js`, cargados en orden como
  scripts clásicos. Comportamiento **idéntico** (verificado en navegador:
  gestos, simulación y brillo). Sin cambios de lógica.
- `sw.js`: precache actualizado a los nuevos archivos (cache `rebt-v6`).
- `README.md`: documentada la estructura y el flujo de desarrollo.

## [v1.0.0] — Monolito estable

### Añadido / Arreglado
- Simulador REBT Fase 1 + Fase 2 completo, instalable como PWA offline.
- Los interruptores (y pulsador, detector, crepuscular, CGP, telerruptor,
  minutero, programador) se pueden mover: toque = accionar, arrastre = mover.
- El brillo de la bombilla responde a la caída de tensión del cable
  (flujo luminoso ∝ V^3,4); el modo Instalador muestra los voltios que llegan.
- Empaquetado como PWA instalable (manifest, service worker, iconos).
