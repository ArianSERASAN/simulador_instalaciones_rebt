/* ---------- arranque (con la Fase 2 ya registrada) ---------- */
init();

/* ---------- PWA: solo cuando se sirve por http(s); en file:// no hace nada ---------- */
try {
  if (location.protocol.indexOf('http') === 0 && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
} catch (e) {}
