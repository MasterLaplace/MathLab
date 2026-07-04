import { useEffect, useRef, useState } from 'react';
import './physics.css';

interface C {
  re: number;
  im: number;
}

/**
 * Le plan complexe en direct : on attrape z et w, leur produit z·w suit.
 * On voit les modules se multiplier et les angles s'additionner —
 * « multiplier, c'est tourner ».
 */
export function ComplexExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [z, setZ] = useState<C>({ re: 1.2, im: 0.5 });
  const [w, setW] = useState<C>({ re: 0.4, im: 0.9 });
  const dragRef = useRef<'z' | 'w' | null>(null);

  const W = 560;
  const H = 340;
  // Monde : [-3.4, 3.4] × [-2.1, 2.1], même échelle sur les deux axes.
  const SCALE = W / 6.8;
  const px = (re: number) => W / 2 + re * SCALE;
  const py = (im: number) => H / 2 - im * SCALE;
  const toWorld = (cx: number, cy: number): C => ({
    re: (cx - W / 2) / SCALE,
    im: (H / 2 - cy) / SCALE,
  });

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
    const colZ = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colW = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colP = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    ctx.clearRect(0, 0, W, H);

    // Grille entière + axes.
    ctx.strokeStyle = colAxis;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    for (let g = -3; g <= 3; g++) {
      ctx.beginPath();
      ctx.moveTo(px(g), 0);
      ctx.lineTo(px(g), H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, py(g));
      ctx.lineTo(W, py(g));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colText;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();

    // Cercle unité + repères 1 et i.
    ctx.strokeStyle = colText;
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(px(0), py(0), SCALE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = colText;
    ctx.font = '600 13px system-ui';
    ctx.fillText('1', px(1) + 5, py(0) + 16);
    ctx.fillText('i', px(0) + 6, py(1) - 6);

    const prod: C = { re: z.re * w.re - z.im * w.im, im: z.re * w.im + z.im * w.re };

    const argOf = (c: C) => Math.atan2(c.im, c.re);

    // Arcs d'angle à l'origine : arg z, arg w, arg zw = arg z + arg w.
    const arc = (angle: number, radius: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      // Le canvas a l'axe y inversé : les angles positifs partent vers le haut.
      if (angle >= 0) ctx.arc(px(0), py(0), radius, 0, -angle, true);
      else ctx.arc(px(0), py(0), radius, 0, -angle, false);
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    arc(argOf(z), 26, colZ);
    arc(argOf(w), 34, colW);
    arc(argOf(prod), 44, colP);

    const arrow = (c: C, color: string, width = 2.5) => {
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(px(0), py(0));
      ctx.lineTo(px(c.re), py(c.im));
      ctx.stroke();
      const a = Math.atan2(py(c.im) - py(0), px(c.re) - px(0));
      ctx.beginPath();
      ctx.moveTo(px(c.re), py(c.im));
      ctx.lineTo(px(c.re) - 10 * Math.cos(a - 0.42), py(c.im) - 10 * Math.sin(a - 0.42));
      ctx.lineTo(px(c.re) - 10 * Math.cos(a + 0.42), py(c.im) - 10 * Math.sin(a + 0.42));
      ctx.closePath();
      ctx.fill();
    };
    arrow(z, colZ);
    arrow(w, colW);
    arrow(prod, colP, 3.5);

    // Poignées sur z et w.
    for (const [c, col] of [
      [z, colZ],
      [w, colW],
    ] as const) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(px(c.re), py(c.im), 7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = '600 14px system-ui';
    ctx.fillStyle = colZ;
    ctx.fillText('z', px(z.re) + 10, py(z.im) - 8);
    ctx.fillStyle = colW;
    ctx.fillText('w', px(w.re) + 10, py(w.im) - 8);
    ctx.fillStyle = colP;
    ctx.fillText('z·w', px(prod.re) + 10, py(prod.im) - 8);
  }, [z, w]);

  const pointerPos = (e: React.PointerEvent): C => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return toWorld(
      ((e.clientX - rect.left) / rect.width) * W,
      ((e.clientY - rect.top) / rect.height) * H,
    );
  };

  const onDown = (e: React.PointerEvent) => {
    const p = pointerPos(e);
    const dz = Math.hypot(p.re - z.re, p.im - z.im);
    const dw = Math.hypot(p.re - w.re, p.im - w.im);
    if (Math.min(dz, dw) > 0.4) return;
    dragRef.current = dz <= dw ? 'z' : 'w';
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const p = pointerPos(e);
    // Modules bornés à 1,7 : le produit reste visible dans le cadre.
    const r = Math.hypot(p.re, p.im);
    const k = r > 1.7 ? 1.7 / r : 1;
    const clamped = { re: p.re * k, im: p.im * k };
    if (dragRef.current === 'z') setZ(clamped);
    else setW(clamped);
  };
  const onUp = () => {
    dragRef.current = null;
  };

  const mod = (c: C) => Math.hypot(c.re, c.im);
  const deg = (c: C) => (Math.atan2(c.im, c.re) * 180) / Math.PI;
  const prod: C = { re: z.re * w.re - z.im * w.im, im: z.re * w.im + z.im * w.re };

  return (
    <div className="physics-sim">
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />
      <p className="physics-caption">
        |z| = {mod(z).toFixed(2)}, arg z = {deg(z).toFixed(0)}°&ensp;·&ensp;|w| = {mod(w).toFixed(2)},
        arg w = {deg(w).toFixed(0)}°&ensp;·&ensp;|z·w| = {mod(prod).toFixed(2)} ={' '}
        {mod(z).toFixed(2)}×{mod(w).toFixed(2)}, arg(z·w) = {deg(prod).toFixed(0)}°. Les modules se
        multiplient, les angles s’additionnent : multiplier, c’est tourner.
      </p>
    </div>
  );
}
