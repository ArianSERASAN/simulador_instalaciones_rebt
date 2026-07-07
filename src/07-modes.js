/* ==================================================================
   RETOS GUIADOS
   ================================================================== */
function withToggle(c, key, fn) {
  const v = c.state[key]; c.state[key] = !v;
  const r = fn(); c.state[key] = v; return r;
}
function hayErrores() { return SIM && SIM.msgs.some(m => m.lvl === 'err'); }
function cadenaProteccion(luzId) {
  const corta = tipo => S.comps.some(c => c.type === tipo && c.state.on && !c.state.trip &&
    withToggle(c, 'on', () => pureEval().lit[luzId]) === false);
  return corta('iga') && corta('dif') && corta('pia');
}
function patronConmutada(luz, c1, c2) {
  const s1 = c1.state.pos, s2 = c2.state.pos;
  const litAt = (a, b) => { c1.state.pos = a; c2.state.pos = b; return !!pureEval().lit[luz.id]; };
  const base = litAt(false, false);
  let ok = true, alguna = base;
  for (const a of [false, true]) for (const b of [false, true]) {
    const l = litAt(a, b);
    if (l) alguna = true;
    if (l !== (base !== (a !== b))) ok = false;
  }
  c1.state.pos = s1; c2.state.pos = s2;
  return ok && alguna;
}

const RETOS = [
  {
    id: 'r1', t: 'La primera luz', modo: null,
    desc: 'Monta la cadena completa: <b>Red → IGA → Diferencial → PIA → interruptor → punto de luz</b>, con el neutro directo del PIA a la lámpara. Arma las protecciones y deja la bombilla <b>encendida</b> antes de comprobar.',
    check() {
      const ev = pureEval();
      const luz = S.comps.find(c => c.type === 'luz' && ev.lit[c.id]);
      if (!luz) return 'La bombilla tiene que estar encendida al comprobar.';
      const sw = S.comps.find(c => c.type === 'int' && withToggle(c, 'on', () => pureEval().lit[luz.id]) === false);
      if (!sw) return 'La luz debe apagarse con un interruptor simple: haz pasar la fase por él.';
      if (!cadenaProteccion(luz.id)) return 'La luz debe colgar de IGA + diferencial + PIA, los tres armados.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r2', t: 'Luz conmutada', modo: null,
    desc: 'Enciende una lámpara desde <b>dos puntos</b>: fase → común del primer conmutador · L1↔L1 y L2↔L2 entre ambos · común del segundo → lámpara · neutro directo. Debe poder encenderse y apagarse desde cualquiera de los dos.',
    check() {
      const conms = S.comps.filter(c => c.type === 'conm');
      if (conms.length < 2) return 'Necesitas dos conmutadores.';
      for (const luz of S.comps.filter(c => c.type === 'luz')) {
        for (let i = 0; i < conms.length; i++) for (let j = i + 1; j < conms.length; j++) {
          if (patronConmutada(luz, conms[i], conms[j])) {
            if (!pureEval().lit[luz.id]) return 'La conmutación es correcta: deja la lámpara encendida para terminar.';
            if (!cadenaProteccion(luz.id)) return 'Protege el circuito: IGA + diferencial + PIA armados.';
            if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
            return true;
          }
        }
      }
      return 'Todavía no hay una conmutación válida: revisa común/L1/L2 en ambos mecanismos.';
    }
  },
  {
    id: 'r3', t: 'Enchufe con tierra', modo: null,
    desc: 'Monta una <b>base de enchufe</b> con fase, neutro y <b>tierra</b> (borne PE → borne principal → pica), protegida por su PIA y el diferencial. Debe quedar con tensión y tierra correcta.',
    check() {
      const t = S.comps.find(c => c.type === 'toma' && SIM.tomas[c.id] && SIM.tomas[c.id].tension && SIM.tomas[c.id].tierra);
      if (!t) return 'Hace falta una toma con tensión y con tierra bien conectada.';
      const prot = S.comps.some(c => c.type === 'dif' && c.state.on && !c.state.trip &&
        withToggle(c, 'on', () => { const e = pureEval(); return e.toma[t.id] && e.toma[t.id].tension; }) === false);
      if (!prot) return 'La toma debe estar protegida por un diferencial.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r4', t: 'C3: cocina y horno', modo: 'instalador',
    desc: 'En modo Instalador, monta el circuito <b>C3</b>: PIA de <b>25 A</b>, cable de <b>6 mm²</b>, toma con tierra y una carga de <b>5.500 W</b> enchufada. Sin fallos y con caída de tensión ≤ 3 %.',
    check() {
      if (S.mode === 'aprendiz') return 'Cambia a modo Instalador.';
      const circ = SIM.circuits.find(ci => ci.calibre === 25 && ci.smin && ci.smin >= 6 &&
        ci.tomas.some(id => { const st = SIM.tomas[id], tc = byId(id); return st && st.tension && st.tierra && tc.props.carga >= 5000; }));
      if (!circ) return 'Busca: PIA de 25 A + cables de 6 mm² + toma con tierra y 5.500 W de carga, con tensión.';
      if (circ.pct > 3) return 'La caída de tensión supera el 3 %: acorta la línea o revisa la sección.';
      if (!circ.dif) return 'El circuito debe pasar por un diferencial.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  },
  {
    id: 'r5', t: 'Vivienda mínima: C1 + C2', modo: 'instalador',
    desc: 'Bajo el <b>mismo diferencial</b>, monta <b>C1</b> (PIA 10 A · 1,5 mm² con una luz y su interruptor) y <b>C2</b> (PIA 16 A · 2,5 mm² con una toma con tierra). Todo funcionando y sin fallos.',
    check() {
      if (S.mode === 'aprendiz') return 'Cambia a modo Instalador.';
      const c1 = SIM.circuits.find(ci => ci.calibre === 10 && ci.luces.some(id => SIM.lit[id]));
      if (!c1) return 'Falta C1: PIA de 10 A con una luz encendida.';
      const c2 = SIM.circuits.find(ci => ci.calibre === 16 &&
        ci.tomas.some(id => SIM.tomas[id] && SIM.tomas[id].tension && SIM.tomas[id].tierra));
      if (!c2) return 'Falta C2: PIA de 16 A con una toma con tensión y tierra.';
      if (!c1.dif || c1.dif !== c2.dif) return 'Los dos circuitos deben colgar del mismo diferencial.';
      if (hayErrores()) return 'Quedan fallos en el panel de resultados: corrígelos.';
      return true;
    }
  }
];

function retosDone() { try { return JSON.parse(store.get('rebt.retos') || '{}') || {}; } catch (e) { return {}; } }
function startReto(id) {
  const r = RETOS.find(r => r.id === id);
  if (!r) return;
  S.reto = id; S.averia = null;
  if (r.modo && S.mode !== r.modo) setMode(r.modo);
  $('#retoBar').classList.add('on');
  $('#retoTitle').textContent = r.t;
  closeModal(); closeSheet();
  openModal(`<div class="mTitle">${esc(r.t)}</div><div class="help"><p>${r.desc}</p></div>
    <button class="bigbtn pri" data-m="cerrar">Al lío</button>`);
}
function exitReto() { S.reto = null; S.averia = null; $('#retoBar').classList.remove('on'); update(); }
$('#btnRetoExit').addEventListener('click', exitReto);
$('#btnRetoCheck').addEventListener('click', () => {
  if (S.averia) { checkAveria(); return; }
  const r = RETOS.find(r => r.id === S.reto);
  if (!r) return;
  update();                       // simulación fresca
  const v = r.check();
  if (v === true) {
    const done = retosDone(); done[r.id] = true;
    store.set('rebt.retos', JSON.stringify(done));
    openModal(`<div class="mTitle">Reto superado</div><div class="help">
      <p><b>${esc(r.t)}</b> completado. Este montaje cumple lo que se pedía: puedes guardarlo desde el menú o pasar al siguiente reto.</p></div>
      <button class="bigbtn grn" data-m="retos">Ver más retos</button>
      <div style="height:8px"></div>
      <button class="bigbtn sec" data-m="cerrar">Seguir montando</button>`);
    exitReto();
  } else {
    toast(v);
    $('#resChip').classList.add('open'); $('#resPanel').classList.add('open');
  }
});

/* ==================================================================
   GUARDAR / CARGAR
   ================================================================== */
function serialize() {
  return JSON.stringify({ v: 2, mode: S.mode, view: S.view, comps: S.comps, wires: S.wires, nextId: S.nextId, cam: S.cam, noche: !!S.noche });
}
function deserialize(str) {
  try {
    const d = JSON.parse(str);
    if (!d || !Array.isArray(d.comps)) return false;
    const comps = d.comps.filter(c => c && DEFS[c.type]);
    for (const c of comps) {
      const df = DEFS[c.type];
      c.props = Object.assign(df.props(), c.props || {});
      c.state = Object.assign(df.state(), c.state || {});
      c.x = Number(c.x) || 0; c.y = Number(c.y) || 0;
    }
    const ids = new Set(comps.map(c => c.id));
    const wires = (Array.isArray(d.wires) ? d.wires : []).filter(w =>
      w && w.a && w.b && ids.has(w.a.c) && ids.has(w.b.c) && COLORES[w.color]);
    for (const w of wires) { w.sec = SECCIONES.includes(w.sec) ? w.sec : 2.5; w.len = clamp(Number(w.len) || 5, 1, 60); }
    S.comps = comps; S.wires = wires;
    let maxId = 0;
    for (const o of [...comps, ...wires]) {
      const n = parseInt(String(o.id).replace(/^[cw]/, ''), 10);
      if (!isNaN(n) && n > maxId) maxId = n;
    }
    S.nextId = Math.max(Number(d.nextId) || 1, maxId + 1);
    S.noche = !!d.noche;
    S.mode = ['instalador', 'reglamento'].includes(d.mode) ? d.mode : 'aprendiz';
    S.view = d.view === 'multifilar' ? 'multifilar' : 'realista';
    if (d.cam && typeof d.cam.s === 'number') S.cam = { tx: d.cam.tx || 0, ty: d.cam.ty || 0, s: clamp(d.cam.s, 0.3, 3.2) };
    else S.cam = null;
    S.sel = null; S.selWire = null; wireDraft = null;
    return true;
  } catch (e) { return false; }
}
function getSaves() { try { return JSON.parse(store.get('rebt.saves') || '{}') || {}; } catch (e) { return {}; } }

/* ==================================================================
   MENÚ Y MODALES
   ================================================================== */
function menuModal() {
  openModal(`<div class="mTitle">Menú</div>
    <button class="mItem" data-m="retos"><span class="mi-ico"><svg viewBox="0 0 24 24"><path d="M6 3v18M6 4h12l-3 4 3 4H6" fill="none" stroke="#f4b942" stroke-width="2" stroke-linejoin="round"/></svg></span><div>Retos guiados<small>Ejercicios paso a paso con corrección automática</small></div></button>
    <button class="mItem" data-m="averias"><span class="mi-ico"><svg viewBox="0 0 24 24"><path d="M12 3l9 16H3z" fill="none" stroke="#e5533d" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4m0 3v.2" stroke="#e5533d" stroke-width="2" stroke-linecap="round"/></svg></span><div>Modo Avería<small>Te genera un montaje con un fallo oculto: encuéntralo</small></div></button>
    <button class="mItem" data-m="montajes"><span class="mi-ico"><svg viewBox="0 0 24 24"><path d="M5 4h11l3 3v13H5z M8 4v5h7V4 M8 20v-6h8v6" fill="none" stroke="#4d8dee" stroke-width="2" stroke-linejoin="round"/></svg></span><div>Mis montajes<small>Guardar y cargar (funciona sin conexión)</small></div></button>
    <button class="mItem" data-m="tabla"><span class="mi-ico"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z M4 10h16 M4 15h16 M10 5v14" fill="none" stroke="#37c26e" stroke-width="2"/></svg></span><div>Tabla REBT<small>Circuitos C1–C5, secciones y calibres (ITC-BT-25)</small></div></button>
    <button class="mItem" data-m="ayuda"><span class="mi-ico"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="#8fa0b5" stroke-width="2"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 1.9m0 2.9v.2" fill="none" stroke="#8fa0b5" stroke-width="2" stroke-linecap="round"/></svg></span><div>Cómo se usa<small>Gestos, cableado y modos</small></div></button>
    <button class="mItem" data-m="nuevo"><span class="mi-ico"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#e5533d" stroke-width="2.4" stroke-linecap="round"/></svg></span><div>Nuevo montaje<small>Vaciar el lienzo y empezar de cero</small></div></button>`);
}

function retosModal() {
  const done = retosDone();
  openModal(`<div class="mTitle">Retos guiados</div>` + RETOS.map(r =>
    `<button class="mItem" data-m="reto" data-id="${r.id}">
      <div>${esc(r.t)}${r.modo === 'instalador' ? '<small>Modo Instalador</small>' : ''}</div>
      ${done[r.id] ? '<span class="din">✓ superado</span>' : ''}</button>`).join(''));
}

function montajesModal() {
  const saves = getSaves();
  const nombres = Object.keys(saves).sort();
  let h = `<div class="mTitle">Mis montajes</div>`;
  if (store.volatil()) h += `<div class="help"><p style="color:#f4b942">Aviso: el almacenamiento del navegador no está disponible; los montajes solo se conservarán mientras la app esté abierta.</p></div>`;
  h += `<input class="nameIn" id="saveName" placeholder="Nombre del montaje" maxlength="40" value="">
    <button class="bigbtn grn" data-m="guardar">Guardar el montaje actual</button>
    <div style="height:10px"></div>`;
  if (!nombres.length) h += `<div class="help"><p>No hay montajes guardados todavía.</p></div>`;
  for (const n of nombres) {
    h += `<div class="mItem"><div style="flex:1">${esc(n)}<small>${esc(saves[n].fecha || '')}</small></div>
      <button class="chip act" data-m="cargar" data-id="${esc(n)}">Cargar</button>
      <button class="chip" data-m="borrarSave" data-id="${esc(n)}">Borrar</button></div>`;
  }
  openModal(h);
}

function tablaModal() {
  let filas = '';
  for (const k of Object.keys(TABLA_C)) {
    const t = TABLA_C[k];
    filas += `<tr><td><b>${k}</b></td><td>${esc(t.uso)}</td><td>${t.pia} A</td><td>${fmtSec(t.sec)} mm²</td><td>${t.tubo} mm</td></tr>`;
  }
  openModal(`<div class="mTitle">Tabla de referencia · ITC-BT-25</div><div class="help">
    <p><b>Electrificación básica</b>: 5.750 W (IGA 25 A) · <b>Elevada</b>: 9.200 W (IGA 40 A).</p>
    <table><tr><th>Circ.</th><th>Uso</th><th>PIA</th><th>Sección</th><th>Tubo</th></tr>${filas}</table>
    <p>· El PIA se elige para <b>proteger el cable</b>, no el aparato.<br>
    · Máximo <b>5 circuitos</b> por diferencial (mínimo un ID de 30 mA; típico 40 A / 30 mA tipo AC).<br>
    · Nº máximo de puntos: C1 ≤ 30 luces · C2 ≤ 20 tomas · C5 ≤ 6 tomas.<br>
    · Colores: fase <b>marrón/negro/gris</b> · neutro <b>azul</b> · protección <b>verde-amarillo</b>.</p></div>
    <button class="bigbtn sec" data-m="cerrar">Cerrar</button>`);
}

function ayudaModal() {
  openModal(`<div class="mTitle">Cómo se usa</div><div class="help">
    <p><b>Añadir</b>: toca un componente de la barra inferior (o arrástralo hacia arriba, al plano). Los aparatos DIN se encajan solos en el carril del cuadro.</p>
    <p><b>Cablear</b>: toca un borne (círculo de color) y luego otro borne. El color del cable se elige solo, y puedes cambiarlo tocando el cable. Toca en el vacío para cancelar.</p>
    <p><b>Accionar</b>: toca la palanca de IGA/diferencial/PIA o la tecla de un interruptor. Tocando el resto del aparato se abre su ficha (datos, propiedades, eliminar). La <b>T</b> del diferencial es su botón de prueba.</p>
    <p><b>Moverse</b>: arrastra con un dedo para desplazar el plano y pellizca con dos para hacer zoom. Los componentes se mueven arrastrándolos.</p>
    <p><b>Modos</b> · <b>Aprendiz</b>: comprueba solo el cableado y lo explica en lenguaje sencillo. <b>Instalador</b>: además eliges secciones y calibres y calcula intensidad y caída de tensión por circuito. <b>Reglamento</b>: sin pistas; montas por tu cuenta y emites un <b>boletín de conformidad</b> punto por punto con su ITC.</p>
    <p><b>Modo Avería</b> (en el menú): genera un montaje con un fallo oculto que debes localizar y reparar, guiándote solo por los síntomas.</p>
    <p><b>Vistas</b>: el botón del ojo alterna entre vista <b>realista</b> y esquema <b>multifilar</b> (fase, neutro y tierra dibujados conductor a conductor). Es el mismo montaje en las dos.</p></div>
    <button class="bigbtn sec" data-m="cerrar">Cerrar</button>`);
}

function confirmNuevo() {
  openModal(`<div class="mTitle">¿Vaciar el lienzo?</div><div class="help"><p>Se borrará el montaje actual (los montajes guardados no se tocan).</p></div>
    <button class="bigbtn red" data-m="nuevoSi">Sí, empezar de cero</button>
    <div style="height:8px"></div>
    <button class="bigbtn sec" data-m="cerrar">Cancelar</button>`);
}

modalBody.addEventListener('click', e => {
  const b = e.target.closest('[data-m]');
  if (!b) return;
  const m = b.dataset.m, id = b.dataset.id;
  if (m === 'cerrar') closeModal();
  else if (m === 'retos') retosModal();
  else if (m === 'reto') startReto(id);
  else if (m === 'averias') averiasModal();
  else if (m === 'averia') startAveria(id);
  else if (m === 'montajes') montajesModal();
  else if (m === 'tabla') tablaModal();
  else if (m === 'ayuda') ayudaModal();
  else if (m === 'nuevo') confirmNuevo();
  else if (m === 'nuevoSi') { nuevoMontaje(); closeModal(); }
  else if (m === 'guardar') {
    const inp = $('#saveName');
    const n = (inp && inp.value.trim()) || ('Montaje ' + new Date().toLocaleDateString('es-ES'));
    const saves = getSaves();
    saves[n] = { fecha: new Date().toLocaleString('es-ES'), data: serialize() };
    store.set('rebt.saves', JSON.stringify(saves));
    toast('Guardado «' + n + '»');
    montajesModal();
  }
  else if (m === 'cargar') {
    const saves = getSaves();
    if (saves[id] && deserialize(saves[id].data)) {
      resetHistory(); aplicarModoVista(); update(); buildPalette(); closeModal(); toast('Cargado «' + id + '»');
    } else toast('No se pudo cargar ese montaje');
  }
  else if (m === 'borrarSave') {
    const saves = getSaves(); delete saves[id];
    store.set('rebt.saves', JSON.stringify(saves));
    montajesModal();
  }
});

function nuevoMontaje() {
  S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null; wireDraft = null;
  seed(); fitCamera(); update(); buildPalette(); resetHistory();
}
function seed() {
  S.comps.push({ id: 'c' + (S.nextId++), type: 'red', x: 334, y: 24, props: {}, state: {} });
}

/* ==================================================================
   BARRA SUPERIOR / MODO / VISTA
   ================================================================== */
function setMode(m) {
  S.mode = m;
  document.querySelectorAll('#segMode button').forEach(b => b.classList.toggle('act', b.dataset.mode === m));
  closeSheet();
  update();
}
document.querySelectorAll('#segMode button').forEach(b =>
  b.addEventListener('click', () => setMode(b.dataset.mode)));

function vistaIcono() {
  $('#vistaIco').innerHTML = S.view === 'realista'
    ? `<path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" fill="none" stroke="#cfd6e2" stroke-width="2"/><circle cx="12" cy="12" r="2.6" fill="#cfd6e2"/>`
    : `<path d="M4 4v16M10 4v16M16 4v16" stroke="#cfd6e2" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="9" r="2.2" fill="none" stroke="#cfd6e2" stroke-width="1.8"/><path d="M14.5 14.5l3 3m0-3l-3 3" stroke="#cfd6e2" stroke-width="1.8" stroke-linecap="round"/>`;
}
function aplicarModoVista() {
  document.body.classList.toggle('multifilar', S.view === 'multifilar');
  document.querySelectorAll('#segMode button').forEach(b => b.classList.toggle('act', b.dataset.mode === S.mode));
  vistaIcono();
}
$('#btnVista').addEventListener('click', () => {
  S.view = S.view === 'realista' ? 'multifilar' : 'realista';
  aplicarModoVista();
  render(); autosave();
  toast(S.view === 'realista' ? 'Vista realista' : 'Vista multifilar: fase, neutro y tierra conductor a conductor');
});
$('#btnMenu').addEventListener('click', menuModal);

$('#resChip').addEventListener('click', () => {
  $('#resChip').classList.toggle('open');
  $('#resPanel').classList.toggle('open');
});

$('#btnHintOk').addEventListener('click', () => {
  $('#hint').classList.remove('on');
  store.set('rebt.hint', '1');
});

/* ==================================================================
   ARRANQUE
   ================================================================== */
function fitCamera() {
  const r = svg.getBoundingClientRect();
  const s = clamp(r.width / 840, 0.3, 1.3);
  S.cam = { tx: (r.width - WORLD.w * s) / 2, ty: 14, s };
  updateCamera();
}

window.addEventListener('error', e => { try { toast('Error interno: ' + e.message); } catch (x) {} });

function init() {   // se invoca al final del script, con la Fase 2 ya cargada
  const auto = store.get('rebt.autosave');
  let cargado = false;
  if (auto) cargado = deserialize(auto);
  if (!cargado) { seed(); }
  aplicarModoVista();
  buildPalette();
  if (!cargado || !S.cam) fitCamera();
  update();
  resetHistory();
  if (!store.get('rebt.hint')) $('#hint').classList.add('on');
}
