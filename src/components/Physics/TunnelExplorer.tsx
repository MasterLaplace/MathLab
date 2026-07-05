import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * L'effet tunnel : une onde ψ arrive sur une barrière plus haute que son
 * énergie. Classiquement : rebond. Quantiquement : ψ ne s'annule pas dans
 * la barrière — elle décroît en e^{−κx} — et ressort de l'autre côté,
 * plus petite mais vivante. T ≈ e^{−2κL} : chaque épaisseur coûte cher.
 */
export function TunnelExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [barrier, setBarrier] = useState(5); // largeur (unités arbitraires)
  const [kappa, setKappa] = useState(4); // raideur de l'évanescence
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
    const colPsi = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colBar = css.getPropertyValue('--warn').trim() || '#e5a742';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const CY = H / 2 + 20;
    const AMP = 56;
    const K = 0.09; // fréquence spatiale de l'onde libre
    const x1 = W * 0.42;
    const L = barrier * 14; // largeur en pixels
    const x2 = x1 + L;
    const kap = kappa / 90; // κ en px⁻¹
    const T = Math.exp(-2 * kap * L); // amplitude transmise (relative)

    let raf = 0;
    const draw = () => {
      tRef.current += 0.06;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      // La barrière de potentiel
      ctx.fillStyle = colBar;
      ctx.globalAlpha = 0.25;
      ctx.fillRect(x1, 34, L, CY - 34);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colBar;
      ctx.strokeRect(x1, 34, L, CY - 34);
      ctx.fillStyle = colBar;
      ctx.font = '600 13px system-ui';
      ctx.fillText('V > E', x1 + L / 2 - 18, 26);

      // Ligne d'énergie de la particule
      ctx.strokeStyle = colDim;
      ctx.setLineDash([5, 4]);
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(8, CY - 100);
      ctx.lineTo(W - 8, CY - 100);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colDim;
      ctx.fillText('E (énergie de la particule)', 12, CY - 106);

      // Axe
      ctx.strokeStyle = colDim;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(8, CY);
      ctx.lineTo(W - 8, CY);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Re ψ : onde incidente, évanescente, transmise (recollées).
      const psiAt = (x: number): number => {
        if (x < x1) return Math.cos(K * x - t);
        if (x < x2) return Math.cos(K * x1 - t) * Math.exp(-kap * (x - x1));
        return Math.cos(K * x1 - t) * T * Math.cos(K * (x - x2));
      };
      ctx.strokeStyle = colPsi;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let x = 8; x <= W - 8; x += 1.5) {
        const y = CY - AMP * psiAt(x);
        if (x === 8) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.fillStyle = colPsi;
      ctx.fillText('ψ incident', 30, CY + 74);
      ctx.fillText('évanescent', x1 + 4, CY + 74);
      ctx.fillText(`transmis (${(T * T * 100).toPrecision(2)} %)`, Math.min(x2 + 6, W - 130), CY + 74);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [barrier, kappa]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          largeur L : {barrier}
          <input type="range" min={1} max={10} value={barrier} onChange={(e) => setBarrier(Number(e.target.value))} />
        </label>
        <label>
          hauteur (κ) : {kappa}
          <input type="range" min={1} max={9} value={kappa} onChange={(e) => setKappa(Number(e.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Dans la barrière, Schrödinger n’a pas de solution oscillante — mais il en a une{' '}
        <strong>évanescente</strong> : ψ = e^(−κx), ton exponentielle décroissante. Si la barrière
        finit avant que ψ soit morte, l’onde ressort : la particule « traverse » un mur
        infranchissable avec la probabilité T ≈ e^(−2κL). Élargis la barrière : T s’effondre
        exponentiellement — voilà pourquoi le tunnel est invisible à notre échelle, et pourquoi le
        Soleil brille quand même.
      </p>
    </div>
  );
}
