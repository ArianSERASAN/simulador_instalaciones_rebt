/* ==================================================================
   FASE 2 — instalación de enlace, maniobras avanzadas,
   modo Reglamento (boletín) y modo Avería.
   Todo se registra sobre los ganchos del núcleo: DEFS.draw,
   DEFS.links, DEFS.onAct, DEFS.coil, DEFS.load, DEFS.fichaExtra.
   ================================================================== */

S.palCat = 'cuadro';
S.noche = S.noche || false;
S.averia = null;

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
    ficha: `Mide la energía consumida (kWh). Va precintado por la compañía, entre la CGP y el ICP. En modo Instalador su pantalla muestra la <b>potencia instantánea</b> que está pasando por él. <span class="itc">ITC-BT-16</span>`,
    draw(c, sim, multi) {
      const kw = sim ? fmtNum(r2(sim.totalP / 1000)) : '0';
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
   PALETA POR CATEGORÍAS
   ================================================================== */
const PAL_CATS = [
  { id: 'cuadro', n: 'Cuadro y tierra', items: ['iga', 'dif', 'pia', 'borne', 'pica'] },
  { id: 'enlace', n: 'Enlace', items: ['red', 'cgp', 'contador', 'icp'] },
  { id: 'maniobras', n: 'Maniobras', items: ['int', 'conm', 'cruz', 'puls', 'tele', 'minut', 'presencia', 'crepus', 'prog'] },
  { id: 'receptores', n: 'Receptores', items: ['luz', 'toma', 'timbre', 'motor'] }
];

/* ==================================================================
   BOLETÍN DE CONFORMIDAD (modo Reglamento)
   ================================================================== */
function ordenEnlaceOK() {
  const red = S.comps.find(c => c.type === 'red');
  const cgp = S.comps.find(c => c.type === 'cgp');
  const cont = S.comps.find(c => c.type === 'contador');
  const icp = S.comps.find(c => c.type === 'icp');
  const iga = S.comps.find(c => c.type === 'iga');
  if (!red || !cgp || !cont || !icp) return false;
  const pot = buildUF({ allClosed: true });
  const fed = (tg, ti) => pot.f(K(tg.id, ti)) === pot.f(K(red.id, 'L'));
  const cortaA = (quien, tg, ti) => {
    const t = buildUF({ allClosed: true, open: { [quien.id]: true } });
    return t.f(K(tg.id, ti)) !== t.f(K(red.id, 'L'));
  };
  return fed(cgp, 'Li') && fed(cont, 'Li') && fed(icp, 'Li') &&
    cortaA(cgp, cont, 'Li') && cortaA(cont, icp, 'Li') && (!iga || cortaA(icp, iga, 'Li'));
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

  if (['cgp', 'contador', 'icp'].some(t => S.comps.some(c => c.type === t))) {
    add(ordenEnlaceOK(),
      'Instalación de enlace completa y en orden: acometida → CGP → contador → ICP → IGA', 'ITC-BT-12 a ITC-BT-17');
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
  }
];

function averiasDone() { try { return JSON.parse(store.get('rebt.averias') || '{}') || {}; } catch (e) { return {}; } }

function averiasModal() {
  const done = averiasDone();
  let h = `<div class="mTitle">Modo Avería</div>
    <div class="help"><p>Se genera un montaje con <b>un fallo oculto</b>. Sin pistas en el panel: guíate por los síntomas, inspecciona, acciona y repara. El montaje actual se sustituirá.</p></div>`;
  h += AVERIAS.map(a =>
    `<button class="mItem" data-m="averia" data-id="${a.id}">
      <div>${esc(a.t)}${a.modo === 'instalador' ? '<small>Modo Instalador</small>' : ''}</div>
      ${done[a.id] ? '<span class="din">✓ resuelta</span>' : ''}</button>`).join('');
  h += `<div style="height:10px"></div><button class="bigbtn pri" data-m="averia" data-id="azar">Una al azar</button>`;
  openModal(h);
}

function startAveria(id) {
  let a = AVERIAS.find(x => x.id === id);
  if (id === 'azar') a = AVERIAS[Math.floor(Math.random() * AVERIAS.length)];
  if (!a) return;
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
  }
);
