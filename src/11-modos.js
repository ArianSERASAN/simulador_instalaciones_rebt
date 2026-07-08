/* ==================================================================
   MODOS EXTRA — Examen tipo test (IBTB) y Proyecto (ITC-BT-10)
   Ambos funcionan sobre los modales existentes, sin tocar el lienzo.
   ================================================================== */

/* ---------- banco de preguntas (respuesta correcta: índice ok) ---------- */
const EXAM_QS = [
  { q: '¿Qué tensiones normalizadas entrega la red de baja tensión en España?', ops: ['125 V y 220 V', '230 V entre fase y neutro y 400 V entre fases', '230 V entre fases y 400 V fase-neutro', '110 V y 380 V'], ok: 1, itc: 'REBT art. 4', exp: 'La red es 230/400 V: 230 V de fase a neutro y 400 V entre fases.' },
  { q: 'La potencia mínima de una vivienda con grado de electrificación básica es…', ops: ['3.450 W', '5.750 W (IGA de 25 A)', '9.200 W (IGA de 40 A)', '14.490 W'], ok: 1, itc: 'ITC-BT-10 · ITC-BT-25', exp: 'Básica: 5.750 W a 230 V (25 A). Elevada: 9.200 W (40 A).' },
  { q: '¿Cuándo es obligatorio el grado de electrificación elevada?', ops: ['Siempre que haya lavadora', 'Con más de 160 m² útiles o calefacción/aire acondicionado eléctricos', 'En viviendas de más de una planta', 'Solo en oficinas'], ok: 1, itc: 'ITC-BT-10 · ITC-BT-25', exp: 'Superficie útil > 160 m² o previsión de sistemas como calefacción eléctrica o aire acondicionado.' },
  { q: 'El circuito C1 de una vivienda corresponde a…', ops: ['Tomas de uso general', 'Iluminación (PIA 10 A · 1,5 mm²)', 'Cocina y horno', 'Baño'], ok: 1, itc: 'ITC-BT-25', exp: 'C1 = alumbrado: PIA 10 A, 1,5 mm², tubo 16 mm, máximo 30 puntos de luz.' },
  { q: '¿Cuántos puntos de luz admite como máximo el circuito C1?', ops: ['10', '20', '30', 'Sin límite'], ok: 2, itc: 'ITC-BT-25', exp: 'C1 admite hasta 30 puntos de utilización.' },
  { q: 'El circuito C2 (tomas de uso general) se ejecuta con…', ops: ['PIA 10 A y 1,5 mm²', 'PIA 16 A y 2,5 mm², máximo 20 tomas', 'PIA 25 A y 6 mm²', 'PIA 20 A y 4 mm²'], ok: 1, itc: 'ITC-BT-25', exp: 'C2: 16 A, 2,5 mm², tubo 20 mm, hasta 20 tomas.' },
  { q: 'Cocina y horno (C3) requieren…', ops: ['16 A y 2,5 mm²', '20 A y 4 mm²', '25 A y 6 mm² bajo tubo de 25 mm', '32 A y 10 mm²'], ok: 2, itc: 'ITC-BT-25', exp: 'C3: PIA 25 A, conductores de 6 mm², tubo de 25 mm, máximo 2 tomas.' },
  { q: 'El circuito C4 alimenta…', ops: ['El timbre', 'Lavadora, lavavajillas y termo (20 A · 4 mm²)', 'El alumbrado exterior', 'El aire acondicionado'], ok: 1, itc: 'ITC-BT-25', exp: 'C4: lavadora, lavavajillas y termo eléctrico, con PIA 20 A y 4 mm².' },
  { q: '¿Cuántas tomas admite el circuito C5 (baño y auxiliares de cocina)?', ops: ['3', '6', '12', '20'], ok: 1, itc: 'ITC-BT-25', exp: 'C5: PIA 16 A, 2,5 mm² y máximo 6 tomas.' },
  { q: 'El calibre de un PIA se elige para proteger…', ops: ['El aparato conectado', 'El conductor (cable) del circuito', 'El contador', 'El diferencial'], ok: 1, itc: 'ITC-BT-25 · ITC-BT-17', exp: 'El PIA protege el cable: 1,5→10 A · 2,5→16 A · 4→20 A · 6→25 A.' },
  { q: '¿Qué PIA máximo admite un conductor de 2,5 mm²?', ops: ['10 A', '16 A', '20 A', '25 A'], ok: 1, itc: 'ITC-BT-25', exp: 'A 2,5 mm² le corresponde un PIA de 16 A como máximo.' },
  { q: 'La sensibilidad del diferencial de una vivienda es…', ops: ['300 mA', '30 mA', '3 A', '10 mA obligatorio'], ok: 1, itc: 'ITC-BT-24 · ITC-BT-25', exp: 'En viviendas, diferencial de alta sensibilidad: 30 mA.' },
  { q: '¿Cuántos circuitos pueden colgar como máximo de un diferencial?', ops: ['3', '5', '8', 'Todos los de la vivienda'], ok: 1, itc: 'ITC-BT-25', exp: 'Máximo 5 circuitos por cada interruptor diferencial.' },
  { q: 'El botón «T» del diferencial sirve para…', ops: ['Taparlo', 'Probar su disparo (conviene pulsarlo una vez al mes)', 'Subir la sensibilidad', 'Rearmarlo'], ok: 1, itc: 'ITC-BT-24', exp: 'Simula una fuga interna para comprobar que dispara.' },
  { q: 'El diferencial protege principalmente frente a…', ops: ['Sobrecargas', 'Cortocircuitos', 'Contactos indirectos (fugas a tierra)', 'Sobretensiones de rayo'], ok: 2, itc: 'ITC-BT-24', exp: 'Vigila la corriente diferencial: si hay fuga a tierra mayor que su sensibilidad, dispara.' },
  { q: 'El IGA (Interruptor General Automático)…', ops: ['Solo corta el alumbrado', 'Corta y protege toda la instalación interior y fija el grado de electrificación', 'Lo precinta la compañía', 'Es opcional'], ok: 1, itc: 'ITC-BT-17', exp: 'Va en cabecera del cuadro: 25 A (básica) o 40 A (elevada).' },
  { q: 'El ICP sirve para…', ops: ['Medir la energía', 'Limitar la potencia a la contratada', 'Proteger frente a fugas', 'Seccionar la tierra'], ok: 1, itc: 'ITC-BT-17', exp: 'Si la demanda supera la potencia contratada, el ICP dispara. Hoy suele ir integrado en el contador inteligente.' },
  { q: 'En un suministro para UN SOLO usuario, la instalación de enlace…', ops: ['Necesita siempre LGA', 'Simplifica CGP y contador en una CPM, sin LGA', 'No lleva fusibles', 'No lleva derivación individual'], ok: 1, itc: 'ITC-BT-12', exp: 'Esquema 2.1: CPM (fusibles + contador) y de ahí la DI hasta el ICP/IGA.' },
  { q: 'El orden correcto del enlace en un edificio de viviendas es…', ops: ['Acometida → LGA → CGP → contadores', 'Acometida → CGP → LGA → centralización de contadores → derivaciones individuales', 'Acometida → contadores → CGP → LGA', 'CGP → acometida → DI'], ok: 1, itc: 'ITC-BT-12', exp: 'CGP en el límite, LGA hasta la centralización y una DI por usuario.' },
  { q: 'La CPM es…', ops: ['Un contador trifásico', 'La caja que reúne fusibles de seguridad y contador para un solo usuario', 'El cuadro de mando y protección', 'Una caja de derivación'], ok: 1, itc: 'ITC-BT-13', exp: 'Caja de Protección y Medida: CGP + equipo de medida en la misma envolvente.' },
  { q: 'En la CGP, los fusibles se colocan…', ops: ['En todas las fases y en el neutro', 'Solo en los conductores de fase; el neutro es seccionable', 'Solo en el neutro', 'En la tierra'], ok: 1, itc: 'ITC-BT-13', exp: 'Fusible por fase; el neutro lleva un elemento seccionable, nunca fusible.' },
  { q: 'La sección mínima de la LGA en cobre es…', ops: ['6 mm²', '10 mm²', '16 mm²', '25 mm²'], ok: 1, itc: 'ITC-BT-14', exp: '10 mm² en cobre (16 mm² en aluminio).' },
  { q: 'La caída máxima en la LGA con contadores totalmente centralizados es…', ops: ['3 %', '1,5 %', '1 %', '0,5 %'], ok: 3, itc: 'ITC-BT-14', exp: '0,5 % con centralización única; 1 % hacia centralizaciones parciales.' },
  { q: 'La sección mínima de una derivación individual es…', ops: ['2,5 mm²', '4 mm²', '6 mm² (y 1,5 mm² el hilo de mando)', '10 mm²'], ok: 2, itc: 'ITC-BT-15', exp: '6 mm² para fases, neutro y protección; 1,5 mm² para el hilo de mando.' },
  { q: 'La caída máxima en la DI de un único usuario SIN LGA es…', ops: ['0,5 %', '1 %', '1,5 %', '3 %'], ok: 2, itc: 'ITC-BT-15', exp: '1,5 % sin LGA; 1 % cuando los contadores están totalmente centralizados.' },
  { q: 'Con contadores totalmente centralizados, la caída máxima de cada DI es…', ops: ['0,5 %', '1 %', '1,5 %', '2 %'], ok: 1, itc: 'ITC-BT-15', exp: 'El reparto total del enlace ronda el 1,5 %: 0,5 % la LGA y 1 % la DI.' },
  { q: 'El IGM de una centralización de contadores debe ser como mínimo de…', ops: ['63 A', '100 A', '160 A (hasta 90 kW de previsión)', '400 A'], ok: 2, itc: 'ITC-BT-16', exp: '160 A hasta 90 kW; 250 A hasta 150 kW. Es de corte manual, no dispara solo.' },
  { q: 'Cada derivación individual arranca en la centralización de…', ops: ['Su contador directamente', 'Su fusible de seguridad, antes del contador', 'El embarrado de tierra', 'El IGM'], ok: 1, itc: 'ITC-BT-16', exp: 'Unidad funcional: fusible de seguridad → contador → salida de la DI.' },
  { q: 'La caída de tensión máxima en la instalación interior de una vivienda es…', ops: ['1 %', '3 %', '5 %', '6,5 %'], ok: 1, itc: 'ITC-BT-19', exp: '3 % en viviendas (desde el origen de la instalación interior).' },
  { q: 'El conductor neutro se identifica con el color…', ops: ['Negro', 'Gris', 'Azul claro', 'Blanco'], ok: 2, itc: 'ITC-BT-19', exp: 'Neutro: azul claro. Fases: marrón, negro o gris.' },
  { q: 'El color verde-amarillo puede usarse…', ops: ['Para cualquier conductor', 'Como fase si se marca', 'EXCLUSIVAMENTE para el conductor de protección', 'Para el neutro en trifásica'], ok: 2, itc: 'ITC-BT-19', exp: 'Reservado al conductor de protección (tierra), sin excepciones.' },
  { q: '¿Qué colores identifican los conductores de fase?', ops: ['Azul, negro y gris', 'Marrón, negro y gris', 'Rojo, amarillo y azul', 'Marrón, azul y verde'], ok: 1, itc: 'ITC-BT-19', exp: 'Fases: marrón, negro y gris.' },
  { q: 'Un interruptor de alumbrado debe cortar…', ops: ['El neutro', 'La fase', 'La tierra', 'Fase y tierra'], ok: 1, itc: 'ITC-BT-19', exp: 'Siempre la fase: si corta el neutro, el portalámparas queda en tensión aunque la luz esté apagada.' },
  { q: 'Para mandar una lámpara desde TRES puntos hacen falta…', ops: ['Tres conmutadores', 'Dos conmutadores y un cruzamiento', 'Tres interruptores', 'Un telerruptor obligatoriamente'], ok: 1, itc: 'ITC-BT-19', exp: 'Conmutador → cruzamiento(s) → conmutador. Desde 3+ puntos también es típico el telerruptor con pulsadores.' },
  { q: 'El timbre se acciona con…', ops: ['Un interruptor', 'Un pulsador (contacto momentáneo)', 'Un conmutador', 'Un crepuscular'], ok: 1, itc: 'ITC-BT-19', exp: 'Debe sonar solo mientras se mantiene pulsado.' },
  { q: 'El telerruptor es…', ops: ['Un temporizador', 'Un relé biestable: cada impulso en su bobina cambia el contacto', 'Un diferencial a distancia', 'Un limitador de potencia'], ok: 1, itc: 'ITC-BT-19', exp: 'Ideal para mandar una luz desde muchos pulsadores en paralelo.' },
  { q: 'La puesta a tierra sirve para…', ops: ['Ahorrar energía', 'Limitar la tensión de las masas y permitir que actúe el diferencial', 'Evitar sobrecargas', 'Mejorar el factor de potencia'], ok: 1, itc: 'ITC-BT-18 · ITC-BT-24', exp: 'Da salida a las fugas y estabiliza el potencial: sin tierra, el diferencial no protege bien de contactos indirectos.' },
  { q: 'Un receptor de 230 V conectado entre DOS fases…', ops: ['Funciona igual', 'Recibe 400 V y se daña', 'No recibe tensión', 'Consume menos'], ok: 1, itc: 'ITC-BT-10', exp: 'Entre fases hay 400 V: sobretensión destructiva para un receptor de 230 V.' },
  { q: 'La corriente de un motor trifásico se calcula con…', ops: ['I = P / V', 'I = P / (√3 · 400 · cos φ)', 'I = P · cos φ', 'I = V / R'], ok: 1, itc: 'ITC-BT-47', exp: 'En trifásica interviene √3 y la tensión entre fases.' },
  { q: 'La previsión de cargas de un edificio de viviendas se calcula…', ops: ['Sumando todas las potencias', 'Aplicando el coeficiente de simultaneidad a la carga media de las viviendas', 'Con 100 W/m² siempre', 'Solo con los servicios generales'], ok: 1, itc: 'ITC-BT-10', exp: 'No todas consumen a la vez: 10 viviendas cuentan como 8,5; a eso se suman servicios generales, locales y garajes.' },
  { q: 'En el volumen 1 de un baño (sobre la bañera o ducha)…', ops: ['Puede ir cualquier enchufe', 'Solo aparatos a muy baja tensión de seguridad (MBTS 12 V) o previstos para ese volumen', 'Solo tomas de 16 A con tierra', 'Está prohibido el alumbrado'], ok: 1, itc: 'ITC-BT-27', exp: 'En los volúmenes 0 y 1 no se admiten tomas de corriente normales; la protección es por MBTS o aparatos aptos para el volumen.' },
  { q: 'El esquema 2.2.2 de la ITC-BT-12 corresponde a…', ops: ['Un solo usuario', 'Contadores centralizados en un único lugar', 'Contadores centralizados en más de un lugar (por plantas)', 'Suministros provisionales de obra'], ok: 2, itc: 'ITC-BT-12', exp: 'Varias centralizaciones parciales colgando de la misma CGP y LGA.' },
  { q: '¿Qué diámetro de tubo corresponde al circuito C3 (6 mm²)?', ops: ['16 mm', '20 mm', '25 mm', '32 mm'], ok: 2, itc: 'ITC-BT-25', exp: 'C1: 16 mm · C2/C4/C5: 20 mm · C3: 25 mm.' },
  { q: 'El contador mide…', ops: ['La potencia contratada', 'La energía consumida (kWh)', 'La corriente de fuga', 'La resistencia de tierra'], ok: 1, itc: 'ITC-BT-16', exp: 'Energía en kWh; va precintado por la compañía.' },
  { q: 'La acometida es…', ops: ['El tramo del cuadro a los enchufes', 'El tramo de la red de distribución hasta la CGP, responsabilidad de la empresa distribuidora', 'La toma de tierra', 'El hilo de mando'], ok: 1, itc: 'ITC-BT-11', exp: 'Une la red de la compañía con la caja general de protección.' }
];

/* ---------- estado y estadísticas del examen ---------- */
let EXAM = null;
function examStats() {
  try {
    const d = JSON.parse(store.get('rebt.exam') || '{}') || {};
    return { intentos: d.intentos || 0, record: d.record || 0, falladas: Array.isArray(d.falladas) ? d.falladas : [] };
  } catch (e) { return { intentos: 0, record: 0, falladas: [] }; }
}
function saveExamStats(st) { store.set('rebt.exam', JSON.stringify(st)); }

function examenModal() {
  const st = examStats();
  openModal(`<div class="mTitle">Examen tipo test · IBTB</div>
    <div class="help"><p>Banco de <b>${EXAM_QS.length} preguntas</b> con su ITC. Cada examen son <b>10 al azar</b>; al responder verás la corrección razonada.
    ${st.intentos ? `<br>Exámenes hechos: <b>${st.intentos}</b> · mejor nota: <b>${st.record}/10</b>.` : ''}</p></div>
    <button class="bigbtn pri" data-m="examStart">Empezar examen</button>
    ${st.falladas.length ? `<div style="height:8px"></div><button class="bigbtn sec" data-m="examRepaso">Repasar ${st.falladas.length} pregunta${st.falladas.length > 1 ? 's' : ''} fallada${st.falladas.length > 1 ? 's' : ''}</button>` : ''}`);
}

function examBarajar(pool, n) {
  const a = [...pool];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.slice(0, n);
}
function startExamen(idxs) {
  EXAM = { qs: idxs, i: 0, ok: 0, falladas: [] };
  examPregunta();
}
function examPregunta() {
  const q = EXAM_QS[EXAM.qs[EXAM.i]];
  openModal(`<div class="mTitle">Pregunta ${EXAM.i + 1} de ${EXAM.qs.length}</div>
    <div class="help"><p><b>${q.q}</b></p></div>` +
    q.ops.map((o, i) => `<button class="mItem" data-m="examResp" data-id="${i}"><div>${esc(o)}</div></button>`).join(''));
}
function examResponder(i) {
  const qi = EXAM.qs[EXAM.i];
  const q = EXAM_QS[qi];
  const acierto = i === q.ok;
  if (acierto) EXAM.ok++; else EXAM.falladas.push(qi);
  const ultima = EXAM.i === EXAM.qs.length - 1;
  openModal(`<div class="mTitle">${acierto ? 'Correcto' : 'No es correcto'}</div>
    <div class="help">
      <p><b>${q.q}</b></p>
      <p>${acierto ? '' : `Tu respuesta: <b>${esc(q.ops[i])}</b><br>`}Respuesta correcta: <b>${esc(q.ops[q.ok])}</b></p>
      <p>${q.exp} <span class="itc">${esc(q.itc)}</span></p>
    </div>
    <button class="bigbtn ${acierto ? 'grn' : 'pri'}" data-m="${ultima ? 'examFin' : 'examNext'}">${ultima ? 'Ver la nota' : 'Siguiente pregunta'}</button>`);
}
function examFinal() {
  const st = examStats();
  st.intentos++;
  if (EXAM.qs.length === 10 && EXAM.ok > st.record) st.record = EXAM.ok;
  st.falladas = [...new Set([...st.falladas.filter(f => !EXAM.qs.includes(f)), ...EXAM.falladas])];
  saveExamStats(st);
  const nota = EXAM.ok, total = EXAM.qs.length;
  const bien = nota / total >= 0.5;
  openModal(`<div class="mTitle">Resultado</div>
    <span class="bolBadge ${bien ? 'si' : 'no'}">${nota} / ${total}</span>
    <div class="help"><p>${nota === total ? 'Perfecto: dominas este bloque.'
      : bien ? 'Buen resultado. Las falladas quedan guardadas para repasarlas desde el menú del examen.'
      : 'Sigue practicando: repasa las falladas y vuelve a intentarlo.'}</p></div>
    <button class="bigbtn pri" data-m="examStart">Otro examen</button>
    <div style="height:8px"></div>
    <button class="bigbtn sec" data-m="cerrar">Cerrar</button>`);
  EXAM = null;
}

/* ---------- proyecto: previsión de cargas (ITC-BT-10) ---------- */
function coefSimultaneidad(n) {
  const t = [0, 1, 2, 3, 3.8, 4.6, 5.4, 6.2, 7, 7.8, 8.5, 9.2, 9.9, 10.6, 11.3, 11.9, 12.5, 13.1, 13.7, 14.3, 14.8, 15.3];
  if (n <= 0) return 0;
  return n <= 21 ? t[n] : 15.3 + (n - 21) * 0.5;
}
function previsionEdificio(o) {
  const n = (o.nBas || 0) + (o.nElev || 0);
  const media = n ? ((o.nBas || 0) * 5750 + (o.nElev || 0) * 9200) / n : 0;
  const coef = coefSimultaneidad(n);
  const viv = coef * media;
  const locales = o.m2Locales > 0 ? Math.max(o.m2Locales * 100, 3450) : 0;
  const garaje = (o.m2GarajeNat || 0) * 10 + (o.m2GarajeForz || 0) * 20;
  const servicios = o.wServicios || 0;
  return { n, media, coef, viv, locales, garaje, servicios, total: viv + servicios + locales + garaje };
}

function proyectoModal() {
  openModal(`<div class="mTitle">Proyecto · previsión de cargas</div>
    <div class="help"><p>Previsión de un edificio según la <b>ITC-BT-10</b>: las viviendas se ponderan con el <b>coeficiente de simultaneidad</b>; servicios generales, locales (100 W/m², mín. 3.450 W) y garajes (10/20 W/m²) se suman aparte.</p></div>
    <div class="shRow"><label>Viviendas básicas (5.750 W)</label><input class="nameIn" id="pyBas" type="number" min="0" value="10"></div>
    <div class="shRow"><label>Viviendas elevadas (9.200 W)</label><input class="nameIn" id="pyElev" type="number" min="0" value="0"></div>
    <div class="shRow"><label>Servicios generales (W): ascensor, alumbrado común…</label><input class="nameIn" id="pySrv" type="number" min="0" value="8000"></div>
    <div class="shRow"><label>Locales comerciales (m²)</label><input class="nameIn" id="pyLoc" type="number" min="0" value="0"></div>
    <div class="shRow"><label>Garaje ventilación natural (m²)</label><input class="nameIn" id="pyGarN" type="number" min="0" value="0"></div>
    <div class="shRow"><label>Garaje ventilación forzada (m²)</label><input class="nameIn" id="pyGarF" type="number" min="0" value="0"></div>
    <button class="bigbtn pri" data-m="proyCalc">Calcular la previsión</button>
    <div id="proyOut"></div>`);
}
function proyectoCalcular() {
  const num = id => Math.max(0, Number(($('#' + id) || {}).value) || 0);
  const r = previsionEdificio({ nBas: num('pyBas'), nElev: num('pyElev'), wServicios: num('pySrv'), m2Locales: num('pyLoc'), m2GarajeNat: num('pyGarN'), m2GarajeForz: num('pyGarF') });
  const kw = r.total / 1000;
  const igm = kw <= 90 ? 'IGM de 160 A' : (kw <= 150 ? 'IGM de 250 A' : 'más de 150 kW: estudiar varias LGA');
  const out = $('#proyOut');
  if (!out) return;
  out.innerHTML = `<div class="help">
    <table>
      <tr><th colspan="2">Previsión (ITC-BT-10)</th></tr>
      <tr><td>${r.n} viviendas × coef. ${fmtNum(r.coef)}</td><td><b>${fmtNum(r1(r.viv / 1000))} kW</b></td></tr>
      <tr><td>Servicios generales</td><td>${fmtNum(r1(r.servicios / 1000))} kW</td></tr>
      <tr><td>Locales comerciales</td><td>${fmtNum(r1(r.locales / 1000))} kW</td></tr>
      <tr><td>Garaje</td><td>${fmtNum(r1(r.garaje / 1000))} kW</td></tr>
      <tr><td><b>Total edificio</b></td><td><b>${fmtNum(r1(kw))} kW</b></td></tr>
    </table>
    <p>Centralización única → <b>${igm}</b> <span class="itc">ITC-BT-16</span><br>
    Carga media por vivienda: ${fmtNum(r1(r.media / 1000))} kW · coeficiente de simultaneidad de ${r.n} viviendas: <b>${fmtNum(r.coef)}</b>.</p>
  </div>`;
}

/* ---------- ganchos de los modales ---------- */
modalBody.addEventListener('click', e => {
  const b = e.target.closest('[data-m]');
  if (!b) return;
  const m = b.dataset.m;
  if (m === 'examen') examenModal();
  else if (m === 'examStart') startExamen(examBarajar(EXAM_QS.map((q, i) => i), 10));
  else if (m === 'examRepaso') { const f = examStats().falladas.filter(i => EXAM_QS[i]); if (f.length) startExamen(examBarajar(f, Math.min(10, f.length))); }
  else if (m === 'examResp') examResponder(Number(b.dataset.id));
  else if (m === 'examNext') { EXAM.i++; examPregunta(); }
  else if (m === 'examFin') examFinal();
  else if (m === 'proyecto') proyectoModal();
  else if (m === 'proyCalc') proyectoCalcular();
});
