import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le logarithme transforme × en + : sur une règle à calcul, chaque nombre v est
 * gravé à la distance log v ; glisser une réglette ADDITIONNE deux longueurs,
 * donc multiplie deux nombres. Mode « décibels » : la même échelle pour l'oreille,
 * et la preuve visuelle qu'une échelle linéaire écraserait tout contre le zéro.
 */

type Ctx = CanvasRenderingContext2D;
type Seg = [string, string];
type Pal = Record<'accent' | 'ok' | 'warn' | 'text' | 'dim', string>;
type Anim = { o0: number; h0: number; o1: number; h1: number; t: number };
type PEvent = React.PointerEvent<HTMLCanvasElement>;

const W = 560;
const H = 340; // décibels
// Règle à calcul
const RH = 300; // hauteur du canvas de la règle
const X0 = 40; // abscisse du 1 de la réglette fixe
const L = 480; // longueur d'une décade, de 1 à 10
const MID = 110; // jonction des deux réglettes
const TOP = 64; // haut de la réglette mobile
const BOT = 156; // bas de la réglette fixe
const BR1 = 186; // accolades log a, log v
const BR2 = 222; // accolade log(a·v)
const SNAP = 4; // aimantation sur les graduations (px)
// Décibels
const DB_TOP = 86; // 140 dB
const DB_BOT = 318; // 0 dB
const AX_DB = 200;
const AX_LIN = 400;

const lg = Math.log10;
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const trim = (v: number, d = 2) => String(Math.round(v * 10 ** d) / 10 ** d).replace('.', ',');
const fixed = (v: number, d: number) => v.toFixed(d).replace('.', ',');
const sup = (n: number) => String(n).replace('-', '⁻').replace(/\d/g, (c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(c)]);
const grouped = (v: number) => {
  const [int, dec] = String(v).split('.');
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + (dec ? `,${dec}` : '');
};

/** Graduations d'une décade : pas de 0,05 de 1 à 2, de 0,1 ensuite (en centièmes, sans erreur d'arrondi). */
const TICKS: { v: number; size: number; label?: string }[] = [];
for (let n = 100; n <= 1000; n += 5) {
  if (n >= 200 && n % 10 !== 0) continue;
  const size = n % 100 === 0 ? 15 : n % 50 === 0 ? 10 : n % 10 === 0 ? 6 : 4;
  TICKS.push({ v: n / 100, size, label: n % 100 === 0 ? String(n / 100) : n === 150 ? '1,5' : undefined });
}

/** Aimante une distance (px, comptée depuis un 1) sur la graduation la plus proche. */
function snap(pos: number) {
  let [best, dist] = [pos, SNAP];
  for (const t of TICKS) {
    const q = L * lg(t.v);
    if (Math.abs(q - pos) < dist) [best, dist] = [q, Math.abs(q - pos)];
  }
  return best;
}

function setupCanvas(canvas: HTMLCanvasElement, h: number): [Ctx, Pal] | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(canvas);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return [ctx, { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'),
    text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd') }];
}

const toCanvas = (e: PEvent, h: number) => {
  const r = e.currentTarget.getBoundingClientRect();
  return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (h / r.height)] as const;
};

/** Ligne brisée x0, y0, x1, y1, … */
function stroke(ctx: Ctx, ...xy: number[]) {
  ctx.beginPath();
  ctx.moveTo(xy[0], xy[1]);
  for (let i = 2; i < xy.length; i += 2) ctx.lineTo(xy[i], xy[i + 1]);
  ctx.stroke();
}

function dot(ctx: Ctx, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Texte multicolore ; renvoie l'abscisse de fin pour enchaîner. */
function segs(ctx: Ctx, x: number, y: number, parts: Seg[], font = '13px system-ui') {
  Object.assign(ctx, { font, textAlign: 'left', textBaseline: 'alphabetic' });
  for (const [t, col] of parts) {
    ctx.fillStyle = col;
    ctx.fillText(t, x, y);
    x += ctx.measureText(t).width;
  }
  return x;
}

/** Accolade de longueur : les logarithmes sont des LONGUEURS qu'on met bout à bout. */
function bracket(ctx: Ctx, x0: number, x1: number, y: number, text: string, color: string) {
  if (x1 - x0 < 2) return;
  Object.assign(ctx, { strokeStyle: color, fillStyle: color, lineWidth: 2, font: '12px system-ui', textAlign: 'center', textBaseline: 'top' });
  stroke(ctx, x0, y - 6, x0, y, x1, y, x1, y - 6);
  if (ctx.measureText(text).width < x1 - x0 + 30) ctx.fillText(text, (x0 + x1) / 2, y + 4);
}

function drawRule(ctx: Ctx, p: Pal, off: number, hx: number) {
  ctx.clearRect(0, 0, W, RH);
  ctx.save();
  // Corps : réglette fixe D (en bas) et réglette mobile C (en haut, décalée de off).
  for (const [x, y, h, col] of [[X0 - 18, MID, BOT - MID, p.dim], [X0 + off - 18, TOP, MID - TOP, p.accent]] as const) {
    Object.assign(ctx, { fillStyle: col, strokeStyle: col, globalAlpha: 0.12, lineWidth: 1.2 });
    ctx.fillRect(x, y, L + 36, h);
    ctx.globalAlpha = 1;
    ctx.strokeRect(x, y, L + 36, h);
  }
  Object.assign(ctx, { strokeStyle: p.text, fillStyle: p.text, font: '12px system-ui', textAlign: 'center' });
  for (const t of TICKS) {
    for (const [x, dir] of [[X0 + L * lg(t.v), 1], [X0 + off + L * lg(t.v), -1]]) {
      ctx.lineWidth = t.label ? 1.4 : 1;
      stroke(ctx, x, MID, x, MID + dir * t.size);
      ctx.textBaseline = dir > 0 ? 'top' : 'bottom';
      if (t.label) ctx.fillText(t.label, x, MID + dir * (t.size + 3));
    }
  }
  Object.assign(ctx, { font: '600 13px system-ui', textBaseline: 'middle', fillStyle: p.dim });
  ctx.fillText('D', X0 - 10, BOT - 14);
  ctx.fillStyle = p.accent;
  ctx.fillText('C', X0 + off - 10, TOP + 14);
  dot(ctx, X0 + off, MID, 4.5); // l'index : le 1 du haut, posé sur a
  // Le curseur (hairline), sa poignée, et son prolongement jusqu'aux accolades.
  Object.assign(ctx, { strokeStyle: p.warn, fillStyle: p.warn, lineWidth: 2 });
  stroke(ctx, hx, TOP - 22, hx, BOT + 10);
  ctx.beginPath();
  ctx.roundRect(hx - 8, TOP - 36, 16, 15, 4);
  ctx.fill();
  ctx.setLineDash([3, 4]);
  ctx.lineWidth = 1;
  stroke(ctx, hx, BOT + 10, hx, BR2);
  ctx.setLineDash([]);
  bracket(ctx, X0, X0 + off, BR1, 'log a', p.accent);
  bracket(ctx, X0 + off, hx, BR1, 'log v', p.ok);
  bracket(ctx, X0, hx, BR2, 'log a + log v = log(a·v)', p.warn);
  ctx.restore();
  // Lecture sur la règle vs calcul exact (avec les valeurs affichées de a et v).
  const a = Math.round(10 ** (off / L) * 100) / 100;
  const v = Math.round(10 ** ((hx - X0 - off) / L) * 100) / 100;
  const prod = fixed(10 ** ((hx - X0) / L), 2);
  const t = p.text;
  let x = segs(ctx, X0 - 18, RH - 34, [['lecture : ', p.dim], [trim(a), p.accent], [' × ', t], [trim(v), p.ok], [' ≈ ', t]], '14px system-ui');
  x = segs(ctx, x, RH - 34, [[prod, p.warn]], '600 14px system-ui');
  segs(ctx, x, RH - 34, [['      calcul exact : ', p.dim], [`${trim(a)} × ${trim(v)} = ${trim(a * v, 4)}`, t]], '14px system-ui');
  segs(ctx, X0 - 18, RH - 10, [['log a + log v = ', p.dim], [fixed(off / L, 3), p.accent], [' + ', t],
    [fixed((hx - X0 - off) / L, 3), p.ok], [' = ', t], [fixed((hx - X0) / L, 3), p.warn], [` = log ${prod}`, t]]);
}

function SlideRule() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Départ : le 1 du haut sur 2, le curseur sur le 3 du haut (donc sur 6 en bas).
  const sim = useRef({ off: L * lg(2), hx: X0 + L * lg(6), drag: '', grab: 0, anim: null as Anim | null });
  const wake = useRef<() => void>(() => {});
  const [aShown, setAShown] = useState(2); // pour la légende : mis à jour au lâcher, pas à chaque frame
  const commit = () => setAShown(Math.round(10 ** (sim.current.off / L) * 100) / 100);

  useEffect(() => {
    const canvas = canvasRef.current;
    const setup = canvas && setupCanvas(canvas, RH);
    if (!setup) return;
    const [ctx, pal] = setup;
    let raf = 0;
    let last = 0;
    let alive = true;
    const frame = (now: number) => {
      raf = 0;
      const s = sim.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      if (s.anim) {
        const an = s.anim;
        an.t = Math.min(1, an.t + dt / 0.7);
        s.off = an.o0 + (an.o1 - an.o0) * ease(an.t);
        s.hx = an.h0 + (an.h1 - an.h0) * ease(an.t);
        if (an.t >= 1) {
          s.anim = null;
          setAShown(Math.round(10 ** (s.off / L) * 100) / 100);
        }
      }
      drawRule(ctx, pal, s.off, s.hx);
      if (s.anim) raf = requestAnimationFrame(frame);
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
  }, []);

  const hit = (x: number, y: number) => {
    const s = sim.current;
    if (Math.abs(x - s.hx) < 10 && y > TOP - 40 && y < BR2 + 6) return 'hair';
    if (y >= TOP && y <= MID && x >= X0 + s.off - 18 && x <= X0 + s.off + L + 18) return 'slide';
    return '';
  };
  const onDown = (e: PEvent) => {
    const [x, y] = toCanvas(e, RH);
    const s = sim.current;
    s.drag = hit(x, y);
    if (!s.drag) return;
    s.anim = null;
    s.grab = x - (X0 + s.off);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.style.cursor = 'grabbing';
  };
  const onMove = (e: PEvent) => {
    const [x, y] = toCanvas(e, RH);
    const s = sim.current;
    if (!s.drag) {
      const h = hit(x, y);
      e.currentTarget.style.cursor = h === 'hair' ? 'ew-resize' : h === 'slide' ? 'grab' : 'default';
      return;
    }
    if (s.drag === 'slide') s.off = snap(Math.min(L, Math.max(0, x - s.grab - X0)));
    else s.hx = X0 + s.off + snap(x - X0 - s.off);
    s.hx = Math.min(X0 + L, Math.max(X0 + s.off, s.hx)); // le curseur reste sur la partie lisible
    wake.current();
  };
  const onUp = (e: PEvent) => {
    sim.current.drag = '';
    e.currentTarget.style.cursor = 'default';
    commit();
  };
  const play = (a: number, v: number) => {
    const s = sim.current;
    s.anim = { o0: s.off, h0: s.hx, o1: L * lg(a), h1: X0 + L * lg(a * v), t: 0 };
    wake.current();
  };

  const fa = trim(aShown);
  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {([['2 × 3', 2, 3], ['1,5 × 4', 1.5, 4], ['2,5 × 3,2', 2.5, 3.2]] as const).map(([name, a, v]) => (
          <button key={name} type="button" className="btn" onClick={() => play(a, v)}>{name}</button>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: RH, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">
        Glisse la réglette du haut et le curseur orange. Le 1 du haut est posé sur {fa} : sous chaque nombre v du haut,
        on lit {fa} × v en bas. Pourquoi ? Chaque nombre est gravé à la distance log v du 1 : le logarithme transforme × en +,
        et la règle ne fait qu’additionner des LONGUEURS, log a + log v = log(a·v). Précision : environ 3 chiffres.
        {aShown > 3.2 && ' Si le résultat dépasse 10, il sort de la règle : on pose alors le 10 du haut sur a, et on décale la virgule.'}
      </p>
    </div>
  );
}

const MARKS: [number, string][] = [
  [0, 'seuil d’audition'], [20, 'chuchotement'], [60, 'conversation'], [70, 'aspirateur'],
  [80, 'rue animée'], [110, 'concert'], [120, 'seuil de douleur'], [140, 'avion au décollage'],
];
const yDb = (db: number) => DB_BOT - (db / 140) * (DB_BOT - DB_TOP);
/** Échelle LINÉAIRE de l'intensité : 0 en bas, 10¹⁴ I₀ (140 dB) en haut. */
const yLin = (db: number) => DB_BOT - 10 ** (db / 10 - 14) * (DB_BOT - DB_TOP);

/** Une longueur en px, lisible même quand elle est ridicule (2,5 × 10⁻¹² px). */
function tinyPx(v: number) {
  if (v >= 0.1) return `${trim(v)} px`;
  const e = Math.floor(lg(v));
  return `${trim(v / 10 ** e, 1)} × 10${sup(e)} px`;
}

function drawDecibels(ctx: Ctx, p: Pal, db: number) {
  ctx.clearRect(0, 0, W, H);
  // Lecture : niveau → intensité, en puissance de 10 puis en clair.
  const n = db / 10;
  const x = segs(ctx, 16, 28, [[`${db} dB`, p.accent], ['   →   I / I₀ = 10', p.text]], '600 17px system-ui');
  segs(ctx, x + 1, 18, [[trim(n, 1), p.text]], '600 12px system-ui');
  const exact = db % 10 === 0;
  const ratio = exact ? Math.round(10 ** n) : Number((10 ** n).toPrecision(3));
  segs(ctx, 16, 52, db === 0
    ? [['le seuil d’audition lui-même : I = I₀', p.dim]]
    : [[`${exact ? '' : '≈ '}${grouped(ratio)}`, p.text], [' × plus intense que le seuil d’audition', p.dim]]);
  // Les deux axes : décibels (log) à gauche, intensité (linéaire) à droite.
  Object.assign(ctx, { font: '12px system-ui', textAlign: 'center', textBaseline: 'bottom', fillStyle: p.dim, strokeStyle: p.text, lineWidth: 1.2 });
  ctx.fillText('décibels (échelle log)', AX_DB, DB_TOP - 10);
  ctx.fillText('intensité (échelle linéaire)', AX_LIN, DB_TOP - 10);
  stroke(ctx, AX_DB, DB_TOP, AX_DB, DB_BOT);
  stroke(ctx, AX_LIN, DB_TOP, AX_LIN, DB_BOT);
  Object.assign(ctx, { textAlign: 'right', textBaseline: 'middle' });
  for (let d = 0; d <= 140; d += 10) {
    stroke(ctx, AX_DB - 5, yDb(d), AX_DB, yDb(d));
    ctx.fillText(String(d), AX_DB - 9, yDb(d));
  }
  for (const [d, name] of MARKS) {
    ctx.fillStyle = Math.abs(d - db) <= 3 ? p.accent : p.dim;
    ctx.fillText(name, AX_DB - 36, yDb(d));
  }
  Object.assign(ctx, { textAlign: 'left', fillStyle: p.dim });
  ctx.fillText(`10${sup(14)} I₀`, AX_LIN + 14, DB_TOP);
  ctx.fillText(`5 × 10${sup(13)}`, AX_LIN + 14, (DB_TOP + DB_BOT) / 2);
  ctx.fillText('0', AX_LIN + 14, DB_BOT);
  // Chaque repère rejoint sa vraie intensité : les fils s'écrasent contre le zéro.
  ctx.save();
  Object.assign(ctx, { strokeStyle: p.dim, lineWidth: 1, globalAlpha: 0.45 });
  for (const [d] of MARKS) stroke(ctx, AX_DB, yDb(d), AX_LIN, yLin(d));
  // La barre d'intensité, à l'échelle linéaire.
  const yb = yLin(db);
  Object.assign(ctx, { fillStyle: p.accent, globalAlpha: 0.5 });
  ctx.strokeRect(AX_LIN - 7, DB_TOP, 14, DB_BOT - DB_TOP);
  ctx.globalAlpha = 0.85;
  ctx.fillRect(AX_LIN - 7, yb, 14, DB_BOT - yb);
  Object.assign(ctx, { strokeStyle: p.accent, lineWidth: 2.5, globalAlpha: 1 });
  stroke(ctx, AX_DB, yDb(db), AX_LIN, yb);
  ctx.globalAlpha = 0.25;
  dot(ctx, AX_DB, yDb(db), 13);
  ctx.globalAlpha = 1;
  dot(ctx, AX_DB, yDb(db), 7);
  ctx.restore();
  const hPx = 10 ** (n - 14) * (DB_BOT - DB_TOP);
  segs(ctx, AX_LIN + 14, 150, [['hauteur de la barre :', p.dim]], '12px system-ui');
  segs(ctx, AX_LIN + 14, 168, [[tinyPx(hPx), hPx < 1 ? p.warn : p.text]], '600 13px system-ui');
  segs(ctx, AX_LIN + 14, DB_BOT - 30, [['← de 0 à 120 dB :', p.dim]], '12px system-ui');
  segs(ctx, AX_LIN + 14, DB_BOT - 14, [[`tout tient en ${fixed((DB_BOT - DB_TOP) / 100, 1)} px !`, p.dim]], '12px system-ui');
}

type Step = 'minus10' | 'plus3' | 'plus10' | 'vac' | null;
const STORY: Record<Exclude<Step, null>, string> = {
  minus10: '−10 dB : l’intensité est divisée par 10.',
  plus3: '+3 dB : l’intensité a presque doublé (10^0,3 ≈ 2).',
  plus10: '+10 dB : l’intensité a été multipliée par 10, pas augmentée de 10.',
  vac: 'Deux aspirateurs : l’intensité double, donc 70 + 10·log 2 ≈ 73 dB, pas 140 ! On additionne les intensités, jamais les décibels.',
};

function Decibels() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [db, setDb] = useState(60);
  const [last, setLast] = useState<Step>(null);
  const dragging = useRef(false);

  useEffect(() => {
    const setup = canvasRef.current && setupCanvas(canvasRef.current, H);
    if (setup) drawDecibels(setup[0], setup[1], db);
  }, [db]);

  const level = (e: PEvent) => {
    const [x, y] = toCanvas(e, H);
    const near = Math.abs(x - AX_DB) < 30 && y > DB_TOP - 12 && y < DB_BOT + 12;
    return { near, value: Math.min(140, Math.max(0, Math.round(((DB_BOT - y) / (DB_BOT - DB_TOP)) * 140))) };
  };
  const set = (value: number, step: Step) => {
    setDb(Math.min(140, Math.max(0, value)));
    setLast(step);
  };
  const onDown = (e: PEvent) => {
    const { near, value } = level(e);
    if (!near) return;
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    set(value, null);
  };
  const onMove = (e: PEvent) => {
    const { near, value } = level(e);
    if (dragging.current) set(value, null);
    else e.currentTarget.style.cursor = near ? 'ns-resize' : 'default';
  };
  const onUp = () => {
    dragging.current = false;
  };

  const below = MARKS.findLast(([d]) => d <= db) ?? MARKS[0];
  const above = MARKS.find(([d]) => d >= db) ?? MARKS[MARKS.length - 1];
  const where = below[0] === db ? `${db} dB : ${below[1]}.` : `${db} dB : entre ${below[1]} (${below[0]}) et ${above[1]} (${above[0]}).`;
  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          niveau : {db} dB
          <input type="range" min={0} max={140} step={1} value={db} onChange={(e) => set(Number(e.target.value), null)} />
        </label>
        <button type="button" className="btn" onClick={() => set(db - 10, 'minus10')}>−10 dB</button>
        <button type="button" className="btn" onClick={() => set(db + 3, 'plus3')}>+3 dB</button>
        <button type="button" className="btn" onClick={() => set(db + 10, 'plus10')}>+10 dB</button>
        <button type="button" className={`btn ${last === 'vac' ? 'btn-primary' : ''}`} onClick={() => set(73, 'vac')}>Deux aspirateurs</button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">
        {where} {last ? STORY[last] : '+10 dB = intensité ×10 ; +3 dB ≈ ×2 ; deux aspirateurs = 73 dB, pas 140.'} Suis
        les fils : en échelle linéaire, tout ce qui est sous 120 dB s’écrase contre le zéro — d’où les logarithmes.
      </p>
    </div>
  );
}

export function SlideRuleExplorer({ mode = 'slide-rule' }: { mode?: 'slide-rule' | 'decibels' }) {
  return mode === 'decibels' ? <Decibels /> : <SlideRule />;
}
