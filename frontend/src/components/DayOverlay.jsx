import { useEffect, useRef, useMemo } from 'react';
import { classifyWeather } from '../utils/weatherUtils';

const RAIN_MSGS  = ["Your favourite kind of day. Breathe it in.", "Rain is nature's way of hitting refresh.", "Close your eyes. Hear it coming.", "The clouds gathered just for this.", "Let the rain wash everything quiet and beautiful.", "This is the day the sky dances."];
const STORM_MSGS = ["The sky puts on its full show today ⚡", "Thunder is just rain with ambition.", "An electric day — watch it from somewhere warm.", "The universe is showing off. Watch closely."];
const SUN_MSGS   = ["The sun holds its ground today.", "Bright skies — but the clouds are plotting.", "A golden pause between the showers.", "Clear today. The rain is just resting."];

export default function DayOverlay({ dayKey, data, onClose }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const dropsRef  = useRef([]);
  const ltRef     = useRef(0);

  const open = !!dayKey;
  const day  = dayKey ? data[dayKey] : null;
  const w    = day ? classifyWeather(day.code, day.precip) : null;

  // stable random message per dayKey
  const msg = useMemo(() => {
    if (!w) return '';
    const pool = w.cls === 'storm' ? STORM_MSGS : (w.cls === 'rain' || w.cls === 'hrain') ? RAIN_MSGS : SUN_MSGS;
    return pool[Math.floor(Math.random() * pool.length)];
  }, [dayKey]); // eslint-disable-line

  // canvas animation
  useEffect(() => {
    if (!open || !w) {
      cancelAnimationFrame(animRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const scene = w.cls === 'hrain' ? 'hrain' : w.scene;

    let W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;

    function mkDrop() {
      const spd   = scene === 'storm' ? 21 : scene === 'hrain' ? 14 : 9;
      const len   = scene === 'storm' ? 34 : scene === 'hrain' ? 22 : 14;
      const ww    = scene === 'storm' ? 1.5 : scene === 'hrain' ? 0.95 : 0.6;
      return {
        x: Math.random() * W * 1.2 - W * 0.1,
        y: Math.random() * H,
        len: len * (0.5 + Math.random()),
        spd: spd * (0.65 + Math.random() * 0.7),
        a:   (0.55 + Math.random() * 0.45) * (scene === 'storm' ? 0.85 : 0.65),
        w:   ww * (0.6 + Math.random() * 0.8),
      };
    }

    const count = scene === 'storm' ? 420 : scene === 'hrain' ? 280 : 170;
    dropsRef.current = Array.from({ length: count }, mkDrop);

    function drawBolt() {
      ctx.save();
      ctx.strokeStyle = 'rgba(235,215,255,.92)'; ctx.lineWidth = 1.6;
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 22;
      let x = W * 0.22 + Math.random() * W * 0.56, y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < H * 0.6) { x += Math.random() * 90 - 45; y += 35 + Math.random() * 45; ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // tinted background
      const tint = scene === 'storm'  ? 'rgba(4,3,16,.97)'
                 : scene === 'rain' || scene === 'hrain' ? 'rgba(5,18,42,.97)'
                 : scene === 'sun'   ? 'rgba(7,22,58,.97)'
                 : 'rgba(10,17,34,.97)';
      ctx.fillStyle = tint; ctx.fillRect(0, 0, W, H);

      // lightning flash
      if (scene === 'storm') {
        if (ltRef.current > 0) {
          ctx.fillStyle = `rgba(190,165,255,${ltRef.current * 0.075})`;
          ctx.fillRect(0, 0, W, H); ltRef.current--;
        }
        if (Math.random() < 0.008) { ltRef.current = 9; drawBolt(); }
      }

      // rain drops
      if (scene === 'rain' || scene === 'hrain' || scene === 'storm') {
        ctx.strokeStyle = scene === 'storm' ? 'rgba(185,160,255,.9)' : 'rgba(160,208,255,.88)';
        ctx.lineCap = 'round';
        const ang = scene === 'storm' ? 0.18 : 0.12;
        for (const d of dropsRef.current) {
          ctx.globalAlpha = d.a; ctx.lineWidth = d.w;
          ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.len * ang, d.y + d.len); ctx.stroke();
          d.y += d.spd; d.x += d.spd * ang;
          if (d.y > H + d.len) { d.y = -d.len; d.x = Math.random() * W * 1.2 - W * 0.1; }
        }
        ctx.globalAlpha = 1;
      }

      // sun floating particles
      if (scene === 'sun') {
        for (const d of dropsRef.current) {
          ctx.globalAlpha = d.a * 0.4;
          ctx.fillStyle = 'rgba(255,220,85,.9)';
          ctx.beginPath(); ctx.arc(d.x, d.y, d.w * 1.8, 0, Math.PI * 2); ctx.fill();
          d.y -= d.spd * 0.25; d.x += Math.sin(Date.now() * 0.001 + d.y * 0.01) * 0.25;
          if (d.y < -4) { d.y = H; d.x = Math.random() * W; }
        }
        ctx.globalAlpha = 1;
      }

      // cloud wisps
      if (scene === 'cloudy' || scene === 'fog') {
        const t = Date.now() * 0.008;
        for (let i = 0; i < 8; i++) {
          const x = ((W * 0.1 + i * W * 0.13 + t * 10 * (i % 2 ? 1 : 0.7)) % (W * 1.2)) - W * 0.1;
          const y = H * 0.1 + i * 25;
          const r = 70 + i * 30;
          const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
          grd.addColorStop(0, 'rgba(195,215,240,.09)'); grd.addColorStop(1, 'transparent');
          ctx.fillStyle = grd;
          ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();

    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = W; canvas.height = H;
    }
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [dayKey, open]); // eslint-disable-line

  if (!open || !day || !w) return (
    <div style={{ ...S.overlay, opacity: 0, pointerEvents: 'none' }} />
  );

  const dt = new Date(dayKey + 'T12:00:00');
  const rainHours = day.hours?.filter(h => h.precip > 0 || h.code >= 51) || [];

  return (
    <div style={{ ...S.overlay, opacity: 1, pointerEvents: 'all' }} onClick={onClose}>
      <canvas ref={canvasRef} style={S.canvas} />
      <div style={S.card} onClick={e => e.stopPropagation()}>
        <span style={S.icon}>{w.icon}</span>
        <div style={S.date}>
          {dt.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
        <div style={{ ...S.type, color: w.col }}>
          {w.label}{day.est ? ' · estimate' : ''}
        </div>

        <div style={S.stats}>
          <Stat v={`${day.precip}mm`}          l="Precip" />
          <Stat v={`${day.prob}%`}              l="Chance" />
          <Stat v={`${Math.round(day.tmax)}°C`} l="High" />
          <Stat v={`${Math.round(day.wind)}km/h`} l="Wind" />
        </div>

        {rainHours.length > 0 && (
          <div style={S.hourly}>
            <div style={S.hourlyLabel}>Rain hours · hourly data</div>
            <div style={S.hourlyChips}>
              {rainHours.map((h, i) => {
                const hr  = new Date(h.t).getHours();
                const lbl = (hr % 12 || 12) + (hr >= 12 ? 'pm' : 'am');
                const ic  = h.code >= 95 ? '⛈' : h.code >= 80 ? '🌧' : h.code >= 51 ? '🌦' : '💧';
                return <span key={i} style={S.chip}>{ic} {lbl} <span style={{ opacity:.55 }}>{h.precip}mm</span></span>;
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
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'.15rem' }}>
      <div style={S.statV}>{v}</div>
      <div style={S.statL}>{l}</div>
    </div>
  );
}

const S = {
  overlay:     { position:'fixed', inset:0, zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', transition:'opacity .65s ease' },
  canvas:      { position:'absolute', inset:0, zIndex:0 },
  card:        { position:'relative', zIndex:1, background:'rgba(255,255,255,.07)', backdropFilter:'blur(36px)', WebkitBackdropFilter:'blur(36px)', border:'.5px solid rgba(255,255,255,.14)', borderRadius:28, padding:'2.2rem 2.6rem', textAlign:'center', maxWidth:460, width:'90%', animation:'gin .6s cubic-bezier(.34,1.4,.64,1)' },
  icon:        { fontSize:'4.5rem', display:'block', marginBottom:'.4rem', animation:'flt 3.5s ease-in-out infinite' },
  date:        { fontFamily:"'Cormorant Garamond',serif", fontSize:'2.5rem', fontStyle:'italic', fontWeight:300, color:'#fff', lineHeight:1, marginBottom:'.25rem' },
  type:        { fontFamily:"'DM Mono',monospace", fontSize:'.72rem', letterSpacing:'.24em', textTransform:'uppercase', marginBottom:'1.3rem' },
  stats:       { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.6rem', marginBottom:'1.3rem' },
  statV:       { fontFamily:"'DM Mono',monospace", fontSize:'1.05rem', color:'#fff' },
  statL:       { fontFamily:"'DM Mono',monospace", fontSize:'.55rem', letterSpacing:'.14em', textTransform:'uppercase', color:'rgba(255,255,255,.28)' },
  hourly:      { marginBottom:'1rem', textAlign:'left' },
  hourlyLabel: { fontFamily:"'DM Mono',monospace", fontSize:'.6rem', letterSpacing:'.2em', textTransform:'uppercase', color:'rgba(255,255,255,.3)', marginBottom:'.4rem' },
  hourlyChips: { display:'flex', flexWrap:'wrap', gap:4 },
  chip:        { display:'inline-flex', alignItems:'center', gap:3, background:'rgba(106,180,255,.12)', border:'.5px solid rgba(106,180,255,.25)', borderRadius:7, padding:'3px 7px', fontFamily:"'DM Mono',monospace", fontSize:'.65rem', color:'#6ab4ff' },
  msg:         { fontFamily:"'Cormorant Garamond',serif", fontSize:'1.25rem', fontStyle:'italic', color:'rgba(255,255,255,.82)', marginBottom:'1.4rem', lineHeight:1.55 },
  back:        { background:'rgba(255,255,255,.1)', border:'.5px solid rgba(255,255,255,.18)', borderRadius:100, color:'#fff', fontFamily:"'DM Mono',monospace", fontSize:'.72rem', letterSpacing:'.14em', padding:'.55rem 1.6rem', cursor:'pointer' },
};
