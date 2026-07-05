import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Marches aléatoires → diffusion : 400 marcheurs partent de 0 et font un
 * pas ±1 à chaque tic. Le nuage s'étale en √t (la parabole verte), et
 * l'histogramme dessine la cloche de Gauss : la diffusion est née du hasard.
 */
export function RandomWalkExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(true);
  const walkersRef = useRef<number[]>([]);
  const tRef = useRef(0);

  const W = 560;
  const H = 320;
  const N = 400;
  const TMAX = 260;

  useEffect(() => {
    if (walkersRef.current.length === 0) {
      walkersRef.current = new Array(N).fill(0);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(canvas);
    const colDot = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colEnv = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const XSCALE = (W - 120) / TMAX;
    const CY = H / 2;
    const YSCALE = 3.4;

    let raf = 0;
    const draw = () => {
      if (running && tRef.current < TMAX) {
        tRef.current += 1;
        for (let i = 0; i < N; i++) {
          walkersRef.current[i] += Math.random() < 0.5 ? -1 : 1;
        }
      }
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Axe du temps
      ctx.strokeStyle = colDim;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(8, CY);
      ctx.lineTo(W - 100, CY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // L'enveloppe ±√t
      ctx.strokeStyle = colEnv;
      ctx.lineWidth = 2;
      for (const sgn of [1, -1]) {
        ctx.beginPath();
        for (let tt = 0; tt <= t; tt++) {
          const x = 8 + tt * XSCALE;
          const y = CY - sgn * Math.sqrt(tt) * YSCALE;
          if (tt === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Les marcheurs au temps t (positions actuelles)
      ctx.fillStyle = colDot;
      ctx.globalAlpha = 0.5;
      const xNow = 8 + t * XSCALE;
      for (let i = 0; i < N; i++) {
        ctx.fillRect(xNow - 1, CY - walkersRef.current[i] * YSCALE - 1, 2.4, 2.4);
      }
      ctx.globalAlpha = 1;

      // Histogramme vertical à droite
      const bins = new Map<number, number>();
      let maxBin = 1;
      for (const p of walkersRef.current) {
        const b = Math.round(p / 4) * 4;
        const c = (bins.get(b) ?? 0) + 1;
        bins.set(b, c);
        if (c > maxBin) maxBin = c;
      }
      ctx.fillStyle = colDot;
      for (const [b, c] of bins) {
        const y = CY - b * YSCALE;
        ctx.globalAlpha = 0.75;
        ctx.fillRect(W - 96, y - 5, (c / maxBin) * 88, 10);
      }
      ctx.globalAlpha = 1;

      // Écart-type mesuré
      const mean = walkersRef.current.reduce((s, p) => s + p, 0) / N;
      const sd = Math.sqrt(walkersRef.current.reduce((s, p) => s + (p - mean) ** 2, 0) / N);
      ctx.fillStyle = colDim;
      ctx.font = '600 13px system-ui';
      ctx.fillText(`t = ${t}   σ mesuré ≈ ${sd.toFixed(1)}   √t = ${Math.sqrt(t).toFixed(1)}`, 12, 20);
      ctx.fillStyle = colEnv;
      ctx.fillText('± √t', 8 + Math.min(t, TMAX - 20) * XSCALE - 34, CY - Math.sqrt(t) * YSCALE - 8);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          <input type="checkbox" checked={running} onChange={(e) => setRunning(e.target.checked)} /> marche en cours
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            walkersRef.current = new Array(N).fill(0);
            tRef.current = 0;
          }}
        >
          recommencer
        </button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        400 marcheurs jouent leur position à pile ou face, un pas par tic. Personne ne sait où va
        <em> un</em> marcheur — mais le <strong>nuage</strong> est parfaitement prévisible : il s’étale
        en √t (parabole verte) et son histogramme est la cloche de Gauss. C’est la diffusion : l’encre
        dans l’eau, la chaleur dans le métal — l’équation de la chaleur est une marche aléatoire vue de
        loin.
      </p>
    </div>
  );
}
