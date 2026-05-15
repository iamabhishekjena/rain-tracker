import { useEffect } from 'react';
import { MONTH_NAMES, DAY_NAMES, classifyWeather } from '../utils/weatherUtils';

export default function MonthSheet({ month, year, data, onClose, onDayClick }) {
  const open = month !== null;

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (month === null) return (
    <div style={{ ...S.sheet, opacity: 0, pointerEvents: 'none' }}>
      <div style={S.scrim} /><div style={{ ...S.body, transform: 'translateY(100%)' }} />
    </div>
  );

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  let rainCount = 0, totalMm = 0, stormCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const day = data[key];
    if (!day) continue;
    const w = classifyWeather(day.code, day.precip);
    if (w.cls !== 'sun') { rainCount++; totalMm += day.precip; }
    if (w.cls === 'storm') stormCount++;
  }

  return (
    <div style={{ ...S.sheet, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }}>
      <div style={S.scrim} onClick={onClose} />
      <div style={{ ...S.body, transform: open ? 'translateY(0)' : 'translateY(100%)' }}>
        <button style={S.close} onClick={onClose}>✕</button>
        <div style={S.handle} />
        <div style={S.title}>{MONTH_NAMES[month]} {year}</div>

        <div style={S.pills}>
          <Pill value={rainCount} label="rain days" />
          <Pill value={`${totalMm.toFixed(0)}mm`} label="precipitation" />
          <Pill value={stormCount} label="storms" />
        </div>

        <div style={S.fullCal}>
          {DAY_NAMES.map(d => <div key={d} style={S.fh}>{d}</div>)}
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} style={{ opacity: 0 }} />)}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const d = i + 1;
            const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const day = data[key];
            const w = day ? classifyWeather(day.code, day.precip) : { cls: 'cloud', icon: '☁️' };
            const isToday = new Date(year, month, d).getTime() === today.getTime();
            return (
              <div
                key={d}
                style={{ ...S.fd, ...fdColor(w.cls), ...(isToday ? S.fdToday : {}) }}
                onClick={() => { if (day) { onDayClick(key); onClose(); } }}
              >
                <span style={S.fdIcon}>{w.icon}</span>
                <span style={S.fdNum}>{d}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Pill({ value, label }) {
  return (
    <div style={S.pill}>
      <span style={S.pillVal}>{value}</span>
      <span style={S.pillLbl}>{label}</span>
    </div>
  );
}

function fdColor(cls) {
  const map = {
    rain:  { background: 'rgba(106,180,255,.14)', border: '.5px solid rgba(106,180,255,.22)' },
    hrain: { background: 'rgba(106,180,255,.26)', border: '.5px solid rgba(106,180,255,.38)' },
    storm: { background: 'rgba(155,124,255,.14)', border: '.5px solid rgba(155,124,255,.3)' },
    sun:   { background: 'rgba(255,200,60,.09)',  border: '.5px solid rgba(255,200,60,.16)' },
    cloud: { background: 'rgba(255,255,255,.055)',border: '.5px solid transparent' },
  };
  return map[cls] || map.cloud;
}

const S = {
  sheet: { position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', transition: 'opacity .4s' },
  scrim: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,.52)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' },
  body: { position: 'relative', zIndex: 1, width: '100%', maxHeight: '87vh', background: 'rgba(10,24,52,.94)', backdropFilter: 'blur(44px)', WebkitBackdropFilter: 'blur(44px)', border: '.5px solid rgba(255,255,255,.11)', borderRadius: '28px 28px 0 0', padding: '1.4rem 2rem 3rem', overflowY: 'auto', transition: 'transform .5s cubic-bezier(.32,.72,0,1)' },
  close: { position: 'absolute', top: '1.4rem', right: '1.4rem', background: 'rgba(255,255,255,.09)', border: '.5px solid rgba(255,255,255,.14)', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,.55)', fontSize: '.85rem', cursor: 'pointer' },
  handle: { width: 34, height: 4, borderRadius: 2, background: 'rgba(255,255,255,.18)', margin: '0 auto 1.4rem' },
  title: { fontFamily: "'Cormorant Garamond',serif", fontSize: '2.6rem', fontWeight: 300, fontStyle: 'italic', marginBottom: '1.1rem', color: '#fff' },
  pills: { display: 'flex', gap: '.6rem', marginBottom: '1.4rem', flexWrap: 'wrap' },
  pill: { background: 'rgba(255,255,255,.07)', border: '.5px solid rgba(255,255,255,.11)', borderRadius: 100, padding: '.35rem .9rem', display: 'flex', gap: '.45rem', alignItems: 'center' },
  pillVal: { fontFamily: "'DM Mono',monospace", fontSize: '.88rem', color: '#fff' },
  pillLbl: { fontFamily: "'DM Mono',monospace", fontSize: '.5rem', letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)' },
  fullCal: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 5 },
  fh: { fontFamily: "'DM Mono',monospace", fontSize: '.52rem', textAlign: 'center', color: 'rgba(255,255,255,.28)', padding: '3px 0', letterSpacing: '.04em' },
  fd: { aspectRatio: '1', borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, cursor: 'pointer', transition: 'all .3s cubic-bezier(.34,1.4,.64,1)' },
  fdToday: { boxShadow: '0 0 0 2px rgba(106,180,255,.7)' },
  fdIcon: { fontSize: '.95rem', lineHeight: 1 },
  fdNum: { fontFamily: "'DM Mono',monospace", fontSize: '.56rem', color: 'rgba(255,255,255,.55)' },
};
