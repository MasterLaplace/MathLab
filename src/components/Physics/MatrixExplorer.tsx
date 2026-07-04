import { useEffect, useRef, useState } from 'react';
import './physics.css';

interface Vec {
  x: number;
  y: number;
}

/** Matrice 2×2 par ses colonnes : î ↦ (a,b), ĵ ↦ (c,d). */
interface Mat {
  a: number;
  b: number;
  c: number;
  d: number;
}

const PRESETS: { name: string; m: Mat }[] = [
  { name: 'Rotation 30°', m: { a: 0.87, b: 0.5, c: -0.5, d: 0.87 } },
  { name: 'Étirement', m: { a: 2, b: 0, c: 0, d: 0.5 } },
  { name: 'Cisaillement', m: { a: 1, b: 0, c: 1, d: 1 } },
  { name: 'Symétrie', m: { a: 0, b: 1, c: 1, d: 0 } },
];

/** Valeurs et vecteurs propres réels d'une matrice 2×2, s'ils existent. */
function eigen(m: Mat): { lambda: number; dir: Vec }[] {
  const tr = m.a + m.d;
  const det = m.a * m.d - m.b * m.c;
  const disc = tr * tr - 4 * det;
  if (disc < 0) return [];
  const roots = disc === 0 ? [tr / 2] : [(tr + Math.sqrt(disc)) / 2, (tr - Math.sqrt(disc)) / 2];
  return roots.flatMap((lambda) => {
    // (a−λ)x + c·y = 0  →  v = (c, λ−a), sinon ligne 2, sinon axes.
    let dir: Vec;
    if (Math.abs(m.c) > 1e-9 || Math.abs(m.a - lambda) > 1e-9) dir = { x: m.c, y: lambda - m.a };
    else if (Math.abs(m.b) > 1e-9 || Math.abs(m.d - lambda) > 1e-9)
      dir = { x: lambda - m.d, y: m.b };
    else dir = { x: 1, y: 0 };
    const n = Math.hypot(dir.x, dir.y);
    if (n < 1e-9) return [];
    return [{ lambda, dir: { x: dir.x / n, y: dir.y / n } }];
  });
}

interface MatrixExplorerProps {
  /** 'eigen' met les directions propres au premier plan. */
  mode?: 'transform' | 'eigen';
}

/**
 * La matrice comme transformation du plan (façon 3Blue1Brown) :
 * on fait glisser les images de î et ĵ, la grille entière suit.
 */
export function MatrixExplorer({ mode = 'transform' }: MatrixExplorerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState<Mat>({ a: 1.4, b: 0.4, c: 0.3, d: 1.1 });
  const dragRef = useRef<'i' | 'j' | null>(null);

  const W = 560;
  const H = 360;
  const S = 70; // pixels par unité
  const cx = W / 2;
  const cy = H / 2;
  const px = (x: number) => cx + x * S;
  const py = (y: number) => cy - y * S;

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
    const colI = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colJ = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colEig = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colGrid = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const apply = (v: Vec): Vec => ({ x: m.a * v.x + m.c * v.y, y: m.b * v.x + m.d * v.y });

    ctx.clearRect(0, 0, W, H);

    // Grille d'origine, discrète
    ctx.strokeStyle = colGrid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let k = -6; k <= 6; k++) {
      ctx.beginPath();
      ctx.moveTo(px(k), 0);
      ctx.lineTo(px(k), H);
      ctx.moveTo(0, py(k));
      ctx.lineTo(W, py(k));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Grille transformée : images des droites x=k et y=k
    ctx.strokeStyle = colI;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    const EXT = 8;
    for (let k = -6; k <= 6; k++) {
      const p1 = apply({ x: k, y: -EXT });
      const p2 = apply({ x: k, y: EXT });
      ctx.beginPath();
      ctx.moveTo(px(p1.x), py(p1.y));
      ctx.lineTo(px(p2.x), py(p2.y));
      ctx.stroke();
      const q1 = apply({ x: -EXT, y: k });
      const q2 = apply({ x: EXT, y: k });
      ctx.beginPath();
      ctx.moveTo(px(q1.x), py(q1.y));
      ctx.lineTo(px(q2.x), py(q2.y));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Image du carré unité (le déterminant, en aire)
    const det = m.a * m.d - m.b * m.c;
    ctx.fillStyle = det >= 0 ? colI : colJ;
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(m.a), py(m.b));
    ctx.lineTo(px(m.a + m.c), py(m.b + m.d));
    ctx.lineTo(px(m.c), py(m.d));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    // Directions propres
    const eigs = eigen(m);
    if (mode === 'eigen' || eigs.length > 0) {
      ctx.setLineDash(mode === 'eigen' ? [] : [6, 6]);
      ctx.lineWidth = mode === 'eigen' ? 2.5 : 1.5;
      ctx.strokeStyle = colEig;
      for (const { lambda, dir } of eigs) {
        ctx.globalAlpha = mode === 'eigen' ? 0.9 : 0.55;
        ctx.beginPath();
        ctx.moveTo(px(-dir.x * 8), py(-dir.y * 8));
        ctx.lineTo(px(dir.x * 8), py(dir.y * 8));
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = colEig;
        ctx.font = '600 13px system-ui';
        ctx.fillText(`λ = ${lambda.toFixed(2)}`, px(dir.x * 1.9) + 6, py(dir.y * 1.9) - 6);
      }
      ctx.setLineDash([]);
    }

    // Flèches î et ĵ transformées + poignées
    const arrow = (to: Vec, color: string) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      ctx.lineTo(px(to.x), py(to.y));
      ctx.stroke();
      const a = Math.atan2(py(to.y) - cy, px(to.x) - cx);
      ctx.beginPath();
      ctx.moveTo(px(to.x), py(to.y));
      ctx.lineTo(px(to.x) - 11 * Math.cos(a - 0.42), py(to.y) - 11 * Math.sin(a - 0.42));
      ctx.lineTo(px(to.x) - 11 * Math.cos(a + 0.42), py(to.y) - 11 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(px(to.x), py(to.y), 7, 0, Math.PI * 2);
      ctx.fill();
    };
    arrow({ x: m.a, y: m.b }, colI);
    arrow({ x: m.c, y: m.d }, colJ);

    ctx.font = '600 14px system-ui';
    ctx.fillStyle = colI;
    ctx.fillText('M·î', px(m.a) + 10, py(m.b) - 10);
    ctx.fillStyle = colJ;
    ctx.fillText('M·ĵ', px(m.c) + 10, py(m.d) - 10);
    ctx.fillStyle = colText;
  }, [m, mode]);

  const pointerVec = (e: React.PointerEvent): Vec => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    return { x: (x - cx) / S, y: (cy - y) / S };
  };

  const onDown = (e: React.PointerEvent) => {
    const p = pointerVec(e);
    const di = Math.hypot(p.x - m.a, p.y - m.b);
    const dj = Math.hypot(p.x - m.c, p.y - m.d);
    if (Math.min(di, dj) > 0.35) return;
    dragRef.current = di <= dj ? 'i' : 'j';
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const p = pointerVec(e);
    const clamp = (t: number) => Math.max(-3.5, Math.min(3.5, t));
    if (dragRef.current === 'i') setM((prev) => ({ ...prev, a: clamp(p.x), b: clamp(p.y) }));
    else setM((prev) => ({ ...prev, c: clamp(p.x), d: clamp(p.y) }));
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const det = m.a * m.d - m.b * m.c;
  const eigs = eigen(m);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" className="btn" onClick={() => setM(p.m)}>
            {p.name}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p className="physics-caption">
        M = [{m.a.toFixed(1)}, {m.c.toFixed(1)} ; {m.b.toFixed(1)}, {m.d.toFixed(1)}]&ensp;·&ensp;
        dét = {det.toFixed(2)} (facteur d’aire{det < 0 ? ', orientation retournée' : ''})&ensp;·&ensp;
        {eigs.length > 0
          ? `${eigs.length} direction${eigs.length > 1 ? 's' : ''} propre${eigs.length > 1 ? 's' : ''} (en vert : elles ne tournent pas)`
          : 'aucune direction propre réelle : tout tourne (rotation)'}
        . Fais glisser M·î et M·ĵ.
      </p>
    </div>
  );
}
