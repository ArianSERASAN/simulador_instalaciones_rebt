'use strict';
/* ==================================================================
   SIMULADOR REBT — núcleo
   Arquitectura modular: DEFS (catálogo de componentes) + S (estado)
   + buildUF/simulate (motor eléctrico) + render (doble vista).
   La Fase 2 (CGP, contador, telerruptor…) se añade registrando
   nuevas entradas en DEFS y nuevas comprobaciones en simulate().
   ================================================================== */

const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const r1 = v => Math.round(v * 10) / 10;
const r2 = v => Math.round(v * 100) / 100;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
/* mezcla lineal de dos colores hex (#rrggbb) con t en [0,1] */
function mixHex(a, b, t) {
  t = clamp01(t);
  const pa = [1, 3, 5].map(i => parseInt(a.substr(i, 2), 16));
  const pb = [1, 3, 5].map(i => parseInt(b.substr(i, 2), 16));
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/* ---------- almacenamiento con degradación segura ---------- */
const store = (() => {
  const mem = {};
  let ok = false;
  try {
    localStorage.setItem('__rebt_t', '1');
    localStorage.removeItem('__rebt_t');
    ok = true;
  } catch (e) { ok = false; }
  return {
    get(k) { if (ok) { try { return localStorage.getItem(k); } catch (e) {} } return (k in mem) ? mem[k] : null; },
    set(k, v) { if (ok) { try { localStorage.setItem(k, v); return; } catch (e) {} } mem[k] = v; },
    del(k) { if (ok) { try { localStorage.removeItem(k); return; } catch (e) {} } delete mem[k]; },
    volatil: () => !ok
  };
})();

/* ---------- constantes REBT (valores verificados) ---------- */
const V_RED = 230;
const V_LL = 400;                 // tensión entre fases (suministro trifásico)
const RHO_CU = 0.0172;            // Ω·mm²/m
const CAIDA_MAX = 3;              // % en viviendas (ITC-BT-19)
const MAX_PIA_SECCION = { '1.5': 10, '2.5': 16, '4': 20, '6': 25, '10': 40 };
const SECCIONES = [1.5, 2.5, 4, 6, 10, 16, 25];
const DI_SEC_MIN = 6;             // sección mínima de la derivación individual (ITC-BT-15)
const DI_CAIDA_SIN_LGA = 1.5;     // % máx. en la DI de un solo usuario, sin LGA (ITC-BT-15)
const DI_CAIDA_CON_LGA = 1;       // % máx. en la DI con contadores centralizados (ITC-BT-15)
const CALIBRES_PIA = [10, 16, 20, 25, 32, 40];
const TABLA_C = {
  C1: { uso: 'Iluminación', pia: 10, sec: 1.5, tubo: 16, max: 30 },
  C2: { uso: 'Tomas de uso general', pia: 16, sec: 2.5, tubo: 20, max: 20 },
  C3: { uso: 'Cocina y horno', pia: 25, sec: 6, tubo: 25, max: 2 },
  C4: { uso: 'Lavadora, lavavajillas y termo', pia: 20, sec: 4, tubo: 20, max: 3 },
  C5: { uso: 'Baño y aux. de cocina', pia: 16, sec: 2.5, tubo: 20, max: 6 }
};
const COLORES = {
  marron: { n: 'Marrón · fase', c: '#7a4a21' },
  negro:  { n: 'Negro · fase', c: '#2b2b2e' },
  gris:   { n: 'Gris · fase', c: '#8f959c' },
  azul:   { n: 'Azul · neutro', c: '#2e6fd0' },
  tierra: { n: 'Verde-amarillo · tierra', c: '#3f9b3f' }
};
const FASE_COLS = ['marron', 'negro', 'gris'];
const KIND_COL = { L: '#7a4a21', L2: '#2b2b2e', L3: '#8f959c', N: '#2e6fd0', PE: '#3f9b3f', X: '#6b7684' };
const esKindFase = k => k === 'L' || k === 'L2' || k === 'L3';

/* ---------- mundo ---------- */
const WORLD = { w: 800, h: 1180 };
const CUADRO = { x: 40, y: 150, w: 720, h: 240 };
const RAIL_CY = CUADRO.y + 132;         // centro del carril DIN
const DIN_Y = RAIL_CY - 52;             // y de un aparato DIN encajado

/* ---------- estado ---------- */
let S = {
  mode: 'aprendiz',            // aprendiz | instalador
  view: 'realista',            // realista | multifilar
  comps: [],                   // {id,type,x,y,props,state}
  wires: [],                   // {id,a:{c,t},b:{c,t},color,sec,len}
  nextId: 1,
  cam: { tx: 0, ty: 0, s: 1 },
  sel: null,                   // id comp seleccionado
  selWire: null,
  reto: null
};
let SIM = null;                // último resultado de simulación
let wireDraft = null;          // {from:{c,t}, x,y} cable a medio tender

const byId = id => S.comps.find(c => c.id === id);
const defOf = c => DEFS[c.type];
const K = (cid, tid) => cid + ':' + tid;

function termAbs(c, tid) {
  const t = defOf(c).terms.find(t => t.id === tid);
  return { x: c.x + t.x, y: c.y + t.y, dir: t.dirV || (t.y <= 2 ? -1 : 1), kind: t.kind };
}
