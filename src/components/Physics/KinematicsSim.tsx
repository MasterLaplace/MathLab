import { useEffect, useRef } from 'react';
import './physics.css';

interface KinematicsSimProps {
  /** Distance parcourue (m). */
  d: number;
  /** Durée du trajet (s). */
  t: number;
  /** Quand l'exercice est résolu, la vitesse s'affiche en évidence. */
  solved?: boolean;
}

/**
 * Mouvement rectiligne uniforme : un mobile parcourt `d` mètres en `t`
 * secondes, en boucle. La formule que l'élève manipule (v = d/t) est
 * littéralement ce qui se passe sous ses yeux.
 */
export function KinematicsSim({ d, t, solved = false }: KinematicsSimProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ d, t, solved });
  stateRef.current = { d, t, solved };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 560;
    const H = 130;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const css = getComputedStyle(canvas);
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colAccent = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colOk = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colBorder = css.getPropertyValue('--border').trim() || '#2e3550';

    let raf = 0;
    let start = performance.now();

    const draw = (now: number) => {
      const { d, t, solved } = stateRef.current;
      const period = t + 1; // pause d'une seconde à l'arrivée
      const elapsed = ((now - start) / 1000) % period;
      const progress = Math.min(elapsed / t, 1);

      ctx.clearRect(0, 0, W, H);

      const roadY = 78;
      const x0 = 40;
      const x1 = W - 50;

      // Route et bornes
      ctx.strokeStyle = colBorder;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, roadY);
      ctx.lineTo(x1, roadY);
      ctx.stroke();
      ctx.fillStyle = colText;
      ctx.font = '12px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('0 m', x0, roadY + 20);
      ctx.fillText(`${d} m`, x1, roadY + 20);
      for (const frac of [0.25, 0.5, 0.75]) {
        const gx = x0 + (x1 - x0) * frac;
        ctx.beginPath();
        ctx.moveTo(gx, roadY - 4);
        ctx.lineTo(gx, roadY + 4);
        ctx.stroke();
      }

      // Mobile
      const cx = x0 + (x1 - x0) * progress;
      ctx.fillStyle = solved ? colOk : colAccent;
      ctx.beginPath();
      ctx.roundRect(cx - 16, roadY - 26, 32, 20, 5);
      ctx.fill();
      // roues
      ctx.beginPath();
      ctx.arc(cx - 8, roadY - 4, 4.5, 0, Math.PI * 2);
      ctx.arc(cx + 8, roadY - 4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Chronomètre + infos
      ctx.textAlign = 'left';
      ctx.fillStyle = colText;
      ctx.font = '13px system-ui';
      ctx.fillText(`⏱ ${Math.min(elapsed, t).toFixed(1)} s / ${t} s`, x0, 24);
      if (solved) {
        ctx.fillStyle = colOk;
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(`v = ${d} ÷ ${t} = ${Math.round((d / t) * 100) / 100} m/s ✓`, x1, 24);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="physics-sim">
      <canvas ref={canvasRef} style={{ width: 560, height: 130, maxWidth: '100%' }} />
      <p className="physics-caption">
        Le mobile parcourt {d} m en {t} s — la formule que tu manipules décrit ce mouvement.
      </p>
    </div>
  );
}
