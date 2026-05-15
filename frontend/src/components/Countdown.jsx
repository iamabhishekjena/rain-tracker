import { useState, useEffect } from 'react';

export default function Countdown({ targetDate, nextRain, followingRain }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const target = targetDate ? new Date(targetDate) : null;
  if (target) target.setHours(15, 0, 0, 0);
  const diff = target ? Math.max(0, target - Date.now()) : 0;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = n => String(n).padStart(2, '0');

  if (!nextRain) return null;

  return (
    <div style={S.hero}>
      <div style={S.lbl}>☁ next rain event</div>
      <div style={S.date}>
        {nextRain.dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
      </div>
      <div style={S.cdRow}>
        <Unit num={pad(d)} lbl="days" />
        <Sep /><Unit num={pad(h)} lbl="hrs" />
        <Sep /><Unit num={pad(m)} lbl="min" />
        <Sep /><Unit num={pad(s)} lbl="sec" />
        {followingRain && (
          <div style={S.nn}>
            <div style={S.nnLabel}>then</div>
            <div style={S.nnDate}>
              {followingRain.dt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Unit({ num, lbl }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 50 }}>
      <span style={S.num}>{num}</span>
      <span style={S.unitLbl}>{lbl}</span>
    </div>
  );
}

function Sep() {
  return <span style={S.sep}>:</span>;
}

const S = {
  hero: { padding: '0 2.8rem 1rem', flexShrink: 0 },
  lbl: { fontFamily: "'DM Mono',monospace", fontSize: '.78rem', letterSpacing: '.26em', textTransform: 'uppercase', color: 'rgba(255,255,255,.38)', marginBottom: '.3rem' },
  date: { fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.8rem,4.5vw,3.2rem)', fontStyle: 'italic', fontWeight: 300, color: '#fff', lineHeight: 1, marginBottom: '.7rem', textShadow: '0 3px 28px rgba(0,0,0,.28)' },
  cdRow: { display: 'flex', alignItems: 'flex-end', gap: 0 },
  num: { fontFamily: "'DM Mono',monospace", fontSize: '2.1rem', fontWeight: 400, color: '#fff', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,.3)' },
  unitLbl: { fontFamily: "'DM Mono',monospace", fontSize: '.68rem', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.28)', marginTop: 2 },
  sep: { fontSize: '1.4rem', color: 'rgba(255,255,255,.25)', paddingBottom: '.22rem', margin: '0 1px', animation: 'blink 1s infinite' },
  nn: { display: 'inline-flex', flexDirection: 'column', gap: 2, borderLeft: '.5px solid rgba(255,255,255,.15)', marginLeft: '1.2rem', paddingLeft: '1.2rem', opacity: .22, paddingBottom: '.24rem' },
  nnLabel: { fontFamily: "'DM Mono',monospace", fontSize: '.68rem', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.22)' },
  nnDate: { fontFamily: "'Cormorant Garamond',serif", fontSize: '1.6rem', fontStyle: 'italic', color: '#fff' },
};
