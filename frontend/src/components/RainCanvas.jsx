import { useEffect, useRef } from 'react';

const PLANES = [
  { n: 55, spd: 3.5, len: 11, w: 0.35, a: 0.16, ang: 0.055 },
  { n: 95, spd: 8,   len: 20, w: 0.65, a: 0.32, ang: 0.10  },
  { n: 55, spd: 16,  len: 38, w: 1.2,  a: 0.58, ang: 0.15  },
];

const SCENE_BG = {
  rain:   'linear-gradient(180deg,#0a1e3c 0%,#1a3a60 55%,#0c2448 100%)',
  storm:  'linear-gradient(180deg,#060c1a 0%,#0d1535 50%,#040810 100%)',
  sun:    'linear-gradient(180deg,#0b2c68 0%,#1658ab 50%,#2e7fcf 100%)',
  cloudy: 'linear-gradient(180deg,#18273e 0%,#243650 55%,#1c2b40 100%)',
  fog:    'linear-gradient(180deg,#1c2836 0%,#2a3a4e 100%)',
};

export default function RainCanvas({ scene = 'rain' }) {
  const containerRef = useRef(null);
  const stateRef = useRef({ scene, planes: [], ltFlash: 0, animId: null });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvases = PLANES.map(() => {
      const c = document.createElement('canvas');
      c.style.cssText = 'position:absolute;inset:0;pointer-events:none;transition:opacity 2s ease';
      container.appendChild(c);
      return c;
    });
    const extC = document.createElement('canvas');
    extC.style.cssText = 'position:absolute;inset:0;pointer-events:none';
    container.appendChild(extC);

    const planes = canvases.map((c, i) => ({
      canvas: c, ctx: c.getContext('2d'), drops: [], cfg: PLANES[i], on: true,
    }));
    const extX = extC.getContext('2d');
    stateRef.current.planes = planes;
    stateRef.current.extC = extC;
    stateRef.current.extX = extX;

    let W = 0, H = 0;

    function mkDrop(cfg, scatter) {
      return {
        x: Math.random() * W * 1.3 - W * 0.15,
        y: scatter ? Math.random() * H : -cfg.len,
        len: cfg.len * (0.55 + Math.random() * 0.9),
        spd: cfg.spd * (0.65 + Math.random() * 0.7),
        a: cfg.a * (0.45 + Math.random() * 0.9),
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvases.forEach(c => { c.width = W; c.height = H; });
      extC.width = W; extC.height = H;
      planes.forEach(p => { p.drops = []; for (let i = 0; i < p.cfg.n; i++) p.drops.push(mkDrop(p.cfg, true)); });
    }
    resize();
    window.addEventListener('resize', resize);

    function drawBolt(ctx) {
      ctx.save();
      ctx.strokeStyle = 'rgba(235,215,255,.92)'; ctx.lineWidth = 1.6;
      ctx.shadowColor = '#c084fc'; ctx.shadowBlur = 22;
      let x = W * 0.22 + Math.random() * W * 0.56, y = 0;
      ctx.beginPath(); ctx.moveTo(x, y);
      while (y < H * 0.6) { x += Math.random() * 90 - 45; y += 35 + Math.random() * 45; ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    }

    function draw() {
      const s = stateRef.current.scene;
      const doRain = s === 'rain' || s === 'storm';

      planes.forEach(p => {
        p.ctx.clearRect(0, 0, W, H);
        if (!doRain) return;
        const boost = s === 'storm' ? 1.65 : 1;
        const col = s === 'storm' ? 'rgba(185,165,255,1)' : 'rgba(165,210,255,1)';
        p.ctx.strokeStyle = col; p.ctx.lineCap = 'round';
        for (const d of p.drops) {
          p.ctx.globalAlpha = Math.min(1, d.a * boost);
          p.ctx.lineWidth = p.cfg.w * (s === 'storm' ? 1.45 : 1);
          const dx = d.len * p.cfg.ang;
          p.ctx.beginPath(); p.ctx.moveTo(d.x, d.y); p.ctx.lineTo(d.x + dx, d.y + d.len); p.ctx.stroke();
          d.y += d.spd * boost; d.x += d.spd * p.cfg.ang * boost;
          if (d.y > H + d.len) { d.y = -d.len; d.x = Math.random() * W * 1.25 - W * 0.1; }
        }
        p.ctx.globalAlpha = 1;
      });

      extX.clearRect(0, 0, W, H);

      if (s === 'storm') {
        if (stateRef.current.ltFlash > 0) {
          extX.fillStyle = `rgba(195,175,255,${stateRef.current.ltFlash * 0.065})`;
          extX.fillRect(0, 0, W, H); stateRef.current.ltFlash--;
        }
        if (Math.random() < 0.006) { stateRef.current.ltFlash = 10; drawBolt(extX); }
      }

      if (s === 'sun') {
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI - Math.PI / 2 + Math.PI / 10;
          const t = Date.now() * 0.0004;
          const op = 0.035 + 0.02 * Math.sin(t + i);
          const grd = extX.createLinearGradient(W/2, H*0.07, W/2+Math.cos(a)*W*0.9, H*0.07+Math.sin(a)*H*0.9);
          grd.addColorStop(0, `rgba(255,230,100,${op*3})`);
          grd.addColorStop(1, 'rgba(255,230,100,0)');
          extX.fillStyle = grd;
          const sp = 0.06;
          extX.beginPath(); extX.moveTo(W/2, H*0.07);
          extX.lineTo(W/2+Math.cos(a-sp)*W, H*0.07+Math.sin(a-sp)*H);
          extX.lineTo(W/2+Math.cos(a+sp)*W, H*0.07+Math.sin(a+sp)*H);
          extX.closePath(); extX.fill();
        }
      }

      if (s === 'cloudy' || s === 'fog') {
        const t = Date.now() * 0.008;
        for (let i = 0; i < 6; i++) {
          const x = ((W*0.15 + i*W*0.16 + t*12*(i%2?1:0.7)) % (W*1.2)) - W*0.1;
          const y = H*0.08 + i*22;
          const r = 55 + i*28;
          const grd = extX.createRadialGradient(x,y,0,x,y,r);
          grd.addColorStop(0, 'rgba(195,215,240,.07)'); grd.addColorStop(1, 'transparent');
          extX.fillStyle = grd;
          extX.beginPath(); extX.ellipse(x,y,r,r*0.5,0,0,Math.PI*2); extX.fill();
        }
      }

      stateRef.current.animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(stateRef.current.animId);
      window.removeEventListener('resize', resize);
      canvases.forEach(c => c.remove());
      extC.remove();
    };
  }, []);

  useEffect(() => {
    stateRef.current.scene = scene;
  }, [scene]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: SCENE_BG[scene] || SCENE_BG.rain,
        transition: 'background 3.5s ease',
      }}
    />
  );
}
