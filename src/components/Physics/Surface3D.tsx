import { useEffect, useRef, useState } from 'react';
import type { SurfaceKind } from '../../content/schema';
import './physics.css';

const SURFACES: Record<
  SurfaceKind,
  { name: string; f: (x: number, y: number, t: number) => number; animated: boolean; caption: string }
> = {
  bowl: {
    name: 'Bol  z = x² + y²',
    f: (x, y) => 0.3 * (x * x + y * y) - 1.1,
    animated: false,
    caption:
      'Un minimum au centre : dans toutes les directions, ça monte. Les deux dérivées partielles s’annulent au fond du bol.',
  },
  saddle: {
    name: 'Selle  z = x² − y²',
    f: (x, y) => 0.32 * (x * x - y * y),
    animated: false,
    caption:
      'Le point selle : minimum dans une direction, maximum dans l’autre. Les dérivées partielles s’annulent au centre… sans que ce soit un sommet.',
  },
  wave: {
    name: 'Onde  z = sin(r − t)',
    f: (x, y, t) => {
      const r = Math.hypot(x, y);
      return (0.7 * Math.sin(2.2 * r - t)) / (1 + 0.5 * r);
    },
    animated: true,
    caption:
      'Une onde circulaire qui se propage : la surface dépend de x, y… et du temps. Trois dimensions plus une : voilà la « 4D » apprivoisée.',
  },
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const num = parseInt(v, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface Surface3DProps {
  fn?: SurfaceKind;
}

/**
 * Surfaces z = f(x, y) en 3D — renderer canvas maison :
 * projection après rotation yaw/pitch, tri des faces (painter's algorithm),
 * éclairage lambertien. ~1000 quads : 60 fps sans bibliothèque.
 */
export function Surface3D({ fn = 'bowl' }: Surface3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<SurfaceKind>(fn);
  const [playing, setPlaying] = useState(true);
  const stateRef = useRef({ yaw: 0.7, pitch: 0.5, t: 0, playing: true, kind });
  stateRef.current.kind = kind;
  stateRef.current.playing = playing;
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const W = 560;
  const H = 360;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(canvas);
    const low = hexToRgb(css.getPropertyValue('--accent').trim() || '#6a8dff');
    const high = hexToRgb(css.getPropertyValue('--warn').trim() || '#ffb454');

    const N = 26; // quads par côté
    const R = 2.2; // demi-étendue du domaine
    const SCALE = 92;
    const F = 9; // distance focale (légère perspective)

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const st = stateRef.current;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const spec = SURFACES[st.kind];
      if (spec.animated && st.playing) st.t += dt * 2.2;

      const cosY = Math.cos(st.yaw);
      const sinY = Math.sin(st.yaw);
      const cosP = Math.cos(st.pitch);
      const sinP = Math.sin(st.pitch);

      // Monde → écran (+ profondeur pour le tri)
      const project = (x: number, y: number, z: number): [number, number, number] => {
        const x1 = x * cosY - y * sinY;
        const y1 = x * sinY + y * cosY;
        const depth = y1 * cosP - z * sinP;
        const up = y1 * sinP + z * cosP;
        const pers = F / (F + depth);
        return [W / 2 + x1 * SCALE * pers, H / 2 + 20 - up * SCALE * pers, depth];
      };

      // Sommets de la grille
      const P: [number, number, number][][] = [];
      const Z: number[][] = [];
      for (let i = 0; i <= N; i++) {
        P.push([]);
        Z.push([]);
        for (let j = 0; j <= N; j++) {
          const x = -R + (2 * R * i) / N;
          const y = -R + (2 * R * j) / N;
          const z = spec.f(x, y, st.t);
          Z[i].push(z);
          P[i].push(project(x, y, z));
        }
      }

      // Quads triés du plus lointain au plus proche
      interface Quad {
        depth: number;
        pts: [number, number][];
        zMid: number;
        shade: number;
      }
      const light = { x: 0.42, y: -0.55, z: 0.72 };
      const quads: Quad[] = [];
      const cell = (2 * R) / N;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const p00 = P[i][j];
          const p10 = P[i + 1][j];
          const p11 = P[i + 1][j + 1];
          const p01 = P[i][j + 1];
          // Normale via les pentes locales : n = (−∂z/∂x, −∂z/∂y, 1)
          const dzdx = (Z[i + 1][j] - Z[i][j]) / cell;
          const dzdy = (Z[i][j + 1] - Z[i][j]) / cell;
          const nl = Math.hypot(dzdx, dzdy, 1);
          const dot = (-dzdx * light.x - dzdy * light.y + light.z) / nl;
          quads.push({
            depth: (p00[2] + p10[2] + p11[2] + p01[2]) / 4,
            pts: [
              [p00[0], p00[1]],
              [p10[0], p10[1]],
              [p11[0], p11[1]],
              [p01[0], p01[1]],
            ],
            zMid: (Z[i][j] + Z[i + 1][j] + Z[i + 1][j + 1] + Z[i][j + 1]) / 4,
            shade: 0.45 + 0.55 * Math.max(0, dot),
          });
        }
      }
      quads.sort((a, b) => b.depth - a.depth);

      ctx.clearRect(0, 0, W, H);
      for (const q of quads) {
        const t = Math.max(0, Math.min(1, (q.zMid + 1.2) / 2.4));
        const r = Math.round((low[0] + (high[0] - low[0]) * t) * q.shade);
        const g = Math.round((low[1] + (high[1] - low[1]) * t) * q.shade);
        const b = Math.round((low[2] + (high[2] - low[2]) * t) * q.shade);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.strokeStyle = `rgba(0,0,0,0.25)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(q.pts[0][0], q.pts[0][1]);
        for (let k = 1; k < 4; k++) ctx.lineTo(q.pts[k][0], q.pts[k][1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const st = stateRef.current;
    st.yaw += (e.clientX - dragRef.current.x) * 0.008;
    st.pitch = Math.max(0.08, Math.min(1.35, st.pitch + (e.clientY - dragRef.current.y) * 0.006));
    dragRef.current = { x: e.clientX, y: e.clientY };
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const spec = SURFACES[kind];

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(SURFACES) as SurfaceKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${kind === k ? 'btn-primary' : ''}`}
            onClick={() => setKind(k)}
          >
            {SURFACES[k].name}
          </button>
        ))}
        {spec.animated && (
          <button type="button" className="btn" onClick={() => setPlaying((v) => !v)}>
            {playing ? '⏸ Figer le temps' : '▶ Relancer le temps'}
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p className="physics-caption">{spec.caption} Fais tourner la surface avec la souris.</p>
    </div>
  );
}
