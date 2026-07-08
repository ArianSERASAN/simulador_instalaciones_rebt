/* ==================================================================
   MOTOR ELÉCTRICO — unión-búsqueda sobre bornes
   Generalizado a suministro multifase: la red puede ser monofásica
   (fases ['L']) o trifásica (fases ['L1','L2','L3']); el resto del
   motor trabaja siempre con la lista de raíces de fase + neutro.
   ================================================================== */
class UF {
  constructor() { this.p = new Map(); }
  f(k) { const m = this.p; while (m.has(k) && m.get(k) !== k) k = m.get(k); return k; }
  u(a, b) { a = this.f(a); b = this.f(b); if (a !== b) this.p.set(a, b); }
}

/* punto de suministro activo (si conviven, manda la trifásica) */
function getSupply() {
  const r3 = S.comps.find(c => c.type === 'red3');
  if (r3) return { comp: r3, phases: ['L1', 'L2', 'L3'], tri: true };
  const r = S.comps.find(c => c.type === 'red');
  return r ? { comp: r, phases: ['L'], tri: false } : null;
}
/* raíces de las fases y del neutro para un grafo dado */
function supRoots(uf, sup) {
  return {
    phs: sup.phases.map(t => uf.f(K(sup.comp.id, t))),
    nu: uf.f(K(sup.comp.id, 'N'))
  };
}

function buildUF(opts = {}) {
  const uf = new UF();
  const open = opts.open || {};
  for (const c of S.comps) {
    if (open[c.id]) continue;
    switch (c.type) {
      case 'iga': case 'dif': case 'pia': {
        const cerrado = opts.allClosed ? true : (c.state.on && !c.state.trip);
        if (cerrado) { uf.u(K(c.id, 'Li'), K(c.id, 'Lo')); uf.u(K(c.id, 'Ni'), K(c.id, 'No')); }
        break;
      }
      case 'int': {
        const cerrado = opts.allClosed ? true : c.state.on;
        if (cerrado) uf.u(K(c.id, 'p'), K(c.id, 's'));
        break;
      }
      case 'conm': {
        if (opts.allClosed) { uf.u(K(c.id, 'c'), K(c.id, 'l1')); uf.u(K(c.id, 'c'), K(c.id, 'l2')); }
        else uf.u(K(c.id, 'c'), K(c.id, c.state.pos ? 'l2' : 'l1'));
        break;
      }
      case 'borne': {
        const ts = defOf(c).terms;
        for (let i = 1; i < ts.length; i++) uf.u(K(c.id, ts[0].id), K(c.id, ts[i].id));
        break;
      }
      default: {
        const d = defOf(c);
        if (d.links) for (const [a, b] of d.links(c, opts)) uf.u(K(c.id, a), K(c.id, b));
      }
    }
  }
  for (const w of S.wires) uf.u(K(w.a.c, w.a.t), K(w.b.c, w.b.t));
  return uf;
}

/* estado de receptores para un grafo dado */
function energFlags(uf, sup, energia) {
  const lit = {}, tomas = {};
  const { phs, nu } = sup ? supRoots(uf, sup) : { phs: [], nu: null };
  const es = new Set(S.comps.filter(c => c.type === 'pica').map(p => uf.f(K(p.id, 'PE'))));
  const okPar = (a, b) => (phs.includes(a) && b === nu) || (phs.includes(b) && a === nu);
  for (const c of S.comps) {
    const d = defOf(c);
    if (d.load3) {
      /* receptor trifásico: necesita las tres fases distintas */
      const rs = ['L1', 'L2', 'L3'].map(t => uf.f(K(c.id, t)));
      lit[c.id] = !!(energia && sup && rs.every(r => phs.includes(r)) && new Set(rs).size === 3);
    } else if (c.type === 'luz' || d.load) {
      const a = sup ? uf.f(K(c.id, 'L')) : null, b = sup ? uf.f(K(c.id, 'N')) : null;
      /* una carga con interruptor propio (p. ej. cuadro de vivienda) puede estar apagada */
      lit[c.id] = !!(energia && sup && okPar(a, b) && !c.state.quemado && c.state.on !== false);
    } else if (c.type === 'toma') {
      const a = sup ? uf.f(K(c.id, 'L')) : null, b = sup ? uf.f(K(c.id, 'N')) : null;
      const pe = uf.f(K(c.id, 'PE'));
      tomas[c.id] = {
        tension: !!(energia && sup && okPar(a, b)),
        tierra: es.has(pe),
        inv: !!(energia && sup && a === nu && phs.includes(b))
      };
    }
  }
  return { lit, tomas, es, phs, nu };
}

/* ¿hay algún par de conductores de suministro en corto? */
function hayCorto(phs, nu) {
  const all = [...phs, nu];
  for (let i = 0; i < all.length; i++)
    for (let j = i + 1; j < all.length; j++)
      if (all[i] === all[j]) return { i, j, faseFase: j < phs.length };
  return null;
}

/* evaluación pura (para retos): no dispara nada, no emite mensajes */
function pureEval() {
  const out = { lit: {}, toma: {} };
  const sup = getSupply();
  if (!sup) return out;
  const uf = buildUF();
  const { phs, nu } = supRoots(uf, sup);
  const es = new Set(S.comps.filter(c => c.type === 'pica').map(p => uf.f(K(p.id, 'PE'))));
  if (hayCorto(phs, nu) || phs.some(p => es.has(p))) return out;   // corto o fuga: las protecciones actuarían
  const fl = energFlags(uf, sup, true);
  out.lit = fl.lit;
  out.toma = fl.tomas;
  return out;
}

/* bornes de fase de un receptor (para atribuirlo a su PIA) */
function loadPhaseTerms(c) { return defOf(c).load3 ? ['L1', 'L2', 'L3'] : ['L']; }

/* topología de circuitos: qué cuelga de cada PIA (independiente de estados) */
function circuitosTopo(sup) {
  const out = [];
  if (!sup) return out;
  const pot = buildUF({ allClosed: true });
  const potR = supRoots(pot, sup);
  const loads = S.comps.filter(c => c.type === 'luz' || c.type === 'toma' || defOf(c).load || defOf(c).load3);
  const difs = S.comps.filter(c => c.type === 'dif');
  /* ¿el borne queda potencialmente en fase, y deja de estarlo al abrir el aparato `t`? */
  const cae = (t, tR, cid, term) => {
    const nb = pot.f(K(cid, term));
    const i = potR.phs.indexOf(nb);
    return i >= 0 && t.f(K(cid, term)) !== tR.phs[i];
  };
  for (const pia of S.comps.filter(c => c.type === 'pia')) {
    const fed = potR.phs.includes(pot.f(K(pia.id, 'Li')));
    const t = buildUF({ allClosed: true, open: { [pia.id]: true } });
    const tR = supRoots(t, sup);
    const dLoads = loads.filter(l => loadPhaseTerms(l).some(tm => cae(t, tR, l.id, tm)));
    const wF = [], wN = [];
    for (const w of S.wires) {
      const kb = K(w.a.c, w.a.t);
      const nb = pot.f(kb), na = t.f(kb);
      const i = potR.phs.indexOf(nb);
      if (i >= 0 && na !== tR.phs[i]) wF.push(w);
      else if (nb === potR.nu && na !== tR.nu) wN.push(w);
    }
    const dif = fed ? difs.find(d => {
      const t2 = buildUF({ allClosed: true, open: { [d.id]: true } });
      const t2R = supRoots(t2, sup);
      return !t2R.phs.includes(t2.f(K(pia.id, 'Li')));
    }) : null;
    out.push({ pia, fed, dLoads, wF, wN, dif: dif || null });
  }
  return out;
}

/* intensidad que demanda un receptor encendido (por fase) */
function iReceptor(c) {
  if (defOf(c).load3) return c.props.potencia / (Math.sqrt(3) * V_LL * (c.props.fp || 1));
  return c.props.potencia / (V_RED * (c.props.fp || 1));
}

function consumo(ce, lit, tomas) {
  let P = 0, I = 0;
  for (const l of ce.dLoads) {
    const d = defOf(l);
    if ((l.type === 'luz' || d.load || d.load3) && lit[l.id]) {
      P += l.props.potencia; I += iReceptor(l);
    } else if (l.type === 'toma' && tomas[l.id] && tomas[l.id].tension && l.props.carga > 0) {
      P += l.props.carga; I += l.props.carga / (V_RED * (l.props.fp || 1));
    }
  }
  return { P, I };
}

/* demanda total de la instalación (para el ICP y el contador) */
function demandaTotal(fl) {
  let P = 0, I = 0;
  for (const c of S.comps) {
    const d = defOf(c);
    if ((c.type === 'luz' || d.load || d.load3) && fl.lit[c.id]) {
      P += c.props.potencia; I += iReceptor(c);
    } else if (c.type === 'toma') {
      const st = fl.tomas[c.id];
      if (st && st.tension && c.props.carga > 0) { P += c.props.carga; I += c.props.carga / (V_RED * (c.props.fp || 1)); }
    }
  }
  return { P, I };
}

/* intensidad demandada en cada fase (para LGA y desequilibrio) */
function demandaPorFase(uf, fl, sup) {
  const { phs, nu } = supRoots(uf, sup);
  const I = phs.map(() => 0);
  for (const c of S.comps) {
    const d = defOf(c);
    if (d.load3 && fl.lit[c.id]) {
      const i3 = iReceptor(c);
      for (let i = 0; i < I.length; i++) I[i] += i3;
    } else if ((c.type === 'luz' || d.load) && fl.lit[c.id]) {
      const a = uf.f(K(c.id, 'L')), b = uf.f(K(c.id, 'N'));
      const i = phs.indexOf(phs.includes(a) ? a : b);
      if (i >= 0) I[i] += iReceptor(c);
    } else if (c.type === 'toma') {
      const st = fl.tomas[c.id];
      if (st && st.tension && c.props.carga > 0) {
        const a = uf.f(K(c.id, 'L')), b = uf.f(K(c.id, 'N'));
        const i = phs.indexOf(phs.includes(a) ? a : b);
        if (i >= 0) I[i] += c.props.carga / (V_RED * (c.props.fp || 1));
      }
    }
  }
  return I;
}

/* ==================================================================
   GRAFO EXPLÍCITO — para el multímetro y el camino de la corriente
   ================================================================== */
/* aristas activas del montaje: contactos cerrados + cables (con su id) */
function edgesActivos() {
  const ed = [];
  for (const c of S.comps) {
    switch (c.type) {
      case 'iga': case 'dif': case 'pia':
        if (c.state.on && !c.state.trip) ed.push({ a: K(c.id, 'Li'), b: K(c.id, 'Lo') }, { a: K(c.id, 'Ni'), b: K(c.id, 'No') });
        break;
      case 'int': if (c.state.on) ed.push({ a: K(c.id, 'p'), b: K(c.id, 's') }); break;
      case 'conm': ed.push({ a: K(c.id, 'c'), b: K(c.id, c.state.pos ? 'l2' : 'l1') }); break;
      case 'borne': {
        const ts = defOf(c).terms;
        for (let i = 1; i < ts.length; i++) ed.push({ a: K(c.id, ts[0].id), b: K(c.id, ts[i].id) });
        break;
      }
      default: {
        const d = defOf(c);
        if (d.links) for (const [a, b] of d.links(c, {})) ed.push({ a: K(c.id, a), b: K(c.id, b) });
      }
    }
  }
  for (const w of S.wires) ed.push({ a: K(w.a.c, w.a.t), b: K(w.b.c, w.b.t), w: w.id });
  return ed;
}

/* camino más corto de `from` a cualquiera de `targets` → ids de cables usados */
function bfsCables(ed, from, targets) {
  const adj = new Map();
  const add = (k, e, o) => { if (!adj.has(k)) adj.set(k, []); adj.get(k).push({ to: o, e }); };
  for (const e of ed) { add(e.a, e, e.b); add(e.b, e, e.a); }
  const prev = new Map([[from, null]]);
  const cola = [from];
  let fin = null;
  while (cola.length) {
    const k = cola.shift();
    if (targets.has(k)) { fin = k; break; }
    for (const { to, e } of (adj.get(k) || [])) {
      if (prev.has(to)) continue;
      prev.set(to, { k, e });
      cola.push(to);
    }
  }
  if (fin === null) return null;
  const cables = new Set();
  for (let p = prev.get(fin); p; p = prev.get(p.k)) if (p.e.w) cables.add(p.e.w);
  return cables;
}

/* recorrido completo fase → receptor → neutro de un receptor encendido */
function caminoReceptor(c) {
  const sup = getSupply();
  if (!sup) return null;
  const ed = edgesActivos();
  const phT = new Set(sup.phases.map(t => K(sup.comp.id, t)));
  const nuT = new Set([K(sup.comp.id, 'N')]);
  const d = defOf(c);
  const cables = new Set();
  const tramos = d.load3
    ? [['L1', phT], ['L2', phT], ['L3', phT]]
    : [['L', phT], ['N', nuT]];
  for (const [term, targets] of tramos) {
    const parte = bfsCables(ed, K(c.id, term), targets);
    if (!parte) return null;
    for (const w of parte) cables.add(w);
  }
  return cables;
}

/* medición entre dos bornes (multímetro) → {cont, v} con v en voltios o null */
function medirEntre(ka, kb) {
  if (S.lab) {
    const s = (SIM && SIM.lab) ? SIM : simulateLab();
    const va = s.termV ? s.termV[ka] : null, vb = s.termV ? s.termV[kb] : null;
    const uf = new UF();
    for (const w of S.wires) uf.u(K(w.a.c, w.a.t), K(w.b.c, w.b.t));
    for (const c of S.comps) {
      if (c.type === 'int' && c.state.on) uf.u(K(c.id, 'p'), K(c.id, 's'));
      if (c.type === 'puls' && c.state.pressed) uf.u(K(c.id, 'p'), K(c.id, 's'));
    }
    const cont = uf.f(ka) === uf.f(kb);
    return { cont, v: (va != null && vb != null) ? Math.abs(va - vb) : (cont ? 0 : null) };
  }
  const uf = buildUF();
  const ra = uf.f(ka), rb = uf.f(kb);
  const cont = ra === rb;
  const sup = getSupply();
  const energia = !!sup && SIM && !SIM.fault && !SIM.sinRed;
  if (!sup || !energia) return { cont, v: cont ? 0 : null };
  const { phs, nu } = supRoots(uf, sup);
  const es = new Set(S.comps.filter(c => c.type === 'pica').map(p => uf.f(K(p.id, 'PE'))));
  const cls = r => { const i = phs.indexOf(r); return i >= 0 ? 'F' + i : (r === nu ? 'N' : (es.has(r) ? 'T' : null)); };
  const a = cls(ra), b = cls(rb);
  if (a == null || b == null) return { cont, v: cont ? 0 : null };
  let v = 0;
  if (a !== b) {
    const fA = a[0] === 'F', fB = b[0] === 'F';
    if (fA && fB) v = V_LL;              // dos fases distintas
    else if (fA || fB) v = V_RED;        // fase-neutro o fase-tierra (esquema TT)
    else v = 0;                          // neutro-tierra
  }
  return { cont, v };
}

const fmtSec = v => String(v).replace('.', ',');
const fmtNum = v => String(v).replace('.', ',');
