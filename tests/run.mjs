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
