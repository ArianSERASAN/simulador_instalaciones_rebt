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

const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

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
      S.reto = null; S.averia = null; S.noche = false; S.mode = 'aprendiz';
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
