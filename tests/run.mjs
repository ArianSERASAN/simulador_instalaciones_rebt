/* ==================================================================
   Harness de verificación headless del Simulador REBT.

   Uso:  /opt/node22/bin/node tests/run.mjs
   Sirve el repo por http en un puerto libre, abre la app con
   Playwright (chromium del sistema) y ejecuta escenarios contra el
   motor real (S, simulate, update…), que viven en el ámbito global
   de la página. No forma parte de la PWA (no se precachea).
   ================================================================== */
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { extname, join, normalize } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

/* playwright: primero el node_modules local (CI), después el global del sistema */
let chromium = null;
for (const base of [import.meta.url, '/opt/node22/lib/node_modules/']) {
  try { ({ chromium } = createRequire(base)('playwright')); break; } catch (e) {}
}
if (!chromium) {
  console.error('No se encuentra playwright: ejecuta `npm install playwright` o usa el node del sistema.');
  process.exit(1);
}

const ROOT = normalize(join(fileURLToPath(import.meta.url), '..', '..'));
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json'
};

const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (e) { res.writeHead(404).end('not found'); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

/* ---------- helpers dentro de la página ---------- */
const PAGE_HELPERS = `
  window.__t = {
    reset() {
      S.comps = []; S.wires = []; S.nextId = 1; S.sel = null; S.selWire = null;
      S.reto = null; S.averia = null; S.averiaGen = null; S.noche = false; S.mode = 'aprendiz';
      S.lab = false; S.esquema = null; S.hl = null; S.hlC = null;
      store.del('rebt.antes');
      document.getElementById('retoBar').classList.remove('on');
    },
    msgs(lvl) { return SIM.msgs.filter(m => !lvl || m.lvl === lvl).map(m => m.txt); },
    hasMsg(lvl, frag) { return SIM.msgs.some(m => m.lvl === lvl && m.txt.includes(frag)); }
  };
`;

/* ---------- casos ----------
   Cada caso se ejecuta con page.evaluate; devuelve null si pasa o un
   string con el motivo del fallo. Empieza siempre con __t.reset(). */
const TESTS = [
  ['carga sin errores JS', async page => page.evaluate(() => {
    __t.reset();
    return (typeof S === 'object' && typeof simulate === 'function' && typeof DEFS === 'object')
      ? null : 'faltan globales del motor';
  })],

  ['vivienda de referencia: luz encendida y toma con tierra, sin fallos', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    update();
    if (!SIM.lit[m.luz.id]) return 'la luz debería estar encendida';
    const st = SIM.tomas[m.toma.id];
    if (!st || !st.tension || !st.tierra) return 'la toma debería tener tensión y tierra';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  ['el interruptor apaga la luz', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    m.int1.state.on = false;
    update();
    return SIM.lit[m.luz.id] ? 'la luz debería apagarse al abrir el interruptor' : null;
  })],

  ['cortocircuito sin protecciones: fault=corto', async page => page.evaluate(() => {
    __t.reset();
    const red = mkComp('red', 300, 20);
    mkWire(red, 'L', red, 'N', 'marron');
    update();
    return SIM.fault === 'corto' ? null : 'esperaba fault corto, hay: ' + SIM.fault;
  })],

  ['cortocircuito aguas abajo: dispara el PIA, no el IGA', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    mkWire(m.pia1, 'Lo', m.pia1, 'No', 'marron');
    update();
    if (!m.pia1.state.trip) return 'el PIA 1 debería haber disparado';
    if (m.iga.state.trip) return 'el IGA no debería disparar (selectividad)';
    return null;
  })],

  ['fuga fase-tierra sin diferencial: riesgo declarado', async page => page.evaluate(() => {
    __t.reset();
    const red = mkComp('red', 300, 20);
    const pica = mkComp('pica', 200, 600);
    mkWire(red, 'L', pica, 'PE', 'marron');
    update();
    return SIM.fault === 'fuga' ? null : 'esperaba fault fuga, hay: ' + SIM.fault;
  })],

  ['fuga con diferencial: dispara el diferencial', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    mkWire(m.pia1, 'Lo', m.pica, 'PE', 'marron');
    update();
    return m.dif.state.trip ? null : 'el diferencial debería haber disparado';
  })],

  ['sobrecarga en modo instalador: dispara el PIA del circuito', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.mode = 'instalador';
    m.toma.props.carga = 5500;      // 23,9 A > PIA 16 A
    update();
    if (!m.pia2.state.trip) return 'el PIA de 16 A debería disparar por sobrecarga';
    if (!__t.hasMsg('err', 'Sobrecarga')) return 'falta el mensaje de sobrecarga';
    return null;
  })],

  ['PIA que no protege el cable: aviso normativo', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.mode = 'instalador';
    m.pia2.props.calibre = 32; m.pia2.props.circuito = '';
    update();
    return __t.hasMsg('err', 'no protege un cable') ? null : 'falta el error de calibre vs sección';
  })],

  ['caída de tensión > 3 %: error en instalador', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.mode = 'instalador';
    m.toma.props.carga = 3500;
    for (const w of S.wires) if (w.a.c === m.pia2.id || w.b.c === m.pia2.id) { w.len = 60; w.sec = 1.5; }
    update();
    return __t.hasMsg('err', 'Caída de tensión') ? null : 'falta el error de caída de tensión';
  })],

  ['interruptor cortando el neutro: error declarado', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.wires = S.wires.filter(w => ![m.int1.id, m.luz.id].some(id => w.a.c === id || w.b.c === id));
    mkWire(m.pia1, 'Lo', m.luz, 'L', 'marron');
    mkWire(m.pia1, 'No', m.int1, 'p', 'azul');
    mkWire(m.int1, 's', m.luz, 'N', 'azul');
    update();
    return __t.hasMsg('err', 'cortando el neutro') ? null : 'falta el error de neutro cortado';
  })],

  ['colores: neutro en marrón avisa', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    for (const w of S.wires) if (w.color === 'azul') w.color = 'marron';
    update();
    return __t.hasMsg('warn', 'neutro debe ir siempre en azul') ? null : 'falta el aviso de color del neutro';
  })],

  ['conmutada válida (patrón desde dos puntos)', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.wires = S.wires.filter(w => ![m.int1.id, m.luz.id].some(id => w.a.c === id || w.b.c === id));
    S.comps = S.comps.filter(c => c.id !== m.int1.id);
    const c1 = mkComp('conm', 110, 560), c2 = mkComp('conm', 220, 560);
    mkWire(m.pia1, 'Lo', c1, 'c', 'marron');
    mkWire(c1, 'l1', c2, 'l1', 'negro');
    mkWire(c1, 'l2', c2, 'l2', 'negro');
    mkWire(c2, 'c', m.luz, 'L', 'negro');
    mkWire(m.pia1, 'No', m.luz, 'N', 'azul');
    update();
    return patronConmutada(m.luz, c1, c2) ? null : 'el patrón de conmutada debería ser válido';
  })],

  ['enlace unifamiliar actual: ordenEnlaceOK', async page => page.evaluate(() => {
    __t.reset();
    const red = mkComp('red', 334, 24);
    const cgp = mkComp('cgp', 100, 160);
    const cont = mkComp('contador', 260, 160);
    const icp = mkComp('icp', 420, 160, null, { on: true });
    const iga = mkComp('iga', 540, 160, null, { on: true });
    mkWire(red, 'L', cgp, 'Li', 'marron'); mkWire(red, 'N', cgp, 'Ni', 'azul');
    mkWire(cgp, 'Lo', cont, 'Li', 'marron'); mkWire(cgp, 'No', cont, 'Ni', 'azul');
    mkWire(cont, 'Lo', icp, 'Li', 'marron'); mkWire(cont, 'No', icp, 'Ni', 'azul');
    mkWire(icp, 'Lo', iga, 'Li', 'marron'); mkWire(icp, 'No', iga, 'Ni', 'azul');
    update();
    return ordenEnlaceOK() ? null : 'ordenEnlaceOK debería aceptar Red→CGP→contador→ICP→IGA';
  })],

  ['telerruptor: un pulso cambia el estado', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    S.wires = S.wires.filter(w => ![m.int1.id].some(id => w.a.c === id || w.b.c === id));
    S.comps = S.comps.filter(c => c.id !== m.int1.id);
    const tele = mkComp('tele', 430, DIN_Y, null, {});
    const puls = mkComp('puls', 120, 560);
    S.wires = S.wires.filter(w => !(w.a.c === m.luz.id || w.b.c === m.luz.id));
    mkWire(m.pia1, 'Lo', puls, 'p', 'marron');
    mkWire(puls, 's', tele, 'A1', 'negro');
    mkWire(m.pia1, 'No', tele, 'A2', 'azul');
    mkWire(m.pia1, 'Lo', tele, 'in', 'marron');
    mkWire(tele, 'out', m.luz, 'L', 'negro');
    mkWire(m.pia1, 'No', m.luz, 'N', 'azul');
    update();
    if (SIM.lit[m.luz.id]) return 'la luz debería empezar apagada';
    puls.state.pressed = true; update();
    puls.state.pressed = false; update();
    return SIM.lit[m.luz.id] ? null : 'tras el pulso, el telerruptor debería encender la luz';
  })],

  ['serialize/deserialize conserva el montaje', async page => page.evaluate(() => {
    __t.reset();
    montarVivienda();
    const n = S.comps.length, w = S.wires.length, s = serialize();
    __t.reset();
    if (!deserialize(s)) return 'deserialize devolvió false';
    if (S.comps.length !== n || S.wires.length !== w) return 'se perdieron componentes o cables';
    update();
    return null;
  })],

  /* ---------- Fase 1: red trifásica ---------- */

  ['red3: luz entre L1 y N enciende a 230 V', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const luz = mkComp('luz', 300, 500);
    mkWire(r, 'L1', luz, 'L', 'marron');
    mkWire(r, 'N', luz, 'N', 'azul');
    update();
    if (!SIM.lit[luz.id]) return 'la luz debería encender entre fase y neutro';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  ['red3: luz entre dos fases se quema (400 V) y se puede sustituir', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const luz = mkComp('luz', 300, 500);
    mkWire(r, 'L1', luz, 'L', 'marron');
    mkWire(r, 'L2', luz, 'N', 'negro');
    update();
    if (!luz.state.quemado) return 'la luz debería quemarse a 400 V';
    if (SIM.lit[luz.id]) return 'una luz quemada no puede lucir';
    if (!__t.hasMsg('err', 'DOS FASES')) return 'falta el mensaje de sobretensión';
    // sustituir y recablear bien
    luz.state.quemado = false;
    S.wires = S.wires.filter(w => !(w.b.c === luz.id && w.b.t === 'N'));
    mkWire(r, 'N', luz, 'N', 'azul');
    update();
    return SIM.lit[luz.id] ? null : 'tras sustituirla y recablear debería lucir';
  })],

  ['red3: cortocircuito entre fases sin protecciones', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    mkWire(r, 'L1', r, 'L2', 'marron');
    update();
    if (SIM.fault !== 'corto') return 'esperaba fault corto';
    if (!__t.hasMsg('err', 'dos fases')) return 'el mensaje debería citar el corto entre fases';
    return null;
  })],

  ['red3: corto aguas abajo de un PIA en L3 dispara el PIA', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const pia = mkComp('pia', 270, DIN_Y, { calibre: 16 }, { on: true });
    mkWire(r, 'L3', pia, 'Li', 'gris');
    mkWire(r, 'N', pia, 'Ni', 'azul');
    mkWire(pia, 'Lo', pia, 'No', 'gris');
    update();
    return pia.state.trip ? null : 'el PIA debería disparar por el corto L3-N';
  })],

  ['motor trifásico: funciona con tres fases y tierra', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const m = mkComp('motor3', 300, 500);
    const pica = mkComp('pica', 150, 700);
    mkWire(r, 'L1', m, 'L1', 'marron');
    mkWire(r, 'L2', m, 'L2', 'negro');
    mkWire(r, 'L3', m, 'L3', 'gris');
    mkWire(m, 'PE', pica, 'PE', 'tierra');
    update();
    if (!SIM.lit[m.id]) return 'el motor 3~ debería girar con las tres fases';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  ['motor trifásico: con dos fases no arranca y avisa', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const m = mkComp('motor3', 300, 500);
    const pica = mkComp('pica', 150, 700);
    mkWire(r, 'L1', m, 'L1', 'marron');
    mkWire(r, 'L2', m, 'L2', 'negro');
    mkWire(m, 'PE', pica, 'PE', 'tierra');
    update();
    if (SIM.lit[m.id]) return 'no debería girar con solo dos fases';
    return __t.hasMsg('err', 'falta una fase') ? null : 'falta el aviso de fase ausente';
  })],

  ['red3: fuga de una fase a tierra sin diferencial', async page => page.evaluate(() => {
    __t.reset();
    const r = mkComp('red3', 300, 20);
    const pica = mkComp('pica', 150, 700);
    mkWire(r, 'L2', pica, 'PE', 'negro');
    update();
    return SIM.fault === 'fuga' ? null : 'esperaba fault fuga por L2 a tierra';
  })],

  ['red3: la instalación mono de referencia funciona colgada de L1', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    // sustituir la red mono por la trifásica, alimentando el IGA desde L1
    S.wires = S.wires.filter(w => w.a.c !== m.red.id && w.b.c !== m.red.id);
    S.comps = S.comps.filter(c => c.id !== m.red.id);
    const r3 = mkComp('red3', 280, 20);
    mkWire(r3, 'L1', m.iga, 'Li', 'marron');
    mkWire(r3, 'N', m.iga, 'Ni', 'azul');
    update();
    if (!SIM.lit[m.luz.id]) return 'la luz debería encender alimentada desde L1';
    const st = SIM.tomas[m.toma.id];
    if (!st || !st.tension || !st.tierra) return 'la toma debería tener tensión y tierra';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  /* ---------- Fase 2: CPM y derivación individual ---------- */

  ['chalet con CPM: funciona, enlace en orden y DI detectada', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    S.mode = 'instalador';
    update();
    if (!SIM.lit[m.luz.id]) return 'la luz del chalet debería encender';
    if (!ordenEnlaceOK()) return 'Red → CPM → ICP → IGA debería validar el orden del enlace';
    if (!SIM.di) return 'debería detectarse la derivación individual';
    if (SIM.di.smin !== 10) return 'la DI del chalet es de 10 mm², se detectó ' + SIM.di.smin;
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  ['DI con sección < 6 mm²: error ITC-BT-15', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    S.mode = 'instalador';
    m.diF.sec = 2.5; m.diN.sec = 2.5;
    update();
    return __t.hasMsg('err', 'derivación individual') && __t.hasMsg('err', 'sección mínima')
      ? null : 'falta el error de sección mínima de la DI';
  })],

  ['DI con caída > 1,5 %: error ITC-BT-15', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    S.mode = 'instalador';
    m.toma.props.carga = 3500;
    m.diF.sec = 6; m.diN.sec = 6; m.diF.len = 60;
    update();
    return __t.hasMsg('err', 'derivación individual (máximo 1,5') ? null : 'falta el error de caída en la DI: ' + __t.msgs('err').join(' | ');
  })],

  ['corto aguas abajo de la CPM sin más protecciones: funde la CPM', async page => page.evaluate(() => {
    __t.reset();
    const red = mkComp('red', 180, 24);
    const cpm = mkComp('cpm', 500, 16);
    mkWire(red, 'L', cpm, 'Li', 'marron'); mkWire(red, 'N', cpm, 'Ni', 'azul');
    mkWire(cpm, 'Lo', cpm, 'No', 'marron');
    update();
    if (!cpm.state.fundido) return 'los fusibles de la CPM deberían fundirse';
    if (!__t.hasMsg('err', 'CPM')) return 'el mensaje debería citar la CPM';
    return null;
  })],

  ['CPM mezclada con contador suelto: el orden del enlace no valida', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    mkComp('contador', 600, 300);
    update();
    return ordenEnlaceOK() ? 'no debería validar con CPM y contador a la vez' : null;
  })],

  ['avería a6 (DI subdimensionada): se detecta y se repara', async page => page.evaluate(() => {
    __t.reset();
    const a = AVERIAS.find(x => x.id === 'a6');
    S.mode = 'instalador';
    a.build();
    update();
    if (!__t.msgs('err').length) return 'la avería debería producir errores en la DI';
    if (a.check() === true) return 'la avería no debería darse por resuelta sin reparar';
    // reparación: sección correcta en los dos conductores de la DI
    for (const w of S.wires) if (w.sec === 1.5 && w.len === 25) w.sec = 6;
    update();
    const v = a.check();
    return v === true ? null : 'tras reparar debería validar, dice: ' + v;
  })],

  /* ---------- Fase 3: centralización de contadores ---------- */

  ['edificio de referencia: 3 viviendas con tensión, LGA y DI correctas', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    S.mode = 'instalador';
    update();
    for (const v of m.vivs) if (!SIM.lit[v.id]) return 'todas las viviendas deberían tener tensión';
    if (!SIM.lga) return 'debería detectarse la LGA';
    if (SIM.lga.smin !== 16) return 'la LGA del edificio es de 16 mm², se detectó ' + SIM.lga.smin;
    if (SIM.lga.lim !== 0.5) return 'con una sola centralización el límite de la LGA es 0,5 %';
    if (SIM.dis.length !== 3) return 'deberían detectarse 3 derivaciones individuales, hay ' + SIM.dis.length;
    if (!SIM.dis.every(d => d.lim === 1)) return 'con centralización, el límite de las DI es 1 %';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    if (esquemaDetectado() !== '2.2.1') return 'el esquema detectado debería ser 2.2.1, es ' + esquemaDetectado();
    return null;
  })],

  ['edificio: cada contador mide solo su vivienda', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    m.vivs[0].props.potencia = 5750;
    m.vivs[1].props.potencia = 1150;
    m.vivs[2].state.on = false;
    update();
    if (SIM.pMedida[m.conts[0].id] !== 5750) return 'el contador 1 debería medir 5750 W';
    if (SIM.pMedida[m.conts[1].id] !== 1150) return 'el contador 2 debería medir 1150 W';
    if (SIM.pMedida[m.conts[2].id] !== 0) return 'el contador 3 debería medir 0 W (vivienda desconectada)';
    return null;
  })],

  ['edificio: LGA de sección insuficiente avisa (ITC-BT-14)', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    S.mode = 'instalador';
    for (const w of S.wires) if (w.sec === 16 && w.a.c === m.cgp.id) w.sec = 6;
    update();
    return __t.hasMsg('err', 'línea general de alimentación') ? null : 'falta el error de sección de la LGA';
  })],

  ['edificio: todas las viviendas en la misma fase avisa de desequilibrio', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    // mover las derivaciones de las viviendas 2 y 3 a la fila L1 del embarrado
    for (const w of S.wires) {
      if (w.b.c === m.fusis[1].id && w.a.c === m.emb.id) w.a.t = 'a3';
      if (w.b.c === m.fusis[2].id && w.a.c === m.emb.id) w.a.t = 'a4';
    }
    update();
    return __t.hasMsg('warn', 'MISMA fase') ? null : 'falta el aviso de reparto de fases';
  })],

  ['edificio: corto en una DI funde solo su fusible de seguridad', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    mkWire(m.conts[1], 'Lo', m.conts[1], 'No', 'negro', 10);   // corto tras el contador 2
    update();
    if (!m.fusis[1].state.fundido) return 'debería fundirse el fusible de la vivienda 2';
    if (m.fusis[0].state.fundido || m.fusis[2].state.fundido) return 'los demás fusibles deben sobrevivir';
    if (m.cgp.state.fundido) return 'la CGP no debería fundirse (selectividad)';
    if (!SIM.lit[m.vivs[0].id] || !SIM.lit[m.vivs[2].id]) return 'las otras viviendas deben seguir con tensión';
    return null;
  })],

  ['edificio: sin IGM avisa la centralización', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    // puentear y eliminar el IGM
    S.wires = S.wires.filter(w => w.a.c !== m.igm.id && w.b.c !== m.igm.id);
    S.comps = S.comps.filter(c => c.id !== m.igm.id);
    mkWire(m.cgp, 'L1o', m.emb, 'a1', 'marron', 16); mkWire(m.cgp, 'L2o', m.emb, 'b1', 'negro', 16);
    mkWire(m.cgp, 'L3o', m.emb, 'c1', 'gris', 16); mkWire(m.cgp, 'No', m.emb, 'n1', 'azul', 16);
    update();
    return __t.hasMsg('warn', 'IGM') ? null : 'falta el aviso de IGM en cabecera';
  })],

  ['edificio: vivienda sin tierra en su DI da error', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio();
    S.wires = S.wires.filter(w => !(w.a.c === m.vivs[0].id && w.a.t === 'PE') && !(w.b.c === m.vivs[0].id && w.b.t === 'PE'));
    update();
    return __t.hasMsg('err', 'conductor de protección') ? null : 'falta el error de tierra en la DI';
  })],

  ['avería a7 (fusible de seguridad fundido): se detecta y se repara', async page => page.evaluate(() => {
    __t.reset();
    const a = AVERIAS.find(x => x.id === 'a7');
    a.build();
    update();
    if (a.check() === true) return 'no debería validar con el fusible fundido';
    const fu = S.comps.find(c => c.type === 'fusi' && c.state.fundido);
    if (!fu) return 'debería haber un fusible fundido oculto';
    fu.state.fundido = false;
    update();
    const v = a.check();
    return v === true ? null : 'tras sustituir el fusible debería validar, dice: ' + v;
  })],

  ['reto r10: el edificio de referencia lo supera', async page => page.evaluate(() => {
    __t.reset();
    montarEdificio();
    S.mode = 'instalador';
    update();
    const r = RETOS.find(x => x.id === 'r10');
    const v = r.check();
    return v === true ? null : 'el edificio de referencia debería superar el reto: ' + v;
  })],

  /* ---------- Fase 4: varias centralizaciones (2.2.2) ---------- */

  ['edificio por plantas: 4 viviendas, LGA común con límite 1 %', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio2();
    S.mode = 'instalador';
    update();
    for (const v of m.vivs) if (!SIM.lit[v.id]) return 'las 4 viviendas deberían tener tensión';
    if (!SIM.lga) return 'debería detectarse la LGA';
    if (SIM.lga.lim !== 1) return 'con centralizaciones parciales el límite de la LGA es 1 %, es ' + SIM.lga.lim;
    if (SIM.lga.smin !== 16) return 'la LGA es de 16 mm² (las DI de 10 mm² no deben contaminarla): ' + SIM.lga.smin;
    if (SIM.dis.length !== 4) return 'deberían detectarse 4 DI, hay ' + SIM.dis.length;
    if (esquemaDetectado() !== '2.2.2') return 'el esquema detectado debería ser 2.2.2';
    if (__t.msgs('err').length) return 'errores inesperados: ' + __t.msgs('err').join(' | ');
    return null;
  })],

  ['edificio por plantas: un corto en un embarrado funde la CGP, no los fusibles', async page => page.evaluate(() => {
    __t.reset();
    const m = montarEdificio2();
    mkWire(m.embs[1], 'a5', m.embs[1], 'n5', 'marron', 16);   // corto en la centralización B
    update();
    if (!m.cgp.state.fundido) return 'la CGP debería fundirse (el corto es anterior a los fusibles de seguridad)';
    if (m.fusis.some(f => f.state.fundido)) return 'los fusibles de seguridad no deben fundirse';
    return null;
  })],

  ['reto r11: el edificio por plantas lo supera', async page => page.evaluate(() => {
    __t.reset();
    montarEdificio2();
    S.mode = 'instalador';
    update();
    const r = RETOS.find(x => x.id === 'r11');
    const v = r.check();
    return v === true ? null : 'el edificio por plantas debería superar el reto: ' + v;
  })],

  ['esquema declarado distinto del montaje: el boletín lo detecta', async page => page.evaluate(() => {
    __t.reset();
    montarChalet();
    S.esquema = '2.2.1';
    update();
    return esquemaDetectado() === '2.1' && S.esquema !== esquemaDetectado()
      ? null : 'con CPM el esquema detectado debe ser 2.1 y no casar con 2.2.1';
  })],

  /* ---------- Fase 5: laboratorio (solver real) ---------- */

  ['lab · ley de Ohm: 9 V sobre 100 Ω ≈ 90 mA en el amperímetro', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 9 });
    const amp = mkComp('amperimetro', 250, 100);
    const res = mkComp('resistencia', 400, 100, { r: 100 });
    mkWire(pila, 'p', amp, 'a', 'negro'); mkWire(amp, 'b', res, 'a', 'negro');
    mkWire(res, 'b', pila, 'm', 'negro');
    update();
    const i = Math.abs(SIM.amp[amp.id] || 0);
    return (i > 0.085 && i < 0.094) ? null : 'esperaba ~0,09 A, hay ' + i;
  })],

  ['lab · serie vs paralelo: el brillo cambia de verdad', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    // dos bombillas 12 V / 5 W en PARALELO con pila de 9 V
    let pila = mkComp('pila', 100, 100, { v: 9 });
    let b1 = mkComp('bombilla', 260, 100, { vn: 12, wn: 5 });
    let b2 = mkComp('bombilla', 400, 100, { vn: 12, wn: 5 });
    mkWire(pila, 'p', b1, 'a', 'negro'); mkWire(pila, 'p', b2, 'a', 'negro');
    mkWire(b1, 'b', pila, 'm', 'negro'); mkWire(b2, 'b', pila, 'm', 'negro');
    update();
    const bp1 = SIM.bulb[b1.id], bp2 = SIM.bulb[b2.id];
    if (!bp1 || !bp2 || bp1.b < 0.4 || bp2.b < 0.4) return 'en paralelo deberían brillar > 40 %';
    // las mismas en SERIE: mucho menos brillo
    __t.reset(); S.lab = true;
    pila = mkComp('pila', 100, 100, { v: 9 });
    b1 = mkComp('bombilla', 260, 100, { vn: 12, wn: 5 });
    b2 = mkComp('bombilla', 400, 100, { vn: 12, wn: 5 });
    mkWire(pila, 'p', b1, 'a', 'negro'); mkWire(b1, 'b', b2, 'a', 'negro');
    mkWire(b2, 'b', pila, 'm', 'negro');
    update();
    const bs1 = SIM.bulb[b1.id], bs2 = SIM.bulb[b2.id];
    if (!bs1 || !bs2 || bs1.b > 0.2 || bs2.b > 0.2) return 'en serie deberían brillar < 20 %';
    if (!SIM.lit[b1.id] || !SIM.lit[b2.id]) return 'en serie deben lucir (tenue), no apagarse';
    return null;
  })],

  ['lab · sobretensión: la bombilla se funde y se puede sustituir', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 24 });
    const b1 = mkComp('bombilla', 260, 100, { vn: 6, wn: 3 });
    mkWire(pila, 'p', b1, 'a', 'negro'); mkWire(b1, 'b', pila, 'm', 'negro');
    update();
    if (!b1.state.quemado) return 'con 24 V una bombilla de 6 V debe fundirse';
    if (SIM.lit[b1.id]) return 'fundida no puede lucir';
    if (!__t.msgs('err').length) return 'falta el mensaje de bombilla fundida';
    b1.state.quemado = false; pila.props.v = 4.5;
    update();
    return SIM.lit[b1.id] ? null : 'con 4,5 V debería lucir tras sustituirla';
  })],

  ['lab · divisor de tensión: el voltímetro lee la mitad', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 12 });
    const r1c = mkComp('resistencia', 260, 100, { r: 100 });
    const r2c = mkComp('resistencia', 400, 100, { r: 100 });
    const vm = mkComp('voltimetro', 400, 260);
    mkWire(pila, 'p', r1c, 'a', 'negro'); mkWire(r1c, 'b', r2c, 'a', 'negro');
    mkWire(r2c, 'b', pila, 'm', 'negro');
    mkWire(vm, 'a', r2c, 'a', 'negro'); mkWire(vm, 'b', r2c, 'b', 'negro');
    update();
    const v = Math.abs(SIM.volt[vm.id] || 0);
    return (v > 5.7 && v < 6.2) ? null : 'esperaba ~6 V en el divisor, hay ' + v;
  })],

  ['lab · el fusible funde con el corto y salva la bombilla', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 12 });
    const fu = mkComp('fusiblelab', 250, 100, { in: 1 });
    const b1 = mkComp('bombilla', 400, 100, { vn: 12, wn: 5 });
    mkWire(pila, 'p', fu, 'a', 'negro'); mkWire(fu, 'b', b1, 'a', 'negro');
    mkWire(b1, 'b', pila, 'm', 'negro');
    update();
    if (fu.state.fundido) return 'en régimen normal (0,42 A) el fusible de 1 A no debe fundirse';
    mkWire(b1, 'a', b1, 'b', 'negro');   // cortocircuito sobre la bombilla
    update();
    if (!fu.state.fundido) return 'el fusible debería fundirse con el corto';
    if (b1.state.quemado) return 'la bombilla debe quedar intacta';
    if (SIM.lit[b1.id]) return 'con el fusible fundido no hay corriente';
    const r = RETOS.find(x => x.id === 'rl6');
    const v = r.check();
    return v === true ? null : 'el reto rl6 debería validar: ' + v;
  })],

  ['lab · el interruptor y el reto rl1', async page => page.evaluate(() => {
    __t.reset(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 4.5 });
    const sw = mkComp('int', 250, 100, null, { on: false });
    const b1 = mkComp('bombilla', 400, 100, { vn: 6, wn: 3 });
    mkWire(pila, 'p', sw, 'p', 'negro'); mkWire(sw, 's', b1, 'a', 'negro');
    mkWire(b1, 'b', pila, 'm', 'negro');
    update();
    if (SIM.lit[b1.id]) return 'con el interruptor abierto no debe lucir';
    sw.state.on = true; update();
    if (!SIM.lit[b1.id]) return 'con el interruptor cerrado debe lucir';
    const r = RETOS.find(x => x.id === 'rl1');
    const v = r.check();
    return v === true ? null : 'el reto rl1 debería validar: ' + v;
  })],

  /* ---------- Fase 6: caída en cascada (enlace + interior) ---------- */

  ['la tensión del receptor descuenta LGA + DI + circuito', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    S.mode = 'instalador';
    m.toma.props.carga = 3500;
    m.diF.len = 25; m.diN.len = 25;
    update();
    const vluz = SIM.vlit[m.luz.id];
    if (vluz == null) return 'la luz encendida debería tener tensión calculada';
    const vDI = SIM.di.pct * 230 / 100;
    if (vDI < 1) return 'con 15,5 A y 25 m la DI debería caer más de 1 V (cae ' + vDI + ')';
    const c1 = SIM.circuits.find(ci => ci.circuito === 'C1');
    const vCirc = c1.pct * 230 / 100;
    const esperado = 230 - vDI - vCirc;
    if (Math.abs(vluz - esperado) > 0.05) return `esperaba ${esperado} V en la luz, hay ${vluz}`;
    return null;
  })],

  ['sin carga apenas hay caída en cascada', async page => page.evaluate(() => {
    __t.reset();
    const m = montarChalet();
    S.mode = 'instalador';
    m.toma.props.carga = 0;
    update();
    const vluz = SIM.vlit[m.luz.id];
    return (vluz > 229.5 && vluz <= 230) ? null : 'sin cargas grandes deberían llegar ~230 V, llegan ' + vluz;
  })],

  /* ---------- Fase 7: examen y proyecto ---------- */

  ['examen: el banco de preguntas es consistente y con bloques', async page => page.evaluate(() => {
    if (EXAM_QS.length < 100) return 'el banco debería tener al menos 100 preguntas, hay ' + EXAM_QS.length;
    for (const q of EXAM_QS) {
      if (!q.q || !q.itc || !q.exp) return 'pregunta incompleta: ' + q.q;
      if (!Array.isArray(q.ops) || q.ops.length !== 4) return 'cada pregunta lleva 4 opciones: ' + q.q;
      if (!(q.ok >= 0 && q.ok <= 3)) return 'índice de respuesta inválido: ' + q.q;
    }
    const bloques = bloquesExamen();
    if (bloques.size < 4) return 'debería haber al menos 4 bloques, hay ' + bloques.size;
    for (const [b, idxs] of bloques) {
      if (idxs.length < 6) return `el bloque «${b}» debería tener al menos 6 preguntas, tiene ${idxs.length}`;
    }
    return null;
  })],

  ['panel de progreso: se abre con los contadores', async page => page.evaluate(() => {
    progresoModal();
    const html = document.getElementById('modalBody').innerHTML;
    closeModal();
    if (!html.includes('Tu progreso')) return 'debería abrirse el panel';
    if (!html.includes('Retos guiados') || !html.includes('Averías')) return 'faltan secciones del progreso';
    return null;
  })],

  ['examen: baraja 10 preguntas únicas y puntúa', async page => page.evaluate(() => {
    const idxs = examBarajar(EXAM_QS.map((q, i) => i), 10);
    if (idxs.length !== 10 || new Set(idxs).size !== 10) return 'deberían salir 10 preguntas distintas';
    store.del('rebt.exam');
    startExamen(idxs);
    for (let i = 0; i < 10; i++) {
      const qi = EXAM.qs[EXAM.i];
      examResponder(i < 7 ? EXAM_QS[qi].ok : (EXAM_QS[qi].ok + 1) % 4);   // 7 aciertos, 3 fallos
      if (i < 9) { EXAM.i++; }
    }
    examFinal();
    const st = JSON.parse(store.get('rebt.exam'));
    if (st.intentos !== 1) return 'debería registrarse 1 intento';
    if (st.record !== 7) return 'la mejor nota debería ser 7, es ' + st.record;
    if (st.falladas.length !== 3) return 'deberían quedar 3 falladas para repasar, hay ' + st.falladas.length;
    return null;
  })],

  ['proyecto: coeficiente de simultaneidad de la ITC-BT-10', async page => page.evaluate(() => {
    const casos = [[1, 1], [4, 3.8], [10, 8.5], [21, 15.3], [25, 17.3]];
    for (const [n, c] of casos) {
      if (Math.abs(coefSimultaneidad(n) - c) > 0.001) return `coef(${n}) debería ser ${c}, es ${coefSimultaneidad(n)}`;
    }
    return null;
  })],

  ['proyecto: previsión de un edificio de 10 viviendas', async page => page.evaluate(() => {
    const r = previsionEdificio({ nBas: 10, nElev: 0, wServicios: 8000, m2Locales: 50, m2GarajeNat: 0, m2GarajeForz: 100 });
    if (Math.abs(r.viv - 8.5 * 5750) > 0.01) return 'viviendas: esperaba 48.875 W, hay ' + r.viv;
    if (r.locales !== 5000) return 'locales 50 m² → 5.000 W, hay ' + r.locales;
    if (r.garaje !== 2000) return 'garaje forzado 100 m² → 2.000 W, hay ' + r.garaje;
    if (Math.abs(r.total - 63875) > 0.01) return 'total esperado 63.875 W, hay ' + r.total;
    const r2b = previsionEdificio({ nBas: 0, nElev: 0, wServicios: 0, m2Locales: 20, m2GarajeNat: 0, m2GarajeForz: 0 });
    if (r2b.locales !== 3450) return 'un local pequeño aplica el mínimo de 3.450 W';
    return null;
  })],

  /* ---------- Fase 8: deshacer/rehacer, duplicar, etiquetas ---------- */

  ['deshacer y rehacer restauran el montaje', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    update();
    const n = S.comps.length;
    delComp(m.luz.id);
    if (S.comps.length !== n - 1) return 'delComp debería eliminar la luz';
    undo();
    if (S.comps.length !== n || !S.comps.some(c => c.type === 'luz')) return 'undo debería restaurar la luz';
    redo();
    if (S.comps.length !== n - 1) return 'redo debería volver a eliminarla';
    undo();
    return S.comps.length === n ? null : 'el segundo undo debería restaurar de nuevo';
  })],

  ['deshacer también recupera cables y propiedades', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    update();
    const nw = S.wires.length;
    delWire(S.wires[0].id);
    histSnap(); m.pia2.props.calibre = 32;
    undo();
    const p2 = byId(m.pia2.id);   // deserialize recrea los objetos
    if (!p2 || p2.props.calibre !== 16) return 'undo debería restaurar el calibre 16';
    undo();
    return S.wires.length === nw ? null : 'undo debería restaurar el cable borrado';
  })],

  ['duplicar conserva las propiedades y crea id nuevo', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const pia = mkComp('pia', 270, DIN_Y, { calibre: 25, circuito: 'C3' }, { on: true });
    update();
    // duplicado manual por la misma vía que el botón de la ficha
    const d = DEFS.pia;
    const n2 = { id: 'c' + (S.nextId++), type: 'pia', x: 0, y: 0, props: JSON.parse(JSON.stringify(pia.props)), state: d.state() };
    placeComp(n2, pia.x + 60, pia.y + 40);
    S.comps.push(n2); update();
    if (n2.props.calibre !== 25 || n2.props.circuito !== 'C3') return 'el duplicado debería copiar las props';
    if (n2.id === pia.id) return 'el duplicado necesita id propio';
    n2.props.calibre = 10;
    return pia.props.calibre === 25 ? null : 'las props deben ser copias independientes';
  })],

  ['las etiquetas se guardan y sobreviven al guardado', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    m.pia1.props.tag = 'C1 salón';
    update();
    const s = serialize();
    __t.reset();
    deserialize(s);
    const pia = S.comps.find(c => c.props.tag === 'C1 salón');
    return pia ? null : 'la etiqueta debería sobrevivir a serialize/deserialize';
  })],

  /* ---------- Fase 9: multímetro y camino de la corriente ---------- */

  ['multímetro REBT: 230 fase-neutro, 400 entre fases, 0 neutro-tierra', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    update();
    let r = medirEntre(K(m.pia1.id, 'Lo'), K(m.pia1.id, 'No'));
    if (r.v !== 230) return 'fase-neutro deberían ser 230 V, hay ' + r.v;
    r = medirEntre(K(m.pia1.id, 'No'), K(m.pica.id, 'PE'));
    if (r.v !== 0) return 'neutro-tierra deberían ser 0 V, hay ' + r.v;
    r = medirEntre(K(m.pia1.id, 'Lo'), K(m.pica.id, 'PE'));
    if (r.v !== 230) return 'fase-tierra deberían ser 230 V (TT), hay ' + r.v;
    r = medirEntre(K(m.iga.id, 'Li'), K(m.iga.id, 'Lo'));
    if (!r.cont || r.v !== 0) return 'a través del IGA cerrado: continuidad y 0 V';
    m.iga.state.on = false; update();
    r = medirEntre(K(m.iga.id, 'Li'), K(m.iga.id, 'Lo'));
    if (r.cont) return 'con el IGA abierto no hay continuidad entre sus bornes';
    // trifásica: 400 V entre fases
    __t.reset();
    const r3 = mkComp('red3', 280, 20);
    update();
    r = medirEntre(K(r3.id, 'L1'), K(r3.id, 'L2'));
    return r.v === 400 ? null : 'entre L1 y L2 deberían ser 400 V, hay ' + r.v;
  })],

  ['multímetro en el laboratorio: lee la tensión real', async page => page.evaluate(() => {
    __t.reset(); histClear(); S.lab = true;
    const pila = mkComp('pila', 100, 100, { v: 12 });
    const r1c = mkComp('resistencia', 260, 100, { r: 100 });
    const r2c = mkComp('resistencia', 400, 100, { r: 100 });
    mkWire(pila, 'p', r1c, 'a', 'negro'); mkWire(r1c, 'b', r2c, 'a', 'negro');
    mkWire(r2c, 'b', pila, 'm', 'negro');
    update();
    const r = medirEntre(K(r2c.id, 'a'), K(r2c.id, 'b'));
    return (r.v > 5.7 && r.v < 6.2) ? null : 'sobre una resistencia del divisor deberían leerse ~6 V, hay ' + r.v;
  })],

  ['camino de la corriente: incluye su circuito y excluye los demás', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    update();
    const cs = caminoReceptor(m.luz);
    if (!cs || !cs.size) return 'debería trazarse el camino de la luz encendida';
    const deLuz = S.wires.filter(w => w.a.c === m.luz.id || w.b.c === m.luz.id).map(w => w.id);
    if (!deLuz.every(id => cs.has(id))) return 'el camino debe incluir los cables de la lámpara';
    const deToma = S.wires.filter(w => w.a.c === m.toma.id || w.b.c === m.toma.id).map(w => w.id);
    if (deToma.some(id => cs.has(id))) return 'el camino de la luz no debe pasar por la toma';
    const acometida = S.wires.filter(w => w.a.c === m.red.id || w.b.c === m.red.id).map(w => w.id);
    if (!acometida.every(id => cs.has(id))) return 'el camino debe llegar hasta la red';
    m.int1.state.on = false; update();
    return caminoReceptor(m.luz) === null ? null : 'con el interruptor abierto no hay camino de fase';
  })],

  ['los errores llevan solución y señalan al culpable', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    // quitar la tierra de la toma: error con fix y hl al componente
    S.wires = S.wires.filter(w => !(w.a.c === m.toma.id && w.a.t === 'PE') && !(w.b.c === m.toma.id && w.b.t === 'PE'));
    update();
    const msg = SIM.msgs.find(x => x.txt.includes('no tiene tierra'));
    if (!msg) return 'debería avisar de la toma sin tierra';
    if (!msg.fix || msg.fix.length < 30) return 'el error debería llevar una solución explicada';
    if (!msg.hl || !msg.hl.c || !msg.hl.c.includes(m.toma.id)) return 'el error debería señalar la toma';
    // sobrecarga: señala PIA y cargas, con fix
    __t.reset();
    const m2 = montarVivienda();
    S.mode = 'instalador';
    m2.toma.props.carga = 5500;
    update();
    const sob = SIM.msgs.find(x => x.txt.includes('Sobrecarga'));
    if (!sob || !sob.fix || !sob.hl || !sob.hl.c.includes(m2.pia2.id)) return 'la sobrecarga debería llevar fix y señalar su PIA';
    return null;
  })],

  ['el interruptor que corta el neutro señala al interruptor', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const a = AVERIAS.find(x => x.id === 'a1');
    a.build(); S.averia = null;
    update();
    const msg = SIM.msgs.find(x => x.txt.includes('cortando el neutro'));
    if (!msg) return 'debería detectar el neutro cortado';
    if (!msg.hl || !msg.hl.c || !msg.hl.c.length) return 'debería señalar el interruptor culpable';
    const c = byId(msg.hl.c[0]);
    return c && c.type === 'int' ? null : 'el señalado debería ser el interruptor';
  })],

  /* ---------- Fase 10: averías generativas ---------- */

  ['avería generada: siempre detectable, en tres niveles', async page => page.evaluate(() => {
    for (let i = 0; i < 12; i++) {
      const nivel = (i % 3) + 1;
      __t.reset(); histClear();
      generarAveria(nivel);
      closeModal();
      if (S.averia !== 'gen' || !S.averiaGen) return 'debería quedar activa la avería generada';
      if (!S.averiaGen.sintomas.length) return 'la avería debe tener síntomas';
      if (nivel >= 3 && S.averiaGen.sintomas.length < 2) return 'el nivel 3 debe tener al menos 2 fallos';
      if (checkAveriaGen() === true) return `intento ${i}: la avería generada (nivel ${nivel}) no es detectable`;
    }
    exitReto();
    return null;
  })],

  ['avería generada: reparar el fallo la da por resuelta', async page => page.evaluate(() => {
    __t.reset(); histClear();
    // fallo determinista: tierra de la toma quitada sobre la vivienda de referencia
    const m = montarVivienda();
    const mut = AVERIA_MUTS.find(x => x.id === 'tierra');
    const sintoma = mut.f();
    if (!sintoma) return 'el mutador de tierra debería aplicar en la vivienda';
    S.averia = 'gen';
    S.averiaGen = { nivel: 1, sintomas: [sintoma], luces: 1, tomas: 1, vivs: 0 };
    if (checkAveriaGen() === true) return 'con la tierra quitada no debería validar';
    mkWire(m.toma, 'PE', m.borne, 'p2', 'tierra', 2.5);   // reparación
    const v = checkAveriaGen();
    exitReto();
    return v === true ? null : 'tras reparar debería validar, dice: ' + v;
  })],

  ['avería generada: el fusible fundido se detecta y se repara', async page => page.evaluate(() => {
    __t.reset(); histClear();
    montarEdificio();
    const mut = AVERIA_MUTS.find(x => x.id === 'fusible');
    if (!mut.f()) return 'el mutador de fusible debería aplicar en el edificio';
    S.averia = 'gen';
    S.averiaGen = { nivel: 2, sintomas: ['x'], luces: 0, tomas: 0, vivs: 3 };
    if (checkAveriaGen() === true) return 'con un fusible fundido no debería validar';
    for (const c of S.comps) if (c.state && c.state.fundido) c.state.fundido = false;
    const v = checkAveriaGen();
    exitReto();
    return v === true ? null : 'tras sustituir el fusible debería validar, dice: ' + v;
  })],

  /* ---------- Fase 11: captura y compartir ---------- */

  ['la captura SVG contiene el montaje recortado', async page => page.evaluate(() => {
    __t.reset(); histClear();
    montarVivienda();
    update();
    const xml = svgCapturaXML();
    if (!xml || !xml.startsWith('<svg')) return 'debería generarse un SVG';
    if (!xml.includes('viewBox')) return 'el SVG debe llevar viewBox recortado';
    if (xml.includes('term-hit') || xml.includes('class="whit"')) return 'las zonas táctiles no deben exportarse';
    if (xml.length < 4000) return 'el SVG parece vacío: ' + xml.length + ' bytes';
    __t.reset(); update();
    return svgCapturaXML() === null ? null : 'sin componentes no hay nada que capturar';
  })],

  /* ---------- Fase 12: volúmenes de baño (ITC-BT-27) ---------- */

  ['baño: toma y mecanismo en volúmenes prohibidos dan error', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    mkComp('banera', 60, 500);
    // la toma dentro de la bañera (V1) y un interruptor en V2
    m.toma.x = 100; m.toma.y = 520;
    const sw2 = mkComp('int', 270, 470);
    update();
    if (!__t.hasMsg('err', 'volumen 1 del baño')) return 'la toma en V1 debería dar error: ' + __t.msgs('err').join(' | ');
    if (!__t.hasMsg('err', 'mecanismo')) return 'el interruptor en V2 debería dar error';
    // luz sobre la bañera
    m.luz.x = 120; m.luz.y = 510;
    update();
    if (!__t.hasMsg('err', 'luminaria en el volumen 1')) return 'la luz en V1 debería dar error';
    // todo fuera de los volúmenes: sin errores de baño
    m.toma.x = 560; m.toma.y = 600; m.luz.x = 500; m.luz.y = 850; m.int1.x = 560; m.int1.y = 850;
    S.comps = S.comps.filter(c => c.id !== sw2.id);
    update();
    return SIM.msgs.some(x => (x.itc || '').includes('ITC-BT-27') && x.lvl === 'err') ? 'fuera de los volúmenes no debería haber errores de baño' : null;
  })],

  ['reto r12: el baño reglamentario se supera', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const m = montarVivienda();
    mkComp('banera', 60, 500);
    // interruptor y toma al volumen 3; la luz queda en V3
    m.int1.x = 362; m.int1.y = 520;
    m.toma.x = 354; m.toma.y = 680;
    update();
    const r = RETOS.find(x => x.id === 'r12');
    const v = r.check();
    if (v !== true) return 'el baño reglamentario debería superar el reto: ' + v;
    // con la toma junto a la bañera debe fallar
    m.toma.x = 100; m.toma.y = 520;
    update();
    return r.check() === true ? 'con la toma en V1 no debería validar' : null;
  })],

  /* ---------- Fase 14: aislamiento de modos ---------- */

  ['al salir de una avería se restaura el montaje anterior', async page => page.evaluate(() => {
    __t.reset(); histClear();
    montarVivienda();
    mkComp('luz', 600, 760);           // marca distintiva: 2 luces
    update();
    startAveria('a2'); closeModal();
    if (S.comps.filter(c => c.type === 'luz').length !== 1) return 'la avería a2 monta una sola luz';
    if (!store.get('rebt.antes')) return 'debería guardarse el montaje del usuario';
    exitReto();
    if (S.comps.filter(c => c.type === 'luz').length !== 2) return 'al salir deberían volver las 2 luces del usuario';
    if (S.averia || store.get('rebt.antes')) return 'avería y copia de seguridad deberían quedar limpias';
    return null;
  })],

  ['el deshacer no puede escaparse de la avería', async page => page.evaluate(() => {
    __t.reset(); histClear();
    montarVivienda(); update();
    startAveria('a4'); closeModal();
    const n = S.comps.length;
    undo();                            // no hay historial previo al ejercicio
    if (S.comps.length !== n || S.averia !== 'a4') return 'undo no debería salirse del ejercicio';
    exitReto();
    return null;
  })],

  ['en una avería no se pueden desmontar aparatos (los cables sí)', async page => page.evaluate(() => {
    __t.reset(); histClear();
    startAveria('a4'); closeModal();
    const n = S.comps.length, w = S.wires.length;
    delComp(S.comps.find(c => c.type === 'luz').id);
    if (S.comps.length !== n) return 'delComp debería estar bloqueado en avería';
    delWire(S.wires[0].id);
    if (S.wires.length !== w - 1) return 'los cables sí deben poder quitarse (es parte de reparar)';
    exitReto();
    return null;
  })],

  ['el ejercicio activo sobrevive a guardar/recargar', async page => page.evaluate(() => {
    __t.reset(); histClear();
    generarAveria(1); closeModal();
    const sint = S.averiaGen.sintomas.length;
    const s = serialize();
    __t.reset();
    if (!deserialize(s)) return 'deserialize falló';
    if (S.averia !== 'gen' || !S.averiaGen || S.averiaGen.sintomas.length !== sint) return 'la avería debería sobrevivir al guardado';
    restaurarBarra();
    if (!document.getElementById('retoBar').classList.contains('on')) return 'la barra del ejercicio debería reaparecer';
    exitReto();
    return null;
  })],

  ['el examen no se pierde tocando fuera del cuadro', async page => page.evaluate(() => {
    startExamen([0, 1, 2]);
    const modal = document.getElementById('modal');
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    if (!modal.classList.contains('on')) return 'el modal del examen no debe cerrarse tocando fuera';
    if (!EXAM) return 'el examen debería seguir en curso';
    EXAM = null; closeModal();         // abandono explícito
    modal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    return null;
  })],

  ['un reto empieza con lienzo vacío y al salir vuelve tu montaje', async page => page.evaluate(() => {
    __t.reset(); histClear();
    montarVivienda(); mkComp('luz', 600, 760); update();   // montaje del usuario: 2 luces
    startReto('r1'); closeModal();
    if (S.comps.length !== 0) return 'el reto debería empezar con el lienzo vacío, hay ' + S.comps.length;
    if (S.reto !== 'r1') return 'el reto debería quedar activo';
    if (!store.get('rebt.antes')) return 'debería guardarse el montaje del usuario';
    exitReto();
    if (S.reto || store.get('rebt.antes')) return 'al salir no debe quedar reto ni copia';
    return S.comps.filter(c => c.type === 'luz').length === 2 ? null : 'al salir debería volver el montaje con 2 luces';
  })],

  ['reto superado: guarda el montaje del reto y restaura el tuyo', async page => page.evaluate(() => {
    __t.reset(); histClear();
    const saves0 = getSaves(); delete saves0['Reto: La primera luz']; store.set('rebt.saves', JSON.stringify(saves0));
    montarVivienda(); mkComp('luz', 600, 760); update();
    startReto('r1'); closeModal();
    montarVivienda();            // la solución del reto (válida para r1)
    update();
    document.getElementById('btnRetoCheck').click();
    closeModal();
    if (S.reto) return 'el reto debería cerrarse al superarse';
    if (!retosDone().r1) return 'debería quedar marcado como superado';
    if (!getSaves()['Reto: La primera luz']) return 'el montaje del reto debería guardarse en Mis montajes';
    return S.comps.filter(c => c.type === 'luz').length === 2 ? null : 'tras superar el reto debería volver tu montaje';
  })],

  ['un reto de laboratorio abre el lab con lienzo limpio y lo restaura', async page => page.evaluate(() => {
    __t.reset(); histClear();
    startReto('rl1'); closeModal();
    if (!S.lab) return 'rl1 debería abrir el laboratorio';
    if (S.comps.length !== 0) return 'el lienzo del reto debería estar vacío';
    mkComp('pila', 100, 100); update();
    exitReto();
    if (!S.lab) return 'al salir seguimos en el laboratorio (con su contenido anterior)';
    if (S.reto) return 'el reto debería quedar cerrado';
    toggleLab(false);
    return null;
  })],

  /* ---------- Fase 15: pistas, ejemplos y retos sin soluciones ---------- */

  ['todos los retos tienen 3 pistas y se registran al usarlas', async page => page.evaluate(() => {
    for (const r of RETOS) {
      const p = RETO_PISTAS[r.id];
      if (!p || p.length !== 3) return 'el reto ' + r.id + ' debería tener 3 pistas';
      if (p.some(x => !x || x.length < 20)) return 'pistas demasiado cortas en ' + r.id;
    }
    __t.reset(); histClear();
    startReto('r1'); closeModal();
    S.retoPistas = 1;                       // el usuario pidió una pista
    montarVivienda(); update();             // solución válida
    document.getElementById('btnRetoCheck').click();
    closeModal();
    if (retosDone().r1 !== 2) return 'superado con pistas debería registrarse como 2, es ' + retosDone().r1;
    store.set('rebt.retos', '{}');
    return null;
  })],

  ['durante un reto los errores no muestran la solución', async page => page.evaluate(() => {
    __t.reset(); histClear();
    startReto('r3'); closeModal();
    const m = montarVivienda();
    S.wires = S.wires.filter(w => !(w.a.c === m.toma.id && w.a.t === 'PE') && !(w.b.c === m.toma.id && w.b.t === 'PE'));
    update();
    const html = msgsHTML(SIM.msgs);
    if (html.includes('data-mi')) return 'en reto los mensajes no deben ser tocables (sin soluciones)';
    exitReto();
    update();
    if (!msgsHTML(SIM.msgs) && SIM.msgs.length) return 'fuera del reto vuelven las soluciones';
    return null;
  })],

  ['el feedback de comprobación queda guardado y accesible', async page => page.evaluate(() => {
    __t.reset(); histClear();
    startReto('r1'); closeModal();
    document.getElementById('btnRetoCheck').click();   // falla: lienzo vacío
    if (!S.retoFeedback || S.retoFeedback.length < 10) return 'el motivo del fallo debería guardarse';
    closeModal();
    retoInfoModal();
    const html = document.getElementById('modalBody').innerHTML;
    closeModal(); exitReto();
    if (!html.includes('Última comprobación')) return 'el enunciado debería mostrar la última comprobación';
    if (!html.includes('Ver pista 1 de 3')) return 'el enunciado debería ofrecer la primera pista';
    return null;
  })],

  ['los 8 ejemplos cargan sin errores y funcionando', async page => page.evaluate(() => {
    for (const ej of EJEMPLOS) {
      __t.reset(); histClear();
      if (!!ej.lab !== S.lab) S.lab = !!ej.lab;
      ej.build();
      update();
      if (__t.msgs('err').length) return `el ejemplo «${ej.t}» tiene errores: ` + __t.msgs('err').join(' | ');
      const algoVivo = Object.values(SIM.lit || {}).some(Boolean) ||
        Object.values(SIM.tomas || {}).some(t => t.tension);
      if (!algoVivo) return `el ejemplo «${ej.t}» debería tener algo funcionando`;
    }
    __t.reset();
    return null;
  })],

  ['los recursos visuales existen y se precachean', async page => page.evaluate(async () => {
    for (const f of ['banner.svg', 'icon.svg', 'icon-512.png', 'apple-touch-icon.png']) {
      const r = await fetch(f);
      if (!r.ok) return f + ' debería existir';
      const b = await r.blob();
      if (b.size < 500) return f + ' parece vacío (' + b.size + ' bytes)';
    }
    const sw = await (await fetch('sw.js')).text();
    if (!sw.includes('banner.svg') || !sw.includes('icon-512.png')) return 'los recursos nuevos deben precachearse en sw.js';
    return null;
  })],

  ['lab · toggleLab conserva los dos espacios', async page => page.evaluate(() => {
    __t.reset();
    const m = montarVivienda();
    update();
    const nREBT = S.comps.length;
    toggleLab(true);
    if (!S.lab) return 'debería estar en el laboratorio';
    if (S.comps.some(c => c.type === 'luz')) return 'el laboratorio no debería contener el montaje REBT';
    mkComp('resistencia', 300, 300);
    update();
    const nLab = S.comps.length;
    toggleLab(false);
    if (S.lab) return 'debería haber vuelto al simulador';
    if (S.comps.length !== nREBT || !S.comps.some(c => c.type === 'luz')) return 'el montaje REBT debería restaurarse';
    toggleLab(true);
    const ok = S.comps.length === nLab;
    toggleLab(false);
    return ok ? null : 'el laboratorio debería conservar sus componentes';
  })]
];

/* ---------- ejecución ---------- */
const browser = await chromium.launch();
const page = await browser.newPage();
const jsErrors = [];
page.on('pageerror', e => jsErrors.push(String(e)));

await page.goto(BASE, { waitUntil: 'load' });
await page.evaluate(PAGE_HELPERS);

let pass = 0, fail = 0;
for (const [name, fn] of TESTS) {
  let r;
  try { r = await fn(page); } catch (e) { r = 'excepción: ' + e.message; }
  if (r === null) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.error('  ✗ ' + name + ' — ' + r); }
}
if (jsErrors.length) { fail++; console.error('  ✗ errores JS en la página:\n    ' + jsErrors.join('\n    ')); }

console.log(`\n${pass} correctos · ${fail} fallos`);
await browser.close();
server.close();
process.exit(fail ? 1 : 0);
