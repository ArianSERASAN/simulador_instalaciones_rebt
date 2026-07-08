# Roadmap — Simulador REBT

Plan de mejoras acordado (julio 2026). Cada fase se entrega completa: implementada,
**verificada en navegador headless**, anotada en `CHANGELOG.md`, con el número de
caché de `sw.js` subido, y con su commit en la rama de trabajo. Las fases se
ejecutan en orden; el estado se actualiza aquí al cerrar cada una.

Decisiones de alcance confirmadas por el usuario:

- Primero las **instalaciones de enlace**, después el laboratorio de circuitos.
- Los **tres esquemas de la ITC-BT-12** (unifamiliar con CPM, centralización en
  un lugar, centralización en más de un lugar).
- **Con suministro trifásico 400/230 V** (reparto de fases por vivienda).
- Ejecución autónoma fase a fase, con revisión al cierre de cada una.

---

## Fase 0 — Infraestructura de verificación · EN CURSO

- `ROADMAP.md` (este documento).
- Harness de pruebas headless (`tests/run.mjs`, Playwright + chromium del
  sistema): carga la app servida por http, monta escenarios programáticamente
  (componentes + cables), ejecuta `simulate()` y comprueba resultados
  (luces encendidas, disparos, mensajes). Los tests NO se precachean en el SW.
- Casos base que cubren el comportamiento actual (regresión): primera luz,
  conmutada, corto, fuga a tierra, sobrecarga, enlace unifamiliar actual.

## Fase 1 — Motor multifase + red trifásica 400/230 V

Generalizar el motor de conectividad (unión-búsqueda) de «fase única» a
**suministro con L1/L2/L3/N**:

- Mapa de potenciales por borne: a qué conductor de suministro (L1, L2, L3, N,
  tierra) queda unido cada nodo.
- **Cortocircuito** fase–neutro y **fase–fase** (400 V), con la misma
  selectividad PIA → IGA → ICP → fusibles.
- Receptor monofásico conectado entre dos fases → **400 V**: aviso claro y
  receptor dañado (didáctico).
- Fugas a tierra por cualquier fase; diferencial por fase.
- Nuevo componente `red3` (Red trifásica 400 V, bornes L1/L2/L3/N) junto a la
  `red` monofásica actual (mutuamente excluyentes en un montaje).
- Nuevo receptor **motor trifásico** (valida el motor multifase).
- Compatibilidad total con montajes guardados (la `red` mono sigue igual).

## Fase 2 — Enlace unifamiliar completo (esquema 2.1 de ITC-BT-12)

- Componente **CPM** (Caja de Protección y Medida: fusibles + contador en la
  misma envolvente; sin LGA). ITC-BT-13.
- La **derivación individual** como tramo identificado: sección mínima
  **6 mm²** y caída máxima **1,5 %** (sin LGA). ITC-BT-15.
- Secciones grandes de enlace (10/16/25 mm²) en la ficha del cable.
- Reglas nuevas en `simulate()` + puntos nuevos del boletín.
- Reto «Chalet: enlace con CPM» y avería «La DI que se queda corta».

## Fase 3 — Centralización de contadores en un lugar (esquema 2.2.1)

- Componentes: **IGM** (interruptor general de maniobra, tetrapolar; 160 A
  hasta 90 kW — ITC-BT-16), **fusible de seguridad** por derivación,
  **embarrado general** trifásico y **embarrado de protección**, contador por
  usuario, **cuadro de vivienda compacto** (representa la vivienda: demanda
  ajustable en W, interruptor general) para poder montar edificios sin dibujar
  cada interior.
- **LGA** trifásica como tramo identificado: sección mínima **10 mm²** Cu,
  caída máxima **0,5 %** (centralización única). ITC-BT-14.
- DI desde centralización: caída máxima **1 %**.
- **Reparto de fases** L1/L2/L3 entre viviendas con aviso de desequilibrio.
- **Selector de esquema ITC-BT-12** (declarar el esquema y comprobar que el
  montaje se corresponde), integrado en el boletín.
- Reto «Edificio de 4 viviendas» y averías de edificio (fusible de seguridad
  fundido, LGA subdimensionada…).

## Fase 4 — Centralizaciones en más de un lugar (esquema 2.2.2)

- Varias centralizaciones parciales colgando de la misma CGP/LGA (por plantas).
- LGA hacia centralizaciones parciales: caída máxima **1 %**. ITC-BT-14.
- Comprobaciones y boletín del esquema completo; reto de edificio por plantas.

## Fase 5 — Laboratorio de circuitos básicos (modo nuevo)

- **Solver eléctrico real** por análisis nodal (MNA) en JS puro, sin
  dependencias: tensiones de nodo y corrientes de rama.
- Espacio «Laboratorio» separado del plano REBT: pila/fuente ajustable,
  resistencias, bombillas resistivas, fusible, interruptor y **multímetro**
  (voltímetro/amperímetro).
- Serie y paralelo funcionan de verdad; brillo proporcional a la potencia;
  corriente de cortocircuito calculada.
- Retos didácticos: ley de Ohm, serie vs paralelo, divisor de tensión, por qué
  funde un fusible.

## Fase 6 — Solver real en el simulador REBT

- Usar el MNA para corrientes y caídas **reales por rama** en el simulador
  principal: brillo exacto, sobrecargas por corriente calculada, diferencial
  por mA de fuga. El unión-búsqueda se conserva para los diagnósticos
  topológicos («qué falta»).

## Fase 7 — Modos extra

- **Modo Examen IBTB**: banco de preguntas tipo test por ITC, offline, con
  corrección y estadísticas de progreso.
- **Modo Proyecto**: previsión de cargas y grados de electrificación
  (ITC-BT-10), dimensionado guiado de una vivienda/edificio.
- Más retos y averías acumulados de las fases anteriores.

---

## Referencias normativas

- ITC-BT-12: esquemas de instalaciones de enlace (2.1 un solo usuario · 2.2.1
  centralización en un lugar · 2.2.2 en más de un lugar).
- ITC-BT-13: cajas generales de protección y CPM.
- ITC-BT-14: LGA — Cu ≥ 10 mm² · ΔU ≤ 0,5 % (centralización total) /
  ≤ 1 % (centralizaciones parciales).
- ITC-BT-15: DI — ≥ 6 mm² · ΔU ≤ 1,5 % (un usuario, sin LGA) / ≤ 1 %
  (contadores totalmente centralizados).
- ITC-BT-16: centralización de contadores, IGM 160 A (hasta 90 kW) /
  250 A (hasta 150 kW).
- ITC-BT-17: dispositivos generales de mando y protección, ICP.
- ITC-BT-19/25: instalación interior (ya cubiertas por el simulador).
