# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/).
Cada versión estable tiene su etiqueta git (`git tag`); para volver atrás:
`git checkout vX.Y.Z`.

## [Sin publicar] — Deshacer / rehacer

### Añadido
- **Historial de edición** con botones flotantes de **deshacer** y **rehacer**
  en el lienzo (y atajos `Ctrl/Cmd+Z` y `Ctrl/Cmd+Mayús+Z` / `Ctrl+Y`). Registra
  cada edición estructural del montaje: añadir/borrar componentes, cablear,
  borrar cable, mover aparatos y cambiar propiedades (calibre, sección, longitud,
  carga…). Los retoques rápidos del mismo control se agrupan en un solo paso.
  Accionar interruptores y protecciones no genera historial (es «usar», no
  «editar»). El historial se reinicia al cargar, vaciar o arrancar un montaje.
- `sw.js`: caché actualizada a `rebt-v7`.

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
