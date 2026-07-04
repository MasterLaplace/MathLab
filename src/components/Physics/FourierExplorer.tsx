import { useEffect, useRef, useState } from 'react';
import './physics.css';

type Signal = 'square' | 'triangle' | 'sawtooth';

const SIGNALS: Record<
  Signal,
  { name: string; target: (x: number) => number; harmonic: (k: number) => { n: number; amp: number } }
> = {
  square: {
    name: 'Créneau',
    target: (x) => (Math.sin(x) >= 0 ? 1 : -1),
    // 4/π · sin((2k−1)x)/(2k−1)
    harmonic: (k) => ({ n: 2 * k - 1, amp: 4 / (Math.PI * (2 * k - 1)) }),
  },
  triangle: {
    name: 'Triangle',
    target: (x) => (2 / Math.PI) * Math.asin(Math.sin(x)),
    // 8/π² · (−1)^(k−1) sin((2k−1)x)/(2k−1)²
    harmonic: (k) => ({
      n: 2 * k - 1,
      amp: ((8 / (Math.PI * Math.PI)) * (k % 2 === 1 ? 1 : -1)) / ((2 * k - 1) * (2 * k - 1)),
    }),
  },
  sawtooth: {
    name: 'Dents de scie',
    target: (x) => {
      const t = ((x + Math.PI) % (2 * Math.PI)) / (2 * Math.PI);
      return 2 * t - 1;
    },
    // 2/π · (−1)^(k+1) sin(kx)/k
    harmonic: (k) => ({ n: k, amp: ((2 / Math.PI) * (k % 2 === 1 ? 1 : -1)) / k }),
  },
};

/**
 * Série de Fourier : construire un signal en empilant des sinusoïdes.
 * Le phénomène de Gibbs (les petites cornes) apparaît de lui-même.
 */
export function FourierExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signal, setSignal] = useState<Signal>('square');
  const [n, setN] = useState(3);

  const W = 560;
  const H = 320;

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
    const colSum = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colTarget = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colHarm = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';

    // x ∈ [−π, 3π], y ∈ [−1.6, 1.6]
    const X0 = -Math.PI;
    const X1 = 3 * Math.PI;
    const py = (y: number) => H / 2 - (y / 1.6) * (H / 2 - 8);

    const spec = SIGNALS[signal];
    const harmonics = Array.from({ length: n }, (_, i) => spec.harmonic(i + 1));

    ctx.clearRect(0, 0, W, H);

    // Axe
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.stroke();

    const plot = (f: (x: number) => number, color: string, width: number, alpha = 1, dash?: number[]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.setLineDash(dash ?? []);
      ctx.beginPath();
      for (let i = 0; i <= W; i += 2) {
        const x = X0 + (i / W) * (X1 - X0);
        const y = py(f(x));
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    };

    // Cible en pointillé
    plot(spec.target, colTarget, 1.5, 0.7, [6, 5]);

    // Chaque harmonique, discrète
    for (const h of harmonics) {
      plot((x) => h.amp * Math.sin(h.n * x), colHarm, 1, 0.3);
    }

    // La somme, en avant
    plot((x) => harmonics.reduce((acc, h) => acc + h.amp * Math.sin(h.n * x), 0), colSum, 2.6);
  }, [signal, n]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(SIGNALS) as Signal[]).map((s) => (
          <button
            key={s}
            type="button"
            className={`btn ${signal === s ? 'btn-primary' : ''}`}
            onClick={() => setSignal(s)}
          >
            {SIGNALS[s].name}
          </button>
        ))}
        <label>
          harmoniques : {n}
          <input
            type="range"
            min={1}
            max={25}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        En pointillé : le signal cible. En vert pâle : chaque sinusoïde de la recette. En bleu :
        leur somme. Monte le curseur — la somme épouse la cible, mais des petites cornes persistent
        près des sauts : c’est le phénomène de Gibbs.
      </p>
    </div>
  );
}
