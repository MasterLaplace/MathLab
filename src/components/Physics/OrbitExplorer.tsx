import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * La gravitation à deux corps (GM = 1), intégrée en Verlet vitesse : un schéma
 * symplectique qui conserve r × v exactement et l'énergie à O(dt²) près — les
 * ellipses se referment. « kepler » : on lance une planète en tirant sa flèche
 * de vitesse ; aires égales en temps égaux (2ᵉ loi), T²/a³ = 4π² (3ᵉ loi).
 * « escape » : le boulet de canon de Newton — orbiter, c'est tomber en ratant la Terre.
 */

type Body = { x: number; y: number; vx: number; vy: number };
type Pt = [number, number];
type Colors = ReturnType<typeof theme>;
type Ctx = CanvasRenderingContext2D;

const W = 560;
const H = 420;
const DT = 0.003; // pas d'intégration (unités réduites : GM = 1)
const TAU = 2 * Math.PI;

/** Demi-coup de gravité, dirigé vers le centre : il ne peut pas changer r × v. */
function kick(b: Body): void {
  const r2 = b.x * b.x + b.y * b.y;
  const k = (0.5 * DT) / (r2 * Math.sqrt(r2));
  b.vx -= k * b.x;
  b.vy -= k * b.y;
}

/** Un pas de Verlet vitesse : coup – dérive en ligne droite – coup (symplectique). */
function verlet(b: Body): void {
  kick(b);
  b.x += DT * b.vx;
  b.y += DT * b.vy;
  kick(b);
}

const fr = (v: number, d = 2) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d).replace('.', ',').replace('-', '−');

function theme(el: HTMLElement) {
  const css = getComputedStyle(el);
  const v = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
  return { accent: v('--accent', '#6a8dff'), ok: v('--ok', '#4cc38a'), warn: v('--warn', '#ffb454'), text: v('--text', '#e8eaf2'), dim: v('--text-dim', '#9aa2bd') };
}

function setup(canvas: HTMLCanvasElement): Ctx | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.font = '12px system-ui';
  return ctx;
}

// (Un lineTo sur un chemin vide vaut un moveTo : pas de cas particulier pour le 1ᵉʳ point.)
function polyline(ctx: Ctx, pts: Pt[], col: string, width: number, alpha = 1): void {
  Object.assign(ctx, { strokeStyle: col, lineWidth: width, globalAlpha: alpha });
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function fillPoly(ctx: Ctx, pts: Pt[], col: string, alpha = 1): void {
  Object.assign(ctx, { fillStyle: col, globalAlpha: alpha });
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function circle(ctx: Ctx, x: number, y: number, r: number, col: string, mode: 'fill' | 'stroke', alpha = 1): void {
  Object.assign(ctx, { fillStyle: col, strokeStyle: col, globalAlpha: alpha });
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx[mode]();
  ctx.globalAlpha = 1;
}
const dot = (ctx: Ctx, x: number, y: number, r: number, col: string, alpha = 1) => circle(ctx, x, y, r, col, 'fill', alpha);

// ——— Mode « kepler » ———
const SX = W / 2;
const SY = 232;
const SC = 85; // pixels par unité de longueur
const VS = 110; // pixels par unité de vitesse
const R0 = 2; // la planète part de (−R0, 0)
const VC = Math.sqrt(1 / R0); // vitesse circulaire au départ
const R_SUN = 0.12;
const SECTOR_STEPS = 400; // un secteur = 400 pas : Δt = 1,2
const scr = (x: number, y: number): Pt => [SX + x * SC, SY - y * SC];
const [PX0, PY0] = scr(-R0, 0);
const handleOf = ([vx, vy]: Pt): Pt => [PX0 + vx * VS, PY0 - vy * VS];

type Sector = { pts: Pt[]; area: number; idx: number };
type Flight = { b: Body; E0: number; L: number; t: number; n: number; theta: number; period: number | null; trail: Pt[]; cur: Sector; done: Sector[]; fate: 'fly' | 'gone' | 'crash' };
type Phase = 'aim' | 'bound' | 'free' | 'crash';

function newFlight([vx, vy]: Pt): Flight {
  const p: Pt = [PX0, PY0];
  const E0 = (vx * vx + vy * vy) / 2 - 1 / R0;
  return { b: { x: -R0, y: 0, vx, vy }, E0, L: -R0 * vy, t: 0, n: 0, theta: 0, period: null, trail: [p], cur: { pts: [p], area: 0, idx: 0 }, done: [], fate: 'fly' };
}

/** 18 pas par image : aire balayée, angle parcouru (→ période), secteurs de durée égale. */
function advance(f: Flight): void {
  for (let k = 0; k < 18 && f.fate === 'fly'; k++) {
    const { b } = f;
    const { x, y } = b;
    verlet(b);
    f.t += DT;
    f.n++;
    const cross = x * b.y - y * b.x; // = L·dt exactement : le triangle de Newton
    f.cur.area += Math.abs(cross) / 2;
    const dth = Math.atan2(cross, x * b.x + y * b.y);
    if (f.period === null && Math.abs(f.theta + dth) >= TAU) f.period = f.t - DT + (DT * (TAU - Math.abs(f.theta))) / Math.abs(dth);
    f.theta += dth;
    const p = scr(b.x, b.y);
    if (f.n % 4 === 0) f.cur.pts.push(p);
    if (f.n % SECTOR_STEPS === 0) {
      f.cur.pts.push(p);
      f.done = [...f.done.slice(-5), f.cur];
      f.cur = { pts: [p], area: 0, idx: f.cur.idx + 1 };
    }
    const r = Math.hypot(b.x, b.y);
    if (r < R_SUN) f.fate = 'crash';
    else if (r > 14) f.fate = 'gone';
  }
  f.trail.push(scr(f.b.x, f.b.y));
  if (f.trail.length > 2400) f.trail.shift();
}

/** L'orbite prédite = un vol simulé d'avance par le même intégrateur (un tour au plus). */
function predict(v: Pt): Pt[] {
  const f = newFlight(v);
  while (f.fate === 'fly' && Math.abs(f.theta) < TAU && f.n < 40000) advance(f);
  return f.trail;
}

function kind(E: number, L: number): string {
  if (E > 0.004) return 'hyperbole : elle s’échappe';
  if (E >= -0.004) return 'E ≈ 0 : parabole, tout juste libérée';
  const e = Math.sqrt(Math.max(0, 1 + 2 * E * L * L));
  return e < 0.02 ? 'liée : un cercle parfait' : `liée : ellipse (excentricité ${fr(e)})`;
}

function drawKepler(ctx: Ctx, c: Colors, f: Flight | null, v: Pt, preview: Pt[]): void {
  ctx.clearRect(0, 0, W, H);
  for (const s of f ? [...f.done, f.cur] : []) fillPoly(ctx, [[SX, SY], ...s.pts], s.idx % 2 ? c.ok : c.accent, 0.26);
  ctx.setLineDash(f ? [] : [5, 5]); // pointillé = prévision, trait plein = trajectoire réelle
  polyline(ctx, f ? f.trail : preview, f ? c.accent : c.dim, f ? 2 : 1.5);
  ctx.setLineDash([]);
  dot(ctx, SX, SY, 18, c.warn, 0.25);
  dot(ctx, SX, SY, R_SUN * SC, c.warn);
  // Flèche de vitesse initiale et sa poignée (estompée pendant le vol : on peut relancer).
  const [hx, hy] = handleOf(v);
  const a = Math.atan2(hy - PY0, hx - PX0);
  const alpha = f ? 0.45 : 1;
  polyline(ctx, [[PX0, PY0], [hx, hy]], c.ok, 2.5, alpha);
  polyline(ctx, [[hx - 9 * Math.cos(a - 0.5), hy - 9 * Math.sin(a - 0.5)], [hx, hy], [hx - 9 * Math.cos(a + 0.5), hy - 9 * Math.sin(a + 0.5)]], c.ok, 2.5, alpha);
  dot(ctx, hx, hy, 9, c.ok, 0.35 * alpha); // la poignée
  ctx.lineWidth = 1.5;
  circle(ctx, hx, hy, 9, c.text, 'stroke', alpha);
  Object.assign(ctx, { fillStyle: c.text, globalAlpha: alpha });
  ctx.fillText(f ? 'v₀ (relancer)' : 'v₀', hx + 13, hy - 8);
  dot(ctx, ...(f ? scr(f.b.x, f.b.y) : ([PX0, PY0] as Pt)), 7, c.accent);
  // Lectures : énergie (constante), 3ᵉ loi, aires des derniers secteurs.
  const b = f ? f.b : { x: -R0, y: 0, vx: v[0], vy: v[1] };
  const E = (b.vx * b.vx + b.vy * b.vy) / 2 - 1 / Math.hypot(b.x, b.y);
  const E0 = f ? f.E0 : E;
  ctx.fillStyle = c.text;
  ctx.fillText(`E = v²/2 − GM/r = ${fr(E, 3)}   →   ${kind(E0, f ? f.L : -R0 * v[1])}`, 12, 18);
  if (E0 < -0.004) {
    const A = -1 / (2 * E0);
    const T = f?.period;
    const tail = T ? `= ${fr(T)}    T²/a³ = ${fr((T * T) / A ** 3)}   (4π² ≈ 39,48)` : f ? ': un tour en cours…' : ': mesurée après un tour';
    ctx.fillText(`a = −GM/(2E) = ${fr(A)}    période T ${tail}`, 12, 36);
  }
  if (f && f.done.length) ctx.fillText(`aires balayées en Δt égaux : ${f.done.slice(-3).map((s) => fr(s.area, 3)).join('  ·  ')}`, 12, 54);
}

const KEPLER_PRESETS: [string, number][] = [['Cercle parfait', 1], ['Ellipse', 0.7], ['Évasion', Math.SQRT2]];
const KEPLER_CAPTION: Record<Phase, string> = {
  aim: 'Glisse la pointe verte : c’est la vitesse de départ de la planète. Le pointillé prédit son orbite — lâche pour la lancer.',
  bound: 'Chaque secteur coloré est balayé pendant la même durée… et leurs aires sont égales : près du Soleil la planète fonce, au loin elle flâne (2ᵉ loi de Kepler, 1609). Newton l’a démontré (Principia, 1687) avec ces triangles et des « coups » dirigés vers le centre — exactement l’algorithme qui fait tourner cette simulation. Et T²/a³ ≈ 4π² pour toutes les orbites : la 3ᵉ loi (1619).',
  free: 'E ≥ 0 : l’énergie cinétique l’emporte sur le puits du Soleil, la planète ne reviendra jamais. Le seuil v = √(2GM/r) ne dépend pas de la direction du tir : E ne voit que v². Les aires, elles, restent égales — la 2ᵉ loi vaut aussi pour les hyperboles.',
  crash: 'Plongeon dans le Soleil : trop peu de moment cinétique. Pour orbiter, il ne faut pas aller vite vers le Soleil, mais vite DE CÔTÉ.',
};

function KeplerView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const vRef = useRef<Pt>([0, 0.7 * VC]);
  const previewRef = useRef<Pt[]>([]);
  const flightRef = useRef<Flight | null>(null);
  const dragRef = useRef(false);
  const [phase, setPhase] = useState<Phase>('aim');
  const [preset, setPreset] = useState<string | null>(null);

  const aim = (vx: number, vy: number) => {
    const s = Math.min(1, 1.6 / Math.max(1e-9, Math.hypot(vx, vy)));
    vRef.current = [vx * s, vy * s];
    previewRef.current = predict(vRef.current);
    flightRef.current = null;
  };
  const pos = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [(e.clientX - rect.left) * (W / rect.width), (e.clientY - rect.top) * (H / rect.height)];
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const [x, y] = pos(e);
    const [hx, hy] = handleOf(vRef.current);
    if (Math.hypot(x - hx, y - hy) > 24) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = true;
    setPreset(null);
    aim(...vRef.current);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current) return;
    const [x, y] = pos(e);
    aim((x - PX0) / VS, (PY0 - y) / VS);
  };
  const onUp = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    flightRef.current = newFlight(vRef.current);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && setup(canvas);
    if (!canvas || !ctx) return;
    if (previewRef.current.length === 0) previewRef.current = predict(vRef.current);
    let raf = 0;
    let frame = 0;
    const draw = () => {
      const f = flightRef.current;
      if (f) advance(f);
      drawKepler(ctx, theme(canvas), f, vRef.current, previewRef.current);
      if (++frame % 6 === 0) setPhase(!f ? 'aim' : f.fate === 'crash' ? 'crash' : f.E0 < -0.004 ? 'bound' : 'free');
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {KEPLER_PRESETS.map(([label, k]) => (
          <button key={label} type="button" className={`btn ${preset === label ? 'btn-primary' : ''}`} onClick={() => { setPreset(label); aim(0, k * VC); flightRef.current = newFlight(vRef.current); }}>
            {label}
          </button>
        ))}
        <button type="button" className="btn btn-ghost" onClick={() => { setPreset(null); aim(...vRef.current); }}>Effacer</button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />
      <p className="physics-caption">{KEPLER_CAPTION[phase]}</p>
    </div>
  );
}

// ——— Mode « escape » : le canon de Newton ———
const EX = W / 2;
const EY = 160;
const ES = 80; // pixels par rayon terrestre
const RC = 1.14; // sommet de la montagne (hauteur très exagérée, comme dans le dessin de Newton)
const KMS = 7.9 * Math.sqrt(RC); // conversion : √(GM/RC) ↔ v₁ = 7,9 km/s
const V_HIT = 7.9 * Math.sqrt(2 / (1 + RC)); // en dessous (≈ 7,64 km/s), le périgée passe sous le sol
const escr = (x: number, y: number): Pt => [EX + x * ES, EY - y * ES];

type Shot = { b: Body; pts: Pt[]; theta: number; fate: 'fly' | 'landed' | 'orbit' | 'gone' };

function advanceShot(s: Shot): void {
  for (let k = 0; k < 10 && s.fate !== 'landed' && s.fate !== 'gone'; k++) {
    const { b } = s;
    const { x, y } = b;
    verlet(b);
    if (s.fate === 'orbit') continue; // le tour est bouclé : le boulet continue, la trace est finie
    s.theta += Math.atan2(x * b.y - y * b.x, x * b.x + y * b.y);
    const r = Math.hypot(b.x, b.y);
    if (r < 1) Object.assign(b, { x: b.x / r, y: b.y / r }); // posé à la surface
    s.fate = r < 1 ? 'landed' : r > 9 ? 'gone' : Math.abs(s.theta) >= TAU ? 'orbit' : 'fly';
    s.pts.push(escr(b.x, b.y));
  }
}

/** Ce que fait le boulet, déduit des seuils exacts (apogée ou périgée au point de tir). */
function verdict(v: number): string {
  const k2 = (v / 7.9) ** 2;
  if (v < V_HIT) return 'Trop lent : le boulet retombe. Mais plus il part vite, plus il tombe loin — la Terre est ronde, le sol se dérobe sous lui. Son arc est un morceau d’ellipse dont le centre de la Terre est un foyer.';
  if (v < 7.85) return 'Presque ! Le boulet ne touche plus le sol : il rase la Terre à l’opposé puis revient à la montagne — une ellipse dont le point de tir est le point le plus haut (l’apogée).';
  if (v < 7.95) return 'Orbite circulaire : à chaque instant, le boulet tombe exactement autant que la Terre se courbe sous lui.';
  if (k2 >= 2) return 'Vitesse de libération dépassée : v²/2 > GM/r, l’énergie est positive, le boulet quitte la Terre pour toujours.';
  const far = (RC * k2) / (2 - k2) > 3.2; // apogée hors de l'écran
  return `Ellipse : le boulet s’éloigne, ralentit, puis revient frôler la montagne — le point de tir est devenu le périgée.${far ? ' Si allongée qu’elle sort de l’écran : il reviendra… dans longtemps.' : ''}`;
}

function drawCannon(ctx: Ctx, c: Colors, old: Pt[][], s: Shot | null, v: number): void {
  ctx.clearRect(0, 0, W, H);
  for (const pts of old) polyline(ctx, pts, c.dim, 1.5, 0.5);
  dot(ctx, EX, EY, ES, c.accent, 0.18);
  ctx.lineWidth = 2;
  circle(ctx, EX, EY, ES, c.accent, 'stroke');
  const [tx, ty] = escr(0, RC);
  fillPoly(ctx, [[EX - 26, EY - ES + 4], [tx, ty], [EX + 26, EY - ES + 4]], c.dim);
  ctx.fillStyle = c.text;
  ctx.fillRect(tx - 3, ty - 6, 15, 5); // le canon, pointé à l'horizontale
  if (s) polyline(ctx, s.pts, c.warn, 2);
  if (s && s.fate !== 'gone') dot(ctx, ...escr(s.b.x, s.b.y), 4.5, c.warn);
  ctx.fillStyle = c.text;
  ctx.fillText(`tir à ${fr(v, 1)} km/s`, 12, 20);
  ctx.fillStyle = c.dim;
  ctx.fillText('v₁ = √(GM/r) ≈ 7,9 km/s : cercle  ·  v_lib = √2·v₁ ≈ 11,2 km/s : libération', 12, 38);
}

function CannonView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v, setV] = useState(7);
  const shotRef = useRef<Shot | null>(null);
  const oldRef = useRef<Pt[][]>([]);

  const fire = () => {
    if (shotRef.current) oldRef.current = [...oldRef.current.slice(-6), shotRef.current.pts];
    shotRef.current = { b: { x: 0, y: RC, vx: v / KMS, vy: 0 }, pts: [escr(0, RC)], theta: 0, fate: 'fly' };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas && setup(canvas);
    if (!canvas || !ctx) return;
    let raf = 0;
    const draw = () => {
      if (shotRef.current) advanceShot(shotRef.current);
      drawCannon(ctx, theme(canvas), oldRef.current, shotRef.current, v);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [v]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          vitesse {fr(v, 1)} km/s
          <input type="range" min={3} max={12} step={0.1} value={v} onChange={(e) => setV(Number(e.target.value))} />
        </label>
        <button type="button" className="btn btn-ghost" onClick={() => setV(7.9)}>v₁ = 7,9</button>
        <button type="button" className="btn btn-ghost" onClick={() => setV(11.2)}>v_lib = 11,2</button>
        <button type="button" className="btn btn-primary" onClick={fire}>Feu !</button>
        <button type="button" className="btn btn-ghost" onClick={() => { oldRef.current = []; shotRef.current = null; }}>Effacer</button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none' }} />
      <p className="physics-caption">
        {verdict(v)} Newton (Principia, 1687) : la Lune fait exactement cela — <strong>elle tombe en permanence… et rate la Terre à chaque fois</strong>. (Montagne très exagérée et pas d’air, sinon le boulet freinerait.)
      </p>
    </div>
  );
}

export function OrbitExplorer({ mode = 'kepler' }: { mode?: 'kepler' | 'escape' }) {
  return mode === 'escape' ? <CannonView /> : <KeplerView />;
}
