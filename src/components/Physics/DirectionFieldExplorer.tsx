import { useEffect, useRef, useState } from 'react';
import './physics.css';

type OdeKind = 'cooling' | 'growth' | 'logistic';

const ODES: Record<OdeKind, { name: string; f: (x: number, y: number) => number; caption: string }> = {
  cooling: {
    name: 'Refroidissement  y′ = 3 − y',
    f: (_x, y) => 3 - y,
    caption:
      'Un café posé dans une pièce à 3 : trop chaud il refroidit, trop froid il réchauffe. Toutes les histoires convergent vers l’équilibre y = 3 (là où y′ = 0).',
  },
  growth: {
    name: 'Croissance  y′ = 0,6·y',
    f: (_x, y) => 0.6 * y,
    caption:
      'Plus il y en a, plus ça pousse : la croissance exponentielle. L’équilibre y = 0 existe mais il est instable — la moindre étincelle s’envole.',
  },
  logistic: {
    name: 'Logistique  y′ = 0,8·y(1 − y/3)',
    f: (_x, y) => 0.8 * y * (1 - y / 3),
    caption:
      'Une population avec une limite : croissance exponentielle au début, saturation vers y = 3 (la capacité du milieu). Deux équilibres : 0 (instable) et 3 (stable).',
  },
};

interface Curve {
  kind: OdeKind;
  points: [number, number][];
}

/**
 * Champ de directions d'une EDO y' = f(x, y) : en chaque point, la pente
 * imposée par la règle locale. Clique n'importe où : une histoire complète
 * s'intègre sous tes yeux à partir de cette condition initiale.
 */
export function DirectionFieldExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<OdeKind>('cooling');
  const curvesRef = useRef<Curve[]>([]);
  const [, bump] = useState(0);

  const W = 560;
  const H = 320;
  const X0 = 0;
  const X1 = 6;
  const Y0 = -1;
  const Y1 = 5;
  const px = (x: number) => ((x - X0) / (X1 - X0)) * W;
  const py = (y: number) => H - ((y - Y0) / (Y1 - Y0)) * H;

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
    const colSlope = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colCurve = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colEq = css.getPropertyValue('--ok').trim() || '#4cc38a';

    const f = ODES[kind].f;
    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();

    // Équilibres (y' = 0 pour tout x) en vert
    ctx.strokeStyle = colEq;
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    for (let yEq = Y0; yEq <= Y1; yEq += 0.05) {
      // détection simple de changement de signe autour de yEq
      if (Math.abs(f(3, yEq)) < 0.015) {
        ctx.beginPath();
        ctx.moveTo(0, py(yEq));
        ctx.lineTo(W, py(yEq));
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);

    // Le champ : petits segments de pente f(x, y)
    ctx.strokeStyle = colSlope;
    ctx.lineWidth = 1.2;
    ctx.globalAlpha = 0.65;
    const L = 0.16;
    for (let gx = X0 + 0.25; gx < X1; gx += 0.4) {
      for (let gy = Y0 + 0.25; gy < Y1; gy += 0.4) {
        const slope = f(gx, gy);
        const norm = Math.hypot(1, slope);
        const dx = L / norm;
        const dy = (L * slope) / norm;
        ctx.beginPath();
        ctx.moveTo(px(gx - dx), py(gy - dy));
        ctx.lineTo(px(gx + dx), py(gy + dy));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Les solutions lâchées par l'utilisateur
    ctx.strokeStyle = colCurve;
    ctx.lineWidth = 2.4;
    for (const curve of curvesRef.current.filter((c) => c.kind === kind)) {
      ctx.beginPath();
      curve.points.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(px(x), py(y));
        else ctx.lineTo(px(x), py(y));
      });
      ctx.stroke();
      const [sx, sy] = curve.points[0];
      ctx.fillStyle = colCurve;
      ctx.beginPath();
      ctx.arc(px(sx), py(sy), 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const dropSolution = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = X0 + ((e.clientX - rect.left) / rect.width) * (X1 - X0);
    const y = Y0 + (1 - (e.clientY - rect.top) / rect.height) * (Y1 - Y0);
    const f = ODES[kind].f;

    // Intégration RK2 vers l'avant et l'arrière depuis la condition initiale.
    const integrate = (dir: 1 | -1): [number, number][] => {
      const pts: [number, number][] = [];
      let cx = x;
      let cy = y;
      const h = 0.02 * dir;
      for (let i = 0; i < 400; i++) {
        pts.push([cx, cy]);
        const k1 = f(cx, cy);
        const k2 = f(cx + h / 2, cy + (h / 2) * k1);
        cy += h * k2;
        cx += h;
        if (cx < X0 - 0.1 || cx > X1 + 0.1 || cy < Y0 - 2 || cy > Y1 + 2) break;
      }
      return pts;
    };
    const backward = integrate(-1).reverse();
    const forward = integrate(1);
    curvesRef.current.push({ kind, points: [...backward, ...forward] });
    bump((n) => n + 1);
  };

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(ODES) as OdeKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${kind === k ? 'btn-primary' : ''}`}
            onClick={() => setKind(k)}
          >
            {ODES[k].name}
          </button>
        ))}
        <button
          type="button"
          className="btn"
          onClick={() => {
            curvesRef.current = curvesRef.current.filter((c) => c.kind !== kind);
            bump((n) => n + 1);
          }}
        >
          ↺ Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={dropSolution}
      />
      <p className="physics-caption">
        {ODES[kind].caption} Clique n’importe où pour lâcher une condition initiale : la solution
        suit les petits segments de pente.
      </p>
    </div>
  );
}
