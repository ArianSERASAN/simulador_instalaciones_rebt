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
  { q: 'La acometida es…', ops: ['El tramo del cuadro a los enchufes', 'El tramo de la red de distribución hasta la CGP, responsabilidad de la empresa distribuidora', 'La toma de tierra', 'El hilo de mando'], ok: 1, itc: 'ITC-BT-11', exp: 'Une la red de la compañía con la caja general de protección.' },
  { q: '¿Dónde puede instalarse una toma de corriente normal en un cuarto de baño?', ops: ['En cualquier sitio si tiene tierra', 'En el volumen 1, junto a la bañera', 'En el volumen 3, protegida por diferencial de 30 mA', 'Está prohibida en todo el baño'], ok: 2, itc: 'ITC-BT-27', exp: 'En los volúmenes 0, 1 y 2 no se admiten tomas normales; en el volumen 3 sí, con diferencial de 30 mA (o MBTS / transformador separador).' },
  { q: 'La franja del volumen 2 alrededor de la bañera se extiende…', ops: ['0,20 m', '0,60 m desde el volumen 1', '1,50 m', '3 m'], ok: 1, itc: 'ITC-BT-27', exp: 'El volumen 2 llega hasta 0,60 m del borde del volumen 1; el volumen 3 se extiende 2,40 m más.' },

  /* ---- fundamentos de electrotecnia ---- */
  { q: '¿Qué intensidad consume un aparato de 2.300 W a 230 V?', ops: ['1 A', '10 A', '23 A', '100 A'], ok: 1, itc: 'Fundamentos', exp: 'I = P / V = 2300 / 230 = 10 A.' },
  { q: 'Con la ley de Ohm: ¿qué corriente circula por 48 Ω a 12 V?', ops: ['0,25 A', '4 A', '0,4 A', '576 A'], ok: 0, itc: 'Fundamentos', exp: 'I = V / R = 12 / 48 = 0,25 A.' },
  { q: 'Dos resistencias de 10 Ω y 20 Ω en SERIE equivalen a…', ops: ['6,7 Ω', '15 Ω', '30 Ω', '200 Ω'], ok: 2, itc: 'Fundamentos', exp: 'En serie se suman: 10 + 20 = 30 Ω.' },
  { q: 'Dos resistencias iguales de 10 Ω en PARALELO equivalen a…', ops: ['20 Ω', '10 Ω', '5 Ω', '1 Ω'], ok: 2, itc: 'Fundamentos', exp: 'En paralelo, dos iguales dan la mitad: 5 Ω.' },
  { q: '¿Cuánta potencia admite como máximo un circuito con PIA de 16 A a 230 V?', ops: ['1.610 W', '2.300 W', '3.680 W', '5.750 W'], ok: 2, itc: 'Fundamentos', exp: 'P = V · I = 230 · 16 = 3.680 W.' },
  { q: 'Un radiador de 2 kW funcionando 3 horas consume…', ops: ['0,66 kWh', '2 kWh', '5 kWh', '6 kWh'], ok: 3, itc: 'Fundamentos', exp: 'Energía = P · t = 2 kW · 3 h = 6 kWh: eso es lo que factura el contador.' },
  { q: 'La frecuencia de la red eléctrica en España es…', ops: ['25 Hz', '50 Hz', '60 Hz', '100 Hz'], ok: 1, itc: 'REBT', exp: 'Corriente alterna senoidal de 50 Hz.' },
  { q: 'El calentamiento de un conductor al paso de la corriente se llama…', ops: ['Efecto Joule', 'Efecto Hall', 'Inducción', 'Histéresis'], ok: 0, itc: 'Fundamentos', exp: 'P = I²·R: la resistencia del conductor disipa calor. Por eso importan las secciones.' },
  { q: 'El amperímetro se conecta… y el voltímetro se conecta…', ops: ['Ambos en serie', 'En serie · en paralelo', 'En paralelo · en serie', 'Ambos en paralelo'], ok: 1, itc: 'Fundamentos', exp: 'La corriente se mide atravesando el aparato (serie); la tensión, comparando dos puntos (paralelo).' },
  { q: 'El cos φ (factor de potencia) relaciona…', ops: ['Tensión y corriente máximas', 'Potencia activa y potencia aparente', 'Energía y tiempo', 'Resistencia e impedancia'], ok: 1, itc: 'Fundamentos', exp: 'cos φ = P/S. Con cargas inductivas (motores) parte de la corriente no produce trabajo útil.' },
  { q: 'La potencia de un motor trifásico de 400 V que absorbe 10 A con cos φ = 0,9 es ≈…', ops: ['3,6 kW', '4 kW', '6,2 kW', '9 kW'], ok: 2, itc: 'Fundamentos', exp: 'P = √3 · 400 · 10 · 0,9 ≈ 6.235 W.' },
  { q: '¿Qué material es mejor conductor?', ops: ['PVC', 'Cobre', 'Madera seca', 'Cerámica'], ok: 1, itc: 'Fundamentos', exp: 'El cobre es el conductor habitual en BT; el PVC/XLPE hace de aislante.' },
  { q: 'La red de distribución doméstica suministra corriente…', ops: ['Continua', 'Alterna senoidal', 'Pulsada', 'Trifásica continua'], ok: 1, itc: 'REBT', exp: 'Alterna de 50 Hz; la continua aparece tras rectificadores (cargadores, electrónica).' },

  /* ---- protecciones y tierra ---- */
  { q: 'La curva típica de los PIA de vivienda es la…', ops: ['Curva B', 'Curva C', 'Curva D', 'Curva K'], ok: 1, itc: 'ITC-BT-22', exp: 'La curva C (magnético entre 5 y 10 · In) cubre los picos de arranque domésticos.' },
  { q: 'Que dispare primero la protección más CERCANA al defecto se llama…', ops: ['Redundancia', 'Selectividad', 'Discriminación térmica', 'Amperimetría'], ok: 1, itc: 'ITC-BT-22', exp: 'Así el fallo de un circuito no deja sin servicio el resto: PIA antes que IGA, IGA antes que fusibles.' },
  { q: 'Un contacto INDIRECTO es…', ops: ['Tocar una fase directamente', 'Tocar una masa metálica accidentalmente en tensión por un fallo', 'Tocar el neutro', 'Un cortocircuito'], ok: 1, itc: 'ITC-BT-24', exp: 'Contra ellos protegen el diferencial y la puesta a tierra actuando juntos.' },
  { q: 'La protección contra sobretensiones (rayos, maniobras de red) la trata…', ops: ['ITC-BT-22', 'ITC-BT-23', 'ITC-BT-25', 'ITC-BT-27'], ok: 1, itc: 'ITC-BT-23', exp: 'Sobreintensidades: BT-22 · SOBRETENSIONES: BT-23 (protectores tipo 1/2/3).' },
  { q: 'Antes de rearmar un PIA que ha disparado conviene…', ops: ['Rearmarlo varias veces seguidas', 'Localizar y corregir la causa del disparo', 'Puentearlo', 'Sustituirlo por uno mayor'], ok: 1, itc: 'ITC-BT-22', exp: 'El disparo es un síntoma: rearmar sin investigar repite el fallo o lo esconde.' },
  { q: 'El corte del IGA debe ser…', ops: ['Solo de la fase', 'Solo del neutro', 'Omnipolar (fase y neutro a la vez)', 'Solo de la tierra'], ok: 2, itc: 'ITC-BT-17', exp: 'Los dispositivos generales cortan todos los conductores activos simultáneamente.' },
  { q: 'Un diferencial de tipo A, frente a uno de tipo AC, detecta además…', ops: ['Corrientes de fuga con componente continua pulsante', 'Sobrecargas', 'Cortocircuitos', 'Sobretensiones'], ok: 0, itc: 'ITC-BT-24', exp: 'Los equipos electrónicos pueden fugar corrientes pulsantes que el tipo AC no ve.' },
  { q: 'En un fusible, la marca «gG» indica…', ops: ['Uso general (protege sobrecarga y cortocircuito)', 'Solo motores', 'Acción ultrarrápida', 'Alta tensión'], ok: 0, itc: 'ITC-BT-22', exp: 'gG: uso general. aM: acompañamiento de motores (solo cortocircuitos).' },
  { q: 'En locales húmedos, la tensión de contacto límite convencional es…', ops: ['12 V', '24 V', '50 V', '230 V'], ok: 1, itc: 'ITC-BT-18 · ITC-BT-24', exp: '24 V en locales húmedos o mojados; 50 V en secos. De ahí se dimensiona la resistencia de tierra.' },
  { q: 'Para una fase de 16 mm², el conductor de protección debe ser de…', ops: ['2,5 mm²', 'La mitad', '16 mm² (igual que la fase)', 'El doble'], ok: 2, itc: 'ITC-BT-18', exp: 'Hasta 16 mm², el PE es de la misma sección que la fase (después: 16, y a partir de 35, la mitad).' },
  { q: 'Al borne principal de tierra se conectan…', ops: ['Solo la pica', 'Los conductores de protección, la línea de enlace con el electrodo y las masas', 'Fase y neutro', 'Solo el pararrayos'], ok: 1, itc: 'ITC-BT-18 · ITC-BT-26', exp: 'Es el punto de reunión de toda la red de tierra del edificio.' },
  { q: 'Un aparato de CLASE II se caracteriza por…', ops: ['Llevar doble aislamiento y no necesitar tierra', 'Funcionar a 12 V', 'Llevar fusible interno', 'Ser trifásico'], ok: 0, itc: 'ITC-BT-24', exp: 'El símbolo del doble cuadrado: aislamiento reforzado en lugar de conexión a tierra.' },
  { q: 'En la designación IP, el segundo dígito (IPX4, IPX5…) indica protección contra…', ops: ['Polvo', 'Agua', 'Impactos', 'Corrosión'], ok: 1, itc: 'ITC-BT-27', exp: 'Primer dígito: sólidos/polvo; segundo: agua (4 = salpicaduras, 5 = chorros).' },
  { q: 'La MBTS admitida en los volúmenes 0 y 1 del baño es de…', ops: ['12 V', '24 V', '50 V', '110 V'], ok: 0, itc: 'ITC-BT-27 · ITC-BT-36', exp: 'Muy baja tensión de seguridad de 12 V en esos volúmenes (fuente fuera de los volúmenes 0 y 1).' },

  /* ---- instalación interior ---- */
  { q: '¿Cuántos circuitos mínimos tiene una vivienda con electrificación básica?', ops: ['3', '5 (C1 a C5)', '7', '12'], ok: 1, itc: 'ITC-BT-25', exp: 'C1 alumbrado, C2 tomas generales, C3 cocina/horno, C4 lavadora-lavavajillas-termo, C5 baño y auxiliares.' },
  { q: 'La electrificación elevada añade circuitos como…', ops: ['C6 a C12 (más alumbrado, más tomas, calefacción, AC, secadora…)', 'Solo un C6 de emergencia', 'Circuitos trifásicos obligatorios', 'Ninguno: solo sube el IGA'], ok: 0, itc: 'ITC-BT-25', exp: 'C6 alumbrado adicional, C7 tomas adicionales, C8 calefacción, C9 aire acondicionado, C10 secadora, C11 automatización…' },
  { q: 'El circuito C8 de la electrificación elevada corresponde a…', ops: ['Secadora', 'Calefacción eléctrica', 'Automatización', 'Aire acondicionado'], ok: 1, itc: 'ITC-BT-25', exp: 'C8 calefacción · C9 aire acondicionado · C10 secadora · C11 automatización.' },
  { q: 'Como criterio de la ITC-BT-25, las tomas de uso general (C2) se prevén a razón de…', ops: ['Una por estancia como máximo', 'Una cada 6 m² (redondeado al alza)', 'Una cada 20 m²', 'Sin criterio'], ok: 1, itc: 'ITC-BT-25', exp: 'Puntos de utilización mínimos: en C2, uno por cada 6 m² de superficie útil.' },
  { q: 'El tubo protector del circuito C1 (1,5 mm²) es de…', ops: ['12 mm', '16 mm', '25 mm', '32 mm'], ok: 1, itc: 'ITC-BT-25 · ITC-BT-21', exp: 'C1: tubo de 16 mm · C2/C4/C5: 20 mm · C3: 25 mm.' },
  { q: 'La sección mínima de los conductores de alumbrado en vivienda es…', ops: ['0,75 mm²', '1 mm²', '1,5 mm²', '2,5 mm²'], ok: 2, itc: 'ITC-BT-25', exp: '1,5 mm² con PIA de 10 A (C1).' },
  { q: 'En una instalación monofásica, la sección del neutro es…', ops: ['La mitad de la fase', 'Igual que la de la fase', 'El doble', 'Libre'], ok: 1, itc: 'ITC-BT-19', exp: 'En monofásico el neutro lleva la misma corriente que la fase: misma sección.' },
  { q: 'Los conductores de una vivienda discurren normalmente…', ops: ['Grapados en superficie sin más', 'Bajo tubo protector (empotrado o en superficie)', 'Enterrados', 'Al aire'], ok: 1, itc: 'ITC-BT-20 · ITC-BT-21', exp: 'Canalizados bajo tubo: protege el cable y permite sustituirlo.' },
  { q: 'Unir conductores retorciéndolos y encintándolos, sin caja ni borne, es…', ops: ['Aceptable si queda firme', 'No reglamentario: los empalmes van en cajas con bornes o conectores', 'Obligatorio', 'Solo válido en tierra'], ok: 1, itc: 'ITC-BT-19', exp: 'Las conexiones se hacen en cajas de registro con bornes/conectores adecuados.' },

  /* ---- enlace y previsión ---- */
  { q: 'Según la tabla de simultaneidad, 2 viviendas cuentan como…', ops: ['1', '2', '1,5', '3'], ok: 1, itc: 'ITC-BT-10', exp: 'Coeficientes: 1→1, 2→2, 3→3, 4→3,8… (a partir de 4 ya no crece linealmente).' },
  { q: 'La previsión de un local comercial es de 100 W/m² con un mínimo por local de…', ops: ['1.000 W', '2.300 W', '3.450 W', '5.750 W'], ok: 2, itc: 'ITC-BT-10', exp: '100 W/m² y como mínimo 3.450 W a 230 V por local.' },
  { q: 'La previsión de un garaje con ventilación FORZADA es de…', ops: ['5 W/m²', '10 W/m²', '20 W/m²', '100 W/m²'], ok: 2, itc: 'ITC-BT-10', exp: '10 W/m² con ventilación natural, 20 W/m² con forzada (mínimo 3.450 W).' },
  { q: 'La acometida puede ser…', ops: ['Solo aérea', 'Solo subterránea', 'Aérea, subterránea o mixta', 'Interior'], ok: 2, itc: 'ITC-BT-11', exp: 'Según la red de distribución de la zona; la decide la empresa distribuidora.' },
  { q: 'La CGP se instala…', ops: ['Dentro de la vivienda', 'En fachada o límite de la propiedad, accesible desde la vía pública', 'En el cuarto de baño', 'Junto al contador de agua'], ok: 1, itc: 'ITC-BT-13', exp: 'En la frontera entre la red y la instalación, accesible para la empresa.' },
  { q: 'La LGA discurre siempre por…', ops: ['El interior de una vivienda', 'Zonas de uso común del edificio', 'La vía pública', 'El garaje de un vecino'], ok: 1, itc: 'ITC-BT-14', exp: 'De la CGP a la centralización por zonas comunes, registrable y sin pasar por propiedad privada de un usuario.' },
  { q: 'Una derivación individual NO puede…', ops: ['Superar 6 mm²', 'Atravesar la propiedad de otro usuario', 'Llevar conductor de protección', 'Ir bajo tubo'], ok: 1, itc: 'ITC-BT-15', exp: 'Cada DI pertenece a su usuario y discurre por zonas comunes: nunca por la vivienda de otro.' },
  { q: 'El hilo de mando de la derivación individual (rojo) sirve para…', ops: ['La tierra', 'Aplicar la discriminación horaria (cambio de tarifa)', 'El timbre', 'El portero'], ok: 1, itc: 'ITC-BT-15', exp: 'Es un conductor de 1,5 mm² para señales de tarifa; hoy casi en desuso con los contadores inteligentes.' },
  { q: 'El REBT vigente se aprobó por…', ops: ['RD 842/2002', 'Ley 54/1997', 'RD 1955/2000', 'Orden de 1973'], ok: 0, itc: 'REBT', exp: 'Real Decreto 842/2002, con sus ITC-BT-01 a 52 (y actualizaciones posteriores).' },
  { q: 'El boletín (certificado de instalación eléctrica) lo emite…', ops: ['El propietario', 'La empresa distribuidora', 'El instalador autorizado / empresa instaladora habilitada', 'El ayuntamiento'], ok: 2, itc: 'ITC-BT-04', exp: 'La empresa instaladora habilitada certifica que la instalación cumple el REBT.' },
  { q: 'Antes de la puesta en servicio, en toda instalación se verifica…', ops: ['Solo que enciendan las luces', 'Aislamiento, continuidad de la tierra y funcionamiento de las protecciones', 'El color de los mecanismos', 'Nada, si es nueva'], ok: 1, itc: 'ITC-BT-05', exp: 'Medidas de aislamiento, resistencia de tierra, disparo de diferenciales… según la ITC-BT-05.' },

  /* ---- maniobras y receptores ---- */
  { q: '¿Cuántos bornes tiene un conmutador simple?', ops: ['2', '3 (común, L1 y L2)', '4', '6'], ok: 1, itc: 'ITC-BT-19', exp: 'El común conecta alternativamente con L1 o L2: por eso permite mandar desde dos puntos.' },
  { q: '¿Cuántos bornes de contacto tiene un cruzamiento?', ops: ['2', '3', '4', '5'], ok: 2, itc: 'ITC-BT-19', exp: 'Dos arriba y dos abajo: deja pasar los hilos rectos o cruzados.' },
  { q: 'Los bornes A1 y A2 de un telerruptor o contactor corresponden a…', ops: ['El contacto de potencia', 'La bobina', 'La tierra', 'El neutro de red'], ok: 1, itc: 'ITC-BT-19', exp: 'A1-A2 es la bobina de mando; el contacto de potencia va numerado aparte (1-2…).' },
  { q: 'El minutero de escalera…', ops: ['Enciende al detectar movimiento', 'Mantiene la luz un tiempo tras cada pulsación y apaga solo', 'Solo funciona de noche', 'Es un diferencial'], ok: 1, itc: 'ITC-BT-19', exp: 'Un impulso de cualquier pulsador cierra su contacto durante el tiempo ajustado.' },
  { q: 'El interruptor crepuscular cierra su contacto…', ops: ['Al detectar presencia', 'Al oscurecer (por nivel de luz)', 'A una hora fija', 'Con el timbre'], ok: 1, itc: 'ITC-BT-09', exp: 'Fotocélula típica de alumbrado exterior; el programador horario, en cambio, va por reloj.' },
  { q: 'En el arranque, un motor absorbe…', ops: ['Menos corriente que en marcha', 'La misma', 'Varias veces su corriente nominal', 'Corriente continua'], ok: 2, itc: 'ITC-BT-47', exp: 'El pico de arranque puede ser 5–7 veces la nominal: la ITC-BT-47 limita la relación arranque/plena carga.' },
  { q: 'Para invertir el giro de un motor trifásico se…', ops: ['Sube la tensión', 'Intercambian dos fases cualesquiera', 'Cambia el neutro', 'Añade un condensador'], ok: 1, itc: 'ITC-BT-47', exp: 'Intercambiar dos fases invierte el sentido del campo giratorio.' },
  { q: 'Un zumbido con el motor trifásico parado suele indicar…', ops: ['Exceso de engrase', 'Que le falta una fase', 'Tensión alta', 'Que gira al revés'], ok: 1, itc: 'ITC-BT-47', exp: 'A dos fases no hay campo giratorio: el motor zumba, no arranca y se quema si no se corta.' },
  { q: 'El telerruptor es preferible a la conmutación con cruzamientos cuando…', ops: ['Hay 2 puntos de mando', 'Hay muchos puntos de mando (pulsadores en paralelo)', 'No hay neutro', 'Se quiere regular intensidad'], ok: 1, itc: 'ITC-BT-19', exp: 'Con muchos puntos, un pulsador más solo añade un cable a la bobina; con cruzamientos el cableado crece mucho.' },
  { q: 'Al añadir un tercer punto de mando a una conmutada existente se intercala…', ops: ['Otro interruptor simple', 'Un cruzamiento entre los dos conmutadores', 'Un diferencial', 'Un contactor'], ok: 1, itc: 'ITC-BT-19', exp: 'Conmutador → cruzamiento(s) → conmutador: cada punto extra es un cruzamiento más.' }
];

/* bloque temático de una pregunta (para exámenes por bloques) */
function bloqueDe(q) {
  const t = q.itc || '';
  if (/BT-27|BT-47|BT-36|BT-09/.test(t)) return 'Especiales y receptores';
  if (/BT-0[45]|BT-1[0-6]|art\. 4|RD 842|REBT/.test(t)) return 'Enlace, previsión y normativa';
  if (/BT-1[78]|BT-2[234]/.test(t)) return 'Protecciones y tierra';
  if (/BT-19|BT-2[0156]/.test(t)) return 'Instalación interior';
  return 'Fundamentos';
}
function bloquesExamen() {
  const m = new Map();
  EXAM_QS.forEach((q, i) => {
    const b = bloqueDe(q);
    if (!m.has(b)) m.set(b, []);
    m.get(b).push(i);
  });
  return m;
}

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
  const bloques = [...bloquesExamen().entries()];
  openModal(`<div class="mTitle">Examen tipo test · IBTB</div>
    <div class="help"><p>Banco de <b>${EXAM_QS.length} preguntas</b> con su ITC. Cada examen son <b>10 al azar</b>; al responder verás la corrección razonada.
    ${st.intentos ? `<br>Exámenes hechos: <b>${st.intentos}</b> · mejor nota: <b>${st.record}/10</b>.` : ''}</p></div>
    ${EXAM ? `<button class="bigbtn grn" data-m="examCont">Continuar el examen en curso (pregunta ${EXAM.i + 1} de ${EXAM.qs.length})</button><div style="height:8px"></div>` : ''}
    <button class="bigbtn pri" data-m="examStart">Examen general (10 al azar)</button>
    ${st.falladas.length ? `<div style="height:8px"></div><button class="bigbtn sec" data-m="examRepaso">Repasar ${st.falladas.length} pregunta${st.falladas.length > 1 ? 's' : ''} fallada${st.falladas.length > 1 ? 's' : ''}</button>` : ''}
    <div class="help"><p style="margin-top:10px"><b>O practica por bloques del temario:</b></p></div>` +
    bloques.map(([b, idxs]) => `<button class="mItem" data-m="examBloque" data-id="${esc(b)}"><div>${esc(b)}<small>${idxs.length} preguntas en el banco</small></div></button>`).join(''));
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
    q.ops.map((o, i) => `<button class="mItem" data-m="examResp" data-id="${i}"><div>${esc(o)}</div></button>`).join('') +
    `<div style="height:10px"></div><button class="bigbtn sec" data-m="examSalir">Abandonar el examen</button>`);
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

/* ---------- panel «Tu progreso» ---------- */
function progresoModal() {
  const rd = retosDone(), ad = averiasDone(), ag = averiasGenDone(), ex = examStats();
  const okR = RETOS.filter(r => rd[r.id]).length;
  const okSin = RETOS.filter(r => rd[r.id] === 1 || rd[r.id] === true).length;   // true = superados antiguos
  const okA = AVERIAS.filter(a => ad[a.id]).length;
  const gen = (ag[1] || 0) + (ag[2] || 0) + (ag[3] || 0);
  const bar = (ok, tot) => `<div class="pbar"><div style="width:${tot ? Math.round(ok / tot * 100) : 0}%"></div></div>`;
  const linea = (t, ok, tot, extra) => `<div class="pline"><div class="plt"><span>${t}</span><b>${ok}${tot != null ? ' / ' + tot : ''}</b></div>${tot != null ? bar(ok, tot) : ''}${extra ? `<small>${extra}</small>` : ''}</div>`;
  openModal(`<div class="mTitle">Tu progreso</div>
    ${linea('Retos guiados', okR, RETOS.length, okR ? `${okSin} sin pistas · ${okR - okSin} con pistas` : '')}
    ${linea('Averías fijas', okA, AVERIAS.length)}
    ${linea('Averías generadas resueltas', gen, null, `nivel 1: ${ag[1] || 0} · nivel 2: ${ag[2] || 0} · nivel 3: ${ag[3] || 0}`)}
    ${linea('Exámenes hechos', ex.intentos, null, `mejor nota: ${ex.record}/10 · falladas pendientes: ${ex.falladas.length}`)}
    <div style="height:10px"></div>
    <button class="bigbtn pri" data-m="retos">Ir a los retos</button>
    <div style="height:8px"></div>
    <button class="bigbtn sec" data-m="examen">Ir al examen</button>`);
}

/* ---------- ganchos de los modales ---------- */
modalBody.addEventListener('click', e => {
  const b = e.target.closest('[data-m]');
  if (!b) return;
  const m = b.dataset.m;
  if (m === 'examen') examenModal();
  else if (m === 'progreso') progresoModal();
  else if (m === 'examStart') startExamen(examBarajar(EXAM_QS.map((q, i) => i), 10));
  else if (m === 'examCont') { if (EXAM) examPregunta(); }
  else if (m === 'examSalir') { EXAM = null; closeModal(); toast('Examen abandonado (no cuenta como intento)'); }
  else if (m === 'examBloque') { const mb = bloquesExamen().get(b.dataset.id); if (mb && mb.length) startExamen(examBarajar(mb, Math.min(10, mb.length))); }
  else if (m === 'examRepaso') { const f = examStats().falladas.filter(i => EXAM_QS[i]); if (f.length) startExamen(examBarajar(f, Math.min(10, f.length))); }
  else if (m === 'examResp') examResponder(Number(b.dataset.id));
  else if (m === 'examNext') { EXAM.i++; examPregunta(); }
  else if (m === 'examFin') examFinal();
  else if (m === 'proyecto') proyectoModal();
  else if (m === 'proyCalc') proyectoCalcular();
});
