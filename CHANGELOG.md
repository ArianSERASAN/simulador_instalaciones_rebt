# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Cada versión estable tiene su etiqueta git (`git tag`); para volver atrás:
`git checkout vX.Y.Z`.

## [v2.2.0] — Pistas, ejemplos y nueva imagen

### Añadido — Fase 15
- **Retos con pistas**: cada uno de los 18 retos tiene **3 pistas
  escalonadas** (de la orientación a la casi-solución). Se piden desde el
  enunciado, que ahora se **reabre tocando el título del reto** en la barra
  superior. El **motivo del último fallo al comprobar queda guardado** y
  visible en el enunciado, y el cuadro de fallo ofrece «Ver una pista».
  «Tu progreso» distingue retos superados **sin pistas / con pistas**.
- Durante un reto, los errores del panel **ya no revelan la solución
  completa** (para eso están las pistas); al salir del reto vuelven.
- Tocar el título durante una **avería** reabre el parte de síntomas.
- **Instalaciones de ejemplo** (menú): 8 montajes correctos y comentados
  para cargar y estudiar — vivienda C1+C2, chalet con CPM, edificio 2.2.1,
  edificio por plantas 2.2.2, conmutada con cruzamiento, telerruptor con 3
  pulsadores, baño ITC-BT-27 y laboratorio en paralelo con medidores. Con
  deshacer para volver a tu montaje.
- **Imagen nueva**: icono del PWA rediseñado (cuadro eléctrico + rayo, en
  vectorial con rasterizados a 512 y 180 px) y **cabecera ilustrada** en el
  menú (SVG de 3,6 KB, offline). Los conceptos se exploraron con Higgsfield;
  el arte final se ejecutó en vectorial propio porque la política de red del
  entorno no permite descargar los renders al repositorio.
- 6 escenarios nuevos en `tests/run.mjs` (85 en total). Caché SW `rebt-v22`.

## [v2.1.2] — Los retos también son un modo aparte

### Cambiado
- **Empezar un reto ahora da un lienzo limpio**: tu montaje se guarda solo y
  **se restaura al salir del reto** (con la ✕) o al superarlo. Antes el reto
  se montaba encima de lo que tuvieras.
- Al **superar un reto**, su montaje queda guardado automáticamente en
  **Mis montajes** («Reto: nombre del reto») antes de restaurar el tuyo.
- Los retos de laboratorio hacen lo mismo dentro del espacio del laboratorio.
- Caché SW `rebt-v21`.

## [v2.1.1] — Aislamiento de modos

### Cambiado — Fase 14: cada modo funciona por su cuenta
- **Empezar una avería ya no destruye tu montaje**: se guarda una copia y se
  **restaura automáticamente al salir** (o al resolverla).
- El **deshacer queda acotado al ejercicio**: no puede escaparse a un estado
  anterior a la avería. Dentro del ejercicio sigue funcionando para tus
  propias reparaciones.
- En una avería **no se pueden desmontar aparatos** (los cables y propiedades
  sí: eso es reparar); un aviso lo explica.
- **Nuevo montaje, Cargar, Importar y Laboratorio** salen limpiamente del
  reto/avería activo (restaurando el montaje) antes de actuar.
- El **ejercicio activo sobrevive a recargas** de la app: el reto o la avería
  viajan con el guardado y la barra superior se reconstruye al arrancar.
- El **examen no se pierde** al tocar fuera del cuadro: se avisa, se puede
  **continuar desde el menú** (con la pregunta en la que ibas) o **abandonar**
  explícitamente (sin contar como intento).
- Empezar un reto estando en una avería restaura primero tu montaje.
- Caché SW `rebt-v20`.

## [v2.1.0] — Diagnóstico real, averías infinitas y estudio guiado

### Añadido — Fase 13: panel de progreso y banco de examen ampliado
- **«Tu progreso»** en el menú: retos, averías fijas, averías generadas por
  nivel y estadísticas de examen (intentos, mejor nota, falladas pendientes)
  con barras de avance.
- Banco del examen ampliado de 46 a **102 preguntas**, organizadas en
  **5 bloques del temario** (fundamentos de electrotecnia, instalación
  interior, protecciones y tierra, enlace/previsión/normativa, especiales y
  receptores): además del examen general de 10 al azar, ahora se puede
  practicar **por bloques**.
- Caché SW `rebt-v19`.

### Añadido — Fase 12: volúmenes de baño (ITC-BT-27)
- Componente **Zona de baño** (pestaña Receptores): dibuja la bañera con sus
  volúmenes **V0/V1, V2 y V3** en franjas punteadas. Al arrastrar mecanismos
  dentro, `simulate()` valida la ITC-BT-27: tomas y mecanismos prohibidos en
  V0–V2 (con solución explicada y señalización), luminaria en V1 prohibida y
  en V2 con aviso de clase II/IPX4.
- Reto **«El baño reglamentario»** (r12) y 2 preguntas nuevas de examen.
- Caché SW `rebt-v18`.

### Añadido — Fase 11: compartir montajes y captura de imagen
- En **Mis montajes**: **Exportar** (archivo `.json`, con la hoja de
  compartir nativa del móvil cuando existe), **Importar** (carga un archivo
  exportado en otro dispositivo, con deshacer) y **Foto PNG** (imagen del
  montaje completo a doble resolución, recortada al contenido, ideal para
  entregar o repasar esquemas).
- Caché SW `rebt-v17`.

### Añadido — Fase 10: averías generadas al azar
- En el **Modo Avería**, tres botones nuevos generan una avería aleatoria de
  **nivel 1 (fácil), 2 (media) o 3 (difícil, en modo Instalador)**: se elige
  un montaje de referencia (vivienda, chalet o edificio) y se le inyectan
  1–3 fallos de un catálogo (cable quitado, tierra perdida, fusible fundido,
  fase y neutro invertidos, color no reglamentario, PIA sobredimensionado,
  sección insuficiente). Cada avería se valida como **detectable** antes de
  entregarse, y el parte de síntomas se redacta según los fallos.
- Contador de averías generadas resueltas por nivel. Rejugable sin límite.
- Caché SW `rebt-v16`.

### Añadido — Fase 9: multímetro, camino de la corriente y errores con solución
- **Multímetro virtual** (menú): puntas de prueba roja y negra; toca dos
  bornes cualesquiera y lee **tensión y continuidad** (230 V fase-neutro,
  400 V entre fases, 0 V neutro-tierra…). En el laboratorio lee la tensión
  **real** calculada por el solver.
- **Camino de la corriente**: botón en la ficha de cualquier receptor con
  tensión que resalta en amarillo su recorrido completo
  fase → receptor → neutro sobre el plano.
- **Errores que enseñan**: los mensajes del panel ahora son **tocables** —
  al tocar uno se despliega la **solución explicada** (el porqué físico y
  los pasos concretos) y el componente o cable culpable queda **señalado en
  el plano** con la cámara centrada en él. Cubre cortos, fugas, receptores
  quemados, sobrecargas, tierra, colores, calibres, caídas, DI/LGA, motor
  trifásico, viviendas y el laboratorio.
- Caché SW `rebt-v15`.

### Añadido — Fase 8: edición cómoda e integración continua
- **Deshacer** (botón ↩ en la barra superior) y **Rehacer** (menú): historial
  de 50 pasos que cubre añadir/mover/borrar componentes y cables, cambios de
  propiedades, cargar montajes y generar averías. No cruza entre el
  simulador y el laboratorio.
- **Duplicar componente** desde su ficha (copia propiedades, no el estado).
- **Etiquetas editables** en cualquier componente («C1 salón», «2ºA»…),
  visibles como rótulo sobre el aparato y conservadas al guardar.
- **CI en GitHub Actions** (`.github/workflows/tests.yml`): las pruebas
  headless se ejecutan en cada push a `main` y en cada pull request;
  `tests/run.mjs` ahora localiza Playwright también en `node_modules` local.
- Barra superior compactada en pantallas estrechas. Caché SW `rebt-v14`.

## [v2.0.0] — Enlace ITC-BT-12 completo, trifásica, laboratorio y examen

### Añadido — Fase 7: examen IBTB y previsión de cargas
- **Examen tipo test** (menú, `src/11-modos.js`): banco de **44 preguntas**
  IBTB con su ITC y explicación; exámenes de 10 al azar, corrección razonada
  pregunta a pregunta, mejor nota guardada y **repaso de falladas**.
- **Proyecto: previsión de cargas** (menú): calculadora de la ITC-BT-10 con
  el coeficiente de simultaneidad oficial (tabla 1–21 y fórmula para más),
  viviendas básicas/elevadas, servicios generales, locales (100 W/m², mínimo
  3.450 W) y garajes (10/20 W/m²), con recomendación de IGM (160/250 A).
- 4 escenarios nuevos en `tests/run.mjs` (56 en total). Caché SW `rebt-v13`.

### Añadido — Fase 6: caída de tensión en cascada
- La tensión que llega a cada receptor descuenta ahora **toda la cadena**:
  caída fase-neutro de la LGA + caída de su derivación individual + caída del
  circuito interior. El **brillo** de las bombillas y el «le llegan X V» de
  las fichas reflejan la instalación completa, no solo el último tramo.
- Los cálculos siguen el método normativo por tramos (ΔU = 2·ρ·L·I/S), el
  mismo que se estudia para el IBTB. Caché SW `rebt-v12`.

### Añadido — Fase 5: laboratorio de circuitos básicos
- Nuevo espacio **Laboratorio** (menú → Laboratorio de circuitos), separado
  del simulador REBT y con su propio guardado: al entrar y salir se conserva
  cada montaje.
- **Motor eléctrico real** (`src/10-lab.js`): análisis nodal con fuentes en
  equivalente Norton y eliminación gaussiana. Tensiones y corrientes reales:
  la **serie y el paralelo funcionan de verdad**, el brillo depende de la
  potencia y los cortocircuitos tienen corriente calculada.
- Componentes: **pila** (4,5–24 V, con resistencia interna), **resistencia**,
  **bombilla** (nominal 3,5/6/12 V; se funde con >60 % de exceso de
  potencia), **fusible** (funde por corriente), **amperímetro** y
  **voltímetro** con display en vivo; también sirven el interruptor y el
  pulsador de siempre.
- Panel de resultados propio con la tabla de medidas de cada aparato.
- 6 retos didácticos nuevos (rl1–rl6): primera bombilla, paralelo, serie,
  ley de Ohm con amperímetro, divisor de tensión y el fusible que salva el
  circuito.
- 7 escenarios nuevos en `tests/run.mjs` (50 en total). Caché SW `rebt-v11`.

### Añadido — Fase 4: centralizaciones en más de un lugar (esquema 2.2.2)
- La **LGA con varias centralizaciones** se detecta completa (tronco común y
  rama a cada IGM), sin contaminarse con los tramos internos de cada
  centralización; su límite de caída pasa automáticamente a **1 %**
  (ITC-BT-14, centralizaciones parciales).
- Reto **«Edificio por plantas: dos centralizaciones»** (r11): exige dos IGM
  con sus embarrados, 4 viviendas con tensión repartidas por fases y la
  **declaración del esquema 2.2.2** en el menú.
- `montarEdificio2()` de referencia (2 plantas × 2 viviendas).
- 4 escenarios nuevos en `tests/run.mjs` (43 en total). Caché SW `rebt-v10`.

### Añadido — Fase 3: centralización de contadores (esquema 2.2.1)
- Pestaña **Edificio** con cinco componentes nuevos: **CGP trifásica** (fusible
  por fase, neutro seccionable), **IGM** (corte manual 160/250 A, no dispara),
  **embarrado** de centralización (4 barras × 5 bornes), **fusible de
  seguridad** por derivación y **cuadro de vivienda compacto** (vivienda
  entera resumida: demanda ajustable, interruptor propio, tierra por su DI).
- **LGA** detectada automáticamente (tramo CGP → IGM) con la ITC-BT-14:
  sección mínima 10 mm² Cu y caída ≤ 0,5 % (1 % hacia centralizaciones
  parciales), calculada con la corriente de la fase más cargada.
- **Derivaciones individuales múltiples**: una por contador, con límite de
  caída del 1 % cuando hay centralización (1,5 % sin LGA).
- Cada **contador muestra la potencia de su vivienda** (no el total).
- Avisos de **reparto de fases**: viviendas todas en la misma fase y
  desequilibrio de corrientes entre L1/L2/L3.
- Aviso de **centralización sin IGM** en cabecera (ITC-BT-16).
- Selectividad ampliada: un corto en una DI funde **solo su fusible de
  seguridad**; la CGP sobrevive.
- **Declaración de esquema ITC-BT-12** en el menú (2.1 / 2.2.1 / 2.2.2): el
  boletín comprueba que el montaje se corresponde con el esquema declarado.
- Boletín ampliado: LGA, DIs y esquema. Reto **«Edificio: contadores
  centralizados»** (r10) y avería **«El segundo, sin luz»** (a7) con
  `montarEdificio()` de referencia.
- El fondo del cuadro de vivienda se oculta en montajes de edificio.
- 9 escenarios nuevos en `tests/run.mjs` (39 en total). Caché SW `rebt-v9`.

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
