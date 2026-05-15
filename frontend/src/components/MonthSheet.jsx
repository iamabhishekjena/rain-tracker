import { useEffect } from 'react';
import { MONTH_NAMES, DAY_NAMES, classifyWeather } from '../utils/weatherUtils';

export default function MonthSheet({ month, year, data, onClose, onDayClick, onMonthChange }) {
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

  // Build days array
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const day = data[key];
    const w = day ? classifyWeather(day.code, day.precip) : { cls: 'cloud', icon: '☁️' };
    return { d, key, day, w };
  });

  // Stats
  let rainCount = 0, totalMm = 0, stormCount = 0;
  days.forEach(({ day, w }) => {
    if (!day) return;
    if (w.cls !== 'sun') { rainCount++; totalMm += day.precip; }
    if (w.cls === 'storm') stormCount++;
  });

  const daysWithData = days.filter(d => d.day);
  const wettestDay = daysWithData.reduce((a, b) => (b.day.precip > a.day.precip ? b : a), daysWithData[0]);
  const hottestDay = daysWithData.reduce((a, b) => (b.day.tmax > a.day.tmax ? b : a), daysWithData[0]);
  const avgHigh = daysWithData.length
    ? daysWithData.reduce((s, d) => s + d.day.tmax, 0) / daysWithData.length
    : 0;

  const wettestDt = wettestDay ? new Date(year, month, wettestDay.d) : null;
  const hottestDt = hottestDay ? new Date(year, month, hottestDay.d) : null;

  return (
    <div style={{ ...S.sheet, opacity: open ? 1 : 0, pointerEvents: open ? 'all' : 'none' }}>
      <div style={S.scrim} onClick={onClose} />
      <div style={{ ...S.body, transform: open ? 'translateY(0)' : 'translateY(100%)' }} className="ms-body">

        {/* Handle */}
        <div style={S.handle} />

        {/* Header: nav + title + close */}
        <div style={S.header} className="ms-header">
          <button style={S.navBtn} onClick={() => onMonthChange((month + 11) % 12)}>‹</button>
          <div style={S.title} className="ms-title">{MONTH_NAMES[month]} <span style={S.titleYear}>{year}</span></div>
          <button style={S.navBtn} onClick={() => onMonthChange((month + 1) % 12)}>›</button>
          <button style={S.close} onClick={onClose}>✕</button>
        </div>

        {/* Precip + Temp Chart */}
        <PrecipChart days={days} year={year} month={month} today={today} />

        {/* Stat Cards */}
        <div style={S.statGrid} className="ms-stat-grid">
          <StatCard icon="🌧" value={`${totalMm.toFixed(0)}mm`} label="Total Rain" />
          <StatCard icon="📅" value={`${rainCount}`} label="Rain Days" />
          <StatCard icon="💧" value={wettestDay ? `${wettestDay.day.precip}mm` : '—'} label="Wettest Day" sub={wettestDt ? wettestDt.toLocaleDateString('en-US',{day:'numeric',month:'short'}) : ''} />
          <StatCard icon="🌡" value={`${avgHigh.toFixed(1)}°C`} label="Avg High" />
        </div>

        {/* Callout strips */}
        {wettestDay && wettestDay.day.precip > 0 && (
          <div style={S.calloutRow} className="ms-callout-row">
            <Callout
              icon={wettestDay.w.icon}
              label="Wettest"
              date={wettestDt.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})}
              value={`${wettestDay.day.precip}mm`}
              color="rgba(106,180,255,.15)"
              border="rgba(106,180,255,.3)"
            />
            {hottestDay && (
              <Callout
                icon="☀️"
                label="Hottest"
                date={hottestDt.toLocaleDateString('en-US',{weekday:'short',day:'numeric',month:'short'})}
                value={`${Math.round(hottestDay.day.tmax)}°C`}
                color="rgba(255,200,60,.1)"
                border="rgba(255,200,60,.25)"
              />
            )}
          </div>
        )}

        {/* Calendar grid */}
        <div style={S.fullCal} className="ms-full-cal">
          {DAY_NAMES.map(d => <div key={d} style={S.fh}>{d}</div>)}
          {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
          {days.map(({ d, key, day, w }) => {
            const isToday = new Date(year, month, d).getTime() === today.getTime();
            const precipText = day?.precip > 0 ? `${day.precip}mm` : '';
            return (
              <div
                key={d}
                style={{ ...S.fd, ...fdColor(w.cls), ...(isToday ? S.fdToday : {}) }}
                onClick={() => { if (day) { onDayClick(key); onClose(); } }}
              >
                <span style={S.fdIcon} className="ms-fd-icon">{w.icon}</span>
                <span style={S.fdNum} className="ms-fd-num">{d}</span>
                {precipText && <span style={{ ...S.fdPrecip, color: precipColor(w.cls) }} className="ms-fd-precip">{precipText}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── SVG Chart ──────────────────────────────────────────────────────────────
function PrecipChart({ days, year, month, today }) {
  const H = 80, PAD = 2;
  const maxPrecip = Math.max(...days.map(d => d.day?.precip || 0), 1);
  const tmaxVals = days.map(d => d.day?.tmax ?? null);
  const tminVals = days.map(d => d.day?.tmin ?? null);
  const validTemps = [...tmaxVals, ...tminVals].filter(v => v !== null);
  const tMin = Math.min(...validTemps, 0);
  const tMax = Math.max(...validTemps, 1);
  const n = days.length;

  const barW = (w) => (w - PAD * 2) / n;

  const barFill = (cls) => {
    const map = { rain: 'rgba(106,180,255,.55)', hrain: 'rgba(106,180,255,.8)', storm: 'rgba(155,124,255,.7)', sun: 'rgba(255,200,60,.25)', cloud: 'rgba(255,255,255,.12)' };
    return map[cls] || map.cloud;
  };

  const tempY = (val, chartH) => chartH - PAD - ((val - tMin) / (tMax - tMin)) * (chartH - PAD * 4);

  return (
    <div style={S.chartWrap}>
      <svg width="100%" height={H} style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="tmaxGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,220,100,.9)" />
            <stop offset="100%" stopColor="rgba(255,180,60,.3)" />
          </linearGradient>
        </defs>
        {/* Use a foreignObject trick — render bars relative to SVG width via viewBox */}
        {days.map(({ d, day, w }, i) => {
          const precip = day?.precip || 0;
          const barH = Math.max(2, (precip / maxPrecip) * (H - PAD * 2));
          const isToday = new Date(year, month, d).getTime() === today.getTime();
          // x as percentage string — use a normalized 0-1 scale
          const xPct = `${(i / n) * 100}%`;
          const wPct = `${(1 / n) * 100 - 0.3}%`;
          return (
            <rect
              key={d}
              x={xPct}
              y={H - PAD - barH}
              width={wPct}
              height={barH}
              rx={2}
              fill={barFill(w.cls)}
              style={isToday ? { filter: 'drop-shadow(0 0 4px rgba(106,180,255,.8))' } : {}}
            />
          );
        })}

        {/* tmax polyline */}
        {tmaxVals.filter(v => v !== null).length > 1 && (
          <polyline
            points={days.map(({ }, i) => {
              if (tmaxVals[i] === null) return null;
              const x = `${((i + 0.5) / n) * 100}%`;
              return `${((i + 0.5) / n) * 100},${tempY(tmaxVals[i], H)}`;
            }).filter(Boolean).join(' ')}
            fill="none"
            stroke="rgba(255,210,80,.75)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* tmin polyline */}
        {tminVals.filter(v => v !== null).length > 1 && (
          <polyline
            points={days.map(({ }, i) => {
              if (tminVals[i] === null) return null;
              return `${((i + 0.5) / n) * 100},${tempY(tminVals[i], H)}`;
            }).filter(Boolean).join(' ')}
            fill="none"
            stroke="rgba(160,210,255,.4)"
            strokeWidth="1"
            strokeDasharray="3 2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}
      </svg>
      <div style={S.chartLegend}>
        <span style={{ color: 'rgba(255,210,80,.75)' }}>— high temp</span>
        <span style={{ color: 'rgba(160,210,255,.5)' }}>· · low temp</span>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function StatCard({ icon, value, label, sub }) {
  return (
    <div style={S.statCard}>
      <div style={S.statIcon}>{icon}</div>
      <div style={S.statValue}>{value}</div>
      <div style={S.statLabel}>{label}</div>
      {sub && <div style={S.statSub}>{sub}</div>}
    </div>
  );
}

function Callout({ icon, label, date, value, color, border }) {
  return (
    <div style={{ ...S.callout, background: color, borderColor: border }}>
      <span style={S.calloutIcon}>{icon}</span>
      <div style={S.calloutBody}>
        <span style={S.calloutLabel}>{label}</span>
        <span style={S.calloutDate}>{date}</span>
      </div>
      <span style={S.calloutValue}>{value}</span>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
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

function precipColor(cls) {
  const map = { rain: '#6ab4ff', hrain: '#a4ceff', storm: '#b09aff', sun: 'rgba(255,200,60,.6)', cloud: 'rgba(255,255,255,.3)' };
  return map[cls] || map.cloud;
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  sheet:        { position:'fixed', inset:0, zIndex:100, display:'flex', alignItems:'flex-end', transition:'opacity .4s' },
  scrim:        { position:'absolute', inset:0, background:'rgba(0,0,0,.52)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)' },
  body:         { position:'relative', zIndex:1, width:'100%', maxHeight:'90vh', background:'rgba(10,24,52,.96)', backdropFilter:'blur(44px)', WebkitBackdropFilter:'blur(44px)', border:'.5px solid rgba(255,255,255,.11)', borderRadius:'28px 28px 0 0', padding:'1.2rem 1.8rem 3rem', overflowY:'auto', transition:'transform .5s cubic-bezier(.32,.72,0,1)' },
  handle:       { width:34, height:4, borderRadius:2, background:'rgba(255,255,255,.18)', margin:'0 auto 1.2rem' },
  header:       { display:'flex', alignItems:'center', gap:'.75rem', marginBottom:'1.2rem', paddingRight:'2.5rem' },
  title:        { fontFamily:"'Playfair Display',serif", fontSize:'2.4rem', fontWeight:300, fontStyle:'italic', color:'#fff', flex:1, textAlign:'center' },
  titleYear:    { opacity:.45, fontSize:'1.7rem' },
  navBtn:       { background:'rgba(255,255,255,.07)', border:'.5px solid rgba(255,255,255,.14)', borderRadius:'50%', width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.7)', fontSize:'1.3rem', cursor:'pointer', flexShrink:0, transition:'background .2s' },
  close:        { position:'absolute', top:'1.2rem', right:'1.2rem', background:'rgba(255,255,255,.09)', border:'.5px solid rgba(255,255,255,.14)', borderRadius:'50%', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,.55)', fontSize:'1rem', cursor:'pointer' },

  chartWrap:    { marginBottom:'1.2rem', padding:'.5rem .2rem .2rem' },
  chartLegend:  { display:'flex', gap:'1.2rem', justifyContent:'flex-end', marginTop:'.35rem', fontFamily:"'Inter',sans-serif", fontSize:'.68rem', letterSpacing:'.08em' },

  statGrid:     { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.6rem', marginBottom:'1rem' },
  statCard:     { background:'rgba(255,255,255,.06)', border:'.5px solid rgba(255,255,255,.1)', borderRadius:14, padding:'.75rem .6rem', display:'flex', flexDirection:'column', alignItems:'center', gap:2, textAlign:'center' },
  statIcon:     { fontSize:'1.1rem', marginBottom:2 },
  statValue:    { fontFamily:"'Inter',sans-serif", fontSize:'1.2rem', fontWeight:600, color:'#fff', lineHeight:1, fontVariantNumeric:'tabular-nums' },
  statLabel:    { fontFamily:"'Inter',sans-serif", fontSize:'.65rem', letterSpacing:'.12em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginTop:2 },
  statSub:      { fontFamily:"'Inter',sans-serif", fontSize:'.68rem', color:'rgba(255,255,255,.4)', marginTop:1 },

  calloutRow:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'.6rem', marginBottom:'1.1rem' },
  callout:      { display:'flex', alignItems:'center', gap:'.6rem', borderRadius:12, border:'.5px solid', padding:'.6rem .8rem' },
  calloutIcon:  { fontSize:'1.2rem', flexShrink:0 },
  calloutBody:  { display:'flex', flexDirection:'column', gap:2, flex:1, minWidth:0 },
  calloutLabel: { fontFamily:"'Inter',sans-serif", fontSize:'.65rem', letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.35)' },
  calloutDate:  { fontFamily:"'Inter',sans-serif", fontSize:'1rem', color:'rgba(255,255,255,.8)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  calloutValue: { fontFamily:"'Inter',sans-serif", fontSize:'1.15rem', color:'#fff', flexShrink:0 },

  fullCal:      { display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:4 },
  fh:           { fontFamily:"'Inter',sans-serif", fontSize:'.75rem', textAlign:'center', color:'rgba(255,255,255,.28)', padding:'3px 0', letterSpacing:'.04em' },
  fd:           { aspectRatio:'1', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:0, cursor:'pointer', transition:'all .3s cubic-bezier(.34,1.4,.64,1)', paddingBottom:2 },
  fdToday:      { boxShadow:'0 0 0 2px rgba(106,180,255,.7)' },
  fdIcon:       { fontSize:'1.15rem', lineHeight:1 },
  fdNum:        { fontFamily:"'Inter',sans-serif", fontSize:'.82rem', color:'rgba(255,255,255,.75)', lineHeight:1 },
  fdPrecip:     { fontFamily:"'Inter',sans-serif", fontSize:'.65rem', lineHeight:1, marginTop:1 },
};
