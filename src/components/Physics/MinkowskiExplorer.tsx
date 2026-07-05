import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le diagramme de Minkowski : l'espace-temps 1+1D. Axe horizontal x,
 * axe vertical ct ; le cône de lumière à 45°. Le curseur donne une
 * vitesse v au second observateur : ses axes (x′, ct′) se referment en
 * ciseaux sur le cône, et sa ligne de simultanéité bascule — deux
 * événements simultanés pour l'un ne le sont plus pour l'autre.
 */
export function MinkowskiExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [v100, setV100] = useState(50); // v/c en %

  const W = 560;
  const H = 400;
  const CX = W / 2;
  const CY = H / 2;
  const S = 42; // pixels par unité

  const v = v100 / 100;
  const gamma = 1 / Math.sqrt(1 - v * v);

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
    const colRest = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colMove = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colLight = css.getPropertyValue('--warn').trim() || '#e5a742';
    const colEvent = css.getPropertyValue('--ok').trim() || '#4cc38a';

    ctx.clearRect(0, 0, W, H);

    const px = (x: number) => CX + x * S;
    const py = (ct: number) => CY - ct * S;

    // Le cône de lumière (45°)
    ctx.strokeStyle = colLight;
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 5]);
    ctx.beginPath();
    ctx.moveTo(px(-4.6), py(-4.6));
    ctx.lineTo(px(4.6), py(4.6));
    ctx.moveTo(px(-4.6), py(4.6));
    ctx.lineTo(px(4.6), py(-4.6));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colLight;
    ctx.font = '600 13px system-ui';
    ctx.fillText('lumière', px(3.4), py(3.7));
    ctx.globalAlpha = 0.5;
    ctx.fillText('FUTUR', px(-0.35), py(3.9));
    ctx.fillText('PASSÉ', px(-0.35), py(-3.7));
    ctx.fillText('AILLEURS', px(3.1), py(0.25));
    ctx.globalAlpha = 1;

    // Axes de l'observateur au repos
    ctx.strokeStyle = colRest;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px(-4.6), py(0));
    ctx.lineTo(px(4.6), py(0));
    ctx.moveTo(px(0), py(-4.6));
    ctx.lineTo(px(0), py(4.6));
    ctx.stroke();
    ctx.fillStyle = colRest;
    ctx.fillText('x', px(4.35), py(0) - 8);
    ctx.fillText('ct', px(0) + 8, py(4.35));

    // Axes de l'observateur en mouvement : ct′ (pente 1/v) et x′ (pente v).
    if (v > 0.001) {
      ctx.strokeStyle = colMove;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // ct′ : la ligne d'univers x = v·ct
      ctx.moveTo(px(-4.4 * v), py(-4.4));
      ctx.lineTo(px(4.4 * v), py(4.4));
      // x′ : la ligne de simultanéité ct = v·x
      ctx.moveTo(px(-4.4), py(-4.4 * v));
      ctx.lineTo(px(4.4), py(4.4 * v));
      ctx.stroke();
      ctx.fillStyle = colMove;
      ctx.fillText('ct′', px(4.2 * v) + 8, py(4.2));
      ctx.fillText('x′ (son « maintenant »)', px(2.4), py(2.4 * v) - 10);

      // Graduations hyperboliques : ct′ = 1, 2, 3 sur l'axe du temps mobile
      for (let k = 1; k <= 3; k++) {
        const ct = k * gamma;
        const x = k * gamma * v;
        ctx.fillStyle = colMove;
        ctx.beginPath();
        ctx.arc(px(x), py(ct), 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`${k}`, px(x) + 7, py(ct) + 4);
      }
      // L'hyperbole de calibration ct² − x² = 1
      ctx.strokeStyle = colMove;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      for (let x = -3.4; x <= 3.4; x += 0.05) {
        const ct = Math.sqrt(1 + x * x);
        if (x === -3.4) ctx.moveTo(px(x), py(ct));
        else ctx.lineTo(px(x), py(ct));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Deux événements simultanés pour l'observateur au repos (A et B, ct = 1.6)
    for (const [x, name] of [
      [-2, 'A'],
      [2, 'B'],
    ] as const) {
      ctx.fillStyle = colEvent;
      ctx.beginPath();
      ctx.arc(px(x), py(1.6), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(name, px(x) - 4, py(1.6) - 12);
    }
    // La ligne de simultanéité du repos qui les relie
    ctx.strokeStyle = colEvent;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.moveTo(px(-2), py(1.6));
    ctx.lineTo(px(2), py(1.6));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }, [v, gamma]);

  // Δt′ entre A et B pour l'observateur mobile : t′ = γ(t − vx) → Δt′ = −γ·v·Δx
  const dtPrime = gamma * v * 4;

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          vitesse v = {(v).toFixed(2)}·c — γ = {gamma.toFixed(2)}
          <input type="range" min={0} max={90} value={v100} onChange={(e) => setV100(Number(e.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Chaque point est un <strong>événement</strong> (où, quand). La lumière trace les diagonales —
        et personne ne peut les franchir. Monte la vitesse : les axes bleus de l’observateur mobile se
        referment en ciseaux sur le cône, et son « maintenant » (l’axe x′) <em>bascule</em>. Les
        événements A et B, simultanés pour toi, sont séparés de Δt′ = {dtPrime.toFixed(2)} pour lui —
        B arrive avant A ! La simultanéité n’est pas une propriété du monde : c’est une propriété de
        l’observateur. Les points bleus (1, 2, 3) sont ses secondes à lui : la dilatation du temps, lue
        sur l’hyperbole ct² − x² = 1.
      </p>
    </div>
  );
}
