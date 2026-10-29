import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import './physics.css';

/**
 * Le polynôme de Taylor en 0 qui « rampe » le long de la courbe : Pₙ a les
 * mêmes n premières dérivées que f en 0, et la zone où il colle à f s'étend
 * quand n grandit… sauf au-delà du rayon de convergence, où Pₙ explose.
 */

type FnKey = 'exp' | 'sin' | 'cos' | 'ln1p' | 'geom' | 'sqrt1p' | 'arctan';
interface Term {
  neg: boolean;
  t: string;
}
interface Spec {
  name: string;
  f: (x: number) => number;
  c: number[]; // coefficients exacts c₀ … c₂₀ (en flottants)
  term: (k: number) => Term | null; // écriture du terme cₖxᵏ
  win: [number, number, number, number]; // xMin, xMax, yMin, yMax
  x0: number;
  radius?: number; // rayon de convergence, s'il est fini
  pole?: number;
}

const NMAX = 20;
const W = 560;
const H = 320;
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n: number) => String(n).replace('-', '⁻').replace(/\d/g, (c) => SUP[Number(c)]);
const sub = (n: number) => String(n).replace(/\d/g, (c) => SUB[Number(c)]);
const fr = (x: number, d: number) => x.toFixed(d).replace('.', ',').replace('-', '−');
const fact = (k: number) => {
  let p = 1;
  for (let i = 2; i <= k; i++) p *= i;
  return p;
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const coefs = (g: (k: number) => number) => Array.from({ length: NMAX + 1 }, (_, k) => g(k));
const xp = (k: number) => (k === 0 ? '1' : k === 1 ? 'x' : 'x' + sup(k));
/** xᵏ/k!, avec k! écrit en clair jusqu'à 7! = 5040. */
const overFact = (k: number) => (k <= 1 ? xp(k) : `${xp(k)}/${k <= 7 ? fact(k) : `${k}!`}`);
const odd = (k: number) => k % 2 === 1;

/** C(1/2, k) en fraction exacte : c₀ = 1, cₖ₊₁ = cₖ · (1 − 2k) / (2(k + 1)). */
const HALF_BINOM: [number, number][] = [[1, 1]];
for (let k = 0; k < NMAX; k++) {
  const [p, q] = HALF_BINOM[k];
  const [np, nq] = [p * (1 - 2 * k), q * 2 * (k + 1)];
  const g = gcd(Math.abs(np), nq);
  HALF_BINOM.push([np / g, nq / g]);
}

const SPECS: Record<FnKey, Spec> = {
  exp: { name: 'eˣ', f: Math.exp, c: coefs((k) => 1 / fact(k)), term: (k) => ({ neg: false, t: overFact(k) }), win: [-6, 4, -3, 9], x0: 1.5 },
  sin: {
    name: 'sin x', f: Math.sin, x0: 2, win: [-8, 8, -2.5, 2.5],
    c: coefs((k) => (odd(k) ? (-1) ** ((k - 1) / 2) / fact(k) : 0)),
    term: (k) => (odd(k) ? { neg: ((k - 1) / 2) % 2 === 1, t: overFact(k) } : null),
  },
  cos: {
    name: 'cos x', f: Math.cos, x0: 2, win: [-8, 8, -2.5, 2.5],
    c: coefs((k) => (odd(k) ? 0 : (-1) ** (k / 2) / fact(k))),
    term: (k) => (odd(k) ? null : { neg: (k / 2) % 2 === 1, t: overFact(k) }),
  },
  ln1p: {
    name: 'ln(1 + x)', f: Math.log1p, x0: 0.5, win: [-2, 4, -4, 3], radius: 1,
    c: coefs((k) => (k === 0 ? 0 : (-1) ** (k + 1) / k)),
    term: (k) => (k === 0 ? null : { neg: k % 2 === 0, t: k === 1 ? 'x' : `${xp(k)}/${k}` }),
  },
  geom: { name: '1/(1 − x)', f: (x) => 1 / (1 - x), c: coefs(() => 1), term: (k) => ({ neg: false, t: xp(k) }), win: [-3, 3, -4, 6], x0: 0.5, radius: 1, pole: 1 },
  sqrt1p: {
    name: '√(1 + x)', f: (x) => Math.sqrt(1 + x), x0: 0.5, win: [-2, 4, -1.5, 3], radius: 1,
    c: coefs((k) => HALF_BINOM[k][0] / HALF_BINOM[k][1]),
    term: (k) => {
      const [p, q] = HALF_BINOM[k];
      const top = Math.abs(p) === 1 ? xp(k) : `${Math.abs(p)}${xp(k)}`;
      const den = q > 4096 ? '2' + sup(Math.log2(q)) : String(q); // q est toujours une puissance de 2
      return { neg: p < 0, t: q === 1 ? top : `${top}/${den}` };
    },
  },
  arctan: {
    name: 'arctan x', f: Math.atan, x0: 0.8, win: [-4, 4, -2.5, 2.5], radius: 1,
    c: coefs((k) => (odd(k) ? (-1) ** ((k - 1) / 2) / k : 0)),
    term: (k) => (odd(k) ? { neg: ((k - 1) / 2) % 2 === 1, t: k === 1 ? 'x' : `${xp(k)}/${k}` } : null),
  },
};

const evalP = (c: number[], n: number, x: number) => {
  let s = 0;
  for (let k = n; k >= 0; k--) s = s * x + c[k];
  return s;
};

/** « P₅(x) = 1 + x + x²/2 + … », tronqué au-delà de 6 termes non nuls. */
function polyText(spec: Spec, n: number): string {
  const terms: Term[] = [];
  for (let k = 0; k <= n; k++) {
    const tm = spec.term(k);
    if (tm) terms.push(tm);
  }
  const head = `P${sub(n)}(x) = `;
  if (!terms.length) return head + '0';
  const join = (tm: Term, i: number) => (i === 0 ? (tm.neg ? '−' : '') + tm.t : (tm.neg ? ' − ' : ' + ') + tm.t);
  if (terms.length <= 6) return head + terms.map(join).join('');
  const last = terms[terms.length - 1];
  const dots = terms.some((tm) => tm.neg) ? ' ± ⋯' : ' + ⋯';
  return head + terms.slice(0, 5).map(join).join('') + dots + join(last, 1);
}

/** Valeur lisible : notation scientifique si très petite ou très grande. */
function val(v: number): string {
  if (!Number.isFinite(v)) return 'non définie';
  if (v === 0) return '0';
  if (Math.abs(v) >= 1e5 || Math.abs(v) < 1e-3) {
    const [m, e] = v.toExponential(1).split('e');
    return `${fr(Number(m), 1)} × 10${sup(Number(e))}`;
  }
  return fr(v, 4);
}

export function TaylorExplorer({ fn = 'exp' }: { fn?: FnKey }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState<FnKey>(fn);
  const [n, setN] = useState(3);
  const [xs, setXs] = useState(SPECS[fn].x0);
  const dragRef = useRef(false);
  const spec = SPECS[key];

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
    const [cAcc, cOk, cWarn, cText, cDim, cBg] = [col('--accent', '#6a8dff'), col('--ok', '#4cc38a'), col('--warn', '#ffb454'), col('--text', '#e8eaf2'), col('--text-dim', '#9aa2bd'), col('--surface-2', '#222840')];
    const { f, c, win, radius, pole } = SPECS[key];
    const [xa, xb, ya, yb] = win;
    const px = (x: number) => ((x - xa) / (xb - xa)) * W;
    const py = (y: number) => H - ((y - ya) / (yb - ya)) * H;
    const span = yb - ya;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '12px system-ui';
    ctx.textAlign = 'center';

    if (radius !== undefined) {
      // Disque de convergence |x| < R : bande teintée, bords en pointillé.
      ctx.fillStyle = cAcc;
      ctx.globalAlpha = 0.08;
      ctx.fillRect(px(-radius), 0, px(radius) - px(-radius), H);
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = cAcc;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      for (const s of [-radius, radius]) {
        ctx.moveTo(px(s), 0);
        ctx.lineTo(px(s), H);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = cAcc;
      ctx.fillText('rayon de convergence', px(0), H - 8);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = cDim;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = cDim;
    const every = xb - xa > 10 ? 2 : 1;
    for (let k = Math.ceil(xa); k <= xb; k++) {
      ctx.fillRect(px(k) - 0.5, py(0) - 3, 1, 6);
      if (k !== 0 && k % every === 0) ctx.fillText(fr(k, 0), px(k), py(0) + 16);
    }

    const plot = (g: (x: number) => number, color: string, width: number, alpha: number, breakAt?: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= W; i += 1.5) {
        const x = xa + (i / W) * (xb - xa);
        const y = g(x);
        if (breakAt !== undefined && Math.abs(x - breakAt) < (1.5 * (xb - xa)) / W) pen = false;
        if (!Number.isFinite(y)) {
          pen = false;
          continue;
        }
        const Y = py(Math.max(ya - 2 * span, Math.min(yb + 2 * span, y)));
        if (pen) ctx.lineTo(i, Y);
        else ctx.moveTo(i, Y);
        pen = true;
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    plot(f, cDim, 4.5, 0.5, pole);
    plot((x) => evalP(c, n, x), cAcc, 2.4, 1);

    // Le point x : verticale, f(x) et Pₙ(x).
    const fx = f(xs);
    const pxv = evalP(c, n, xs);
    const clampY = (y: number) => Math.max(-10, Math.min(H + 10, py(y)));
    ctx.strokeStyle = cText;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(px(xs), py(0));
    ctx.lineTo(px(xs), clampY(pxv));
    if (Number.isFinite(fx)) ctx.lineTo(px(xs), clampY(fx));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    const dot = (y: number, color: string, rad: number) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(px(xs), y, rad, 0, 2 * Math.PI);
      ctx.fill();
    };
    if (Number.isFinite(fx)) dot(clampY(fx), cText, 4);
    dot(clampY(pxv), cAcc, 4);
    dot(py(0), cAcc, 7);

    // Lecture des valeurs.
    const err = Math.abs(fx - pxv);
    const rows: [string, string][] = [
      [`x = ${fr(xs, 2)}`, cText],
      [`f(x) = ${val(fx)}`, cText],
      [`P${sub(n)}(x) = ${val(pxv)}`, cAcc],
      [`|f − P${sub(n)}| = ${Number.isFinite(fx) ? val(err) : '—'}`, err < 0.01 ? cOk : cWarn],
    ];
    ctx.font = '600 13px system-ui';
    ctx.textAlign = 'left';
    const boxW = Math.max(...rows.map(([s]) => ctx.measureText(s).width)) + 16;
    ctx.fillStyle = cBg;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(8, 8, boxW, rows.length * 19 + 8);
    ctx.globalAlpha = 1;
    rows.forEach(([s, color], i) => {
      ctx.fillStyle = color;
      ctx.fillText(s, 16, 26 + i * 19);
    });
  }, [key, n, xs]);

  const onPointer = (e: RPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const X = (e.clientX - rect.left) * (W / rect.width);
    const [xa, xb] = spec.win;
    setXs(Math.max(xa, Math.min(xb, Math.round((xa + (X / W) * (xb - xa)) * 100) / 100)));
  };

  const outside = spec.radius !== undefined && Math.abs(xs) > spec.radius;
  const specific: Record<FnKey, string> = {
    exp: 'eˣ = 1 + x + x²/2! + x³/3! + … : les k! du dénominateur finissent par écraser n’importe quelle puissance de x — la série converge pour TOUT x, il faut juste plus de termes loin de 0.',
    sin:
      n === 0
        ? 'P₀(x) = 0 : rien que la valeur sin 0 = 0. Passe à n = 1 : la pente en 0 entre en jeu.'
        : n <= 2
        ? 'P₁(x) = x : c’est l’approximation des petits angles du pendule (sin θ ≈ θ) — excellente près de 0, fausse dès que l’angle grandit.'
        : 'Que des puissances impaires : sin est impaire. Monte n : la zone où Pₙ épouse sin s’élargit — avec n = 20, plus d’une période de chaque côté.',
    cos:
      n < 2
        ? 'Pₙ(x) = 1 : rien que la valeur cos 0 = 1 (la pente en 0 est nulle). Passe à n = 2 : la courbure du sommet entre en jeu.'
        : n <= 3
        ? 'P₂(x) = 1 − x²/2 : la parabole qui épouse le sommet. C’est pour ça qu’un pendule près du bas se comporte comme un ressort.'
        : 'Que des puissances paires : cos est paire. Chaque terme ajouté prolonge la zone où le polynôme suit la vague.',
    ln1p: 'ln(1 + x) = x − x²/2 + x³/3 − … : rayon 1, car ln(1 + x) explose en x = −1. Le rayon vaut des deux côtés : en x = 1 la série converge encore (lentement, vers ln 2), au-delà elle diverge.',
    geom: 'La série géométrique : 1 + x + x² + … = 1/(1 − x) seulement si |x| < 1. Le pôle en x = 1 fixe le rayon — et la série casse aussi en x = −1, où la fonction vaut pourtant tranquillement 1/2.',
    sqrt1p: 'Le binôme généralisé : √(1 + x) = 1 + x/2 − x²/8 + x³/16 − … P₁ = 1 + x/2 est l’approximation de tête : √1,02 ≈ 1,01. Rayon 1 : en x = −1, la racine a une tangente verticale.',
    arctan: 'La fonction est parfaitement lisse sur toute la droite… et pourtant la série casse en x = 1 : la raison est cachée dans les nombres complexes (un pôle en x = i, à distance 1 de 0). En x = 1 pile : π/4 = 1 − 1/3 + 1/5 − … (Leibniz).',
  };
  const lead = outside
    ? `x = ${fr(xs, 2)} est hors du rayon de convergence : augmente n et regarde Pₙ(x) s’envoler au lieu de s’approcher de f(x). `
    : 'Pₙ a les mêmes n premières dérivées que f en 0 : il colle à f près de 0, et la zone de contact s’étend quand n grandit. ';

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(SPECS) as FnKey[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${key === k ? 'btn-primary' : ''}`}
            onClick={() => {
              setKey(k);
              setXs(SPECS[k].x0);
            }}
          >
            {SPECS[k].name}
          </button>
        ))}
      </div>
      <div className="physics-controls">
        <label>
          degré n = {n}
          <input type="range" min={0} max={NMAX} value={n} onChange={(e) => setN(Number(e.target.value))} />
        </label>
      </div>
      <p className="physics-caption" style={{ color: 'var(--accent)', fontSize: '0.92rem', fontWeight: 600 }}>
        {polyText(spec, n)}
      </p>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'ew-resize' }}
        onPointerDown={(e) => {
          dragRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(e);
        }}
        onPointerMove={(e) => dragRef.current && onPointer(e)}
        onPointerUp={() => (dragRef.current = false)}
        onPointerCancel={() => (dragRef.current = false)}
      />
      <p className="physics-caption">
        En gris épais : f. En couleur : Pₙ. Fais glisser le point x sur l’axe. {lead}
        {specific[key]}
      </p>
    </div>
  );
}
