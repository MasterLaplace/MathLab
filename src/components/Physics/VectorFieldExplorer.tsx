import { useEffect, useState } from 'react';
import { useRef } from 'react';
import './physics.css';

interface FieldSpec {
  name: string;
  f: (x: number, y: number) => [number, number];
  caption: string;
  /** Potentiel scalaire affiché en fond (mode gradient). */
  potential?: (x: number, y: number) => number;
}

const FIELDS: Record<string, FieldSpec> = {
  source: {
    name: 'Source  F = (x, y)',
    f: (x, y) => [x, y],
    caption:
      'Tout jaillit du centre : la divergence est positive (une « source »). C’est la forme du champ électrique autour d’une charge.',
  },
  vortex: {
    name: 'Tourbillon  F = (−y, x)',
    f: (x, y) => [-y, x],
    caption:
      'Tout tourne sans jamais s’étaler : divergence nulle, mais rotationnel non nul. C’est le champ magnétique autour d’un fil.',
  },
  uniform: {
    name: 'Uniforme  F = (1, 0)',
    f: () => [1, 0],
    caption:
      'Un courant constant : ni source, ni tourbillon — divergence et rotationnel valent zéro.',
  },
};

const GRADIENT_FIELDS: Record<string, FieldSpec> = {
  hill: {
    name: 'Colline  F = ∇f',
    potential: (x, y) => Math.exp(-(x * x + y * y) * 0.55),
    f: (x, y) => {
      const e = Math.exp(-(x * x + y * y) * 0.55);
      return [-2 * 0.55 * x * e * 3, -2 * 0.55 * y * e * 3];
    },
    caption:
      'f est une colline (claire au sommet). Le gradient ∇f pointe partout vers la plus forte montée : les particules grimpent et s’entassent au sommet.',
  },
  bowl: {
    name: 'Bol  F = −∇f',
    potential: (x, y) => -(x * x + y * y) * 0.35,
    f: (x, y) => [-x, -y],
    caption:
      'f est un bol (sombre au fond). Une bille suit −∇f, la descente la plus raide : c’est exactement la force qui dérive d’une énergie potentielle.',
  },
  saddle: {
    name: 'Selle  F = ∇f',
    potential: (x, y) => (x * x - y * y) * 0.4,
    f: (x, y) => [2 * 0.4 * x * 2, -2 * 0.4 * y * 2],
    caption:
      'Sur une selle, le gradient fuit le col selon x et y converge selon y : monter « tout droit » dépend de la direction. Les dérivées partielles ne disent pas la même chose.',
  },
};

interface VectorFieldExplorerProps {
  /** 'gradient' : champs issus d'un potentiel, affiché en fond. */
  mode?: 'fields' | 'gradient';
}

/**
 * Champs de vecteurs : visualiser la divergence (source), le rotationnel
 * (tourbillon) et le gradient d'un potentiel, avec des particules advectées.
 */
export function VectorFieldExplorer({ mode = 'fields' }: VectorFieldExplorerProps) {
  const fields = mode === 'gradient' ? GRADIENT_FIELDS : FIELDS;
  const [kind, setKind] = useState<string>(Object.keys(fields)[0]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kindRef = useRef(kind);
  kindRef.current = kind;
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  const W = 560;
  const H = 300;

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
    const colArrow = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colDot = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colHigh = css.getPropertyValue('--warn').trim() || '#ffb454';

    // Coordonnées monde : [-3,3] × [-1.6,1.6]
    const SX = 3;
    const SY = 1.6;
    const px = (x: number) => ((x + SX) / (2 * SX)) * W;
    const py = (y: number) => H - ((y + SY) / (2 * SY)) * H;

    // Particules advectées
    const N = 90;
    const parts = Array.from({ length: N }, () => ({
      x: (Math.random() * 2 - 1) * SX,
      y: (Math.random() * 2 - 1) * SY,
      age: Math.random() * 4,
    }));

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const spec = fieldsRef.current[kindRef.current] ?? Object.values(fieldsRef.current)[0];
      const field = spec.f;

      ctx.clearRect(0, 0, W, H);

      // Fond : le potentiel scalaire (clair = haut, sombre = bas)
      if (spec.potential) {
        const CW = 14;
        const CH = 12;
        for (let i = 0; i < W / CW; i++) {
          for (let j = 0; j < H / CH; j++) {
            const x = -SX + ((i + 0.5) * CW * 2 * SX) / W;
            const y = SY - ((j + 0.5) * CH * 2 * SY) / H;
            const v = spec.potential(x, y);
            ctx.fillStyle = colHigh;
            ctx.globalAlpha = Math.max(0, Math.min(0.55, (v + 1.2) * 0.3));
            ctx.fillRect(i * CW, j * CH, CW, CH);
          }
        }
        ctx.globalAlpha = 1;
      }

      // Axes discrets
      ctx.strokeStyle = colAxis;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py(0));
      ctx.lineTo(W, py(0));
      ctx.moveTo(px(0), 0);
      ctx.lineTo(px(0), H);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Grille de flèches
      ctx.strokeStyle = colArrow;
      ctx.fillStyle = colArrow;
      ctx.lineWidth = 1.2;
      for (let gx = -2.6; gx <= 2.6; gx += 0.65) {
        for (let gy = -1.4; gy <= 1.4; gy += 0.55) {
          const [fx, fy] = field(gx, gy);
          const mag = Math.hypot(fx, fy) || 1;
          const ux = (fx / mag) * 0.22;
          const uy = (fy / mag) * 0.22;
          const x1 = px(gx - ux / 2);
          const y1 = py(gy - uy / 2);
          const x2 = px(gx + ux / 2);
          const y2 = py(gy + uy / 2);
          ctx.globalAlpha = Math.min(0.25 + mag / 4, 0.8);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          const angle = Math.atan2(y2 - y1, x2 - x1);
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x2 - 5 * Math.cos(angle - 0.4), y2 - 5 * Math.sin(angle - 0.4));
          ctx.lineTo(x2 - 5 * Math.cos(angle + 0.4), y2 - 5 * Math.sin(angle + 0.4));
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Particules
      ctx.fillStyle = colDot;
      for (const p of parts) {
        const [fx, fy] = field(p.x, p.y);
        p.x += fx * dt * 0.5;
        p.y += fy * dt * 0.5;
        p.age += dt;
        const still = Math.hypot(fx, fy) < 0.03;
        const out = Math.abs(p.x) > SX || Math.abs(p.y) > SY || p.age > 5 || (still && p.age > 2);
        if (out) {
          p.x = (Math.random() * 2 - 1) * SX * 0.8;
          p.y = (Math.random() * 2 - 1) * SY * 0.8;
          p.age = 0;
        }
        ctx.globalAlpha = Math.max(0.15, 1 - p.age / 5);
        ctx.beginPath();
        ctx.arc(px(p.x), py(p.y), 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {Object.keys(fields).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${kind === k ? 'btn-primary' : ''}`}
            onClick={() => setKind(k)}
          >
            {fields[k].name}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">{(fields[kind] ?? Object.values(fields)[0]).caption}</p>
    </div>
  );
}
