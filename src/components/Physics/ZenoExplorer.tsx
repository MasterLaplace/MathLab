import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le paradoxe de Zénon, désamorcé par les séries géométriques.
 * « square » : un carré d'aire 1 rempli par 1/2 + 1/4 + 1/8 + … — une infinité
 * de morceaux, une aire finie. « race » : Achille et la tortue — une infinité
 * d'étapes, mais des durées 1 + 0,1 + 0,01 + … = 10/9 s : il la rattrape.
 */

const W = 560;
const H = 300;
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
const SUB = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n: number) => String(n).replace('-', '⁻').replace(/\d/g, (c) => SUP[Number(c)]);
const sub = (n: number) => String(n).replace(/\d/g, (c) => SUB[Number(c)]);
const fr = (x: number, d: number) => x.toFixed(d).replace('.', ',').replace('-', '−');

type Ctx = CanvasRenderingContext2D;
function setupCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const css = getComputedStyle(canvas);
  return { ctx, col: (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback };
}
/** Trait de (x1, y1) à (x2, y2), éventuellement pointillé. */
function seg(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, color: string, dash: number[] = []) {
  ctx.strokeStyle = color;
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

export function ZenoExplorer({ mode = 'square' }: { mode?: 'square' | 'race' }) {
  return mode === 'race' ? <ZenoRace /> : <ZenoSquare />;
}

/* ───────────── Le carré : r + r² + r³ + … = r/(1 − r) ───────────── */

const SIDE = 270;
const OX = 14;
const OY = 15;
/** Nombre d'étages dessinés selon m = 1/r (au-delà, plus petit qu'un pixel). */
const NMAX: Record<number, number> = { 2: 12, 3: 8, 4: 7 };

interface Rect { x: number; y: number; w: number; h: number }
interface Piece extends Rect { level: number; colored: boolean }

/**
 * Découpe le reste en m parts égales : 1 coloriée (aire 1/mᵏ), m − 2 jumelles
 * grisées, et la dernière devient le nouveau reste. Bandes en spirale pour
 * m = 2 et 3, quadrants emboîtés pour m = 4.
 */
function cutSquare(m: number, n: number): { pieces: Piece[]; rest: Rect } {
  const pieces: Piece[] = [];
  let { x, y, w, h } = { x: 0, y: 0, w: 1, h: 1 };
  for (let k = 1; k <= n; k++) {
    if (m === 4) {
      const [hw, hh] = [w / 2, h / 2];
      pieces.push({ x: x + hw, y, w: hw, h: hh, level: k, colored: true });
      pieces.push({ x, y, w: hw, h: hh, level: k, colored: false });
      pieces.push({ x: x + hw, y: y + hh, w: hw, h: hh, level: k, colored: false });
      [y, w, h] = [y + hh, hw, hh];
      continue;
    }
    const dir = (k - 1) % 4; // 0 : depuis la gauche, 1 : le haut, 2 : la droite, 3 : le bas
    const len = dir % 2 === 0 ? w / m : h / m;
    for (let j = 0; j < m - 1; j++) {
      const p: Piece = { x, y, w, h, level: k, colored: j === 0 };
      if (dir === 0) Object.assign(p, { x: x + j * len, w: len });
      else if (dir === 1) Object.assign(p, { y: y + j * len, h: len });
      else if (dir === 2) Object.assign(p, { x: x + w - (j + 1) * len, w: len });
      else Object.assign(p, { y: y + h - (j + 1) * len, h: len });
      pieces.push(p);
    }
    const used = (m - 1) * len;
    if (dir === 0) x += used;
    if (dir === 1) y += used;
    if (dir % 2 === 0) w -= used;
    else h -= used;
  }
  return { pieces, rest: { x, y, w, h } };
}

const frac = (num: number, den: number) => (den === 1 ? String(num) : `${num}/${den}`);

function ZenoSquare() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [m, setM] = useState(2); // raison r = 1/m
  const [n, setN] = useState(0);
  const [filling, setFilling] = useState(false);
  const addedAt = useRef(0);
  const nMax = NMAX[m];

  useEffect(() => {
    if (!filling || n >= nMax) return;
    const id = setTimeout(() => {
      addedAt.current = performance.now();
      setN(n + 1);
    }, 420);
    return () => clearTimeout(id);
  }, [filling, n, nMax]);

  useEffect(() => {
    const setup = canvasRef.current && setupCanvas(canvasRef.current);
    if (!setup) return;
    const { ctx, col } = setup;
    const [cAcc, cDim, cText, cWarn, cBg] = [col('--accent', '#6a8dff'), col('--text-dim', '#9aa2bd'), col('--text', '#e8eaf2'), col('--warn', '#ffb454'), col('--surface-2', '#222840')];
    const { pieces, rest } = cutSquare(m, n);
    const den = m ** n;
    const num = (den - 1) / (m - 1); // Sₙ = (1 + m + … + mⁿ⁻¹)/mⁿ, déjà irréductible
    const terms = Array.from({ length: n }, (_, k) => `1/${m ** (k + 1)}`);
    const sumText = n <= 3 ? terms.join(' + ') : `${terms[0]} + ${terms[1]} + … + ${terms[n - 1]}`;

    const draw = (fade: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.textAlign = 'center';
      for (const pc of pieces) {
        const [X, Y, w, h] = [OX + pc.x * SIDE, OY + pc.y * SIDE, pc.w * SIDE, pc.h * SIDE];
        const a = pc.level === n ? fade : 1;
        ctx.globalAlpha = a * (pc.colored ? (pc.level % 2 ? 0.95 : 0.72) : 0.22);
        ctx.fillStyle = pc.colored ? cAcc : cDim;
        ctx.fillRect(X, Y, w, h);
        ctx.globalAlpha = a;
        ctx.strokeStyle = cBg;
        ctx.strokeRect(X + 0.5, Y + 0.5, Math.max(0, w - 1), Math.max(0, h - 1));
        const label = `1/${m ** pc.level}`;
        ctx.font = pc.level <= 2 ? '600 14px system-ui' : '12px system-ui';
        if (pc.colored && ctx.measureText(label).width + 6 < w && h > 18) {
          ctx.fillStyle = '#fff';
          ctx.fillText(label, X + w / 2, Y + h / 2 + 5);
        }
      }
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = cText;
      ctx.strokeRect(OX, OY, SIDE, SIDE);
      ctx.strokeStyle = cWarn; // le reste, encore à découper
      ctx.setLineDash([4, 3]);
      ctx.strokeRect(OX + rest.x * SIDE, OY + rest.y * SIDE, rest.w * SIDE, rest.h * SIDE);
      ctx.setLineDash([]);
      ctx.lineWidth = 1;

      ctx.textAlign = 'left';
      let y = 40;
      const line = (s: string, color: string, font = '13px system-ui', dy = 24) => {
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.fillText(s, OX + SIDE + 26, y);
        y += dy;
      };
      const big = '600 14px system-ui';
      line(`r = 1/${m} : on garde 1 part sur ${m}`, cDim);
      line(n === 0 ? 'S₀ = 0 : rien de colorié' : `S${sub(n)} = ${sumText}`, cText);
      if (n > 0) {
        line(`S${sub(n)} = ${m === 2 ? `1 − 1/2${sup(n)} = ` : ''}${frac(num, den)}`, cAcc, big);
        line(`S${sub(n)} ≈ ${fr(num / den, 8)}`, cAcc, big, 34);
      } else y += 24;
      line(`${m === 2 ? 'il reste' : 'écart à la limite'} : ${frac(1, (m - 1) * den)}`, cWarn, '13px system-ui', 34);
      line(`limite : r/(1 − r) = ${frac(1, m - 1)}`, cText, big);
      if (m > 2) line(m === 3 ? 'la MOITIÉ du carré' : 'le TIERS du carré', cDim);
    };

    let raf = 0;
    const tick = () => {
      const fade = Math.min(1, (performance.now() - addedAt.current) / 300);
      draw(fade);
      if (fade < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [m, n]);

  let caption: string;
  if (n === 0) {
    caption =
      m === 2
        ? 'Un carré d’aire 1. « Ajouter un terme » colorie la moitié, puis la moitié de ce qui reste, puis encore la moitié… Combien de morceaux faut-il pour tout remplir ?'
        : `On découpe en ${m} : une part coloriée, ${m === 3 ? 'une part grisée (sa jumelle)' : 'deux parts grisées (ses jumelles)'}, et la dernière (en pointillé) est redécoupée de la même façon, et ainsi de suite.`;
  } else if (n < nMax) {
    caption =
      m === 2
        ? `${n} terme${n > 1 ? 's' : ''} : il reste un trou de 1/${2 ** n} (en pointillé). Chaque terme comble la moitié du trou : il ne disparaît à aucune étape finie, mais il devient plus petit que n’importe quel nombre choisi d’avance.`
        : `À chaque étage, le morceau colorié a ${m === 3 ? 'une jumelle grisée' : 'deux jumelles grisées'} de même taille. Coloriés et grisés finissent par tout remplir, à parts égales : le colorié tend vers 1/${m - 1} du carré.`;
  } else {
    const series = ['1/2 + 1/4 + 1/8 + … = 1', '1/3 + 1/9 + 1/27 + … = 1/2', '1/4 + 1/16 + 1/64 + … = 1/3'][m - 2];
    caption = `Une infinité de morceaux, une aire finie : Zénon confondait infini en nombre et infini en taille. ${series} — et en général r + r² + r³ + … = r/(1 − r) dès que |r| < 1.`;
  }

  const restart = () => {
    setN(0);
    setFilling(false);
  };
  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {[2, 3, 4].map((k) => (
          <button key={k} type="button" className={`btn ${m === k ? 'btn-primary' : ''}`} onClick={() => { setM(k); restart(); }}>
            r = 1/{k}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }} />
      <div className="physics-controls">
        <button
          type="button"
          className="btn btn-primary"
          disabled={n >= nMax}
          onClick={() => {
            setFilling(false);
            addedAt.current = performance.now();
            setN(Math.min(nMax, n + 1));
          }}
        >
          Ajouter un terme
        </button>
        <button type="button" className="btn" disabled={n >= nMax || filling} onClick={() => setFilling(true)}>
          Tout remplir
        </button>
        <button type="button" className="btn btn-ghost" onClick={restart}>
          Recommencer
        </button>
      </div>
      <p className="physics-caption">{caption}</p>
    </div>
  );
}

/* ───────────── La course : 1 + 0,1 + 0,01 + … = 10/9 s ───────────── */

const MEET_X = 100 / 9; // m : là où Achille rejoint la tortue
const MEET_T = 10 / 9; // s : quand
const T_END = 1.6;
const ZMAX = 10;
const X0 = -0.5;
const SPAN = 17; // piste : x ∈ [−0,5 ; 16,5] m
const TX0 = 20;
const TX1 = 540;
/** Instant où se termine l'étape k de Zénon : 1 + 0,1 + … + 10¹⁻ᵏ. */
const tAfter = (k: number) => MEET_T * (1 - 10 ** -k);
const duration = (k: number) => fr(10 ** (1 - k), Math.max(0, k - 1));
const ease = (u: number) => u * u * (3 - 2 * u);

function ZenoRace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zk, setZk] = useState(0); // étapes de Zénon effectuées
  const [play, setPlay] = useState(0); // ≠ 0 : numéro de la lecture continue en cours
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    const setup = canvasRef.current && setupCanvas(canvasRef.current);
    if (!setup) return;
    const { ctx, col } = setup;
    const [cAcc, cOk, cWarn, cText, cDim] = [col('--accent', '#6a8dff'), col('--ok', '#4cc38a'), col('--warn', '#ffb454'), col('--text', '#e8eaf2'), col('--text-dim', '#9aa2bd')];

    /** Une piste : la fenêtre [lo, lo + span] mètres, dessinée à la hauteur y. */
    const track = (y: number, lo: number, span: number, t: number) => {
      const X = (x: number) => TX0 + ((x - lo) / span) * (TX1 - TX0);
      seg(ctx, TX0, y + 10, TX1, y + 10, cDim);
      ctx.fillStyle = cWarn; // anciennes positions de la tortue = cibles des étapes
      for (let j = 1; j <= zk; j++) ctx.fillRect(X(10 + tAfter(j - 1)) - 1, y + 4, 2, 12);
      if (zk > 0 || play) seg(ctx, X(MEET_X), y - 24, X(MEET_X), y + 18, cText, [3, 3]);
      ctx.fillStyle = cOk;
      ctx.beginPath();
      ctx.ellipse(X(10 + t), y + 9, 11, 8, 0, Math.PI, 2 * Math.PI);
      ctx.arc(X(10 + t) + 13, y + 5, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText('tortue', X(10 + t), y + 40);
      disc(ctx, X(10 * t), y + 2, 8, cAcc);
      ctx.fillText('Achille', X(10 * t), y - 12);
      return X;
    };

    const draw = (t: number, zoom: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      const X = track(44, X0, SPAN, t);
      ctx.fillStyle = cDim;
      for (let m = 0; m <= 16; m += 2) ctx.fillText(m === 16 ? '16 m' : String(m), X(m), 70);
      if (zoom > 0.02) {
        // Loupe ×10ᵏ autour du rattrapage : la même scène, 10ᵏ fois plus petite.
        const span = SPAN / 10 ** zoom;
        const lo = MEET_X - (MEET_X - X0) / 10 ** zoom;
        ctx.globalAlpha = 0.3;
        seg(ctx, X(lo), 90, TX0, 122, cDim);
        seg(ctx, X(lo + span), 90, TX1, 122, cDim);
        ctx.globalAlpha = 1;
        track(144, lo, span, t);
        const k = Math.max(1, Math.round(zoom));
        const mag = k <= 3 ? ['1', '10', '100', '1 000'][k] : '10' + sup(k);
        ctx.fillStyle = cDim;
        ctx.textAlign = 'left';
        ctx.fillText(`loupe ×${mag} : la même scène, ${k > 1 ? `${mag} fois` : 'dix fois'} plus petite`, TX0, 200);
        ctx.textAlign = 'center';
      }
      // Axe du temps : les étapes s'entassent avant 10/9 s.
      const T = (s: number) => TX0 + (s / T_END) * (TX1 - TX0);
      const yA = 242;
      seg(ctx, TX0, yA, TX1, yA, cDim);
      ctx.fillStyle = cDim;
      for (const s of [0, 0.5, 1, 1.5]) {
        ctx.fillRect(T(s) - 0.5, yA - 3, 1, 6);
        ctx.fillText(`${fr(s, s % 1 ? 1 : 0)} s`, T(s), yA + 16);
      }
      seg(ctx, T(MEET_T), yA - 18, T(MEET_T), yA + 4, cText, [3, 3]);
      ctx.fillStyle = cText;
      ctx.fillText('10/9 s', T(MEET_T), yA - 22);
      for (let j = 1; j <= zk; j++) disc(ctx, T(tAfter(j)), yA, 3.5, cWarn);
      ctx.fillStyle = cAcc; // curseur du temps
      ctx.beginPath();
      ctx.moveTo(T(t), yA - 4);
      ctx.lineTo(T(t) - 6, yA - 13);
      ctx.lineTo(T(t) + 6, yA - 13);
      ctx.fill();
      let text = 'Durées des étapes de Zénon : à venir…';
      if (play) text = `t = ${fr(t, 3)} s · Achille : ${fr(10 * t, 2)} m · tortue : ${fr(10 + t, 2)} m`;
      else if (zk > 0) {
        const parts = Array.from({ length: Math.min(zk, 4) }, (_, j) => duration(j + 1)).join(' + ');
        text = `${parts}${zk > 4 ? ` + … (${zk} termes)` : ''} = ${fr(tAfter(zk), zk - 1)} s  →  10/9 = 1,111… s`;
      }
      ctx.font = '13px system-ui';
      ctx.fillStyle = cText;
      ctx.fillText(text, W / 2, 284);
    };

    let raf = 0;
    const t0 = performance.now();
    const tick = () => {
      const u = Math.max(0, performance.now() - t0) / 1000;
      if (play) {
        const t = Math.min(T_END, u * 0.45); // ralenti : 1 s simulée ≈ 2,2 s réelles
        draw(t, 0);
        if (t >= MEET_T) setPassed(true);
        if (t < T_END) raf = requestAnimationFrame(tick);
        return;
      }
      if (zk === 0) return draw(0, 0);
      const p = Math.min(1, u / 1.1); // d'abord le déplacement, puis le zoom ×10
      const move = ease(Math.min(1, p / 0.6));
      draw(tAfter(zk - 1) + (tAfter(zk) - tAfter(zk - 1)) * move, zk - 1 + ease(Math.max(0, (p - 0.65) / 0.35)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [zk, play]);

  let caption: string;
  if (play) {
    caption = passed
      ? 'À t = 10/9 ≈ 1,111 s, Achille (x = 10t) et la tortue (x = 10 + t) sont au même endroit : 100/9 ≈ 11,11 m. Puis il la dépasse, tout simplement. L’infinité d’étapes de Zénon tient tout entière dans ces 1,111… secondes.'
      : 'Le vrai mouvement, au ralenti : Achille court à 10 m/s, la tortue à 1 m/s avec 10 m d’avance. Regarde le curseur du temps approcher 10/9 s…';
  } else if (zk === 0) {
    caption =
      'Zénon : pour rattraper la tortue, Achille doit d’abord atteindre l’endroit où elle était… mais entre-temps elle a avancé. Et ainsi de suite, une infinité de fois. Alors, jamais ? Clique « Étape de Zénon ».';
  } else {
    caption = `Étape ${zk} : Achille met ${duration(zk)} s pour rejoindre l’ancienne position de la tortue (trait orange), qui a avancé de ${duration(zk)} m entre-temps. Les étapes sont infinies, mais leurs durées forment une série géométrique de raison 1/10 : 1 + 0,1 + 0,01 + … = 10/9 s. Dans la loupe, chaque étape est la précédente vue dix fois plus petite.`;
  }

  return (
    <div className="physics-sim">
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }} />
      <div className="physics-controls">
        <button type="button" className="btn btn-primary" disabled={!play && zk >= ZMAX} onClick={() => { setZk(play ? 1 : zk + 1); setPlay(0); }}>
          Étape de Zénon
        </button>
        <button type="button" className="btn" onClick={() => { setZk(0); setPassed(false); setPlay(play + 1); }}>
          Lecture continue
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { setZk(0); setPlay(0); }}>
          Recommencer
        </button>
      </div>
      <p className="physics-caption">{caption}</p>
    </div>
  );
}
