/* ==================================================================
   MOTOR ELÉCTRICO — unión-búsqueda sobre bornes
   ================================================================== */
class UF {
  constructor() { this.p = new Map(); }
  f(k) { const m = this.p; while (m.has(k) && m.get(k) !== k) k = m.get(k); return k; }
  u(a, b) { a = this.f(a); b = this.f(b); if (a !== b) this.p.set(a, b); }
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
function energFlags(uf, red, energia) {
  const lit = {}, tomas = {};
  const ph = red ? uf.f(K(red.id, 'L')) : null;
  const nu = red ? uf.f(K(red.id, 'N')) : null;
  const es = new Set(S.comps.filter(c => c.type === 'pica').map(p => uf.f(K(p.id, 'PE'))));
  for (const c of S.comps) {
    if (c.type === 'luz' || defOf(c).load) {
      const a = red ? uf.f(K(c.id, 'L')) : null, b = red ? uf.f(K(c.id, 'N')) : null;
      lit[c.id] = !!(energia && red && ((a === ph && b === nu) || (a === nu && b === ph)));
    } else if (c.type === 'toma') {
      const a = red ? uf.f(K(c.id, 'L')) : null, b = red ? uf.f(K(c.id, 'N')) : null;
      const pe = uf.f(K(c.id, 'PE'));
      tomas[c.id] = {
        tension: !!(energia && red && ((a === ph && b === nu) || (a === nu && b === ph))),
        tierra: es.has(pe),
        inv: !!(energia && red && a === nu && b === ph)
      };
    }
  }
  return { lit, tomas, es, ph, nu };
}

/* evaluación pura (para retos): no dispara nada, no emite mensajes */
function pureEval() {
  const out = { lit: {}, toma: {} };
  const red = S.comps.find(c => c.type === 'red');
  if (!red) return out;
  const uf = buildUF();
  const ph = uf.f(K(red.id, 'L')), nu = uf.f(K(red.id, 'N'));
  const es = new Set(S.comps.filter(c => c.type === 'pica').map(p => uf.f(K(p.id, 'PE'))));
  if (ph === nu || es.has(ph)) return out;   // corto o fuga: las protecciones actuarían
  const fl = energFlags(uf, red, true);
  out.lit = fl.lit;
  out.toma = fl.tomas;
  return out;
}

/* topología de circuitos: qué cuelga de cada PIA (independiente de estados) */
function circuitosTopo(red) {
  const out = [];
  if (!red) return out;
  const pot = buildUF({ allClosed: true });
  const potPh = pot.f(K(red.id, 'L')), potNu = pot.f(K(red.id, 'N'));
  const loads = S.comps.filter(c => c.type === 'luz' || c.type === 'toma' || defOf(c).load);
  const difs = S.comps.filter(c => c.type === 'dif');
  for (const pia of S.comps.filter(c => c.type === 'pia')) {
    const fed = pot.f(K(pia.id, 'Li')) === potPh;
    const t = buildUF({ allClosed: true, open: { [pia.id]: true } });
    const tPh = t.f(K(red.id, 'L')), tNu = t.f(K(red.id, 'N'));
    const dLoads = loads.filter(l => pot.f(K(l.id, 'L')) === potPh && t.f(K(l.id, 'L')) !== tPh);
    const wF = [], wN = [];
    for (const w of S.wires) {
      const kb = K(w.a.c, w.a.t);
      const nb = pot.f(kb), na = t.f(kb);
      if (nb === potPh && na !== tPh) wF.push(w);
      else if (nb === potNu && na !== tNu) wN.push(w);
    }
    const dif = fed ? difs.find(d => {
      const t2 = buildUF({ allClosed: true, open: { [d.id]: true } });
      return t2.f(K(pia.id, 'Li')) !== t2.f(K(red.id, 'L'));
    }) : null;
    out.push({ pia, fed, dLoads, wF, wN, dif: dif || null });
  }
  return out;
}

function consumo(ce, lit, tomas) {
  let P = 0, I = 0;
  for (const l of ce.dLoads) {
    if ((l.type === 'luz' || defOf(l).load) && lit[l.id]) {
      P += l.props.potencia; I += l.props.potencia / (V_RED * (l.props.fp || 1));
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
    if ((c.type === 'luz' || defOf(c).load) && fl.lit[c.id]) {
      P += c.props.potencia; I += c.props.potencia / (V_RED * (c.props.fp || 1));
    } else if (c.type === 'toma') {
      const st = fl.tomas[c.id];
      if (st && st.tension && c.props.carga > 0) { P += c.props.carga; I += c.props.carga / (V_RED * (c.props.fp || 1)); }
    }
  }
  return { P, I };
}

const fmtSec = v => String(v).replace('.', ',');
const fmtNum = v => String(v).replace('.', ',');
