import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * L'onde électromagnétique : E (vertical) et B (horizontal) perpendiculaires,
 * en phase, qui s'engendrent mutuellement en avançant à c. La lumière,
 * dessinée en perspective légère.
 */
export function EMWaveExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [freq, setFreq] = useState(2);
  const tRef = useRef(0);

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
    const colE = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colB = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    let raf = 0;
    const PAD = 26;
    const CY = H / 2;
    const AMP = 62;
    // Perspective : B (horizontal, vers le lecteur) est dessiné en oblique.
    const SKX = 0.45;
    const SKY = 0.28;

    const draw = () => {
      tRef.current += 0.05;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // Axe de propagation
      ctx.strokeStyle = colDim;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD, CY);
      ctx.lineTo(W - PAD + 10, CY);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = colDim;
      ctx.font = '600 13px system-ui';
      ctx.fillText('direction de propagation (vitesse c)', W - 250, CY + 18);

      const N = 60;
      // Vecteurs B (obliques) puis E (verticaux), avec la courbe enveloppe.
      for (const field of ['B', 'E'] as const) {
        const col = field === 'E' ? colE : colB;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.globalAlpha = 0.85;
        for (let i = 0; i <= N; i++) {
          const u = i / N;
          const x = PAD + u * (W - 2 * PAD);
          const a = AMP * Math.sin(freq * (u * 2 * Math.PI) - t);
          ctx.beginPath();
          ctx.moveTo(x, CY);
          if (field === 'E') ctx.lineTo(x, CY - a);
          else ctx.lineTo(x + a * SKX, CY + a * SKY);
          ctx.stroke();
        }
        // Enveloppe
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i <= 200; i++) {
          const u = i / 200;
          const x = PAD + u * (W - 2 * PAD);
          const a = AMP * Math.sin(freq * (u * 2 * Math.PI) - t);
          const px = field === 'E' ? x : x + a * SKX;
          const py = field === 'E' ? CY - a : CY + a * SKY;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = colE;
      ctx.fillText('E (champ électrique)', PAD, 22);
      ctx.fillStyle = colB;
      ctx.fillText('B (champ magnétique)', PAD, H - 12);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [freq]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          fréquence : {freq}
          <input type="range" min={1} max={5} value={freq} onChange={(e) => setFreq(Number(e.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Un E qui varie crée un B (Maxwell-Ampère) ; un B qui varie crée un E (Faraday) : l’onde
        s’auto-entretient et n’a plus besoin de personne — elle file à c = 1/√(ε₀μ₀) ≈ 3·10⁸ m/s.
        E et B restent perpendiculaires entre eux et à la direction du voyage, en phase. Change la
        fréquence : radio, lumière, rayons X — la même onde, seul λ change (c = λ·f).
      </p>
    </div>
  );
}
