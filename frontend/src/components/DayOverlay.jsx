import { classifyWeather } from '../utils/weatherUtils';

const RAIN_MSGS = ["Your favourite kind of day. Breathe it in.", "Rain is nature's way of hitting refresh.", "Close your eyes. Hear it coming.", "The clouds gathered just for this.", "Let the rain wash everything quiet and beautiful.", "This is the day the sky dances."];
const STORM_MSGS = ["The sky puts on its full show today ⚡", "Thunder is just rain with ambition.", "An electric day — watch it from somewhere warm.", "The universe is showing off. Watch closely."];
const SUN_MSGS = ["The sun holds its ground today.", "Bright skies — but the clouds are plotting.", "A golden pause between the showers.", "Clear today. The rain is just resting."];

export default function DayOverlay({ dayKey, data, onClose }) {
  const open = !!dayKey;
  const day = dayKey ? data[dayKey] : null;

  if (!open || !day) return (
    <div style={{ ...S.overlay, opacity: 0, pointerEvents: 'none' }} onClick={onClose} />
  );

  const w = classifyWeather(day.code, day.precip);
  const dt = new Date(dayKey + 'T12:00:00');
  const pool = w.cls === 'storm' ? STORM_MSGS : (w.cls === 'rain' || w.cls === 'hrain') ? RAIN_MSGS : SUN_MSGS;
  const msg = pool[Math.floor(Math.random() * pool.length)];

  const rainHours = day.hours?.filter(h => h.precip > 0 || h.code >= 51) || [];

  return (
    <div style={{ ...S.overlay, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }} onClick={onClose}>
      <div style={S.card} onClick={e => e.stopPropagation()}>
        <span style={S.icon}>{w.icon}</span>
        <div style={S.date}>
          {dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ ...S.type, color: w.col }}>
          {w.label}{day.est ? ' · estimate' : ''}
        </div>

        <div style={S.stats}>
          <Stat v={`${day.precip}mm`} l="Precip" />
          <Stat v={`${day.prob}%`} l="Chance" />
          <Stat v={`${Math.round(day.tmax)}°C`} l="High" />
          <Stat v={`${Math.round(day.wind)}km/h`} l="Wind" />
        </div>

        {rainHours.length > 0 && (
          <div style={S.hourly}>
            <div style={S.hourlyLabel}>Rain hours · hourly data</div>
            <div style={S.hourlyChips}>
              {rainHours.map((h, i) => {
                const hr = new Date(h.t).getHours();
                const lbl = (hr % 12 || 12) + (hr >= 12 ? 'pm' : 'am');
                const ic = h.code >= 95 ? '⛈' : h.code >= 80 ? '🌧' : h.code >= 51 ? '🌦' : '💧';
                return (
                  <span key={i} style={S.chip}>{ic} {lbl} <span style={{ opacity: .55 }}>{h.precip}mm</span></span>
                );
              })}
            </div>
          </div>
        )}

        <div style={S.msg}>{msg}</div>
        <button style={S.back} onClick={onClose}>← back to calendar</button>
      </div>
    </div>
  );
}

function Stat({ v, l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.15rem' }}>
      <div style={S.statV}>{v}</div>
      <div style={S.statL}>{l}</div>
    </div>
  );
}

const S = {
  overlay: { position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5,12,28,.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', transition: 'opacity .65s ease' },
  card: { background: 'rgba(255,255,255,.07)', backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)', border: '.5px solid rgba(255,255,255,.14)', borderRadius: 28, padding: '2.2rem 2.6rem', textAlign: 'center', maxWidth: 460, width: '90%', animation: 'gin .6s cubic-bezier(.34,1.4,.64,1)' },
  icon: { fontSize: '4.5rem', display: 'block', marginBottom: '.4rem' },
  date: { fontFamily: "'Cormorant Garamond',serif", fontSize: '2.5rem', fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1, marginBottom: '.25rem' },
  type: { fontFamily: "'DM Mono',monospace", fontSize: '.6rem', letterSpacing: '.24em', textTransform: 'uppercase', marginBottom: '1.3rem' },
  stats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '.6rem', marginBottom: '1.3rem' },
  statV: { fontFamily: "'DM Mono',monospace", fontSize: '1.05rem', color: '#fff' },
  statL: { fontFamily: "'DM Mono',monospace", fontSize: '.42rem', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' },
  hourly: { marginBottom: '1rem', textAlign: 'left' },
  hourlyLabel: { fontFamily: "'DM Mono',monospace", fontSize: '.48rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.3)', marginBottom: '.4rem' },
  hourlyChips: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  chip: { display: 'inline-flex', alignItems: 'center', gap: 3, background: 'rgba(106,180,255,.12)', border: '.5px solid rgba(106,180,255,.25)', borderRadius: 7, padding: '3px 7px', fontFamily: "'DM Mono',monospace", fontSize: '.52rem', color: '#6ab4ff' },
  msg: { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(255,255,255,.82)', marginBottom: '1.4rem', lineHeight: 1.55 },
  back: { background: 'rgba(255,255,255,.1)', border: '.5px solid rgba(255,255,255,.18)', borderRadius: 100, color: '#fff', fontFamily: "'DM Mono',monospace", fontSize: '.6rem', letterSpacing: '.14em', padding: '.55rem 1.6rem', cursor: 'pointer' },
};
