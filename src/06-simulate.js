/* ==================================================================
   SIMULACIÓN PRINCIPAL
   Trabaja sobre el suministro activo (mono o trifásico): `phs` es la
   lista de raíces de fase y `nu` la del neutro en el grafo actual.
   ================================================================== */
function simulate() {
  const msgs = [];
  const res = { msgs, lit: {}, vlit: {}, tomas: {}, liveW: {}, circuits: [], difConTension: {}, sinRed: false, fault: null,
    totalP: 0, totalI: 0, coloresMal: 0, igaOK: true, di: null, dis: [], lga: null, pMedida: {}, vEnlace: {} };
  const sup = getSupply();
  const picas = S.comps.filter(c => c.type === 'pica');
  const inst = S.mode !== 'aprendiz';
  if (!sup) { res.sinRed = true; msgs.push({ lvl: 'info', txt: 'Añade la Red 230 V o la Red trifásica (pestaña Enlace) para dar tensión a la instalación.' }); }
  if (sup && sup.tri && S.comps.some(c => c.type === 'red')) {
    msgs.push({ lvl: 'warn', txt: 'Hay dos puntos de suministro (red monofásica y trifásica): se usa la trifásica. Elimina uno de los dos.' });
  }

  const topo = circuitosTopo(sup);
  let uf = buildUF(), phs = [], nu = null;
  let guard = 0;

  while (sup) {
    uf = buildUF();
    ({ phs, nu } = supRoots(uf, sup));
    const es = new Set(picas.map(p => uf.f(K(p.id, 'PE'))));
    if (guard++ > 12) break;

    /* --- cortocircuito (fase-neutro o fase-fase) --- */
    const corto = hayCorto(phs, nu);
    if (corto) {
      const termsSum = [...sup.phases, 'N'];
      const tA = termsSum[corto.i], tB = termsSum[corto.j];
      const esFF = corto.faseFase;
      const orden = { pia: 0, iga: 1, icp: 2, fusi: 3, cgp: 4, cpm: 4, cgp3: 4 };   // selectividad
      const cands = S.comps.filter(c =>
        ((c.type === 'pia' || c.type === 'iga' || c.type === 'icp') && c.state.on && !c.state.trip) ||
        ((c.type === 'cgp' || c.type === 'cpm' || c.type === 'cgp3' || c.type === 'fusi') && !c.state.fundido))
        .sort((a, b) => orden[a.type] - orden[b.type]);
      let disp = null;
      for (const c of cands) {
        const t = buildUF({ open: { [c.id]: true } });
        if (t.f(K(sup.comp.id, tA)) !== t.f(K(sup.comp.id, tB))) { disp = c; break; }
      }
      const donde = esFF ? `¡Cortocircuito entre dos fases (${V_LL} V)!` : '¡Cortocircuito! Fase y neutro se tocan sin pasar por ningún receptor.';
      if (disp) {
        const fixCorto = 'La corriente encuentra un atajo sin pasar por ningún receptor y se dispara a miles de amperios. Busca el cable que une directamente los dos conductores (suele ser el último que has tendido), elimínalo y rearma la protección señalada.';
        if (disp.type === 'fusi') {
          disp.state.fundido = true;
          msgs.push({ lvl: 'err', txt: `${donde} Se ha fundido el fusible de seguridad de esa derivación: corrige el cableado y sustitúyelo (tócalo).`, itc: 'ITC-BT-16 · ITC-BT-22', hl: { c: [disp.id] }, fix: fixCorto });
        } else if (disp.type === 'cgp' || disp.type === 'cpm' || disp.type === 'cgp3') {
          disp.state.fundido = true;
          msgs.push({ lvl: 'err', txt: `${donde} Se han fundido los fusibles de la ${disp.type === 'cpm' ? 'CPM' : 'CGP'}: corrige el cableado y sustitúyelos (tócala).`, itc: 'ITC-BT-13 · ITC-BT-22', hl: { c: [disp.id] }, fix: fixCorto });
        } else {
          disp.state.trip = true; disp.state.on = false;
          const quien = disp.type === 'iga' ? 'el IGA' : (disp.type === 'icp' ? 'el ICP' : 'el PIA de ' + disp.props.calibre + ' A');
          msgs.push({ lvl: 'err', txt: `${donde} Ha disparado ${quien}: corrige el cableado y reármalo.`, itc: 'ITC-BT-22', hl: { c: [disp.id] }, fix: fixCorto });
        }
        continue;
      }
      msgs.push({ lvl: 'err', txt: `${donde} No hay ninguna protección conectada que pueda despejarlo.`, itc: 'ITC-BT-22', fix: 'Quita el cable que une los dos conductores directamente. En una instalación real este fallo fundiría el cableado: por eso siempre debe haber fusibles o magnetotérmicos aguas arriba.' });
      res.fault = 'corto';
      break;
    }

    /* --- fuga a tierra --- */
    const fugaF = phs.some(p => es.has(p)), fugaN = es.has(nu);
    if (fugaF || fugaN) {
      let disp = null;
      for (const c of S.comps.filter(c => c.type === 'dif' && c.state.on && !c.state.trip)) {
        const t = buildUF({ open: { [c.id]: true } });
        const es2 = new Set(picas.map(p => t.f(K(p.id, 'PE'))));
        const r2s = supRoots(t, sup);
        if (!r2s.phs.some(p => es2.has(p)) && !es2.has(r2s.nu)) { disp = c; break; }
      }
      if (disp) {
        disp.state.trip = true; disp.state.on = false;
        msgs.push({ lvl: 'err', txt: fugaF
          ? 'Derivación a tierra: una fase toca el circuito de protección y el diferencial ha disparado (fuga > 30 mA). Revisa el cableado y reármalo.'
          : 'El neutro está unido a tierra y el diferencial ha disparado por corriente de fuga. Sepáralos y reármalo.', itc: 'ITC-BT-24',
          hl: { c: [disp.id] },
          fix: 'Parte de la corriente se escapa por la tierra en vez de volver por el neutro, y el diferencial lo nota (eso mismo te protegería de un calambrazo). Busca el cable que une un conductor activo con algo verde-amarillo o con la pica, quítalo y rearma el diferencial señalado.' });
        continue;
      }
      if (fugaF) {
        msgs.push({ lvl: 'err', txt: 'Una fase está derivada a tierra y NO hay diferencial que pueda despejar la fuga: riesgo grave de contacto indirecto.', itc: 'ITC-BT-24',
          fix: 'Hay dos cosas que corregir: (1) quita el cable que une la fase con la tierra, y (2) añade un diferencial de 30 mA en el cuadro: es el aparato que salva vidas cuando ocurre exactamente esto.' });
        res.fault = 'fuga';
        break;
      }
      msgs.push({ lvl: 'warn', txt: 'El neutro está unido a tierra: cualquier diferencial en servicio dispararía. Sepáralos.', itc: 'ITC-BT-24',
        fix: 'Neutro y tierra parecen lo mismo (ambos están a ~0 V) pero cumplen funciones distintas: el neutro es el retorno de la corriente y la tierra solo debe llevar corriente en caso de fallo. Quita el cable que los une.' });
    }

    /* --- bobinas (telerruptor, minutero): flanco de subida --- */
    {
      let cambio = false;
      for (const c of S.comps) {
        const d = defOf(c);
        if (!d.coil) continue;
        const a = uf.f(K(c.id, 'A1')), b2 = uf.f(K(c.id, 'A2'));
        const exc = (phs.includes(a) && b2 === nu) || (a === nu && phs.includes(b2));
        if (exc && !c.state.exc) { c.state.exc = true; d.onPulse(c); cambio = true; }
        else if (!exc && c.state.exc) c.state.exc = false;
      }
      if (cambio) continue;
    }

    /* --- sobrecarga por circuito (con números → modos con cálculo) --- */
    if (inst) {
      const fl = energFlags(uf, sup, true);
      let alguna = false;
      for (const ce of topo) {
        if (!ce.pia.state.on || ce.pia.state.trip) continue;
        const { I } = consumo(ce, fl.lit, fl.tomas);
        if (I > ce.pia.props.calibre + 0.001) {
          ce.pia.state.trip = true; ce.pia.state.on = false;
          msgs.push({ lvl: 'err', txt: `Sobrecarga: el circuito demanda ${fmtNum(r1(I))} A y su PIA es de ${ce.pia.props.calibre} A → ha disparado. Reparte las cargas o revisa el calibre (recuerda: el calibre lo fija el cable, no el aparato).`, itc: 'ITC-BT-22 · ITC-BT-25',
            hl: { c: [ce.pia.id, ...ce.dLoads.map(l => l.id)] },
            fix: `Suma lo que cuelga de este PIA: I = P / 230. Van ${fmtNum(r1(I))} A y solo admite ${ce.pia.props.calibre} A. Soluciones: apaga o reduce alguna carga, muévela a otro circuito con su propio PIA, o —solo si el cable lo admite— usa un PIA mayor.` });
          alguna = true; break;
        }
      }
      /* ICP: potencia contratada */
      if (!alguna) {
        const dt = demandaTotal(fl);
        for (const icp of S.comps.filter(c => c.type === 'icp')) {
          if (!icp.state.on || icp.state.trip) continue;
          if (!phs.includes(uf.f(K(icp.id, 'Li')))) continue;
          if (dt.I > icp.props.calibre + 0.001) {
            icp.state.trip = true; icp.state.on = false;
            msgs.push({ lvl: 'err', txt: `Has superado la potencia contratada: la instalación demanda ${fmtNum(r1(dt.I))} A y el ICP es de ${icp.props.calibre} A → ha disparado. Apaga algún aparato y reármalo.`, itc: 'ITC-BT-17',
              hl: { c: [icp.id] },
              fix: `El ICP no protege nada: solo vigila que no consumas más de lo contratado (${icp.props.calibre} A ≈ ${icp.props.calibre * 230} W). Apaga algún aparato grande, rearma el ICP… o «contrata» más potencia subiendo su calibre en la ficha.` });
            alguna = true; break;
          }
        }
      }
      if (alguna) continue;
    }
    break;
  }

  const energia = !!sup && !res.fault;

  /* --- receptor monofásico entre dos fases: 400 V, se quema --- */
  let quemadoNuevo = false;
  if (energia && sup.tri) {
    for (const c of S.comps.filter(c => c.type === 'luz' || defOf(c).load)) {
      const a = uf.f(K(c.id, 'L')), b = uf.f(K(c.id, 'N'));
      if (phs.includes(a) && phs.includes(b) && a !== b && !c.state.quemado) {
        c.state.quemado = true; quemadoNuevo = true;
        msgs.push({ lvl: 'err', txt: `Un receptor de 230 V está conectado entre DOS FASES: recibe ${V_LL} V y se ha quemado. Conéctalo entre una fase y el neutro y sustitúyelo desde su ficha.`, itc: 'ITC-BT-10 · ITC-BT-19',
          hl: { c: [c.id] },
          fix: `Entre dos fases hay ${V_LL} V (las ondas están desfasadas 120° y su diferencia es √3 × 230). Un receptor de 230 V recibe casi el doble de tensión y el cuádruple de potencia: se quema. Cambia el cable de su borne N para que venga del NEUTRO (azul), y pulsa «Sustituir» en su ficha.` });
      }
    }
  }
  if (!quemadoNuevo && S.comps.some(c => c.state && c.state.quemado)) {
    msgs.push({ lvl: 'warn', txt: 'Hay algún receptor quemado por sobretensión: tócalo y pulsa «Sustituir» en su ficha.',
      hl: { c: S.comps.filter(c => c.state && c.state.quemado).map(c => c.id) },
      fix: 'Antes de sustituirlo, asegúrate de haber corregido el cableado que lo quemó (debe recibir una fase y el neutro): si no, el nuevo se quemará igual.' });
  }

  const earthSet = new Set(picas.map(p => uf.f(K(p.id, 'PE'))));
  const fl = energFlags(uf, sup, energia);
  res.lit = fl.lit; res.tomas = fl.tomas;
  const dtot = demandaTotal(fl);
  res.totalP = dtot.P; res.totalI = dtot.I;

  /* potencial: todo cerrado (para diagnósticos «qué falta») */
  const pot = sup ? buildUF({ allClosed: true }) : null;
  const potR = sup ? supRoots(pot, sup) : { phs: [], nu: null };
  const potEarth = sup ? new Set(picas.map(p => pot.f(K(p.id, 'PE')))) : new Set();
  const potCorto = sup && !!hayCorto(potR.phs, potR.nu);
  const okParPot = (a, b) => (potR.phs.includes(a) && b === potR.nu) || (a === potR.nu && potR.phs.includes(b));
  const dosFasesPot = (a, b) => potR.phs.includes(a) && potR.phs.includes(b) && a !== b;

  /* --- diagnóstico de puntos de luz --- */
  let avisoListas = false;
  for (const c of S.comps.filter(c => c.type === 'luz')) {
    if (!sup) break;
    if (c.state.quemado) continue;                 // ya avisado arriba
    const conn = S.wires.some(w => w.a.c === c.id || w.b.c === c.id);
    if (res.lit[c.id]) {
      if (uf.f(K(c.id, 'L')) === nu) msgs.push({ lvl: 'warn', txt: 'En un punto de luz, fase y neutro llegan intercambiados: luce igual, pero la fase debe llegar al portalámparas a través del interruptor.', itc: 'ITC-BT-19', hl: { c: [c.id] },
        fix: 'Con el interruptor apagado, el casquillo seguiría en tensión: peligro al cambiar la bombilla. Intercambia los dos cables de la lámpara: la fase (que viene del interruptor) al borne L y el azul directo del PIA al borne N.' });
      continue;
    }
    if (!conn) { msgs.push({ lvl: 'info', txt: 'Hay un punto de luz sin conectar.', hl: { c: [c.id] }, fix: 'Necesita dos cables: la fase, que baja del PIA y pasa por el interruptor, y el neutro azul directo desde el PIA.' }); continue; }
    if (potCorto) continue;
    const pa = pot.f(K(c.id, 'L')), pb = pot.f(K(c.id, 'N'));
    if (dosFasesPot(pa, pb)) continue;             // acabaría quemado: mensaje de 400 V
    if (okParPot(pa, pb)) { if (energia && !avisoListas) { msgs.push({ lvl: 'info', txt: 'Hay alguna bombilla lista para funcionar: acciona su interruptor o sube las protecciones.' }); avisoListas = true; } continue; }
    const llegaF = potR.phs.includes(pa) || potR.phs.includes(pb);
    const llegaN = pa === potR.nu || pb === potR.nu;
    if (!llegaN) msgs.push({ lvl: 'err', txt: 'A un punto de luz no le llega el neutro: tiéndele un cable azul directo desde la salida N de su PIA.', itc: 'ITC-BT-19', hl: { c: [c.id] },
      fix: 'La corriente necesita ida Y vuelta: entra por la fase y regresa por el neutro. Tiende un cable azul desde la salida N (abajo) del PIA hasta el borne N de la lámpara, sin pasar por ningún interruptor.' });
    if (!llegaF) msgs.push({ lvl: 'err', txt: 'A un punto de luz no le llega la fase: revisa el camino PIA → interruptor → lámpara.', itc: 'ITC-BT-19', hl: { c: [c.id] },
      fix: 'Sigue el camino de la fase con el dedo: salida L del PIA → borne de entrada del interruptor → del otro borne del interruptor al borne L de la lámpara. El eslabón que falte es tu avería.' });
    if (llegaF && llegaN) msgs.push({ lvl: 'err', txt: 'Un punto de luz recibe dos veces el mismo conductor: debe recibir una fase y un neutro distintos.', hl: { c: [c.id] },
      fix: 'Sus dos bornes están unidos al mismo conductor, así que no hay diferencia de tensión y no puede lucir. Uno de los dos cables sobra: cámbialo por el conductor que falta (fase o neutro).' });
  }

  /* --- diagnóstico de tomas --- */
  for (const c of S.comps.filter(c => c.type === 'toma')) {
    if (!sup) break;
    const st = res.tomas[c.id];
    const conn = S.wires.some(w => w.a.c === c.id || w.b.c === c.id);
    if (!conn) { msgs.push({ lvl: 'info', txt: 'Hay una base de enchufe sin conectar.', hl: { c: [c.id] }, fix: 'Una schuko necesita tres cables: fase (L), neutro (N) y tierra (PE, verde-amarillo hasta el borne principal).' }); continue; }
    if (st.tension && st.inv) msgs.push({ lvl: 'info', txt: 'En una toma, fase y neutro llegan intercambiados: funciona (la schuko no tiene polaridad), pero conviene mantener el criterio de conexión.', hl: { c: [c.id] } });
    if (!st.tierra) msgs.push({ lvl: 'err', txt: 'Una toma de corriente no tiene tierra: une su borne PE con cable verde-amarillo hasta el borne principal y la pica.', itc: 'ITC-BT-18 · ITC-BT-26', hl: { c: [c.id] },
      fix: 'Sin tierra, si un aparato deriva a su carcasa, la fuga pasaría por TU cuerpo al tocarlo y el diferencial no actuaría a tiempo. Cablea: borne PE de la toma → borne principal de tierra → pica, todo en verde-amarillo.' });
    if (!st.tension && !potCorto) {
      const pa = pot.f(K(c.id, 'L')), pb = pot.f(K(c.id, 'N'));
      if (dosFasesPot(pa, pb)) { msgs.push({ lvl: 'err', txt: `Una toma está conectada entre DOS FASES (${V_LL} V): quemaría lo que se enchufe. Debe recibir una fase y el neutro.`, itc: 'ITC-BT-10 · ITC-BT-19', hl: { c: [c.id] },
        fix: `Entre dos fases hay ${V_LL} V, no 230. Cambia uno de los dos cables activos por el NEUTRO (azul, desde la salida N del PIA).` }); continue; }
      if (okParPot(pa, pb)) { if (energia) msgs.push({ lvl: 'info', txt: 'Hay una toma lista: sube las protecciones para darle tensión.' }); }
      else {
        if (!(pa === potR.nu || pb === potR.nu)) msgs.push({ lvl: 'err', txt: 'A una toma no le llega el neutro (cable azul desde la salida N del PIA).', itc: 'ITC-BT-19', hl: { c: [c.id] },
          fix: 'Tiende un cable azul desde la salida N (abajo) de su PIA hasta el borne N de la toma: es el camino de vuelta de la corriente.' });
        if (!(potR.phs.includes(pa) || potR.phs.includes(pb))) msgs.push({ lvl: 'err', txt: 'A una toma no le llega la fase (cable marrón desde la salida L del PIA).', itc: 'ITC-BT-19', hl: { c: [c.id] },
          fix: 'Tiende un cable marrón desde la salida L (abajo) de su PIA hasta el borne L de la toma. Las tomas no llevan interruptor: la fase va directa.' });
      }
    }
  }

  /* --- receptores trifásicos --- */
  for (const c of S.comps.filter(c => defOf(c).load3)) {
    if (!sup) break;
    const conn = S.wires.some(w => w.a.c === c.id || w.b.c === c.id);
    if (!conn) { msgs.push({ lvl: 'info', txt: 'Hay un motor trifásico sin conectar (necesita L1, L2, L3 y tierra).' }); continue; }
    if (!res.lit[c.id] && energia) {
      const rs = ['L1', 'L2', 'L3'].map(t => uf.f(K(c.id, t)));
      const nFases = new Set(rs.filter(r => phs.includes(r))).size;
      if (!sup.tri) msgs.push({ lvl: 'err', txt: 'Un motor trifásico no puede funcionar con la red monofásica: necesita la Red 3~ de 400 V.', itc: 'ITC-BT-47', hl: { c: [c.id] },
        fix: 'Sustituye la Red 230 V por la Red 3~ (pestaña Enlace) y lleva L1, L2 y L3 a los tres bornes del motor.' });
      else if (nFases > 0 && nFases < 3) msgs.push({ lvl: 'err', txt: `Al motor trifásico le ${nFases === 2 ? 'falta una fase' : 'faltan dos fases'}: debe recibir L1, L2 y L3 distintas.`, itc: 'ITC-BT-47', hl: { c: [c.id] },
        fix: 'El campo magnético giratorio que arranca el motor solo aparece con las TRES fases desfasadas 120°. En la realidad, con una fase perdida el motor zumba, no gira y se quema. Comprueba que cada borne recibe una fase DISTINTA.' });
      if (rs.some(r => r === nu)) msgs.push({ lvl: 'err', txt: 'El motor trifásico tiene el neutro en un borne de fase: sus tres bornes son solo para fases.', itc: 'ITC-BT-47', hl: { c: [c.id] },
        fix: 'Este motor se conecta solo entre fases (400 V): el neutro no interviene. Cambia ese cable por la fase que falte.' });
    }
    if (!earthSet.has(uf.f(K(c.id, 'PE')))) msgs.push({ lvl: 'err', txt: 'La carcasa del motor trifásico no está puesta a tierra: une su borne PE al borne principal.', itc: 'ITC-BT-18', hl: { c: [c.id] },
      fix: 'La carcasa metálica quedaría en tensión si un devanado deriva. Une el borne PE del motor al borne principal de tierra en verde-amarillo.' });
  }

  /* --- tierra general --- */
  if ((S.comps.some(c => c.type === 'toma') || S.comps.some(c => c.type === 'borne')) && picas.length === 0) {
    msgs.push({ lvl: 'err', txt: 'La instalación no tiene puesta a tierra: añade la pica y únela al borne principal.', itc: 'ITC-BT-18',
      fix: 'La pica clavada en el terreno da salida a las corrientes de fuga: sin ella, el diferencial no tiene por dónde detectar la fuga hasta que pase por una persona. Añade la pica (pestaña Cuadro y tierra), únela al borne principal y reparte desde ahí el verde-amarillo.' });
  }

  /* --- interruptor cortando el neutro --- */
  if (sup && energia) {
    for (const sw of S.comps.filter(c => c.type === 'int' || c.type === 'conm')) {
      if (sw.type === 'int' && !sw.state.on) continue;
      const net = uf.f(K(sw.id, sw.type === 'int' ? 'p' : 'c'));
      if (net !== nu) continue;
      const t = buildUF({ open: { [sw.id]: true } });
      const fl2 = energFlags(t, sup, true);
      const apaga = S.comps.some(l => l.type === 'luz' && res.lit[l.id] && !fl2.lit[l.id]);
      if (apaga) msgs.push({ lvl: 'err', txt: 'Un interruptor está cortando el neutro: los aparatos de maniobra deben cortar siempre la fase. Lleva la fase al interruptor y el neutro directo a la lámpara.', itc: 'ITC-BT-19', hl: { c: [sw.id] },
        fix: 'La luz se apaga igual, pero el portalámparas queda EN TENSIÓN con el interruptor abierto: calambrazo al cambiar la bombilla. Invierte el montaje: fase del PIA → interruptor → lámpara, y el neutro azul directo del PIA a la lámpara.' });
    }
  }

  /* --- colores normativos --- */
  if (sup && !potCorto && !potR.phs.some(p => potEarth.has(p))) {
    const ya = new Set();
    for (const w of S.wires) {
      const n = pot.f(K(w.a.c, w.a.t));
      const esF = potR.phs.includes(n), esN = n === potR.nu, esT = potEarth.has(n);
      let k = null, m = null;
      const fixCol = 'El color no cambia cómo funciona HOY, pero el siguiente electricista confiará en él: un activo disfrazado de tierra puede matar. Toca el cable señalado y corrige su color en la ficha.';
      if ((esF || esN) && w.color === 'tierra') { k = 'vk'; m = { lvl: 'err', txt: 'Hay un conductor activo en verde-amarillo: ese color se reserva EXCLUSIVAMENTE para el conductor de protección (tierra).', itc: 'ITC-BT-19' }; }
      else if (esF && w.color === 'azul') { k = 'fa'; m = { lvl: 'warn', txt: 'Hay una fase cableada en azul: el azul se reserva para el neutro. Usa marrón, negro o gris.', itc: 'ITC-BT-19' }; }
      else if (esN && w.color !== 'azul') { k = 'na'; m = { lvl: 'warn', txt: 'El neutro debe ir siempre en azul claro.', itc: 'ITC-BT-19' }; }
      else if (esT && w.color !== 'tierra') { k = 'tv'; m = { lvl: 'warn', txt: 'Los conductores de protección (tierra) deben ser verde-amarillo.', itc: 'ITC-BT-19' }; }
      if (m && !ya.has(k)) { ya.add(k); m.hl = { w: [w.id] }; m.fix = fixCol; msgs.push(m); }
    }
    res.coloresMal = ya.size;
  }

  /* --- circuitos: cálculo y normativa --- */
  for (const ce of topo) {
    const { P, I } = consumo(ce, res.lit, res.tomas);
    const secs = [...ce.wF, ...ce.wN].map(w => w.sec);
    const smin = secs.length ? Math.min(...secs) : null;
    const lf = ce.wF.reduce((a, w) => a + w.len, 0);
    const caida = (smin && I) ? (2 * RHO_CU * lf * I) / smin : 0;
    const pct = caida / V_RED * 100;
    // tensión que llega a los receptores de este circuito (para el brillo real)
    const vLlega = V_RED - caida;
    for (const l of ce.dLoads) {
      if ((l.type === 'luz' || defOf(l).load) && res.lit[l.id]) res.vlit[l.id] = vLlega;
    }
    const cal = ce.pia.props.calibre;
    let est = ce.pia.state.trip ? 'err' : (ce.pia.state.on && ce.fed ? 'ok' : 'off');

    if (inst && smin) {
      const maxCal = MAX_PIA_SECCION[String(smin)];
      if (maxCal && cal > maxCal) {
        est = 'err';
        msgs.push({ lvl: 'err', txt: `Un PIA de ${cal} A no protege un cable de ${fmtSec(smin)} mm²: ese circuito debe protegerse con ${maxCal} A.`, itc: 'ITC-BT-25 e ITC-BT-17',
          hl: { c: [ce.pia.id], w: [...ce.wF, ...ce.wN].filter(w2 => w2.sec === smin).map(w2 => w2.id) },
          fix: `El PIA existe para que el CABLE nunca pase de su corriente admisible: con ${cal} A de calibre, un cable de ${fmtSec(smin)} mm² se recalentaría sin que nada salte (así empiezan los incendios). O bajas el PIA a ${maxCal} A (su ficha) o subes la sección de los cables señalados.` });
      }
    }
    if (inst && pct > CAIDA_MAX) {
      est = 'err';
      msgs.push({ lvl: 'err', txt: `Caída de tensión del ${fmtNum(r2(pct))} % en el circuito del PIA de ${cal} A (máximo 3 %): aumenta la sección o acorta la línea.`, itc: 'ITC-BT-19',
        hl: { w: ce.wF.map(w2 => w2.id) },
        fix: `El cable también tiene resistencia: ΔU = 2·ρ·L·I/S. Cuanto más largo y fino, más tensión se pierde por el camino (las luces brillan menos y los cables se calientan). Toca los cables señalados y sube su sección o reduce su longitud.` });
    }
    if (inst && ce.pia.props.circuito) {
      const tb = TABLA_C[ce.pia.props.circuito];
      if (tb && (tb.pia !== cal || (smin && smin < tb.sec))) {
        if (est === 'ok') est = 'warn';
        msgs.push({ lvl: 'warn', txt: `${ce.pia.props.circuito} (${tb.uso}) se ejecuta con PIA de ${tb.pia} A y sección de ${fmtSec(tb.sec)} mm² bajo tubo de ${tb.tubo} mm.`, itc: 'ITC-BT-25' });
      }
    }
    if (ce.dLoads.length && ce.fed && !ce.dif) {
      est = 'err';
      msgs.push({ lvl: 'err', txt: `El circuito del PIA de ${cal} A no pasa por ningún diferencial: es obligatorio un ID de 30 mA aguas arriba.`, itc: 'ITC-BT-24 · ITC-BT-25',
        hl: { c: [ce.pia.id] },
        fix: 'El PIA protege los cables; el DIFERENCIAL te protege a ti. Intercala un ID de 30 mA entre el IGA y este PIA: la fase y el neutro del circuito deben pasar por él para que pueda comparar la ida y la vuelta.' });
    }
    res.circuits.push({
      id: ce.pia.id, calibre: cal, circuito: ce.pia.props.circuito || '', fed: ce.fed,
      I: r1(I), P, pct: r2(pct), smin, lfase: lf, est,
      dif: ce.dif ? ce.dif.id : null, trip: ce.pia.state.trip,
      luces: ce.dLoads.filter(l => l.type === 'luz').map(l => l.id),
      tomas: ce.dLoads.filter(l => l.type === 'toma').map(l => l.id)
    });
  }

  /* --- máx. 5 circuitos por diferencial --- */
  for (const d of S.comps.filter(c => c.type === 'dif')) {
    const n = res.circuits.filter(ci => ci.dif === d.id).length;
    if (n > 5) msgs.push({ lvl: 'err', txt: `Hay ${n} circuitos colgando de un solo diferencial: el máximo es 5. Añade otro ID de 30 mA y reparte.`, itc: 'ITC-BT-25', hl: { c: [d.id] },
      fix: 'Si un solo diferencial protege demasiados circuitos, cualquier fuga deja la casa entera a oscuras y las fugas pequeñas de varios aparatos se suman hasta hacerlo saltar «sin motivo». Añade un segundo ID y reparte los PIAs entre los dos.' });
  }

  /* --- enlace: LGA, derivaciones individuales y centralización ---
     Un tramo «aguas abajo de X hasta Y» son los cables que pierden su
     conductor potencial al abrir X pero lo conservan al abrir Y. */
  const cgpAny = S.comps.find(c => c.type === 'cgp3' || c.type === 'cgp');
  const igms = S.comps.filter(c => c.type === 'igm');
  const conLGA = !!(cgpAny && igms.length);

  const caeCon = (tOpen, tR, cid, term) => {
    const nb = pot.f(K(cid, term));
    const i = potR.phs.indexOf(nb);
    if (i >= 0) return tOpen.f(K(cid, term)) !== tR.phs[i];
    if (nb === potR.nu) return tOpen.f(K(cid, term)) !== tR.nu;
    return false;
  };
  const tramoAguasAbajo = (desde, hasta) => {
    const tM = buildUF({ allClosed: true, open: { [desde.id]: true } });
    const tMR = supRoots(tM, sup);
    /* `hasta` puede ser un aparato o una lista (p. ej. todos los IGM) */
    const hs = hasta ? (Array.isArray(hasta) ? hasta : [hasta]) : [];
    const tDs = hs.map(h => {
      const t = buildUF({ allClosed: true, open: { [h.id]: true } });
      return { t, r: supRoots(t, sup) };
    });
    const wF = [], wN = [];
    for (const w of S.wires) {
      const kb = K(w.a.c, w.a.t);
      const nb = pot.f(kb);
      const i = potR.phs.indexOf(nb);
      const esFase = i >= 0, esNeutro = nb === potR.nu;
      if (!esFase && !esNeutro) continue;
      if (!(esFase ? tM.f(kb) !== tMR.phs[i] : tM.f(kb) !== tMR.nu)) continue;
      if (tDs.some(({ t, r }) => esFase ? t.f(kb) !== r.phs[i] : t.f(kb) !== r.nu)) continue;
      (esFase ? wF : wN).push(w);
    }
    let P = 0, I = 0;
    const cargas = [];
    for (const c of S.comps) {
      const d = defOf(c);
      const esToma = c.type === 'toma';
      const enMarcha = esToma
        ? (res.tomas[c.id] && res.tomas[c.id].tension && c.props.carga > 0)
        : ((c.type === 'luz' || d.load || d.load3) && res.lit[c.id]);
      if (!enMarcha) continue;
      const terms = d.load3 ? ['L1', 'L2', 'L3'] : ['L'];
      if (!terms.some(tm => caeCon(tM, tMR, c.id, tm))) continue;
      cargas.push(c.id);
      P += esToma ? c.props.carga : c.props.potencia;
      I += esToma ? c.props.carga / (V_RED * (c.props.fp || 1)) : iReceptor(c);
    }
    return { wF, wN, P, I, cargas };
  };

  if (sup && !potCorto) {
    const medidas = [...S.comps.filter(c => c.type === 'cpm'), ...S.comps.filter(c => c.type === 'contador')];
    const dgs = [...S.comps.filter(c => c.type === 'icp'), ...S.comps.filter(c => c.type === 'iga')];

    /* derivaciones individuales (ITC-BT-15) y potencia por equipo de medida */
    for (const medida of medidas) {
      const total = tramoAguasAbajo(medida, null);
      res.pMedida[medida.id] = total.P;
      const tM = buildUF({ allClosed: true, open: { [medida.id]: true } });
      const tMR = supRoots(tM, sup);
      const dg = dgs.find(d2 => caeCon(tM, tMR, d2.id, 'Li'));
      const tr = dg ? tramoAguasAbajo(medida, dg) : total;
      if (!tr.wF.length) continue;
      const smin = Math.min(...[...tr.wF, ...tr.wN].map(w => w.sec));
      const lf = tr.wF.reduce((a, w) => a + w.len, 0);
      const vDI = (2 * RHO_CU * lf * total.I) / smin;
      const pct = r2(vDI / V_RED * 100);
      const lim = conLGA ? DI_CAIDA_CON_LGA : DI_CAIDA_SIN_LGA;
      res.dis.push({ smin, pct, lf, lim });
      /* la caída de esta DI la sufren todos sus receptores aguas abajo */
      for (const id of total.cargas) res.vEnlace[id] = (res.vEnlace[id] || 0) + vDI;
      const diIds = [...tr.wF, ...tr.wN].map(w2 => w2.id);
      if (inst && smin < DI_SEC_MIN) {
        msgs.push({ lvl: 'err', txt: `Una derivación individual tiene tramos de ${fmtSec(smin)} mm²: la sección mínima es ${DI_SEC_MIN} mm².`, itc: 'ITC-BT-15', hl: { w: diIds },
          fix: `La DI lleva TODA la potencia de la vivienda, por eso la norma le exige al menos ${DI_SEC_MIN} mm². Toca los cables señalados y sube su sección en la ficha.` });
      }
      if (inst && pct > lim) {
        msgs.push({ lvl: 'err', txt: `Caída de tensión del ${fmtNum(pct)} % en una derivación individual (máximo ${fmtNum(lim)} % ${conLGA ? 'con contadores centralizados' : 'para un solo usuario sin LGA'}): aumenta la sección o acorta el tramo.`, itc: 'ITC-BT-15', hl: { w: diIds },
          fix: 'Si el enlace ya pierde demasiada tensión, a la vivienda le llega menos de lo debido incluso antes de empezar sus circuitos. Sube la sección de los cables señalados o acorta su longitud (ficha del cable).' });
      }
    }
    res.di = res.dis[0] || null;

    /* LGA (ITC-BT-14): tramo CGP → IGM (con sus ramas a cada centralización) */
    if (conLGA) {
      const tr = tramoAguasAbajo(cgpAny, igms);
      if (tr.wF.length) {
        const smin = Math.min(...[...tr.wF, ...tr.wN].map(w => w.sec));
        const lf = tr.wF.reduce((a, w) => a + w.len, 0) / sup.phases.length;   // longitud por fase
        const iFases = demandaPorFase(uf, fl, sup);
        const iMax = Math.max(...iFases, 0);
        const lim = igms.length > 1 ? LGA_CAIDA_PARCIAL : LGA_CAIDA_UNICA;
        const caida = sup.tri ? (Math.sqrt(3) * RHO_CU * lf * iMax) / smin : (2 * RHO_CU * lf * iMax) / smin;
        const pct = r2(caida / (sup.tri ? V_LL : V_RED) * 100);
        res.lga = { smin, pct, lim };
        /* caída fase-neutro de la LGA: la sufre todo lo que hay aguas abajo */
        const vFN = sup.tri ? caida / Math.sqrt(3) : caida;
        if (vFN > 0.001) for (const c of S.comps) {
          const d = defOf(c);
          if (c.type === 'luz' || c.type === 'toma' || d.load || d.load3) res.vEnlace[c.id] = (res.vEnlace[c.id] || 0) + vFN;
        }
        const lgaIds = [...tr.wF, ...tr.wN].map(w2 => w2.id);
        if (inst && smin < LGA_SEC_MIN) msgs.push({ lvl: 'err', txt: `La línea general de alimentación tiene tramos de ${fmtSec(smin)} mm²: la sección mínima es ${LGA_SEC_MIN} mm² en cobre.`, itc: 'ITC-BT-14', hl: { w: lgaIds },
          fix: `La LGA alimenta el edificio ENTERO: todas las viviendas suman su corriente en ella. Sube la sección de los cables señalados a ${LGA_SEC_MIN} mm² o más.` });
        if (inst && pct > lim) msgs.push({ lvl: 'err', txt: `Caída de tensión del ${fmtNum(pct)} % en la LGA (máximo ${fmtNum(lim)} % hacia ${igms.length > 1 ? 'centralizaciones parciales' : 'una centralización única'}): aumenta la sección.`, itc: 'ITC-BT-14', hl: { w: lgaIds },
          fix: 'El límite es tan estricto (0,5–1 %) porque lo que se pierda aquí lo sufren TODAS las viviendas a la vez. Sube la sección de los cables señalados.' });
      }
    }

    /* centralización sin IGM en cabecera */
    const hayCentral = S.comps.some(c => c.type === 'fusi' || c.type === 'cvivienda') ||
      S.comps.filter(c => c.type === 'contador').length >= 2;
    if (hayCentral && !igms.length) {
      msgs.push({ lvl: 'warn', txt: 'Una centralización de contadores lleva en cabecera un Interruptor General de Maniobra (IGM): 160 A hasta 90 kW de previsión.', itc: 'ITC-BT-16' });
    }

    /* reparto de fases entre viviendas */
    if (sup.tri) {
      const vivs = S.comps.filter(c => c.type === 'cvivienda');
      const idx = vivs.map(v => potR.phs.indexOf(pot.f(K(v.id, 'L')))).filter(i => i >= 0);
      if (idx.length >= 2 && new Set(idx).size === 1) {
        msgs.push({ lvl: 'warn', txt: 'Todas las viviendas cuelgan de la MISMA fase: reparte las derivaciones individuales entre L1, L2 y L3 para equilibrar la red.', itc: 'ITC-BT-16' });
      }
      const iFases = demandaPorFase(uf, fl, sup);
      if (iFases.length === 3 && Math.max(...iFases) - Math.min(...iFases) > 15) {
        msgs.push({ lvl: 'warn', txt: `Fases desequilibradas: L1 ${fmtNum(r1(iFases[0]))} A · L2 ${fmtNum(r1(iFases[1]))} A · L3 ${fmtNum(r1(iFases[2]))} A. Reparte mejor las cargas.`, itc: 'ITC-BT-16' });
      }
    }
  }

  /* --- cascada real: al receptor le llega la red menos TODAS las caídas
     (LGA + derivación individual + circuito interior) --- */
  for (const id of Object.keys(res.vlit)) {
    if (res.vEnlace[id]) res.vlit[id] = Math.max(0, res.vlit[id] - res.vEnlace[id]);
  }

  /* --- viviendas compactas: la DI lleva también la tierra --- */
  for (const c of S.comps.filter(c => c.type === 'cvivienda')) {
    if (!sup) break;
    const conn = S.wires.some(w => w.a.c === c.id || w.b.c === c.id);
    if (!conn) { msgs.push({ lvl: 'info', txt: 'Hay un cuadro de vivienda sin conectar: su derivación individual lleva fase, neutro y tierra.' }); continue; }
    if (!earthSet.has(uf.f(K(c.id, 'PE')))) {
      msgs.push({ lvl: 'err', txt: 'A una vivienda no le llega el conductor de protección: la derivación individual lleva fase, neutro Y tierra (verde-amarillo).', itc: 'ITC-BT-15 · ITC-BT-26', hl: { c: [c.id] },
        fix: 'Une el borne PE de la vivienda señalada con el borne principal de tierra (y este con la pica) en verde-amarillo: sin ese conductor, ninguna toma de esa vivienda tendría tierra.' });
    }
  }

  /* --- volúmenes de baño (ITC-BT-27): reglas de colocación --- */
  if (S.comps.some(c => c.type === 'banera')) {
    for (const c of S.comps) {
      if (defOf(c).zona) continue;
      const vol = volumenBano(c);
      if (vol == null) continue;
      if (c.type === 'toma' && vol <= 2) {
        msgs.push({ lvl: 'err', txt: `Hay una base de enchufe en el volumen ${vol} del baño: prohibida. Solo se admiten en el volumen 3, protegidas por diferencial de 30 mA.`, itc: 'ITC-BT-27', hl: { c: [c.id] },
          fix: 'Arrastra la toma más allá de la línea V2 (a 0,6 m de la bañera): en el volumen 3 ya es reglamentaria con su diferencial de 30 mA. Pegada a la bañera solo cabría una toma MBTS de 12 V o de afeitadora con transformador separador.' });
      } else if ((c.type === 'int' || c.type === 'conm' || c.type === 'puls') && vol <= 2) {
        msgs.push({ lvl: 'err', txt: `Hay un mecanismo (interruptor/conmutador) en el volumen ${vol} del baño: los mecanismos van en el volumen 3 o fuera.`, itc: 'ITC-BT-27', hl: { c: [c.id] },
          fix: 'Accionar un interruptor con las manos mojadas y los pies en la bañera es el accidente clásico. Sácalo de la franja V2: en V3 —o fuera del baño, junto a la puerta— ya es reglamentario. En V0–V2 solo se admiten mecanismos MBTS de 12 V.' });
      } else if (c.type === 'luz' && vol === 1) {
        msgs.push({ lvl: 'err', txt: 'Hay una luminaria en el volumen 1 (sobre la bañera): solo se admiten aparatos MBTS de 12 V o aptos para ese volumen.', itc: 'ITC-BT-27', hl: { c: [c.id] },
          fix: 'Muévela al volumen 2 o 3. Justo encima de la bañera solo caben luminarias de muy baja tensión de seguridad (12 V) o específicamente aptas (IPX5).' });
      } else if (c.type === 'luz' && vol === 2) {
        msgs.push({ lvl: 'warn', txt: 'Luminaria en el volumen 2 del baño: debe ser de clase II con protección IPX4 como mínimo (aquí se da por buena).', itc: 'ITC-BT-27', hl: { c: [c.id] } });
      }
    }
  }

  /* --- IGA en cabecera --- */
  if (S.comps.some(c => c.type === 'pia') && sup && !potCorto) {
    const igas = S.comps.filter(c => c.type === 'iga');
    const sinIGA = res.circuits.some(ci => ci.fed && !igas.some(g => {
      const t2 = buildUF({ allClosed: true, open: { [g.id]: true } });
      const t2R = supRoots(t2, sup);
      return !t2R.phs.includes(t2.f(K(ci.id, 'Li')));
    }));
    if (igas.length === 0) { res.igaOK = false; msgs.push({ lvl: 'warn', txt: 'Falta el IGA: todo cuadro de vivienda lleva un Interruptor General Automático en cabecera.', itc: 'ITC-BT-17',
      fix: 'El IGA permite dejar sin tensión TODA la vivienda de un golpe (para trabajar con seguridad) y protege el conjunto. Añádelo el primero del cuadro: la alimentación entra por él y de su salida cuelga todo lo demás.' }); }
    else if (sinIGA) { res.igaOK = false; msgs.push({ lvl: 'warn', txt: 'Hay circuitos con tensión que no pasan por el IGA: debe estar en cabecera, cortando toda la instalación.', itc: 'ITC-BT-17', hl: { c: igas.map(g => g.id) },
      fix: 'Si algún circuito se alimenta «puenteando» el IGA, bajarlo no deja la casa sin tensión y alguien puede llevarse un susto. Recablea para que TODO pase primero por el IGA.' }); }
  }

  /* --- diferencial con tensión (para el botón T) --- */
  for (const d of S.comps.filter(c => c.type === 'dif')) {
    res.difConTension[d.id] = !!(energia && phs.includes(uf.f(K(d.id, 'Li'))));
  }

  /* --- cables con tensión (animación) --- */
  if (energia) {
    for (const w of S.wires) {
      const n = uf.f(K(w.a.c, w.a.t));
      if (phs.includes(n) || n === nu) res.liveW[w.id] = true;
    }
  }

  /* --- resumen --- */
  const algoLuce = Object.values(res.lit).some(Boolean);
  const algoToma = Object.values(res.tomas).some(t => t.tension);
  const hayErr = msgs.some(m => m.lvl === 'err');
  const hayWarn = msgs.some(m => m.lvl === 'warn');
  if ((algoLuce || algoToma) && !hayErr) {
    msgs.unshift({ lvl: 'ok', txt: hayWarn ? 'La instalación funciona, pero revisa los avisos.' : 'La instalación funciona y el cableado es correcto.' });
  }
  return res;
}

/* ==================================================================
   PANEL DE RESULTADOS
   ================================================================== */
function renderResults() {
  if (!SIM) return;
  if (S.lab && SIM.lab) { renderLabResults(); return; }
  const dot = $('#resDot'), txt = $('#resTxt');

  /* modo avería: solo el síntoma, sin diagnóstico */
  if (S.averia) {
    const a = AVERIAS.find(x => x.id === S.averia);
    const sint = a ? esc(a.s) : (S.averiaGen ? S.averiaGen.sintomas.map(esc).join('<br><br>') : '');
    dot.className = 'warn';
    txt.textContent = 'Avería: localiza el fallo';
    $('#resBody').innerHTML = `<div class="msg warn"><span class="mdot"></span><div><b>Parte de avería:</b><br>${sint}</div></div>
      <div class="msg info"><span class="mdot"></span><div>Inspecciona el montaje, usa el <b>multímetro</b> (menú), acciona interruptores y protecciones, repara lo que veas mal y pulsa <b>Comprobar</b> arriba. Aquí no hay pistas.</div></div>`;
    return;
  }
  /* modo reglamento: sin pistas en vivo; se evalúa con el boletín */
  if (S.mode === 'reglamento') {
    dot.className = 'off';
    txt.textContent = 'Reglamento: sin pistas · emite el boletín';
    let hh = '';
    if (SIM.circuits.length) {
      hh += `<table class="ctable"><tr><th></th><th>Circuito</th><th>I</th><th>ΔU</th><th>Sección</th></tr>`;
      for (const ci of SIM.circuits) {
        hh += `<tr><td><span class="cdot off"></span></td>
          <td>PIA ${ci.calibre} A${ci.circuito ? ' · ' + ci.circuito : ''}</td>
          <td>${fmtNum(ci.I)} A</td><td>${fmtNum(ci.pct)} %</td>
          <td>${ci.smin ? fmtSec(ci.smin) + ' mm²' : '—'}</td></tr>`;
      }
      hh += `</table>`;
    }
    hh += `<div class="msg info"><span class="mdot"></span><div>Autoevaluación: monta la instalación sin ayudas (las medidas de arriba son tu multímetro) y emite el boletín cuando la des por terminada.</div></div>
      <button class="bigbtn pri" data-m="boletin">Emitir boletín de conformidad</button>`;
    $('#resBody').innerHTML = hh;
    return;
  }

  const errs = SIM.msgs.filter(m => m.lvl === 'err').length;
  const warns = SIM.msgs.filter(m => m.lvl === 'warn').length;
  const activo = Object.values(SIM.lit).some(Boolean) || Object.values(SIM.tomas).some(t => t.tension);
  let cls = 'off', t = 'Sin tensión';
  if (errs) { cls = 'err'; t = errs + (errs === 1 ? ' fallo' : ' fallos') + (warns ? ` · ${warns} aviso${warns > 1 ? 's' : ''}` : ''); }
  else if (warns) { cls = 'warn'; t = warns + (warns === 1 ? ' aviso' : ' avisos'); }
  else if (activo) { cls = 'ok'; t = 'Todo funciona correctamente'; }
  else t = SIM.sinRed ? 'Añade la Red 230 V' : 'En reposo: sin receptores funcionando';
  dot.className = cls; txt.textContent = t;

  let h = '';
  if (S.mode === 'instalador' && SIM.circuits.length) {
    h += `<table class="ctable"><tr><th></th><th>Circuito</th><th>I</th><th>ΔU</th><th>Sección</th></tr>`;
    for (const ci of SIM.circuits) {
      h += `<tr><td><span class="cdot ${ci.trip ? 'err' : ci.est}"></span></td>
        <td>PIA ${ci.calibre} A${ci.circuito ? ' · ' + ci.circuito : ''}${ci.trip ? ' · disparado' : ''}</td>
        <td>${fmtNum(ci.I)} A</td><td>${fmtNum(ci.pct)} %</td>
        <td>${ci.smin ? fmtSec(ci.smin) + ' mm²' : '—'}</td></tr>`;
    }
    h += `</table>`;
  }
  if (!SIM.msgs.length) h += `<div class="msg info"><span class="mdot"></span><div>Monta componentes y cablea para ver aquí el diagnóstico.</div></div>`;
  h += msgsHTML(SIM.msgs);
  $('#resBody').innerHTML = h;
}

/* mensajes del panel: los que llevan solución o señalización son tocables */
function msgsHTML(msgs) {
  let h = '';
  msgs.forEach((m, i) => {
    /* durante un reto no se regalan las soluciones: para eso están las pistas */
    const acc = !!(m.fix || m.hl) && !S.reto;
    const abierto = acc && S.msgOpen === i;
    h += `<div class="msg ${m.lvl}${acc ? ' acc' : ''}"${acc ? ` data-mi="${i}"` : ''}><span class="mdot"></span><div>
      ${esc(m.txt)}${m.itc ? `<span class="itc">${esc(m.itc)}</span>` : ''}
      ${abierto && m.fix ? `<div class="fix">💡 ${esc(m.fix)}</div>` : ''}
      ${acc ? `<div class="verSol">${abierto ? (m.hl ? 'Señalado en el plano (cierra este panel para verlo)' : '') : 'Toca aquí: solución y dónde está'}</div>` : ''}
    </div></div>`;
  });
  return h;
}

/* tocar un mensaje: desplegar la solución y señalar el problema en el plano */
$('#resBody').addEventListener('click', e => {
  const el = e.target.closest('[data-mi]');
  if (!el || !SIM) return;
  const i = Number(el.dataset.mi);
  const m = SIM.msgs[i];
  if (!m) return;
  if (S.msgOpen === i) {
    S.msgOpen = null; S.hl = null; S.hlC = null;
  } else {
    S.msgOpen = i;
    S.hl = m.hl && m.hl.w ? new Set(m.hl.w) : null;
    S.hlC = m.hl && m.hl.c ? new Set(m.hl.c) : null;
    if (m.hl && m.hl.c && m.hl.c.length) panTo(m.hl.c[0]);
  }
  render();
});
