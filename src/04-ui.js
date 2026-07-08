/* ==================================================================
   RENDERIZADO
   ================================================================== */
const svg = $('#cv'), worldG = $('#world');
const bgG = $('#bgG'), wiresG = $('#wiresG'), compsG = $('#compsG'), ghostG = $('#ghostG');

function updateCamera() {
  worldG.setAttribute('transform', `translate(${S.cam.tx} ${S.cam.ty}) scale(${S.cam.s})`);
}
function screenToWorld(cx, cy) {
  const r = svg.getBoundingClientRect();
  return { x: (cx - r.left - S.cam.tx) / S.cam.s, y: (cy - r.top - S.cam.ty) / S.cam.s };
}

function renderBG() {
  const multi = S.view === 'multifilar';
  /* en montajes de edificio sin aparatos DIN, el cuadro de vivienda solo estorba */
  const sinCuadro = S.lab || (!S.comps.some(c => defOf(c).din) &&
    S.comps.some(c => ['cgp3', 'igm', 'embarrado', 'cvivienda', 'fusi'].includes(c.type)));
  if (multi) {
    bgG.innerHTML = `
      <rect x="-2000" y="-2000" width="4800" height="5200" fill="#fdfdfb"/>
      <rect x="-2000" y="-2000" width="4800" height="5200" fill="url(#pGrid)"/>` + (sinCuadro ? '' : `
      <rect x="${CUADRO.x}" y="${CUADRO.y}" width="${CUADRO.w}" height="${CUADRO.h}" rx="10"
            fill="none" stroke="#b9c0ca" stroke-width="1.6" stroke-dasharray="8 6"/>
      <text x="${CUADRO.x + 12}" y="${CUADRO.y + 22}" font-size="12" fill="#8b93a1" font-weight="700">CUADRO GENERAL DE MANDO Y PROTECCIÓN</text>`);
    return;
  }
  bgG.innerHTML = `
    <rect x="-2000" y="-2000" width="4800" height="5200" fill="#e8ebef"/>` + (sinCuadro ? '' : `
    <rect x="${CUADRO.x}" y="${CUADRO.y}" width="${CUADRO.w}" height="${CUADRO.h}" rx="12"
          fill="#f6f7f9" stroke="#c3cad3" stroke-width="2"/>
    <rect x="${CUADRO.x + 8}" y="${CUADRO.y + 8}" width="${CUADRO.w - 16}" height="24" rx="6" fill="#e4e8ed"/>
    <text x="${CUADRO.x + 16}" y="${CUADRO.y + 25}" font-size="12" fill="#6b7482" font-weight="700">CUADRO GENERAL DE MANDO Y PROTECCIÓN</text>
    <rect x="${CUADRO.x + 14}" y="${RAIL_CY - 14}" width="${CUADRO.w - 28}" height="28" fill="url(#pRail)" stroke="#8b93a1"/>`);
}

function wireEnds(w) {
  const ca = byId(w.a.c), cb = byId(w.b.c);
  if (!ca || !cb) return null;
  return { p1: termAbs(ca, w.a.t), p2: termAbs(cb, w.b.t) };
}
function wireD(w) {
  const e = wireEnds(w);
  if (!e) return '';
  const { p1, p2 } = e;
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const k = clamp(dist * 0.4, 26, 130);
  return `M${r1(p1.x)} ${r1(p1.y)} C ${r1(p1.x)} ${r1(p1.y + k * p1.dir)}, ${r1(p2.x)} ${r1(p2.y + k * p2.dir)}, ${r1(p2.x)} ${r1(p2.y)}`;
}

function wireSVG(w) {
  const d = wireD(w);
  if (!d) return '';
  const multi = S.view === 'multifilar';
  const base = multi ? 3 : 4.5;
  const col = COLORES[w.color].c;
  let s = `<g id="wg${w.id}">`;
  if (S.selWire === w.id) s += `<path class="wsel" d="${d}"/>`;
  if (w.color === 'tierra') {
    s += `<path id="w${w.id}" d="${d}" fill="none" stroke="#3f9b3f" stroke-width="${base}" stroke-linecap="round"/>
          <path id="w${w.id}b" d="${d}" fill="none" stroke="#e4c33f" stroke-width="${base}" stroke-linecap="round" stroke-dasharray="7 9"/>`;
  } else {
    s += `<path id="w${w.id}" d="${d}" fill="none" stroke="${col}" stroke-width="${base}" stroke-linecap="round"/>`;
    if (!multi) s += `<path d="${d}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="1.2" stroke-linecap="round" pointer-events="none"/>`;
  }
  if (SIM && SIM.liveW[w.id]) s += `<path id="wf${w.id}" class="flow" d="${d}"/>`;
  s += `<path id="wh${w.id}" class="whit" data-wire="${w.id}" d="${d}" style="stroke-width:${r1(clamp(26 / S.cam.s, 16, 64))}"/></g>`;
  return s;
}

function compSVG(c) {
  const d = defOf(c);
  let s = `<g id="c${c.id}" data-comp="${c.id}" transform="translate(${r1(c.x)} ${r1(c.y)})">`;
  if (S.sel === c.id) s += `<rect class="csel" x="-8" y="-8" width="${d.w + 16}" height="${d.h + 16}" rx="8"/>`;
  s += drawBody(c, SIM);
  if (c.state && c.state.quemado) {
    s += `<g class="tripmark"><rect x="${d.w / 2 - 30}" y="${d.h / 2 - 10}" width="60" height="20" rx="5" fill="#e5533d" opacity=".92"/>
      <text x="${d.w / 2}" y="${d.h / 2 + 4}" font-size="10" fill="#fff" text-anchor="middle" font-weight="800">QUEMADO</text></g>`;
  }
  if (c.props && c.props.tag) {
    const tw = c.props.tag.length * 6.2 + 12;
    s += `<g pointer-events="none"><rect x="${d.w / 2 - tw / 2}" y="-34" width="${tw}" height="17" rx="8" fill="#2b3242" opacity=".92"/>
      <text x="${d.w / 2}" y="-22" font-size="9.5" fill="#ffd85e" text-anchor="middle" font-weight="700">${esc(c.props.tag)}</text></g>`;
  }
  for (const t of d.terms) {
    const hot = wireDraft && wireDraft.from.c === c.id && wireDraft.from.t === t.id;
    s += `<circle class="term" cx="${t.x}" cy="${t.y}" r="6.2" fill="${KIND_COL[t.kind]}"/>`;
    if (hot) s += `<circle cx="${t.x}" cy="${t.y}" r="12" fill="none" stroke="#3a72d4" stroke-width="2.5"><animate attributeName="r" values="9;14;9" dur="1s" repeatCount="indefinite"/></circle>`;
    if (t.lbl) {
      const ly = t.y <= 2 ? t.y - 10 : t.y + 15;
      s += `<text class="tlbl" x="${t.x}" y="${ly}" text-anchor="middle">${esc(t.lbl)}</text>`;
    }
    s += `<circle class="term-hit${hot ? ' hot' : ''}" data-term="${t.id}" data-comp="${c.id}" cx="${t.x}" cy="${t.y}" r="13"/>`;
  }
  s += `</g>`;
  return s;
}

function renderGhost() {
  if (!wireDraft) { ghostG.innerHTML = ''; return; }
  const c = byId(wireDraft.from.c);
  if (!c) { ghostG.innerHTML = ''; return; }
  const p = termAbs(c, wireDraft.from.t);
  ghostG.innerHTML = `<path class="ghostWire" d="M${p.x} ${p.y} L${wireDraft.x} ${wireDraft.y}"/>
    <circle cx="${wireDraft.x}" cy="${wireDraft.y}" r="7" fill="#3a72d4" opacity=".7"/>`;
}

function render() {
  renderBG();
  wiresG.innerHTML = S.wires.map(wireSVG).join('');
  compsG.innerHTML = S.comps.map(compSVG).join('');
  renderGhost();
  updateCamera();
  renderResults();
}

/* actualización barata durante un arrastre */
function moveCompLive(c) {
  const g = document.getElementById('c' + c.id);
  if (g) g.setAttribute('transform', `translate(${r1(c.x)} ${r1(c.y)})`);
  for (const w of S.wires) {
    if (w.a.c !== c.id && w.b.c !== c.id) continue;
    const d = wireD(w);
    const ids = ['w' + w.id, 'w' + w.id + 'b', 'wf' + w.id, 'wh' + w.id];
    for (const id of ids) { const p = document.getElementById(id); if (p) p.setAttribute('d', d); }
    const sel = document.querySelector('#wg' + w.id + ' .wsel');
    if (sel) sel.setAttribute('d', d);
  }
}

/* ==================================================================
   MUTACIONES + simulación en vivo
   ================================================================== */
let saveTimer = null;
function autosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { try { store.set(S.lab ? 'rebt.lab' : 'rebt.autosave', serialize()); } catch (e) {} }, 350);
}
function update() { SIM = S.lab ? simulateLab() : simulate(); render(); autosave(); }

/* ---------- historial: deshacer / rehacer (solo edición, no maniobras) ---------- */
const HIST = { back: [], fwd: [] };
function histSnap() {                       // llamar SIEMPRE antes de mutar
  HIST.back.push(serialize());
  if (HIST.back.length > 50) HIST.back.shift();
  HIST.fwd = [];
}
function histClear() { HIST.back = []; HIST.fwd = []; }
function histRestore(dump) {
  const cam = { ...S.cam }, mode = S.mode, view = S.view;   // no tocar cámara ni modo
  if (!deserialize(dump)) return false;
  S.cam = cam; S.mode = mode; S.view = view;
  aplicarModoVista(); update(); buildPalette(); closeSheet();
  return true;
}
function undo() {
  if (!HIST.back.length) { toast('Nada que deshacer'); return; }
  HIST.fwd.push(serialize());
  histRestore(HIST.back.pop());
  toast('Deshecho' + (HIST.back.length ? '' : ' (no queda más historial)'));
}
function redo() {
  if (!HIST.fwd.length) { toast('Nada que rehacer'); return; }
  HIST.back.push(serialize());
  histRestore(HIST.fwd.pop());
  toast('Rehecho');
}
$('#btnUndo').addEventListener('click', undo);

function addComp(type, x, y) {
  const d = DEFS[type];
  if (d.unico && S.comps.some(c => c.type === type)) { toast('Ya hay una ' + d.corto + ' en el montaje'); return null; }
  histSnap();
  const c = { id: 'c' + (S.nextId++), type, x: 0, y: 0, props: d.props(), state: d.state() };
  placeComp(c, x, y);
  S.comps.push(c);
  S.sel = c.id;
  update();
  return c;
}
function placeComp(c, x, y) {
  const d = defOf(c);
  c.x = x - d.w / 2; c.y = y - d.h / 2;
  if (d.din) {
    const cx = c.x + d.w / 2, cy = c.y + d.h / 2;
    if (cx > CUADRO.x - 60 && cx < CUADRO.x + CUADRO.w + 60 && cy > CUADRO.y - 90 && cy < CUADRO.y + CUADRO.h + 90) {
      c.y = DIN_Y;
      c.x = clamp(Math.round(c.x / 4) * 4, CUADRO.x + 18, CUADRO.x + CUADRO.w - 18 - d.w);
    }
  }
  c.x = clamp(c.x, -400, 2400); c.y = clamp(c.y, -300, 2800);
}
function freeDinX(d) {
  const usados = S.comps.filter(c => defOf(c).din).map(c => [c.x, c.x + defOf(c).w]);
  let x = CUADRO.x + 26;
  for (let i = 0; i < 60; i++) {
    const solapa = usados.some(([a, b]) => x < b + 8 && x + d.w > a - 8);
    if (!solapa) return x + d.w / 2;
    x += 12;
  }
  return CUADRO.x + CUADRO.w / 2;
}
function delComp(id) {
  histSnap();
  S.comps = S.comps.filter(c => c.id !== id);
  S.wires = S.wires.filter(w => w.a.c !== id && w.b.c !== id);
  if (S.sel === id) S.sel = null;
  update();
  buildPalette();
}
function addWire(a, b) {
  if (a.c === b.c && a.t === b.t) return;
  if (S.wires.some(w => (w.a.c === a.c && w.a.t === a.t && w.b.c === b.c && w.b.t === b.t) ||
                        (w.a.c === b.c && w.a.t === b.t && w.b.c === a.c && w.b.t === a.t))) {
    toast('Esos bornes ya están unidos'); return;
  }
  const ka = termAbs(byId(a.c), a.t).kind, kb = termAbs(byId(b.c), b.t).kind;
  let color = 'marron';
  if (ka === 'PE' || kb === 'PE') color = 'tierra';
  else if (ka === 'N' || kb === 'N') color = 'azul';
  else if (ka === 'L2' || kb === 'L2') color = 'negro';
  else if (ka === 'L3' || kb === 'L3') color = 'gris';
  else if (ka === 'X' && kb === 'X') color = 'negro';
  else if (ka === 'X' || kb === 'X') color = (ka === 'L' || kb === 'L') ? 'marron' : 'negro';
  histSnap();
  S.wires.push({ id: 'w' + (S.nextId++), a, b, color, sec: 2.5, len: 5 });
  update();
}
function delWire(id) {
  histSnap();
  S.wires = S.wires.filter(w => w.id !== id);
  if (S.selWire === id) S.selWire = null;
  update();
}

/* ==================================================================
   GESTOS (Pointer Events)
   ================================================================== */
const ptrs = new Map();
let gest = null;   // {type:'pan'|'drag'|'pinch'|'wire'|'tapwire', ...}

function nearestTerm(w, maxD) {
  let best = null, bd = maxD;
  for (const c of S.comps) {
    for (const t of defOf(c).terms) {
      const d = Math.hypot(c.x + t.x - w.x, c.y + t.y - w.y);
      if (d < bd) { bd = d; best = { c: c.id, t: t.id }; }
    }
  }
  return best;
}

/* prioridad: accionamiento > borne exacto > cuerpo (con borne muy cercano) > borne próximo > cable */
function hitAt(cx, cy) {
  const el = document.elementFromPoint(cx, cy);
  const dom = (el && el.closest) ? el : null;
  const a = dom && dom.closest('[data-act]');
  if (a) return { act: { c: a.dataset.comp, a: a.dataset.act } };
  const wpt = screenToWorld(cx, cy);
  const t = dom && dom.closest('[data-term]');
  if (t) return { term: { c: t.dataset.comp, t: t.dataset.term } };
  const g = dom && dom.closest('[data-comp]');
  const cerca = clamp(14 / S.cam.s, 12, 26);          // dentro de un componente
  const lejos = clamp(24 / S.cam.s, 16, 62);          // en zona libre (≈44 px en pantalla)
  const nt = nearestTerm(wpt, g ? cerca : lejos);
  if (nt) return { term: nt };
  if (g) return { comp: g.dataset.comp };
  const wv = dom && dom.closest('[data-wire]');
  if (wv) return { wire: wv.dataset.wire };
  return {};
}

svg.addEventListener('pointerdown', e => {
  e.preventDefault();
  svg.setPointerCapture(e.pointerId);
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (ptrs.size === 2) {
    const [p1, p2] = [...ptrs.values()];
    gest = {
      type: 'pinch',
      d0: Math.hypot(p2.x - p1.x, p2.y - p1.y),
      m0: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
      cam0: { ...S.cam }
    };
    return;
  }
  if (ptrs.size > 2) return;

  const hit = hitAt(e.clientX, e.clientY);

  // completar un cable en espera de segundo toque
  if (wireDraft && hit.term) {
    if (!(hit.term.c === wireDraft.from.c && hit.term.t === wireDraft.from.t)) {
      addWire(wireDraft.from, hit.term);
      wireDraft = null;
      render();
      gest = { type: 'none' };
      return;
    }
  }

  if (hit.term) {
    const c = byId(hit.term.c);
    const p = termAbs(c, hit.term.t);
    wireDraft = { from: hit.term, x: p.x, y: p.y };
    gest = { type: 'wire', moved: false, sx: e.clientX, sy: e.clientY };
    render();
    return;
  }
  if (hit.act) {
    const ca = byId(hit.act.c);
    if (ca && defOf(ca).momentary) {          // pulsador: cerrado mientras se mantiene
      ca.state.pressed = true; update();
      gest = { type: 'act', act: hit.act, momentary: true, moved: false, sx: e.clientX, sy: e.clientY };
      return;
    }
    gest = { type: 'act', act: hit.act, moved: false, sx: e.clientX, sy: e.clientY };
    return;
  }
  if (hit.comp) {
    const c = byId(hit.comp);
    const w = screenToWorld(e.clientX, e.clientY);
    gest = { type: 'drag', id: hit.comp, offx: w.x - c.x, offy: w.y - c.y, moved: false, sx: e.clientX, sy: e.clientY };
    return;
  }
  if (hit.wire) {
    gest = { type: 'tapwire', id: hit.wire, moved: false, sx: e.clientX, sy: e.clientY };
    return;
  }
  gest = { type: 'pan', cam0: { tx: S.cam.tx, ty: S.cam.ty }, sx: e.clientX, sy: e.clientY, moved: false };
});

svg.addEventListener('pointermove', e => {
  if (!ptrs.has(e.pointerId)) return;
  ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!gest) return;

  if (gest.type === 'pinch' && ptrs.size >= 2) {
    const [p1, p2] = [...ptrs.values()];
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const m = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    const ns = clamp(gest.cam0.s * d / gest.d0, 0.3, 3.2);
    const r = svg.getBoundingClientRect();
    const wx = (gest.m0.x - r.left - gest.cam0.tx) / gest.cam0.s;
    const wy = (gest.m0.y - r.top - gest.cam0.ty) / gest.cam0.s;
    S.cam.s = ns;
    S.cam.tx = m.x - r.left - wx * ns;
    S.cam.ty = m.y - r.top - wy * ns;
    updateCamera();
    return;
  }

  const dx = e.clientX - (gest.sx || 0), dy = e.clientY - (gest.sy || 0);
  const dist = Math.hypot(dx, dy);

  if (gest.type === 'pan') {
    if (dist > 4) gest.moved = true;
    S.cam.tx = gest.cam0.tx + dx;
    S.cam.ty = gest.cam0.ty + dy;
    updateCamera();
  } else if (gest.type === 'drag') {
    if (dist > 7 && !gest.moved) { gest.moved = true; histSnap(); }
    if (gest.moved) {
      const c = byId(gest.id);
      if (!c) return;
      const w = screenToWorld(e.clientX, e.clientY);
      c.x = w.x - gest.offx; c.y = w.y - gest.offy;
      moveCompLive(c);
    }
  } else if (gest.type === 'wire') {
    if (dist > 7) gest.moved = true;
    const w = screenToWorld(e.clientX, e.clientY);
    if (wireDraft) { wireDraft.x = w.x; wireDraft.y = w.y; renderGhost(); }
  } else if (gest.type === 'act') {
    // toque sobre la tecla/palanca = accionar; si el dedo se desplaza, pasa a mover el aparato
    if (dist > 9) {
      const c = byId(gest.act.c);
      if (c) {
        histSnap();
        const g0 = screenToWorld(gest.sx, gest.sy);
        const wasMomentary = gest.momentary;
        gest = { type: 'drag', id: c.id, offx: g0.x - c.x, offy: g0.y - c.y, moved: true, sx: gest.sx, sy: gest.sy };
        if (wasMomentary) { c.state.pressed = false; update(); }   // el pulsador no queda accionado
        const w = screenToWorld(e.clientX, e.clientY);
        c.x = w.x - gest.offx; c.y = w.y - gest.offy;
        moveCompLive(c);
      } else {
        gest.moved = true;
      }
    }
  } else if (gest.type === 'tapwire') {
    if (dist > 9) gest.moved = true;
  }
});

function endPtr(e) {
  ptrs.delete(e.pointerId);
  if (!gest) return;
  if (gest.type === 'pinch') { if (ptrs.size < 2) { gest = null; render(); } return; }
  const g = gest; gest = null;

  if (g.type === 'wire') {
    const hit = hitAt(e.clientX, e.clientY);
    if (hit.term && !(hit.term.c === wireDraft.from.c && hit.term.t === wireDraft.from.t)) {
      addWire(wireDraft.from, hit.term);
      wireDraft = null; render();
    } else if (g.moved) {
      // arrastró y soltó en vacío → cancelar
      wireDraft = null; render();
    } else {
      // toque simple: queda a la espera del segundo borne
      toast('Ahora toca otro borne para tender el cable');
    }
    return;
  }
  if (g.type === 'act') {
    if (g.momentary) {
      const ca = byId(g.act.c);
      if (ca) { ca.state.pressed = false; update(); }
      return;
    }
    if (!g.moved) doAct(g.act);
    return;
  }
  if (g.type === 'drag') {
    if (g.moved) {
      const c = byId(g.id);
      if (c) {
        const d = defOf(c);
        placeComp(c, c.x + d.w / 2, c.y + d.h / 2);
        update();
      }
    } else {
      const c = byId(g.id);
      if (c) { S.sel = c.id; S.selWire = null; render(); showFicha(c); }
    }
    return;
  }
  if (g.type === 'tapwire' && !g.moved) {
    S.selWire = g.id; S.sel = null; render();
    showWireSheet(S.wires.find(w => w.id === g.id));
    return;
  }
  if (g.type === 'pan' && !g.moved) {
    // toque en vacío: cancelar cable a medias, cerrar hojas, deseleccionar
    if (wireDraft) { wireDraft = null; render(); }
    if (S.sel || S.selWire) { S.sel = null; S.selWire = null; render(); }
    closeSheet();
  }
}
svg.addEventListener('pointerup', endPtr);
svg.addEventListener('pointercancel', e => {
  ptrs.delete(e.pointerId);
  if (gest && gest.momentary) { const ca = byId(gest.act.c); if (ca) { ca.state.pressed = false; update(); } }
  gest = null;
  if (wireDraft) { wireDraft = null; render(); }
});
document.addEventListener('gesturestart', e => e.preventDefault());

/* ---------- accionamientos ---------- */
function doAct(act) {
  const c = byId(act.c);
  if (!c) return;
  const d = defOf(c);
  if (d.onAct && act.a === 'tecla') { d.onAct(c); update(); return; }
  if (act.a === 'palanca') {
    if (c.state.trip) { c.state.trip = false; c.state.on = false; toast('Rearmado: vuelve a subir la palanca'); }
    else c.state.on = !c.state.on;
  } else if (act.a === 'test') {
    if (c.type === 'dif' && c.state.on && !c.state.trip) {
      if (SIM && !SIM.sinRed && SIM.difConTension[c.id]) { c.state.trip = true; toast('Prueba correcta: el diferencial ha disparado'); }
      else toast('El botón de prueba solo actúa con el diferencial en tensión');
    }
  } else if (act.a === 'tecla') {
    if (c.type === 'int') c.state.on = !c.state.on;
    if (c.type === 'conm') c.state.pos = !c.state.pos;
  }
  update();
}

/* ==================================================================
   HOJAS (ficha de componente / propiedades de cable)
   ================================================================== */
const sheet = $('#sheet'), sheetBody = $('#sheetBody');
function openSheet(html) { sheetBody.innerHTML = html; sheet.classList.add('on'); }
function closeSheet() { sheet.classList.remove('on'); }

function chipRow(items, cur, cb) {
  // items: [{v,txt,swatch?}] — devuelve html; los handlers se enganchan por delegación con data-*
  return `<div class="chips">` + items.map(i =>
    `<button class="chip${String(i.v) === String(cur) ? ' act' : ''}" data-cb="${cb}" data-v="${esc(i.v)}">
       ${i.swatch ? `<span class="sw" style="background:${i.swatch}"></span>` : ''}${esc(i.txt)}</button>`).join('') + `</div>`;
}

function showFicha(c) {
  const d = defOf(c);
  const inst = S.mode !== 'aprendiz';
  let h = `<div class="shTitle">${esc(d.nombre)}</div>`;
  let estado = '';
  if ('on' in c.state) estado = c.state.trip ? 'DISPARADO' : (c.state.on ? 'conectado (I)' : 'desconectado (0)');
  if ('pos' in c.state) estado = 'posición ' + (c.state.pos ? 'L2' : 'L1');
  if (c.type === 'luz' && SIM) {
    estado = SIM.lit[c.id] ? 'encendida' : 'apagada';
    if (SIM.lit[c.id] && inst && SIM.vlit && SIM.vlit[c.id] != null) {
      const v = SIM.vlit[c.id];
      estado += ` · le llegan ${fmtNum(r1(v))} V`;
      const cd = (V_RED - v) / V_RED * 100;
      if (cd > 0.05) estado += ` (caída ${fmtNum(r2(cd))} %)`;
    }
  }
  if (c.type === 'toma' && SIM) {
    const st = SIM.tomas[c.id];
    estado = st && st.tension ? ('con tensión' + (st.tierra ? ' · tierra OK' : ' · SIN tierra')) : 'sin tensión';
  }
  if (c.state.quemado) estado = `QUEMADO por sobretensión (${V_LL} V entre fases)`;
  if (estado) h += `<div class="shSub">Estado: ${esc(estado)}</div>`;
  h += `<div class="shDesc">${d.ficha}</div>`;

  if (c.type === 'pia') {
    if (inst) {
      h += `<div class="shRow"><label>Calibre</label>${chipRow(CALIBRES_PIA.map(v => ({ v, txt: v + ' A' })), c.props.calibre, 'piaCal')}</div>`;
      h += `<div class="shRow"><label>Circuito</label>${chipRow([{ v: '', txt: '—' }].concat(Object.keys(TABLA_C).map(k => ({ v: k, txt: k }))), c.props.circuito, 'piaCir')}</div>`;
      if (c.props.circuito) {
        const t = TABLA_C[c.props.circuito];
        h += `<div class="shSub">${c.props.circuito} · ${esc(t.uso)} → tabla: PIA ${t.pia} A · ${t.sec} mm² · tubo ${t.tubo} mm</div>`;
      }
    } else {
      h += `<div class="shSub">En modo Instalador podrás elegir el calibre.</div>`;
    }
  }
  if (c.type === 'iga' && inst) {
    h += `<div class="shRow"><label>Calibre</label>${chipRow([{ v: 25, txt: '25 A · básica' }, { v: 40, txt: '40 A · elevada' }], c.props.calibre, 'igaCal')}</div>`;
  }
  if (c.type === 'luz' && inst) {
    h += `<div class="shRow"><label>Potencia</label>
      <div class="stepper"><button data-cb="pot" data-v="-1">−</button><span>${c.props.potencia} W</span><button data-cb="pot" data-v="1">+</button></div></div>`;
  }
  if (c.type === 'toma' && inst) {
    h += `<div class="shRow"><label>Carga</label>${chipRow([
      { v: 0, txt: 'nada' }, { v: 100, txt: '100 W' }, { v: 700, txt: '700 W' }, { v: 1200, txt: '1.200 W' },
      { v: 2200, txt: '2.200 W' }, { v: 3500, txt: '3.500 W' }, { v: 5500, txt: '5.500 W' }
    ], c.props.carga, 'carga')}</div>`;
    h += `<div class="shRow"><label>cos φ</label>${chipRow([{ v: 1, txt: '1 (resistiva)' }, { v: 0.85, txt: '0,85 (motor)' }], c.props.fp, 'fp')}</div>`;
  }
  if (d.fichaExtra) h += d.fichaExtra(c, inst);

  h += `<div class="shRow"><label>Etiqueta</label><input class="nameIn" id="tagIn" maxlength="18" placeholder="p. ej. C2 cocina · 2ºA" value="${esc(c.props.tag || '')}"></div>`;

  h += `<div class="shBtns">`;
  if (c.state.quemado) h += `<button class="bigbtn grn" data-cb="reparar">Sustituir</button>`;
  if (d.act === 'palanca') h += `<button class="bigbtn pri" data-cb="accionar">${c.state.trip ? 'Rearmar' : (c.state.on ? 'Bajar palanca' : 'Subir palanca')}</button>`;
  if (d.act === 'tecla') h += `<button class="bigbtn pri" data-cb="accionar">Accionar</button>`;
  if (!d.unico) h += `<button class="bigbtn sec" data-cb="duplicar">Duplicar</button>`;
  h += `<button class="bigbtn red" data-cb="borrar">Eliminar</button></div>`;

  sheetBody.dataset.comp = c.id;
  delete sheetBody.dataset.wire;
  openSheet(h);
}

function showWireSheet(w) {
  if (!w) return;
  const inst = S.mode !== 'aprendiz';
  let h = `<div class="shTitle">Conductor</div>
    <div class="shSub">${esc(COLORES[w.color].n)}${inst ? ` · ${w.sec} mm² · ${w.len} m` : ''}</div>
    <div class="shRow"><label>Color</label>${chipRow(Object.keys(COLORES).map(k => ({ v: k, txt: COLORES[k].n.split(' ·')[0], swatch: COLORES[k].c })), w.color, 'wcol')}</div>`;
  if (inst) {
    h += `<div class="shRow"><label>Sección</label>${chipRow(SECCIONES.map(v => ({ v, txt: String(v).replace('.', ',') + ' mm²' })), w.sec, 'wsec')}</div>`;
    h += `<div class="shRow"><label>Longitud</label>
      <div class="stepper"><button data-cb="wlen" data-v="-1">−</button><span>${w.len} m</span><button data-cb="wlen" data-v="1">+</button></div></div>`;
  }
  h += `<div class="shBtns"><button class="bigbtn red" data-cb="wdel">Eliminar cable</button></div>`;
  sheetBody.dataset.wire = w.id;
  delete sheetBody.dataset.comp;
  openSheet(h);
}

/* etiqueta editable del componente */
sheetBody.addEventListener('focusin', e => { if (e.target.id === 'tagIn') histSnap(); });
sheetBody.addEventListener('input', e => {
  if (e.target.id !== 'tagIn' || !sheetBody.dataset.comp) return;
  const c = byId(sheetBody.dataset.comp);
  if (!c) return;
  c.props.tag = e.target.value.trim();
  render(); autosave();
});

/* delegación de la hoja */
sheetBody.addEventListener('click', e => {
  const b = e.target.closest('[data-cb]');
  if (!b) return;
  const cb = b.dataset.cb, v = b.dataset.v;
  const c = sheetBody.dataset.comp ? byId(sheetBody.dataset.comp) : null;
  const w = sheetBody.dataset.wire ? S.wires.find(x => x.id === sheetBody.dataset.wire) : null;

  if (['piaCal', 'piaCir', 'igaCal', 'pot', 'carga', 'fp', 'prop', 'propStep', 'wcol', 'wsec', 'wlen'].includes(cb)) histSnap();

  if (cb === 'duplicar' && c) {
    const d = defOf(c);
    histSnap();
    const n = { id: 'c' + (S.nextId++), type: c.type, x: 0, y: 0, props: JSON.parse(JSON.stringify(c.props)), state: d.state() };
    placeComp(n, c.x + d.w / 2 + 30, c.y + d.h / 2 + 26);
    S.comps.push(n);
    S.sel = n.id;
    update(); buildPalette(); showFicha(n);
    toast(d.corto + ' duplicado');
    return;
  }
  if (cb === 'piaCal' && c) c.props.calibre = Number(v);
  else if (cb === 'piaCir' && c) c.props.circuito = v;
  else if (cb === 'igaCal' && c) c.props.calibre = Number(v);
  else if (cb === 'pot' && c) c.props.potencia = clamp(c.props.potencia + Number(v) * 20, 20, 500);
  else if (cb === 'carga' && c) c.props.carga = Number(v);
  else if (cb === 'fp' && c) c.props.fp = Number(v);
  else if (cb === 'accionar' && c) { doAct({ c: c.id, a: defOf(c).act }); showFicha(byId(c.id)); return; }
  else if (cb === 'reparar' && c) { c.state.quemado = false; toast('Receptor sustituido por uno nuevo'); }
  else if (cb === 'borrar' && c) { delComp(c.id); closeSheet(); return; }
  else if (cb === 'prop' && c) c.props[b.dataset.k] = (b.dataset.num === '0') ? v : Number(v);
  else if (cb === 'propStep' && c) {
    const k = b.dataset.k;
    c.props[k] = clamp((Number(c.props[k]) || 0) + Number(v) * Number(b.dataset.step || 1),
      Number(b.dataset.min || 0), Number(b.dataset.max || 99999));
  }
  else if (cb === 'wcol' && w) w.color = v;
  else if (cb === 'wsec' && w) w.sec = Number(v);
  else if (cb === 'wlen' && w) w.len = clamp(w.len + Number(v) * (w.len >= 10 ? 5 : 1), 1, 60);
  else if (cb === 'wdel' && w) { delWire(w.id); closeSheet(); return; }
  else return;

  update();
  if (c) showFicha(byId(c.id));
  if (w) showWireSheet(S.wires.find(x => x.id === w.id));
});

/* ==================================================================
   PALETA
   ================================================================== */
const PALETA = ['red', 'iga', 'dif', 'pia', 'int', 'conm', 'luz', 'toma', 'borne', 'pica'];
/* PAL_CATS se define en la sección Fase 2; buildPalette solo se llama tras cargarla */

function palIcon(type) {
  const d = DEFS[type];
  const dummy = { id: 'pal', type, x: 0, y: 0, props: d.props(), state: d.state() };
  if (type === 'iga' || type === 'dif' || type === 'pia') dummy.state.on = true;
  const view0 = S.view; S.view = 'realista';
  const body = drawBody(dummy, null).replace(/data-act="[^"]*"/g, '').replace(/data-comp="[^"]*"/g, '');
  S.view = view0;
  return `<svg viewBox="-6 -6 ${d.w + 12} ${d.h + 12}" preserveAspectRatio="xMidYMid meet">${body}</svg>`;
}

function buildPalette() {
  const cats = (S.lab && typeof LAB_CATS !== 'undefined') ? LAB_CATS : PAL_CATS;
  $('#palTabs').innerHTML = cats.map(c =>
    `<button class="ptab${S.palCat === c.id ? ' act' : ''}" data-cat="${c.id}">${esc(c.n)}</button>`).join('');
  const cat = cats.find(c => c.id === S.palCat) || cats[0];
  $('#palette').innerHTML = cat.items.map(t => {
    const dis = DEFS[t].unico && S.comps.some(c => c.type === t);
    return `<button class="palItem${dis ? ' dis' : ''}" data-pal="${t}">${palIcon(t)}<span>${esc(DEFS[t].corto)}</span></button>`;
  }).join('');
}
$('#palTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (b) { S.palCat = b.dataset.cat; buildPalette(); }
});

let palDrag = null;
const dragGhost = $('#dragGhost');
$('#palette').addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-pal]');
  if (!b) return;
  palDrag = { type: b.dataset.pal, sx: e.clientX, sy: e.clientY, ghost: false, id: e.pointerId };
});
document.addEventListener('pointermove', e => {
  if (!palDrag || e.pointerId !== palDrag.id) return;
  const dy = e.clientY - palDrag.sy;
  if (!palDrag.ghost && dy < -16) {
    palDrag.ghost = true;
    dragGhost.innerHTML = palIcon(palDrag.type);
    dragGhost.style.display = 'block';
  }
  if (palDrag.ghost) {
    dragGhost.style.left = (e.clientX - 32) + 'px';
    dragGhost.style.top = (e.clientY - 60) + 'px';
  }
});
document.addEventListener('pointerup', e => {
  if (!palDrag || e.pointerId !== palDrag.id) return;
  const pd = palDrag; palDrag = null;
  dragGhost.style.display = 'none';
  const overCanvas = (() => { const r = svg.getBoundingClientRect(); return e.clientY < r.bottom && e.clientY > r.top; })();
  if (pd.ghost && overCanvas) {
    const w = screenToWorld(e.clientX, e.clientY - 26);
    const c = addComp(pd.type, w.x, w.y);
    if (c) buildPalette();
    return;
  }
  const moved = Math.hypot(e.clientX - pd.sx, e.clientY - pd.sy) > 10;
  if (!moved) {
    // toque: añadir en un sitio razonable
    const d = DEFS[pd.type];
    let x, y;
    if (d.din) { x = freeDinX(d); y = DIN_Y + d.h / 2; }
    else if (pd.type === 'red') { x = 340; y = 60; }
    else {
      const r = svg.getBoundingClientRect();
      const cpt = screenToWorld(r.left + r.width / 2, r.top + r.height * 0.55);
      x = cpt.x + (Math.random() * 60 - 30); y = cpt.y;
      if (y < CUADRO.y + CUADRO.h + 80) y = CUADRO.y + CUADRO.h + 140;
    }
    const c = addComp(pd.type, x, y);
    if (c) { buildPalette(); toast(DEFS[pd.type].corto + ' añadido al plano'); }
  }
});
document.addEventListener('pointercancel', e => {
  if (palDrag && e.pointerId === palDrag.id) { palDrag = null; dragGhost.style.display = 'none'; }
});

/* ==================================================================
   TOAST / MODAL
   ================================================================== */
let toastTimer = null;
function toast(t) {
  const el = $('#toast');
  el.textContent = t;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2400);
}
const modal = $('#modal'), modalBody = $('#modalBody');
function openModal(html) { modalBody.innerHTML = html; modal.classList.add('on'); }
function closeModal() { modal.classList.remove('on'); }
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
