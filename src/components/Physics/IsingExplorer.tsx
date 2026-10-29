import { useEffect, useId, useRef, useState } from 'react';
import './physics.css';

/**
 * Le modèle d'Ising 2D : un aimant réduit à une grille de spins ±1 qui veulent
 * s'aligner sur leurs voisins, secoués par la température. Algorithme de
 * Metropolis : chaque retournement qui coûte ΔE n'est accepté qu'avec la
 * probabilité de Boltzmann e^(−ΔE/kT). Sous T_c ≈ 2,269 l'ordre gagne, au-dessus
 * l'agitation gagne — et pile au point critique, des îles fractales de toutes tailles.
 */

const L = 100;
const NS = L * L;
const W = 560;
const H = 400;
const GRID = 400;
const CELL = GRID / L;
const TC = 2 / Math.log(1 + Math.SQRT2);
const PX = 416; // panneau de droite
const PW = W - PX - 6;
const GRAPH = { y: 206, h: 172 };
const HIST_LEN = 140;
const BRUSH = 2.5; // rayon du pinceau, en cases

type RGB = [number, number, number];
interface IsingState {
  s: Int8Array;
  M: number; // Σ s
  hist: Float32Array; // m(t) récents
  count: number;
  frame: number;
  brush: { down: boolean; x: number; y: number };
}

const dec = (x: number, d: number) => x.toFixed(d).replace('.', ',');
/** Aimantation spontanée exacte d'Onsager-Yang (réseau infini). */
const onsager = (T: number) => (T >= TC ? 0 : (1 - Math.sinh(2 / T) ** -4) ** 0.125);

function rgbOf(color: string, fb: RGB): RGB {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!m) return fb;
  const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const v = parseInt(hex, 16);
  return [v >> 16, (v >> 8) & 255, v & 255];
}

function randomize(s: Int8Array): number {
  let M = 0;
  for (let i = 0; i < NS; i++) {
    s[i] = Math.random() < 0.5 ? 1 : -1;
    M += s[i];
  }
  return M;
}

/** Un balayage de Metropolis (L² tentatives, bords périodiques) ; renvoie la variation de Σs. */
function sweep(s: Int8Array, w4: number, w8: number): number {
  let dM = 0;
  for (let a = 0; a < NS; a++) {
    const i = (Math.random() * NS) | 0;
    const x = i % L;
    const row = i - x;
    const left = x === 0 ? i + L - 1 : i - 1;
    const right = x === L - 1 ? i - L + 1 : i + 1;
    const up = row === 0 ? i + NS - L : i - L;
    const down = row === NS - L ? i - NS + L : i + L;
    const dE = 2 * s[i] * (s[left] + s[right] + s[up] + s[down]); // ∈ {−8, −4, 0, 4, 8} (unités J)
    if (dE <= 0 || Math.random() < (dE === 4 ? w4 : w8)) {
      s[i] = -s[i];
      dM += 2 * s[i];
    }
  }
  return dM;
}

export function IsingExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<IsingState | null>(null);
  if (simRef.current === null) {
    const s = new Int8Array(NS);
    const brush = { down: false, x: 0, y: 0 };
    simRef.current = { s, M: randomize(s), hist: new Float32Array(HIST_LEN), count: 0, frame: 0, brush };
  }
  const sim = simRef.current;
  const [T, setT] = useState(2.27);
  const [running, setRunning] = useState(true);
  const [quenched, setQuenched] = useState(false);
  const listId = useId();
  const w4 = Math.exp(-4 / T);
  const w8 = Math.exp(-8 / T);
  const mTheo = onsager(T);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const off = document.createElement('canvas');
    off.width = L;
    off.height = L;
    const octx = off.getContext('2d');
    if (!canvas || !ctx || !octx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const img = octx.createImageData(L, L);
    const css = getComputedStyle(canvas);
    const col = (v: string, fb: string) => css.getPropertyValue(v).trim() || fb;
    let raf = 0;
    const frame = () => {
      if (running) {
        sim.M += sweep(sim.s, w4, w8);
        if (sim.frame++ % 3 === 0) sim.hist[sim.count++ % HIST_LEN] = Math.abs(sim.M) / NS;
      }
      const m = Math.abs(sim.M) / NS;
      const [cText, cDim, cOk, cBorder] = [
        col('--text', '#e8eaf2'),
        col('--text-dim', '#9aa2bd'),
        col('--ok', '#4cc38a'),
        col('--border', '#2e3550'),
      ];
      const up = rgbOf(col('--accent', '#6a8dff'), [106, 141, 255]);
      const dn = rgbOf(col('--warn', '#ffb454'), [255, 180, 84]);
      const d = img.data;
      for (let i = 0; i < NS; i++) {
        const c = sim.s[i] > 0 ? up : dn;
        d[4 * i] = c[0];
        d[4 * i + 1] = c[1];
        d[4 * i + 2] = c[2];
        d[4 * i + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, GRID, GRID);

      // Panneau : aimantation, température, facteurs de Boltzmann, m(t).
      ctx.textAlign = 'left';
      ctx.fillStyle = cDim;
      ctx.font = '12px system-ui';
      ctx.fillText('aimantation |Σs|/N', PX, 16);
      ctx.fillStyle = cText;
      ctx.font = '600 22px system-ui';
      ctx.fillText(`m = ${dec(m, 2)}`, PX, 44);
      ctx.fillStyle = cBorder;
      ctx.fillRect(PX, 54, PW, 10);
      ctx.fillStyle = `rgb(${up.join(',')})`;
      ctx.fillRect(PX, 54, PW * m, 10);
      ctx.font = '12px system-ui';
      ctx.fillStyle = cText;
      ctx.fillText(`T = ${dec(T, 2)} J/k`, PX, 90);
      ctx.fillStyle = cDim;
      ctx.fillText('T_c ≈ 2,269', PX, 106);
      ctx.fillText('Boltzmann (ΔE > 0) :', PX, 134);
      ctx.fillStyle = cText;
      ctx.fillText(`e^(−4/T) = ${dec(w4, 3)}`, PX, 152);
      ctx.fillText(`e^(−8/T) = ${dec(w8, 3)}`, PX, 168);
      ctx.fillStyle = cDim;
      ctx.fillText('m(t)', PX, GRAPH.y - 6);
      const gy = (v: number) => GRAPH.y + GRAPH.h * (1 - v);
      ctx.strokeStyle = cDim;
      ctx.lineWidth = 1;
      ctx.strokeRect(PX, GRAPH.y, PW, GRAPH.h);
      if (mTheo > 0) {
        ctx.strokeStyle = cOk;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(PX, gy(mTheo));
        ctx.lineTo(PX + PW, gy(mTheo));
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = cOk;
        ctx.textAlign = 'right';
        ctx.fillText('Onsager', PX + PW - 3, gy(mTheo) + (mTheo > 0.85 ? 14 : -4));
      }
      ctx.strokeStyle = cText;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const n = Math.min(sim.count, HIST_LEN);
      for (let j = 0; j < n; j++) {
        ctx.lineTo(PX + (j / (HIST_LEN - 1)) * PW, gy(sim.hist[(sim.count - n + j) % HIST_LEN]));
      }
      ctx.stroke();
      ctx.fillStyle = cDim;
      ctx.textAlign = 'right';
      ctx.fillText('temps →', PX + PW, GRAPH.y + GRAPH.h + 16);
      ctx.textAlign = 'left';
      ctx.fillText('1', PX + 3, GRAPH.y + 13);
      ctx.fillText('0', PX + 3, GRAPH.y + GRAPH.h - 4);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [T, running, sim, w4, w8, mTheo]);

  /** Force à +1 les spins dans un disque du pinceau (bords périodiques). */
  const stamp = (cx: number, cy: number) => {
    const r = Math.ceil(BRUSH);
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > BRUSH * BRUSH) continue;
        const i = (((Math.floor(cx) + dx) % L) + L) % L;
        const j = (((Math.floor(cy) + dy) % L) + L) % L;
        if (sim.s[j * L + i] < 0) {
          sim.s[j * L + i] = 1;
          sim.M += 2;
        }
      }
    }
  };

  const paint = (e: React.PointerEvent<HTMLCanvasElement>, start: boolean) => {
    const b = sim.brush;
    if (!start && !b.down) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const gx = ((e.clientX - rect.left) * (W / rect.width)) / CELL;
    const gy = ((e.clientY - rect.top) * (H / rect.height)) / CELL;
    if (gx < 0 || gx >= L || gy < 0 || gy >= L) return;
    if (start) {
      e.currentTarget.setPointerCapture(e.pointerId);
      Object.assign(b, { down: true, x: gx, y: gy });
    }
    const steps = Math.ceil(Math.hypot(gx - b.x, gy - b.y));
    for (let k = 0; k <= steps; k++) {
      const t = steps ? k / steps : 1;
      stamp(b.x + (gx - b.x) * t, b.y + (gy - b.y) * t);
    }
    b.x = gx;
    b.y = gy;
  };
  const release = () => {
    sim.brush.down = false;
  };

  const setTemp = (v: number) => {
    setT(v);
    setQuenched(false);
  };
  const phase = T < TC - 0.12 ? 'ordre' : T > TC + 0.12 ? 'désordre' : 'critique';

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          température T = {dec(T, 2)}
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.01}
            list={listId}
            value={T}
            onChange={(e) => setTemp(Number(e.target.value))}
          />
          <datalist id={listId}>
            <option value="2.27" label="T_c" />
          </datalist>
        </label>
        <button type="button" className={`btn ${Math.abs(T - TC) < 0.01 ? 'btn-primary' : ''}`} onClick={() => setTemp(2.27)}>
          T = T_c
        </button>
        <button type="button" className="btn" onClick={() => setRunning((r) => !r)}>
          {running ? '⏸ Pause' : '▶ Lecture'}
        </button>
      </div>
      <div className="physics-controls">
        <button type="button" className="btn" onClick={() => {
            sim.s.fill(1);
            sim.M = NS;
          }}>
          Tout aligner (+1)
        </button>
        <button type="button" className="btn" onClick={() => {
            sim.M = randomize(sim.s);
          }}>
          Hasard total (T infinie)
        </button>
        <button
          type="button"
          className={`btn ${quenched ? 'btn-primary' : ''}`}
          onClick={() => {
            sim.M = randomize(sim.s);
            setT(1);
            setQuenched(true);
          }}
        >
          Trempe (hasard → T = 1)
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: 'auto', aspectRatio: `${W} / ${H}`, maxWidth: '100%', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => paint(e, true)}
        onPointerMove={(e) => paint(e, false)}
        onPointerUp={release}
        onPointerCancel={release}
      />
      <p className="physics-caption" style={{ color: 'var(--text)' }}>
        {quenched
          ? 'Trempe : on fige brutalement un état chaotique à T = 1. Chaque région choisit son camp au hasard ; les frontières coûtent de l’énergie et raccourcissent lentement (la taille des domaines croît comme √t). Parfois une bande fait le tour du tore et reste bloquée très longtemps.'
          : phase === 'ordre'
            ? `T < T_c : l’ordre gagne. Aligner deux voisins abaisse l’énergie, et l’agitation est trop faible pour défaire les grands domaines : l’aimant s’aimante. Onsager (1944) prédit exactement m = ${dec(mTheo, 2)} à cette température (pointillés verts) — si tu pars du hasard, il faut attendre que les domaines se mangent ; « Tout aligner » montre l’équilibre directement.`
            : phase === 'critique'
              ? 'T ≈ T_c : point critique. Des îles de toutes tailles, imbriquées comme une fractale — aucune échelle n’est privilégiée. C’est l’opalescence critique : un fluide à son point critique devient laiteux, car ses fluctuations ont toutes les tailles, y compris celle de la lumière.'
              : 'T > T_c : l’agitation gagne. Du bruit sans ordre à grande échelle, m ≈ 0 : chaque spin ne sent plus que ses voisins immédiats, et les petits amas se font et se défont sans cesse.'}
      </p>
      <p className="physics-caption">
        {L}×{L} spins (bleu +1, orange −1), bords périodiques (un tore). À chaque tentative, on calcule ΔE =
        2·s·(somme des 4 voisins) : un retournement qui abaisse l’énergie est toujours accepté ; s’il coûte
        ΔE &gt; 0, il ne l’est qu’avec la probabilité de Boltzmann e^(−ΔE/kT) — ici {dec(w4, 3)} pour ΔE = 4J et{' '}
        {dec(w8, 3)} pour ΔE = 8J. Un balayage de {NS.toLocaleString('fr-FR')} tentatives par image.{' '}
        <strong>Glisse sur la grille</strong> pour forcer des spins à +1.
      </p>
    </div>
  );
}
