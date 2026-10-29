import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le Laplacien, c'est « la moyenne de mes voisins moins moi ». Une barre de
 * 120 cellules (bouts fixés à 0) dont on peint l'état initial u(x) : la chaleur
 * (∂u/∂t = D u″) aplatit tout et oublie ; l'onde (∂²u/∂t² = c² u″) scinde la
 * bosse en deux et se souvient. Même opérateur, une dérivée en temps d'écart.
 */

type Mode = 'heat' | 'wave' | 'both';
type Preset = 'bosse' | 'creneau' | 'pics';
type RGB = [number, number, number];
type Sim = { u0: Float64Array; heat: Float64Array; wave: Float64Array; prev: Float64Array; tmp: Float64Array; t: number };

const N = 120;
const W = 560;
const PANEL = 200; // hauteur d'une barre (courbe + dégradé)
const MID = 92; // ordonnée du zéro dans un panneau
const PAD = 22;
const AMP = 60; // pixels pour u = 1
const DX = 1 / (N - 1); // barre de 1 m
const FRAME_T = 1 / 60; // secondes simulées par image
const R_HEAT = 0.45; // r = D·dt/dx² ≤ ½ : condition de stabilité du schéma explicite
const HEAT_SUB = 1; // pas de chaleur par image (assez lent pour voir les pics fondre)
const D_HEAT = (R_HEAT * DX * DX * HEAT_SUB) / FRAME_T; // ≈ 0,0019 m²/s
// CFL : c·dt/dx = 1 (un pas par image) — le « pas magique » où le saute-mouton
// reproduit exactement d'Alembert u = ½[f(x − ct) + f(x + ct)] : aucune dispersion.
const C2 = 1;
const C_WAVE = DX / FRAME_T; // ≈ 0,50 m/s
const heightOf = (m: Mode) => (m === 'both' ? 2 * PANEL : PANEL);
const xOf = (i: number) => PAD + (i * (W - 2 * PAD)) / (N - 1);
const fr = (v: number, d: number) => v.toFixed(d).replace('.', ',');

const PRESETS: Record<Preset, [string, (x: number) => number]> = {
  bosse: ['Bosse', (x) => 0.9 * Math.exp(-(((x - 0.5) / 0.07) ** 2))],
  creneau: ['Créneau', (x) => (x > 0.38 && x < 0.62 ? 0.85 : 0)],
  pics: ['Deux pics', (x) => 0.9 * Math.exp(-(((x - 0.27) / 0.035) ** 2)) + 0.55 * Math.exp(-(((x - 0.7) / 0.035) ** 2))],
};

/** u[i−1] − 2u[i] + u[i+1] = 2·(moyenne des voisins − moi) : le Laplacien discret. */
const lap = (u: Float64Array, i: number) => u[i + 1] - 2 * u[i] + u[i - 1];

function restart(s: Sim): void {
  s.u0[0] = s.u0[N - 1] = 0;
  s.heat.set(s.u0);
  s.wave.set(s.u0);
  // Vitesse initiale nulle : u⁻¹ = u¹ = u⁰ + ½·C²·Δu⁰ (Taylor à l'ordre 2).
  for (let i = 1; i < N - 1; i++) s.prev[i] = s.u0[i] + 0.5 * C2 * lap(s.u0, i);
  s.t = 0;
}

function load(s: Sim, p: Preset): void {
  for (let i = 0; i < N; i++) s.u0[i] = PRESETS[p][1](i * DX);
  restart(s);
}

function makeSim(): Sim {
  const z = () => new Float64Array(N);
  const s = { u0: z(), heat: z(), wave: z(), prev: z(), tmp: z(), t: 0 };
  load(s, 'bosse');
  return s;
}

/** Une image : HEAT_SUB pas de chaleur (Euler explicite) + 1 pas d'onde (saute-mouton). Les bouts restent à 0. */
function step(s: Sim): void {
  for (let k = 0; k < HEAT_SUB; k++) {
    for (let i = 1; i < N - 1; i++) s.tmp[i] = s.heat[i] + R_HEAT * lap(s.heat, i);
    [s.heat, s.tmp] = [s.tmp, s.heat];
  }
  for (let i = 1; i < N - 1; i++) s.tmp[i] = 2 * s.wave[i] - s.prev[i] + C2 * lap(s.wave, i);
  [s.prev, s.wave, s.tmp] = [s.wave, s.tmp, s.prev];
  s.t += FRAME_T;
}

/** Pinceau doux : on tire les cellules voisines vers la valeur peinte (lissage léger). */
function paint(u: Float64Array, i0: number, v0: number, i1: number, v1: number): void {
  const n = Math.max(1, Math.abs(i1 - i0));
  for (let k = 0; k <= n; k++) {
    const i = Math.round(i0 + ((i1 - i0) * k) / n);
    const v = v0 + ((v1 - v0) * k) / n;
    for (let d = -3; d <= 3; d++) {
      if (i + d >= 1 && i + d <= N - 2) u[i + d] += (v - u[i + d]) * Math.exp(-(d * d) / 3);
    }
  }
}

function rgb(col: string): RGB {
  const m = /^#([0-9a-f]{6})$/i.exec(col);
  const n = m ? parseInt(m[1], 16) : 0x888888;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const mix = (a: RGB, b: RGB, t: number) => `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * t)).join(',')})`;

function theme(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  return { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'), text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd'), border: v('--border', '#2e3550') };
}

function drawPanel(ctx: CanvasRenderingContext2D, c: ReturnType<typeof theme>, top: number, u: Float64Array, heat: boolean, showLap: boolean, t: number | null): void {
  const mid = top + MID;
  const y = (v: number) => mid - v * AMP;
  ctx.font = '12px system-ui';
  ctx.fillStyle = c.text;
  ctx.textAlign = 'left';
  ctx.fillText(heat ? `chaleur : ∂u/∂t = D·∂²u/∂x²   (r = D·dt/dx² = ${fr(R_HEAT, 2)} ≤ ½)` : `onde : ∂²u/∂t² = c²·∂²u/∂x²   (CFL : c·dt/dx = 1)`, PAD, top + 16);
  if (t !== null) {
    ctx.textAlign = 'right';
    ctx.fillText(`t = ${fr(t, 1)} s`, W - PAD, top + 16);
    ctx.textAlign = 'left';
  }
  // Le zéro, et les deux attaches fixées à 0.
  ctx.strokeStyle = c.dim;
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(PAD, mid);
  ctx.lineTo(W - PAD, mid);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.dim;
  ctx.fillRect(PAD - 6, mid - 22, 5, 44);
  ctx.fillRect(W - PAD + 1, mid - 22, 5, 44);
  // La courbe u(x).
  ctx.strokeStyle = heat ? c.warn : c.ok;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    if (i === 0) ctx.moveTo(xOf(i), y(u[i]));
    else ctx.lineTo(xOf(i), y(u[i]));
  }
  ctx.stroke();
  // La barre : froid (u < 0) → neutre → chaud (u > 0).
  const [cold, neutral, hot] = [rgb(c.accent), rgb(c.border), rgb(c.warn)];
  const cw = (W - 2 * PAD) / (N - 1);
  for (let i = 0; i < N; i++) {
    ctx.fillStyle = mix(neutral, u[i] < 0 ? cold : hot, Math.min(1, Math.sqrt(Math.abs(u[i])))); // √ : les tiédeurs restent visibles
    ctx.fillRect(xOf(i) - cw / 2, top + 164, cw + 0.6, 16);
  }
  ctx.strokeStyle = c.dim;
  ctx.lineWidth = 1;
  ctx.strokeRect(PAD - cw / 2, top + 164, W - 2 * PAD + cw, 16);
  if (!showLap) return;
  // Flèches u″ : vers le haut si je suis sous la moyenne de mes voisins.
  for (let k = 0; k < 20; k++) {
    const i = Math.round(((k + 0.5) * (N - 1)) / 20);
    const len = 30 * Math.tanh(lap(u, i) / (DX * DX) / 60);
    if (Math.abs(len) < 2) continue;
    const [x, y0] = [xOf(i), y(u[i])];
    const y1 = y0 - len;
    const s = Math.sign(len);
    ctx.strokeStyle = ctx.fillStyle = len > 0 ? c.warn : c.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y1 - 3 * s);
    ctx.lineTo(x - 4, y1 + 4 * s);
    ctx.lineTo(x + 4, y1 + 4 * s);
    ctx.fill();
  }
}

export function HeatWaveExplorer({ mode = 'heat' }: { mode?: Mode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<Sim | null>(null);
  const brushRef = useRef<{ i: number; v: number; panel: number } | null>(null);
  const [running, setRunning] = useState(true);
  const [showLap, setShowLap] = useState(false);
  const [preset, setPreset] = useState<Preset | null>('bosse');
  const H = heightOf(mode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const h = heightOf(mode);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const s = (simRef.current ??= makeSim());
    let raf = 0;
    const draw = () => {
      if (running && !brushRef.current) step(s);
      const c = theme(canvas);
      ctx.clearRect(0, 0, W, h);
      if (mode !== 'wave') drawPanel(ctx, c, 0, s.heat, true, showLap, s.t);
      if (mode !== 'heat') drawPanel(ctx, c, mode === 'both' ? PANEL : 0, s.wave, false, showLap, mode === 'both' ? null : s.t);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, running, showLap]);

  const read = (e: React.PointerEvent<HTMLCanvasElement>, panel?: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const p = panel ?? Math.max(0, Math.min(H / PANEL - 1, Math.floor(y / PANEL)));
    const i = Math.max(1, Math.min(N - 2, Math.round(((x - PAD) / (W - 2 * PAD)) * (N - 1))));
    return { i, v: Math.max(-1, Math.min(1, (p * PANEL + MID - y) / AMP)), panel: p };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = (simRef.current ??= makeSim());
    e.currentTarget.setPointerCapture(e.pointerId);
    const b = read(e);
    paint(s.u0, b.i, b.v, b.i, b.v);
    restart(s); // on peint la condition INITIALE : retour à t = 0
    brushRef.current = b;
    setPreset(null);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const last = brushRef.current;
    const s = simRef.current;
    if (!last || !s) return;
    const b = read(e, last.panel);
    paint(s.u0, last.i, last.v, b.i, b.v);
    restart(s);
    brushRef.current = b;
  };
  const onUp = () => {
    if (!brushRef.current) return;
    brushRef.current = null;
    setRunning(true);
  };
  const choose = (p: Preset) => {
    load((simRef.current ??= makeSim()), p);
    setPreset(p);
    setRunning(true);
  };

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <button type="button" className={`btn ${running ? '' : 'btn-primary'}`} onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Lecture'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => { restart((simRef.current ??= makeSim())); setRunning(true); }}>
          Recommencer
        </button>
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button key={p} type="button" className={`btn ${preset === p ? 'btn-primary' : ''}`} onClick={() => choose(p)}>
            {PRESETS[p][0]}
          </button>
        ))}
        <label>
          <input type="checkbox" checked={showLap} onChange={(e) => setShowLap(e.target.checked)} /> Voir le Laplacien
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'crosshair' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">
        {mode === 'heat' && <>Chaque point se rapproche de la moyenne de ses voisins : les pics fondent, les creux se comblent, tout s’aplatit. <strong>Fourier, 1807.</strong> Passe le film à l’envers : un tas de chaleur qui se reformerait tout seul, ça ne s’est jamais vu. </>}
        {mode === 'wave' && <>Vitesse initiale nulle : la bosse se scinde en <strong>deux moitiés</strong> qui filent en sens opposés — d’Alembert, 1747 : u = ½[f(x − ct) + f(x + ct)]. Aux bouts, elles rebondissent <strong>retournées</strong> : l’attache est obligée de rester à 0. Rien ne s’efface. </>}
        {mode === 'both' && <>Même Laplacien, une seule différence : dérivée <strong>PREMIÈRE</strong> en temps (la chaleur oublie, irréversible) contre dérivée <strong>SECONDE</strong> (l’onde se souvient, réversible) — c’est toute la différence entre <strong>parabolique</strong> et <strong>hyperbolique</strong>. </>}
        {showLap && (mode === 'heat'
          ? 'Flèche vers le haut : le point est plus froid que la moyenne de ses voisins — il va se réchauffer (u″ ≈ 2·(moyenne des voisins − moi)/dx²). Les pointes, où u″ est énorme, fondent en premier. '
          : mode === 'wave'
            ? 'Ici la flèche u″ n’est plus une vitesse mais une accélération : chaque point est tiré vers la moyenne de ses voisins, la dépasse… et oscille. '
            : 'Mêmes flèches u″ en haut et en bas : pour la chaleur elles donnent la vitesse de u, pour l’onde son accélération. ')}
        Glisse sur une courbe pour peindre ta propre condition initiale (D ≈ {fr(D_HEAT, 4)} m²/s, c ≈ {fr(C_WAVE, 2)} m/s).
      </p>
    </div>
  );
}
