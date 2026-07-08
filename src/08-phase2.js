/* ==================================================================
   FASE 2 — instalación de enlace, maniobras avanzadas,
   modo Reglamento (boletín) y modo Avería.
   Todo se registra sobre los ganchos del núcleo: DEFS.draw,
   DEFS.links, DEFS.onAct, DEFS.coil, DEFS.load, DEFS.fichaExtra.
   ================================================================== */

S.palCat = 'cuadro';
S.noche = S.noche || false;
S.averia = null;
S.esquema = S.esquema || null;

function armarTemporal(c, seg) {
  c.state.onUntil = Date.now() + seg * 1000;
  setTimeout(() => { if (byId(c.id)) update(); }, seg * 1000 + 120);
}

/* ---------- base de dibujo para módulos DIN de la Fase 2 ---------- */
function dinBase(c, label, sub, inner, multi) {
  const d = DEFS[c.type], w = d.w, h = d.h, cx = w / 2;
  if (multi) {
    let s = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="4" fill="#fff" stroke="#3a4352" stroke-width="1.4"/>`;
    for (const t of d.terms) s += `<line x1="${t.x}" y1="${t.y === 0 ? 0 : h}" x2="${t.x}" y2="${t.y === 0 ? 16 : h - 16}" stroke="#3a4352" stroke-width="2"/>`;
    s += inner;
    s += `<text x="${cx}" y="${h - 22}" font-size="8.5" fill="#242b36" text-anchor="middle" font-weight="700">${esc(label)}</text>`;
    if (sub) s += `<text x="${cx}" y="${h - 12}" font-size="7" fill="#6b7482" text-anchor="middle">${esc(sub)}</text>`;
    s += `<rect data-act="tecla" data-comp="${c.id}" x="4" y="20" width="${w - 8}" height="54" fill="rgba(0,0,0,0)"/>`;
    return s;
  }
  let s = `
  <rect x="2" y="9" width="${w - 4}" height="${h - 18}" rx="6" fill="#f2f3f5" stroke="#b4bac4" stroke-width="1.2"/>
  <rect x="5" y="13" width="${w - 10}" height="11" rx="2" fill="#d7dbe1"/>
  <rect x="5" y="${h - 24}" width="${w - 10}" height="11" rx="2" fill="#d7dbe1"/>`;
  for (const t of d.terms) s += `<circle cx="${t.x}" cy="${t.y === 0 ? 18.5 : h - 18.5}" r="3.4" fill="#9aa2ae" stroke="#7d8592"/>`;
  s += inner;
  s += `<text x="${cx}" y="${h - 27.5}" font-size="7.5" fill="#4a5261" text-anchor="middle" font-weight="700">${esc(label)}</text>`;
  if (sub) s += `<text x="${cx}" y="${h - 19}" font-size="6.5" fill="#7d8592" text-anchor="middle">${esc(sub)}</text>`;
  s += `<rect data-act="tecla" data-comp="${c.id}" x="4" y="24" width="${w - 8}" height="50" fill="rgba(0,0,0,0)"/>`;
  return s;
}

const chipProp = (c, k, items, fmt) => `<div class="chips">` + items.map(v =>
  `<button class="chip${String(c.props[k]) === String(v) ? ' act' : ''}" data-cb="prop" data-k="${k}" data-v="${v}">${fmt ? fmt(v) : v}</button>`).join('') + `</div>`;

/* ==================================================================
   NUEVOS COMPONENTES
   ================================================================== */
Object.assign(DEFS, {

  cgp: {
    nombre: 'CGP · Caja General de Protección', corto: 'CGP',
    w: 112, h: 96, din: false,
    terms: [
      { id: 'Li', x: 38, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 74, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 38, y: 96, kind: 'L', lbl: 'L' }, { id: 'No', x: 74, y: 96, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ fusible: 63 }), state: () => ({ fundido: false }), act: 'tecla',
    onAct(c) { if (c.state.fundido) { c.state.fundido = false; toast('Fusibles sustituidos'); } else toast('Los fusibles están en buen estado'); },
    links(c, o) { const l = [['Ni', 'No']]; if (o.allClosed || !c.state.fundido) l.push(['Li', 'Lo']); return l; },
    ficha: `Frontera entre la red de la compañía y tu instalación: aloja los <b>fusibles de seguridad</b> (aquí, de 63 A) que protegen la línea general. Si un cortocircuito no lo despeja nada aguas abajo, se funden y hay que <b>sustituirlos</b> (tócala). <span class="itc">ITC-BT-13</span>`,
    draw(c, sim, multi) {
      const fu = c.state.fundido;
      if (multi) {
        let s = `<rect x="6" y="10" width="100" height="76" rx="5" fill="#fff" stroke="#3a4352" stroke-width="1.4" stroke-dasharray="6 4"/>
        <line x1="38" y1="0" x2="38" y2="24" stroke="#3a4352" stroke-width="2"/>
        <rect x="32" y="24" width="12" height="34" fill="${fu ? '#f6d7d2' : '#fff'}" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2"/>
        <line x1="38" y1="24" x2="38" y2="58" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2" ${fu ? 'stroke-dasharray="3 4"' : ''}/>
        <line x1="38" y1="58" x2="38" y2="96" stroke="#3a4352" stroke-width="2"/>
        <line x1="74" y1="0" x2="74" y2="96" stroke="#3a4352" stroke-width="2"/>
        <text x="56" y="78" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">CGP</text>`;
        s += `<rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="96" height="70" fill="rgba(0,0,0,0)"/>`;
        return s;
      }
      let s = `
      <rect x="4" y="8" width="${112 - 8}" height="80" rx="8" fill="#4a5261" stroke="#333a46" stroke-width="1.6"/>
      <rect x="12" y="16" width="88" height="52" rx="5" fill="#5b6473"/>
      <rect x="26" y="24" width="16" height="36" rx="3" fill="${fu ? '#3a3f49' : '#c9cfd8'}" stroke="#2c313a"/>
      <rect x="70" y="24" width="16" height="36" rx="3" fill="#c9cfd8" stroke="#2c313a"/>
      <text x="34" y="46" font-size="8" fill="${fu ? '#e5533d' : '#4a5261'}" text-anchor="middle" font-weight="800">${fu ? '✕' : '63'}</text>
      <text x="78" y="46" font-size="8" fill="#4a5261" text-anchor="middle" font-weight="800">63</text>
      <text x="56" y="82" font-size="9" fill="#c9cfd8" text-anchor="middle" font-weight="700">CGP · FUSIBLES</text>`;
      if (fu) s += `<g class="tripmark"><circle cx="102" cy="14" r="7" fill="#e5533d"/><text x="102" y="17" font-size="9" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>`;
      s += `<rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="96" height="70" fill="rgba(0,0,0,0)"/>`;
      return s;
    }
  },

  contador: {
    nombre: 'Contador de energía', corto: 'Contador',
    w: 104, h: 104, din: false,
    terms: [
      { id: 'Li', x: 34, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 70, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 34, y: 104, kind: 'L', lbl: 'L' }, { id: 'No', x: 70, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({}), state: () => ({}),
    links: () => [['Li', 'Lo'], ['Ni', 'No']],
    ficha: `Mide la energía consumida (kWh). Va precintado por la compañía: tras la CGP en un suministro individual, o en la <b>centralización</b> (tras su fusible de seguridad) en un edificio. Su pantalla muestra la <b>potencia instantánea</b> que pasa por él. <span class="itc">ITC-BT-16</span>`,
    draw(c, sim, multi) {
      const p = sim ? (sim.pMedida && sim.pMedida[c.id] != null ? sim.pMedida[c.id] : sim.totalP) : 0;
      const kw = fmtNum(r2(p / 1000));
      if (multi) return `
        <line x1="34" y1="0" x2="34" y2="104" stroke="#3a4352" stroke-width="2"/>
        <line x1="70" y1="0" x2="70" y2="104" stroke="#3a4352" stroke-width="2"/>
        <rect x="14" y="30" width="76" height="44" fill="#fff" stroke="#3a4352" stroke-width="1.6"/>
        <text x="52" y="49" font-size="10" fill="#242b36" text-anchor="middle" font-weight="700">kWh</text>
        <text x="52" y="65" font-size="9" fill="#6b7482" text-anchor="middle">${kw} kW</text>`;
      return `
        <rect x="6" y="6" width="92" height="92" rx="9" fill="#e8eaee" stroke="#b4bac4" stroke-width="1.4"/>
        <rect x="16" y="18" width="72" height="26" rx="4" fill="#1c2430" stroke="#333a46"/>
        <text x="52" y="35" font-size="11" fill="#7be2a4" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700">${kw} kW</text>
        <circle cx="52" cy="68" r="15" fill="#f6f7f9" stroke="#b4bac4"/>
        <line x1="52" y1="68" x2="52" y2="56" stroke="#e5533d" stroke-width="2"/>
        <text x="52" y="95" font-size="8" fill="#6b7482" text-anchor="middle" font-weight="700">CONTADOR</text>`;
    }
  },

  icp: {
    nombre: 'ICP · Interruptor de Control de Potencia', corto: 'ICP',
    w: 56, h: 104, din: true,
    terms: [
      { id: 'Li', x: 17, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 39, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 17, y: 104, kind: 'L', lbl: 'L' }, { id: 'No', x: 39, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ calibre: 25 }), state: () => ({ on: false, trip: false }), act: 'palanca',
    links(c, o) { return (o.allClosed || (c.state.on && !c.state.trip)) ? [['Li', 'Lo'], ['Ni', 'No']] : []; },
    ficha: `Limita la instalación a la <b>potencia contratada</b>: si la demanda total supera su calibre, dispara. Se coloca entre el contador y el IGA. 25 A ≈ 5.750 W · 40 A ≈ 9.200 W. <span class="itc">ITC-BT-17</span>`,
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Calibre</label>${chipProp(c, 'calibre', [25, 32, 40], v => v + ' A')}</div>` : '',
    draw(c, sim, multi) {
      const lbl = 'ICP ' + c.props.calibre + ' A';
      return multi ? drawDINMulti(c, lbl, 'control potencia', false) : drawDINReal(c, lbl, 'control potencia', false);
    }
  },

  cruz: {
    nombre: 'Cruzamiento', corto: 'Cruzamiento',
    w: 76, h: 92, din: false,
    terms: [
      { id: 'l1', x: 22, y: 0, kind: 'X', lbl: 'L1' }, { id: 'l2', x: 54, y: 0, kind: 'X', lbl: 'L2' },
      { id: 'l3', x: 22, y: 92, kind: 'X', lbl: 'L1' }, { id: 'l4', x: 54, y: 92, kind: 'X', lbl: 'L2' }
    ],
    props: () => ({}), state: () => ({ pos: false }), act: 'tecla',
    onAct(c) { c.state.pos = !c.state.pos; },
    links(c, o) {
      if (o.allClosed) return [['l1', 'l3'], ['l2', 'l4'], ['l1', 'l4']];
      return c.state.pos ? [['l1', 'l4'], ['l2', 'l3']] : [['l1', 'l3'], ['l2', 'l4']];
    },
    ficha: `Permite mandar una lámpara desde <b>tres o más puntos</b>: se intercala entre los dos conmutadores y, según su posición, deja pasar los hilos <b>rectos o cruzados</b>. Montaje: conmutador → cruzamiento(s) → conmutador. <span class="itc">ITC-BT-19</span>`,
    draw(c, sim, multi) {
      const x = c.state.pos;
      if (multi) return `
        <line x1="22" y1="0" x2="22" y2="24" stroke="#3a4352" stroke-width="2"/><line x1="54" y1="0" x2="54" y2="24" stroke="#3a4352" stroke-width="2"/>
        <line x1="22" y1="68" x2="22" y2="92" stroke="#3a4352" stroke-width="2"/><line x1="54" y1="68" x2="54" y2="92" stroke="#3a4352" stroke-width="2"/>
        ${x ? `<line x1="22" y1="24" x2="54" y2="68" stroke="#2f9e57" stroke-width="2.4"/><line x1="54" y1="24" x2="22" y2="68" stroke="#2f9e57" stroke-width="2.4"/>`
            : `<line x1="22" y1="24" x2="22" y2="68" stroke="#2f9e57" stroke-width="2.4"/><line x1="54" y1="24" x2="54" y2="68" stroke="#2f9e57" stroke-width="2.4"/>`}
        <text x="38" y="84" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">cruce</text>
        <rect data-act="tecla" data-comp="${c.id}" x="10" y="8" width="56" height="60" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="5" y="8" width="66" height="78" rx="9" fill="#fbfcfd" stroke="#c4cad3"/>
        <rect x="19" y="21" width="38" height="52" rx="5" fill="#f1f3f6" stroke="#c4cad3"/>
        <rect x="19" y="${x ? 21 : 47}" width="38" height="26" rx="5" fill="#e2e6eb"/>
        <path d="M30 42 L46 52 M46 42 L30 52" stroke="#98a0ac" stroke-width="1.8"/>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="16" width="48" height="62" fill="rgba(0,0,0,0)"/>`;
    }
  },

  puls: {
    nombre: 'Pulsador', corto: 'Pulsador',
    w: 76, h: 92, din: false, momentary: true,
    terms: [{ id: 'p', x: 22, y: 0, kind: 'X', lbl: 'entrada' }, { id: 's', x: 54, y: 0, kind: 'X', lbl: 'salida' }],
    props: () => ({}), state: () => ({ pressed: false }), act: 'tecla',
    onAct(c) {   // desde la ficha: dar un pulso
      c.state.pressed = true; update();
      setTimeout(() => { const cc = byId(c.id); if (cc) { cc.state.pressed = false; update(); } }, 450);
    },
    links(c, o) { return (o.allClosed || c.state.pressed) ? [['p', 's']] : []; },
    ficha: `Contacto <b>momentáneo</b>: solo cierra mientras lo mantienes apretado. Se usa para el <b>timbre</b> y para dar impulsos al <b>telerruptor</b> o al <b>minutero</b>. Mantén el dedo sobre el botón para pulsarlo. <span class="itc">ITC-BT-19</span>`,
    draw(c, sim, multi) {
      const on = c.state.pressed;
      if (multi) return `
        <line x1="22" y1="0" x2="22" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="0" x2="54" y2="30" stroke="#3a4352" stroke-width="2"/>
        <circle cx="22" cy="33" r="3" fill="#3a4352"/><circle cx="54" cy="33" r="3" fill="#3a4352"/>
        ${on ? `<line x1="22" y1="33" x2="54" y2="33" stroke="#2f9e57" stroke-width="2.6"/>` : `<line x1="22" y1="25" x2="54" y2="25" stroke="#3a4352" stroke-width="2.4"/>`}
        <line x1="38" y1="${on ? 33 : 25}" x2="38" y2="14" stroke="#3a4352" stroke-width="2"/>
        <text x="38" y="58" font-size="9.5" fill="#242b36" text-anchor="middle" font-weight="700">pulsador</text>
        <rect data-act="tecla" data-comp="${c.id}" x="10" y="8" width="56" height="52" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="5" y="8" width="66" height="78" rx="9" fill="#fbfcfd" stroke="#c4cad3"/>
        <circle cx="38" cy="47" r="20" fill="#f1f3f6" stroke="#c4cad3"/>
        <circle cx="38" cy="47" r="${on ? 11 : 13}" fill="${on ? '#d3d8de' : '#e2e6eb'}" stroke="#aab2bd"/>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="16" width="48" height="62" fill="rgba(0,0,0,0)"/>`;
    }
  },

  tele: {
    nombre: 'Telerruptor', corto: 'Telerruptor',
    w: 56, h: 104, din: true, coil: true,
    terms: [
      { id: 'in', x: 17, y: 0, kind: 'X', lbl: '1' }, { id: 'A1', x: 39, y: 0, kind: 'X', lbl: 'A1' },
      { id: 'out', x: 17, y: 104, kind: 'X', lbl: '2' }, { id: 'A2', x: 39, y: 104, kind: 'X', lbl: 'A2' }
    ],
    props: () => ({}), state: () => ({ latch: false, exc: false }), act: 'tecla',
    onAct(c) { c.state.latch = !c.state.latch; },
    onPulse(c) { c.state.latch = !c.state.latch; },
    links(c, o) { return (o.allClosed || c.state.latch) ? [['in', 'out']] : []; },
    ficha: `Relé <b>biestable</b>: cada impulso que recibe su bobina (A1–A2, desde pulsadores) <b>cambia el estado</b> de su contacto (1–2). Ideal para mandar una luz desde muchos pulsadores en paralelo. Bobina entre fase (por los pulsadores) y neutro. <span class="itc">ITC-BT-19</span>`,
    draw(c, sim, multi) {
      const on = c.state.latch;
      const inner = multi
        ? `<circle cx="17" cy="30" r="2.6" fill="#3a4352"/>
           ${on ? `<line x1="17" y1="30" x2="17" y2="66" stroke="#2f9e57" stroke-width="2.4"/>` : `<line x1="17" y1="30" x2="27" y2="60" stroke="#3a4352" stroke-width="2.4"/>`}
           <rect x="33" y="38" width="12" height="20" fill="none" stroke="#2e6fd0" stroke-width="1.8"/>
           <line x1="39" y1="16" x2="39" y2="38" stroke="#2e6fd0" stroke-width="1.6"/>
           <line x1="39" y1="58" x2="39" y2="${104 - 16}" stroke="#2e6fd0" stroke-width="1.6"/>`
        : `<rect x="10" y="30" width="17" height="15" rx="2.5" fill="${on ? '#2f9e57' : '#8f97a4'}"/>
           <text x="18.5" y="41" font-size="8.5" fill="#fff" text-anchor="middle" font-weight="800">${on ? 'I' : '0'}</text>
           <path d="M33 30 h12 m-12 5 h12 m-12 5 h12 m-12 5 h12" stroke="#2e6fd0" stroke-width="1.6"/>
           <text x="39" y="58" font-size="6.5" fill="#7d8592" text-anchor="middle">A1·A2</text>`;
      return dinBase(c, 'TELERRUPTOR', on ? 'contacto cerrado' : 'contacto abierto', inner, multi);
    }
  },

  minut: {
    nombre: 'Minutero de escalera', corto: 'Minutero',
    w: 56, h: 104, din: true, coil: true,
    terms: [
      { id: 'in', x: 17, y: 0, kind: 'X', lbl: '1' }, { id: 'A1', x: 39, y: 0, kind: 'X', lbl: 'A1' },
      { id: 'out', x: 17, y: 104, kind: 'X', lbl: '2' }, { id: 'A2', x: 39, y: 104, kind: 'X', lbl: 'A2' }
    ],
    props: () => ({ seg: 10 }), state: () => ({ onUntil: 0, exc: false }), act: 'tecla',
    onAct(c) { if (Date.now() < c.state.onUntil) c.state.onUntil = 0; else armarTemporal(c, c.props.seg); },
    onPulse(c) { armarTemporal(c, c.props.seg); },
    links(c, o) { return (o.allClosed || Date.now() < c.state.onUntil) ? [['in', 'out']] : []; },
    ficha: `Temporizador de escalera: un impulso en su bobina (A1–A2, desde los pulsadores de cada planta) cierra el contacto durante un <b>tiempo ajustable</b> y luego apaga solo. Aquí está acortado a segundos para practicar. <span class="itc">ITC-BT-19</span>`,
    fichaExtra: c => `<div class="shRow"><label>Tiempo</label>
      <div class="stepper"><button data-cb="propStep" data-k="seg" data-v="-1" data-step="5" data-min="5" data-max="120">−</button><span>${c.props.seg} s</span><button data-cb="propStep" data-k="seg" data-v="1" data-step="5" data-min="5" data-max="120">+</button></div></div>`,
    draw(c, sim, multi) {
      const on = Date.now() < c.state.onUntil;
      const inner = multi
        ? `<circle cx="17" cy="44" r="10" fill="none" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
           <line x1="17" y1="44" x2="17" y2="36" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
           <line x1="17" y1="44" x2="23" y2="44" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
           <rect x="33" y="38" width="12" height="20" fill="none" stroke="#2e6fd0" stroke-width="1.8"/>`
        : `<circle cx="18" cy="38" r="9" fill="${on ? '#ffe9b3' : '#e2e6eb'}" stroke="#aab2bd"/>
           <line x1="18" y1="38" x2="18" y2="31.5" stroke="#4a5261" stroke-width="1.6"/>
           <line x1="18" y1="38" x2="23" y2="38" stroke="#4a5261" stroke-width="1.6"/>
           <path d="M33 30 h12 m-12 5 h12 m-12 5 h12 m-12 5 h12" stroke="#2e6fd0" stroke-width="1.6"/>
           <text x="28" y="60" font-size="7" fill="#7d8592" text-anchor="middle">${c.props.seg} s</text>`;
      return dinBase(c, 'MINUTERO', on ? 'temporizando…' : 'en reposo', inner, multi);
    }
  },

  presencia: {
    nombre: 'Detector de presencia', corto: 'Detector',
    w: 84, h: 96, din: false,
    terms: [{ id: 'in', x: 28, y: 0, kind: 'X', lbl: 'entrada' }, { id: 'out', x: 56, y: 0, kind: 'X', lbl: 'salida' }],
    props: () => ({ seg: 8 }), state: () => ({ onUntil: 0 }), act: 'tecla',
    onAct(c) { armarTemporal(c, c.props.seg); toast('Alguien pasa por delante del detector'); },
    links(c, o) { return (o.allClosed || Date.now() < c.state.onUntil) ? [['in', 'out']] : []; },
    ficha: `Sensor de movimiento (PIR): al detectar a alguien cierra el contacto durante un tiempo ajustable. Muy usado en portales, garajes y pasillos. <b>Tócalo para simular que pasa alguien.</b> <span class="itc">ITC-BT-19</span>`,
    fichaExtra: c => `<div class="shRow"><label>Tiempo</label>
      <div class="stepper"><button data-cb="propStep" data-k="seg" data-v="-1" data-step="4" data-min="4" data-max="60">−</button><span>${c.props.seg} s</span><button data-cb="propStep" data-k="seg" data-v="1" data-step="4" data-min="4" data-max="60">+</button></div></div>`,
    draw(c, sim, multi) {
      const on = Date.now() < c.state.onUntil;
      if (multi) return `
        <line x1="28" y1="0" x2="28" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="56" y1="0" x2="56" y2="30" stroke="#3a4352" stroke-width="2"/>
        <rect x="20" y="30" width="44" height="30" fill="#fff" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
        <path d="M32 52 a10 10 0 0 1 20 0 M36 52 a6 6 0 0 1 12 0" fill="none" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.6"/>
        <text x="42" y="76" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">detector</text>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="20" width="56" height="52" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="8" y="10" width="68" height="72" rx="12" fill="#fbfcfd" stroke="#c4cad3"/>
        ${on ? `<circle cx="42" cy="46" r="30" fill="url(#gGlow)"/>` : ''}
        <path d="M20 46 a22 22 0 0 1 44 0 z" fill="${on ? '#ffe9b3' : '#e9ecf0'}" stroke="#c4cad3"/>
        <path d="M28 46 a14 14 0 0 1 28 0" fill="none" stroke="#aab2bd" stroke-width="1.4"/>
        <circle cx="42" cy="42" r="3.5" fill="${on ? '#e07a30' : '#8f97a4'}"/>
        <text x="42" y="74" font-size="8" fill="#6b7482" text-anchor="middle" font-weight="700">PIR</text>
        <rect data-act="tecla" data-comp="${c.id}" x="12" y="14" width="60" height="64" fill="rgba(0,0,0,0)"/>`;
    }
  },

  crepus: {
    nombre: 'Interruptor crepuscular', corto: 'Crepuscular',
    w: 84, h: 96, din: false,
    terms: [{ id: 'in', x: 28, y: 0, kind: 'X', lbl: 'entrada' }, { id: 'out', x: 56, y: 0, kind: 'X', lbl: 'salida' }],
    props: () => ({}), state: () => ({}), act: 'tecla',
    onAct() { S.noche = !S.noche; toast(S.noche ? 'Se ha hecho de noche: los crepusculares cierran' : 'Ya es de día: los crepusculares abren'); },
    links(c, o) { return (o.allClosed || S.noche) ? [['in', 'out']] : []; },
    ficha: `Fotocélula: cierra el contacto cuando <b>oscurece</b> y lo abre de día. Típico en alumbrado exterior y rótulos. <b>Tócalo para cambiar entre día y noche</b> (afecta a todos los crepusculares del montaje). <span class="itc">ITC-BT-09</span> <span class="itc">ITC-BT-19</span>`,
    draw(c, sim, multi) {
      const noche = S.noche;
      if (multi) return `
        <line x1="28" y1="0" x2="28" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="56" y1="0" x2="56" y2="30" stroke="#3a4352" stroke-width="2"/>
        <rect x="20" y="30" width="44" height="30" fill="#fff" stroke="${noche ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
        ${noche
          ? `<path d="M46 38 a8 8 0 1 0 4 14 a10 10 0 0 1 -4 -14z" fill="#3a4352"/>`
          : `<circle cx="42" cy="45" r="6" fill="none" stroke="#3a4352" stroke-width="1.8"/><path d="M42 35v-3M42 58v-3M32 45h-3M55 45h-3" stroke="#3a4352" stroke-width="1.8"/>`}
        <text x="42" y="76" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">crepuscular</text>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="20" width="56" height="52" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="8" y="10" width="68" height="72" rx="10" fill="${noche ? '#2b3242' : '#fbfcfd'}" stroke="#c4cad3"/>
        ${noche
          ? `<path d="M48 30 a12 12 0 1 0 6 22 a15 15 0 0 1 -6 -22z" fill="#ffd66b"/><circle cx="30" cy="56" r="1.6" fill="#dfe6ee"/><circle cx="56" cy="62" r="1.3" fill="#dfe6ee"/><circle cx="24" cy="40" r="1.3" fill="#dfe6ee"/>`
          : `<circle cx="42" cy="42" r="10" fill="#f4b942"/><g stroke="#f4b942" stroke-width="2.4" stroke-linecap="round"><path d="M42 24v6M42 54v6M24 42h6M54 42h6M29 29l4 4M51 55l4 4M55 29l-4 4M33 55l-4 4"/></g>`}
        <text x="42" y="76" font-size="8" fill="${noche ? '#aebacb' : '#6b7482'}" text-anchor="middle" font-weight="700">${noche ? 'NOCHE' : 'DÍA'}</text>
        <rect data-act="tecla" data-comp="${c.id}" x="12" y="14" width="60" height="64" fill="rgba(0,0,0,0)"/>`;
    }
  },

  prog: {
    nombre: 'Programador horario', corto: 'Programador',
    w: 56, h: 104, din: true,
    terms: [{ id: 'in', x: 28, y: 0, kind: 'X', lbl: 'entrada' }, { id: 'out', x: 28, y: 104, kind: 'X', lbl: 'salida' }],
    props: () => ({}), state: () => ({ on: false }), act: 'tecla',
    onAct(c) { c.state.on = !c.state.on; toast(c.state.on ? 'El reloj ha llegado a una hora programada ON' : 'El reloj ha llegado a una hora programada OFF'); },
    links(c, o) { return (o.allClosed || c.state.on) ? [['in', 'out']] : []; },
    ficha: `Reloj programador de carril DIN: cierra y abre el contacto según las <b>horas programadas</b> (termos, riego, iluminación…). <b>Tócalo para simular que el reloj llega a la hora</b> de encendido o apagado. <span class="itc">ITC-BT-19</span>`,
    draw(c, sim, multi) {
      const on = c.state.on;
      const inner = multi
        ? `<circle cx="28" cy="44" r="12" fill="none" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
           <line x1="28" y1="44" x2="28" y2="35" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.8"/>
           <line x1="28" y1="44" x2="35" y2="47" stroke="${on ? '#2f9e57' : '#3a4352'}" stroke-width="1.6"/>`
        : `<circle cx="28" cy="42" r="12" fill="#e2e6eb" stroke="#aab2bd"/>
           <line x1="28" y1="42" x2="28" y2="33" stroke="#4a5261" stroke-width="1.8"/>
           <line x1="28" y1="42" x2="35" y2="45" stroke="#4a5261" stroke-width="1.6"/>
           <rect x="20" y="58" width="16" height="8" rx="2" fill="${on ? '#2f9e57' : '#8f97a4'}"/>
           <text x="28" y="64.5" font-size="6.5" fill="#fff" text-anchor="middle" font-weight="800">${on ? 'ON' : 'OFF'}</text>`;
      return dinBase(c, 'PROGRAMADOR', on ? 'contacto cerrado' : 'contacto abierto', inner, multi);
    }
  },

  timbre: {
    nombre: 'Timbre', corto: 'Timbre',
    w: 84, h: 96, din: false, load: true,
    terms: [{ id: 'L', x: 30, y: 0, kind: 'L', lbl: 'L' }, { id: 'N', x: 54, y: 0, kind: 'N', lbl: 'N' }],
    props: () => ({ potencia: 15, fp: 1 }), state: () => ({}),
    ficha: `Receptor acústico: suena mientras recibe tensión, por eso se maneja con un <b>pulsador</b> (no con un interruptor). Consume muy poco (≈15 W). <span class="itc">ITC-BT-25</span>`,
    draw(c, sim, multi) {
      const on = sim && sim.lit[c.id];
      if (multi) return `
        <line x1="30" y1="0" x2="30" y2="34" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="0" x2="54" y2="34" stroke="#3a4352" stroke-width="2"/>
        <path d="M26 34 a16 16 0 0 1 32 0 z" fill="${on ? '#ffe27a' : '#fff'}" stroke="#3a4352" stroke-width="1.8"/>
        <text x="42" y="74" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">timbre</text>`;
      return `
        ${on ? `<circle cx="42" cy="52" r="34" fill="url(#gGlow)"/>` : ''}
        <circle cx="42" cy="50" r="24" fill="${on ? '#e8b64c' : '#c9a44a'}" stroke="#96762b" stroke-width="2"/>
        <circle cx="42" cy="50" r="5" fill="#6e561c"/>
        ${on ? `<g stroke="#b97f13" stroke-width="2" fill="none">
          <path d="M12 40 a30 30 0 0 0 0 22"><animate attributeName="opacity" values="1;.2;1" dur=".5s" repeatCount="indefinite"/></path>
          <path d="M72 40 a30 30 0 0 1 0 22"><animate attributeName="opacity" values=".2;1;.2" dur=".5s" repeatCount="indefinite"/></path></g>` : ''}
        <line x1="42" y1="74" x2="50" y2="84" stroke="#6e561c" stroke-width="3" stroke-linecap="round"/>`;
    }
  },

  motor: {
    nombre: 'Motor genérico', corto: 'Motor',
    w: 84, h: 100, din: false, load: true,
    terms: [{ id: 'L', x: 30, y: 0, kind: 'L', lbl: 'L' }, { id: 'N', x: 54, y: 0, kind: 'N', lbl: 'N' }],
    props: () => ({ potencia: 750, fp: 0.85 }), state: () => ({}),
    ficha: `Receptor con motor (extractor, bomba, persiana…). Su factor de potencia es menor que 1 (aquí cos φ = 0,85), así que para la misma potencia demanda <b>más intensidad</b>: I = P / (V · cos φ). <span class="itc">ITC-BT-47</span>`,
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Potencia</label>${chipProp(c, 'potencia', [250, 750, 1500, 2200], v => v + ' W')}</div>` : '',
    draw(c, sim, multi) {
      const on = sim && sim.lit[c.id];
      if (multi) return `
        <line x1="30" y1="0" x2="30" y2="32" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="0" x2="54" y2="32" stroke="#3a4352" stroke-width="2"/>
        <circle cx="42" cy="52" r="18" fill="${on ? '#e6f4ea' : '#fff'}" stroke="#3a4352" stroke-width="1.8"/>
        <text x="42" y="57" font-size="13" fill="#3a4352" text-anchor="middle" font-weight="700">M</text>
        <text x="42" y="86" font-size="9" fill="#6b7482" text-anchor="middle">${c.props.potencia} W</text>`;
      return `
        <rect x="14" y="30" width="56" height="44" rx="8" fill="#8f97a4" stroke="#6d7480"/>
        <path d="M14 38 h56 M14 46 h56 M14 54 h56 M14 62 h56" stroke="#7c8490" stroke-width="2"/>
        <circle cx="42" cy="52" r="13" fill="#e2e6eb" stroke="#6d7480"/>
        <g ${on ? '' : 'opacity=".45"'}>
          <path d="M42 42 v20 M32 52 h20" stroke="#4a5261" stroke-width="3" stroke-linecap="round">
            ${on ? `<animateTransform attributeName="transform" type="rotate" from="0 42 52" to="360 42 52" dur="0.9s" repeatCount="indefinite"/>` : ''}
          </path>
        </g>
        <text x="42" y="90" font-size="8.5" fill="#4a5261" text-anchor="middle" font-weight="700">${c.props.potencia} W</text>`;
    }
  }
});

/* ==================================================================
   SUMINISTRO TRIFÁSICO, RECEPTOR TRIFÁSICO Y CPM
   ================================================================== */
Object.assign(DEFS, {

  cpm: {
    nombre: 'CPM · Caja de Protección y Medida', corto: 'CPM',
    w: 132, h: 110, din: false, unico: true,
    terms: [
      { id: 'Li', x: 44, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 88, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 44, y: 110, kind: 'L', lbl: 'L' }, { id: 'No', x: 88, y: 110, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ fusible: 63 }), state: () => ({ fundido: false }), act: 'tecla',
    onAct(c) { if (c.state.fundido) { c.state.fundido = false; toast('Fusibles de la CPM sustituidos'); } else toast('Los fusibles de la CPM están en buen estado'); },
    links(c, o) { const l = [['Ni', 'No']]; if (o.allClosed || !c.state.fundido) l.push(['Li', 'Lo']); return l; },
    ficha: fichaTxt(`Para <b>un solo usuario</b> (esquema 2.1 de la ITC-BT-12) no hay línea general de alimentación: los <b>fusibles de seguridad y el contador</b> comparten envolvente en el límite de la propiedad. De su salida parte la <b>derivación individual</b> (≥ 6 mm² · caída ≤ 1,5 %) hasta el ICP y el cuadro. <span class="itc">ITC-BT-12</span> <span class="itc">ITC-BT-13</span> <span class="itc">ITC-BT-15</span>`),
    draw(c, sim, multi) {
      const fu = c.state.fundido;
      const p = sim ? (sim.pMedida && sim.pMedida[c.id] != null ? sim.pMedida[c.id] : sim.totalP) : 0;
      const kw = fmtNum(r2(p / 1000));
      if (multi) {
        let s = `<rect x="6" y="10" width="120" height="90" rx="5" fill="#fff" stroke="#3a4352" stroke-width="1.4" stroke-dasharray="6 4"/>
        <line x1="44" y1="0" x2="44" y2="20" stroke="#3a4352" stroke-width="2"/>
        <rect x="38" y="20" width="12" height="26" fill="${fu ? '#f6d7d2' : '#fff'}" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2"/>
        <line x1="44" y1="20" x2="44" y2="46" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2" ${fu ? 'stroke-dasharray="3 4"' : ''}/>
        <line x1="44" y1="46" x2="44" y2="110" stroke="#3a4352" stroke-width="2"/>
        <line x1="88" y1="0" x2="88" y2="110" stroke="#3a4352" stroke-width="2"/>
        <circle cx="44" cy="66" r="12" fill="#fff" stroke="#3a4352" stroke-width="1.6"/>
        <text x="44" y="70" font-size="8" fill="#242b36" text-anchor="middle" font-weight="700">kWh</text>
        <text x="66" y="94" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">CPM</text>`;
        s += `<rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="116" height="84" fill="rgba(0,0,0,0)"/>`;
        return s;
      }
      let s = `
      <rect x="4" y="8" width="124" height="94" rx="8" fill="#4a5261" stroke="#333a46" stroke-width="1.6"/>
      <rect x="12" y="16" width="34" height="52" rx="5" fill="#5b6473"/>
      <rect x="20" y="24" width="16" height="36" rx="3" fill="${fu ? '#3a3f49' : '#c9cfd8'}" stroke="#2c313a"/>
      <text x="28" y="46" font-size="8" fill="${fu ? '#e5533d' : '#4a5261'}" text-anchor="middle" font-weight="800">${fu ? '✕' : c.props.fusible}</text>
      <rect x="54" y="16" width="66" height="30" rx="4" fill="#1c2430" stroke="#333a46"/>
      <text x="87" y="35" font-size="10" fill="#7be2a4" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700">${kw} kW</text>
      <circle cx="87" cy="60" r="9" fill="#f6f7f9" stroke="#b4bac4"/>
      <line x1="87" y1="60" x2="87" y2="53" stroke="#e5533d" stroke-width="1.8"/>
      <text x="66" y="96" font-size="9" fill="#c9cfd8" text-anchor="middle" font-weight="700">CPM · FUSIBLES + CONTADOR</text>`;
      if (fu) s += `<g class="tripmark"><circle cx="120" cy="14" r="7" fill="#e5533d"/><text x="120" y="17" font-size="9" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>`;
      s += `<rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="116" height="84" fill="rgba(0,0,0,0)"/>`;
      return s;
    }
  },

  red3: {
    nombre: 'Red trifásica 400/230 V', corto: 'Red 3~',
    w: 196, h: 62, din: false, unico: true,
    terms: [
      { id: 'L1', x: 40, y: 62, kind: 'L', lbl: 'L1' }, { id: 'L2', x: 80, y: 62, kind: 'L2', lbl: 'L2' },
      { id: 'L3', x: 120, y: 62, kind: 'L3', lbl: 'L3' }, { id: 'N', x: 160, y: 62, kind: 'N', lbl: 'N' }
    ],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Suministro trifásico de la compañía: <b>400 V entre fases</b> (L1·L2·L3) y <b>230 V entre cada fase y el neutro</b>. Es el habitual en edificios (la LGA siempre es trifásica) y en locales con motores. Un receptor de 230 V conectado entre dos fases <b>se quema</b>. <span class="itc">ITC-BT-10</span> <span class="itc">ITC-BT-06 a 17</span>`),
    draw(c, sim, multi) {
      const w = 196;
      if (multi) return `
        <circle cx="${w / 2}" cy="26" r="23" fill="#fff" stroke="#3a4352" stroke-width="1.6"/>
        <text x="${w / 2}" y="24" font-size="13" fill="#3a4352" text-anchor="middle" font-weight="700">3~</text>
        <text x="${w / 2}" y="38" font-size="9" fill="#3a4352" text-anchor="middle" font-weight="700">400 V</text>
        <line x1="40" y1="44" x2="40" y2="62" stroke="#3a4352" stroke-width="2"/>
        <line x1="80" y1="47" x2="80" y2="62" stroke="#3a4352" stroke-width="2"/>
        <line x1="120" y1="47" x2="120" y2="62" stroke="#3a4352" stroke-width="2"/>
        <line x1="160" y1="44" x2="160" y2="62" stroke="#3a4352" stroke-width="2"/>`;
      return `
        <rect x="2" y="2" width="${w - 4}" height="54" rx="9" fill="#232a35" stroke="#3c4553"/>
        <path d="M26 12 L18 30 h7 l-5 15 13 -19 h-7 l7 -14 z" fill="#f4b942"/>
        <path d="M44 12 L36 30 h7 l-5 15 13 -19 h-7 l7 -14 z" fill="#f4b942" opacity=".75"/>
        <path d="M62 12 L54 30 h7 l-5 15 13 -19 h-7 l7 -14 z" fill="#f4b942" opacity=".5"/>
        <text x="${w / 2 + 30}" y="27" font-size="12" fill="#eef2f7" text-anchor="middle" font-weight="700">RED 3~</text>
        <text x="${w / 2 + 30}" y="41" font-size="10" fill="#9fb0c5" text-anchor="middle">400 / 230 V</text>`;
    }
  },

  motor3: {
    nombre: 'Motor trifásico', corto: 'Motor 3~',
    w: 104, h: 104, din: false, load3: true,
    terms: [
      { id: 'L1', x: 20, y: 0, kind: 'L', lbl: 'L1' }, { id: 'L2', x: 44, y: 0, kind: 'L2', lbl: 'L2' },
      { id: 'L3', x: 68, y: 0, kind: 'L3', lbl: 'L3' }, { id: 'PE', x: 92, y: 0, kind: 'PE', lbl: 'PE' }
    ],
    props: () => ({ potencia: 2200, fp: 0.85 }), state: () => ({}),
    ficha: fichaTxt(`Motor de <b>400 V</b>: necesita las <b>tres fases</b> (y su carcasa a tierra). Reparte la carga entre fases y para la misma potencia demanda menos corriente que uno monofásico: I = P / (√3 · 400 · cos φ). Si le falta una fase no arranca (y en la realidad se quemaría por desequilibrio). <span class="itc">ITC-BT-47</span>`),
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Potencia</label>${chipProp(c, 'potencia', [1100, 2200, 4000, 7500], v => v + ' W')}</div>` : '',
    draw(c, sim, multi) {
      const on = sim && sim.lit[c.id];
      if (multi) return `
        <line x1="20" y1="0" x2="20" y2="34" stroke="#3a4352" stroke-width="2"/>
        <line x1="44" y1="0" x2="44" y2="34" stroke="#3a4352" stroke-width="2"/>
        <line x1="68" y1="0" x2="68" y2="34" stroke="#3a4352" stroke-width="2"/>
        <line x1="92" y1="0" x2="92" y2="46" stroke="#3f9b3f" stroke-width="2"/>
        <circle cx="44" cy="56" r="20" fill="${on ? '#e6f4ea' : '#fff'}" stroke="#3a4352" stroke-width="1.8"/>
        <text x="44" y="54" font-size="12" fill="#3a4352" text-anchor="middle" font-weight="700">M</text>
        <text x="44" y="66" font-size="9" fill="#3a4352" text-anchor="middle" font-weight="700">3~</text>
        <text x="44" y="92" font-size="9" fill="#6b7482" text-anchor="middle">${c.props.potencia} W</text>`;
      return `
        <rect x="10" y="30" width="68" height="46" rx="8" fill="#7a8496" stroke="#5d6573"/>
        <path d="M10 38 h68 M10 46 h68 M10 54 h68 M10 62 h68" stroke="#6a7383" stroke-width="2"/>
        <circle cx="44" cy="53" r="14" fill="#e2e6eb" stroke="#5d6573"/>
        <g ${on ? '' : 'opacity=".45"'}>
          <path d="M44 42 v22 M33 53 h22" stroke="#3f4754" stroke-width="3" stroke-linecap="round">
            ${on ? `<animateTransform attributeName="transform" type="rotate" from="0 44 53" to="360 44 53" dur="0.6s" repeatCount="indefinite"/>` : ''}
          </path>
        </g>
        <rect x="80" y="42" width="10" height="22" rx="2" fill="#5d6573"/>
        <text x="44" y="92" font-size="8.5" fill="#4a5261" text-anchor="middle" font-weight="700">MOTOR 3~ · ${c.props.potencia} W</text>`;
    }
  }
});

/* ==================================================================
   EDIFICIO — centralización de contadores (ITC-BT-12 esquema 2.2.1)
   ================================================================== */
const EMB_ROWS = [['a', 'L', 14, '#7a4a21'], ['b', 'L2', 38, '#2b2b2e'], ['c', 'L3', 62, '#8f959c'], ['n', 'N', 86, '#2e6fd0']];
const embTerms = [];
for (const [p, kind, y] of EMB_ROWS)
  for (let i = 1; i <= 5; i++) embTerms.push({ id: p + i, x: 16 + (i - 1) * 32, y, kind, lbl: '' });

Object.assign(DEFS, {

  cgp3: {
    nombre: 'CGP trifásica · Caja General de Protección', corto: 'CGP 3~',
    w: 156, h: 96, din: false, unico: true,
    terms: [
      { id: 'L1i', x: 30, y: 0, kind: 'L', lbl: 'L1' }, { id: 'L2i', x: 62, y: 0, kind: 'L2', lbl: 'L2' },
      { id: 'L3i', x: 94, y: 0, kind: 'L3', lbl: 'L3' }, { id: 'Ni', x: 126, y: 0, kind: 'N', lbl: 'N' },
      { id: 'L1o', x: 30, y: 96, kind: 'L', lbl: 'L1' }, { id: 'L2o', x: 62, y: 96, kind: 'L2', lbl: 'L2' },
      { id: 'L3o', x: 94, y: 96, kind: 'L3', lbl: 'L3' }, { id: 'No', x: 126, y: 96, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ fusible: 100 }), state: () => ({ fundido: false }), act: 'tecla',
    onAct(c) { if (c.state.fundido) { c.state.fundido = false; toast('Fusibles de la CGP sustituidos'); } else toast('Los fusibles de la CGP están en buen estado'); },
    links(c, o) {
      const l = [['Ni', 'No']];
      if (o.allClosed || !c.state.fundido) l.push(['L1i', 'L1o'], ['L2i', 'L2o'], ['L3i', 'L3o']);
      return l;
    },
    ficha: fichaTxt(`Frontera del edificio con la red: aloja un <b>fusible por fase</b> (el neutro es seccionable, sin fusible). De ella parte la <b>LGA</b> hacia la centralización de contadores. Si un corto no lo despeja nada aguas abajo, se funden y hay que sustituirlos (tócala). <span class="itc">ITC-BT-13</span>`),
    draw(c, sim, multi) {
      const fu = c.state.fundido;
      if (multi) {
        let s = `<rect x="6" y="10" width="144" height="76" rx="5" fill="#fff" stroke="#3a4352" stroke-width="1.4" stroke-dasharray="6 4"/>`;
        for (const x of [30, 62, 94]) {
          s += `<line x1="${x}" y1="0" x2="${x}" y2="24" stroke="#3a4352" stroke-width="2"/>
          <rect x="${x - 6}" y="24" width="12" height="30" fill="${fu ? '#f6d7d2' : '#fff'}" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2"/>
          <line x1="${x}" y1="24" x2="${x}" y2="54" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2" ${fu ? 'stroke-dasharray="3 4"' : ''}/>
          <line x1="${x}" y1="54" x2="${x}" y2="96" stroke="#3a4352" stroke-width="2"/>`;
        }
        s += `<line x1="126" y1="0" x2="126" y2="96" stroke="#3a4352" stroke-width="2"/>
        <text x="78" y="76" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">CGP 3~</text>
        <rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="140" height="70" fill="rgba(0,0,0,0)"/>`;
        return s;
      }
      let s = `
      <rect x="4" y="8" width="148" height="80" rx="8" fill="#4a5261" stroke="#333a46" stroke-width="1.6"/>
      <rect x="12" y="16" width="132" height="52" rx="5" fill="#5b6473"/>`;
      for (const x of [22, 56, 90]) {
        s += `<rect x="${x}" y="24" width="16" height="36" rx="3" fill="${fu ? '#3a3f49' : '#c9cfd8'}" stroke="#2c313a"/>
        <text x="${x + 8}" y="46" font-size="8" fill="${fu ? '#e5533d' : '#4a5261'}" text-anchor="middle" font-weight="800">${fu ? '✕' : c.props.fusible}</text>`;
      }
      s += `<rect x="124" y="24" width="12" height="36" rx="3" fill="#8f97a4" stroke="#2c313a"/>
      <text x="78" y="82" font-size="9" fill="#c9cfd8" text-anchor="middle" font-weight="700">CGP 3~ · FUSIBLES</text>`;
      if (fu) s += `<g class="tripmark"><circle cx="144" cy="14" r="7" fill="#e5533d"/><text x="144" y="17" font-size="9" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>`;
      s += `<rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="140" height="70" fill="rgba(0,0,0,0)"/>`;
      return s;
    }
  },

  igm: {
    nombre: 'IGM · Interruptor General de Maniobra', corto: 'IGM',
    w: 96, h: 104, din: false, unico: false,
    terms: [
      { id: 'L1i', x: 18, y: 0, kind: 'L', lbl: 'L1' }, { id: 'L2i', x: 38, y: 0, kind: 'L2', lbl: 'L2' },
      { id: 'L3i', x: 58, y: 0, kind: 'L3', lbl: 'L3' }, { id: 'Ni', x: 78, y: 0, kind: 'N', lbl: 'N' },
      { id: 'L1o', x: 18, y: 104, kind: 'L', lbl: 'L1' }, { id: 'L2o', x: 38, y: 104, kind: 'L2', lbl: 'L2' },
      { id: 'L3o', x: 58, y: 104, kind: 'L3', lbl: 'L3' }, { id: 'No', x: 78, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ calibre: 160 }), state: () => ({ on: false }), act: 'palanca',
    links(c, o) {
      return (o.allClosed || c.state.on)
        ? [['L1i', 'L1o'], ['L2i', 'L2o'], ['L3i', 'L3o'], ['Ni', 'No']] : [];
    },
    ficha: fichaTxt(`Cabecera de la <b>centralización de contadores</b>: interruptor de corte <b>manual</b> en carga (no es una protección, no dispara solo). Calibre mínimo <b>160 A</b> hasta 90 kW de previsión, 250 A hasta 150 kW. Tras él, el embarrado reparte a los fusibles de seguridad de cada usuario. <span class="itc">ITC-BT-16</span>`),
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Calibre</label>${chipProp(c, 'calibre', [160, 250], v => v + ' A')}</div>` : '',
    draw(c, sim, multi) {
      const on = c.state.on;
      if (multi) {
        let s = `<rect x="1" y="1" width="94" height="102" rx="4" fill="#fff" stroke="#3a4352" stroke-width="1.4"/>`;
        for (const x of [18, 38, 58, 78]) {
          s += `<line x1="${x}" y1="0" x2="${x}" y2="26" stroke="#3a4352" stroke-width="2"/>
                <line x1="${x}" y1="66" x2="${x}" y2="104" stroke="#3a4352" stroke-width="2"/>
                <circle cx="${x}" cy="28" r="2.6" fill="#3a4352"/>`;
          s += on ? `<line x1="${x}" y1="28" x2="${x}" y2="66" stroke="#2f9e57" stroke-width="2.4"/>`
                  : `<line x1="${x}" y1="28" x2="${x + 10}" y2="60" stroke="#3a4352" stroke-width="2.4"/>`;
        }
        s += `<line x1="18" y1="45" x2="78" y2="45" stroke="#8b93a1" stroke-width="1.4" stroke-dasharray="3 3"/>
        <text x="48" y="88" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">IGM ${c.props.calibre} A</text>
        <rect data-act="palanca" data-comp="${c.id}" x="6" y="22" width="84" height="50" fill="rgba(0,0,0,0)"/>`;
        return s;
      }
      const leverY = on ? 30 : 54;
      const s = `
      <rect x="2" y="9" width="92" height="86" rx="6" fill="#e9e4d8" stroke="#b8b0a0" stroke-width="1.2"/>
      <rect x="5" y="13" width="86" height="10" rx="2" fill="#d4cec0"/>
      <rect x="5" y="81" width="86" height="10" rx="2" fill="#d4cec0"/>
      <rect x="30" y="26" width="36" height="52" rx="4" fill="#dcd6c8" stroke="#b8b0a0"/>
      <rect class="lever" x="39" y="${leverY}" width="18" height="18" rx="3.5" fill="${on ? '#2f3540' : '#5a6270'}" stroke="#20252d"/>
      <text x="48" y="${on ? 74 : 38}" font-size="8" fill="#7a7261" text-anchor="middle" font-weight="700">${on ? 'I' : '0'}</text>
      <text x="48" y="92" font-size="8.5" fill="#5c5648" text-anchor="middle" font-weight="700">IGM ${c.props.calibre} A</text>
      <rect data-act="palanca" data-comp="${c.id}" x="24" y="22" width="48" height="58" fill="rgba(0,0,0,0)"/>`;
      return s;
    }
  },

  fusi: {
    nombre: 'Fusible de seguridad', corto: 'Fusible',
    w: 48, h: 88, din: false,
    terms: [
      { id: 'in', x: 24, y: 0, kind: 'L', lbl: '' },
      { id: 'out', x: 24, y: 88, kind: 'L', lbl: '' }
    ],
    props: () => ({ calibre: 63 }), state: () => ({ fundido: false }), act: 'tecla',
    onAct(c) { if (c.state.fundido) { c.state.fundido = false; toast('Fusible de seguridad sustituido'); } else toast('El fusible está en buen estado'); },
    links(c, o) { return (o.allClosed || !c.state.fundido) ? [['in', 'out']] : []; },
    ficha: fichaTxt(`Cada derivación individual arranca de su <b>fusible de seguridad</b> en la centralización (unidad funcional de protección): protege la DI y permite trabajar en el contador sin tensión. Se coloca en la <b>fase</b>, antes del contador. <span class="itc">ITC-BT-16</span>`),
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Calibre</label>${chipProp(c, 'calibre', [40, 63, 80], v => v + ' A')}</div>` : '',
    draw(c, sim, multi) {
      const fu = c.state.fundido;
      if (multi) return `
        <line x1="24" y1="0" x2="24" y2="22" stroke="#3a4352" stroke-width="2"/>
        <rect x="17" y="22" width="14" height="42" fill="${fu ? '#f6d7d2' : '#fff'}" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2"/>
        <line x1="24" y1="22" x2="24" y2="64" stroke="${fu ? '#e5533d' : '#3a4352'}" stroke-width="2" ${fu ? 'stroke-dasharray="3 4"' : ''}/>
        <line x1="24" y1="64" x2="24" y2="88" stroke="#3a4352" stroke-width="2"/>
        <text x="24" y="80" font-size="8" fill="#242b36" text-anchor="middle" font-weight="700">${c.props.calibre} A</text>
        <rect data-act="tecla" data-comp="${c.id}" x="8" y="16" width="32" height="54" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="14" y="14" width="20" height="10" rx="2" fill="url(#gMetal)" stroke="#8b93a1"/>
        <rect x="14" y="64" width="20" height="10" rx="2" fill="url(#gMetal)" stroke="#8b93a1"/>
        <rect x="16" y="24" width="16" height="40" rx="3" fill="${fu ? '#6d5a55' : '#d8cdb8'}" stroke="#9a8f78"/>
        <text x="24" y="47" font-size="8" fill="${fu ? '#ffb3a6' : '#6d6350'}" text-anchor="middle" font-weight="800">${fu ? '✕' : c.props.calibre}</text>
        ${fu ? `<g class="tripmark"><circle cx="40" cy="16" r="6.5" fill="#e5533d"/><text x="40" y="19" font-size="8.5" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>` : ''}
        <rect data-act="tecla" data-comp="${c.id}" x="8" y="12" width="32" height="64" fill="rgba(0,0,0,0)"/>`;
    }
  },

  embarrado: {
    nombre: 'Embarrado de la centralización', corto: 'Embarrado',
    w: 160, h: 96, din: false,
    terms: embTerms,
    props: () => ({}), state: () => ({}),
    links() {
      const l = [];
      for (const [p] of EMB_ROWS) for (let i = 1; i < 5; i++) l.push([p + i, p + (i + 1)]);
      return l;
    },
    ficha: fichaTxt(`Pletinas de la centralización: reparten <b>L1, L2, L3 y N</b> del IGM a las unidades funcionales (fusible + contador) de cada usuario. Reparte las viviendas <b>entre las tres fases</b> para equilibrar la red. Los bornes de cada barra están unidos entre sí. <span class="itc">ITC-BT-16</span>`),
    draw(c, sim, multi) {
      let s = multi ? '' : `<rect x="0" y="2" width="160" height="92" rx="6" fill="#f2f3f5" stroke="#c4cad3"/>`;
      for (const [p, kind, y, col] of EMB_ROWS) {
        s += `<rect x="6" y="${y - 4}" width="148" height="8" rx="3" fill="${col}" ${multi ? 'opacity=".85"' : ''}/>`;
      }
      return s;
    }
  },

  cvivienda: {
    nombre: 'Cuadro de vivienda (resumen)', corto: 'Vivienda',
    w: 120, h: 104, din: false, load: true,
    terms: [
      { id: 'L', x: 30, y: 0, kind: 'L', lbl: 'L' },
      { id: 'N', x: 60, y: 0, kind: 'N', lbl: 'N' },
      { id: 'PE', x: 90, y: 0, kind: 'PE', lbl: 'PE' }
    ],
    props: () => ({ potencia: 2300, fp: 1 }), state: () => ({ on: true }), act: 'tecla',
    onAct(c) { c.state.on = !c.state.on; },
    ficha: fichaTxt(`Representa una <b>vivienda completa</b> (su ICP, IGA, diferencial y circuitos, resumidos): consume la potencia ajustada cuando su interruptor general está subido. Su <b>derivación individual</b> debe traerle fase, neutro y <b>tierra</b>. Tócala para conectarla o desconectarla. <span class="itc">ITC-BT-15</span> <span class="itc">ITC-BT-26</span>`),
    fichaExtra: (c, inst) => inst ? `<div class="shRow"><label>Demanda</label>${chipProp(c, 'potencia', [575, 1150, 2300, 3450, 5750], v => v + ' W')}</div>` : '',
    draw(c, sim, multi) {
      const on = sim && sim.lit[c.id];
      const armado = c.state.on;
      if (multi) return `
        <line x1="30" y1="0" x2="30" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="60" y1="0" x2="60" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="90" y1="0" x2="90" y2="30" stroke="#3f9b3f" stroke-width="2"/>
        <rect x="16" y="30" width="88" height="52" fill="${on ? '#fff8e1' : '#fff'}" stroke="#3a4352" stroke-width="1.8"/>
        <text x="60" y="50" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">VIVIENDA</text>
        <text x="60" y="63" font-size="8" fill="#6b7482" text-anchor="middle">${armado ? c.props.potencia + ' W' : 'desconectada'}</text>
        <text x="60" y="75" font-size="7.5" fill="${on ? '#2f9e57' : '#6b7482'}" text-anchor="middle" font-weight="700">${on ? 'CON TENSIÓN' : 'sin tensión'}</text>
        <rect data-act="tecla" data-comp="${c.id}" x="18" y="32" width="84" height="48" fill="rgba(0,0,0,0)"/>`;
      return `
        <path d="M12 46 L60 16 L108 46 z" fill="#b06c3b" stroke="#8a5228"/>
        <rect x="20" y="46" width="80" height="52" rx="3" fill="#f2ede2" stroke="#c9c0ad"/>
        <rect x="30" y="56" width="18" height="16" rx="2" fill="${on ? '#ffe27a' : '#3d4552'}" stroke="#9a917d"/>
        <rect x="72" y="56" width="18" height="16" rx="2" fill="${on ? '#ffe27a' : '#3d4552'}" stroke="#9a917d"/>
        <rect x="52" y="70" width="16" height="28" rx="1.5" fill="#7c6a4f"/>
        <rect x="26" y="80" width="14" height="12" rx="2" fill="${armado ? '#2f9e57' : '#8f97a4'}"/>
        <text x="33" y="89" font-size="7.5" fill="#fff" text-anchor="middle" font-weight="800">${armado ? 'I' : '0'}</text>
        <text x="60" y="104" font-size="8.5" fill="#4a5261" text-anchor="middle" font-weight="700">${c.props.potencia} W</text>
        <rect data-act="tecla" data-comp="${c.id}" x="20" y="46" width="80" height="52" fill="rgba(0,0,0,0)"/>`;
    }
  }
});

/* ==================================================================
   PALETA POR CATEGORÍAS
   ================================================================== */
const PAL_CATS = [
  { id: 'cuadro', n: 'Cuadro y tierra', items: ['iga', 'dif', 'pia', 'borne', 'pica'] },
  { id: 'enlace', n: 'Enlace', items: ['red', 'red3', 'cpm', 'cgp', 'contador', 'icp'] },
  { id: 'edificio', n: 'Edificio', items: ['cgp3', 'igm', 'embarrado', 'fusi', 'contador', 'cvivienda'] },
  { id: 'maniobras', n: 'Maniobras', items: ['int', 'conm', 'cruz', 'puls', 'tele', 'minut', 'presencia', 'crepus', 'prog'] },
  { id: 'receptores', n: 'Receptores', items: ['luz', 'toma', 'timbre', 'motor', 'motor3'] }
];

/* ==================================================================
   BOLETÍN DE CONFORMIDAD (modo Reglamento)
   ================================================================== */
function ordenEnlaceOK() {
  const sup = getSupply();
  const cpm = S.comps.find(c => c.type === 'cpm');
  const cgp = S.comps.find(c => c.type === 'cgp');
  const cont = S.comps.find(c => c.type === 'contador');
  const icp = S.comps.find(c => c.type === 'icp');
  const iga = S.comps.find(c => c.type === 'iga');
  if (!sup || !icp) return false;
  const pot = buildUF({ allClosed: true });
  const potPhs = sup.phases.map(t => pot.f(K(sup.comp.id, t)));
  const fed = (tg, ti) => potPhs.includes(pot.f(K(tg.id, ti)));
  const cortaA = (quien, tg, ti) => {
    const t = buildUF({ allClosed: true, open: { [quien.id]: true } });
    const tPhs = sup.phases.map(p => t.f(K(sup.comp.id, p)));
    return !tPhs.includes(t.f(K(tg.id, ti)));
  };
  if (cpm) {
    /* esquema 2.1 (un solo usuario): acometida → CPM → ICP → IGA, sin LGA */
    if (cgp || cont) return false;
    return fed(cpm, 'Li') && fed(icp, 'Li') &&
      cortaA(cpm, icp, 'Li') && (!iga || cortaA(icp, iga, 'Li'));
  }
  if (!cgp || !cont) return false;
  return fed(cgp, 'Li') && fed(cont, 'Li') && fed(icp, 'Li') &&
    cortaA(cgp, cont, 'Li') && cortaA(cont, icp, 'Li') && (!iga || cortaA(icp, iga, 'Li'));
}

/* qué esquema de la ITC-BT-12 se deduce del montaje actual */
function esquemaDetectado() {
  const igms = S.comps.filter(c => c.type === 'igm').length;
  const conts = S.comps.filter(c => c.type === 'contador').length;
  if (S.comps.some(c => c.type === 'cpm')) return '2.1';
  if (igms >= 2) return '2.2.2';
  if (igms >= 1 && conts >= 2) return '2.2.1';
  if (conts >= 1) return '2.1';
  return null;
}

function esquemaModal() {
  const ops = [
    ['', 'Sin declarar', 'El boletín no comprobará el esquema'],
    ['2.1', '2.1 · Un solo usuario', 'CPM (fusibles + contador), sin LGA'],
    ['2.2.1', '2.2.1 · Centralización en un lugar', 'CGP → LGA → IGM + contadores → DI por vivienda'],
    ['2.2.2', '2.2.2 · Centralización en más de un lugar', 'Varias centralizaciones parciales (una por planta)']
  ];
  openModal(`<div class="mTitle">Esquema de enlace · ITC-BT-12</div>
    <div class="help"><p>Declara el esquema que estás ejecutando y el boletín comprobará que el montaje se corresponde. Detectado ahora: <b>${esquemaDetectado() || 'ninguno'}</b>.</p></div>` +
    ops.map(([v, t, d]) => `<button class="mItem" data-m="esquemaSel" data-id="${v}">
      <div>${t}<small>${d}</small></div>${(S.esquema || '') === v ? '<span class="din">✓</span>' : ''}</button>`).join(''));
}

function emitirBoletin() {
  update();
  const items = [];
  const add = (ok, txt, itc) => items.push({ ok, txt, itc });
  const pias = S.comps.filter(c => c.type === 'pia');
  const circs = SIM.circuits.filter(ci => ci.fed || ci.smin || ci.luces.length || ci.tomas.length);
  const tomas = S.comps.filter(c => c.type === 'toma');
  const difs = S.comps.filter(c => c.type === 'dif');

  add(pias.length > 0 && pias.every(p => p.props.circuito),
    'Circuitos identificados: cada PIA tiene asignado su circuito (C1–C5) en la ficha', 'ITC-BT-25');

  add(S.comps.some(c => c.type === 'pica') && S.comps.some(c => c.type === 'borne') &&
    tomas.length > 0 && tomas.every(t => SIM.tomas[t.id] && SIM.tomas[t.id].tierra),
    'Puesta a tierra: pica, borne principal y conductor de protección hasta todas las tomas', 'ITC-BT-18 · ITC-BT-26');

  add(difs.length > 0 && circs.every(ci => !ci.fed || ci.dif),
    'Interruptor diferencial de 30 mA protegiendo todos los circuitos', 'ITC-BT-24 · ITC-BT-25');

  add(difs.length > 0 && difs.every(d => SIM.circuits.filter(ci => ci.dif === d.id).length <= 5),
    'Máximo 5 circuitos por cada interruptor diferencial', 'ITC-BT-25');

  add(S.comps.some(c => c.type === 'iga') && SIM.igaOK,
    'IGA en cabecera, cortando toda la instalación interior', 'ITC-BT-17');

  add(circs.length > 0 && circs.every(ci => !ci.smin || ci.calibre <= (MAX_PIA_SECCION[String(ci.smin)] || 0)),
    'Cada PIA protege a su cable: calibre ≤ admisible por la sección (10 A·1,5 · 16 A·2,5 · 20 A·4 · 25 A·6)', 'ITC-BT-25 e ITC-BT-17');

  const asig = circs.filter(ci => ci.circuito);
  add(asig.length > 0 && asig.every(ci => {
    const t = TABLA_C[ci.circuito];
    return t && ci.smin && ci.smin >= t.sec && ci.calibre === t.pia;
  }), 'Sección y calibre según la tabla de la ITC-BT-25 en los circuitos asignados', 'ITC-BT-25');

  add(asig.every(ci => {
    const t = TABLA_C[ci.circuito];
    const n = ci.circuito === 'C1' ? ci.luces.length : ci.tomas.length;
    return t && n <= t.max;
  }), 'Número de puntos por circuito dentro del máximo (C1 ≤ 30 · C2 ≤ 20 · C5 ≤ 6)', 'ITC-BT-25');

  add(SIM.coloresMal === 0,
    'Colores normativos: fase marrón/negro/gris · neutro azul · protección verde-amarillo', 'ITC-BT-19');

  add(SIM.circuits.every(ci => ci.pct <= CAIDA_MAX),
    'Caída de tensión ≤ 3 % en todos los circuitos', 'ITC-BT-19');

  const averiado = S.comps.some(c => c.state && (c.state.trip || c.state.fundido));
  add(!SIM.fault && !averiado,
    'Sin cortocircuitos, derivaciones ni protecciones disparadas', 'ITC-BT-22 · ITC-BT-24');

  if (['cgp', 'contador', 'icp', 'cpm'].some(t => S.comps.some(c => c.type === t))) {
    const conCPM = S.comps.some(c => c.type === 'cpm');
    add(ordenEnlaceOK(),
      conCPM ? 'Instalación de enlace para un solo usuario: acometida → CPM → ICP → IGA (sin LGA)'
             : 'Instalación de enlace completa y en orden: acometida → CGP → contador → ICP → IGA', 'ITC-BT-12 a ITC-BT-17');
  }

  if (SIM.dis && SIM.dis.length) {
    add(SIM.dis.every(d => d.smin >= DI_SEC_MIN && d.pct <= d.lim),
      `Derivaciones individuales: sección ≥ ${DI_SEC_MIN} mm² y caída dentro de límite (1,5 % sin LGA · 1 % con centralización)`, 'ITC-BT-15');
  }

  if (SIM.lga) {
    add(SIM.lga.smin >= LGA_SEC_MIN && SIM.lga.pct <= SIM.lga.lim,
      `LGA: sección ≥ ${LGA_SEC_MIN} mm² y caída ≤ ${fmtNum(SIM.lga.lim)} % (actual: ${fmtSec(SIM.lga.smin)} mm² · ${fmtNum(SIM.lga.pct)} %)`, 'ITC-BT-14');
  }

  if (S.esquema) {
    const det = esquemaDetectado();
    add(det === S.esquema,
      `El montaje se corresponde con el esquema declarado ${S.esquema} (detectado: ${det || 'ninguno'})`, 'ITC-BT-12');
  }

  const conforme = items.every(i => i.ok);
  let h = `<div class="mTitle">Boletín de conformidad</div>
    <span class="bolBadge ${conforme ? 'si' : 'no'}">${conforme ? 'CONFORME' : 'NO CONFORME'}</span>`;
  for (const i of items) {
    h += `<div class="bolItem ${i.ok ? 'si' : 'no'}"><span class="bi">${i.ok ? '✓' : '✗'}</span>
      <div>${esc(i.txt)}<span class="itc">${esc(i.itc)}</span></div></div>`;
  }
  h += `<div style="height:10px"></div><button class="bigbtn sec" data-m="cerrar">Cerrar</button>`;
  openModal(h);
}
$('#resBody').addEventListener('click', e => {
  if (e.target.closest('[data-m="boletin"]')) emitirBoletin();
});

/* ==================================================================
   MODO AVERÍA
   ================================================================== */
function mkComp(type, x, y, props, state) {
  const c = {
    id: 'c' + (S.nextId++), type, x, y,
    props: Object.assign(DEFS[type].props(), props || {}),
    state: Object.assign(DEFS[type].state(), state || {})
  };
  S.comps.push(c);
  return c;
}
function mkWire(a, ta, b, tb, color, sec) {
  S.wires.push({ id: 'w' + (S.nextId++), a: { c: a.id, t: ta }, b: { c: b.id, t: tb }, color, sec: sec || 2.5, len: 5 });
}

/* vivienda correcta de referencia: C1 (luz + interruptor) y C2 (toma con tierra) */
function montarVivienda() {
  S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
  const red = mkComp('red', 334, 24);
  const iga = mkComp('iga', 80, DIN_Y, { calibre: 25 }, { on: true });
  const dif = mkComp('dif', 175, DIN_Y, {}, { on: true });
  const pia1 = mkComp('pia', 270, DIN_Y, { calibre: 10, circuito: 'C1' }, { on: true });
  const pia2 = mkComp('pia', 350, DIN_Y, { calibre: 16, circuito: 'C2' }, { on: true });
  const int1 = mkComp('int', 130, 560, null, { on: true });
  const luz = mkComp('luz', 330, 600);
  const toma = mkComp('toma', 560, 600, { carga: 1200 });
  const borne = mkComp('borne', 320, 880);
  const pica = mkComp('pica', 170, 950);
  mkWire(red, 'L', iga, 'Li', 'marron', 6); mkWire(red, 'N', iga, 'Ni', 'azul', 6);
  mkWire(iga, 'Lo', dif, 'Li', 'marron', 6); mkWire(iga, 'No', dif, 'Ni', 'azul', 6);
  mkWire(dif, 'Lo', pia1, 'Li', 'marron', 2.5); mkWire(dif, 'No', pia1, 'Ni', 'azul', 2.5);
  mkWire(dif, 'Lo', pia2, 'Li', 'marron', 2.5); mkWire(dif, 'No', pia2, 'Ni', 'azul', 2.5);
  mkWire(pia1, 'Lo', int1, 'p', 'marron', 1.5);
  mkWire(int1, 's', luz, 'L', 'negro', 1.5);
  mkWire(pia1, 'No', luz, 'N', 'azul', 1.5);
  mkWire(pia2, 'Lo', toma, 'L', 'marron', 2.5);
  mkWire(pia2, 'No', toma, 'N', 'azul', 2.5);
  mkWire(toma, 'PE', borne, 'p1', 'tierra', 2.5);
  mkWire(borne, 'p3', pica, 'PE', 'tierra', 2.5);
  return { red, iga, dif, pia1, pia2, int1, luz, toma, borne, pica };
}
/* chalet de referencia: esquema 2.1 (Red → CPM → DI → ICP → IGA → cuadro) */
function montarChalet() {
  S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
  const red = mkComp('red', 180, 24);
  const cpm = mkComp('cpm', 500, 16);
  const icp = mkComp('icp', 70, DIN_Y, { calibre: 25 }, { on: true });
  const iga = mkComp('iga', 150, DIN_Y, { calibre: 25 }, { on: true });
  const dif = mkComp('dif', 240, DIN_Y, {}, { on: true });
  const pia1 = mkComp('pia', 335, DIN_Y, { calibre: 10, circuito: 'C1' }, { on: true });
  const pia2 = mkComp('pia', 410, DIN_Y, { calibre: 16, circuito: 'C2' }, { on: true });
  const int1 = mkComp('int', 130, 560, null, { on: true });
  const luz = mkComp('luz', 330, 600);
  const toma = mkComp('toma', 560, 600, { carga: 1200 });
  const borne = mkComp('borne', 320, 880);
  const pica = mkComp('pica', 170, 950);
  mkWire(red, 'L', cpm, 'Li', 'marron', 16); mkWire(red, 'N', cpm, 'Ni', 'azul', 16);
  mkWire(cpm, 'Lo', icp, 'Li', 'marron', 10); mkWire(cpm, 'No', icp, 'Ni', 'azul', 10);
  const diF = S.wires[S.wires.length - 2], diN = S.wires[S.wires.length - 1];
  mkWire(icp, 'Lo', iga, 'Li', 'marron', 10); mkWire(icp, 'No', iga, 'Ni', 'azul', 10);
  mkWire(iga, 'Lo', dif, 'Li', 'marron', 6); mkWire(iga, 'No', dif, 'Ni', 'azul', 6);
  mkWire(dif, 'Lo', pia1, 'Li', 'marron', 2.5); mkWire(dif, 'No', pia1, 'Ni', 'azul', 2.5);
  mkWire(dif, 'Lo', pia2, 'Li', 'marron', 2.5); mkWire(dif, 'No', pia2, 'Ni', 'azul', 2.5);
  mkWire(pia1, 'Lo', int1, 'p', 'marron', 1.5);
  mkWire(int1, 's', luz, 'L', 'negro', 1.5);
  mkWire(pia1, 'No', luz, 'N', 'azul', 1.5);
  mkWire(pia2, 'Lo', toma, 'L', 'marron', 2.5);
  mkWire(pia2, 'No', toma, 'N', 'azul', 2.5);
  mkWire(toma, 'PE', borne, 'p1', 'tierra', 2.5);
  mkWire(borne, 'p3', pica, 'PE', 'tierra', 2.5);
  return { red, cpm, icp, iga, dif, pia1, pia2, int1, luz, toma, borne, pica, diF, diN };
}

/* edificio de referencia: esquema 2.2.1 con 3 viviendas repartidas por fases */
function montarEdificio() {
  S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
  const red = mkComp('red3', 290, 8);
  const cgp = mkComp('cgp3', 70, 130);
  const igm = mkComp('igm', 90, 300, null, { on: true });
  const emb = mkComp('embarrado', 300, 304);
  const fusis = [], conts = [], vivs = [];
  const fases = [['a', 'marron'], ['b', 'negro'], ['c', 'gris']];
  for (let k = 0; k < 3; k++) {
    const bx = 100 + k * 230;
    const fu = mkComp('fusi', bx + 30, 470);
    const co = mkComp('contador', bx, 580);
    const vi = mkComp('cvivienda', bx, 740);
    fusis.push(fu); conts.push(co); vivs.push(vi);
  }
  const borne = mkComp('borne', 330, 920);
  const pica = mkComp('pica', 160, 960);
  /* acometida */
  mkWire(red, 'L1', cgp, 'L1i', 'marron', 25); mkWire(red, 'L2', cgp, 'L2i', 'negro', 25);
  mkWire(red, 'L3', cgp, 'L3i', 'gris', 25); mkWire(red, 'N', cgp, 'Ni', 'azul', 25);
  /* LGA */
  mkWire(cgp, 'L1o', igm, 'L1i', 'marron', 16); mkWire(cgp, 'L2o', igm, 'L2i', 'negro', 16);
  mkWire(cgp, 'L3o', igm, 'L3i', 'gris', 16); mkWire(cgp, 'No', igm, 'Ni', 'azul', 16);
  /* IGM → embarrado */
  mkWire(igm, 'L1o', emb, 'a1', 'marron', 16); mkWire(igm, 'L2o', emb, 'b1', 'negro', 16);
  mkWire(igm, 'L3o', emb, 'c1', 'gris', 16); mkWire(igm, 'No', emb, 'n1', 'azul', 16);
  /* unidades funcionales + DI, una fase por vivienda */
  for (let k = 0; k < 3; k++) {
    const [fila, color] = fases[k];
    mkWire(emb, fila + (k + 2), fusis[k], 'in', color, 10);
    mkWire(fusis[k], 'out', conts[k], 'Li', color, 10);
    mkWire(emb, 'n' + (k + 2), conts[k], 'Ni', 'azul', 10);
    mkWire(conts[k], 'Lo', vivs[k], 'L', color, 10);
    mkWire(conts[k], 'No', vivs[k], 'N', 'azul', 10);
    mkWire(vivs[k], 'PE', borne, 'p' + (k + 1), 'tierra', 10);
  }
  mkWire(borne, 'p5', pica, 'PE', 'tierra', 16);
  return { red, cgp, igm, emb, fusis, conts, vivs, borne, pica };
}

/* edificio por plantas: esquema 2.2.2 con dos centralizaciones de 2 viviendas */
function montarEdificio2() {
  S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
  const red = mkComp('red3', 290, 8);
  const cgp = mkComp('cgp3', 70, 130);
  const borne = mkComp('borne', 330, 930);
  const pica = mkComp('pica', 160, 980);
  const igms = [], embs = [], fusis = [], conts = [], vivs = [];
  /* acometida */
  mkWire(red, 'L1', cgp, 'L1i', 'marron', 25); mkWire(red, 'L2', cgp, 'L2i', 'negro', 25);
  mkWire(red, 'L3', cgp, 'L3i', 'gris', 25); mkWire(red, 'N', cgp, 'Ni', 'azul', 25);
  /* fase de cada vivienda: A1→L1, A2→L2, B1→L3, B2→L1 */
  const fases = [['a', 'marron'], ['b', 'negro'], ['c', 'gris'], ['a', 'marron']];
  for (let c = 0; c < 2; c++) {
    const cx = 20 + c * 400;
    const igm = mkComp('igm', cx + 10, 290, null, { on: true });
    const emb = mkComp('embarrado', cx + 130, 294);
    igms.push(igm); embs.push(emb);
    /* LGA: tronco común + rama a cada centralización */
    mkWire(cgp, 'L1o', igm, 'L1i', 'marron', 16); mkWire(cgp, 'L2o', igm, 'L2i', 'negro', 16);
    mkWire(cgp, 'L3o', igm, 'L3i', 'gris', 16); mkWire(cgp, 'No', igm, 'Ni', 'azul', 16);
    mkWire(igm, 'L1o', emb, 'a1', 'marron', 16); mkWire(igm, 'L2o', emb, 'b1', 'negro', 16);
    mkWire(igm, 'L3o', emb, 'c1', 'gris', 16); mkWire(igm, 'No', emb, 'n1', 'azul', 16);
    for (let k = 0; k < 2; k++) {
      const idx = c * 2 + k;
      const [fila, color] = fases[idx];
      const bx = cx + 20 + k * 190;
      const fu = mkComp('fusi', bx + 40, 450);
      const co = mkComp('contador', bx, 560);
      const vi = mkComp('cvivienda', bx, 720);
      fusis.push(fu); conts.push(co); vivs.push(vi);
      mkWire(emb, fila + (k + 2), fu, 'in', color, 10);
      mkWire(fu, 'out', co, 'Li', color, 10);
      mkWire(emb, 'n' + (k + 2), co, 'Ni', 'azul', 10);
      mkWire(co, 'Lo', vi, 'L', color, 10);
      mkWire(co, 'No', vi, 'N', 'azul', 10);
      mkWire(vi, 'PE', borne, 'p' + (idx + 1), 'tierra', 10);
    }
  }
  mkWire(borne, 'p5', pica, 'PE', 'tierra', 16);
  S.esquema = '2.2.2';
  return { red, cgp, igms, embs, fusis, conts, vivs, borne, pica };
}

function quitarCable(compId, term) {
  S.wires = S.wires.filter(w => !((w.a.c === compId && w.a.t === term) || (w.b.c === compId && w.b.t === term)));
}
function luzOK() {
  const ev = pureEval();
  const luz = S.comps.find(c => c.type === 'luz' && ev.lit[c.id]);
  if (!luz) return 'La luz sigue sin poder encenderse: enciéndela para comprobar.';
  return true;
}
function tomaOK() {
  const t = S.comps.find(c => c.type === 'toma');
  if (!t || !SIM.tomas[t.id] || !SIM.tomas[t.id].tension || !SIM.tomas[t.id].tierra) return 'La toma debe quedar con tensión y con su tierra.';
  return true;
}

const AVERIAS = [
  {
    id: 'a1', t: 'El calambrazo',
    s: 'El cliente cambió una bombilla con el interruptor apagado… y recibió un calambrazo. Por lo demás, todo «funciona».',
    build() {
      const m = montarVivienda();
      quitarCable(m.int1.id, 'p'); quitarCable(m.int1.id, 's'); quitarCable(m.luz.id, 'L'); quitarCable(m.luz.id, 'N');
      mkWire(m.pia1, 'Lo', m.luz, 'L', 'marron', 1.5);          // fase directa a la lámpara
      mkWire(m.pia1, 'No', m.int1, 'p', 'azul', 1.5);           // ¡el interruptor corta el neutro!
      mkWire(m.int1, 's', m.luz, 'N', 'azul', 1.5);
    },
    check() {
      const l = luzOK(); if (l !== true) return l;
      if (hayErrores()) return 'Sigue habiendo un defecto en el montaje: fíjate en qué conductor corta el interruptor.';
      return true;
    }
  },
  {
    id: 'a2', t: 'La luz no enciende',
    s: 'La lámpara del salón no enciende, aunque las protecciones están armadas y el resto de la casa tiene corriente.',
    build() { const m = montarVivienda(); quitarCable(m.luz.id, 'N'); },
    check() { const l = luzOK(); if (l !== true) return l; if (hayErrores()) return 'Aún hay algo mal en ese circuito.'; return true; }
  },
  {
    id: 'a3', t: 'La conmutada rebelde',
    s: 'En el pasillo, la luz solo obedece a uno de los dos conmutadores, y según cómo esté el otro, ni eso.',
    build() {
      const m = montarVivienda();
      quitarCable(m.int1.id, 'p'); quitarCable(m.int1.id, 's');
      S.comps = S.comps.filter(c => c.id !== m.int1.id);
      quitarCable(m.luz.id, 'L');
      const c1 = mkComp('conm', 110, 560);
      const c2 = mkComp('conm', 220, 560);
      mkWire(m.pia1, 'Lo', c1, 'c', 'marron', 1.5);
      mkWire(c1, 'l1', c2, 'l1', 'negro', 1.5);
      mkWire(c1, 'l2', c2, 'l2', 'negro', 1.5);
      mkWire(c2, 'l1', m.luz, 'L', 'negro', 1.5);   // ERROR: la vuelta sale de L1, no del común
    },
    check() {
      const conms = S.comps.filter(c => c.type === 'conm');
      const luz = S.comps.find(c => c.type === 'luz');
      if (conms.length < 2 || !luz) return 'Mantén los dos conmutadores y la lámpara.';
      if (!patronConmutada(luz, conms[0], conms[1])) return 'La conmutación todavía no funciona desde los dos puntos: revisa común, L1 y L2.';
      if (!pureEval().lit[luz.id]) return 'La conmutación ya es correcta: deja la luz encendida para cerrar el parte.';
      if (hayErrores()) return 'Queda algún defecto más en la instalación.';
      return true;
    }
  },
  {
    id: 'a4', t: 'La toma sospechosa',
    s: 'El comprobador de enchufes marca «fallo de tierra» en la toma del salón. El aparato conectado funciona, pero no es seguro.',
    build() { const m = montarVivienda(); quitarCable(m.toma.id, 'PE'); },
    check() { const t = tomaOK(); if (t !== true) return t; if (hayErrores()) return 'Sigue habiendo un defecto: repasa el conductor de protección.'; return true; }
  },
  {
    id: 'a5', t: 'Huele a quemado', modo: 'instalador',
    s: 'El cliente nota olor a plástico caliente cerca de la regleta de la lavadora cuando funciona un rato. Nunca salta nada.',
    build() {
      const m = montarVivienda();
      m.pia2.props.calibre = 32;      // un PIA de 32 A no protege el cable de 2,5 mm²
      m.pia2.props.circuito = '';
      m.toma.props.carga = 2200;
    },
    check() {
      const t = tomaOK(); if (t !== true) return t;
      if (hayErrores()) return 'El defecto sigue: piensa qué protege el PIA (¿el aparato o el cable?).';
      return true;
    }
  },
  {
    id: 'a6', t: 'El chalet a media luz', modo: 'instalador',
    s: 'En un chalet con CPM, al enchufar cargas grandes las luces pierden brillo y el tramo que va de la CPM al cuadro se calienta. El proyecto decía «DI de 6 mm²», pero algo no cuadra.',
    build() {
      const m = montarChalet();
      m.diF.sec = 1.5; m.diN.sec = 1.5; m.diF.len = 25; m.diN.len = 25;   // DI mal ejecutada
      m.toma.props.carga = 3500;
    },
    check() {
      const t = tomaOK(); if (t !== true) return t;
      const l = luzOK(); if (l !== true) return l;
      if (hayErrores()) return 'El defecto sigue en el tramo de enlace: mide la sección de la derivación individual.';
      return true;
    }
  },
  {
    id: 'a7', t: 'El segundo, sin luz',
    s: 'En un edificio de tres viviendas, la del medio se ha quedado completamente sin suministro. Las otras dos funcionan, y el vecino jura que su cuadro está intacto. Busca en las zonas comunes.',
    build() { const m = montarEdificio(); m.fusis[1].state.fundido = true; },
    check() {
      const vivs = S.comps.filter(c => c.type === 'cvivienda');
      const ev = pureEval();
      if (!vivs.length || !vivs.every(v => ev.lit[v.id])) return 'Alguna vivienda sigue sin tensión: repasa su camino desde el embarrado.';
      if (hayErrores()) return 'Queda algún defecto en la instalación.';
      return true;
    }
  }
];

function averiasDone() { try { return JSON.parse(store.get('rebt.averias') || '{}') || {}; } catch (e) { return {}; } }
function averiasGenDone() { try { return JSON.parse(store.get('rebt.averiasGen') || '{}') || {}; } catch (e) { return {}; } }

/* ==================================================================
   AVERÍAS GENERATIVAS — fallos aleatorios con niveles de dificultad
   ================================================================== */
const rndDe = a => a[Math.floor(Math.random() * a.length)];

/* mutadores: aplican un fallo al montaje actual y devuelven el síntoma
   que contaría el cliente (o null si no son aplicables aquí) */
const AVERIA_MUTS = [
  { id: 'cable', min: 1, f() {
    const cands = S.wires.filter(w => [w.a, w.b].some(e => {
      const c = byId(e.c);
      return c && ['luz', 'toma', 'cvivienda', 'timbre', 'motor'].includes(c.type) && e.t !== 'PE';
    }));
    if (!cands.length) return null;
    S.wires = S.wires.filter(x => x.id !== rndDe(cands).id);
    return 'Un punto de la instalación se ha quedado sin servicio, sin que salte ninguna protección.';
  } },
  { id: 'tierra', min: 1, f() {
    const cands = S.wires.filter(w => [w.a, w.b].some(e => {
      const c = byId(e.c);
      return c && ['toma', 'cvivienda', 'motor3'].includes(c.type) && e.t === 'PE';
    }));
    if (!cands.length) return null;
    S.wires = S.wires.filter(x => x.id !== rndDe(cands).id);
    return 'El comprobador de enchufes marca «fallo de tierra» en algún punto.';
  } },
  { id: 'fusible', min: 1, f() {
    const cands = S.comps.filter(c => ['fusi', 'cgp', 'cpm', 'cgp3'].includes(c.type) && !c.state.fundido);
    if (!cands.length) return null;
    rndDe(cands).state.fundido = true;
    return 'Una zona entera está completamente muerta y nadie ha tocado ningún cuadro.';
  } },
  { id: 'inv', min: 1, f() {
    for (const luz of S.comps.filter(c => c.type === 'luz')) {
      const wL = S.wires.find(w => (w.a.c === luz.id && w.a.t === 'L') || (w.b.c === luz.id && w.b.t === 'L'));
      const wN = S.wires.find(w => (w.a.c === luz.id && w.a.t === 'N') || (w.b.c === luz.id && w.b.t === 'N'));
      if (!wL || !wN) continue;
      const eL = wL.a.c === luz.id ? wL.a : wL.b;
      const eN = wN.a.c === luz.id ? wN.a : wN.b;
      eL.t = 'N'; eN.t = 'L';
      return 'El cliente notó un cosquilleo al cambiar una bombilla con el interruptor apagado.';
    }
    return null;
  } },
  { id: 'color', min: 1, f() {
    const cands = S.wires.filter(w => w.color === 'azul');
    if (!cands.length) return null;
    rndDe(cands).color = 'marron';
    return 'Todo funciona, pero el instalador anterior dejó algo no reglamentario a la vista.';
  } },
  { id: 'calibre', min: 3, f() {
    const cands = S.comps.filter(c => c.type === 'pia' && c.props.calibre <= 20);
    if (!cands.length) return null;
    const pia = rndDe(cands);
    pia.props.calibre = 40; pia.props.circuito = '';
    const toma = S.comps.find(c => c.type === 'toma');
    if (toma) toma.props.carga = Math.max(toma.props.carga, 2200);
    return 'Huele a plástico caliente cerca de una regleta cuando trabaja un rato, y nunca salta nada.';
  } },
  { id: 'seccion', min: 3, f() {
    const cands = S.wires.filter(w => w.sec >= 6 && w.sec <= 10);
    if (!cands.length) return null;
    const w = rndDe(cands);
    w.sec = 1.5; w.len = Math.max(w.len, 25);
    return 'Cuando entran cargas grandes las luces pierden fuerza, y un tramo de cable se calienta.';
  } }
];

function checkAveriaGen() {
  update();
  const g = S.averiaGen;
  if (!g) return 'No hay avería generada.';
  const ev = pureEval();
  const lucesOK = S.comps.filter(c => c.type === 'luz' && ev.lit[c.id]).length;
  if (lucesOK < g.luces) return 'Hay algún punto de luz que aún no puede encenderse.';
  const vivsOK = S.comps.filter(c => c.type === 'cvivienda' && ev.lit[c.id]).length;
  if (vivsOK < g.vivs) return 'Alguna vivienda sigue sin tensión: repasa su camino desde la centralización.';
  const tomasOK = S.comps.filter(c => c.type === 'toma' && SIM.tomas[c.id] && SIM.tomas[c.id].tension && SIM.tomas[c.id].tierra).length;
  if (tomasOK < g.tomas) return 'Alguna toma sigue sin tensión o sin su tierra.';
  if (hayErrores()) return 'Todavía queda algún defecto (hay errores en la instalación).';
  if (SIM.msgs.some(m => m.lvl === 'warn')) return 'Funciona, pero queda algo no reglamentario por corregir.';
  return true;
}

function generarAveria(nivel) {
  if (S.lab) toggleLab(false);
  histSnap();
  setMode(nivel >= 3 ? 'instalador' : 'aprendiz');
  const bases = nivel === 1 ? [montarVivienda, montarChalet] : [montarVivienda, montarChalet, montarEdificio, montarEdificio2];
  const nFallos = nivel === 1 ? 1 : (nivel === 2 ? 2 : 2 + Math.round(Math.random()));
  const pool = AVERIA_MUTS.filter(m => m.min <= nivel);
  let sintomas = [];
  for (let intento = 0; intento < 10; intento++) {
    rndDe(bases)();
    sintomas = [];
    const usados = new Set();
    let tries = 0;
    while (sintomas.length < nFallos && tries++ < 30) {
      const mut = rndDe(pool);
      if (usados.has(mut.id)) continue;
      const s = mut.f();
      if (s) { usados.add(mut.id); sintomas.push(s); }
    }
    S.averiaGen = {
      nivel, sintomas,
      luces: S.comps.filter(c => c.type === 'luz').length,
      tomas: S.comps.filter(c => c.type === 'toma').length,
      vivs: S.comps.filter(c => c.type === 'cvivienda').length
    };
    if (sintomas.length && checkAveriaGen() !== true) break;   // detectable: vale
  }
  S.reto = null;
  S.averia = 'gen';
  $('#retoBar').classList.add('on');
  $('#retoTitle').textContent = 'Avería generada · nivel ' + nivel;
  closeModal(); closeSheet();
  fitCamera(); update(); buildPalette();
  openModal(`<div class="mTitle">Avería generada · nivel ${nivel}</div><div class="help">
    <p><b>Parte de avería:</b></p><p>${sintomas.map(esc).join('<br><br>')}</p>
    <p>${sintomas.length > 1 ? `Hay <b>${sintomas.length} fallos</b> distintos.` : 'Hay <b>un</b> fallo.'} Inspecciona, usa el <b>multímetro</b> del menú y repara. Después pulsa <b>Comprobar</b>.</p></div>
    <button class="bigbtn pri" data-m="cerrar">Manos a la obra</button>`);
}

function averiasModal() {
  const done = averiasDone();
  let h = `<div class="mTitle">Modo Avería</div>
    <div class="help"><p>Se genera un montaje con <b>un fallo oculto</b>. Sin pistas en el panel: guíate por los síntomas, inspecciona, acciona y repara. El montaje actual se sustituirá.</p></div>`;
  h += AVERIAS.map(a =>
    `<button class="mItem" data-m="averia" data-id="${a.id}">
      <div>${esc(a.t)}${a.modo === 'instalador' ? '<small>Modo Instalador</small>' : ''}</div>
      ${done[a.id] ? '<span class="din">✓ resuelta</span>' : ''}</button>`).join('');
  const gen = averiasGenDone();
  const nGen = (gen[1] || 0) + (gen[2] || 0) + (gen[3] || 0);
  h += `<div style="height:12px"></div>
    <div class="help"><p><b>Avería generada al azar</b> — cada vez es distinta (montaje, fallo y síntomas)${nGen ? ` · resueltas: <b>${nGen}</b>` : ''}:</p></div>
    <div class="chips">
      <button class="chip" data-m="averiaGen" data-id="1">Nivel 1 · fácil${gen[1] ? ' · ' + gen[1] + ' ✓' : ''}</button>
      <button class="chip" data-m="averiaGen" data-id="2">Nivel 2 · media${gen[2] ? ' · ' + gen[2] + ' ✓' : ''}</button>
      <button class="chip" data-m="averiaGen" data-id="3">Nivel 3 · difícil${gen[3] ? ' · ' + gen[3] + ' ✓' : ''}</button>
    </div>`;
  openModal(h);
}

function startAveria(id) {
  let a = AVERIAS.find(x => x.id === id);
  if (id === 'azar') a = AVERIAS[Math.floor(Math.random() * AVERIAS.length)];
  if (!a) return;
  if (S.lab) toggleLab(false);
  histSnap();
  S.reto = null;
  S.averia = a.id;
  if (a.modo && S.mode !== a.modo) setMode(a.modo);
  a.build();
  $('#retoBar').classList.add('on');
  $('#retoTitle').textContent = 'Avería: ' + a.t;
  closeModal(); closeSheet();
  fitCamera(); update(); buildPalette();
  openModal(`<div class="mTitle">${esc(a.t)}</div><div class="help"><p><b>Parte de avería:</b> ${esc(a.s)}</p>
    <p>Cuando creas que está reparada, pulsa <b>Comprobar</b> en la barra superior.</p></div>
    <button class="bigbtn pri" data-m="cerrar">Manos a la obra</button>`);
}

function checkAveria() {
  if (S.averia === 'gen') {
    const v = checkAveriaGen();
    if (v === true) {
      const nivel = S.averiaGen ? S.averiaGen.nivel : 1;
      const st = averiasGenDone(); st[nivel] = (st[nivel] || 0) + 1;
      store.set('rebt.averiasGen', JSON.stringify(st));
      exitReto(); S.averiaGen = null;
      openModal(`<div class="mTitle">Avería resuelta</div><div class="help">
        <p>Reparación correcta y conforme. Diagnóstico de nivel ${nivel} superado.</p></div>
        <button class="bigbtn grn" data-m="averiaGen" data-id="${nivel}">Otra de nivel ${nivel}</button>
        <div style="height:8px"></div>
        <button class="bigbtn sec" data-m="cerrar">Seguir montando</button>`);
    } else {
      toast(typeof v === 'string' ? v : 'La avería sigue sin resolverse.');
    }
    return;
  }
  const a = AVERIAS.find(x => x.id === S.averia);
  if (!a) return;
  update();
  const v = a.check();
  if (v === true) {
    const done = averiasDone(); done[a.id] = true;
    store.set('rebt.averias', JSON.stringify(done));
    exitReto();
    openModal(`<div class="mTitle">Avería resuelta</div><div class="help">
      <p><b>${esc(a.t)}</b>: reparación correcta y conforme. Buen trabajo de diagnóstico.</p></div>
      <button class="bigbtn grn" data-m="averias">Otra avería</button>
      <div style="height:8px"></div>
      <button class="bigbtn sec" data-m="cerrar">Seguir montando</button>`);
  } else {
    toast(typeof v === 'string' ? v : 'La avería sigue sin resolverse: sigue buscando.');
  }
}

/* ==================================================================
   RETOS NUEVOS (Fase 2)
   ================================================================== */
function patronCruce(luz, c1, c2, x) {
  const s = [c1.state.pos, c2.state.pos, x.state.pos];
  const lit = (a, b, cc) => { c1.state.pos = a; c2.state.pos = b; x.state.pos = cc; return !!pureEval().lit[luz.id]; };
  const base = lit(false, false, false);
  let ok = true, alguna = base;
  for (const a of [false, true]) for (const b of [false, true]) for (const cc of [false, true]) {
    const l = lit(a, b, cc);
    if (l) alguna = true;
    if (l !== (base !== ((a !== b) !== cc))) ok = false;
  }
  c1.state.pos = s[0]; c2.state.pos = s[1]; x.state.pos = s[2];
  return ok && alguna;
}

RETOS.push(
  {
    id: 'r6', t: 'Timbre con pulsador', modo: null,
    desc: 'Monta un <b>timbre</b> gobernado por un <b>pulsador</b> (pestañas Maniobras y Receptores): debe sonar solo mientras se mantiene pulsado, con sus protecciones aguas arriba.',
    check() {
      const tim = S.comps.find(c => c.type === 'timbre');
      if (!tim) return 'Añade un timbre (pestaña Receptores).';
      if (pureEval().lit[tim.id]) return 'El timbre no puede sonar en reposo: haz pasar la fase por el pulsador.';
      const pul = S.comps.find(c => c.type === 'puls' && withToggle(c, 'pressed', () => pureEval().lit[tim.id]) === true);
      if (!pul) return 'El timbre debe sonar al accionar un pulsador.';
      pul.state.pressed = true;
      const prot = cadenaProteccion(tim.id);
      pul.state.pressed = false;
      if (!prot) return 'Protege el circuito: IGA + diferencial + PIA armados.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r7', t: 'Luz desde tres puntos', modo: null,
    desc: 'Conmutada con <b>cruzamiento</b>: fase → común del 1º conmutador · sus L1/L2 al cruzamiento · del cruzamiento al 2º conmutador · común del 2º → lámpara. La luz debe cambiar de estado desde los <b>tres</b> mecanismos.',
    check() {
      const conms = S.comps.filter(c => c.type === 'conm');
      const cruces = S.comps.filter(c => c.type === 'cruz');
      if (conms.length < 2 || cruces.length < 1) return 'Necesitas dos conmutadores y un cruzamiento.';
      for (const luz of S.comps.filter(c => c.type === 'luz')) {
        for (let i = 0; i < conms.length; i++) for (let j = i + 1; j < conms.length; j++) for (const x of cruces) {
          if (patronCruce(luz, conms[i], conms[j], x)) {
            if (!pureEval().lit[luz.id]) return 'El cruce funciona: deja la lámpara encendida para terminar.';
            if (!cadenaProteccion(luz.id)) return 'Protege el circuito: IGA + diferencial + PIA armados.';
            if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
            return true;
          }
        }
      }
      return 'Todavía no se puede mandar la luz desde los tres puntos: revisa el cableado del cruzamiento.';
    }
  },
  {
    id: 'r8', t: 'La instalación de enlace', modo: null,
    desc: 'Monta el tramo de la compañía (pestaña Enlace): <b>Red → CGP → contador → ICP → IGA</b> y, desde ahí, un circuito con una luz encendida.',
    check() {
      const falta = ['cgp', 'contador', 'icp'].filter(t => !S.comps.some(c => c.type === t));
      if (falta.length) return 'Falta por montar: ' + falta.map(t => DEFS[t].corto).join(', ') + ' (pestaña Enlace).';
      if (!S.comps.some(c => c.type === 'iga')) return 'Remata el cuadro con su IGA.';
      if (!ordenEnlaceOK()) return 'El orden correcto es Red → CGP → contador → ICP → IGA, cada uno alimentando al siguiente.';
      const ev = pureEval();
      if (!S.comps.some(c => c.type === 'luz' && ev.lit[c.id])) return 'Termina con un punto de luz encendido aguas abajo.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r9', t: 'Chalet: enlace con CPM', modo: 'instalador',
    desc: 'Para <b>un solo usuario</b> (esquema 2.1 de la ITC-BT-12) no hay LGA: monta <b>Red → CPM → ICP → IGA</b> y su cuadro, con la <b>derivación individual de 6 mm² o más</b> (tramo CPM → ICP), y termina con una luz encendida. Sin fallos.',
    check() {
      if (S.mode === 'aprendiz') return 'Cambia a modo Instalador.';
      if (!S.comps.some(c => c.type === 'cpm')) return 'Falta la CPM (pestaña Enlace).';
      if (!S.comps.some(c => c.type === 'icp')) return 'Falta el ICP entre la CPM y el IGA.';
      if (!S.comps.some(c => c.type === 'iga')) return 'Remata el cuadro con su IGA.';
      if (!ordenEnlaceOK()) return 'El orden correcto es Red → CPM → ICP → IGA, cada uno alimentando al siguiente (y sin CGP ni contador sueltos).';
      const ev = pureEval();
      if (!S.comps.some(c => c.type === 'luz' && ev.lit[c.id])) return 'Termina con un punto de luz encendido.';
      if (!SIM.di) return 'No se detecta la derivación individual: cablea CPM → ICP.';
      if (SIM.di.smin < DI_SEC_MIN) return 'La derivación individual debe ser de 6 mm² como mínimo (toca sus cables y cambia la sección).';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r10', t: 'Edificio: contadores centralizados', modo: 'instalador',
    desc: 'Esquema 2.2.1 (ITC-BT-12): <b>Red 3~ → CGP trifásica → LGA → IGM → embarrado</b> y, por cada vivienda, <b>fusible de seguridad → contador → DI con tierra</b> (pestaña Edificio). Monta <b>3 viviendas con tensión, cada una en una fase distinta</b>, con LGA de 10 mm² o más.',
    check() {
      if (S.mode === 'aprendiz') return 'Cambia a modo Instalador.';
      const falta = ['red3', 'cgp3', 'igm', 'embarrado'].filter(t => !S.comps.some(c => c.type === t));
      if (falta.length) return 'Falta por montar: ' + falta.map(t => DEFS[t].corto).join(', ') + ' (pestaña Edificio).';
      const vivs = S.comps.filter(c => c.type === 'cvivienda');
      if (vivs.length < 3) return 'Monta al menos 3 cuadros de vivienda.';
      if (S.comps.filter(c => c.type === 'contador').length < 3) return 'Cada vivienda necesita su contador en la centralización.';
      if (S.comps.filter(c => c.type === 'fusi').length < 3) return 'Cada derivación lleva su fusible de seguridad antes del contador.';
      const ev = pureEval();
      const vivas = vivs.filter(v => ev.lit[v.id]);
      if (vivas.length < 3) return 'Las 3 viviendas deben quedar con tensión (IGM y sus interruptores subidos).';
      const sup = getSupply();
      const pot = buildUF({ allClosed: true });
      const phs = sup.phases.map(t => pot.f(K(sup.comp.id, t)));
      const fases = new Set(vivas.map(v => phs.indexOf(pot.f(K(v.id, 'L')))).filter(i => i >= 0));
      if (fases.size < 3) return 'Reparte las viviendas: cada una debe colgar de una fase distinta (L1, L2 y L3).';
      if (!SIM.lga) return 'No se detecta la LGA: debe ir de la CGP trifásica al IGM.';
      if (SIM.lga.smin < LGA_SEC_MIN) return 'La LGA debe ser de 10 mm² como mínimo (toca sus cables y cambia la sección).';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r11', t: 'Edificio por plantas: dos centralizaciones', modo: 'instalador',
    desc: 'Esquema 2.2.2 (ITC-BT-12): la misma <b>LGA</b> alimenta <b>dos centralizaciones</b> (una por planta), cada una con su <b>IGM</b>, su embarrado y sus viviendas (fusible + contador + DI con tierra). Monta <b>4 viviendas con tensión</b> repartidas en al menos dos fases y <b>declara el esquema 2.2.2</b> en el menú.',
    check() {
      if (S.mode === 'aprendiz') return 'Cambia a modo Instalador.';
      if (S.comps.filter(c => c.type === 'igm').length < 2) return 'Hacen falta dos centralizaciones: un IGM por planta.';
      if (S.comps.filter(c => c.type === 'embarrado').length < 2) return 'Cada centralización necesita su embarrado.';
      const vivs = S.comps.filter(c => c.type === 'cvivienda');
      if (vivs.length < 4) return 'Monta al menos 4 cuadros de vivienda (2 por planta).';
      if (S.comps.filter(c => c.type === 'contador').length < 4) return 'Cada vivienda necesita su contador.';
      if (S.comps.filter(c => c.type === 'fusi').length < 4) return 'Cada derivación lleva su fusible de seguridad.';
      const ev = pureEval();
      const vivas = vivs.filter(v => ev.lit[v.id]);
      if (vivas.length < 4) return 'Las 4 viviendas deben quedar con tensión (los dos IGM subidos).';
      const sup = getSupply();
      const pot = buildUF({ allClosed: true });
      const phs = sup.phases.map(t => pot.f(K(sup.comp.id, t)));
      const fases = new Set(vivas.map(v => phs.indexOf(pot.f(K(v.id, 'L')))).filter(i => i >= 0));
      if (fases.size < 2) return 'Reparte las viviendas entre fases distintas.';
      if (!SIM.lga) return 'No se detecta la LGA: debe salir de la CGP trifásica hacia los IGM.';
      if (SIM.lga.smin < LGA_SEC_MIN) return 'La LGA debe ser de 10 mm² como mínimo.';
      if (S.esquema !== '2.2.2') return 'Declara el esquema 2.2.2 en el menú (Esquema de enlace).';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  }
);
