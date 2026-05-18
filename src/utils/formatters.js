/**
 * Format seconds to HH:MM:SS
 * @param {number} totalSeconds 
 * @returns {string}
 */
export const formatSeconds = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

/**
 * Format a Date object or ISO string to HH:MM:SS
 * @param {Date|string} date 
 * @returns {string}
 */
export const formatTimeOnly = (date) => {
  if (!date) return '--:--:--';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '--:--:--';
  return [
    d.getHours().toString().padStart(2, '0'),
    d.getMinutes().toString().padStart(2, '0'),
    d.getSeconds().toString().padStart(2, '0')
  ].join(':');
};

/**
 * Format date to YYYY-MM-DD or readable local date
 * @param {string|Date} date 
 * @param {boolean} short 
 * @returns {string}
 */
export const formatDate = (date, short = false) => {
  if (!date) return '---';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '---';
  
  if (short) {
    return d.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
  
  return d.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

/**
 * Calculate net working time in seconds for a shift
 * Formula: (Salida - Entrada) - Sum(Fin Pausa - Inicio Pausa)
 * @param {string} entrada - ISO timestamp
 * @param {string} salida - ISO timestamp
 * @param {Array} pausas - Array of pause objects with start/end timestamps
 * @returns {number} net seconds
 */
export const calculateNetTime = (entrada, salida, pausas = []) => {
  if (!entrada) return 0;
  const start = new Date(entrada).getTime();
  const end = salida ? new Date(salida).getTime() : Date.now();
  
  let grossMs = end - start;
  if (grossMs < 0) grossMs = 0;
  
  let pausesMs = 0;
  pausas.forEach(pause => {
    if (pause.hora_inicio) {
      const pStart = new Date(pause.hora_inicio).getTime();
      const pEnd = pause.hora_fin ? new Date(pause.hora_fin).getTime() : Date.now();
      const diff = pEnd - pStart;
      if (diff > 0) {
        pausesMs += diff;
      }
    }
  });
  
  const netMs = grossMs - pausesMs;
  return Math.max(0, Math.floor(netMs / 1000));
};
