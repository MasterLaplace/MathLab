import { useEffect, useRef, useState } from 'react';
import './physics.css';

interface Vec {
  x: number;
  y: number;
}

/**
 * Addition de vecteurs 2D : on attrape l'extrémité de u ou de v,
 * la somme u+v et le parallélogramme suivent en direct.
 */
export function VectorsExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [u, setU] = useState<Vec>({ x: 2, y: 0.5 });
  const [v, setV] = useState<Vec>({ x: 0.8, y: 1.2 });
  const dragRef = useRef<'u' | 'v' | null>(null);

  const W = 560;
  const H = 320;
  // Coordonnées monde : [-0.5, 4.5] × [-0.5, 3]
  const X0 = -0.5;
  const X1 = 4.5;
  const Y0 = -0.5;
  const Y1 = 3;
  const px = (x: number) => ((x - X0) / (X1 - X0)) * W;
  const py = (y: number) => H - ((y - Y0) / (Y1 - Y0)) * H;
  const toWorld = (cx: number, cy: number): Vec => ({
    x: X0 + (cx / W) * (X1 - X0),
    y: Y0 + ((H - cy) / H) * (Y1 - Y0),
  });

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
    const colU = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colV = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colSum = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const arrow = (from: Vec, to: Vec, color: string, width = 2.5, dash?: number[]) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.setLineDash(dash ?? []);
      ctx.beginPath();
      ctx.moveTo(px(from.x), py(from.y));
      ctx.lineTo(px(to.x), py(to.y));
      ctx.stroke();
      ctx.setLineDash([]);
      const a = Math.atan2(py(to.y) - py(from.y), px(to.x) - px(from.x));
      ctx.beginPath();
      ctx.moveTo(px(to.x), py(to.y));
      ctx.lineTo(px(to.x) - 10 * Math.cos(a - 0.42), py(to.y) - 10 * Math.sin(a - 0.42));
      ctx.lineTo(px(to.x) - 10 * Math.cos(a + 0.42), py(to.y) - 10 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
    };

    ctx.clearRect(0, 0, W, H);

    // Grille + axes
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (let gx = Math.ceil(X0); gx <= X1; gx++) {
      ctx.beginPath();
      ctx.moveTo(px(gx), 0);
      ctx.lineTo(px(gx), H);
      ctx.stroke();
    }
    for (let gy = Math.ceil(Y0); gy <= Y1; gy++) {
      ctx.beginPath();
      ctx.moveTo(0, py(gy));
      ctx.lineTo(W, py(gy));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colText;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();

    const sum = { x: u.x + v.x, y: u.y + v.y };
    const O = { x: 0, y: 0 };

    // Parallélogramme (copies pointillées)
    arrow(u, sum, colV, 1.5, [5, 5]);
    arrow(v, sum, colU, 1.5, [5, 5]);

    arrow(O, u, colU);
    arrow(O, v, colV);
    arrow(O, sum, colSum, 3.5);

    // Poignées
    for (const [vec, col] of [
      [u, colU],
      [v, colV],
    ] as const) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px(vec.x), py(vec.y), 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = colText;
    ctx.font = '600 14px system-ui';
    ctx.fillText('u', px(u.x) + 10, py(u.y) - 8);
    ctx.fillText('v', px(v.x) + 10, py(v.y) - 8);
    ctx.fillStyle = colSum;
    ctx.fillText('u + v', px(sum.x) + 10, py(sum.y) - 8);
  }, [u, v]);

  const pointerPos = (e: React.PointerEvent): Vec => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return toWorld(
      ((e.clientX - rect.left) / rect.width) * W,
      ((e.clientY - rect.top) / rect.height) * H,
    );
  };

  const onDown = (e: React.PointerEvent) => {
    const p = pointerPos(e);
    const du = Math.hypot(p.x - u.x, p.y - u.y);
    const dv = Math.hypot(p.x - v.x, p.y - v.y);
    if (Math.min(du, dv) > 0.45) return;
    dragRef.current = du <= dv ? 'u' : 'v';
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const p = pointerPos(e);
    const clamped = {
      x: Math.max(X0 + 0.1, Math.min(X1 - 0.1, p.x)),
      y: Math.max(Y0 + 0.1, Math.min(Y1 - 0.1, p.y)),
    };
    if (dragRef.current === 'u') setU(clamped);
    else setV(clamped);
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const sum = { x: u.x + v.x, y: u.y + v.y };
  const norm = Math.hypot(sum.x, sum.y);

  return (
    <div className="physics-sim">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p className="physics-caption">
        u = ({u.x.toFixed(1)}, {u.y.toFixed(1)})&ensp;·&ensp;v = ({v.x.toFixed(1)},{' '}
        {v.y.toFixed(1)})&ensp;·&ensp;u+v = ({sum.x.toFixed(1)}, {sum.y.toFixed(1)}),&ensp;‖u+v‖ ={' '}
        {norm.toFixed(2)}. Attrape l’extrémité d’une flèche : la somme suit la règle du
        parallélogramme.
      </p>
    </div>
  );
}
