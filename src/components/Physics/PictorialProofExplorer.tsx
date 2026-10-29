import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Les « preuves sans mots » : 1 + 3 + … + (2n − 1) = n² (des équerres qui
 * s'emboîtent), 1 + 2 + … + n = n(n + 1)/2 (deux escaliers font un rectangle),
 * 1/4 + 1/16 + … = 1/3 (trois couleurs se partagent le carré). Le dessin EST la
 * preuve pour chaque n ; la récurrence (Phase 18) la rend valable pour tous.
 */

type Mode = 'odd' | 'triangular' | 'geometric';
type Colors = ReturnType<typeof theme>;

const W = 560;
const H = 370;
const CS = 30; // côté d'une case (équerres)
const X0 = 30;
const Y0 = 52;
const SQ = 300; // côté du grand carré (série géométrique)
const BASE = 336; // ligne de sol des escaliers
const INK = '#141824'; // texte posé sur une case colorée
const ease = (p: number) => p * p * (3 - 2 * p);
const hue = (k: number) => `hsl(${(200 + k * 37) % 360}, 70%, 62%)`;
const sup = (n: number) => [...String(n)].map((d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]).join('');
const fr = (v: number, d: number) => v.toFixed(d).replace('.', ',');
/** « 1 + 3 + 5 + … + 19 » : les trois premiers termes, puis le dernier. */
const series = (terms: string[]) => (terms.length <= 4 ? terms.join(' + ') : `${terms.slice(0, 3).join(' + ')} + … + ${terms[terms.length - 1]}`);
const range = (n: number) => Array.from({ length: n }, (_, k) => k + 1);

function theme(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  return { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'), text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd'), bg: v('--surface-2', '#222840') };
}

/** Une case pleine, bordée de la couleur du fond pour que les carreaux se voient. */
function cell(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: Colors): void {
  ctx.fillRect(x, y, s, s);
  ctx.strokeStyle = c.bg;
  ctx.lineWidth = Math.min(2, s / 8);
  ctx.strokeRect(x, y, s, s);
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, col: string, align: CanvasTextAlign = 'center'): void {
  ctx.fillStyle = col;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

/** Équerre k = les cases où max(ligne, colonne) = k − 1 : k en bas, k − 1 sur le côté. */
function drawOdd(ctx: CanvasRenderingContext2D, c: Colors, n: number, v: number): void {
  ctx.font = '600 12px system-ui';
  for (let k = 1; k <= n; k++) {
    const off = k === n ? (1 - v) * 1.5 * CS : 0; // la nouvelle équerre glisse en place
    ctx.globalAlpha = k === n ? 0.2 + 0.8 * v : 1;
    ctx.fillStyle = hue(k);
    for (let j = 0; j < k; j++) {
      cell(ctx, X0 + j * CS + off, Y0 + (k - 1) * CS + off, CS, c);
      if (j < k - 1) cell(ctx, X0 + (k - 1) * CS + off, Y0 + j * CS + off, CS, c);
    }
    label(ctx, String(2 * k - 1), X0 + (k - 0.5) * CS + off, Y0 + (k - 0.5) * CS + off + 4, INK);
    // Le tableau des sommes partielles, à droite.
    const ty = Y0 + 14 + (k - 1) * 28;
    ctx.fillStyle = hue(k);
    ctx.fillRect(370, ty - 10, 12, 12);
    label(ctx, `${k === 1 ? '  ' : '+ '}${2 * k - 1}`, 392, ty, c.text, 'left');
    label(ctx, `→  ${k * k} = ${k}²`, 440, ty, c.dim, 'left');
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.text;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(X0, Y0, n * CS, n * CS);
  const terms = range(n).map((k) => String(2 * k - 1));
  label(ctx, `${series(terms)} = ${n * n} = ${n}²`, X0, 20, c.text, 'left');
  ctx.font = '12px system-ui';
  label(ctx, 'équerre k : k cases en bas + (k − 1) sur le côté = 2k − 1 cases', X0, 38, c.dim, 'left');
}

/** L'escalier 1, 2, …, n et sa copie, tournée de π·v puis remontée d'une case. */
function drawTri(ctx: CanvasRenderingContext2D, c: Colors, n: number, v: number): void {
  const cs = Math.min(36, 520 / (2 * n + 1), 280 / (n + 1));
  const x0 = (W - (2 * n + 1) * cs) / 2;
  const th = Math.PI * v;
  const [tx, ty] = [(n + 1) * (1 - v), v + 1.2 * Math.sin(Math.PI * v)];
  ctx.font = '12px system-ui';
  ctx.fillStyle = c.accent;
  for (let j = 0; j < n; j++) for (let r = 0; r <= j; r++) cell(ctx, x0 + j * cs, BASE - (r + 1) * cs, cs, c);
  for (let j = 0; j < n; j++) {
    for (let r = 0; r <= j; r++) {
      const [lx, ly] = [j + 0.5 - n / 2, r + 0.5 - n / 2];
      const rx = lx * Math.cos(th) - ly * Math.sin(th) + n / 2 + tx;
      const ry = lx * Math.sin(th) + ly * Math.cos(th) + n / 2 + ty;
      ctx.save();
      ctx.translate(x0 + rx * cs, BASE - ry * cs);
      ctx.rotate(-th);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = c.warn;
      cell(ctx, -cs / 2, -cs / 2, cs, c);
      ctx.restore();
    }
    label(ctx, String(j + 1), x0 + (j + 0.5) * cs, BASE + 15, c.dim);
  }
  const S = (n * (n + 1)) / 2;
  const sum = series(range(n).map(String));
  ctx.font = '600 12px system-ui';
  if (v < 0.99) {
    label(ctx, `${sum} = ?`, 20, 20, c.text, 'left');
    ctx.font = '12px system-ui';
    label(ctx, 'Compter case par case ? Plus malin : « Dupliquer et retourner ».', 20, 38, c.dim, 'left');
    return;
  }
  label(ctx, `2 × (${sum}) = ${n} × ${n + 1} = ${2 * S}`, 20, 20, c.text, 'left');
  label(ctx, `donc ${sum} = ${n}·${n + 1}/2 = ${S}`, 20, 38, c.ok, 'left');
  const top = BASE - (n + 1) * cs;
  ctx.strokeStyle = c.text;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, top, n * cs, (n + 1) * cs);
  ctx.font = '12px system-ui';
  label(ctx, `n = ${n}`, x0 + (n * cs) / 2, top - 7, c.text);
  label(ctx, `n + 1 = ${n + 1}`, x0 + n * cs + 10, (top + BASE) / 2 + 4, c.text, 'left');
}

/** À chaque étage, les 3 quarts en L prennent une couleur chacun ; le 4ᵉ est redécoupé. */
function drawGeo(ctx: CanvasRenderingContext2D, c: Colors, depth: number, v: number): void {
  const cols = [c.accent, c.ok, c.warn];
  let [x, y, size] = [X0, Y0, SQ];
  ctx.font = '600 12px system-ui';
  for (let k = 1; k <= depth; k++) {
    const h = size / 2;
    ctx.globalAlpha = k === depth ? v : 1;
    for (const [m, [qx, qy]] of [[x, y], [x + h, y], [x, y + h]].entries()) {
      ctx.fillStyle = cols[m];
      cell(ctx, qx, qy, h, c);
      if (h >= 30) label(ctx, `1/${4 ** k}`, qx + h / 2, qy + h / 2 + 4, INK);
    }
    [x, y, size] = [x + h, y + h, h];
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = c.dim;
  ctx.lineWidth = 1;
  ctx.strokeRect(X0, Y0, SQ, SQ);
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(x, y, size, size);
  ctx.setLineDash([]);
  const den = 4 ** depth;
  const num = (den - 1) / 3; // chaque couleur couvre exactement num/den du carré
  const big = (k: number) => k.toLocaleString('fr-FR');
  const terms = range(depth).map((k) => `1/4${k === 1 ? '' : sup(k)}`);
  label(ctx, `chaque couleur : ${series(terms)}`, X0, 20, c.text, 'left');
  ctx.font = '12px system-ui';
  label(ctx, `= (1 − 1/4${sup(depth)})/3 ≈ ${fr(num / den, 7)}`, X0, 38, c.dim, 'left');
  const lines: [string, string][] = [
    [c.accent, `bleu : ${big(num)}/${big(den)}`],
    [c.ok, `vert : ${big(num)}/${big(den)}`],
    [c.warn, `orange : ${big(num)}/${big(den)}`],
    [c.dim, `reste blanc : 1/${big(den)}`],
  ];
  for (const [i, [col, txt]] of lines.entries()) {
    ctx.fillStyle = col;
    ctx.fillRect(370, Y0 + 4 + i * 26, 12, 12);
    label(ctx, txt, 390, Y0 + 15 + i * 26, c.text, 'left');
  }
  label(ctx, `3 × ${big(num)} + 1 = ${big(den)}`, 370, Y0 + 136, c.dim, 'left'); // les 3 couleurs + le reste = tout
  label(ctx, 'le reste fond : 1/4ⁿ → 0', 370, Y0 + 156, c.dim, 'left');
  ctx.font = '600 12px system-ui';
  label(ctx, '⇒ chaque couleur → 1/3', 370, Y0 + 180, c.ok, 'left');
}

export function PictorialProofExplorer({ mode = 'odd' }: { mode?: Mode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(mode === 'geometric' ? 3 : 5);
  const [merged, setMerged] = useState(false);
  const animRef = useRef({ from: 1, start: -Infinity, v: 1 }); // v : avancement affiché (0 → 1)

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const target = mode === 'triangular' && !merged ? 0 : 1;
    const dur = mode === 'triangular' ? 1200 : 600;
    let raf = 0;
    const draw = (now: number) => {
      const a = animRef.current;
      const p = Math.min(1, Math.max(0, (now - a.start) / dur));
      a.v = a.from + (target - a.from) * ease(p);
      const c = theme(canvas);
      ctx.clearRect(0, 0, W, H);
      if (mode === 'odd') drawOdd(ctx, c, n, a.v);
      else if (mode === 'triangular') drawTri(ctx, c, n, a.v);
      else drawGeo(ctx, c, n, a.v);
      if (p < 1) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, n, merged]);

  /** Fait apparaître le nouvel élément (équerre, étage) ou lance le retournement. */
  const animateFrom = (from: number) => {
    animRef.current = { from, start: performance.now(), v: from };
  };
  const grow = () => {
    animateFrom(0);
    setN((k) => Math.min(10, k + 1));
  };
  const flip = () => {
    animateFrom(animRef.current.v);
    setMerged((m) => !m);
  };

  const geo = mode === 'geometric';
  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          {geo ? 'profondeur' : 'n'} = {n}
          <input type="range" min={1} max={10} value={n} onChange={(e) => { animRef.current.start = -Infinity; setN(Number(e.target.value)); }} />
        </label>
        {mode === 'triangular' ? (
          <button type="button" className={`btn ${merged ? '' : 'btn-primary'}`} onClick={flip}>
            {merged ? 'Séparer' : 'Dupliquer et retourner'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled={n >= 10} onClick={grow}>
            {geo ? 'Découper le quart suivant' : 'Ajouter l’équerre suivante'}
          </button>
        )}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }} />
      <p className="physics-caption">
        Ce qu’on voit <strong>EST</strong> la preuve — mais pour un seul n à la fois. La récurrence (Phase 18) la rend valable pour tous :{' '}
        {mode === 'odd' && 'si 1 + 3 + … + (2n − 1) = n², ajouter l’équerre 2n + 1 à un carré n² donne n² + 2n + 1 = (n + 1)², le carré suivant. L’équerre k compte 2k − 1 cases : k en bas, k − 1 sur le côté — le coin n’est compté qu’une fois.'}
        {mode === 'triangular' && 'ajouter la colonne n + 1 à l’escalier donne n(n + 1)/2 + (n + 1) = (n + 1)(n + 2)/2. L’image, elle, raconte le coup de Gauss écolier : pour 1 + 2 + … + 100, il apparie 1 et 100, 2 et 99… cinquante paires de 101, donc 5050 — chaque colonne de la copie complète celle d’en face à exactement n + 1.'}
        {mode === 'geometric' && 'après n étages chaque couleur couvre (1 − 1/4ⁿ)/3 ; l’étage suivant lui ajoute 1/4ⁿ⁺¹, et (1 − 1/4ⁿ)/3 + 1/4ⁿ⁺¹ = (1 − 1/4ⁿ⁺¹)/3. Trois couleurs qui grandissent au même rythme, un reste blanc qui fond comme 1/4ⁿ : à la limite elles se partagent tout le carré, donc 1/4 + 1/16 + 1/64 + … = 1/3.'}
      </p>
    </div>
  );
}
