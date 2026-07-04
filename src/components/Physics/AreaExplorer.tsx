import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * L'intégrale comme accumulation : l'aire sous y = x entre 0 et b.
 * En déplaçant la borne b, l'élève voit l'aire (un triangle) grandir
 * exactement comme b²/2 — la primitive se découvre à l'œil.
 */
export function AreaExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [b, setB] = useState(3);
  const draggingRef = useRef(false);

  const W = 560;
  const H = 300;
  const X_MIN = -0.5;
  const X_MAX = 6;
  const Y_MIN = -0.8;
  const Y_MAX = 6;

  const px = (x: number) => ((x - X_MIN) / (X_MAX - X_MIN)) * W;
  const py = (y: number) => H - ((y - Y_MIN) / (Y_MAX - Y_MIN)) * H;
  const fromPx = (X: number) => X_MIN + (X / W) * (X_MAX - X_MIN);

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
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colCurve = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colArea = css.getPropertyValue('--ok').trim() || '#4cc38a';

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Aire accumulée (triangle sous y = x, découpé en bandes pour l'intuition)
    ctx.fillStyle = colArea;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(px(0), py(0));
    ctx.lineTo(px(b), py(0));
    ctx.lineTo(px(b), py(b));
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 0.6;
    const strips = 12;
    ctx.strokeStyle = colArea;
    for (let i = 1; i < strips; i++) {
      const x = (b * i) / strips;
      ctx.beginPath();
      ctx.moveTo(px(x), py(0));
      ctx.lineTo(px(x), py(x));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Droite y = x
    ctx.strokeStyle = colCurve;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(px(X_MIN), py(X_MIN));
    ctx.lineTo(px(X_MAX), py(X_MAX));
    ctx.stroke();

    // Borne déplaçable
    ctx.fillStyle = colArea;
    ctx.beginPath();
    ctx.arc(px(b), py(0), 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colText;
    ctx.font = 'bold 14px system-ui';
    const area = (b * b) / 2;
    ctx.fillText(
      `b = ${b.toFixed(1)}   aire = b²/2 = ${area.toFixed(2)}`,
      12,
      22,
    );
    ctx.font = '12px system-ui';
    ctx.fillText('y = x', px(X_MAX - 0.9), py(X_MAX - 0.9) - 10);
  }, [b]);

  const onPointer = (e: React.PointerEvent, isDown: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (isDown) {
      draggingRef.current = true;
      canvas.setPointerCapture(e.pointerId);
    }
    if (!draggingRef.current) return;
    const rect = canvas.getBoundingClientRect();
    const x = fromPx(((e.clientX - rect.left) / rect.width) * W);
    setB(Math.max(0.5, Math.min(5.5, Math.round(x * 10) / 10)));
  };

  return (
    <div className="physics-sim">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'ew-resize' }}
        onPointerDown={(e) => onPointer(e, true)}
        onPointerMove={(e) => onPointer(e, false)}
        onPointerUp={() => (draggingRef.current = false)}
      />
      <p className="physics-caption">
        Fais glisser la borne le long de l’axe. L’aire accumulée sous y = x vaut toujours b²/2 :
        intégrer, c’est accumuler — et c’est l’inverse de dériver (la dérivée de b²/2 est… b).
      </p>
    </div>
  );
}
