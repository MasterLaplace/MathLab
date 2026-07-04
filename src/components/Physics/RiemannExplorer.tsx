import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Sommes de Riemann : l'aire sous x² sur [0, 2] approchée par n rectangles.
 * Monte n : la somme converge vers l'aire exacte 8/3 — l'intégrale est
 * la limite d'un empilement de rectangles de plus en plus fins.
 */
export function RiemannExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(4);

  const W = 560;
  const H = 320;
  const X0 = 0;
  const X1 = 2;
  const YMAX = 4.4;
  const PAD = 34;
  const px = (x: number) => PAD + ((x - X0) / (X1 - X0)) * (W - 2 * PAD);
  const py = (y: number) => H - 30 - (y / YMAX) * (H - 60);
  const f = (x: number) => x * x;

  const dx = (X1 - X0) / n;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += f(X0 + (i + 0.5) * dx) * dx;
  const exact = 8 / 3;

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
    const colCurve = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colRect = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colAxis = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD - 8, py(0));
    ctx.lineTo(W - PAD + 8, py(0));
    ctx.moveTo(px(0), H - 20);
    ctx.lineTo(px(0), 16);
    ctx.stroke();

    // Rectangles (point milieu)
    const step = (X1 - X0) / n;
    ctx.fillStyle = colRect;
    ctx.strokeStyle = colRect;
    for (let i = 0; i < n; i++) {
      const x = X0 + i * step;
      const h = f(x + step / 2);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(px(x), py(h), px(x + step) - px(x), py(0) - py(h));
      ctx.globalAlpha = 0.9;
      ctx.strokeRect(px(x), py(h), px(x + step) - px(x), py(0) - py(h));
    }
    ctx.globalAlpha = 1;

    // La courbe x²
    ctx.strokeStyle = colCurve;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = X0 + ((X1 - X0) * i) / 200;
      const y = py(f(x));
      if (i === 0) ctx.moveTo(px(x), y);
      else ctx.lineTo(px(x), y);
    }
    ctx.stroke();

    // Étiquettes
    ctx.fillStyle = colAxis;
    ctx.font = '600 13px system-ui';
    ctx.fillText('0', px(0) - 12, py(0) + 16);
    ctx.fillText('2', px(2) - 4, py(0) + 16);
    ctx.fillText('y = x²', px(1.55), py(f(1.75)));
  }, [n]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          rectangles : {n}
          <input
            type="range"
            min={1}
            max={80}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Somme des {n} rectangle{n > 1 ? 's' : ''} : {sum.toFixed(4)} — aire exacte : 8/3 ≈{' '}
        {exact.toFixed(4)} (écart {Math.abs(sum - exact).toFixed(4)}). Affine le découpage : la
        somme devient l’intégrale.
      </p>
    </div>
  );
}
