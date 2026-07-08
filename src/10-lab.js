/* ==================================================================
   LABORATORIO DE CIRCUITOS BÁSICOS
   Espacio aparte del simulador REBT con un motor eléctrico REAL:
   análisis nodal (fuentes pasadas a Norton → G·v = i, eliminación
   gaussiana). Aquí la serie y el paralelo funcionan de verdad, el
   brillo depende de la potencia y los cortocircuitos tienen corriente.
   ================================================================== */

S.lab = false;
let LABSIM = null;   // último resultado del laboratorio (SIM apunta a él)

/* ---------- componentes del laboratorio (bornes kind X) ---------- */
Object.assign(DEFS, {

  pila: {
    nombre: 'Pila / fuente de corriente continua', corto: 'Pila',
    w: 92, h: 108, din: false, lab: true,
    terms: [
      { id: 'p', x: 28, y: 0, kind: 'X', lbl: '+' },
      { id: 'm', x: 64, y: 0, kind: 'X', lbl: '−' }
    ],
    props: () => ({ v: 9 }), state: () => ({}),
    ficha: fichaTxt(`Fuente de energía del laboratorio: mantiene una <b>tensión</b> fija entre sus polos (con una pequeña resistencia interna de 0,3 Ω). La corriente que entrega depende del circuito: <b>I = V / R</b> (ley de Ohm). En cortocircuito se calienta y se agota.`),
    fichaExtra: c => `<div class="shRow"><label>Tensión</label>${chipProp(c, 'v', [4.5, 9, 12, 24], v => String(v).replace('.', ',') + ' V')}</div>`,
    draw(c, sim) {
      const i = sim && sim.lab && sim.iPila ? sim.iPila[c.id] : null;
      return `
        <rect x="18" y="26" width="56" height="70" rx="7" fill="#2b3242" stroke="#1d2330"/>
        <rect x="18" y="26" width="56" height="24" rx="7" fill="#c9a44a" stroke="#96762b"/>
        <line x1="28" y1="0" x2="28" y2="26" stroke="#7a4a21" stroke-width="3"/>
        <line x1="64" y1="0" x2="64" y2="26" stroke="#2b2b2e" stroke-width="3"/>
        <text x="28" y="42" font-size="12" fill="#5c4a17" text-anchor="middle" font-weight="800">+</text>
        <text x="64" y="43" font-size="14" fill="#5c4a17" text-anchor="middle" font-weight="800">−</text>
        <text x="46" y="72" font-size="13" fill="#eef2f7" text-anchor="middle" font-weight="700">${String(c.props.v).replace('.', ',')} V</text>
        <text x="46" y="86" font-size="8" fill="#9fb0c5" text-anchor="middle">${i != null ? fmtNum(r2(i)) + ' A' : 'CC'}</text>`;
    }
  },

  resistencia: {
    nombre: 'Resistencia', corto: 'Resistencia',
    w: 96, h: 74, din: false, lab: true,
    terms: [
      { id: 'a', x: 14, y: 0, kind: 'X', lbl: '' },
      { id: 'b', x: 82, y: 0, kind: 'X', lbl: '' }
    ],
    props: () => ({ r: 100 }), state: () => ({}),
    ficha: fichaTxt(`Se opone al paso de la corriente: <b>I = V / R</b>. En <b>serie</b> las resistencias se suman; en <b>paralelo</b> el conjunto baja. Disipa la energía en calor: P = V² / R.`),
    fichaExtra: c => `<div class="shRow"><label>Valor</label>${chipProp(c, 'r', [10, 47, 100, 220, 470, 1000], v => v + ' Ω')}</div>`,
    draw(c) {
      return `
        <line x1="14" y1="0" x2="14" y2="34" stroke="#6b7684" stroke-width="2.4"/>
        <line x1="82" y1="0" x2="82" y2="34" stroke="#6b7684" stroke-width="2.4"/>
        <rect x="14" y="26" width="68" height="17" rx="8" fill="#d8b98a" stroke="#a8804a"/>
        <rect x="26" y="26" width="6" height="17" fill="#8a4a2a"/>
        <rect x="40" y="26" width="6" height="17" fill="#2b2b2e"/>
        <rect x="54" y="26" width="6" height="17" fill="#c9762a"/>
        <text x="48" y="62" font-size="10" fill="#4a5261" text-anchor="middle" font-weight="700">${c.props.r} Ω</text>`;
    }
  },

  bombilla: {
    nombre: 'Bombilla de laboratorio', corto: 'Bombilla',
    w: 84, h: 108, din: false, lab: true,
    terms: [
      { id: 'a', x: 26, y: 0, kind: 'X', lbl: '' },
      { id: 'b', x: 58, y: 0, kind: 'X', lbl: '' }
    ],
    props: () => ({ vn: 6, wn: 3 }), state: () => ({}),
    ficha: fichaTxt(`Se comporta como una resistencia fija (R = V²ₙ / Pₙ) y brilla según la <b>potencia real</b> que recibe. A su tensión nominal brilla al 100 %; con más de un 60 % de exceso de potencia <b>se funde</b>. En serie se reparten la tensión; en paralelo cada una recibe la de la pila.`),
    fichaExtra: c => `<div class="shRow"><label>Nominal</label><div class="chips">` +
      [[3.5, 1], [6, 3], [12, 5]].map(([v, w]) =>
        `<button class="chip${c.props.vn === v ? ' act' : ''}" data-cb="bulbNom" data-v="${v}" data-w="${w}">${String(v).replace('.', ',')} V · ${w} W</button>`).join('') + `</div></div>`,
    draw(c, sim) {
      const st = sim && sim.lab && sim.bulb ? sim.bulb[c.id] : null;
      const b = c.state.quemado ? 0 : (st ? st.b : 0);
      const lit = b > 0.03;
      return `
        <line x1="26" y1="0" x2="26" y2="30" stroke="#6b7684" stroke-width="2.4"/>
        <line x1="58" y1="0" x2="58" y2="30" stroke="#6b7684" stroke-width="2.4"/>
        <rect x="30" y="28" width="24" height="14" rx="3" fill="#8f97a4"/>
        ${lit ? `<circle cx="42" cy="70" r="${r1(20 + 16 * b)}" fill="url(#gGlow)" opacity="${(0.4 + 0.6 * b).toFixed(2)}"/>` : ''}
        <circle cx="42" cy="70" r="22" fill="${c.state.quemado ? '#d9d3c8' : (lit ? mixHex('#e8d9a0', '#ffd85e', b) : '#f4f6f9')}" stroke="#adb6c2" stroke-width="1.6"/>
        ${c.state.quemado
          ? `<path d="M32 64 l8 8 m0 -8 l-8 8 M46 70 l8 -6" stroke="#8f97a4" stroke-width="1.8" fill="none"/>`
          : `<path d="M34 64 q8 12 16 0" fill="none" stroke="${lit ? '#b97f13' : '#c3cad4'}" stroke-width="1.8"/>`}
        <text x="42" y="104" font-size="9" fill="#5c6879" text-anchor="middle">${String(c.props.vn).replace('.', ',')} V · ${c.props.wn} W${st && lit ? ' · ' + fmtNum(r1(st.p * 10) / 10) + ' W' : ''}</text>`;
    }
  },

  fusiblelab: {
    nombre: 'Fusible de laboratorio', corto: 'Fusible',
    w: 96, h: 66, din: false, lab: true,
    terms: [
      { id: 'a', x: 14, y: 0, kind: 'X', lbl: '' },
      { id: 'b', x: 82, y: 0, kind: 'X', lbl: '' }
    ],
    props: () => ({ in: 1 }), state: () => ({ fundido: false }), act: 'tecla',
    onAct(c) { if (c.state.fundido) { c.state.fundido = false; toast('Fusible sustituido'); } else toast('El fusible está en buen estado'); },
    ficha: fichaTxt(`Hilo calibrado que <b>se funde</b> si la corriente supera su valor nominal, abriendo el circuito antes de que se queme otra cosa. Es el mismo principio de los fusibles de la CGP y de la CPM del simulador. Tócalo para sustituirlo.`),
    fichaExtra: c => `<div class="shRow"><label>Calibre</label>${chipProp(c, 'in', [0.5, 1, 2, 5], v => String(v).replace('.', ',') + ' A')}</div>`,
    draw(c) {
      const fu = c.state.fundido;
      return `
        <line x1="14" y1="0" x2="14" y2="30" stroke="#6b7684" stroke-width="2.4"/>
        <line x1="82" y1="0" x2="82" y2="30" stroke="#6b7684" stroke-width="2.4"/>
        <rect x="10" y="26" width="12" height="14" rx="2" fill="url(#gMetal)" stroke="#8b93a1"/>
        <rect x="74" y="26" width="12" height="14" rx="2" fill="url(#gMetal)" stroke="#8b93a1"/>
        <rect x="22" y="24" width="52" height="18" rx="6" fill="${fu ? '#5a4a45' : 'rgba(220,235,245,.7)'}" stroke="#9aa5b1"/>
        ${fu ? `<path d="M32 33 l10 0 m12 0 l10 0" stroke="#e5533d" stroke-width="2"/><g class="tripmark"><circle cx="84" cy="14" r="6.5" fill="#e5533d"/><text x="84" y="17" font-size="8.5" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>`
             : `<line x1="30" y1="33" x2="66" y2="33" stroke="#8a6d25" stroke-width="1.8"/>`}
        <text x="48" y="58" font-size="9.5" fill="#4a5261" text-anchor="middle" font-weight="700">${String(c.props.in).replace('.', ',')} A</text>
        <rect data-act="tecla" data-comp="${c.id}" x="8" y="20" width="80" height="26" fill="rgba(0,0,0,0)"/>`;
    }
  },

  amperimetro: {
    nombre: 'Amperímetro', corto: 'Amperímetro',
    w: 88, h: 96, din: false, lab: true,
    terms: [
      { id: 'a', x: 24, y: 0, kind: 'X', lbl: '' },
      { id: 'b', x: 64, y: 0, kind: 'X', lbl: '' }
    ],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Mide la <b>corriente</b> que lo atraviesa: se conecta <b>en serie</b>, intercalado en el circuito (su resistencia interna es casi nula). Conectarlo en paralelo con la pila equivale a un cortocircuito.`),
    draw(c, sim) {
      const i = sim && sim.lab && sim.amp ? sim.amp[c.id] : null;
      const txt = i == null ? '—' : (Math.abs(i) < 0.995 ? Math.round(Math.abs(i) * 1000) + ' mA' : fmtNum(r2(Math.abs(i))) + ' A');
      return `
        <line x1="24" y1="0" x2="24" y2="26" stroke="#6b7684" stroke-width="2.4"/>
        <line x1="64" y1="0" x2="64" y2="26" stroke="#6b7684" stroke-width="2.4"/>
        <circle cx="44" cy="56" r="30" fill="#fbfcfd" stroke="#c4cad3" stroke-width="2"/>
        <text x="44" y="50" font-size="13" fill="#4a5261" text-anchor="middle" font-weight="800">A</text>
        <rect x="22" y="56" width="44" height="16" rx="3" fill="#1c2430"/>
        <text x="44" y="68" font-size="9.5" fill="#7be2a4" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700">${txt}</text>`;
    }
  },

  voltimetro: {
    nombre: 'Voltímetro', corto: 'Voltímetro',
    w: 88, h: 96, din: false, lab: true,
    terms: [
      { id: 'a', x: 24, y: 0, kind: 'X', lbl: '' },
      { id: 'b', x: 64, y: 0, kind: 'X', lbl: '' }
    ],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Mide la <b>tensión</b> (diferencia de potencial) entre sus dos puntas: se conecta <b>en paralelo</b> con el elemento a medir. Su resistencia interna es enorme (1 MΩ), así que apenas roba corriente.`),
    draw(c, sim) {
      const v = sim && sim.lab && sim.volt ? sim.volt[c.id] : null;
      const txt = v == null ? '—' : fmtNum(r2(Math.abs(v))) + ' V';
      return `
        <line x1="24" y1="0" x2="24" y2="26" stroke="#6b7684" stroke-width="2.4"/>
        <line x1="64" y1="0" x2="64" y2="26" stroke="#6b7684" stroke-width="2.4"/>
        <circle cx="44" cy="56" r="30" fill="#fbfcfd" stroke="#c4cad3" stroke-width="2"/>
        <text x="44" y="50" font-size="13" fill="#4a5261" text-anchor="middle" font-weight="800">V</text>
        <rect x="22" y="56" width="44" height="16" rx="3" fill="#1c2430"/>
        <text x="44" y="68" font-size="9.5" fill="#8ecdf7" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700">${txt}</text>`;
    }
  }
});

const LAB_CATS = [
  { id: 'lab', n: 'Laboratorio', items: ['pila', 'bombilla', 'resistencia', 'int', 'puls', 'fusiblelab', 'amperimetro', 'voltimetro'] }
];

/* nominal de la bombilla: cambia V y W a la vez */
sheetBody.addEventListener('click', e => {
  const b = e.target.closest('[data-cb="bulbNom"]');
  if (!b || !sheetBody.dataset.comp) return;
  const c = byId(sheetBody.dataset.comp);
  if (!c || c.type !== 'bombilla') return;
  c.props.vn = Number(b.dataset.v); c.props.wn = Number(b.dataset.w);
  update(); showFicha(byId(c.id));
});

/* ==================================================================
   MOTOR REAL — análisis nodal
   ================================================================== */
function simulateLab() {
  const msgs = [];
  const res = { lab: true, msgs, lit: {}, tomas: {}, liveW: {}, circuits: [], sinRed: false, fault: null,
    volt: {}, amp: {}, bulb: {}, iPila: {} };
  let guard = 0;

  while (guard++ < 8) {
    /* nodos: cables + contactos cerrados unen bornes */
    const uf = new UF();
    for (const w of S.wires) uf.u(K(w.a.c, w.a.t), K(w.b.c, w.b.t));
    for (const c of S.comps) {
      if (c.type === 'int' && c.state.on) uf.u(K(c.id, 'p'), K(c.id, 's'));
      if (c.type === 'puls' && c.state.pressed) uf.u(K(c.id, 'p'), K(c.id, 's'));
    }
    const nodo = new Map();
    const nid = k => { const r = uf.f(k); if (!nodo.has(r)) nodo.set(r, nodo.size); return nodo.get(r); };

    const RINT = 0.3;
    const ramas = [];      // {c, a, b, R, kind}
    const pilas = [];      // {c, p, m, V}
    for (const c of S.comps) {
      const t = tt => nid(K(c.id, tt));
      if (c.type === 'pila') pilas.push({ c, p: t('p'), m: t('m'), V: c.props.v });
      else if (c.type === 'resistencia') ramas.push({ c, a: t('a'), b: t('b'), R: c.props.r, kind: 'r' });
      else if (c.type === 'bombilla' && !c.state.quemado) ramas.push({ c, a: t('a'), b: t('b'), R: c.props.vn * c.props.vn / c.props.wn, kind: 'bulb' });
      else if (c.type === 'fusiblelab' && !c.state.fundido) ramas.push({ c, a: t('a'), b: t('b'), R: 0.001, kind: 'fus' });
      else if (c.type === 'amperimetro') ramas.push({ c, a: t('a'), b: t('b'), R: 0.001, kind: 'amp' });
      else if (c.type === 'voltimetro') ramas.push({ c, a: t('a'), b: t('b'), R: 1e6, kind: 'volt' });
    }
    if (!pilas.length) {
      if (S.comps.some(c => defOf(c).lab)) msgs.push({ lvl: 'info', txt: 'Añade una pila para dar energía al circuito (y cierra el camino de + a −).' });
      break;
    }

    /* MNA con las pilas en equivalente Norton: G·v = i (masa = polo − de la 1ª pila) */
    const N = nodo.size;
    const gnd = pilas[0].m;
    const dim = N - 1;
    const ix = n => n < gnd ? n : n - 1;
    const G = Array.from({ length: dim }, () => new Array(dim).fill(0));
    const z = new Array(dim).fill(0);
    const stampG = (a, b, g) => {
      if (a !== gnd) G[ix(a)][ix(a)] += g;
      if (b !== gnd) G[ix(b)][ix(b)] += g;
      if (a !== gnd && b !== gnd) { G[ix(a)][ix(b)] -= g; G[ix(b)][ix(a)] -= g; }
    };
    const stampI = (a, b, i) => {           // corriente i entrando en a, saliendo por b
      if (a !== gnd) z[ix(a)] += i;
      if (b !== gnd) z[ix(b)] -= i;
    };
    for (const r of ramas) if (r.a !== r.b) stampG(r.a, r.b, 1 / r.R);
    for (const p of pilas) {
      if (p.p === p.m) continue;
      stampG(p.p, p.m, 1 / RINT);
      stampI(p.p, p.m, p.V / RINT);
    }

    /* eliminación gaussiana con pivote parcial; nodos aislados → 0 V */
    for (let col = 0; col < dim; col++) {
      let piv = col;
      for (let r2i = col + 1; r2i < dim; r2i++) if (Math.abs(G[r2i][col]) > Math.abs(G[piv][col])) piv = r2i;
      if (Math.abs(G[piv][col]) < 1e-12) { G[col][col] = 1; z[col] = 0; continue; }
      if (piv !== col) { [G[piv], G[col]] = [G[col], G[piv]]; [z[piv], z[col]] = [z[col], z[piv]]; }
      for (let r2i = col + 1; r2i < dim; r2i++) {
        const f = G[r2i][col] / G[col][col];
        if (!f) continue;
        for (let k2 = col; k2 < dim; k2++) G[r2i][k2] -= f * G[col][k2];
        z[r2i] -= f * z[col];
      }
    }
    const v = new Array(dim).fill(0);
    for (let r2i = dim - 1; r2i >= 0; r2i--) {
      let s = z[r2i];
      for (let k2 = r2i + 1; k2 < dim; k2++) s -= G[r2i][k2] * v[k2];
      v[r2i] = s / G[r2i][r2i];
    }
    const vn = n => n === gnd ? 0 : v[ix(n)];

    /* magnitudes por elemento + protecciones/daños (si algo cambia, resolver de nuevo) */
    let cambio = false;
    for (const r of ramas) {
      const dV = vn(r.a) - vn(r.b);
      const I = r.a === r.b ? 0 : dV / r.R;
      if (r.kind === 'amp') res.amp[r.c.id] = I;
      if (r.kind === 'volt') res.volt[r.c.id] = dV;
      if (r.kind === 'bulb') {
        const P = dV * dV / r.R;
        const b = clamp01(P / r.c.props.wn);
        res.bulb[r.c.id] = { p: P, b };
        res.lit[r.c.id] = P > 0.03 * r.c.props.wn;
        if (P > 1.6 * r.c.props.wn) {
          r.c.state.quemado = true; cambio = true;
          msgs.push({ lvl: 'err', txt: `Una bombilla de ${r.c.props.wn} W está recibiendo ${fmtNum(r1(P))} W (demasiada tensión para su valor nominal): se ha fundido. Sustitúyela desde su ficha.` });
        }
      }
      if (r.kind === 'fus' && Math.abs(I) > r.c.props.in) {
        r.c.state.fundido = true; cambio = true;
        msgs.push({ lvl: 'err', txt: `Por el fusible de ${String(r.c.props.in).replace('.', ',')} A pasaban ${fmtNum(r1(Math.abs(I)))} A: se ha fundido y ha abierto el circuito. Corrige la causa y sustitúyelo (tócalo).` });
      }
    }
    for (const p of pilas) {
      const dV = vn(p.p) - vn(p.m);
      const I = p.p === p.m ? p.V / RINT : (p.V - dV) / RINT;
      res.iPila[p.c.id] = I;
      if (I > 8.001) msgs.push({ lvl: 'err', txt: `La pila está entregando ${fmtNum(r1(I))} A: prácticamente un cortocircuito. Se calentará y agotará enseguida; revisa el circuito (o protege con un fusible).` });
      else if (I < -0.05) msgs.push({ lvl: 'warn', txt: 'Una pila está recibiendo corriente al revés (otra fuente la está cargando): revisa la polaridad.' });
    }
    if (cambio) {   // algo se ha fundido: limpiar medidas y resolver de nuevo
      res.lit = {}; res.volt = {}; res.amp = {}; res.bulb = {}; res.iPila = {};
      continue;
    }
    break;
  }

  /* pistas suaves */
  for (const c of S.comps.filter(c => c.type === 'bombilla')) {
    if (c.state.quemado && !msgs.some(m => m.txt.includes('fundido'))) msgs.push({ lvl: 'warn', txt: 'Hay una bombilla fundida: tócala y pulsa «Sustituir».' });
    else if (!res.lit[c.id] && !c.state.quemado && S.wires.some(w => w.a.c === c.id || w.b.c === c.id) && res.bulb[c.id] === undefined) {
      msgs.push({ lvl: 'info', txt: 'Hay una bombilla que no forma parte de un circuito cerrado: la corriente necesita un camino de + a − de la pila.' });
    }
  }
  const algoLuce = Object.values(res.lit).some(Boolean);
  if (algoLuce && !msgs.some(m => m.lvl === 'err')) msgs.unshift({ lvl: 'ok', txt: 'El circuito funciona.' });
  return res;
}

/* ---------- panel de resultados del laboratorio ---------- */
function renderLabResults() {
  const dot = $('#resDot'), txt = $('#resTxt');
  const errs = SIM.msgs.filter(m => m.lvl === 'err').length;
  const activo = Object.values(SIM.lit).some(Boolean);
  dot.className = errs ? 'err' : (activo ? 'ok' : 'off');
  txt.textContent = errs ? errs + (errs === 1 ? ' fallo' : ' fallos')
    : (activo ? 'El circuito funciona' : 'Laboratorio: monta un circuito');
  let h = '';
  const filas = [];
  for (const c of S.comps) {
    if (c.type === 'pila' && SIM.iPila[c.id] != null) filas.push(['Pila ' + String(c.props.v).replace('.', ',') + ' V', fmtNum(r2(SIM.iPila[c.id])) + ' A']);
    if (c.type === 'amperimetro') filas.push(['Amperímetro', SIM.amp[c.id] != null ? fmtNum(r2(Math.abs(SIM.amp[c.id]))) + ' A' : '—']);
    if (c.type === 'voltimetro') filas.push(['Voltímetro', SIM.volt[c.id] != null ? fmtNum(r2(Math.abs(SIM.volt[c.id]))) + ' V' : '—']);
    if (c.type === 'bombilla' && SIM.bulb[c.id]) filas.push(['Bombilla ' + c.props.wn + ' W', fmtNum(r1(SIM.bulb[c.id].p * 10) / 10) + ' W · brillo ' + Math.round(SIM.bulb[c.id].b * 100) + ' %']);
  }
  if (filas.length) {
    h += `<table class="ctable"><tr><th>Elemento</th><th>Medida</th></tr>` +
      filas.map(f => `<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td></tr>`).join('') + `</table>`;
  }
  if (!SIM.msgs.length) h += `<div class="msg info"><span class="mdot"></span><div>Monta un circuito: pila, cables y receptores. La corriente necesita un camino cerrado.</div></div>`;
  for (const m of SIM.msgs) h += `<div class="msg ${m.lvl}"><span class="mdot"></span><div>${esc(m.txt)}</div></div>`;
  $('#resBody').innerHTML = h;
}

/* ---------- entrar y salir del laboratorio ---------- */
function seedLab() {
  mkComp('pila', 220, 200, { v: 9 });
  mkComp('bombilla', 440, 200);
}
function toggleLab(on) {
  if (on === S.lab) { closeModal(); return; }
  try { store.set(S.lab ? 'rebt.lab' : 'rebt.autosave', serialize()); } catch (e) {}
  S.lab = on;
  const dump = store.get(on ? 'rebt.lab' : 'rebt.autosave');
  let cargado = false;
  if (dump) cargado = deserialize(dump);
  if (!cargado) {
    S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
    if (on) seedLab(); else seed();
  }
  S.lab = on;                    // deserialize no toca S.lab, pero por claridad
  S.palCat = on ? 'lab' : 'cuadro';
  document.body.classList.toggle('lab', on);
  $('#appTitle').textContent = on ? 'LAB' : 'REBT';
  closeModal(); closeSheet();
  aplicarModoVista(); buildPalette(); fitCamera(); update();
  toast(on ? 'Laboratorio de circuitos: corriente continua y medidas reales' : 'De vuelta al simulador REBT');
}

/* ==================================================================
   RETOS DEL LABORATORIO
   ================================================================== */
function labLit(id) { const s = simulateLab(); return !!s.lit[id]; }

RETOS.push(
  {
    id: 'rl1', t: 'La primera bombilla', modo: 'lab',
    desc: 'En el laboratorio: monta <b>pila → interruptor → bombilla</b> y de vuelta a la pila (la corriente necesita un <b>camino cerrado</b> de + a −). La bombilla debe quedar encendida y apagarse con el interruptor.',
    check() {
      const bulb = S.comps.find(c => c.type === 'bombilla' && SIM.lit[c.id]);
      if (!bulb) return 'La bombilla tiene que quedar encendida (revisa que el circuito esté cerrado).';
      const sw = S.comps.find(c => c.type === 'int' && c.state.on && withToggle(c, 'on', () => labLit(bulb.id)) === false);
      if (!sw) return 'Un interruptor en serie debe poder apagarla.';
      if (hayErrores()) return 'Quedan fallos en el panel: corrígelos.';
      return true;
    }
  },
  {
    id: 'rl2', t: 'Paralelo: brillo pleno', modo: 'lab',
    desc: 'Conecta <b>dos bombillas en paralelo</b> a la pila: cada una recibe la tensión completa y brilla fuerte. Ajusta pila y bombillas para que las dos brillen al <b>70 % o más</b> sin fundirse.',
    check() {
      const encendidas = S.comps.filter(c => c.type === 'bombilla' && SIM.bulb[c.id] && SIM.bulb[c.id].b >= 0.7);
      if (encendidas.length < 2) return 'Hacen falta dos bombillas brillando al 70 % o más (¿pila y nominal bien elegidas?).';
      if (S.comps.some(c => c.type === 'bombilla' && c.state.quemado)) return 'Se ha fundido alguna bombilla: sustitúyela y ajusta la tensión.';
      if (hayErrores()) return 'Quedan fallos en el panel: corrígelos.';
      return true;
    }
  },
  {
    id: 'rl3', t: 'Serie: se reparten la tensión', modo: 'lab',
    desc: 'Conecta <b>dos bombillas en serie</b>: la tensión de la pila se reparte y brillan menos. Consigue que las dos luzcan <b>entre el 10 % y el 60 %</b> de su brillo.',
    check() {
      const medias = S.comps.filter(c => c.type === 'bombilla' && SIM.bulb[c.id] && SIM.bulb[c.id].b >= 0.1 && SIM.bulb[c.id].b <= 0.6);
      if (medias.length < 2) return 'Busca dos bombillas encendidas a media luz (en serie con la pila adecuada).';
      if (hayErrores()) return 'Quedan fallos en el panel: corrígelos.';
      return true;
    }
  },
  {
    id: 'rl4', t: 'Ley de Ohm con el amperímetro', modo: 'lab',
    desc: 'Monta <b>pila de 9 V → amperímetro → resistencia de 100 Ω</b> en serie. El amperímetro debe marcar unos <b>90 mA</b> (I = V / R). Compruébalo también con otros valores.',
    check() {
      const amp = S.comps.find(c => c.type === 'amperimetro' && SIM.amp[c.id] != null && Math.abs(SIM.amp[c.id]) > 0.005);
      if (!amp) return 'El amperímetro debe quedar en serie, con corriente pasando por él.';
      const ok = S.comps.some(c => c.type === 'amperimetro' && SIM.amp[c.id] != null &&
        Math.abs(Math.abs(SIM.amp[c.id]) - 0.09) < 0.015);
      if (!ok) return 'Con 9 V y 100 Ω deben leerse ≈ 90 mA: revisa los valores.';
      if (hayErrores()) return 'Quedan fallos en el panel: corrígelos.';
      return true;
    }
  },
  {
    id: 'rl5', t: 'Divisor de tensión', modo: 'lab',
    desc: 'Dos <b>resistencias iguales en serie</b> sobre la pila y el <b>voltímetro en paralelo</b> con una de ellas: debe leer <b>la mitad</b> de la tensión de la pila (±10 %).',
    check() {
      const pila = S.comps.find(c => c.type === 'pila');
      if (!pila) return 'Falta la pila.';
      const okV = S.comps.some(c => c.type === 'voltimetro' && SIM.volt[c.id] != null &&
        Math.abs(Math.abs(SIM.volt[c.id]) - pila.props.v / 2) < pila.props.v * 0.1);
      if (!okV) return 'El voltímetro debe leer la mitad de la pila: dos resistencias IGUALES en serie y medir sobre una.';
      if (hayErrores()) return 'Quedan fallos en el panel: corrígelos.';
      return true;
    }
  },
  {
    id: 'rl6', t: 'El fusible salva el circuito', modo: 'lab',
    desc: 'Protege el circuito con un <b>fusible en serie</b> con la pila y provoca después un <b>cortocircuito</b> (un cable directo entre los bornes de la bombilla): el fusible debe fundirse y la bombilla quedar intacta.',
    check() {
      const fu = S.comps.find(c => c.type === 'fusiblelab' && c.state.fundido);
      if (!fu) return 'El fusible tiene que acabar fundido por el cortocircuito.';
      if (!S.comps.some(c => c.type === 'bombilla' && !c.state.quemado)) return 'La bombilla debe sobrevivir: el fusible ha de fundirse antes.';
      return true;
    }
  }
);
