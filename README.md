# Simulador REBT — Instalaciones eléctricas de baja tensión

Aplicación educativa para practicar el montaje de instalaciones eléctricas de vivienda según el REBT, pensada para preparar el carné de **instalador de baja tensión categoría básica (IBTB)**.

**Un único archivo:** [`simulador-rebt.html`](simulador-rebt.html). Sin conexión, sin dependencias, sin frameworks.

## Instalación en iPhone

1. Pasa el archivo `simulador-rebt.html` al iPhone (AirDrop, Archivos, correo…).
2. Ábrelo con **Safari**.
3. Toca **Compartir → Añadir a pantalla de inicio**. Se abrirá a pantalla completa como una app y funciona con el modo avión activado.

## Qué incluye (Fase 1)

- **Cuadro (CGMP)**: IGA, diferencial 40 A/30 mA (con botón de prueba) y PIAs sobre carril DIN.
- **Receptores y maniobras**: punto de luz, base schuko, interruptor simple y conmutación.
- **Puesta a tierra**: pica + borne principal.
- **Cableado táctil** con colores normativos (toca un borne y luego otro).
- **Doble vista sincronizada**: realista ⇄ esquema multifilar.
- **Modo Aprendiz**: comprueba el cableado (continuidad, neutro, cortocircuitos, tierra, interruptor que corta el neutro) y lo explica en lenguaje sencillo citando la ITC.
- **Modo Instalador**: secciones y calibres a elegir; calcula intensidad (I = P / (V·cosφ), 230 V) y caída de tensión por circuito; comprueba que **el PIA protege al cable** (ITC-BT-25).
- **Simulación real**: cortocircuitos disparan el PIA, fugas a tierra disparan el diferencial, sobrecargas disparan por calibre.
- **5 retos guiados** con corrección automática + modo libre.
- **Guardar/cargar** montajes (con degradación segura si no hay almacenamiento).

## Próxima fase (Fase 2)

Instalación de enlace (acometida, CGP, contador, ICP), maniobras avanzadas (telerruptor, minutero, detectores…), modo Reglamento con boletín de conformidad y modo Avería. La arquitectura (catálogo `DEFS` + motor de simulación por grafos + doble renderizado) está preparada para ampliarse sin rehacer nada.
