export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAY_NAMES = ['Su','Mo','Tu','We','Th','Fr','Sa'];

export function classifyWeather(code, precip) {
  if (code >= 95) return { cls: 'storm',  icon: '⛈',  label: 'Thunderstorm',  scene: 'storm',  col: '#b09aff' };
  if (code >= 80 || (code >= 61 && precip > 5)) return { cls: 'hrain', icon: '🌧', label: 'Heavy Rain', scene: 'rain', col: '#6ab4ff' };
  if (code >= 51 || precip > 0) return { cls: 'rain',  icon: '🌦',  label: 'Rain',          scene: 'rain',  col: '#6ab4ff' };
  if (code >= 45) return { cls: 'cloud',  icon: '🌫',  label: 'Foggy',         scene: 'fog',   col: '#94a3b8' };
  if (code >= 3)  return { cls: 'cloud',  icon: '☁️',  label: 'Cloudy',        scene: 'cloudy',col: '#94a3b8' };
  if (code >= 1)  return { cls: 'sun',    icon: '🌤',  label: 'Partly Cloudy', scene: 'sun',   col: '#ffd44d' };
  return             { cls: 'sun',    icon: '☀️',  label: 'Clear',         scene: 'sun',   col: '#ffd44d' };
}

export function findNextRainEvents(data, count = 2) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const results = [];
  for (let i = 0; i < 365; i++) {
    const dt = new Date(today); dt.setDate(dt.getDate() + i);
    const key = dt.toISOString().slice(0, 10);
    const d = data[key];
    if (d && (d.prob >= 40 || d.precip >= 0.5 || (d.code >= 51 && d.code <= 99))) {
      results.push({ dt, key, d });
      if (results.length >= count) break;
    }
  }
  return results;
}
