import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Épicycles : la série de Fourier du créneau dessinée par des cercles
 * montés les uns sur les autres. Le cercle k tourne k fois plus vite avec
 * un rayon 4/(πk) — la pointe du dernier trace le créneau. Chaque cercle
 * est un vecteur tournant e^{ikt} : Fourier, version manège.
 */
export function EpicyclesExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(3);
  const traceRef = useRef<number[]>([]);
  const tRef = useRef(0);

  const W = 560;
  const H = 320;
  const CX = 120; // centre du manège
  const CY = H / 2;
  const S = 70; // pixels par unité
  const TRACE_X = 260; // où commence le tracé qui défile

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
    const colCircle = css.getPropertyValue('--border').trim() || '#2e3550';
    const colArm = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colTrace = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    let raf = 0;
    const frame = () => {
      tRef.current += 0.025;
      const t = tRef.current;

      ctx.clearRect(0, 0, W, H);

      // Axe du créneau idéal (±1) en filigrane.
      ctx.strokeStyle = colCircle;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([4, 4]);
      for (const level of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(TRACE_X, CY - level * S);
        ctx.lineTo(W, CY - level * S);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      // Chaîne d'épicycles : harmoniques impaires k = 1, 3, 5, …
      let x = CX;
      let y = CY;
      for (let c = 0; c < n; c++) {
        const k = 2 * c + 1;
        const r = (4 / (Math.PI * k)) * S;
        ctx.strokeStyle = colCircle;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        const nx = x + r * Math.cos(k * t);
        const ny = y - r * Math.sin(k * t);
        ctx.strokeStyle = colArm;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        x = nx;
        y = ny;
      }

      // Pointe du dernier bras.
      ctx.fillStyle = colTrace;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Historique de la hauteur : le tracé défile vers la droite.
      const trace = traceRef.current;
      trace.unshift(y);
      if (trace.length > W - TRACE_X) trace.pop();

      ctx.strokeStyle = colText;
      ctx.globalAlpha = 0.6;
      ctx.setLineDash([3, 5]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(TRACE_X, trace[0]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = colTrace;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k < trace.length; k++) {
        if (k === 0) ctx.moveTo(TRACE_X + k, trace[k]);
        else ctx.lineTo(TRACE_X + k, trace[k]);
      }
      ctx.stroke();

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  return (
    <div className="physics-sim">
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <div className="physics-controls">
        <label>
          cercles : {n}
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <p className="physics-caption">
        Le cercle k tourne k fois plus vite, rayon 4/(πk) : la pointe verte dessine le créneau de
        la Phase 9. Chaque cercle est un vecteur tournant e^(ikt) — ajoute des cercles et regarde
        les coins se former (et le sursaut de Gibbs rester).
      </p>
    </div>
  );
}
