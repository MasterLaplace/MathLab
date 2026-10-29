import { useEffect, useMemo, useRef, useState } from 'react';
import './physics.css';

/**
 * Le triangle de Pascal, regardé de deux façons.
 * — « paths » : C(n, k) compte les chemins qui descendent du sommet jusqu'à la
 *   case (n, k) — n choix gauche/droite dont k à droite, exactement une bille
 *   de Galton — et chaque case est la somme de ses deux parents.
 * — « sierpinski » : colorié selon C(n, k) mod m, le triangle de Sierpiński
 *   (m = 2) et ses cousins (m = 3, 5) émergent : une fractale cachée dans la parité.
 */

type Mode = 'paths' | 'sierpinski';
interface Cell { n: number; k: number }

const W = 560;
const H = 400;
const SQ3 = Math.sqrt(3) / 2;
const MODULI = [2, 3, 5] as const;
const SPEED = 4.5; // rangées parcourues par seconde
const HOLD = 0.7; // pause (s) en bas de chaque chemin
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const VARS = ['--accent', '--ok', '--warn', '--text', '--text-dim', '--border'] as const;
const FALLBACK = ['#6a8dff', '#4cc38a', '#ffb454', '#e8eaf2', '#9aa2bd', '#2e3550'];

const sup = (n: number) => [...String(n)].map((c) => SUP[Number(c)]).join('');
const fr = (x: number) => x.toLocaleString('fr-FR');
const factorial = (n: number): number => (n <= 1 ? 1 : n * factorial(n - 1));
const readColors = (css: CSSStyleDeclaration) => VARS.map((v, i) => css.getPropertyValue(v).trim() || FALLBACK[i]);

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i;
  return Math.round(r);
}

/** Premier chemin dans l'ordre alphabétique (G < D) : n − k gauches puis k droites. */
const firstPath = (n: number, k: number) => Array.from({ length: n }, (_, i) => i >= n - k);
const wordOf = (p: boolean[]) => p.map((d) => (d ? 'D' : 'G')).join(' ');

/** Chemin suivant (permutation suivante) ; renvoie false quand on revient au premier. */
function nextPath(p: boolean[]): boolean {
  let i = p.length - 2;
  while (i >= 0 && !(!p[i] && p[i + 1])) i--;
  if (i < 0) {
    p.sort((a, b) => Number(a) - Number(b));
    return false;
  }
  let j = p.length - 1;
  while (!p[j]) j--;
  [p[i], p[j]] = [p[j], p[i]];
  p.push(...p.splice(i + 1).reverse());
  return true;
}

function pathsGeom(nMax: number) {
  const dx = Math.min(48, (W - 150) / (nMax + 1), (H - 40) / (nMax * SQ3 + 1));
  const top = (H - nMax * dx * SQ3) / 2;
  const cx = (W - 90) / 2;
  return { dx, dy: dx * SQ3, top, r: dx * 0.46, X: (n: number, k: number) => cx + (k - n / 2) * dx, Y: (n: number) => top + n * dx * SQ3 };
}

function sierGeom(rows: number) {
  const w = Math.min((W - 20) / rows, (H - 16) / (rows * SQ3));
  return { w, h: w * SQ3, top: (H - rows * w * SQ3) / 2, left: (n: number) => W / 2 - ((n + 1) * w) / 2 };
}

/** Table de C(n, k) mod m par la règle de Pascal, sans jamais former de grands entiers. */
function pascalMod(rows: number, m: number): Uint8Array {
  const t = new Uint8Array(rows * rows);
  for (let n = 0; n < rows; n++) {
    t[n * rows] = 1;
    t[n * rows + n] = 1;
    for (let k = 1; k < n; k++) t[n * rows + k] = (t[(n - 1) * rows + k - 1] + t[(n - 1) * rows + k]) % m;
  }
  return t;
}

const toBase = (x: number, m: number, len: number) => `${x.toString(m).padStart(len, '0')}${SUB[m]}`;

function setupCanvas(canvas: HTMLCanvasElement | null) {
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function PascalExplorer({ mode = 'paths' }: { mode?: Mode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nMax, setNMax] = useState(8);
  const [sel, setSel] = useState<Cell | null>({ n: 5, k: 2 });
  const anim = useRef({ path: firstPath(5, 2), idx: 1, t: 0 });
  const [pathInfo, setPathInfo] = useState({ idx: 1, word: wordOf(firstPath(5, 2)) });
  const [rows, setRows] = useState(64);
  const [m, setM] = useState(2);
  const [hover, setHover] = useState<Cell | null>(null);
  const [themeTick, setThemeTick] = useState(0);
  const table = useMemo(() => pascalMod(rows, m), [rows, m]);
  const colored = useMemo(() => table.reduce((acc, v) => acc + (v > 0 ? 1 : 0), 0), [table]);

  // Le mode Sierpiński est dessiné une fois : on le redessine si le thème change.
  useEffect(() => {
    const obs = new MutationObserver(() => setThemeTick((t) => t + 1));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== 'paths') return;
    const ctx = setupCanvas(canvasRef.current);
    if (!ctx) return;
    const css = getComputedStyle(ctx.canvas);
    const { dy, r, X, Y } = pathsGeom(nMax);
    const total = sel ? choose(sel.n, sel.k) : 1;
    const seg = (n: number, k: number, d: number) => {
      ctx.moveTo(X(n, k), Y(n));
      ctx.lineTo(X(n + 1, k + d), Y(n + 1));
    };
    const disc = (x: number, y: number, rad: number) => {
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
    };
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(frame);
      const [cAccent, cOk, cWarn, cText, cDim, cBorder] = readColors(css);
      const a = anim.current;
      if (sel && sel.n > 0) {
        a.t += dt * SPEED;
        if (a.t > sel.n + HOLD * SPEED) {
          a.t = 0;
          a.idx = nextPath(a.path) ? a.idx + 1 : 1;
          setPathInfo({ idx: a.idx, word: wordOf(a.path) });
        }
      }
      ctx.clearRect(0, 0, W, H);
      ctx.lineCap = 'round';

      // Toutes les descentes possibles (gauche : k reste, droite : k + 1).
      Object.assign(ctx, { strokeStyle: cBorder, lineWidth: 1, globalAlpha: 1 });
      ctx.beginPath();
      for (let n = 0; n < nMax; n++) for (let k = 0; k <= n; k++) for (const d of [0, 1]) seg(n, k, d);
      ctx.stroke();

      // Le flux des chemins vers la case choisie : épaisseur ∝ nombre de chemins par l'arête.
      for (let i = 0; sel && i < sel.n; i++) {
        for (let j = 0; j <= i; j++) for (const d of [0, 1]) {
          const [rest, need] = [sel.n - i - 1, sel.k - j - d]; // il reste `rest` choix dont `need` à droite
          if (need < 0 || need > rest) continue;
          const w = (choose(i, j) * choose(rest, need)) / total;
          if (i === sel.n - 1) Object.assign(ctx, { strokeStyle: cWarn, globalAlpha: 1, lineWidth: 3.5 }); // parent → case
          else Object.assign(ctx, { strokeStyle: cAccent, globalAlpha: 0.3 + 0.6 * w, lineWidth: 1.5 + 6 * w });
          ctx.beginPath();
          seg(i, j, d);
          ctx.stroke();
        }
      }

      // Le chemin courant, tracé en vert jusqu'à la bille.
      const pathK: number[] = sel && sel.n > 0 ? [0] : [];
      let [bx, by] = [X(0, 0), Y(0)];
      if (sel && sel.n > 0) {
        const tt = Math.min(a.t, sel.n);
        Object.assign(ctx, { strokeStyle: cOk, globalAlpha: 0.95, lineWidth: 4 });
        ctx.beginPath();
        ctx.moveTo(bx, by);
        for (let i = 0; i < sel.n && i < tt; i++) {
          const [j, j2] = [pathK[i], pathK[i] + (a.path[i] ? 1 : 0)];
          const f = Math.min(1, tt - i);
          [bx, by] = [X(i, j) + (X(i + 1, j2) - X(i, j)) * f, Y(i) + dy * f];
          ctx.lineTo(bx, by);
          if (f >= 1) pathK.push(j2);
        }
        ctx.stroke();
      }

      // Les cases : région des chemins (bleu pâle), case choisie, parents (orange), chemin courant (vert).
      Object.assign(ctx, { textAlign: 'center', textBaseline: 'middle' });
      for (let n = 0; n <= nMax; n++) {
        for (let k = 0; k <= n; k++) {
          const isSel = !!sel && n === sel.n && k === sel.k;
          const isParent = !!sel && n === sel.n - 1 && (k === sel.k - 1 || k === sel.k);
          Object.assign(ctx, { globalAlpha: 1, fillStyle: cBorder });
          disc(X(n, k), Y(n), r);
          ctx.fill();
          if (sel && n <= sel.n && k <= sel.k && n - k <= sel.n - sel.k) {
            Object.assign(ctx, { fillStyle: cAccent, globalAlpha: isSel ? 1 : 0.3 });
            ctx.fill();
            ctx.globalAlpha = 1;
          }
          if (isParent || pathK[n] === k) {
            Object.assign(ctx, { strokeStyle: isParent ? cWarn : cOk, lineWidth: isParent ? 3 : 2.5 });
            ctx.stroke();
          }
          Object.assign(ctx, { fillStyle: isSel ? '#fff' : cText, font: `${isSel || isParent ? '700 ' : ''}12px system-ui` });
          ctx.fillText(String(choose(n, k)), X(n, k), Y(n) + 0.5);
        }
      }
      ctx.fillStyle = cOk;
      disc(bx, by, sel && sel.n > 0 ? 5 : 0);
      ctx.fill();

      // Somme de chaque ligne : 2ⁿ.
      Object.assign(ctx, { textAlign: 'right', fillStyle: cDim, font: '12px system-ui' });
      ctx.fillText('somme de la ligne', W - 10, Y(0) - r - 8);
      for (let n = 0; n <= nMax; n++) {
        const strong = sel?.n === n;
        Object.assign(ctx, { fillStyle: strong ? cText : cDim, font: `${strong ? '700 ' : ''}12px system-ui` });
        ctx.fillText(`2${sup(n)} = ${fr(2 ** n)}`, W - 10, Y(n));
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [mode, nMax, sel]);

  useEffect(() => {
    if (mode !== 'sierpinski') return;
    const ctx = setupCanvas(canvasRef.current);
    if (!ctx) return;
    const [cAccent, cOk, cWarn, cText, , cBorder] = readColors(getComputedStyle(ctx.canvas));
    const pal = [cBorder, cAccent, cOk, cWarn, cText]; // reste 0 → case éteinte, 1…4 → une teinte chacun
    const g = sierGeom(rows);
    ctx.clearRect(0, 0, W, H);
    for (let n = 0; n < rows; n++) {
      for (let k = 0; k <= n; k++) {
        const v = table[n * rows + k];
        Object.assign(ctx, { fillStyle: pal[v], globalAlpha: v === 0 ? 0.45 : 1 });
        ctx.fillRect(g.left(n) + k * g.w, g.top + n * g.h, g.w + 0.4, g.h + 0.4);
      }
    }
    ctx.globalAlpha = 1;
    if (hover && hover.n < rows) {
      Object.assign(ctx, { strokeStyle: cText, lineWidth: 1.5 });
      ctx.strokeRect(g.left(hover.n) + hover.k * g.w - 1.5, g.top + hover.n * g.h - 1.5, g.w + 3, g.h + 3);
    }
  }, [mode, rows, table, hover, themeTick]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, click: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    if (mode === 'sierpinski') {
      const g = sierGeom(rows);
      const n = Math.floor((py - g.top) / g.h);
      const k = Math.floor((px - g.left(n)) / g.w);
      setHover(n >= 0 && n < rows && k >= 0 && k <= n ? { n, k } : null);
      return;
    }
    const g = pathsGeom(nMax);
    const n = Math.round((py - g.top) / g.dy);
    const k = Math.round((px - g.X(n, 0)) / g.dx);
    if (!click || n < 0 || n > nMax || k < 0 || k > n) return;
    if (Math.hypot(px - g.X(n, k), py - g.Y(n)) > g.dx * 0.55) return;
    anim.current = { path: firstPath(n, k), idx: 1, t: 0 };
    setPathInfo({ idx: 1, word: wordOf(anim.current.path) });
    setSel({ n, k });
  };

  const changeRows = (v: number) => {
    setNMax(v);
    if (sel && sel.n > v) setSel(null);
  };

  const c = sel ? choose(sel.n, sel.k) : 0;
  const powers = [1, 2, 3, 4, 5, 6, 7].map((j) => m ** j).filter((p) => p >= 8 && p <= 128);
  const dim = Math.log((m * (m + 1)) / 2) / Math.log(m);
  const hv = hover && hover.n < rows ? { ...hover, r: table[hover.n * rows + hover.k] } : null;
  const len = hv ? hv.n.toString(m).length : 0;

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {mode === 'paths' ? (
          <label>
            lignes : {nMax}
            <input type="range" min={4} max={12} value={nMax} onChange={(e) => changeRows(Number(e.target.value))} />
          </label>
        ) : (
          <>
            {MODULI.map((v) => (
              <button key={v} type="button" className={`btn ${m === v ? 'btn-primary' : ''}`} onClick={() => setM(v)}>
                mod {v}
              </button>
            ))}
            <label>
              lignes : {rows}
              <input type="range" min={8} max={128} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
            </label>
          </>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: 'auto', aspectRatio: `${W} / ${H}`, maxWidth: '100%', touchAction: 'none', cursor: mode === 'paths' ? 'pointer' : 'crosshair' }}
        onPointerDown={(e) => onPointer(e, true)}
        onPointerMove={(e) => onPointer(e, false)}
        onPointerLeave={() => setHover(null)}
      />
      {mode === 'paths' && sel && (
        <>
          <p className="physics-caption" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
            C({sel.n}, {sel.k}) = {sel.n}!/({sel.k}!·{sel.n - sel.k}!) = {fr(factorial(sel.n))}/(
            {fr(factorial(sel.k))}·{fr(factorial(sel.n - sel.k))}) = <strong>{fr(c)}</strong>
          </p>
          <p className="physics-caption">
            {sel.n === 0
              ? 'Le sommet : point de départ, sans parent.'
              : sel.k === 0 || sel.k === sel.n
                ? `Au bord, un seul parent (cerclé d’orange) : on n’y arrive qu’en allant toujours ${sel.k === 0 ? 'à gauche' : 'à droite'}.`
                : `Règle de Pascal : C(${sel.n - 1}, ${sel.k - 1}) + C(${sel.n - 1}, ${sel.k}) = ${fr(choose(sel.n - 1, sel.k - 1))} + ${fr(choose(sel.n - 1, sel.k))} = ${fr(c)}. Tout chemin arrive par l’un des deux parents cerclés d’orange — jamais par les deux.`}
          </p>
          <p className="physics-caption">
            <strong>{`${fr(c)} chemin${c > 1 ? 's mènent' : ' mène'} du sommet à cette case`}</strong>{' '}
            (épaisseur d’un trait = nombre de chemins qui l’empruntent).{' '}
            {sel.n === 0 ? 'Ici, c’est le chemin vide : aucun choix.' : `En vert, le chemin n° ${pathInfo.idx}/${fr(c)} : ${pathInfo.word}.`}
          </p>
          <p className="physics-caption">
            Chaque chemin = une suite de {sel.n} choix gauche/droite dont {sel.k} à droite : c’est exactement
            une bille de la planche de Galton ! Une bille arrive donc ici avec la probabilité C(n, k)/2ⁿ ={' '}
            {fr(c)}/{fr(2 ** sel.n)} ≈ {(c / 2 ** sel.n).toLocaleString('fr-FR', { maximumSignificantDigits: 3 })}.
            Et la somme de la ligne n vaut 2ⁿ (colonne de droite) : tous les chemins de n choix, chacun
            aboutissant quelque part.
          </p>
        </>
      )}
      {mode === 'paths' && !sel && <p className="physics-caption">Clique une case pour voir tous les chemins qui y descendent.</p>}
      {mode === 'sierpinski' && (
        <>
          <p className="physics-caption" style={{ color: 'var(--text)', minHeight: '2.6em' }}>
            {hv
              ? `Ligne ${hv.n}, case ${hv.k} : C(${hv.n}, ${hv.k}) ≡ ${hv.r} (mod ${m})${m === 2 ? (hv.r ? ' — impair' : ' — pair') : ''}. En base ${m} : n = ${toBase(hv.n, m, len)}, k = ${toBase(hv.k, m, len)} — ${hv.r === 0 ? `un chiffre de k dépasse le chiffre de n au-dessus de lui : divisible par ${m}` : `chaque chiffre de k reste sous celui de n : pas divisible par ${m}`} (théorème de Lucas, 1878).`
              : 'Survole une case pour lire son reste et ses chiffres en base m.'}
          </p>
          <p className="physics-caption">
            Case colorée = C(n, k) <strong>non divisible par {m}</strong> (une couleur par reste), case
            éteinte = divisible. {m === 2 ? 'Impair/pair : le triangle de Sierpiński émerge. ' : ''}Pascal
            (1654) ne l’a pas vu : la fractale était cachée dans la parité. Lucas l’explique : la ligne
            {` ${m}ʲ`} vaut 1 0 0 … 0 0 1 modulo {m}, et l’addition fait alors repartir le motif en copies de
            lui-même. Ici {fr(colored)} cases
            colorées sur {fr((rows * (rows + 1)) / 2)} ; cette proportion tend vers 0 (dimension fractale
            log {(m * (m + 1)) / 2}/log {m} ≈ {dim.toFixed(3).replace('.', ',')}). Essaie {powers.join(', ')}{' '}
            lignes : le motif se referme exactement.
          </p>
        </>
      )}
    </div>
  );
}
