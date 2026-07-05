import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * La corde vibrante : modes propres (harmoniques) d'une corde fixée aux
 * deux bouts. Chaque mode n est une onde stationnaire sin(nπx/L)·cos(nωt) ;
 * le mélange des modes montre qu'un son réel est une somme de Fourier.
 */
export function StringExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState(1);
  const [mix, setMix] = useState(false);
  const tRef = useRef(0);

  const W = 560;
  const H = 260;

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
    const colString = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colGhost = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    let raf = 0;
    const PAD = 30;
    const MIDY = H / 2;
    const AMP = 70;

    const shape = (u: number, t: number): number => {
      if (!mix) return Math.sin(mode * Math.PI * u) * Math.cos(mode * t);
      // Un « pincement » : les 5 premières harmoniques d'une corde pincée au quart.
      let y = 0;
      for (let n = 1; n <= 5; n++) {
        const an = Math.sin((n * Math.PI) / 4) / (n * n);
        y += an * Math.sin(n * Math.PI * u) * Math.cos(n * t);
      }
      return y * 1.4;
    };

    const draw = () => {
      tRef.current += 0.045;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Position de repos + attaches
      ctx.strokeStyle = colDim;
      ctx.globalAlpha = 0.4;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD, MIDY);
      ctx.lineTo(W - PAD, MIDY);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colDim;
      ctx.beginPath();
      ctx.arc(PAD, MIDY, 5, 0, Math.PI * 2);
      ctx.arc(W - PAD, MIDY, 5, 0, Math.PI * 2);
      ctx.fill();

      // L'enveloppe du mode (les positions extrêmes)
      if (!mix) {
        ctx.strokeStyle = colGhost;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 1.5;
        for (const sgn of [1, -1]) {
          ctx.beginPath();
          for (let i = 0; i <= 200; i++) {
            const u = i / 200;
            const y = MIDY - sgn * AMP * Math.sin(mode * Math.PI * u);
            if (i === 0) ctx.moveTo(PAD + u * (W - 2 * PAD), y);
            else ctx.lineTo(PAD + u * (W - 2 * PAD), y);
          }
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        // Les nœuds : les points qui ne bougent jamais.
        ctx.fillStyle = colGhost;
        for (let kk = 1; kk < mode; kk++) {
          const u = kk / mode;
          ctx.beginPath();
          ctx.arc(PAD + u * (W - 2 * PAD), MIDY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // La corde
      ctx.strokeStyle = colString;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const u = i / 200;
        const y = MIDY - AMP * shape(u, t);
        if (i === 0) ctx.moveTo(PAD + u * (W - 2 * PAD), y);
        else ctx.lineTo(PAD + u * (W - 2 * PAD), y);
      }
      ctx.stroke();

      ctx.fillStyle = colDim;
      ctx.font = '600 13px system-ui';
      ctx.fillText(mix ? 'corde pincée = somme des 5 premiers modes' : `mode n = ${mode} : f${sub(mode)} = ${mode}·f₁`, PAD, 22);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [mode, mix]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          mode n = {mode}
          <input type="range" min={1} max={6} value={mode} disabled={mix} onChange={(e) => setMode(Number(e.target.value))} />
        </label>
        <label>
          <input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} /> corde pincée (mélange)
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Fixée aux deux bouts, la corde n’accepte que les ondes qui s’annulent aux attaches : les modes
        sin(nπx/L). Le mode n vibre n fois plus vite que le fondamental — l’octave, la quinte… toute la
        musique. Les points verts sont les <strong>nœuds</strong> : ils ne bougent jamais. Coche
        « pincée » : un vrai son est une somme de modes — une série de Fourier que ton oreille décompose
        en direct.
      </p>
    </div>
  );
}

function sub(n: number): string {
  const SUB: Record<string, string> = { '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆' };
  return SUB[String(n)] ?? String(n);
}
