import { MONTH_NAMES, DAY_NAMES, classifyWeather } from '../utils/weatherUtils';

export default function MonthCard({ month, year, data, onMonthClick, onDayClick }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const isMonsoon = month >= 5 && month <= 8;

  const days = [];
  let rainCount = 0, totalMm = 0, stormCount = 0;
  const mmArr = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const day = data[key];
    const w = day ? classifyWeather(day.code, day.precip) : { cls: 'cloud' };
    if (day && w.cls !== 'sun') { rainCount++; totalMm += day.precip; }
    if (day && w.cls === 'storm') stormCount++;
    mmArr.push(day?.precip || 0);
    days.push({ key, day, w, d });
  }

  const maxMm = Math.max(...mmArr, 1);

  return (
    <div
      style={{ ...S.card, ...(isMonsoon ? S.monsoon : {}) }}
      onClick={() => onMonthClick(month)}
    >
      {isMonsoon && <div style={S.monsoonLine} />}
      <div style={S.head}>
        <div style={S.name}>{MONTH_NAMES[month]}</div>
        {rainCount > 0 && <span style={S.badge}>{rainCount} 🌧</span>}
      </div>

      {/* bar chart */}
      <div style={S.barRow}>
        {days.map(({ w, d: dayNum }, i) => {
          const h = Math.max(2, Math.round((mmArr[i] / maxMm) * 20));
          return <div key={dayNum} style={{ ...S.bar, height: h, ...barColor(w.cls) }} />;
        })}
      </div>

      {/* mini dot calendar */}
      <div style={S.miniCal}>
        {DAY_NAMES.map(d => <div key={d} style={S.dayHeader}>{d}</div>)}
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} style={{ opacity: 0 }} />)}
        {days.map(({ key, day, w, d: dayNum }) => {
          const isToday = new Date(year, month, dayNum).getTime() === today.getTime();
          return (
            <div
              key={dayNum}
              style={{ ...S.dot, ...dotColor(w.cls), ...(isToday ? S.todayDot : {}) }}
              onClick={e => { e.stopPropagation(); if (day) onDayClick(key); }}
            >
              {dayNum}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function barColor(cls) {
  const map = { rain: 'rgba(106,180,255,.48)', hrain: 'rgba(106,180,255,.72)', storm: 'rgba(155,124,255,.65)', sun: 'rgba(255,200,60,.32)', cloud: 'rgba(255,255,255,.1)' };
  return { background: map[cls] || map.cloud };
}

function dotColor(cls) {
  const map = {
    rain:  { background: 'rgba(106,180,255,.22)', color: '#6ab4ff' },
    hrain: { background: 'rgba(106,180,255,.42)', color: '#a4ceff' },
    storm: { background: 'rgba(155,124,255,.22)', color: '#b09aff' },
    sun:   { background: 'rgba(255,200,60,.18)',  color: '#ffd44d' },
    cloud: { background: 'rgba(255,255,255,.07)', color: 'rgba(255,255,255,.35)' },
  };
  return map[cls] || map.cloud;
}

const S = {
  card: { background: 'rgba(255,255,255,.065)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '.5px solid rgba(255,255,255,.11)', borderRadius: 20, padding: '1rem', cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'transform .4s cubic-bezier(.34,1.38,.64,1), background .3s, box-shadow .4s' },
  monsoon: { borderColor: 'rgba(106,180,255,.28)' },
  monsoonLine: { position: 'absolute', top: 0, left: '12%', right: '12%', height: 1, background: 'linear-gradient(90deg,transparent,rgba(106,180,255,.55),transparent)' },
  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.55rem' },
  name: { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.35rem', fontWeight: 300, color: '#fff' },
  badge: { fontFamily: "'DM Mono',monospace", fontSize: '.68rem', letterSpacing: '.08em', background: 'rgba(106,180,255,.13)', color: 'rgba(106,180,255,.88)', border: '.5px solid rgba(106,180,255,.22)', borderRadius: 100, padding: '2px 6px' },
  barRow: { display: 'flex', gap: 1.5, marginBottom: '.55rem', height: 22, alignItems: 'flex-end' },
  bar: { flex: 1, borderRadius: 1.5, minHeight: 2 },
  miniCal: { display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 },
  dayHeader: { fontFamily: "'DM Mono',monospace", fontSize: '.62rem', textAlign: 'center', color: 'rgba(255,255,255,.22)', padding: '1px 0' },
  dot: { aspectRatio: '1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Mono',monospace", fontSize: '.62rem', cursor: 'pointer', transition: 'transform .2s' },
  todayDot: { boxShadow: '0 0 0 1.5px #6ab4ff', color: '#fff' },
};
