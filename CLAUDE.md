# Simulador REBT — instrucciones del proyecto

Simulador educativo de instalaciones eléctricas de baja tensión según el REBT,
para preparar el carné de **instalador básico (IBTB)**. Web app **PWA sin
dependencias ni build**, instalable en el móvil y funcional sin conexión.

---

## Comunicación

- Responder en **español**, conciso y directo, sin emojis salvo que se pidan.
- Si algo no está claro, preguntar en lugar de asumir.

---

## Arquitectura

JavaScript puro cargado como **scripts clásicos en orden**. Comparten un único
ámbito global: un `const`/`let` declarado en un archivo es visible en los
siguientes (no en `window`, sí por nombre). El orden de carga = orden de
dependencias; **no reordenar** sin revisar.

```
index.html          markup + <link> css + <script src> 01→09
styles.css          estilos
src/01-core.js      estado global S, constantes REBT (V_RED=230, RHO_CU, CAIDA_MAX=3), almacenamiento
src/02-catalog.js   DEFS: catálogo de componentes (Fase 1)
src/03-draw.js      dibujo SVG de cada componente (drawBody, módulos DIN)
src/04-ui.js        render, gestos (Pointer Events), fichas, paleta, toast
src/05-engine.js    motor eléctrico: clase UF (unión-búsqueda sobre bornes)
src/06-simulate.js  simulate() + panel de resultados (todas las reglas ITC)
src/07-modes.js     retos, guardar/cargar, menús, modo/vista, arranque
src/08-phase2.js    Fase 2 sobre DEFS (CGP, contador, telerruptor, avería…)
                    + enlace completo (CPM, CGP 3~, IGM, embarrado, viviendas)
src/10-lab.js       laboratorio de circuitos: solver real (análisis nodal),
                    pila/resistencia/bombilla/medidores, retos rl1–rl6
src/11-modos.js     examen tipo test IBTB + proyecto/previsión de cargas
src/09-main.js      boot final (se carga el último)
sw.js               precache offline
```

---

## Cómo crecer

**Componente nuevo** → en `src/08-phase2.js`, `Object.assign(DEFS, { … })` con
los ganchos: `terms`, `props`, `state`, `draw(c, sim, multi)`, `links(c)`,
`onAct`, `coil`, `load`, `ficha`, `fichaExtra`. Añadirlo a `PAL_CATS` para que
aparezca en la paleta.

**Regla eléctrica nueva** → dentro de `simulate()` en `src/06-simulate.js`,
empujando a `msgs`. Citar siempre la **ITC** correspondiente en fichas y avisos.

---

## Estilo de código

- Seguir el estilo existente; **claridad** sobre brevedad.
- Comentarios solo donde la lógica no sea evidente. No añadir tipos, docstrings
  ni comentarios al código que no se ha modificado.
- Reutilizar las constantes y helpers de `src/01-core.js` (`r1`, `r2`, `mixHex`,
  `clamp`, `V_RED`, `RHO_CU`…).

---

## Ejecutar y probar en local

```
python3 -m http.server 8000        # abrir http://localhost:8000 (activa el SW)
/opt/node22/bin/node tests/run.mjs # pruebas headless del motor (Playwright)
```
No abrir con `file://` si se quiere probar el service worker. Cuando un cambio
afecte a la lógica (simulación, gestos, cálculos), **verificar el comportamiento**
en navegador headless antes de publicar, no solo revisar el código: ejecutar
`tests/run.mjs` (y añadir allí escenarios para lo nuevo). El plan de mejoras
por fases vive en `ROADMAP.md`.

---

## Git, versiones y despliegue

- **No** commitear ni hacer push salvo que se pida; sugerir commit cuando la
  tarea esté completa. Mensajes en inglés, imperativo, descriptivos.
- Rama de trabajo: **`main`**. Cada versión estable se marca como rama
  `vX.Y.Z` (los *tags* no se pueden empujar por el proxy de git de la sesión).
  Volver atrás: `git checkout vX.Y.Z`. Anotar los cambios en `CHANGELOG.md`.
- Al publicar cambios visibles, **subir el número de caché en `sw.js`**
  (`rebt-v7`, `rebt-v8`…) para que el PWA del iPhone reciba la actualización.
- **Despliegue:** GitHub Pages sirve `main`
  (Settings → Pages → Deploy from a branch → `main` / root) en
  `https://arianserasan.github.io/simulador_instalaciones_rebt/`.

---

## Acciones destructivas

Pedir confirmación antes de borrar archivos, `git reset --hard`,
`git push --force`, `git clean` o cualquier operación irreversible — salvo que
se haya pedido explícitamente en el mismo mensaje.
