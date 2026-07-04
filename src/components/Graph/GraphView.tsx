import { useEffect, useRef } from 'react';
import { type Expr, evalAt, freeVariables, isCall } from '../../core/ast';
import './graph.css';

interface GraphViewProps {
  /** Équation `Equal(lhs, rhs)` à une variable. */
  expr: Expr;
  width?: number;
  height?: number;
}

const X_MIN = -10;
const X_MAX = 10;
const SAMPLES = 320;

/**
 * Trace les deux côtés de l'équation comme deux fonctions de la variable.
 * Le point d'intersection est la solution : il reste immobile pendant que
 * les courbes se déforment au fil des manipulations.
 */
export function GraphView({ expr, width = 560, height = 300 }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isCall(expr) || expr[0] !== 'Equal') return;
    const lhs = expr[1] as Expr;
    const rhs = expr[2] as Expr;
    const variable = [...freeVariables(expr)][0] ?? 'x';

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Échantillonne les deux côtés.
    const ys: { l: (number | undefined)[]; r: (number | undefined)[] } = { l: [], r: [] };
    const xs: number[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLES;
      xs.push(x);
      ys.l.push(evalAt(lhs, { [variable]: x }));
      ys.r.push(evalAt(rhs, { [variable]: x }));
    }

    // Fenêtre verticale adaptée aux valeurs visibles.
    const finite = [...ys.l, ...ys.r].filter((v): v is number => v !== undefined && Number.isFinite(v));
    if (finite.length === 0) return;
    let yMin = Math.min(...finite, 0);
    let yMax = Math.max(...finite, 0);
    const spread = Math.max(yMax - yMin, 4);
    yMin -= spread * 0.12;
    yMax += spread * 0.12;
    // Bornage pour éviter l'écrasement par des asymptotes.
    const median = finite.slice().sort((a, b) => a - b)[Math.floor(finite.length / 2)];
    yMin = Math.max(yMin, median - spread * 2);
    yMax = Math.min(yMax, median + spread * 2);

    const px = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * width;
    const py = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    const css = getComputedStyle(canvas);
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colL = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colR = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colOk = css.getPropertyValue('--ok').trim() || '#4cc38a';

    // Grille + axes
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.font = '11px system-ui';
    ctx.fillStyle = colText;
    for (let gx = Math.ceil(X_MIN / 2) * 2; gx <= X_MAX; gx += 2) {
      ctx.globalAlpha = gx === 0 ? 0.9 : 0.25;
      ctx.beginPath();
      ctx.moveTo(px(gx), 0);
      ctx.lineTo(px(gx), height);
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      if (gx !== 0) ctx.fillText(String(gx), px(gx) + 2, py(0) - 4);
    }
    const yStep = niceStep(yMax - yMin);
    for (let gy = Math.ceil(yMin / yStep) * yStep; gy <= yMax; gy += yStep) {
      ctx.globalAlpha = Math.abs(gy) < yStep / 2 ? 0.9 : 0.25;
      ctx.beginPath();
      ctx.moveTo(0, py(gy));
      ctx.lineTo(width, py(gy));
      ctx.stroke();
      ctx.globalAlpha = 0.8;
      if (Math.abs(gy) >= yStep / 2) ctx.fillText(String(Math.round(gy * 100) / 100), 4, py(gy) - 3);
    }
    ctx.globalAlpha = 1;

    // Courbes
    const drawCurve = (values: (number | undefined)[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= SAMPLES; i++) {
        const v = values[i];
        if (v === undefined || !Number.isFinite(v) || v < yMin - spread || v > yMax + spread) {
          pen = false;
          continue;
        }
        const X = px(xs[i]);
        const Y = py(v);
        if (pen) ctx.lineTo(X, Y);
        else ctx.moveTo(X, Y);
        pen = true;
      }
      ctx.stroke();
    };
    drawCurve(ys.l, colL);
    drawCurve(ys.r, colR);

    // Intersections (changement de signe de lhs - rhs)
    for (let i = 1; i <= SAMPLES; i++) {
      const a = diff(ys.l[i - 1], ys.r[i - 1]);
      const b = diff(ys.l[i], ys.r[i]);
      if (a === undefined || b === undefined) continue;
      if (a === 0 || a * b < 0) {
        const t = a === 0 ? 0 : a / (a - b);
        const xi = xs[i - 1] + t * (xs[i] - xs[i - 1]);
        const yi = evalAt(lhs, { [variable]: xi }) ?? 0;
        ctx.fillStyle = colOk;
        ctx.beginPath();
        ctx.arc(px(xi), py(yi), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = colText;
        ctx.font = 'bold 12px system-ui';
        ctx.fillText(`${variable} ≈ ${Math.round(xi * 100) / 100}`, px(xi) + 10, py(yi) - 8);
      }
    }
  }, [expr, width, height]);

  return (
    <div className="graph-view">
      <canvas ref={canvasRef} style={{ width, height, maxWidth: '100%' }} />
      <p className="graph-legend">
        <span className="graph-dot graph-dot-l" /> côté gauche
        <span className="graph-dot graph-dot-r" /> côté droit
        <span className="graph-dot graph-dot-i" /> solution (elle ne bouge pas !)
      </p>
    </div>
  );
}

function diff(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b)) return undefined;
  return a - b;
}

function niceStep(range: number): number {
  const raw = range / 6;
  const mag = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (raw <= m * mag) return m * mag;
  return 10 * mag;
}
