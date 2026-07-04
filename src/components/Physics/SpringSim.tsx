import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Oscillateur masse-ressort : l'équation différentielle x'' = −(k/m)·x
 * intégrée en temps réel (Euler semi-implicite). L'élève règle k et m et
 * vérifie que la pulsation mesurée colle à ω = √(k/m).
 */
export function SpringSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [k, setK] = useState(9);
  const [m, setM] = useState(1);
  const params = useRef({ k, m });
  params.current = { k, m };

  const W = 560;
  const H = 210;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(canvas);
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colMass = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colSpring = css.getPropertyValue('--border').trim() || '#2e3550';
    const colTrace = css.getPropertyValue('--ok').trim() || '#4cc38a';

    // État de l'EDO (x en mètres, autour du point d'équilibre)
    let x = 1;
    let v = 0;
    let last = performance.now();
    const trace: number[] = [];
    let raf = 0;

    const draw = (now: number) => {
      const { k, m } = params.current;
      // Euler semi-implicite : stable pour les oscillateurs.
      let dt = Math.min((now - last) / 1000, 0.03);
      last = now;
      const sub = 4;
      dt /= sub;
      for (let i = 0; i < sub; i++) {
        v += (-(k / m) * x) * dt;
        x += v * dt;
      }
      trace.push(x);
      if (trace.length > 180) trace.shift();

      ctx.clearRect(0, 0, W, H);
      const anchorX = 30;
      const midY = 70;
      const eqX = 300;
      const massX = eqX + x * 90;

      // Ressort (zigzag)
      ctx.strokeStyle = colSpring;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(anchorX, midY);
      const coils = 10;
      for (let i = 1; i <= coils; i++) {
        const t = i / (coils + 1);
        const sx = anchorX + (massX - 24 - anchorX) * t;
        ctx.lineTo(sx, midY + (i % 2 === 0 ? -12 : 12));
      }
      ctx.lineTo(massX - 24, midY);
      ctx.stroke();
      // Mur
      ctx.fillStyle = colSpring;
      ctx.fillRect(anchorX - 8, midY - 32, 8, 64);
      // Masse
      ctx.fillStyle = colMass;
      ctx.beginPath();
      ctx.roundRect(massX - 24, midY - 22, 48, 44, 8);
      ctx.fill();

      // Trace x(t) — la sinusoïde se dessine toute seule
      ctx.strokeStyle = colTrace;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      for (let i = 0; i < trace.length; i++) {
        const X = W - trace.length * 3 + i * 3;
        const Y = 165 - trace[i] * 28;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
      }
      ctx.stroke();
      ctx.fillStyle = colText;
      ctx.font = '11px system-ui';
      ctx.fillText('x(t)', 8, 168);

      const omega = Math.sqrt(k / m);
      ctx.font = 'bold 13px system-ui';
      ctx.fillText(`ω = √(k/m) = √(${k}/${m}) = ${omega.toFixed(2)} rad/s`, 8, 20);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="physics-sim">
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <div className="physics-controls">
        <label>
          raideur k = {k}
          <input type="range" min={1} max={25} step={1} value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
        <label>
          masse m = {m}
          <input type="range" min={1} max={8} step={1} value={m} onChange={(e) => setM(Number(e.target.value))} />
        </label>
      </div>
      <p className="physics-caption">
        L’ordinateur ne connaît pas la solution : il applique juste x'' = −(k/m)·x pas à pas, et la
        sinusoïde émerge. Augmente k : ça vibre plus vite. Augmente m : ça ralentit. Exactement ω = √(k/m).
      </p>
    </div>
  );
}
