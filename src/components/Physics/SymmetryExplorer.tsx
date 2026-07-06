import { useEffect, useRef, useState } from 'react';
import { composeD4 } from '../../core/rules/groupes';
import './physics.css';

/**
 * Les symétries du carré, avec les mains : chaque bouton applique une
 * rotation ou un miroir, les coins numérotés suivent. La ligne du bas
 * écrit la composition (la dernière action à gauche) et son résultat net —
 * huit symétries seulement, quoi qu'on fasse : c'est le groupe D₄.
 */

interface Dihedral {
  k: number;
  f: 0 | 1;
}

const GENERATORS: { sym: string; label: string; g: Dihedral }[] = [
  { sym: 'r', label: 'r — tourner 90°', g: { k: 1, f: 0 } },
  { sym: 'h', label: 'h — miroir horizontal', g: { k: 0, f: 1 } },
  { sym: 'v', label: 'v — miroir vertical', g: { k: 2, f: 1 } },
  { sym: 'd', label: 'd — miroir diagonal', g: { k: 1, f: 1 } },
  { sym: 'd′', label: 'd′ — miroir anti-diagonal', g: { k: 3, f: 1 } },
];

const NAMES: Record<string, string> = {
  '0,0': '𝟙',
  '1,0': 'r',
  '2,0': 'r²',
  '3,0': 'r³',
  '0,1': 'h',
  '1,1': 'd',
  '2,1': 'v',
  '3,1': 'd′',
};

function nameOf(g: Dihedral): string {
  return NAMES[`${g.k},${g.f}`];
}

/** Applique r^k f^ε à un point (f d'abord : miroir horizontal y → −y). */
function apply(g: Dihedral, x: number, y: number): [number, number] {
  let px = x;
  let py = g.f === 1 ? -y : y;
  for (let i = 0; i < g.k; i++) {
    const t = px;
    px = -py;
    py = t;
  }
  return [px, py];
}

export function SymmetryExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<Dihedral>({ k: 0, f: 0 });
  const [history, setHistory] = useState<string[]>([]);

  const W = 560;
  const H = 320;
  const CX = W / 2;
  const CY = H / 2;
  const R = 105;

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
    const colAccent = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const cornerColors = ['#e5484d', '#f5a524', '#4cc38a', '#6a8dff'];

    ctx.clearRect(0, 0, W, H);

    const px = (x: number) => CX + x * R;
    const py = (y: number) => CY - y * R;

    // Fantôme : le carré de départ, coins d'origine en filigrane.
    const corners = [
      { n: 1, x: 1, y: 1 },
      { n: 2, x: -1, y: 1 },
      { n: 3, x: -1, y: -1 },
      { n: 4, x: 1, y: -1 },
    ];
    ctx.strokeStyle = colDim;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(px(-1), py(1), 2 * R, 2 * R);
    ctx.setLineDash([]);
    ctx.font = '600 12px system-ui';
    ctx.fillStyle = colDim;
    for (const c of corners) {
      ctx.fillText(String(c.n), px(c.x) + (c.x > 0 ? 10 : -18), py(c.y) + (c.y > 0 ? -8 : 18));
    }
    ctx.globalAlpha = 1;

    // Le carré courant : chaque coin coloré est envoyé par la symétrie.
    ctx.strokeStyle = colAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(px(-1), py(1), 2 * R, 2 * R);
    ctx.font = '700 15px system-ui';
    for (const c of corners) {
      const [x, y] = apply(state, c.x, c.y);
      ctx.fillStyle = cornerColors[c.n - 1];
      ctx.beginPath();
      ctx.arc(px(x), py(y), 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(String(c.n), px(x) - 4, py(y) + 5);
    }

    ctx.fillStyle = colDim;
    ctx.font = '600 13px system-ui';
    const compo = history.length > 0 ? `${[...history].reverse().join(' ∘ ')} = ${nameOf(state)}` : 'position de départ : 𝟙';
    ctx.fillText(compo, 16, H - 14);
  }, [state, history]);

  return (
    <div className="physics-sim">
      <div className="physics-controls" style={{ flexWrap: 'wrap' }}>
        {GENERATORS.map((gen) => (
          <button
            key={gen.sym}
            type="button"
            className="btn"
            onClick={() => {
              setState((s) => composeD4(gen.g, s));
              setHistory((hs) => [...hs, gen.sym]);
            }}
          >
            {gen.label}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setState({ k: 0, f: 0 });
            setHistory([]);
          }}
        >
          ↺ 𝟙
        </button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Enchaîne rotations et miroirs : les coins colorés suivent, et la ligne du bas écrit la
        composition (la dernière action s'écrit à gauche). Quoi que tu fasses, le résultat net est
        toujours l'une des 8 symétries — deux miroirs font une rotation, jamais l'inverse.
      </p>
    </div>
  );
}
