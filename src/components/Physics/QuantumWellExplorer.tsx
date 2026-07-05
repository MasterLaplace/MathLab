import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le puits infini : les états propres ψₙ(x) = sin(nπx/L) — la corde
 * vibrante de la station O, devenue quantique. Chaque mode tourne dans le
 * plan complexe à sa fréquence Eₙ ∝ n² (partie réelle bleue, imaginaire
 * verte, |ψ|² en aire). En superposition, |ψ|² se met à osciller : le
 * mouvement naît de la différence des énergies.
 */
export function QuantumWellExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(1);
  const [superpose, setSuperpose] = useState(false);
  const tRef = useRef(0);

  const W = 560;
  const H = 330;

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
    const colRe = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colIm = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colProb = css.getPropertyValue('--warn').trim() || '#e5a742';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const PAD = 46;
    const CY = H / 2 - 10;
    const AMP = 62;
    const E = (k: number) => 0.55 * k * k; // Eₙ ∝ n²

    // ψ(x, t) : mode n pur, ou superposition (ψ₁ + ψ₂)/√2.
    const psi = (u: number, t: number): [number, number] => {
      if (!superpose) {
        const a = Math.sin(n * Math.PI * u);
        return [a * Math.cos(E(n) * t), -a * Math.sin(E(n) * t)];
      }
      const a1 = Math.sin(Math.PI * u) / Math.SQRT2;
      const a2 = Math.sin(2 * Math.PI * u) / Math.SQRT2;
      return [
        a1 * Math.cos(E(1) * t) + a2 * Math.cos(E(2) * t),
        -a1 * Math.sin(E(1) * t) - a2 * Math.sin(E(2) * t),
      ];
    };

    let raf = 0;
    const draw = () => {
      tRef.current += 0.05;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Les murs du puits
      ctx.strokeStyle = colDim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(PAD, 20);
      ctx.lineTo(PAD, H - 30);
      ctx.moveTo(W - PAD, 20);
      ctx.lineTo(W - PAD, H - 30);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(PAD, CY);
      ctx.lineTo(W - PAD, CY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // |ψ|² : la probabilité de présence, en aire orangée sous la courbe.
      ctx.fillStyle = colProb;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(PAD, H - 30);
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        const [re, im] = psi(u, t);
        const p = (re * re + im * im) * 55;
        ctx.lineTo(PAD + u * (W - 2 * PAD), H - 30 - p);
      }
      ctx.lineTo(W - PAD, H - 30);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Partie réelle (bleue) et imaginaire (verte)
      for (const [part, col] of [
        [0, colRe],
        [1, colIm],
      ] as const) {
        ctx.strokeStyle = col;
        ctx.lineWidth = part === 0 ? 2.5 : 2;
        ctx.globalAlpha = part === 0 ? 1 : 0.8;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const u = i / 200;
          const v = psi(u, t)[part];
          const y = CY - v * AMP;
          if (i === 0) ctx.moveTo(PAD + u * (W - 2 * PAD), y);
          else ctx.lineTo(PAD + u * (W - 2 * PAD), y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.font = '600 13px system-ui';
      ctx.fillStyle = colRe;
      ctx.fillText('Re ψ', PAD + 6, 34);
      ctx.fillStyle = colIm;
      ctx.fillText('Im ψ', PAD + 52, 34);
      ctx.fillStyle = colProb;
      ctx.fillText('|ψ|² (probabilité)', PAD + 98, 34);
      ctx.fillStyle = colDim;
      ctx.fillText(
        superpose ? 'superposition (ψ₁ + ψ₂)/√2 : |ψ|² bouge !' : `état propre n = ${n} — E${sub(n)} = ${n * n}·E₁ — |ψ|² immobile`,
        PAD,
        H - 8,
      );

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [n, superpose]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          niveau n = {n}
          <input type="range" min={1} max={5} value={n} disabled={superpose} onChange={(e) => setN(Number(e.target.value))} />
        </label>
        <label>
          <input type="checkbox" checked={superpose} onChange={(e) => setSuperpose(e.target.checked)} /> superposition ψ₁ + ψ₂
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        La corde vibrante, devenue quantique : coincée entre deux murs, ψ n’accepte que les modes
        sin(nπx/L) — <strong>l’énergie est quantifiée</strong>, Eₙ = n²E₁. Chaque état propre tourne
        dans le plan complexe (e^{'{−iEt/ℏ}'} : ta formule d’Euler !) mais son |ψ|² reste figé : un état
        <em> stationnaire</em>. Coche la superposition : les deux rotations battent, et la probabilité
        se met à osciller — c’est ça, « bouger », en quantique.
      </p>
    </div>
  );
}

function sub(n: number): string {
  const SUB: Record<string, string> = { '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅' };
  return SUB[String(n)] ?? String(n);
}
