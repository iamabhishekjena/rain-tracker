const DAILY = 'daily=weathercode,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,windspeed_10m_max';
const HOURLY = 'hourly=weathercode,precipitation';

export async function geocodeCity(city) {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const data = await res.json();
  if (!data.results?.length) throw new Error('City not found');
  const { latitude: lat, longitude: lon, name, country, timezone } = data.results[0];
  return { lat, lon, name, country, timezone: timezone || 'auto' };
}

export async function searchCitySuggestions(query) {
  if (!query || query.trim().length < 2) return [];
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`
  );
  const data = await res.json();
  return (data.results || []).map(r => ({
    lat: r.latitude,
    lon: r.longitude,
    name: r.name,
    country: r.country,
    admin1: r.admin1 || '',
    timezone: r.timezone || 'auto',
    display: [r.name, r.admin1, r.country].filter(Boolean).join(', '),
  }));
}

export async function fetchYearForecast(lat, lon, timezone) {
  const tz = encodeURIComponent(timezone);
  const today = new Date();
  const year = today.getFullYear();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const yearStart = `${year}-01-01`;
  const opts = { mode: 'cors', credentials: 'omit' };
  const data = {};

  try {
    const [forecastRes, histRes, hrlyFcRes, hrlyHistRes] = await Promise.all([
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${DAILY}&timezone=${tz}&forecast_days=16`, opts),
      fetch(`https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${DAILY}&timezone=${tz}&start_date=${yearStart}&end_date=${yesterdayStr}`, opts),
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${HOURLY}&timezone=${tz}&forecast_days=16`, opts),
      fetch(`https://historical-forecast-api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&${HOURLY}&timezone=${tz}&start_date=${yearStart}&end_date=${yesterdayStr}`, opts),
    ]);
    const [fd, hd, hfd, hhd] = await Promise.all([
      forecastRes.json(), histRes.json(), hrlyFcRes.json(), hrlyHistRes.json()
    ]);

    const absorb = (d, isForecast) => {
      if (!d.daily) return;
      d.daily.time.forEach((t, i) => {
        data[t] = {
          code: d.daily.weathercode[i] || 0,
          precip: +((d.daily.precipitation_sum[i] || 0)).toFixed(1),
          prob: d.daily.precipitation_probability_max[i] || 0,
          tmax: +((d.daily.temperature_2m_max[i] || 28)).toFixed(1),
          tmin: +((d.daily.temperature_2m_min[i] || 18)).toFixed(1),
          wind: +((d.daily.windspeed_10m_max[i] || 0)).toFixed(1),
          forecast: isForecast,
          hours: [],
        };
      });
    };
    absorb(hd, false);
    absorb(fd, true);

    const hourlyMap = {};
    const absorbHourly = (d) => {
      if (!d.hourly) return;
      d.hourly.time.forEach((t, i) => {
        const dk = t.slice(0, 10);
        const code = d.hourly.weathercode[i] || 0;
        const prec = +(d.hourly.precipitation[i] || 0);
        if (!hourlyMap[dk]) hourlyMap[dk] = { maxCode: 0, totalPrecip: 0, hours: [] };
        hourlyMap[dk].maxCode = Math.max(hourlyMap[dk].maxCode, code);
        hourlyMap[dk].totalPrecip += prec;
        hourlyMap[dk].hours.push({ t, code, precip: +prec.toFixed(1) });
      });
    };
    absorbHourly(hhd);
    absorbHourly(hfd);

    for (const [dk, h] of Object.entries(hourlyMap)) {
      if (data[dk]) {
        data[dk].code = Math.max(data[dk].code, h.maxCode);
        data[dk].precip = Math.max(data[dk].precip, +h.totalPrecip.toFixed(1));
        data[dk].hours = h.hours;
      }
    }
  } catch (e) {
    console.warn('Weather API error:', e);
  }

  // Fill any missing days with estimates
  for (let m = 0; m < 12; m++) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const k = `${year}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      if (data[k]) continue;
      const prob = 20 + Math.random() * 30;
      const isRain = Math.random() * 100 < prob;
      data[k] = {
        code: isRain ? 61 : (Math.random() < 0.3 ? 3 : 0),
        precip: isRain ? +(Math.random() * 8).toFixed(1) : 0,
        prob: Math.round(prob),
        tmax: 22 + Math.random() * 10,
        tmin: 14 + Math.random() * 8,
        wind: 5 + Math.random() * 15,
        forecast: false, est: true, hours: [],
      };
    }
  }

  return data;
}
