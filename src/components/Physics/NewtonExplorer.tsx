import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent } from 'react';
import './physics.css';

/**
 * La méthode de Newton : la tangente qui chasse la racine. On remplace la
 * courbe par sa tangente en xₙ, on résout l'équation de cette DROITE (facile)
 * et on recommence. Près de la racine, le nombre de décimales justes double à
 * chaque pas : la convergence quadratique se lit dans la colonne verte.
 */

type FnKey = 'sqrt2' | 'dottie' | 'newton';

interface NewtonFn {
  label: string;
  f: (x: number) => number;
  df: (x: number) => number;
  /** Racines exactes arrondies à 12 décimales (point décimal anglais). */
  roots: string[];
  x0: number;
  /** Fenêtre : xMin, xMax, yMin, yMax. */
  box: [number, number, number, number];
  story: string;
}

const FNS: Record<FnKey, NewtonFn> = {
  sqrt2: {
    label: 'x² − 2',
    f: (x) => x * x - 2,
    df: (x) => 2 * x,
    roots: ['1.414213562373', '-1.414213562373'],
    x0: 3,
    box: [-0.6, 3.6, -3, 10],
    story:
      'Ici, Newton s’écrit xₙ₊₁ = (xₙ + 2/xₙ)/2 : la vieille recette dite babylonienne. La tablette YBC 7289 (vers 1800 av. J.-C.) donne déjà √2 à un millionième près.',
  },
  dottie: {
    label: 'cos x − x',
    f: (x) => Math.cos(x) - x,
    df: (x) => -Math.sin(x) - 1,
    roots: ['0.739085133215'],
    x0: 2.5,
    box: [-2, 3.2, -4.5, 3],
    story:
      'La racine est le nombre de Dottie, 0,739085…, l’unique solution de cos x = x. Tape « cos » en boucle sur une calculatrice (en radians) : tu y arrives aussi… mais bien plus lentement.',
  },
  newton: {
    label: 'x³ − 2x − 5',
    f: (x) => x ** 3 - 2 * x - 5,
    df: (x) => 3 * x * x - 2,
    roots: ['2.094551481542'],
    x0: 3,
    box: [-1.5, 3.3, -9, 22],
    story:
      'C’est l’équation que Newton a lui-même traitée en 1669 (De analysi), en partant de x₀ = 2. Essaie x₀ = 2 : deux pas suffisent pour 4 décimales justes.',
  },
};

const W = 560;
const H = 300;
const STEP_MS = 900;
const MAX_ITERATES = 13;
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const sub = (n: number) => String(n).replace(/\d/g, (c) => SUB[Number(c)]);
const sup = (n: number) => String(n).replace('-', '⁻').replace(/\d/g, (c) => SUP[Number(c)]);
const fr = (x: number, d: number) => x.toFixed(d).replace('.', ',').replace('-', '−');

/** Écriture lisible d'un nombre éventuellement énorme. */
function loose(x: number): string {
  if (Math.abs(x) < 1e5) return fr(x, 3);
  const [m, e] = x.toExponential(2).split('e');
  return `${fr(Number(m), 2)} × 10${sup(Number(e))}`;
}

/** Nombre de décimales de x (affiché à 12 décimales) qui coïncident avec la racine la plus proche. */
function correctDecimals(x: number, roots: string[]): number {
  if (!Number.isFinite(x) || Math.abs(x) >= 1e6) return 0;
  const [si, sd] = x.toFixed(12).split('.');
  let best = 0;
  for (const root of roots) {
    const [ri, rd] = root.split('.');
    if (si !== ri) continue;
    let d = 0;
    while (d < 12 && sd[d] === rd[d]) d++;
    best = Math.max(best, d);
  }
  return best;
}

type Ctx = CanvasRenderingContext2D;
function seg(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, width = 1, dash: number[] = []) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}
function disc(ctx: Ctx, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();
}

const TD: CSSProperties = { padding: '0.1rem 0.6rem', textAlign: 'left' };

export function NewtonExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState<FnKey>('sqrt2');
  const [xs, setXs] = useState<number[]>([FNS.sqrt2.x0]);
  const [pending, setPending] = useState<number | null>(null); // itéré en cours d'animation
  const [stuck, setStuck] = useState(false);
  const dragRef = useRef(false);
  const fn = FNS[key];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(canvas);
    const col = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    const [cCurve, cTan, cIt, cText, cDim] = [col('--accent', '#6a8dff'), col('--warn', '#ffb454'), col('--ok', '#4cc38a'), col('--text', '#e8eaf2'), col('--text-dim', '#9aa2bd')];
    const { f, label, box } = FNS[key];
    const [xa, xb, ya, yb] = box;
    const px = (x: number) => ((x - xa) / (xb - xa)) * W;
    const py = (y: number) => Math.max(-60, Math.min(H + 60, H - ((y - ya) / (yb - ya)) * H));
    const segments: [number, number][] = xs.slice(0, -1).map((a, i) => [a, xs[i + 1]]);
    if (pending !== null) segments.push([xs[xs.length - 1], pending]);

    const draw = (progress: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.globalAlpha = 0.6;
      seg(ctx, 0, py(0), W, py(0), cDim);
      if (xa < 0 && xb > 0) seg(ctx, px(0), 0, px(0), H, cDim);
      ctx.globalAlpha = 1;
      ctx.fillStyle = cDim;
      for (let k = Math.ceil(xa); k <= xb; k++) {
        ctx.fillRect(px(k) - 0.5, py(0) - 3, 1, 6);
        if (k !== 0) ctx.fillText(fr(k, 0), px(k), py(0) + 16);
      }
      ctx.strokeStyle = cCurve; // la courbe
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= W; i += 2) {
        const y = py(f(xa + (i / W) * (xb - xa)));
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
      // Chaque pas : verticale jusqu'à la courbe, puis tangente jusqu'à l'axe.
      segments.forEach(([a, b], i) => {
        const isLast = i === segments.length - 1;
        const q = isLast && pending !== null ? progress : 1;
        const fa = f(a);
        ctx.globalAlpha = isLast ? 1 : 0.3;
        seg(ctx, px(a), py(0), px(a), py(fa * Math.min(1, q / 0.3)), cDim, 1.2, [4, 4]);
        if (q > 0.3) {
          const qt = (q - 0.3) / 0.7;
          // Si la tangente coupe l'axe hors champ, on l'arrête au bord (même pente).
          const bEnd = Math.max(xa - 1, Math.min(xb + 1, b));
          const yEnd = b === a ? 0 : fa * (1 - (bEnd - a) / (b - a));
          seg(ctx, px(a), py(fa), px(a + (bEnd - a) * qt), py(fa + (yEnd - fa) * qt), cTan, 2);
          disc(ctx, px(a), py(fa), 3.5, cTan);
        }
        ctx.globalAlpha = 1;
      });
      // Les itérés sur l'axe ; x₀ est la poignée.
      let lastLabel = -1e9;
      xs.forEach((x, i) => {
        if (x < xa || x > xb) return;
        disc(ctx, px(x), py(0), i === 0 ? 7 : 4, i === 0 ? cCurve : cIt);
        if (Math.abs(px(x) - lastLabel) > 18) {
          ctx.fillText('x' + sub(i), px(x), py(0) - 12);
          lastLabel = px(x);
        }
      });
      ctx.textAlign = 'left';
      ctx.font = '13px system-ui';
      ctx.fillStyle = cText;
      ctx.fillText(`f(x) = ${label}`, 10, 18);
      ctx.fillStyle = cTan;
      ctx.fillText('xₙ₊₁ = xₙ − f(xₙ) / f′(xₙ)', 10, 37);
    };

    if (pending === null) {
      draw(1);
      return;
    }
    const target = pending;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const p = Math.min(1, Math.max(0, performance.now() - t0) / STEP_MS);
      draw(p);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setXs((prev) => [...prev, target]);
        setPending(null);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [key, xs, pending]);

  const restart = (x0: number) => {
    setXs([x0]);
    setPending(null);
    setStuck(false);
  };

  const n = xs.length - 1;
  const last = xs[n];
  const digits = correctDecimals(last, fn.roots);
  const converged = digits >= 12 || (n > 0 && last === xs[n - 1]);

  const step = () => {
    const slope = fn.df(last);
    const next = last - fn.f(last) / slope;
    if (Math.abs(slope) < 1e-12 || !Number.isFinite(next)) setStuck(true);
    else setPending(next);
  };

  const setFromPointer = (e: RPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const X = (e.clientX - rect.left) * (W / rect.width);
    const [xa, xb] = fn.box;
    const x = Math.max(xa, Math.min(xb, xa + (X / W) * (xb - xa)));
    restart(Math.round(x * 100) / 100);
  };

  let caption: string;
  if (stuck) {
    caption = `f′(x${sub(n)}) = 0 : la tangente est horizontale, elle ne coupe jamais l’axe — Newton est bloqué. Déplace x₀.`;
  } else if (n === 0) {
    caption = `Fais glisser x₀ sur l’axe, puis « Un pas » : verticale jusqu’à la courbe, tangente jusqu’à l’axe. Trouver où une droite coupe l’axe, c’est facile — d’où la formule. ${fn.story}`;
  } else if (last < fn.box[0] || last > fn.box[1]) {
    caption = `La tangente était presque horizontale (f′ proche de 0) : elle a coupé l’axe très loin, en x ≈ ${loose(last)}. Newton n’est fiable que près de la racine — essaie un autre x₀.`;
  } else if (digits >= 12) {
    const seq = xs.map((x) => correctDecimals(x, fn.roots)).join(' → ');
    caption = `12 décimales justes en ${n} pas (${seq}) ! Regarde la barre verte : une fois près de la racine, le nombre de chiffres justes double à peu près à chaque pas. C’est la convergence quadratique : l’erreur suivante est de l’ordre du CARRÉ de l’erreur actuelle.`;
  } else {
    const before = correctDecimals(xs[n - 1], fn.roots);
    const pl = digits > 1 ? 's' : '';
    caption = `Pas ${n} : ${digits} décimale${pl} juste${pl} (avant : ${before}). Près de la racine, l’erreur est élevée au carré à chaque pas : 10⁻³ devient 10⁻⁶, puis 10⁻¹². Le nombre de chiffres justes double.`;
  }

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(FNS) as FnKey[]).map((k) => (
          <button key={k} type="button" className={`btn ${key === k ? 'btn-primary' : ''}`} onClick={() => { setKey(k); restart(FNS[k].x0); }}>
            {FNS[k].label}
          </button>
        ))}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'ew-resize' }}
        onPointerDown={(e) => {
          if (pending !== null) return;
          dragRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => dragRef.current && setFromPointer(e)}
        onPointerUp={() => (dragRef.current = false)}
        onPointerCancel={() => (dragRef.current = false)}
      />
      <div className="physics-controls">
        <button type="button" className="btn btn-primary" disabled={pending !== null || stuck || converged || xs.length >= MAX_ITERATES} onClick={step}>
          Un pas
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => restart(xs[0])}>
          Recommencer
        </button>
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', margin: '0.2rem 0 0.4rem' }}>
        <thead>
          <tr style={{ color: 'var(--text-dim)' }}>
            <th style={TD}>n</th>
            <th style={TD}>xₙ</th>
            <th style={TD}>décimales justes</th>
          </tr>
        </thead>
        <tbody>
          {xs.map((x, i) => {
            const d = correctDecimals(x, fn.roots);
            const s = Math.abs(x) >= 1e6 ? loose(x) : fr(x, 12);
            const cut = d > 0 ? s.indexOf(',') + 1 + d : 0; // la partie juste, en vert
            return (
              <tr key={i}>
                <td style={TD}>{i}</td>
                <td style={{ ...TD, fontFamily: 'ui-monospace, monospace' }}>
                  <span style={{ color: 'var(--ok)', fontWeight: 700 }}>{s.slice(0, cut)}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{s.slice(cut)}</span>
                </td>
                <td style={TD}>
                  <span style={{ display: 'inline-block', width: d * 8, height: 8, borderRadius: 2, background: 'var(--ok)', marginRight: 6 }} />
                  {d}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="physics-caption">{caption}</p>
    </div>
  );
}
