import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Pythagore par les aires : on déforme un triangle rectangle, les trois carrés
 * bâtis sur ses côtés suivent, et a² + b² = c² reste vrai. Puis la preuve par
 * réarrangement (figure du Zhoubi Suanjing) : mêmes 4 triangles dans le même
 * grand carré — le reste a forcément la même aire, c² d'un côté, a² + b² de l'autre.
 */

type Ctx = CanvasRenderingContext2D;
type V2 = [number, number];
type Pal = Record<'accent' | 'ok' | 'warn' | 'text' | 'dim' | 'bg', string>;
type Seg = [string, string];

const W = 560;
const H = 360;
const U = 22; // px par unité (vue triangle)
const OX = 140; // sommet de l'angle droit (vue triangle)
const OY = 240;
const COLX = 384; // colonne des calculs (vue triangle)
const BIG = 280; // côté du grand carré a + b (vue preuve), en px
const PX = 40;
const PY = 40;
const PCOL = 350; // colonne des calculs (vue preuve)
const MIN = 10; // a, b en dixièmes d'unité : de 1 à 5
const MAX = 50;

const fmt = (v: number) => String(Math.round(v * 100) / 100).replace('.', ',');
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const add = (p: V2, q: V2, k = 1): V2 => [p[0] + k * q[0], p[1] + k * q[1]];

function palette(el: Element): Pal {
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'),
    text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd'), bg: v('--surface-2', '#222840') };
}

function poly(ctx: Ctx, pts: V2[]) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

function segs(ctx: Ctx, x: number, y: number, parts: Seg[], font = '14px system-ui') {
  Object.assign(ctx, { font, textAlign: 'left', textBaseline: 'alphabetic' });
  for (const [t, col] of parts) {
    ctx.fillStyle = col;
    ctx.fillText(t, x, y);
    x += ctx.measureText(t).width;
  }
}

/** Carré d'origine o et d'arêtes e1, e2 (unités), quadrillé à l'unité le long de ses côtés. */
function square(ctx: Ctx, S: (p: V2) => V2, o: V2, e1: V2, e2: V2, color: string, name: string, area: number, textCol: string) {
  const side = Math.hypot(e1[0], e1[1]);
  ctx.save();
  poly(ctx, [o, add(o, e1), add(add(o, e1), e2), add(o, e2)].map(S));
  Object.assign(ctx, { fillStyle: color, strokeStyle: color, globalAlpha: 0.25, lineWidth: 1.6 });
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.stroke();
  ctx.beginPath();
  for (let k = 1; k < side - 1e-6; k++) {
    for (const [e, f] of [[e1, e2], [e2, e1]]) {
      ctx.moveTo(...S(add(o, e, k / side)));
      ctx.lineTo(...S(add(add(o, e, k / side), f)));
    }
  }
  Object.assign(ctx, { globalAlpha: 0.3, lineWidth: 1 });
  ctx.stroke();
  const [cx, cy] = S(add(o, add(e1, e2), 0.5));
  Object.assign(ctx, { globalAlpha: 1, fillStyle: textCol, textAlign: 'center', textBaseline: 'middle' });
  if (side * U >= 44) {
    ctx.font = '600 14px system-ui';
    ctx.fillText(name, cx, cy - 8);
    ctx.font = '13px system-ui';
    ctx.fillText(fmt(area), cx, cy + 9);
  } else {
    ctx.font = '600 12px system-ui';
    ctx.fillText(name, cx, cy);
  }
  ctx.restore();
}

/** Poignée : disque plein + halo, pour dire « attrape-moi ». */
function handle(ctx: Ctx, [x, y]: V2, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  for (const [r, alpha] of [[13, 0.25], [7, 1]]) {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawTriangle(ctx: Ctx, p: Pal, a: number, b: number) {
  const S = ([x, y]: V2): V2 => [OX + x * U, OY - y * U];
  const c2 = a * a + b * b;
  square(ctx, S, [0, 0], [a, 0], [0, -a], p.accent, 'a²', a * a, p.text);
  square(ctx, S, [0, 0], [0, b], [-b, 0], p.ok, 'b²', b * b, p.text);
  // Carré sur l'hypoténuse : arête B − A = (−a, b), normale extérieure (b, a), de longueur c.
  square(ctx, S, [a, 0], [-a, b], [b, a], p.warn, 'c²', c2, p.text);
  poly(ctx, ([[0, 0], [a, 0], [0, b]] as V2[]).map(S));
  ctx.save();
  Object.assign(ctx, { fillStyle: p.dim, globalAlpha: 0.22 });
  ctx.fill();
  Object.assign(ctx, { globalAlpha: 1, strokeStyle: p.text, lineWidth: 2 });
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeRect(OX, OY - 10, 10, 10); // angle droit
  handle(ctx, S([a, 0]), p.accent);
  handle(ctx, S([0, b]), p.ok);
  Object.assign(ctx, { fillStyle: p.dim, font: '14px system-ui', textAlign: 'center', textBaseline: 'middle' });
  ctx.fillText('↔', OX + a * U + 18, OY + 16);
  ctx.fillText('↕', OX - 14, OY - b * U - 16);
  ctx.restore();
  const t = p.text;
  const c = Math.sqrt(c2);
  const exact = Math.abs(c * 10 - Math.round(c * 10)) < 1e-9;
  segs(ctx, COLX, 44, [[`a = ${fmt(a)}`, p.accent]], '600 14px system-ui');
  segs(ctx, COLX, 66, [[`b = ${fmt(b)}`, p.ok]], '600 14px system-ui');
  segs(ctx, COLX, 88, [[`c ${exact ? '=' : '≈'} ${fmt(c)}`, p.warn]], '600 14px system-ui');
  segs(ctx, COLX, 132, [['a² + b²', t]], '600 15px system-ui');
  segs(ctx, COLX, 158, [['= ', t], [fmt(a * a), p.accent], [' + ', t], [fmt(b * b), p.ok]]);
  segs(ctx, COLX, 184, [[`= ${fmt(c2)}`, t]]);
  segs(ctx, COLX, 210, [['= ', t], ['c²', p.warn], ['  ✓', p.ok]], '600 15px system-ui');
}

function drawProof(ctx: Ctx, p: Pal, a: number, b: number, t: number) {
  const s = a + b;
  const k = BIG / s;
  const P = ([x, y]: V2): V2 => [PX + x * k, PY + y * k]; // y vers le bas
  const fill = (pts: V2[], color: string, alpha: number) => {
    ctx.save();
    poly(ctx, pts.map(P));
    Object.assign(ctx, { fillStyle: color, strokeStyle: color, globalAlpha: 0.3 * alpha });
    ctx.fill();
    ctx.globalAlpha = alpha;
    ctx.stroke();
    ctx.restore();
  };
  // Ce qui reste : le carré incliné c² (disposition 1) s'efface, a² et b² (disposition 2) apparaissent.
  fill([[a, 0], [s, a], [b, s], [0, b]], p.warn, 1 - t);
  fill([[0, 0], [a, 0], [a, a], [0, a]], p.accent, t);
  fill([[a, a], [s, a], [s, s], [a, s]], p.ok, t);
  // Les 4 triangles (jambes a et b) ne font que GLISSER : translation pure, sans rotation.
  const tris: [V2[], V2][] = [
    [[[0, 0], [a, 0], [0, b]], [0, a]],
    [[[s, 0], [s, a], [a, 0]], [0, 0]],
    [[[s, s], [b, s], [s, a]], [-b, 0]],
    [[[0, s], [0, b], [b, s]], [a, -b]],
  ];
  ctx.save();
  tris.forEach(([pts, shift], i) => {
    const moved = pts.map((q) => P(add(q, shift, t)));
    poly(ctx, moved);
    Object.assign(ctx, { fillStyle: p.bg, globalAlpha: 1 });
    ctx.fill();
    Object.assign(ctx, { fillStyle: p.dim, globalAlpha: 0.3 });
    ctx.fill();
    Object.assign(ctx, { strokeStyle: p.dim, globalAlpha: 1, lineWidth: 1.5 });
    ctx.stroke();
    const g = moved.reduce((acc, q) => add(acc, q, 1 / 3), [0, 0]);
    Object.assign(ctx, { fillStyle: p.text, font: '12px system-ui', textAlign: 'center', textBaseline: 'middle' });
    ctx.fillText(String(i + 1), ...g);
  });
  // Étiquettes des restes, au-dessus de tout.
  const c2 = a * a + b * b;
  ctx.font = '600 15px system-ui';
  const tag = (q: V2, text: string, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillText(text, ...P(q));
  };
  tag([s / 2, s / 2], `c² = ${fmt(c2)}`, p.text, Math.max(0, 1 - 2 * t));
  if (a * k >= 40) tag([a / 2, a / 2], 'a²', p.text, Math.max(0, 2 * t - 1));
  if (b * k >= 40) tag([a + b / 2, a + b / 2], 'b²', p.text, Math.max(0, 2 * t - 1));
  Object.assign(ctx, { globalAlpha: 1, strokeStyle: p.text, lineWidth: 2 });
  ctx.strokeRect(PX, PY, BIG, BIG);
  // Cotes : le haut se lit « a puis b » dans les deux dispositions ; le côté gauche change.
  Object.assign(ctx, { fillStyle: p.dim, font: '13px system-ui', textBaseline: 'bottom' });
  ctx.fillText('a', PX + (a * k) / 2, PY - 6);
  ctx.fillText('b', PX + a * k + (b * k) / 2, PY - 6);
  Object.assign(ctx, { textAlign: 'right', textBaseline: 'middle' });
  const [l1, l2] = t < 0.5 ? [b, a] : [a, b];
  ctx.fillText(t < 0.5 ? 'b' : 'a', PX - 8, PY + (l1 * k) / 2);
  ctx.fillText(t < 0.5 ? 'a' : 'b', PX - 8, PY + l1 * k + (l2 * k) / 2);
  ctx.restore();
  const tx = p.text;
  segs(ctx, PCOL, 56, [['le grand carré', p.dim]], '12px system-ui');
  segs(ctx, PCOL, 78, [[`(a + b)² = ${fmt(s * s)}`, tx]]);
  segs(ctx, PCOL, 112, [['moins 4 triangles', p.dim]], '12px system-ui');
  segs(ctx, PCOL, 134, [[`4 × ab/2 = ${fmt(2 * a * b)}`, tx]]);
  segs(ctx, PCOL, 168, [['il reste', p.dim]], '12px system-ui');
  ctx.save();
  ctx.globalAlpha = 1 - 0.7 * t;
  segs(ctx, PCOL, 192, [['c²', p.warn], [` = ${fmt(c2)}`, tx]]);
  ctx.globalAlpha = 0.3 + 0.7 * t;
  segs(ctx, PCOL, 218, [['a²', p.accent], [' + ', tx], ['b²', p.ok], [` = ${fmt(a * a)} + ${fmt(b * b)}`, tx]]);
  ctx.restore();
  segs(ctx, PCOL, 262, [['même reste, donc', p.dim]], '13px system-ui');
  segs(ctx, PCOL, 288, [['a² + b² = c²', tx]], '600 17px system-ui');
}

export function PythagorasExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const [a10, setA10] = useState(30); // longueurs en dixièmes : a = 3, b = 4
  const [b10, setB10] = useState(40);
  const [view, setView] = useState<'triangle' | 'proof'>('triangle');
  const [target, setTarget] = useState(0); // disposition visée par le bouton
  const [phase, setPhase] = useState(0); // 0 : disposition 1, 1 : en route, 2 : disposition 2
  const anim = useRef({ t: 0, target: 0 });
  const phaseRef = useRef(0);
  const wake = useRef<() => void>(() => {});
  const drag = useRef<'a' | 'b' | null>(null);
  const a = a10 / 10;
  const b = b10 / 10;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    [canvas.width, canvas.height] = [W * dpr, H * dpr];
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = palette(canvas);
    const [la, lb] = [a10 / 10, b10 / 10];
    let raf = 0;
    let last = 0;
    let alive = true;
    const frame = (now: number) => {
      raf = 0;
      const st = anim.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const gap = st.target - st.t;
      if (gap !== 0) {
        st.t += Math.sign(gap) * Math.min(Math.abs(gap), dt / 1.2); // 1,2 s pour tout le trajet
        if (sliderRef.current) sliderRef.current.value = String(st.t);
      }
      ctx.clearRect(0, 0, W, H);
      if (view === 'triangle') drawTriangle(ctx, pal, la, lb);
      else drawProof(ctx, pal, la, lb, ease(st.t));
      const ph = st.t < 0.01 ? 0 : st.t > 0.99 ? 2 : 1;
      if (ph !== phaseRef.current) {
        phaseRef.current = ph; // setState seulement quand la phase change
        setPhase(ph);
      }
      if (st.t !== st.target) raf = requestAnimationFrame(frame);
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
  }, [a10, b10, view]);

  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): V2 => {
    const r = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
  };
  const nearest = ([x, y]: V2) => {
    const dA = Math.hypot(x - (OX + a * U), y - OY);
    const dB = Math.hypot(x - OX, y - (OY - b * U));
    return Math.min(dA, dB) > 16 ? null : dA <= dB ? 'a' : 'b';
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (view !== 'triangle') return;
    drag.current = nearest(toCanvas(e));
    if (!drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (view !== 'triangle') return;
    const [x, y] = toCanvas(e);
    const clamp = (v: number) => Math.min(MAX, Math.max(MIN, Math.round(v * 10)));
    if (drag.current === 'a') setA10(clamp((x - OX) / U));
    else if (drag.current === 'b') setB10(clamp((OY - y) / U));
    else e.currentTarget.style.cursor = nearest([x, y]) ? 'grab' : 'default';
  };
  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drag.current = null;
    e.currentTarget.style.cursor = 'default';
  };

  const goTo = (v: number, animate: boolean) => {
    anim.current.target = v;
    if (!animate) anim.current.t = v;
    setTarget(v >= 0.5 ? 1 : 0);
    wake.current();
  };
  const openProof = () => {
    anim.current = { t: 0, target: 0 };
    phaseRef.current = 0;
    setPhase(0);
    setTarget(0);
    setView('proof');
  };

  const c2 = a * a + b * b;
  const allInt = Number.isInteger(a) && Number.isInteger(b) && Number.isInteger(Math.sqrt(c2));
  const caption =
    view === 'triangle'
      ? `Glisse les deux points pour déformer le triangle. Quel que soit le triangle rectangle, le carré bâti sur l’hypoténuse ` +
        `a exactement l’aire des deux autres réunis : ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(c2)}.` +
        (allInt ? ` Et ici c tombe juste : (${a}, ${b}, ${Math.sqrt(c2)}) est un triplet pythagoricien, trois entiers qui vérifient a² + b² = c².` : '')
      : [
          `Quatre copies du triangle, posées dans les coins d’un carré de côté a + b. Ce qui reste au milieu est un carré ` +
            `incliné de côté c : son aire est c² = ${fmt(c2)}. Réarrange les triangles…`,
          'Les triangles glissent sans tourner ni se déformer : le grand carré ne change pas, les quatre triangles non plus…',
          `Mêmes 4 triangles, même grand carré : ce qui reste doit avoir la même aire. Or il reste maintenant deux carrés, ` +
            `a² et b². Donc a² + b² = c², sans aucun calcul ! (Preuve par réarrangement, d’après la figure du Zhoubi Suanjing, Chine ancienne.)`,
        ][phase];

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {view === 'triangle' ? (
          <button type="button" className="btn btn-primary" onClick={openProof}>Voir la preuve</button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={() => goTo(target ? 0 : 1, true)}>
              {target ? '◀ Revenir' : 'Réarranger ▶'}
            </button>
            <label>
              disposition
              <input ref={sliderRef} type="range" min={0} max={1} step={0.01} defaultValue={0} onChange={(e) => goTo(Number(e.target.value), false)} />
            </label>
            <button type="button" className="btn btn-ghost" onClick={() => setView('triangle')}>← Triangle</button>
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">{caption}</p>
    </div>
  );
}
