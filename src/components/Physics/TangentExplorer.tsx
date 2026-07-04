import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Exploration de la dérivée : un point déplaçable sur la parabole y = x².
 * La tangente suit le point et la pente affichée vaut 2x — l'élève découvre
 * la règle en observant, avant de la formaliser.
 */
export function TangentExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1.5);
  const draggingRef = useRef(false);

  const W = 560;
  const H = 300;
  const X_MIN = -4;
  const X_MAX = 4;
  const Y_MIN = -2;
  const Y_MAX = 17;

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
    const colTangent = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colPoint = css.getPropertyValue('--ok').trim() || '#4cc38a';

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

    // Parabole y = x²
    ctx.strokeStyle = colCurve;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= 300; i++) {
      const x = X_MIN + ((X_MAX - X_MIN) * i) / 300;
      const X = px(x);
      const Y = py(x * x);
      if (i === 0) ctx.moveTo(X, Y);
      else ctx.lineTo(X, Y);
    }
    ctx.stroke();

    // Tangente au point a : y = a² + 2a(x - a)
    const slope = 2 * a;
    ctx.strokeStyle = colTangent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px(X_MIN), py(a * a + slope * (X_MIN - a)));
    ctx.lineTo(px(X_MAX), py(a * a + slope * (X_MAX - a)));
    ctx.stroke();

    // Triangle pente (avance de 1 → monte de 2a)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = colText;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(px(a), py(a * a));
    ctx.lineTo(px(a + 1), py(a * a));
    ctx.lineTo(px(a + 1), py(a * a + slope));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colText;
    ctx.font = '11px system-ui';
    ctx.fillText('+1', px(a + 0.4), py(a * a) + 14);
    ctx.fillText(`${slope >= 0 ? '+' : ''}${Math.round(slope * 10) / 10}`, px(a + 1) + 6, py(a * a + slope / 2));

    // Point déplaçable
    ctx.fillStyle = colPoint;
    ctx.beginPath();
    ctx.arc(px(a), py(a * a), 8, 0, Math.PI * 2);
    ctx.fill();

    // Étiquette
    ctx.fillStyle = colText;
    ctx.font = 'bold 14px system-ui';
    ctx.fillText(`x = ${a.toFixed(1)}   pente = 2·${a.toFixed(1)} = ${(2 * a).toFixed(1)}`, 12, 22);
  }, [a]);

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
    setA(Math.max(-3.5, Math.min(3.5, Math.round(x * 10) / 10)));
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
        Fais glisser le point le long de la courbe y = x². Observe : la pente de la tangente vaut
        toujours le double de x. Cette « machine à pentes » est la dérivée.
      </p>
    </div>
  );
}
