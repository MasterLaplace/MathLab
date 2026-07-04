import { useEffect, useRef, useState } from 'react';
import './physics.css';

const ROWS = 10;
const BINS = ROWS + 1;

interface Ball {
  /** Choix gauche/droite précalculés pour chaque rangée. */
  path: boolean[];
  /** Progression continue en rangées (0 → ROWS). */
  t: number;
  speed: number;
}

/** C(n, k) pour la binomiale en surimpression. */
function choose(n: number, k: number): number {
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return r;
}

/**
 * Planche de Galton : chaque bille fait ROWS choix pile-ou-face, et pourtant
 * la forme finale est toujours la même — la binomiale, qui tend vers la
 * courbe en cloche. L'ordre né du hasard.
 */
export function GaltonExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballsRef = useRef<Ball[]>([]);
  const binsRef = useRef<number[]>(new Array(BINS).fill(0));
  const [total, setTotal] = useState(0);

  const W = 560;
  const H = 400;
  const PEG_TOP = 40;
  const PEG_H = 200;
  const BIN_H = 130;
  const STEP = W / (BINS + 3);

  const drop = (n: number) => {
    for (let i = 0; i < n; i++) {
      ballsRef.current.push({
        path: Array.from({ length: ROWS }, () => Math.random() < 0.5),
        t: -Math.random() * n * 0.12,
        speed: 6 + Math.random() * 2,
      });
    }
  };

  const reset = () => {
    ballsRef.current = [];
    binsRef.current = new Array(BINS).fill(0);
    setTotal(0);
  };

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
    const colPeg = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colBall = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colBar = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colCurve = css.getPropertyValue('--warn').trim() || '#ffb454';

    // Position horizontale d'une bille : centre + (droites − gauches)/2 pas.
    const xAt = (path: boolean[], row: number): number => {
      let dx = 0;
      for (let i = 0; i < Math.min(row, ROWS); i++) dx += path[i] ? 0.5 : -0.5;
      return W / 2 + dx * STEP;
    };

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, W, H);

      // Les clous
      ctx.fillStyle = colPeg;
      for (let r = 0; r < ROWS; r++) {
        const y = PEG_TOP + ((r + 0.5) / ROWS) * PEG_H;
        for (let k = 0; k <= r; k++) {
          const x = W / 2 + (k - r / 2) * STEP;
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Les billes en chute
      let landed = 0;
      ctx.fillStyle = colBall;
      for (const b of ballsRef.current) {
        b.t += b.speed * dt;
        if (b.t >= ROWS + 1.2) {
          const bin = b.path.filter(Boolean).length;
          binsRef.current[bin]++;
          landed++;
          b.t = Infinity;
          continue;
        }
        if (b.t < 0 || b.t === Infinity) continue;
        const row = Math.floor(b.t);
        const frac = b.t - row;
        const x1 = xAt(b.path, row);
        const x2 = xAt(b.path, row + 1);
        const x = x1 + (x2 - x1) * frac;
        const y = PEG_TOP + (Math.min(b.t, ROWS + 1) / ROWS) * PEG_H;
        ctx.beginPath();
        ctx.arc(x, Math.min(y, PEG_TOP + PEG_H + 20), 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (landed > 0) {
        ballsRef.current = ballsRef.current.filter((b) => b.t !== Infinity);
        setTotal((t) => t + landed);
      }

      // Histogramme
      const counts = binsRef.current;
      const totalCount = counts.reduce((a, b) => a + b, 0);
      const maxCount = Math.max(1, ...counts);
      const baseY = H - 24;
      ctx.fillStyle = colBar;
      for (let k = 0; k < BINS; k++) {
        const x = W / 2 + (k - ROWS / 2) * STEP;
        const h = (counts[k] / maxCount) * (BIN_H - 30);
        ctx.globalAlpha = 0.85;
        ctx.fillRect(x - STEP * 0.38, baseY - h, STEP * 0.76, h);
      }
      ctx.globalAlpha = 1;

      // La binomiale attendue, en surimpression
      if (totalCount > 12) {
        ctx.strokeStyle = colCurve;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k < BINS; k++) {
          const p = choose(ROWS, k) / 2 ** ROWS;
          const x = W / 2 + (k - ROWS / 2) * STEP;
          const expected = p * totalCount;
          const y = baseY - (expected / maxCount) * (BIN_H - 30);
          if (k === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <button type="button" className="btn" onClick={() => drop(1)}>
          Lâcher 1 bille
        </button>
        <button type="button" className="btn btn-primary" onClick={() => drop(100)}>
          Lâcher 100 billes
        </button>
        <button type="button" className="btn" onClick={reset}>
          ↺ Vider
        </button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        {total} bille{total > 1 ? 's' : ''} arrivée{total > 1 ? 's' : ''}. Chaque bille fait {ROWS}{' '}
        choix au hasard — et pourtant la même cloche émerge toujours (en orange : la binomiale
        théorique). C’est le théorème central limite en action.
      </p>
    </div>
  );
}
