import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Les deux urnes d'Ehrenfest (1907) : la flèche du temps comme simple comptage.
 * N particules partent toutes à gauche ; à chaque tic, une particule tirée au
 * hasard passe de l'autre côté. Rien n'interdit le retour… mais C(N, n) façons
 * d'avoir n particules à gauche écrasent l'unique état « tout rangé » : temps
 * moyen de retour 2^N tics (lemme de Kac).
 */

const W = 560;
const H = 400;
const SIZES = [4, 10, 50, 400] as const;
const SPEEDS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
const DEFAULT_SPEED: Record<number, number> = { 4: 2, 10: 4, 50: 5, 400: 7 };
const BOX = { x: 10, y: 24, w: 280, h: 148 };
const WALL = BOX.x + BOX.w / 2;
const HOLE_Y = BOX.y + BOX.h / 2;
const HOLE = 16; // demi-hauteur du trou dans la paroi
const HIST = { x: 314, y: 24, w: 236, h: 148 };
const PLOT = { x: 40, y: 214, w: 510, h: 158 };
const MAX_WIN = 1600;
const AGE_LOG10 = Math.log10(4.35e17); // âge de l'univers en secondes
const YEAR_LOG10 = Math.log10(3.156e7);
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';

/** tr : progression du passage par le trou (−1 : libre dans sa moitié), de (sx, sy) à (ex, ey) via (WALL, hy). */
interface Particle { x: number; y: number; vx: number; vy: number; tr: number; dur: number; sx: number; sy: number; hy: number; ex: number; ey: number }

/** side : 0 = gauche, 1 = droite ; hist : tics passés dans chaque état n ; ring : n(t) récents. */
interface Sim {
  N: number; side: Uint8Array; nLeft: number; t: number; hist: Float64Array; ring: Int16Array;
  returns: number; lastVisit: number; sumGaps: number; acc: number; logFact: Float64Array; parts: Particle[];
}

const VARS = ['--accent', '--ok', '--warn', '--text', '--text-dim'] as const;
const FALLBACK = ['#6a8dff', '#4cc38a', '#ffb454', '#e8eaf2', '#9aa2bd'];

const sup = (n: number) => [...String(n)].map((c) => SUP[Number(c)]).join('');
const dec = (x: number, d: number) => x.toFixed(d).replace('.', ',');
const radius = (N: number) => (N <= 4 ? 7 : N <= 10 ? 5.5 : N <= 50 ? 3.5 : 2.2);

function sci(log10v: number): string {
  const e = Math.floor(log10v);
  const m = 10 ** (log10v - e);
  return m >= 9.995 ? `1,00·10${sup(e + 1)}` : `${dec(m, 2)}·10${sup(e)}`;
}

/** « = 16 » si c'est un entier lisible, « ≈ 2,58·10¹²⁰ » sinon. */
const big = (log10v: number) =>
  log10v < 6 ? `= ${Math.round(10 ** log10v).toLocaleString('fr-FR')}` : `≈ ${sci(log10v)}`;

function duration(log10s: number): string {
  const s = 10 ** log10s;
  if (s < 120) return `${dec(s, s < 10 ? 1 : 0)} s`;
  if (s < 7200) return `${dec(s / 60, 0)} min`;
  if (s < 172800) return `${dec(s / 3600, 1)} h`;
  if (s < 6.3e7) return `${dec(s / 86400, 0)} jours`;
  const y = log10s - YEAR_LOG10;
  if (log10s < AGE_LOG10) return `${y < 6 ? (10 ** y).toLocaleString('fr-FR', { maximumSignificantDigits: 3 }) : sci(y)} ans`;
  return `${sci(log10s - AGE_LOG10)} fois l’âge de l’univers`;
}

/** ln C(N, n), sans jamais former le grand entier. */
function lnChoose(N: number, n: number): number {
  let r = 0;
  for (let i = 1; i <= n; i++) r += Math.log((N - n + i) / i);
  return r;
}

function bounds(side: number, rad: number): [number, number, number, number] {
  const x0 = side === 0 ? BOX.x + rad + 2 : WALL + rad + 3;
  const x1 = side === 0 ? WALL - rad - 3 : BOX.x + BOX.w - rad - 2;
  return [x0, x1, BOX.y + rad + 2, BOX.y + BOX.h - rad - 2];
}

function makeSim(N: number): Sim {
  const logFact = new Float64Array(N + 1);
  for (let i = 1; i <= N; i++) logFact[i] = logFact[i - 1] + Math.log(i);
  const [x0, x1, y0, y1] = bounds(0, radius(N));
  const parts = Array.from({ length: N }, () => {
    const a = Math.random() * 2 * Math.PI;
    const v = 25 + Math.random() * 35;
    const x = x0 + Math.random() * (x1 - x0);
    const y = y0 + Math.random() * (y1 - y0);
    return { x, y, vx: v * Math.cos(a), vy: v * Math.sin(a), tr: -1, dur: 1, sx: x, sy: y, hy: HOLE_Y, ex: x, ey: y };
  });
  const ring = new Int16Array(MAX_WIN);
  ring[0] = N;
  const hist = new Float64Array(N + 1);
  return { N, side: new Uint8Array(N), nLeft: N, t: 0, hist, ring, returns: 0, lastVisit: 0, sumGaps: 0, acc: 0, logFact, parts };
}

/** Un tic du modèle d'Ehrenfest : une particule au hasard change de côté. */
function tic(s: Sim, transit: number) {
  s.hist[s.nLeft] += 1;
  const i = Math.floor(Math.random() * s.N);
  s.side[i] ^= 1;
  s.nLeft += s.side[i] === 1 ? -1 : 1;
  s.t += 1;
  s.ring[s.t % MAX_WIN] = s.nLeft;
  if (s.nLeft === s.N) {
    s.returns += 1;
    s.sumGaps += s.t - s.lastVisit;
    s.lastVisit = s.t;
  }
  const p = s.parts[i];
  const [x0, x1, y0, y1] = bounds(s.side[i], radius(s.N));
  p.ex = x0 + Math.random() * (x1 - x0);
  p.ey = y0 + Math.random() * (y1 - y0);
  if (transit > 0) Object.assign(p, { tr: 0, dur: transit, sx: p.x, sy: p.y, hy: HOLE_Y + (Math.random() - 0.5) * HOLE });
  else Object.assign(p, { tr: -1, x: p.ex, y: p.ey });
}

function moveParticles(s: Sim, dt: number) {
  const rad = radius(s.N);
  s.parts.forEach((p, i) => {
    if (p.tr >= 0) {
      p.tr += dt / p.dur;
      const u = Math.min(1, p.tr);
      const [ax, ay, bx, by, f] = u < 0.5 ? [p.sx, p.sy, WALL, p.hy, 2 * u] : [WALL, p.hy, p.ex, p.ey, 2 * u - 1];
      p.x = ax + (bx - ax) * f;
      p.y = ay + (by - ay) * f;
      if (p.tr >= 1) p.tr = -1;
      return;
    }
    const [x0, x1, y0, y1] = bounds(s.side[i], rad);
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < x0 || p.x > x1) p.vx = p.x < x0 ? Math.abs(p.vx) : -Math.abs(p.vx);
    if (p.y < y0 || p.y > y1) p.vy = p.y < y0 ? Math.abs(p.vy) : -Math.abs(p.vy);
    p.x = Math.min(x1, Math.max(x0, p.x));
    p.y = Math.min(y1, Math.max(y0, p.y));
  });
}

function polyline(ctx: CanvasRenderingContext2D, pts: number[][]) {
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, s: Sim, css: CSSStyleDeclaration) {
  const [accent, ok, warn, text, dim] = VARS.map((v, i) => css.getPropertyValue(v).trim() || FALLBACK[i]);
  const c = { accent, ok, warn, text, dim };
  const { N } = s;
  const sigma = Math.sqrt(N) / 2;
  ctx.clearRect(0, 0, W, H);
  Object.assign(ctx, { font: '12px system-ui', lineWidth: 2, strokeStyle: c.dim });
  ctx.strokeRect(BOX.x, BOX.y, BOX.w, BOX.h);
  polyline(ctx, [[WALL, BOX.y], [WALL, HOLE_Y - HOLE]]);
  polyline(ctx, [[WALL, HOLE_Y + HOLE], [WALL, BOX.y + BOX.h]]);
  Object.assign(ctx, { fillStyle: c.text, textAlign: 'center' });
  ctx.fillText(`gauche : ${s.nLeft}`, BOX.x + BOX.w / 4, BOX.y - 8);
  ctx.fillText(`droite : ${N - s.nLeft}`, BOX.x + (3 * BOX.w) / 4, BOX.y - 8);
  const rad = radius(N);
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  for (const p of s.parts) {
    ctx.moveTo(p.x + rad, p.y);
    ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
  }
  ctx.fill();

  // Histogramme du temps passé dans chaque état, et la cloche C(N, n)/2^N (zoom sur N/2 ± 6σ).
  const lo = Math.max(0, Math.floor(N / 2 - 6 * sigma));
  const hi = Math.min(N, Math.ceil(N / 2 + 6 * sigma));
  const bw = HIST.w / (hi - lo + 1);
  const total = s.hist.reduce((a, b) => a + b, 0);
  const p = (n: number) => Math.exp(s.logFact[N] - s.logFact[n] - s.logFact[N - n] - N * Math.LN2);
  let yMax = p(Math.floor(N / 2));
  for (let n = lo; n <= hi && total > 0; n++) yMax = Math.max(yMax, s.hist[n] / total);
  yMax *= 1.1;
  const base = HIST.y + HIST.h;
  const cx = (n: number) => HIST.x + (n - lo + 0.5) * bw;
  const bins = Array.from({ length: hi - lo + 1 }, (_, j) => lo + j);
  Object.assign(ctx, { fillStyle: c.ok, globalAlpha: 0.75 });
  for (const n of bins) {
    const h = total > 0 ? (s.hist[n] / total / yMax) * HIST.h : 0;
    ctx.fillRect(cx(n) - bw * 0.4, base - h, bw * 0.8, h);
  }
  Object.assign(ctx, { globalAlpha: 1, strokeStyle: c.warn, fillStyle: c.warn });
  const curve = bins.map((n) => [cx(n), base - (p(n) / yMax) * HIST.h]);
  polyline(ctx, curve);
  for (const [x, y] of bw >= 8 ? curve : []) {
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  Object.assign(ctx, { lineWidth: 1.5, strokeStyle: c.accent });
  if (s.nLeft >= lo && s.nLeft <= hi) polyline(ctx, [[cx(s.nLeft), HIST.y + 4], [cx(s.nLeft), base]]);
  Object.assign(ctx, { lineWidth: 1, strokeStyle: c.dim, fillStyle: c.dim });
  polyline(ctx, [[HIST.x, base], [HIST.x + HIST.w, base]]);
  for (const n of [lo, N / 2, hi]) ctx.fillText(String(n), cx(n), base + 14);
  ctx.textAlign = 'left';
  ctx.fillText('temps passé dans chaque état n', HIST.x, HIST.y - 8);

  // La courbe n(t), avec la bande des fluctuations typiques N/2 ± √N/2.
  const win = Math.min(MAX_WIN, Math.max(120, 4 * N));
  const count = Math.min(s.t + 1, win);
  const y = (v: number) => PLOT.y + PLOT.h * (1 - v / N);
  Object.assign(ctx, { fillStyle: c.ok, globalAlpha: 0.15 });
  ctx.fillRect(PLOT.x, y(N / 2 + sigma), PLOT.w, y(N / 2 - sigma) - y(N / 2 + sigma));
  Object.assign(ctx, { globalAlpha: 1, fillStyle: c.dim });
  polyline(ctx, [[PLOT.x, PLOT.y], [PLOT.x, PLOT.y + PLOT.h], [PLOT.x + PLOT.w, PLOT.y + PLOT.h]]);
  ctx.setLineDash([4, 4]);
  polyline(ctx, [[PLOT.x, y(N / 2)], [PLOT.x + PLOT.w, y(N / 2)]]);
  ctx.setLineDash([]);
  ctx.fillText('n(t) : particules à gauche', PLOT.x, PLOT.y - 8);
  ctx.textAlign = 'right';
  ctx.fillText(`temps → (fenêtre de ${win} tics)`, PLOT.x + PLOT.w, PLOT.y + PLOT.h + 16);
  ctx.textBaseline = 'middle';
  for (const [label, v] of [[String(N), N], ['N/2', N / 2], ['0', 0]] as const) ctx.fillText(label, PLOT.x - 6, y(v));
  Object.assign(ctx, { textBaseline: 'alphabetic', strokeStyle: c.accent, lineWidth: 1.5 });
  polyline(ctx, Array.from({ length: count }, (_, j) => [PLOT.x + (j / (win - 1)) * PLOT.w, y(s.ring[(s.t - count + 1 + j) % MAX_WIN])]));
}

export function EhrenfestExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  simRef.current ??= makeSim(4);
  const [N, setN] = useState(4);
  const [speedIdx, setSpeedIdx] = useState(DEFAULT_SPEED[4]);
  const [running, setRunning] = useState(false);
  const [ui, setUi] = useState({ n: 4, t: 0, returns: 0, gap: 0 });
  const speed = SPEEDS[speedIdx];

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const css = getComputedStyle(canvas);
    let [raf, last, lastUi, shownT] = [0, performance.now(), 0, -1];
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      raf = requestAnimationFrame(frame);
      const s = simRef.current;
      if (!s) return;
      // Chaque particule est re-tirée en moyenne toutes les N/vitesse secondes : le passage dure moins.
      const transit = Math.min(0.45, (0.6 * s.N) / speed);
      if (running) {
        s.acc += dt * speed;
        const todo = Math.min(Math.floor(s.acc), 5000);
        s.acc -= Math.floor(s.acc);
        for (let k = 0; k < todo; k++) tic(s, transit >= 0.04 ? transit : 0);
      }
      moveParticles(s, dt);
      draw(ctx, s, css);
      if (now - lastUi > 100 && s.t !== shownT) {
        lastUi = now;
        shownT = s.t;
        setUi({ n: s.nLeft, t: s.t, returns: s.returns, gap: s.returns ? s.sumGaps / s.returns : 0 });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, speed]);

  const restart = (n: number) => {
    simRef.current = makeSim(n);
    setUi({ n, t: 0, returns: 0, gap: 0 });
  };
  const pickN = (n: number) => {
    setN(n);
    setSpeedIdx(DEFAULT_SPEED[n]);
    restart(n);
  };

  const sigma = Math.sqrt(N) / 2;
  const lnOmega = lnChoose(N, ui.n);
  const log2N = N * Math.log10(2);
  const far = Math.abs(ui.n - N / 2) > 3 * sigma;

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {SIZES.map((v) => (
          <button key={v} type="button" className={`btn ${N === v ? 'btn-primary' : ''}`} onClick={() => pickN(v)}>
            N = {v}
          </button>
        ))}
      </div>
      <div className="physics-controls">
        <button type="button" className="btn btn-primary" onClick={() => setRunning((r) => !r)}>
          {running ? '⏸ Pause' : '▶ Lecture'}
        </button>
        <label>
          vitesse : {speed} tic{speed > 1 ? 's' : ''}/s
          <input type="range" min={0} max={SPEEDS.length - 1} value={speedIdx} onChange={(e) => setSpeedIdx(Number(e.target.value))} />
        </label>
        <button type="button" className="btn" onClick={() => restart(N)}>
          ↺ Tout remettre à gauche
        </button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: 'auto', aspectRatio: `${W} / ${H}`, maxWidth: '100%', touchAction: 'none' }} />
      <p className="physics-caption" style={{ color: 'var(--text)' }}>
        t = {ui.t.toLocaleString('fr-FR')} tics · n = {ui.n} à gauche · Ω(n) = C({N}, {ui.n}) {big(lnOmega / Math.LN10)}{' '}
        façon{ui.n === 0 || ui.n === N ? '' : 's'} · <strong>S/k = ln Ω ≈ {dec(lnOmega, 2)}</strong> (maximum en n = N/2 :{' '}
        {dec(lnChoose(N, N / 2), 2)})
      </p>
      <p className="physics-caption" style={{ color: 'var(--text)' }}>
        Temps moyen avant de revoir toutes les particules à gauche : 2{sup(N)} {big(log2N)} tics, soit{' '}
        {duration(log2N - Math.log10(speed))} à cette vitesse
        {N >= 50 ? ` — et même à un milliard de tics par seconde : ${duration(log2N - 9)}` : ''}
        {log2N > AGE_LOG10 ? ' (l’univers a ≈ 4·10¹⁷ s)' : ''}. Retours observés : {ui.returns}
        {ui.returns > 0 ? ` (écart moyen mesuré : ${dec(ui.gap, 1)} tics)` : ''}.
      </p>
      <p className="physics-caption">
        {ui.t === 0
          ? 'Au départ, tout est rangé : un seul arrangement réalise « toutes à gauche » (Ω = 1, S = 0). Lance le temps ! '
          : far
            ? `Le mélange s’installe : la particule tirée est à gauche avec la probabilité n/N = ${dec(ui.n / N, 2)}, donc n descend — sans aucune force, par simple comptage. `
            : `Équilibre statistique : n fluctue autour de N/2 = ${N / 2}, avec des écarts typiques de √N/2 ≈ ${dec(sigma, 1)} (bande verte), soit ±${dec((100 * sigma) / N, 1)} % de N — plus N est grand, plus la cloche (en orange, C(N, n)/2ᴺ ; en vert, le temps mesuré) est étroite. `}
        Rien n’interdit le retour en arrière ; il est juste astronomiquement improbable. L’entropie augmente
        parce qu’il y a beaucoup plus de façons d’être mélangé que rangé.
      </p>
    </div>
  );
}
