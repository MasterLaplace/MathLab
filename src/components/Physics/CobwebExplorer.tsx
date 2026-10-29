import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import './physics.css';

/**
 * Suites récurrentes uₙ₊₁ = f(uₙ), « la toile d'araignée » : verticale jusqu'à
 * la courbe, horizontale jusqu'à la diagonale, et on recommence. Le point fixe
 * ℓ est l'intersection courbe/diagonale ; |f′(ℓ)| < 1 l'attire, > 1 le repousse.
 * Mode « bifurcation » : la logistique r·x(1 − x) passe de l'ordre au chaos par
 * doublements de période de plus en plus serrés (Feigenbaum).
 */

type CobKey = 'cos' | 'sqrt' | 'heron' | 'logistic';
interface Rec {
  label: string;
  rec: string;
  f: (x: number, r: number) => number;
  df: (x: number, r: number) => number;
  fixed: (r: number) => number;
  lo: number; // fenêtre carrée [lo, hi]²
  hi: number;
  u0: number;
  uMin: number;
}

const RECS: Record<CobKey, Rec> = {
  cos: { label: 'cos x', rec: 'uₙ₊₁ = cos(uₙ)', f: (x) => Math.cos(x), df: (x) => -Math.sin(x), fixed: () => 0.7390851332151607, lo: -0.2, hi: 1.6, u0: 1.4, uMin: -0.2 },
  sqrt: { label: '√(2 + x)', rec: 'uₙ₊₁ = √(2 + uₙ)', f: (x) => Math.sqrt(2 + x), df: (x) => 0.5 / Math.sqrt(2 + x), fixed: () => 2, lo: -0.2, hi: 4.2, u0: 0, uMin: -0.2 },
  heron: { label: '(x + 2/x)/2', rec: 'uₙ₊₁ = (uₙ + 2/uₙ)/2', f: (x) => (x + 2 / x) / 2, df: (x) => (1 - 2 / (x * x)) / 2, fixed: () => Math.SQRT2, lo: 0, hi: 3.5, u0: 3.2, uMin: 0.2 },
  logistic: { label: 'logistique r·x(1 − x)', rec: 'uₙ₊₁ = r·uₙ(1 − uₙ)', f: (x, r) => r * x * (1 - x), df: (x, r) => r * (1 - 2 * x), fixed: (r) => 1 - 1 / r, lo: 0, hi: 1, u0: 0.2, uMin: 0 },
};

const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => String(n).replace(/\d/g, (c) => SUB[Number(c)]);
const fr = (x: number, d: number) => x.toFixed(d).replace('.', ',').replace('-', '−');
const nice = (v: number) => fr(v, 2).replace(/,?0+$/, '');

/** Seuils de doublement de période de la logistique (r₁ = 3, r₂ = 1 + √6, …) et leur limite r∞. */
const DOUBLINGS = [3, 3.44949, 3.54409, 3.564407, 3.568759, 3.569692];
const R_INF = 3.569946;

/** Nombre d'états du cycle attracteur de la logistique, ou null si chaos. */
function logisticPeriod(r: number): number | null {
  if (r < R_INF) {
    const i = DOUBLINGS.findIndex((b) => r < b);
    return 2 ** (i === -1 ? DOUBLINGS.length : i); // exact avant r∞ (théorie)
  }
  let x = 0.23456789;
  for (let k = 0; k < 20000; k++) x = r * x * (1 - x);
  const orb: number[] = [];
  for (let k = 0; k < 200; k++) orb.push((x = r * x * (1 - x)));
  for (let p = 1; p <= 64; p++) {
    if (orb.slice(0, 128).every((v, k) => Math.abs(orb[k + p] - v) < 1e-7)) return p;
  }
  return null;
}

function orbitOf(rec: Rec, r: number, u0: number, steps: number): number[] {
  const orb = [u0];
  for (let k = 0; k < steps; k++) {
    const v = rec.f(orb[k], r);
    if (!Number.isFinite(v)) break;
    orb.push(v);
  }
  return orb;
}

type Ctx = CanvasRenderingContext2D;
function prepare(canvas: HTMLCanvasElement, w: number, h: number) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '12px system-ui';
  const css = getComputedStyle(canvas);
  return { ctx, dpr, col: (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback };
}
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
function label(ctx: Ctx, s: string, x: number, y: number, color: string, align: CanvasTextAlign = 'left') {
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(s, x, y);
}

export function CobwebExplorer({ mode = 'cobweb' }: { mode?: 'cobweb' | 'bifurcation' }) {
  return mode === 'bifurcation' ? <Bifurcation /> : <Cobweb />;
}

/* ───────────── La toile d'araignée ───────────── */

const CW = 560;
const CH = 448;
const S = 290; // côté du carré de la toile
const SX = 44;
const SY = 12;
const TY0 = 340; // chronogramme uₙ en fonction de n
const TY1 = 424;
const MAX_STEPS = 200;

function Cobweb() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [key, setKey] = useState<CobKey>('cos');
  const [r, setR] = useState(3.2);
  const [u0, setU0] = useState(RECS.cos.u0);
  const [steps, setSteps] = useState(0);
  const [target, setTarget] = useState(0); // « 30 pas » : on tisse jusqu'à target
  const lastStepAt = useRef(0);
  const dragRef = useRef(false);
  const rec = RECS[key];

  useEffect(() => {
    if (steps >= target) return;
    const id = setTimeout(() => {
      lastStepAt.current = performance.now();
      setSteps(steps + 1);
    }, 80);
    return () => clearTimeout(id);
  }, [steps, target]);

  useEffect(() => {
    const prep = canvasRef.current && prepare(canvasRef.current, CW, CH);
    if (!prep) return;
    const { ctx, col } = prep;
    const [cAcc, cWeb, cOk, cText, cDim, cBorder] = [col('--accent', '#6a8dff'), col('--warn', '#ffb454'), col('--ok', '#4cc38a'), col('--text', '#e8eaf2'), col('--text-dim', '#9aa2bd'), col('--border', '#2e3550')];
    const R = RECS[key];
    const { lo, hi } = R;
    const orb = orbitOf(R, r, u0, steps);
    const n = orb.length - 1;
    const ell = R.fixed(r);
    const slope = R.df(ell, r);
    const showEll = ell >= lo && ell <= hi;
    const sx = (x: number) => SX + ((x - lo) / (hi - lo)) * S;
    const sy = (y: number) => SY + S - ((y - lo) / (hi - lo)) * S;
    const cl = (v: number) => Math.max(-1000, Math.min(2000, v));
    const base = lo <= 0 ? 0 : lo; // la droite où vit u₀
    const dur = target > steps ? 70 : 280;

    const draw = (p: number) => {
      ctx.clearRect(0, 0, CW, CH);
      ctx.strokeStyle = cBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(SX, SY, S, S);
      ctx.globalAlpha = 0.5;
      seg(ctx, SX, sy(base), SX + S, sy(base), cDim);
      if (lo < 0) seg(ctx, sx(0), SY, sx(0), SY + S, cDim);
      ctx.globalAlpha = 1;
      const tick = hi - lo >= 3 ? 1 : hi - lo >= 1.5 ? 0.5 : 0.25;
      for (let v = Math.ceil(lo / tick) * tick; v <= hi + 1e-9; v += tick) {
        label(ctx, nice(v), sx(v), SY + S + 15, cDim, 'center');
        label(ctx, nice(v), SX - 5, sy(v) + 4, cDim, 'right');
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(SX, SY, S, S);
      ctx.clip();
      seg(ctx, sx(lo), sy(lo), sx(hi), sy(hi), cDim, 1.2); // diagonale y = x
      ctx.strokeStyle = cAcc; // courbe y = f(x)
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let pen = false;
      for (let i = 0; i <= S; i += 1.5) {
        const y = R.f(lo + (i / S) * (hi - lo), r);
        if (!Number.isFinite(y)) {
          pen = false;
          continue;
        }
        if (pen) ctx.lineTo(SX + i, cl(sy(y)));
        else ctx.moveTo(SX + i, cl(sy(y)));
        pen = true;
      }
      ctx.stroke();
      // La toile : verticale jusqu'à la courbe, puis horizontale jusqu'à la diagonale.
      for (let k = 0; k < n; k++) {
        const q = k === n - 1 ? p : 1;
        const [a, b] = [orb[k], orb[k + 1]];
        const y0 = k === 0 ? base : a;
        const qh = Math.max(0, q * 2 - 1);
        ctx.globalAlpha = Math.max(0.2, 1 - (n - 1 - k) / 40);
        seg(ctx, cl(sx(a)), cl(sy(y0)), cl(sx(a)), cl(sy(y0 + (b - y0) * Math.min(1, q * 2))), cWeb, 1.6);
        if (qh > 0) seg(ctx, cl(sx(a)), cl(sy(b)), cl(sx(a + (b - a) * qh)), cl(sy(b)), cWeb, 1.6);
      }
      ctx.globalAlpha = 1;
      if (Math.abs(slope) < 1) disc(ctx, sx(ell), sy(ell), 5, cOk);
      else {
        ctx.strokeStyle = cText; // point fixe répulsif : cercle vide
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sx(ell), sy(ell), 6, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
      disc(ctx, sx(u0), sy(base), 7, cAcc); // poignée u₀
      label(ctx, 'u₀', sx(u0) + 9, sy(base) - 8, cAcc);

      // Panneau des valeurs.
      let y = 26;
      const line = (s: string, color: string, font = '13px system-ui') => {
        ctx.font = font;
        label(ctx, s, SX + S + 22, y, color);
        y += 19;
      };
      line(R.rec, cText, '600 14px system-ui');
      if (key === 'logistic') line(`r = ${fr(r, 3)}`, cText);
      y += 6;
      for (let k = Math.max(0, n - 8); k <= n; k++) line(`u${sub(k)} = ${fr(orb[k], 6)}`, k === 0 ? cAcc : cWeb);
      if (n > 8) line('(dernières valeurs)', cDim, '12px system-ui');
      y += 8;
      if (showEll) line(`ℓ ≈ ${fr(ell, 6)}`, Math.abs(slope) < 1 ? cOk : cText, '600 13px system-ui');
      line(`f′(ℓ) ≈ ${fr(slope, 3)}`, cDim);

      // Chronogramme : uₙ en fonction de n.
      const N = Math.max(30, n);
      const tX = (k: number) => SX + (k / N) * (CW - 14 - SX);
      const tY = (v: number) => TY1 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (TY1 - TY0);
      ctx.strokeStyle = cBorder;
      ctx.lineWidth = 1;
      ctx.strokeRect(SX, TY0, CW - 14 - SX, TY1 - TY0);
      ctx.font = '12px system-ui';
      label(ctx, 'uₙ', 8, TY0 + 12, cDim);
      label(ctx, `n = ${N}`, CW - 14, TY1 + 14, cDim, 'right');
      if (showEll) seg(ctx, SX, tY(ell), CW - 14, tY(ell), cOk, 1, [4, 4]);
      const shown = p < 1 ? n - 1 : n;
      ctx.globalAlpha = 0.45;
      for (let k = 1; k <= shown; k++) seg(ctx, tX(k - 1), tY(orb[k - 1]), tX(k), tY(orb[k]), cWeb);
      ctx.globalAlpha = 1;
      for (let k = 0; k <= shown; k++) disc(ctx, tX(k), tY(orb[k]), N > 60 ? 1.6 : 2.6, cWeb);
    };

    let raf = 0;
    const tick = () => {
      const p = Math.min(1, (performance.now() - lastStepAt.current) / dur);
      draw(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [key, r, u0, steps, target]);

  const onPointer = (e: RPointerEvent<HTMLCanvasElement>, start: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const X = (e.clientX - rect.left) * (CW / rect.width);
    const Y = (e.clientY - rect.top) * (CH / rect.height);
    if (start) {
      if (X < SX - 12 || X > SX + S + 12 || Y > SY + S + 20) return;
      dragRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (!dragRef.current) return;
    const v = rec.lo + ((X - SX) / S) * (rec.hi - rec.lo);
    setU0(Math.max(rec.uMin, Math.min(rec.hi, Math.round(v * 1000) / 1000)));
  };

  const restart = () => {
    setSteps(0);
    setTarget(0);
  };
  const ell = rec.fixed(r);
  const s = rec.df(ell, r);
  const period = logisticPeriod(r);
  let caption = `Le point fixe ℓ ≈ ${fr(ell, 4)} est l’intersection de la courbe et de la diagonale : f(ℓ) = ℓ, la suite n’en bouge plus. `;
  if (key === 'heron') {
    caption += 'Ici f′(ℓ) = 0 : point fixe « superattractif », la toile s’écrase sur ℓ en trois ou quatre pas. Héron, c’est exactement Newton appliqué à x² − 2 : les décimales justes doublent à chaque pas.';
  } else if (Math.abs(s) < 1) {
    caption +=
      s > 0
        ? `f′(ℓ) ≈ ${fr(s, 2)} > 0 : la toile converge en ESCALIER, toujours du même côté de ℓ. |f′(ℓ)| < 1 : ℓ attire, l’écart est multiplié par ≈ ${fr(s, 2)} à chaque pas.`
        : `f′(ℓ) ≈ ${fr(s, 2)} < 0 : la toile tourne en SPIRALE autour de ℓ, une fois au-dessus, une fois en dessous. |f′(ℓ)| < 1 : ℓ attire.`;
    if (key === 'logistic') caption += ' Logistique avec r < 3 : la population se stabilise.';
  } else if (Math.abs(Math.abs(s) - 1) < 1e-9) {
    caption += '|f′(ℓ)| = 1 tout juste : cas limite, la toile spirale de plus en plus lentement. C’est le seuil exact de la première bifurcation.';
  } else {
    const fate =
      period === 2 ? 'se referme sur un rectangle — un cycle de 2 (vers r ≈ 3,2).'
      : period === 4 ? 'se referme en un cycle de 4 (vers r ≈ 3,5).'
      : period ? `se referme en un cycle de ${period}.`
      : 'ne se referme jamais : c’est le chaos (r > 3,57). Déplace u₀ d’un cheveu : toute la suite change.';
    caption += `|f′(ℓ)| = |2 − r| ≈ ${fr(Math.abs(s), 2)} > 1 : ℓ REPOUSSE (cercle vide) ! Lance « 30 pas » : la toile s’en éloigne et ${fate}`;
  }

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(RECS) as CobKey[]).map((k) => (
          <button key={k} type="button" className={`btn ${key === k ? 'btn-primary' : ''}`} onClick={() => { setKey(k); setU0(RECS[k].u0); restart(); }}>
            {RECS[k].label}
          </button>
        ))}
        {key === 'logistic' && (
          <label>
            r = {fr(r, 3)}
            <input type="range" min={2.5} max={4} step={0.005} value={r} onChange={(e) => setR(Number(e.target.value))} />
          </label>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: CW, height: CH, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={(e) => onPointer(e, true)}
        onPointerMove={(e) => onPointer(e, false)}
        onPointerUp={() => (dragRef.current = false)}
        onPointerCancel={() => (dragRef.current = false)}
      />
      <div className="physics-controls">
        <button
          type="button"
          className="btn btn-primary"
          disabled={steps >= MAX_STEPS}
          onClick={() => {
            const next = Math.min(MAX_STEPS, target + 1);
            lastStepAt.current = performance.now();
            setSteps(next);
            setTarget(next);
          }}
        >
          Un pas
        </button>
        <button type="button" className="btn" disabled={target >= MAX_STEPS} onClick={() => setTarget(Math.min(MAX_STEPS, target + 30))}>
          30 pas
        </button>
        <button type="button" className="btn btn-ghost" onClick={restart}>
          Recommencer
        </button>
      </div>
      <p className="physics-caption">{caption}</p>
    </div>
  );
}

/* ───────────── Le diagramme de bifurcation ───────────── */

const BW = 560;
const BH = 360;
const BL = 40;
const BT = 22;
const PW = BW - BL - 12;
const PH = BH - BT - 30;
const R0 = 2.5;
const R1 = 4;
const rx = (r: number) => BL + ((r - R0) / (R1 - R0)) * PW;
const vy = (x: number) => BT + (1 - x) * PH;

/** Masque d'opacité : 300 itérations de transitoire puis 150 points par colonne de pixels. */
function buildMask(cols: number, rows: number): ImageData {
  const img = new ImageData(cols, rows);
  const hits = new Uint16Array(cols * rows);
  for (let c = 0; c < cols; c++) {
    const r = R0 + ((c + 0.5) / cols) * (R1 - R0);
    let x = 0.23456789;
    for (let k = 0; k < 300; k++) x = r * x * (1 - x);
    for (let k = 0; k < 150; k++) {
      x = r * x * (1 - x);
      hits[Math.min(rows - 1, Math.max(0, Math.floor((1 - x) * rows))) * cols + c]++;
    }
  }
  for (let i = 0; i < hits.length; i++) if (hits[i]) img.data[i * 4 + 3] = Math.round(255 * (1 - 0.6 ** hits[i]));
  return img;
}

function Bifurcation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cacheRef = useRef<{ key: string; img: HTMLCanvasElement } | null>(null);
  const [rc, setRc] = useState(3.2);
  const dragRef = useRef(false);

  useEffect(() => {
    const prep = canvasRef.current && prepare(canvasRef.current, BW, BH);
    if (!prep) return;
    const { ctx, dpr, col } = prep;
    const [cAcc, cWarn, cText, cDim, cBorder, cBg] = [col('--accent', '#6a8dff'), col('--warn', '#ffb454'), col('--text', '#e8eaf2'), col('--text-dim', '#9aa2bd'), col('--border', '#2e3550'), col('--surface-2', '#222840')];
    const cacheKey = `${dpr}|${cAcc}`;
    if (cacheRef.current?.key !== cacheKey) {
      // Calculé une seule fois (par densité d'écran et couleur de thème), puis réutilisé.
      const off = document.createElement('canvas');
      off.width = Math.round(PW * dpr);
      off.height = Math.round(PH * dpr);
      const octx = off.getContext('2d');
      if (!octx) return;
      octx.putImageData(buildMask(off.width, off.height), 0, 0);
      octx.globalCompositeOperation = 'source-in'; // teinte le masque à la couleur d'accent
      octx.fillStyle = cAcc;
      octx.fillRect(0, 0, off.width, off.height);
      cacheRef.current = { key: cacheKey, img: off };
    }
    ctx.clearRect(0, 0, BW, BH);
    ctx.drawImage(cacheRef.current.img, BL, BT, PW, PH);
    ctx.strokeStyle = cBorder;
    ctx.strokeRect(BL, BT, PW, PH);
    for (const r of [2.5, 3, 3.5, 4]) label(ctx, nice(r), rx(r), BT + PH + 16, cDim, 'center');
    label(ctx, 'r', BL + PW - 6, BT + PH + 28, cDim, 'center');
    for (const x of [0, 0.5, 1]) label(ctx, nice(x), BL - 6, vy(x) + 4, cDim, 'right');
    label(ctx, 'x', BL - 6, BT + PH / 2 - 24, cDim, 'right');
    // Repères : doublements r₁ = 3, r₂ = 1 + √6, r₃, r∞ et fenêtre de période 3 (1 + √8).
    ctx.globalAlpha = 0.35;
    for (const r of [3, 3.44949, 3.54409, R_INF, 1 + Math.sqrt(8)]) seg(ctx, rx(r), BT, rx(r), BT + PH, cDim, 1, [3, 4]);
    ctx.globalAlpha = 1;
    for (const [r, s] of [[2.75, '1'], [3.2247, '2'], [3.4968, '4'], [3.835, 'période 3']] as const) label(ctx, s, rx(r), BT - 7, cDim, 'center');
    label(ctx, 'chaos →', rx(R_INF) + 3, BT - 7, cDim);
    // Curseur r et les états de l'attracteur.
    const X = rx(rc);
    seg(ctx, X, BT, X, BT + PH, cAcc, 1.5);
    let x = 0.23456789;
    for (let k = 0; k < 3000; k++) x = rc * x * (1 - x);
    for (let k = 0; k < 64; k++) disc(ctx, X, vy((x = rc * x * (1 - x))), 3, cWarn);
    disc(ctx, X, BT + PH, 7, cAcc);
    const p = logisticPeriod(rc);
    const text = `r = ${fr(rc, 4)} · ${p === 1 ? '1 état' : p ? `cycle de ${p}` : 'chaos'}`;
    ctx.font = '600 13px system-ui';
    const w = ctx.measureText(text).width + 12;
    const lx = X + w + 8 < BL + PW ? X + 6 : X - w - 6;
    ctx.fillStyle = cBg;
    ctx.globalAlpha = 0.9;
    ctx.fillRect(lx, BT + PH - 48, w, 22);
    ctx.globalAlpha = 1;
    label(ctx, text, lx + 6, BT + PH - 32, cText);
  }, [rc]);

  const onPointer = (e: RPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const r = R0 + (((e.clientX - rect.left) * (BW / rect.width) - BL) / PW) * (R1 - R0);
    setRc(Math.max(R0, Math.min(R1, Math.round(r * 10000) / 10000)));
  };

  const p = logisticPeriod(rc);
  let caption: string;
  if (p === 1) caption = `Un seul état : la population se stabilise sur ℓ = 1 − 1/r ≈ ${fr(1 - 1 / rc, 3)}. Glisse le curseur vers la droite…`;
  else if (p === 2) caption = 'Cycle de 2 : la population alterne entre deux valeurs. En r = 3, le point fixe est devenu répulsif (|f′(ℓ)| = |2 − r| > 1) et la branche s’est dédoublée.';
  else if (p === 4 && rc < R_INF) caption = 'Cycle de 4 : chaque branche s’est dédoublée à nouveau, en r = 1 + √6 ≈ 3,449. Et ça recommence, de plus en plus vite…';
  else if (p && rc < R_INF)
    caption = `Cycle de ${p} : les doublements se resserrent, chaque intervalle environ 4,669 fois plus court que le précédent. Ce rapport δ ≈ 4,669 (Feigenbaum, 1978) est le même pour TOUTE bosse à sommet arrondi : une constante universelle, comme π. Les doublements s’accumulent en r∞ ≈ 3,5699.`;
  else if (p === 3)
    caption = 'Fenêtre de période 3 (dès r = 1 + √8 ≈ 3,828) : au cœur du chaos, l’ordre revient ! Li et Yorke (1975) : « période trois implique le chaos » — un cycle de 3 force l’existence de cycles de toutes les périodes.';
  else if (p) caption = `Fenêtre périodique : un cycle de ${p} au milieu du chaos. Le diagramme en contient une infinité, chacune abritant une copie miniature du diagramme entier.`;
  else caption = 'Chaos (r > 3,5699…) : aucun cycle, l’orbite ne se répète jamais et deux départs voisins finissent par diverger. Repère les bandes vides : ce sont des fenêtres périodiques — la plus large, vers r ≈ 3,83, a la période 3.';

  return (
    <div className="physics-sim">
      <canvas
        ref={canvasRef}
        style={{ width: BW, height: BH, maxWidth: '100%', touchAction: 'none', cursor: 'ew-resize' }}
        onPointerDown={(e) => {
          dragRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(e);
        }}
        onPointerMove={(e) => dragRef.current && onPointer(e)}
        onPointerUp={() => (dragRef.current = false)}
        onPointerCancel={() => (dragRef.current = false)}
      />
      <p className="physics-caption">{caption}</p>
    </div>
  );
}
