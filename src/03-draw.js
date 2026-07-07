/* ==================================================================
   DIBUJO — cuerpo de cada componente en ambas vistas
   ================================================================== */

function drawDINReal(c, label, sub, esDif) {
  const d = defOf(c), w = d.w, h = d.h;
  const on = c.state.on && !c.state.trip, trip = c.state.trip;
  const leverY = trip ? 42 : (on ? 29 : 55);
  const cx = w / 2;
  let s = `
  <rect x="2" y="9" width="${w - 4}" height="${h - 18}" rx="6" fill="#f2f3f5" stroke="#b4bac4" stroke-width="1.2"/>
  <rect x="5" y="13" width="${w - 10}" height="11" rx="2" fill="#d7dbe1"/>
  <rect x="5" y="${h - 24}" width="${w - 10}" height="11" rx="2" fill="#d7dbe1"/>`;
  for (const t of d.terms) {
    s += `<circle cx="${t.x}" cy="${t.y === 0 ? 18.5 : h - 18.5}" r="3.4" fill="#9aa2ae" stroke="#7d8592"/>`;
  }
  s += `
  <rect x="${cx - 16}" y="27" width="32" height="46" rx="4" fill="#e7e9ee" stroke="#c6cbd3"/>
  <text x="${cx - 21}" y="36" font-size="8" fill="#98a0ac" text-anchor="middle" font-weight="700">I</text>
  <text x="${cx - 21}" y="70" font-size="8" fill="#98a0ac" text-anchor="middle" font-weight="700">0</text>
  <rect class="lever" x="${cx - 9}" y="${leverY}" width="18" height="17" rx="3.5"
        fill="${trip ? '#c94f2a' : (on ? '#2f3540' : '#5a6270')}" stroke="#20252d"/>
  <rect x="${cx - 16}" y="76" width="32" height="7" rx="2" fill="${on ? '#d84a3a' : '#3f9b4f'}"/>
  <text x="${cx}" y="${h - 27.5}" font-size="8.5" fill="#4a5261" text-anchor="middle" font-weight="700">${esc(label)}</text>`;
  if (sub) s += `<text x="${cx}" y="${h - 27.5 + 9}" font-size="7" fill="#7d8592" text-anchor="middle">${esc(sub)}</text>`;
  if (trip) s += `<g class="tripmark"><circle cx="${cx}" cy="4" r="7" fill="#e5533d"/><text x="${cx}" y="7" font-size="9" fill="#fff" text-anchor="middle" font-weight="800">!</text></g>`;
  s += `<rect data-act="palanca" data-comp="${c.id}" x="${cx - 24}" y="25" width="48" height="50" fill="rgba(0,0,0,0)"/>`;
  if (esDif) s += `
  <rect x="${cx + 8}" y="30" width="13" height="13" rx="2" fill="#e4c33f" stroke="#a98f22" data-act="test" data-comp="${c.id}"/>
  <text x="${cx + 14.5}" y="40" font-size="8" fill="#5c4d0d" text-anchor="middle" font-weight="700" pointer-events="none">T</text>`;
  return s;
}

function drawDINMulti(c, label, sub, esDif) {
  const d = defOf(c), w = d.w, h = d.h;
  const on = c.state.on && !c.state.trip, trip = c.state.trip;
  const cx = w / 2;
  const poles = [[d.terms[0].x, d.terms[2].x], [d.terms[1].x, d.terms[3].x]];
  let s = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="4" fill="#fff" stroke="#3a4352" stroke-width="1.4"/>`;
  for (const [xt] of poles) {
    s += `<line x1="${xt}" y1="0" x2="${xt}" y2="26" stroke="#3a4352" stroke-width="2"/>
          <line x1="${xt}" y1="66" x2="${xt}" y2="${h}" stroke="#3a4352" stroke-width="2"/>
          <circle cx="${xt}" cy="28" r="2.6" fill="#3a4352"/>`;
    s += on
      ? `<line x1="${xt}" y1="28" x2="${xt}" y2="66" stroke="#2f9e57" stroke-width="2.4"/>`
      : `<line x1="${xt}" y1="28" x2="${xt + 11}" y2="60" stroke="${trip ? '#e5533d' : '#3a4352'}" stroke-width="2.4"/>`;
    s += `<path d="M${xt - 5} 66h10" stroke="#3a4352" stroke-width="2"/>`;
  }
  s += `<line x1="${poles[0][0]}" y1="47" x2="${poles[1][0]}" y2="47" stroke="#8b93a1" stroke-width="1.4" stroke-dasharray="3 3"/>`;
  if (esDif) s += `<ellipse cx="${cx}" cy="47" rx="${(poles[1][0] - poles[0][0]) / 2 + 9}" ry="13" fill="none" stroke="#2e6fd0" stroke-width="1.6"/>`;
  s += `<text x="${cx}" y="${h - 22}" font-size="9" fill="#242b36" text-anchor="middle" font-weight="700">${esc(label)}</text>`;
  if (sub) s += `<text x="${cx}" y="${h - 12}" font-size="7.5" fill="#6b7482" text-anchor="middle">${esc(sub)}</text>`;
  if (trip) s += `<text x="${cx}" y="12" font-size="8" fill="#e5533d" text-anchor="middle" font-weight="800" class="tripmark">DISPARADO</text>`;
  s += `<rect data-act="palanca" data-comp="${c.id}" x="${cx - 24}" y="24" width="48" height="46" fill="rgba(0,0,0,0)"/>`;
  return s;
}

function drawBody(c, sim) {
  const d = defOf(c), w = d.w, h = d.h;
  const multi = S.view === 'multifilar';
  if (d.draw) return d.draw(c, sim, multi);   // componentes de la Fase 2
  switch (c.type) {

    case 'red': {
      if (multi) return `
        <circle cx="${w / 2}" cy="28" r="25" fill="#fff" stroke="#3a4352" stroke-width="1.6"/>
        <text x="${w / 2}" y="26" font-size="15" fill="#3a4352" text-anchor="middle" font-weight="700">~</text>
        <text x="${w / 2}" y="41" font-size="9.5" fill="#3a4352" text-anchor="middle" font-weight="700">230 V</text>
        <line x1="44" y1="48" x2="44" y2="62" stroke="#3a4352" stroke-width="2"/>
        <line x1="88" y1="35" x2="88" y2="62" stroke="#3a4352" stroke-width="2"/>`;
      return `
        <rect x="2" y="2" width="${w - 4}" height="${h - 8}" rx="9" fill="#232a35" stroke="#3c4553"/>
        <path d="M28 14 L20 32 h7 l-5 15 13 -19 h-7 l7 -14 z" fill="#f4b942"/>
        <text x="${w / 2 + 12}" y="29" font-size="12" fill="#eef2f7" text-anchor="middle" font-weight="700">RED</text>
        <text x="${w / 2 + 12}" y="43" font-size="10" fill="#9fb0c5" text-anchor="middle">230 V ~</text>`;
    }

    case 'iga': {
      const lbl = 'IGA ' + c.props.calibre + ' A';
      return multi ? drawDINMulti(c, lbl, '', false) : drawDINReal(c, lbl, '', false);
    }
    case 'dif': {
      const lbl = 'ID ' + c.props.calibre + ' A';
      return multi ? drawDINMulti(c, lbl, '30 mA', true) : drawDINReal(c, lbl, '30 mA', true);
    }
    case 'pia': {
      const lbl = 'PIA ' + c.props.calibre + ' A';
      const sub = c.props.circuito || '';
      return multi ? drawDINMulti(c, lbl, sub, false) : drawDINReal(c, lbl, sub, false);
    }

    case 'int': {
      const on = c.state.on;
      if (multi) return `
        <line x1="22" y1="0" x2="22" y2="30" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="0" x2="54" y2="30" stroke="#3a4352" stroke-width="2"/>
        <circle cx="22" cy="33" r="3" fill="#3a4352"/><circle cx="54" cy="33" r="3" fill="#3a4352"/>
        ${on ? `<line x1="22" y1="33" x2="54" y2="33" stroke="#2f9e57" stroke-width="2.6"/>`
             : `<line x1="22" y1="33" x2="50" y2="18" stroke="#3a4352" stroke-width="2.6"/>`}
        <text x="38" y="58" font-size="9.5" fill="#242b36" text-anchor="middle" font-weight="700">interruptor</text>
        <text x="38" y="69" font-size="8" fill="#6b7482" text-anchor="middle">${on ? 'cerrado' : 'abierto'}</text>
        <rect data-act="tecla" data-comp="${c.id}" x="10" y="8" width="56" height="52" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="5" y="8" width="${w - 10}" height="${h - 14}" rx="9" fill="#fbfcfd" stroke="#c4cad3"/>
        <rect x="19" y="21" width="38" height="52" rx="5" fill="#f1f3f6" stroke="#c4cad3"/>
        <rect x="19" y="${on ? 21 : 47}" width="38" height="26" rx="5" fill="#e2e6eb"/>
        <line x1="26" y1="47" x2="50" y2="47" stroke="#c9ced6" stroke-width="1"/>
        <circle cx="38" cy="${on ? 30 : 64}" r="2.4" fill="${on ? '#e07a30' : '#aab2bd'}"/>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="16" width="48" height="62" fill="rgba(0,0,0,0)"/>`;
    }

    case 'conm': {
      const p1 = !c.state.pos;   // false → L1
      if (multi) return `
        <line x1="38" y1="0" x2="38" y2="28" stroke="#3a4352" stroke-width="2"/>
        <circle cx="38" cy="31" r="3" fill="#3a4352"/>
        <circle cx="22" cy="62" r="3" fill="#3a4352"/><circle cx="54" cy="62" r="3" fill="#3a4352"/>
        <line x1="22" y1="65" x2="22" y2="92" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="65" x2="54" y2="92" stroke="#3a4352" stroke-width="2"/>
        <line x1="38" y1="31" x2="${p1 ? 22 : 54}" y2="62" stroke="#2f9e57" stroke-width="2.6"/>
        <line x1="38" y1="31" x2="${p1 ? 54 : 22}" y2="62" stroke="#c3c9d2" stroke-width="1.6" stroke-dasharray="3 3"/>
        <text x="38" y="80" font-size="9.5" fill="#242b36" text-anchor="middle" font-weight="700">conmutador</text>
        <rect data-act="tecla" data-comp="${c.id}" x="10" y="8" width="56" height="60" fill="rgba(0,0,0,0)"/>`;
      return `
        <rect x="5" y="8" width="${w - 10}" height="${h - 14}" rx="9" fill="#fbfcfd" stroke="#c4cad3"/>
        <rect x="19" y="21" width="38" height="52" rx="5" fill="#f1f3f6" stroke="#c4cad3"/>
        <rect x="19" y="${p1 ? 47 : 21}" width="38" height="26" rx="5" fill="#e2e6eb"/>
        <path d="M31 84 h14 m-14 0 l4 -3 m-4 3 l4 3 M45 84 l-4 -3 m4 3 l-4 3" stroke="#98a0ac" stroke-width="1.4" fill="none"/>
        <rect data-act="tecla" data-comp="${c.id}" x="14" y="16" width="48" height="62" fill="rgba(0,0,0,0)"/>`;
    }

    case 'luz': {
      const lit = sim && sim.lit[c.id];
      // brillo según la tensión que le llega (flujo luminoso ∝ V^3,4); sin caída => b = 1
      const vArr = lit ? (sim.vlit && sim.vlit[c.id] != null ? sim.vlit[c.id] : V_RED) : 0;
      const b = lit ? clamp01(Math.pow(clamp01(vArr / V_RED), 3.4)) : 0;
      const glow = k => (0.5 + 0.5 * b).toFixed(2);          // opacidad del halo
      const gr = base => r1(base * (0.55 + 0.45 * b));       // radio del halo
      if (multi) return `
        <line x1="30" y1="0" x2="30" y2="34" stroke="#3a4352" stroke-width="2"/>
        <line x1="54" y1="0" x2="54" y2="34" stroke="#3a4352" stroke-width="2"/>
        <path d="M30 34 Q42 42 54 34" fill="none" stroke="#3a4352" stroke-width="1.6"/>
        ${lit ? `<circle cx="42" cy="62" r="${gr(24)}" fill="url(#gGlow)" opacity="${glow()}"/>` : ''}
        <circle cx="42" cy="62" r="15" fill="${lit ? mixHex('#d9b84a', '#ffe27a', b) : '#fff'}" stroke="#3a4352" stroke-width="1.8"/>
        <line x1="31.4" y1="51.4" x2="52.6" y2="72.6" stroke="#3a4352" stroke-width="1.8"/>
        <line x1="52.6" y1="51.4" x2="31.4" y2="72.6" stroke="#3a4352" stroke-width="1.8"/>
        <text x="42" y="95" font-size="9" fill="#6b7482" text-anchor="middle">${c.props.potencia} W</text>`;
      return `
        <rect x="26" y="2" width="32" height="9" rx="3" fill="#dfe3e9" stroke="#b8bfc9"/>
        <line x1="42" y1="11" x2="42" y2="32" stroke="#3c4553" stroke-width="2.4"/>
        <rect x="34" y="32" width="16" height="15" rx="3" fill="#8f97a4"/>
        ${lit ? `<circle cx="42" cy="72" r="${gr(36)}" fill="url(#gGlow)" opacity="${glow()}"/>` : ''}
        <circle cx="42" cy="72" r="23" fill="${lit ? mixHex('#d9ac3e', '#ffd85e', b) : '#f4f6f9'}" stroke="${lit ? '#d9a92e' : '#adb6c2'}" stroke-width="1.6"/>
        <path d="M35 66 q7 10 14 0" fill="none" stroke="${lit ? mixHex('#9a6a10', '#b97f13', b) : '#c3cad4'}" stroke-width="1.6"/>`;
    }

    case 'toma': {
      const st = sim && sim.tomas[c.id];
      const viva = st && st.tension;
      if (multi) return `
        <line x1="22" y1="0" x2="22" y2="40" stroke="#3a4352" stroke-width="2"/>
        <line x1="70" y1="0" x2="70" y2="40" stroke="#3a4352" stroke-width="2"/>
        <line x1="46" y1="0" x2="46" y2="52" stroke="#3f9b3f" stroke-width="2"/>
        <path d="M14 52 a 32 32 0 0 1 64 0" fill="none" stroke="#3a4352" stroke-width="2.2"/>
        <line x1="40" y1="52" x2="52" y2="52" stroke="#3a4352" stroke-width="2.2"/>
        ${viva ? `<circle cx="82" cy="12" r="4" fill="#37c26e"/>` : ''}
        <text x="46" y="72" font-size="9" fill="#6b7482" text-anchor="middle">${c.props.carga > 0 ? c.props.carga + ' W' : 'toma 16 A'}</text>`;
      return `
        <rect x="4" y="10" width="${w - 8}" height="${h - 18}" rx="11" fill="#fbfcfd" stroke="#c4cad3"/>
        <circle cx="46" cy="53" r="27" fill="#e9ecf0" stroke="#c4cad3" stroke-width="1.4"/>
        <circle cx="36" cy="53" r="4.6" fill="#252a32"/>
        <circle cx="56" cy="53" r="4.6" fill="#252a32"/>
        <rect x="42.5" y="26.5" width="7" height="8" rx="1.5" fill="#98a0ac"/>
        <rect x="42.5" y="71.5" width="7" height="8" rx="1.5" fill="#98a0ac"/>
        ${viva ? `<circle cx="78" cy="21" r="4" fill="#37c26e"><animate attributeName="opacity" values="1;.35;1" dur="1.6s" repeatCount="indefinite"/></circle>` : ''}
        ${c.props.carga > 0 ? `<text x="46" y="${h - 1}" font-size="9" fill="#5c6879" text-anchor="middle" font-weight="700">${c.props.carga} W</text>` : ''}`;
    }

    case 'borne': {
      if (multi) {
        let s2 = `<rect x="4" y="14" width="${w - 8}" height="10" fill="none" stroke="#3f9b3f" stroke-width="2"/>`;
        for (const t of defOf(c).terms) s2 += `<line x1="${t.x}" y1="0" x2="${t.x}" y2="14" stroke="#3f9b3f" stroke-width="2"/>`;
        s2 += `<text x="${w / 2}" y="40" font-size="9" fill="#3f9b3f" text-anchor="middle" font-weight="700">borne de tierra</text>`;
        return s2;
      }
      let s2 = `
        <rect x="2" y="12" width="${w - 4}" height="18" rx="4" fill="#c9a44a" stroke="#96762b"/>
        <rect x="2" y="30" width="${w - 4}" height="9" rx="2" fill="#3f9b3f"/>
        <rect x="2" y="30" width="${(w - 4) / 2}" height="9" rx="2" fill="#e4c33f"/>`;
      for (const t of defOf(c).terms) s2 += `<circle cx="${t.x}" cy="21" r="4" fill="#8a6d25" stroke="#6e561c"/>`;
      s2 += `<text x="${w / 2}" y="${h}" font-size="8.5" fill="#4a5261" text-anchor="middle" font-weight="700">TIERRA</text>`;
      return s2;
    }

    case 'pica': {
      if (multi) return `
        <line x1="32" y1="0" x2="32" y2="66" stroke="#3f9b3f" stroke-width="2.2"/>
        <line x1="16" y1="66" x2="48" y2="66" stroke="#3f9b3f" stroke-width="2.6"/>
        <line x1="22" y1="73" x2="42" y2="73" stroke="#3f9b3f" stroke-width="2.2"/>
        <line x1="28" y1="80" x2="36" y2="80" stroke="#3f9b3f" stroke-width="1.8"/>
        <text x="32" y="98" font-size="9" fill="#3f9b3f" text-anchor="middle" font-weight="700">pica</text>`;
      return `
        <rect x="6" y="64" width="52" height="42" fill="url(#pTierra)" stroke="#b59a72"/>
        <rect x="6" y="60" width="52" height="6" fill="#7d9b52"/>
        <line x1="32" y1="4" x2="32" y2="24" stroke="#3f9b3f" stroke-width="3"/>
        <rect x="24" y="22" width="16" height="10" rx="2" fill="#8f97a4" stroke="#6d7480"/>
        <rect x="29" y="30" width="6" height="72" rx="2.5" fill="#b06c3b" stroke="#8a5228"/>`;
    }
  }
  return '';
}
