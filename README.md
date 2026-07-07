# Simulador REBT — Instalaciones eléctricas de baja tensión

Aplicación educativa para practicar el montaje de instalaciones eléctricas de vivienda según el REBT, pensada para preparar el carné de **instalador de baja tensión categoría básica (IBTB)**.

**Un único archivo:** [`simulador-rebt.html`](simulador-rebt.html). Sin conexión, sin dependencias, sin frameworks.

## Instalación en iPhone

1. Pasa el archivo `simulador-rebt.html` al iPhone (AirDrop, Archivos, correo…).
2. Ábrelo con **Safari**.
3. Toca **Compartir → Añadir a pantalla de inicio**. Se abrirá a pantalla completa como una app y funciona con el modo avión activado.

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
