import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le plan de Laplace : on déplace un pôle s = σ ± iω à la souris, et la
 * réponse temporelle e^(σt)·cos(ωt) se redessine à côté. Moitié gauche :
 * ça s'amortit. Moitié droite : ça explose. L'axe : ça oscille sans fin.
 */
export function PoleExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pole, setPole] = useState({ sigma: -0.7, omega: 3 });
  const dragRef = useRef(false);

  const W = 560;
  const H = 320;
  // Plan des s à gauche : σ ∈ [−3, 1.6], ω ∈ [0, 6] (paire conjuguée miroir)
  const SW = 230;
  const px = (sg: number) => ((sg + 3) / 4.6) * SW;
  const py = (w: number) => H / 2 - (w / 6.4) * (H / 2 - 14);
  // Réponse à droite : t ∈ [0, 6]
  const TX = SW + 40;
  const TW = W - TX - 10;
  const tx = (t: number) => TX + (t / 6) * TW;
  const ty = (y: number) => H / 2 - y * (H / 2 - 22) * 0.62;

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
    const colPole = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colResp = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colAxis = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colDanger = '#e5484d';

    const { sigma, omega } = pole;

    ctx.clearRect(0, 0, W, H);

    // Zone instable (σ > 0) teintée
    ctx.fillStyle = colDanger;
    ctx.globalAlpha = 0.08;
    ctx.fillRect(px(0), 0, SW - px(0), H);
    ctx.globalAlpha = 1;

    // Axes du plan des s
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, H / 2);
    ctx.lineTo(SW, H / 2);
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
    ctx.font = '600 12px system-ui';
    ctx.fillStyle = colAxis;
    ctx.fillText('σ', SW - 14, H / 2 - 6);
    ctx.fillText('iω', px(0) + 6, 14);
    ctx.fillText('stable', 8, H - 10);
    ctx.fillStyle = colDanger;
    ctx.fillText('instable', px(0) + 8, H - 10);

    // La paire de pôles conjugués
    ctx.fillStyle = colPole;
    for (const w of [omega, -omega]) {
      const x = px(sigma);
      const y = py(w);
      ctx.save();
      ctx.translate(x, y);
      ctx.lineWidth = 3;
      ctx.strokeStyle = colPole;
      ctx.beginPath();
      ctx.moveTo(-6, -6);
      ctx.lineTo(6, 6);
      ctx.moveTo(6, -6);
      ctx.lineTo(-6, 6);
      ctx.stroke();
      ctx.restore();
    }

    // Séparateur
    ctx.strokeStyle = colAxis;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(SW + 20, 10);
    ctx.lineTo(SW + 20, H - 10);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Réponse temporelle y(t) = e^(σt)·cos(ωt)
    ctx.strokeStyle = colAxis;
    ctx.beginPath();
    ctx.moveTo(TX, H / 2);
    ctx.lineTo(W - 8, H / 2);
    ctx.stroke();

    // Enveloppe ±e^(σt)
    ctx.strokeStyle = colResp;
    ctx.globalAlpha = 0.35;
    ctx.setLineDash([4, 4]);
    for (const s of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const t = (6 * i) / 160;
        const y = Math.max(-2.4, Math.min(2.4, s * Math.exp(sigma * t)));
        if (i === 0) ctx.moveTo(tx(t), ty(y));
        else ctx.lineTo(tx(t), ty(y));
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // La réponse elle-même
    ctx.strokeStyle = colResp;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let i = 0; i <= 400; i++) {
      const t = (6 * i) / 400;
      const y = Math.max(-2.4, Math.min(2.4, Math.exp(sigma * t) * Math.cos(omega * t)));
      if (i === 0) ctx.moveTo(tx(t), ty(y));
      else ctx.lineTo(tx(t), ty(y));
    }
    ctx.stroke();

    ctx.fillStyle = colResp;
    ctx.fillText('y(t) = e^(σt)·cos(ωt)', TX + 8, 16);
  }, [pole]);

  const setFromPointer = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    if (x > SW + 10 && !dragRef.current) return;
    const sigma = Math.max(-3, Math.min(1.5, (Math.min(x, SW) / SW) * 4.6 - 3));
    const omega = Math.max(0, Math.min(6, ((H / 2 - y) / (H / 2 - 14)) * 6.4));
    setPole({ sigma, omega });
  };

  const verdict =
    pole.sigma > 0.02
      ? 'σ > 0 : le pôle est à droite, la réponse EXPLOSE — système instable.'
      : pole.sigma < -0.02
        ? 'σ < 0 : le pôle est à gauche, la réponse s’amortit — système stable.'
        : 'σ = 0 : sur l’axe, l’oscillation ne meurt jamais — la limite de stabilité.';

  return (
    <div className="physics-sim">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={(e) => {
          dragRef.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (dragRef.current) setFromPointer(e);
        }}
        onPointerUp={() => {
          dragRef.current = false;
        }}
        onPointerCancel={() => {
          dragRef.current = false;
        }}
      />
      <p className="physics-caption">
        σ = {pole.sigma.toFixed(2)}, ω = {pole.omega.toFixed(1)}. {verdict} Déplace les croix (le
        pôle et son conjugué) dans le plan de gauche.
      </p>
    </div>
  );
}
