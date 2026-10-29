import { useEffect, useRef, useState, type ReactNode } from 'react';
import './physics.css';

/**
 * Les transformations de courbes, à la main : y = k·f(x − a) + b se lit en
 * attrapant la courbe (a, b) et en l'étirant (k) — avec le piège du signe :
 * f(x − a) part vers la DROITE. Mode « inverse » : la réciproque est le miroir
 * de f par rapport à y = x, chaque point (x ; y) glissant vers (y ; x).
 */

type Ctx = CanvasRenderingContext2D;
type V2 = [number, number];
type Pal = Record<'accent' | 'ok' | 'warn' | 'text' | 'dim' | 'border' | 'bg', string>;
type PEvent = React.PointerEvent<HTMLCanvasElement>;

const W = 560;
const H = 360;
const U = 40; // px par unité, identique sur les deux axes (indispensable pour le miroir)
const CX = W / 2;
const CY = H / 2;

const sx = (x: number) => CX + x * U;
const sy = (y: number) => CY - y * U;
const fr = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',').replace('-', '−');
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const sqrt0 = (x: number) => (x < -1e-9 ? NaN : Math.sqrt(Math.max(0, x))); // √ tolérante aux arrondis en 0

function setupCanvas(canvas: HTMLCanvasElement): [Ctx, Pal] | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(canvas);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return [ctx, { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'),
    text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd'), border: v('--border', '#2e3550'),
    bg: v('--surface-2', '#222840') }];
}

const toCanvas = (e: PEvent): V2 => {
  const r = e.currentTarget.getBoundingClientRect();
  return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
};

/** Quadrillage léger + axes gradués (une unité = U px). */
function axes(ctx: Ctx, p: Pal) {
  ctx.save();
  Object.assign(ctx, { strokeStyle: p.border, lineWidth: 1, globalAlpha: 0.7 });
  ctx.beginPath();
  for (let i = -7; i <= 7; i++) ctx.rect(sx(i), 0, 0, H);
  for (let j = -4; j <= 4; j++) ctx.rect(0, sy(j), W, 0);
  ctx.stroke();
  Object.assign(ctx, { strokeStyle: p.dim, globalAlpha: 1, lineWidth: 1.2 });
  ctx.beginPath();
  ctx.rect(0, CY, W, 0);
  ctx.rect(CX, 0, 0, H);
  ctx.stroke();
  Object.assign(ctx, { fillStyle: p.dim, font: '12px system-ui', textAlign: 'center', textBaseline: 'top' });
  for (let i = -6; i <= 6; i++) if (i) ctx.fillText(fr(i), sx(i), CY + 4);
  Object.assign(ctx, { textAlign: 'right', textBaseline: 'middle' });
  for (let j = -4; j <= 4; j++) if (j) ctx.fillText(fr(j), CX - 5, sy(j));
  ctx.restore();
}

/** Courbe paramétrée t ↦ (x, y) ; on lève le crayon hors du domaine ou très loin du cadre. */
function plot(ctx: Ctx, pt: (t: number) => V2, t0: number, t1: number, color: string, width: number, dash: number[] = [], alpha = 1) {
  ctx.save();
  Object.assign(ctx, { strokeStyle: color, lineWidth: width, globalAlpha: alpha, lineJoin: 'round' });
  ctx.setLineDash(dash);
  ctx.beginPath();
  let pen = false;
  for (let i = 0; i <= 800; i++) {
    const [x, y] = pt(t0 + ((t1 - t0) * i) / 800);
    const ok = Number.isFinite(x) && Number.isFinite(y) && Math.abs(x) < 30 && Math.abs(y) < 30;
    if (ok && pen) ctx.lineTo(sx(x), sy(y));
    else if (ok) ctx.moveTo(sx(x), sy(y));
    pen = ok;
  }
  ctx.stroke();
  ctx.restore();
}

function handle(ctx: Ctx, x: number, y: number, color: string, r = 7) {
  ctx.save();
  ctx.fillStyle = color;
  for (const [rad, alpha] of [[r + 6, 0.25], [r, 1]]) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Étiquette sur une pastille du fond : lisible même posée sur une courbe ou une graduation. */
function pill(ctx: Ctx, p: Pal, text: string, x: number, y: number, color: string, align: CanvasTextAlign = 'center') {
  Object.assign(ctx, { font: '600 13px system-ui', textAlign: align, textBaseline: 'middle' });
  const w = ctx.measureText(text).width;
  const left = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  ctx.save();
  Object.assign(ctx, { fillStyle: p.bg, globalAlpha: 0.85 });
  ctx.fillRect(left - 3, y - 9, w + 6, 18);
  ctx.restore();
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Flèche pointillée (unités) avec son étiquette, décalée de (dx, dy) px. */
function arrow(ctx: Ctx, p: Pal, from: V2, to: V2, color: string, text: string, dx: number, dy: number) {
  const [x0, y0, x1, y1] = [sx(from[0]), sy(from[1]), sx(to[0]), sy(to[1])];
  const ang = Math.atan2(y1 - y0, x1 - x0);
  ctx.save();
  Object.assign(ctx, { strokeStyle: color, fillStyle: color, lineWidth: 2 });
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - 9 * Math.cos(ang - 0.45), y1 - 9 * Math.sin(ang - 0.45));
  ctx.lineTo(x1 - 9 * Math.cos(ang + 0.45), y1 - 9 * Math.sin(ang + 0.45));
  ctx.fill();
  pill(ctx, p, text, (x0 + x1) / 2 + dx, (y0 + y1) / 2 + dy, color);
  ctx.restore();
}

// ————————————————————————— Transformations —————————————————————————

type Fn = 'sq' | 'sin' | 'abs' | 'exp' | 'sqrt';
/** key : le point remarquable qu'on attrape ; core : l'écriture de f(intérieur). */
const FNS: Record<Fn, { name: ReactNode; f: (x: number) => number; key: V2; core: (inner: string, bare: boolean) => ReactNode }> = {
  sq: { name: 'x²', f: (x) => x * x, key: [0, 0], core: (i, bare) => (bare ? 'x²' : `(${i})²`) },
  sin: { name: 'sin x', f: Math.sin, key: [0, 0], core: (i, bare) => (bare ? 'sin x' : `sin(${i})`) },
  abs: { name: '|x|', f: Math.abs, key: [0, 0], core: (i) => `|${i}|` },
  exp: { name: <>e<sup>x</sup></>, f: Math.exp, key: [0, 1], core: (i) => <>e<sup>{i}</sup></> },
  sqrt: { name: '√x', f: sqrt0, key: [0, 0], core: (i, bare) => (bare ? '√x' : `√(${i})`) },
};

function drawTransform(ctx: Ctx, p: Pal, fn: Fn, a: number, b: number, k: number) {
  ctx.clearRect(0, 0, W, H);
  axes(ctx, p);
  const { f, key } = FNS[fn];
  plot(ctx, (t) => [t, f(t)], -7, 7, p.dim, 1.6, [6, 5], 0.8);
  plot(ctx, (t) => [t, k * f(t - a) + b], -7, 7, p.accent, 2.8);
  // Du point remarquable d'origine à la poignée : d'abord a (horizontal), puis b (vertical).
  const y0 = k * key[1];
  ctx.save();
  Object.assign(ctx, { strokeStyle: p.dim, lineWidth: 1.5 });
  ctx.beginPath();
  ctx.arc(sx(key[0]), sy(key[1]), 5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // eˣ : le point remarquable (0 ; 1) est d'abord étiré à (0 ; k).
  if (key[1] !== 0 && k !== 1) arrow(ctx, p, key, [key[0], y0], p.text, `×${fr(k)}`, a > 0 ? -28 : 28, 0);
  if (a !== 0) arrow(ctx, p, [key[0], y0], [key[0] + a, y0], p.ok, `a = ${fr(a)}`, 0, -14);
  if (b !== 0) arrow(ctx, p, [key[0] + a, y0], [key[0] + a, y0 + b], p.warn, `b = ${fr(b)}`, a >= 0 ? 32 : -32, 0);
  handle(ctx, sx(key[0] + a), sy(y0 + b), p.accent);
}

function TransformView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fn, setFn] = useState<Fn>('sq');
  const [a, setA] = useState(0);
  const [b, setB] = useState(0);
  const [k, setK] = useState(1);
  const dragging = useRef(false);

  useEffect(() => {
    const setup = canvasRef.current && setupCanvas(canvasRef.current);
    if (setup) drawTransform(setup[0], setup[1], fn, a, b, k);
  }, [fn, a, b, k]);

  const key = FNS[fn].key;
  const near = ([x, y]: V2) => Math.hypot(x - sx(key[0] + a), y - sy(k * key[1] + b)) < 16;
  const onDown = (e: PEvent) => {
    if (!near(toCanvas(e))) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onMove = (e: PEvent) => {
    const [px, py] = toCanvas(e);
    if (!dragging.current) {
      e.currentTarget.style.cursor = near([px, py]) ? 'grab' : 'default';
      return;
    }
    // La poignée suit la souris : on en déduit a et b (au demi-pas près).
    setA(clamp(Math.round(((px - CX) / U - key[0]) * 2) / 2, -4, 4));
    setB(clamp(Math.round(((CY - py) / U - k * key[1]) * 2) / 2, -3, 3));
  };
  const onUp = (e: PEvent) => {
    dragging.current = false;
    e.currentTarget.style.cursor = 'default';
  };

  const inner = a === 0 ? 'x' : a > 0 ? `x − ${fr(a)}` : `x + ${fr(-a)}`;
  const bPart = b === 0 ? '' : b > 0 ? ` + ${fr(b)}` : ` − ${fr(-b)}`;
  const kPart = k === 1 ? '' : k === -1 ? '−' : `${fr(k)}·`;
  const coef = k === 1 ? '' : k === -1 ? '−' : fr(k) + (fn === 'sin' ? ' ' : '');
  const concrete = k === 0 ? fr(b) : <>{coef}{FNS[fn].core(inner, a === 0)}{bPart}</>;

  const moves: string[] = [];
  if (a !== 0) moves.push(`décalée de ${fr(Math.abs(a))} vers la ${a > 0 ? 'DROITE' : 'gauche'}`);
  if (k === 0) moves.push('écrasée sur la droite y = b');
  if (k < 0) moves.push('retournée (miroir par rapport à l’axe des x)');
  if (Math.abs(k) > 1) moves.push(`étirée verticalement ×${fr(Math.abs(k))}`);
  if (k !== 0 && Math.abs(k) < 1) moves.push(`tassée verticalement ×${fr(Math.abs(k))}`);
  if (b !== 0) moves.push(`${b > 0 ? 'montée' : 'descendue'} de ${fr(Math.abs(b))}`);
  const lead = moves.length ? `La courbe est ${moves.join(', ')}.` : 'Pour l’instant y = f(x) : rien n’a bougé. Attrape le point et glisse-le !';
  const trap = a !== 0
    ? ` Piège : on lit « ${inner} » et pourtant la courbe part vers la ${a > 0 ? 'droite' : 'gauche'}. Le signe trompe : pour retrouver f(0), il faut ${inner} = 0, donc x = ${fr(a)}.`
    : ' Attention au signe : f(x − a) décale vers la DROITE de a — il faut x = a pour retrouver f(0).';

  const slider = (name: string, v: number, set: (n: number) => void, min: number, max: number) => (
    <label>
      {name} : {fr(v)}
      <input type="range" min={min} max={max} step={0.5} value={v} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );
  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(FNS) as Fn[]).map((id) => (
          <button key={id} type="button" className={`btn ${fn === id ? 'btn-primary' : ''}`} onClick={() => setFn(id)}>{FNS[id].name}</button>
        ))}
      </div>
      <div className="physics-controls">
        {slider('a', a, setA, -4, 4)}
        {slider('b', b, setB, -3, 3)}
        {slider('k', k, setK, -2, 2)}
      </div>
      <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '1.15rem', color: 'var(--text)' }}>
        y = {kPart}f({inner}){bPart} <span style={{ color: 'var(--text-dim)' }}>=</span> <span style={{ color: 'var(--accent)' }}>{concrete}</span>
      </p>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">{lead}{trap}</p>
    </div>
  );
}

// ————————————————————————— Réciproque —————————————————————————

type Inv = 'lin' | 'cube' | 'exp' | 'sq';
/** t : plage de paramètre tracée ; p : plage de P (P et P′ restent dans le cadre) ; p0 : P de départ. */
const INV: Record<Inv, { name: ReactNode; f: (x: number) => number; t: V2; p: V2; p0: number; fTxt: string; gTxt: string; solve: string }> = {
  lin: { name: '2x + 1', f: (x) => 2 * x + 1, t: [-8, 8], p: [-2.6, 1.6], p0: 1, fTxt: '2x + 1', gTxt: '(x − 1)/2', solve: 'y = 2x + 1 ⟺ x = (y − 1)/2' },
  cube: { name: 'x³', f: (x) => x ** 3, t: [-2.3, 2.3], p: [-1.6, 1.6], p0: 1.4, fTxt: 'x³', gTxt: '∛x', solve: 'y = x³ ⟺ x = ∛y' },
  exp: { name: <>e<sup>x</sup></>, f: Math.exp, t: [-8, 2.7], p: [-4, 1.4], p0: 1, fTxt: 'eˣ', gTxt: 'ln x', solve: 'y = eˣ ⟺ x = ln y' },
  sq: { name: 'x² (x ≥ 0)', f: (x) => x * x, t: [0, 3.6], p: [0, 2], p0: 1.5, fTxt: 'x² (x ≥ 0)', gTxt: '√x', solve: 'y = x² (x ≥ 0) ⟺ x = √y' },
};


function drawInverse(ctx: Ctx, p: Pal, fn: Inv, q: number, m: number) {
  ctx.clearRect(0, 0, W, H);
  axes(ctx, p);
  const { f, t, fTxt, gTxt } = INV[fn];
  plot(ctx, (u) => [u, u], -5, 5, p.dim, 1.4, [7, 5]); // le miroir y = x
  plot(ctx, (u) => [f(u), u], t[0], t[1], p.warn, 1.5, [4, 4], 0.35); // f⁻¹ en fantôme : la cible
  plot(ctx, (u) => [u, f(u)], t[0], t[1], p.accent, 2.8);
  // Chaque point (x ; y) glisse en ligne droite vers (y ; x) : à m = 0,5, tout est sur la diagonale.
  if (m > 0) plot(ctx, (u) => [u + m * (f(u) - u), f(u) + m * (u - f(u))], t[0], t[1], p.warn, 2.8);
  const fq = f(q);
  const [Px, Py, Qx, Qy] = [sx(q), sy(fq), sx(fq), sy(q)];
  const [Mx, My] = [(Px + Qx) / 2, (Py + Qy) / 2];
  ctx.save();
  Object.assign(ctx, { strokeStyle: p.text, lineWidth: 1.2, globalAlpha: 0.8 });
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(Px, Py);
  ctx.lineTo(Qx, Qy);
  ctx.stroke();
  ctx.setLineDash([]);
  const len = Math.hypot(Px - Mx, Py - My);
  if (len > 12) {
    // Angle droit au milieu de PP′, posé sur la diagonale.
    const [ux, uy, vx, vy] = [((Px - Mx) / len) * 8, ((Py - My) / len) * 8, 8 * Math.SQRT1_2, -8 * Math.SQRT1_2];
    ctx.beginPath();
    ctx.moveTo(Mx + ux, My + uy);
    ctx.lineTo(Mx + ux + vx, My + uy + vy);
    ctx.lineTo(Mx + vx, My + vy);
    ctx.stroke();
  }
  ctx.restore();
  if (m > 0 && m < 1) handle(ctx, Px + m * (Qx - Px), Py + m * (Qy - Py), p.warn, 3);
  handle(ctx, Px, Py, p.accent);
  handle(ctx, Qx, Qy, p.warn, 6);
  const above = fq >= q; // P au-dessus de la diagonale : son étiquette en haut à gauche, celle de P′ en bas à droite
  const tag = (text: string, x: number, y: number, upLeft: boolean, color: string) =>
    pill(ctx, p, text, x + (upLeft ? -16 : 16), clamp(y + (upLeft ? -16 : 16), 10, H - 10), color, upLeft ? 'right' : 'left');
  tag(`P (${fr(q)} ; ${fr(fq)})`, Px, Py, above, p.accent);
  tag(`P′ (${fr(fq)} ; ${fr(q)})`, Qx, Qy, !above, p.warn);
  // Légende.
  const rows: [string, string, number[]][] = [[`f(x) = ${fTxt}`, p.accent, []], [`f⁻¹(x) = ${gTxt}`, p.warn, []], ['y = x', p.dim, [5, 4]]];
  rows.forEach(([text, col, dash], i) => {
    Object.assign(ctx, { strokeStyle: col, fillStyle: col, lineWidth: 2.5, font: '13px system-ui', textAlign: 'left', textBaseline: 'middle' });
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(12, 18 + 20 * i);
    ctx.lineTo(34, 18 + 20 * i);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText(text, 40, 18 + 20 * i);
  });
}

function InverseView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [fn, setFn] = useState<Inv>('lin');
  const [q, setQ] = useState(INV.lin.p0); // abscisse de P
  const [target, setTarget] = useState(0); // miroir visé par le bouton
  const [phase, setPhase] = useState(0); // 0 : f seule, 1 : en route, 2 : f⁻¹, 3 : pile à mi-chemin
  const anim = useRef({ m: 0, target: 0 });
  const phaseRef = useRef(0);
  const wake = useRef<() => void>(() => {});
  const drag = useRef<'P' | 'Q' | null>(null);

  useEffect(() => {
    const setup = canvasRef.current && setupCanvas(canvasRef.current);
    if (!setup) return;
    const [ctx, pal] = setup;
    let raf = 0;
    let last = 0;
    let alive = true;
    const frame = (now: number) => {
      raf = 0;
      const st = anim.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const gap = st.target - st.m;
      if (gap !== 0) {
        st.m += Math.sign(gap) * Math.min(Math.abs(gap), dt / 1.4); // 1,4 s pour tout le miroir
        if (sliderRef.current) sliderRef.current.value = String(st.m);
      }
      drawInverse(ctx, pal, fn, q, ease(st.m));
      const ph = st.m < 0.01 ? 0 : st.m > 0.99 ? 2 : Math.abs(st.m - 0.5) < 0.03 ? 3 : 1;
      if (ph !== phaseRef.current) {
        phaseRef.current = ph; // setState seulement quand la phase change
        setPhase(ph);
      }
      if (st.m !== st.target) raf = requestAnimationFrame(frame);
      else last = 0;
    };
    wake.current = () => {
      if (alive && !raf) raf = requestAnimationFrame(frame);
    };
    frame(performance.now());
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [fn, q]);

  const F = INV[fn];
  const fq = F.f(q);
  const which = ([x, y]: V2) =>
    Math.hypot(x - sx(q), y - sy(fq)) < 16 ? 'P' : Math.hypot(x - sx(fq), y - sy(q)) < 16 ? 'Q' : null;
  const onDown = (e: PEvent) => {
    drag.current = which(toCanvas(e));
    if (!drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onMove = (e: PEvent) => {
    const [x, y] = toCanvas(e);
    if (!drag.current) {
      e.currentTarget.style.cursor = which([x, y]) ? 'grab' : 'default';
      return;
    }
    // P se déplace sur f (on suit x) ; P′ sur f⁻¹ (on suit y, qui est l'abscisse de P).
    const v = drag.current === 'P' ? (x - CX) / U : (CY - y) / U;
    setQ(clamp(Math.round(v * 10) / 10, F.p[0], F.p[1]));
  };
  const onUp = (e: PEvent) => {
    drag.current = null;
    e.currentTarget.style.cursor = 'default';
  };
  const mirror = (v: number, animate: boolean) => {
    anim.current.target = v;
    if (!animate) anim.current.m = v;
    setTarget(v >= 0.5 ? 1 : 0);
    wake.current();
  };

  const fixedPoint = Math.abs(fq - q) < 1e-9;
  const swap = fixedPoint
    ? `P (${fr(q)} ; ${fr(fq)}) reste sur place : posé sur la diagonale, c’est un point fixe, f(${fr(q)}) = ${fr(q)}`
    : `P (${fr(q)} ; ${fr(fq)}) devient P′ (${fr(fq)} ; ${fr(q)})`;
  const caption = [
    `La courbe de f, et le miroir y = x en pointillé. Lance le miroir : chaque point (x ; y) va glisser vers (y ; x), ` +
      `perpendiculairement à la diagonale. Ici f(${fr(q)}) = ${fr(fq)} ; déplace P pour suivre un autre point.`,
    'Les points glissent vers leur image, chacun sur sa perpendiculaire à la diagonale y = x…',
    `Voilà f⁻¹(x) = ${F.gTxt}. La réciproque échange les rôles : ce qui était l’entrée devient la sortie, ${swap}. ` +
      `On obtient sa formule en résolvant y = f(x) pour x : ${F.solve}.` +
      (fn === 'sq' ? ' Pourquoi x ≥ 0 ? Sinon −2 et 2 donneraient tous deux 4 : le miroir aurait deux sorties pour l’entrée 4, ce ne serait plus une fonction.' : '') +
      (fn === 'exp' ? ' Et ln x n’existe que pour x > 0 : eˣ ne produit que des nombres positifs.' : ''),
    'Pile à mi-chemin : tous les points sont posés sur la diagonale y = x, l’axe du miroir.',
  ][phase];

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(INV) as Inv[]).map((id) => (
          <button key={id} type="button" className={`btn ${fn === id ? 'btn-primary' : ''}`}
            onClick={() => {
              setFn(id);
              setQ(INV[id].p0);
            }}>{INV[id].name}</button>
        ))}
      </div>
      <div className="physics-controls">
        <button type="button" className="btn btn-primary" onClick={() => mirror(target ? 0 : 1, true)}>
          {target ? '◀ Retour à f' : 'Miroir ▶'}
        </button>
        <label>
          miroir
          <input ref={sliderRef} type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => mirror(Number(e.target.value), false)} />
        </label>
      </div>
      <p style={{ margin: '0.2rem 0 0.4rem', fontSize: '1.05rem', color: 'var(--text)' }}>
        {F.solve} <span style={{ color: 'var(--text-dim)' }}>donc</span> <span style={{ color: 'var(--warn)' }}>f⁻¹(x) = {F.gTxt}</span>
      </p>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">{caption}</p>
    </div>
  );
}

export function FunctionTransformExplorer({ mode = 'transform' }: { mode?: 'transform' | 'inverse' }) {
  return mode === 'inverse' ? <InverseView /> : <TransformView />;
}
