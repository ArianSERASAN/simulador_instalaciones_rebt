/* ==================================================================
   CATÁLOGO DE COMPONENTES
   terms: bornes {id,x,y,kind(L|N|PE|X),lbl}
   act: zona táctil de accionamiento
   ================================================================== */

function fichaTxt(html) { return html; }

const DEFS = {

  red: {
    nombre: 'Red 230 V', corto: 'Red',
    w: 132, h: 62, din: false, unico: true,
    terms: [{ id: 'L', x: 44, y: 62, kind: 'L', lbl: 'L' }, { id: 'N', x: 88, y: 62, kind: 'N', lbl: 'N' }],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Punto de suministro de la compañía: entrega <b>230 V</b> en corriente alterna entre <b>fase (L)</b> y <b>neutro (N)</b>. En la Fase 2 se detallará la instalación de enlace completa (acometida, CGP con fusibles, contador e ICP). <span class="itc">ITC-BT-06 a ITC-BT-17</span>`)
  },

  iga: {
    nombre: 'IGA · Interruptor General Automático', corto: 'IGA',
    w: 64, h: 104, din: true,
    terms: [
      { id: 'Li', x: 20, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 44, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 20, y: 104, kind: 'L', lbl: 'L' }, { id: 'No', x: 44, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ calibre: 25 }), state: () => ({ on: false, trip: false }), act: 'palanca',
    ficha: fichaTxt(`Corta y protege <b>toda</b> la instalación interior contra sobrecargas y cortocircuitos. Su calibre fija el grado de electrificación: <b>25 A → básica (5.750 W)</b>, <b>40 A → elevada (9.200 W)</b>. Se monta el primero del cuadro. <span class="itc">ITC-BT-17</span> <span class="itc">ITC-BT-25</span>`)
  },

  dif: {
    nombre: 'Interruptor diferencial (ID)', corto: 'Diferencial',
    w: 64, h: 104, din: true,
    terms: [
      { id: 'Li', x: 20, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 44, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 20, y: 104, kind: 'L', lbl: 'L' }, { id: 'No', x: 44, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ calibre: 40, sens: 30 }), state: () => ({ on: false, trip: false }), act: 'palanca',
    ficha: fichaTxt(`Protege a las <b>personas</b>: vigila que la corriente que sale por la fase vuelva por el neutro; si hay una fuga a tierra mayor de <b>30 mA</b>, dispara. Típico en vivienda: <b>40 A / 30 mA, tipo AC</b>. Máximo <b>5 circuitos</b> por diferencial. Pulsa <b>T</b> para probarlo (hazlo una vez al mes en tu casa). <span class="itc">ITC-BT-24</span> <span class="itc">ITC-BT-25</span>`)
  },

  pia: {
    nombre: 'PIA · Magnetotérmico', corto: 'PIA',
    w: 52, h: 104, din: true,
    terms: [
      { id: 'Li', x: 16, y: 0, kind: 'L', lbl: 'L' }, { id: 'Ni', x: 38, y: 0, kind: 'N', lbl: 'N' },
      { id: 'Lo', x: 16, y: 104, kind: 'L', lbl: 'L' }, { id: 'No', x: 38, y: 104, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ calibre: 16, circuito: '' }), state: () => ({ on: false, trip: false }), act: 'palanca',
    ficha: fichaTxt(`Pequeño Interruptor Automático: protege <b>un circuito</b> contra sobrecargas y cortocircuitos. Regla de oro: el PIA se elige para <b>proteger el cable</b>, no el aparato → 1,5 mm²·10 A · 2,5 mm²·16 A · 4 mm²·20 A · 6 mm²·25 A. <span class="itc">ITC-BT-25</span> <span class="itc">ITC-BT-17</span>`)
  },

  int: {
    nombre: 'Interruptor simple', corto: 'Interruptor',
    w: 76, h: 92, din: false,
    terms: [
      { id: 'p', x: 22, y: 0, kind: 'X', lbl: 'entrada' },
      { id: 's', x: 54, y: 0, kind: 'X', lbl: 'salida' }
    ],
    props: () => ({}), state: () => ({ on: false }), act: 'tecla',
    ficha: fichaTxt(`Maniobra básica: abre o cierra el paso de la corriente hacia un punto de luz. Debe cortar siempre la <b>fase</b>, nunca el neutro: la fase entra por un borne y sale por el otro hacia la lámpara (el «retorno», en negro o gris). <span class="itc">ITC-BT-19</span>`)
  },

  conm: {
    nombre: 'Conmutador', corto: 'Conmutador',
    w: 76, h: 92, din: false,
    terms: [
      { id: 'c', x: 38, y: 0, kind: 'X', lbl: 'común' },
      { id: 'l1', x: 22, y: 92, kind: 'X', lbl: 'L1' },
      { id: 'l2', x: 54, y: 92, kind: 'X', lbl: 'L2' }
    ],
    props: () => ({}), state: () => ({ pos: false }), act: 'tecla',
    ficha: fichaTxt(`Permite encender una lámpara desde <b>dos puntos</b> (conmutación). El borne <b>común</b> conecta alternativamente con <b>L1</b> o <b>L2</b>. Montaje: fase → común del 1º · L1↔L1 y L2↔L2 entre ambos · común del 2º → lámpara. <span class="itc">ITC-BT-19</span>`)
  },

  luz: {
    nombre: 'Punto de luz', corto: 'Luz',
    w: 84, h: 112, din: false,
    terms: [
      { id: 'L', x: 30, y: 0, kind: 'L', lbl: 'L' },
      { id: 'N', x: 54, y: 0, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ potencia: 60 }), state: () => ({}),
    ficha: fichaTxt(`Receptor de alumbrado (circuito <b>C1</b>: PIA 10 A · 1,5 mm² · máx. 30 puntos). La <b>fase llega por el interruptor</b> al portalámparas y el <b>neutro va directo</b> a la lámpara. <span class="itc">ITC-BT-25</span>`)
  },

  toma: {
    nombre: 'Base de enchufe (schuko)', corto: 'Enchufe',
    w: 92, h: 96, din: false,
    terms: [
      { id: 'L', x: 22, y: 0, kind: 'L', lbl: 'L' },
      { id: 'PE', x: 46, y: 0, kind: 'PE', lbl: 'PE' },
      { id: 'N', x: 70, y: 0, kind: 'N', lbl: 'N' }
    ],
    props: () => ({ carga: 0, fp: 1 }), state: () => ({}),
    ficha: fichaTxt(`Toma de corriente 16 A 2P+T. Necesita <b>fase, neutro y tierra</b>. Uso general → <b>C2</b> (16 A · 2,5 mm²); cocina/horno → <b>C3</b> (25 A · 6 mm²); lavadora/termo → <b>C4</b>; baño y aux. cocina → <b>C5</b>. En modo Instalador puedes enchufarle una carga (W). <span class="itc">ITC-BT-25</span> <span class="itc">ITC-BT-26</span>`)
  },

  borne: {
    nombre: 'Borne principal de tierra', corto: 'Borne tierra',
    w: 128, h: 46, din: false,
    terms: [
      { id: 'p1', x: 16, y: 0, kind: 'PE', lbl: '' }, { id: 'p2', x: 40, y: 0, kind: 'PE', lbl: '' },
      { id: 'p3', x: 64, y: 0, kind: 'PE', lbl: '' }, { id: 'p4', x: 88, y: 0, kind: 'PE', lbl: '' },
      { id: 'p5', x: 112, y: 0, kind: 'PE', lbl: '' }
    ],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Punto de unión de todos los conductores de protección (<b>verde-amarillo</b>) con la línea que baja a la pica. Todos sus bornes están unidos entre sí. Desde aquí la tierra se reparte a cada circuito. <span class="itc">ITC-BT-18</span> <span class="itc">ITC-BT-26</span>`)
  },

  pica: {
    nombre: 'Pica de tierra', corto: 'Pica',
    w: 64, h: 112, din: false,
    terms: [{ id: 'PE', x: 32, y: 0, kind: 'PE', lbl: 'PE' }],
    props: () => ({}), state: () => ({}),
    ficha: fichaTxt(`Electrodo de acero-cobre clavado en el terreno: da salida a las corrientes de fuga y estabiliza el potencial de la instalación. Se une al <b>borne principal</b> con conductor verde-amarillo. Sin tierra, el diferencial no puede protegerte bien de los contactos indirectos. <span class="itc">ITC-BT-18</span> <span class="itc">ITC-BT-24</span>`)
  }
};
