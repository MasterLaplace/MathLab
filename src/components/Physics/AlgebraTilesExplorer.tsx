import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * L'algèbre comme des AIRES (tuiles algébriques). Développer n'est qu'un
 * découpage : (a+b)(c+d) = ac + ad + bc + bd ; (a+b)² cache DEUX rectangles ab
 * (d'où le piège a² + b²) ; et la méthode d'al-Khwarizmi (vers 820) complète
 * le carré avec les mains : x² + bx = (x + b/2)² − (b/2)².
 */

type Mode = 'product' | 'square' | 'complete';
type Seg = [string, string]; // [texte, couleur]
type Ctx = CanvasRenderingContext2D;
type Pal = Record<'accent' | 'ok' | 'warn' | 'violet' | 'text' | 'dim', string>;

const W = 560;
const H = 340;
const OX = 64; // coin haut-gauche des figures (produit, carré)
const OY = 40;
const U = 24; // px par unité (produit, carré)
const COLX = 372; // colonne des calculs
const KX = 84; // coin haut-gauche (al-Khwarizmi)
const UK = 18; // px par unité (al-Khwarizmi)

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t));
const lerp = (u: number, v: number, t: number) => u + (v - u) * t;

function palette(el: Element): Pal {
  const css = getComputedStyle(el);
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
  return { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'),
    violet: '#a274ec', text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd') };
}

/** Tuile (en px) quadrillée à l'unité : son aire se compte. */
function tile(ctx: Ctx, x: number, y: number, w: number, h: number, color: string, unit: number, alpha = 1, dashed = false) {
  ctx.save();
  Object.assign(ctx, { fillStyle: color, strokeStyle: color, lineWidth: 1, globalAlpha: 0.28 * alpha });
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 0.3 * alpha;
  ctx.beginPath();
  for (let i = unit; i < w - 1; i += unit) ctx.rect(x + i, y, 0, h);
  for (let j = unit; j < h - 1; j += unit) ctx.rect(x, y + j, w, 0);
  ctx.stroke();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1.6;
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

/** Deux lignes (nom, aire) au centre ; si ça ne tient pas, la valeur seule. */
function label(ctx: Ctx, cx: number, cy: number, lines: [string, string], color: string, w: number, h: number, alpha = 1) {
  ctx.save();
  Object.assign(ctx, { globalAlpha: alpha, fillStyle: color, textAlign: 'center', textBaseline: 'middle', font: '13px system-ui' });
  // On essaie de plus en plus petit avant de renoncer au nom ; sinon, la valeur seule.
  const size = [13, 11, 10].find((px) => {
    ctx.font = `${px}px system-ui`;
    return h >= 34 && lines.every((l) => ctx.measureText(l).width <= w - 4);
  });
  if (size) {
    ctx.fillText(lines[0], cx, cy - 7);
    ctx.fillText(lines[1], cx, cy + 8);
  } else {
    ctx.fillText(lines[1].replace('= ', ''), cx, cy);
  }
  ctx.restore();
}

/** Une ligne de texte multicolore (chaque terme a la couleur de sa tuile). */
function segs(ctx: Ctx, x: number, y: number, parts: Seg[], font = '14px system-ui', center = false) {
  Object.assign(ctx, { font, textAlign: 'left', textBaseline: 'alphabetic' });
  let cur = center ? x - parts.reduce((s, [t]) => s + ctx.measureText(t).width, 0) / 2 : x;
  for (const [t, col] of parts) {
    ctx.fillStyle = col;
    ctx.fillText(t, cur, y);
    cur += ctx.measureText(t).width;
  }
}

/** Cote (trait de mesure) horizontale ou verticale ; texte raccourci si trop long. */
function cote(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, text: string, color: string, side = -1) {
  const horiz = y0 === y1;
  ctx.save();
  Object.assign(ctx, { strokeStyle: color, fillStyle: color, lineWidth: 1, font: '12px system-ui' });
  const [ux, uy, tx, ty] = horiz ? [2, 0, 0, 4] : [0, 2, 4, 0];
  ctx.beginPath();
  ctx.moveTo(x0 + ux, y0 + uy);
  ctx.lineTo(x1 - ux, y1 - uy);
  for (const [px, py] of [[x0 + ux, y0 + uy], [x1 - ux, y1 - uy]]) ctx.rect(px - tx, py - ty, 2 * tx, 2 * ty);
  ctx.stroke();
  if (horiz) {
    const short = ctx.measureText(text).width > Math.abs(x1 - x0) + 4 ? text.split(' =')[0] : text;
    Object.assign(ctx, { textAlign: 'center', textBaseline: 'bottom' });
    ctx.fillText(short, (x0 + x1) / 2, y0 - 4);
  } else {
    Object.assign(ctx, { textAlign: side < 0 ? 'right' : 'left', textBaseline: 'middle' });
    ctx.fillText(text, x0 + side * 6, (y0 + y1) / 2);
  }
  ctx.restore();
}

function drawProduct(ctx: Ctx, p: Pal, a: number, b: number, c: number, d: number) {
  const [A, B, C, D] = [a * U, b * U, c * U, d * U];
  const pieces: [number, number, number, number, string, string, number][] = [
    [OX, OY, A, C, p.accent, 'a·c', a * c],
    [OX, OY + C, A, D, p.ok, 'a·d', a * d],
    [OX + A, OY, B, C, p.warn, 'b·c', b * c],
    [OX + A, OY + C, B, D, p.violet, 'b·d', b * d],
  ];
  for (const [x, y, w, h, col, name, val] of pieces) {
    tile(ctx, x, y, w, h, col, U);
    label(ctx, x + w / 2, y + h / 2, [name, `= ${val}`], p.text, w, h);
  }
  cote(ctx, OX, OY - 10, OX + A, OY - 10, `a = ${a}`, p.dim);
  cote(ctx, OX + A, OY - 10, OX + A + B, OY - 10, `b = ${b}`, p.dim);
  cote(ctx, OX - 10, OY, OX - 10, OY + C, `c = ${c}`, p.dim);
  cote(ctx, OX - 10, OY + C, OX - 10, OY + C + D, `d = ${d}`, p.dim);
  const t = p.text;
  const tot = (a + b) * (c + d);
  segs(ctx, COLX, 64, [['(a + b)(c + d)', t]], '600 15px system-ui');
  segs(ctx, COLX, 92, [[`= (${a} + ${b})(${c} + ${d})`, t]]);
  segs(ctx, COLX, 120, [['= ', t], ['ac', p.accent], [' + ', t], ['ad', p.ok], [' + ', t], ['bc', p.warn], [' + ', t], ['bd', p.violet]]);
  segs(ctx, COLX, 148, [['= ', t], [`${a * c}`, p.accent], [' + ', t], [`${a * d}`, p.ok], [' + ', t], [`${b * c}`, p.warn], [' + ', t], [`${b * d}`, p.violet]]);
  segs(ctx, COLX, 176, [[`= ${tot}`, t]], '600 15px system-ui');
  segs(ctx, COLX, 222, [['le rectangle entier :', p.dim]], '12px system-ui');
  segs(ctx, COLX, 244, [[`${a + b} × ${c + d} = ${tot} ✓`, p.ok]]);
}

function drawSquare(ctx: Ctx, p: Pal, a: number, b: number, trap: number) {
  const [A, B, s] = [a * U, b * U, a + b];
  tile(ctx, OX, OY, A, A, p.accent, U);
  label(ctx, OX + A / 2, OY + A / 2, ['a²', `= ${a * a}`], p.text, A, A);
  tile(ctx, OX + A, OY + A, B, B, p.warn, U);
  label(ctx, OX + A + B / 2, OY + A + B / 2, ['b²', `= ${b * b}`], p.text, B, B);
  const rects: [number, number, number, number, string][] = [[OX + A, OY, B, A, '①'], [OX, OY + A, A, B, '②']];
  for (const [x, y, w, h, n] of rects) {
    tile(ctx, x, y, w, h, p.ok, U, 1 - 0.85 * trap);
    label(ctx, x + w / 2, y + h / 2, [`ab ${n}`, `= ${a * b}`], p.text, w, h, 1 - trap);
    if (trap === 0) continue;
    ctx.save();
    Object.assign(ctx, { globalAlpha: trap, strokeStyle: p.warn, lineWidth: 2 });
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    ctx.restore();
    label(ctx, x + w / 2, y + h / 2, ['manque', `${a * b}`], p.warn, w, h, trap);
  }
  cote(ctx, OX, OY - 10, OX + A, OY - 10, `a = ${a}`, p.dim);
  cote(ctx, OX + A, OY - 10, OX + A + B, OY - 10, `b = ${b}`, p.dim);
  cote(ctx, OX - 10, OY, OX - 10, OY + A, `a = ${a}`, p.dim);
  cote(ctx, OX - 10, OY + A, OX - 10, OY + A + B, `b = ${b}`, p.dim);
  const t = p.text;
  segs(ctx, COLX, 64, [['(a + b)²', t]], '600 15px system-ui');
  segs(ctx, COLX, 92, [['= ', t], ['a²', p.accent], [' + ', t], ['ab', p.ok], [' + ', t], ['ab', p.ok], [' + ', t], ['b²', p.warn]]);
  segs(ctx, COLX, 120, [['= ', t], ['a²', p.accent], [' + ', t], ['2ab', p.ok], [' + ', t], ['b²', p.warn]]);
  segs(ctx, COLX, 148, [['= ', t], [`${a * a}`, p.accent], [' + ', t], [`2 × ${a * b}`, p.ok], [' + ', t], [`${b * b}`, p.warn]]);
  segs(ctx, COLX, 176, [[`= ${s * s} = ${s}²`, t]], '600 15px system-ui');
  if (trap === 0) return;
  ctx.save();
  ctx.globalAlpha = trap;
  segs(ctx, COLX, 222, [[`a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}`, p.warn]]);
  segs(ctx, COLX, 246, [[`≠ ${s * s} : il manque`, p.warn]]);
  segs(ctx, COLX, 272, [[`2ab = ${2 * a * b} !`, p.warn]], '600 16px system-ui');
  ctx.restore();
}

function drawComplete(ctx: Ctx, p: Pal, x: number, coef: number, step: number, move: number, corner: number) {
  const h = coef / 2;
  const [X, Hh] = [x * UK, h * UK];
  if (corner > 0) {
    // Le coin manquant (b/2)², puis le contour du grand carré (x + b/2)².
    tile(ctx, KX + X, OY + X, Hh, Hh, p.warn, UK, corner, true);
    label(ctx, KX + X + Hh / 2, OY + X + Hh / 2, ['(b/2)²', `= ${h * h}`], p.text, Hh, Hh, corner);
    ctx.save();
    Object.assign(ctx, { globalAlpha: corner, strokeStyle: p.text, lineWidth: 2 });
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(KX - 3, OY - 3, X + Hh + 6, X + Hh + 6);
    ctx.setLineDash([]);
    cote(ctx, KX + X + Hh + 14, OY, KX + X + Hh + 14, OY + X + Hh, `x + b/2 = ${x + h}`, p.text, 1);
    ctx.restore();
  }
  tile(ctx, KX, OY, X, X, p.accent, UK);
  label(ctx, KX + X / 2, OY + X / 2, ['x²', `= ${x * x}`], p.text, X, X);
  if (step === 0) {
    tile(ctx, KX + X, OY, coef * UK, X, p.ok, UK);
    label(ctx, KX + X + (coef * UK) / 2, OY + X / 2, ['b·x', `= ${coef * x}`], p.text, coef * UK, X);
    cote(ctx, KX + X, OY - 10, KX + X + coef * UK, OY - 10, `b = ${coef}`, p.dim);
  } else {
    tile(ctx, KX + X, OY, Hh, X, p.ok, UK);
    label(ctx, KX + X + Hh / 2, OY + X / 2, ['(b/2)·x', `= ${h * x}`], p.text, Hh, X);
    cote(ctx, KX + X, OY - 10, KX + X + Hh, OY - 10, `b/2 = ${h}`, p.dim);
    // La 2ᵉ bande pivote d'un quart de tour et vient se loger sous le carré.
    const cx = lerp(KX + X + 1.5 * Hh, KX + X / 2, move);
    const cy = lerp(OY + X / 2, OY + X + Hh / 2, move);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((move * Math.PI) / 2);
    tile(ctx, -Hh / 2, -X / 2, Hh, X, p.ok, UK);
    ctx.restore();
    const [lw, lh] = move > 0.5 ? [X, Hh] : [Hh, X];
    label(ctx, cx, cy, ['(b/2)·x', `= ${h * x}`], p.text, lw, lh);
    if (move === 0) cote(ctx, KX + X + Hh, OY - 10, KX + X + 2 * Hh, OY - 10, `b/2 = ${h}`, p.dim);
    if (move === 1) cote(ctx, KX - 10, OY + X, KX - 10, OY + X + Hh, `b/2 = ${h}`, p.dim);
  }
  cote(ctx, KX, OY - 10, KX + X, OY - 10, `x = ${x}`, p.dim);
  cote(ctx, KX - 10, OY, KX - 10, OY + X, `x = ${x}`, p.dim);
  const t = p.text;
  const tot = x * x + coef * x;
  const lines: [Seg[], Seg[]][] = [
    [[['x²', p.accent], [' + ', t], ['bx', p.ok], [`   avec x = ${x} et b = ${coef}`, p.dim]],
      [[`${x * x}`, p.accent], [' + ', t], [`${coef * x}`, p.ok], [` = ${tot}`, t]]],
    [[['x² + bx = ', t], ['x²', p.accent], [' + 2 · ', t], ['(b/2)·x', p.ok]],
      [[`${x * x}`, p.accent], [' + 2 × ', t], [`${h * x}`, p.ok], [` = ${tot}`, t], ['   même aire, en forme de L', p.dim]]],
    [[['x² + bx = (x + b/2)² − ', t], ['(b/2)²', p.warn]],
      [[`${x * x} + ${coef * x} = (${x} + ${h})² − `, t], [`${h}²`, p.warn], [` = ${(x + h) ** 2} − ${h * h} = ${tot} ✓`, t]]],
  ];
  const [l1, l2] = lines[step];
  segs(ctx, W / 2, H - 34, l1, '600 15px system-ui', true);
  segs(ctx, W / 2, H - 12, l2, '14px system-ui', true);
}

export function AlgebraTilesExplorer({ mode = 'product' }: { mode?: Mode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(4);
  const [b, setB] = useState(2);
  const [c, setC] = useState(3);
  const [d, setD] = useState(2);
  const [x, setX] = useState(5);
  const [coef, setCoef] = useState(6);
  const [step, setStep] = useState(0); // al-Khwarizmi : 0 départ, 1 coupé, 2 complété
  const [trap, setTrap] = useState(false);
  const anim = useRef({ move: 0, corner: 0, trap: 0 }); // valeurs animées 0 → 1

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pal = palette(canvas);
    const goal = { move: step >= 1 ? 1 : 0, corner: step >= 2 ? 1 : 0, trap: trap ? 1 : 0 };
    const speed = { move: 1 / 0.8, corner: 1 / 0.5, trap: 1 / 0.4 }; // 1 / durée (s)
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = anim.current;
      let busy = false;
      for (const key of ['move', 'corner', 'trap'] as const) {
        const gap = goal[key] - s[key];
        if (gap === 0) continue;
        busy = true;
        s[key] += Math.sign(gap) * Math.min(Math.abs(gap), speed[key] * dt);
      }
      ctx.clearRect(0, 0, W, H);
      if (mode === 'product') drawProduct(ctx, pal, a, b, c, d);
      else if (mode === 'square') drawSquare(ctx, pal, a, b, ease(s.trap));
      else drawComplete(ctx, pal, x, coef, step, ease(s.move), ease(s.corner));
      if (busy) raf = requestAnimationFrame(frame);
    };
    frame(last);
    return () => cancelAnimationFrame(raf);
  }, [mode, a, b, c, d, x, coef, step, trap]);

  const slider = (name: string, value: number, set: (v: number) => void, min: number, max: number, inc = 1) => (
    <label key={name}>
      {name} : {value}
      <input type="range" min={min} max={max} step={inc} value={value} onChange={(e) => set(Number(e.target.value))} />
    </label>
  );

  const restart = () => {
    Object.assign(anim.current, { move: 0, corner: 0 }); // on repart sans animation à rebours
    setStep(0);
  };

  let caption: string;
  if (mode === 'product') {
    caption =
      `Chaque morceau de la 1ʳᵉ parenthèse rencontre chaque morceau de la 2ᵉ : a·c, a·d, b·c, b·d — quatre tuiles, quatre termes. ` +
      `La double distribution n’est qu’un découpage d’aire : ${a * c} + ${a * d} + ${b * c} + ${b * d} = ${(a + b) * (c + d)}, ` +
      `exactement l’aire du rectangle ${a + b} × ${c + d}.` +
      (a === c && b === d ? ' Tiens : ici le rectangle est un carré — c’est l’identité (a + b)².' : '');
  } else if (mode === 'square') {
    const s = a + b;
    caption = trap
      ? `Le piège : écrire (a + b)² = a² + b², c’est oublier les deux rectangles. Ici a² + b² = ${a * a + b * b}, ` +
        `mais le carré entier vaut ${s * s} : il manque 2ab = ${2 * a * b}, soit ${Math.round((200 * a * b) / (s * s))} % de l’aire !`
      : `Le carré de côté a + b = ${s} se découpe en quatre : le carré a² = ${a * a}, le carré b² = ${b * b}, et DEUX rectangles ` +
        `a × b identiques (① et ②). D’où (a + b)² = a² + 2ab + b² : ${s * s} = ${a * a} + ${2 * a * b} + ${b * b}.`;
  } else {
    const h = coef / 2;
    caption = [
      `Al-Khwarizmi (Bagdad, vers 820) écrit tout en mots et justifie par des aires : x² est un carré de côté ${x}, ` +
        `bx un rectangle ${coef} × ${x}. Son idée : couper le rectangle en deux.`,
      `Deux bandes de ${h} × ${x} ; l’une pivote et se loge sous le carré. Même aire (${x * x + coef * x}), mais la figure ` +
        `est un L presque carré… il ne manque qu’un coin de ${h} × ${h}.`,
      `On ajoute le coin (b/2)² = ${h * h} — et on le retire aussitôt pour ne pas tricher : x² + ${coef}x = (x + ${h})² − ${h * h}. ` +
        `C’est « compléter le carré », la clé de toutes les équations du second degré.`,
    ][step];
  }

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {mode === 'complete' ? (
          <>
            {slider('x', x, setX, 1, 8)}
            {slider('b', coef, setCoef, 2, 10, 2)}
            <button type="button" className={`btn ${step === 0 ? 'btn-primary' : ''}`} disabled={step !== 0} onClick={() => setStep(1)}>Couper en deux</button>
            <button type="button" className={`btn ${step === 1 ? 'btn-primary' : ''}`} disabled={step !== 1} onClick={() => setStep(2)}>Compléter le carré</button>
            <button type="button" className="btn btn-ghost" onClick={restart}>Recommencer</button>
          </>
        ) : (
          <>
            {slider('a', a, setA, 1, 6)}
            {slider('b', b, setB, 1, 6)}
            {mode === 'product' && slider('c', c, setC, 1, 6)}
            {mode === 'product' && slider('d', d, setD, 1, 6)}
            {mode === 'square' && (
              <button type="button" className={`btn ${trap ? 'btn-primary' : ''}`} onClick={() => setTrap((v) => !v)}>Le piège a² + b²</button>
            )}
          </>
        )}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }} />
      <p className="physics-caption">{caption}</p>
    </div>
  );
}
