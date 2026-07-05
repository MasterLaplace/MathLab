import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Domain coloring : une fonction complexe w = f(z) peinte sur le plan.
 * La teinte encode l'argument de f(z), la luminosité son module (lignes
 * de niveau |f| en puissances de 2). Zéros = puits sombres où toutes les
 * couleurs se rencontrent ; pôles = sommets clairs, couleurs inversées.
 */
type FnKind = 'z2' | 'inv' | 'z2m1' | 'exp';

const FNS: Record<FnKind, { name: string; f: (re: number, im: number) => [number, number]; blurb: string }> = {
  z2: {
    name: 'f(z) = z²',
    f: (a, b) => [a * a - b * b, 2 * a * b],
    blurb: 'le zéro double en 0 : les couleurs font deux tours autour de lui',
  },
  inv: {
    name: 'f(z) = 1/z',
    f: (a, b) => {
      const d = a * a + b * b || 1e-9;
      return [a / d, -b / d];
    },
    blurb: 'un pôle en 0 : les couleurs tournent à l’envers et le module explose',
  },
  z2m1: {
    name: 'f(z) = (z² − 1)/z',
    f: (a, b) => {
      const re2 = a * a - b * b - 1;
      const im2 = 2 * a * b;
      const d = a * a + b * b || 1e-9;
      return [(re2 * a + im2 * b) / d, (im2 * a - re2 * b) / d];
    },
    blurb: 'deux zéros (±1) et un pôle (0) : compte les tours de couleur autour de chacun',
  },
  exp: {
    name: 'f(z) = e^z',
    f: (a, b) => [Math.exp(a) * Math.cos(b), Math.exp(a) * Math.sin(b)],
    blurb: 'jamais nulle ! périodique en 2πi : les bandes horizontales se répètent',
  },
};

export function DomainColoringExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [kind, setKind] = useState<FnKind>('z2');

  const W = 420;
  const H = 420;
  const RANGE = 2.4;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = W;
    canvas.height = H;

    const img = ctx.createImageData(W, H);
    const data = img.data;
    const f = FNS[kind].f;

    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const re = ((px / W) * 2 - 1) * RANGE;
        const im = -((py / H) * 2 - 1) * RANGE;
        const [wr, wi] = f(re, im);
        const arg = Math.atan2(wi, wr);
        const mod = Math.hypot(wr, wi);
        // Teinte = argument ; luminosité = module (contours log2).
        const hue = ((arg + Math.PI) / (2 * Math.PI)) * 360;
        const level = Math.log2(mod + 1e-12);
        const frac = level - Math.floor(level);
        const light = 0.35 + 0.3 * frac;
        const [r, g, b] = hslToRgb(hue, 0.85, Math.min(0.85, Math.max(0.12, light)));
        const idx = (py * W + px) * 4;
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // Axes
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '600 12px system-ui';
    ctx.fillText('1', W / 2 + (W / 2 / RANGE) - 4, H / 2 + 14);
    ctx.fillText('i', W / 2 + 6, H / 2 - (H / 2 / RANGE) + 4);
  }, [kind]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        {(Object.keys(FNS) as FnKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className={`btn ${kind === k ? 'btn-primary' : ''}`}
            onClick={() => setKind(k)}
          >
            {FNS[k].name}
          </button>
        ))}
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Chaque point z du plan est peint avec la couleur de f(z) : la <strong>teinte</strong> est
        l’angle de f(z), la <strong>luminosité</strong> son module (un anneau par doublement). Un zéro
        est un puits où toutes les teintes convergent ; un pôle, son miroir inversé. Ici :{' '}
        {FNS[kind].blurb}.
      </p>
    </div>
  );
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
