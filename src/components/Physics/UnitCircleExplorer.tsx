import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le cercle unité : on tourne l'angle à la main, et sin/cos se déroulent
 * en ondes sur la droite. Les fonctions trigonométriques cessent d'être
 * des touches de calculatrice : ce sont les coordonnées d'un point qui tourne.
 */
export function UnitCircleExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(false);
  const thetaRef = useRef(Math.PI / 4);
  const playingRef = useRef(false);
  playingRef.current = playing;
  const draggingRef = useRef(false);

  const W = 560;
  const H = 300;
  const CX = 105;
  const CY = 140;
  const R = 78;
  const WAVE_X = 225;
  const WAVE_W = 320;

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
    const colSin = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colCos = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colAxis = css.getPropertyValue('--border').trim() || '#2e3550';
    const colText = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colDot = css.getPropertyValue('--ok').trim() || '#4cc38a';

    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (playingRef.current && !draggingRef.current) {
        thetaRef.current = (thetaRef.current + dt * 1.2) % (Math.PI * 2);
      }
      const theta = thetaRef.current;
      const px = CX + R * Math.cos(theta);
      const py = CY - R * Math.sin(theta);

      ctx.clearRect(0, 0, W, H);

      // Cercle + axes
      ctx.strokeStyle = colAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(CX - R - 15, CY);
      ctx.lineTo(CX + R + 15, CY);
      ctx.moveTo(CX, CY - R - 15);
      ctx.lineTo(CX, CY + R + 15);
      ctx.stroke();
      ctx.strokeStyle = colText;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.stroke();

      // Arc de l'angle
      ctx.strokeStyle = colDot;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(CX, CY, 20, 0, -theta, true);
      ctx.stroke();

      // Rayon
      ctx.strokeStyle = colText;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // cos (horizontal) et sin (vertical)
      ctx.strokeStyle = colCos;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(CX, CY);
      ctx.lineTo(px, CY);
      ctx.stroke();
      ctx.strokeStyle = colSin;
      ctx.beginPath();
      ctx.moveTo(px, CY);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Point
      ctx.fillStyle = colDot;
      ctx.beginPath();
      ctx.arc(px, py, 7, 0, Math.PI * 2);
      ctx.fill();

      // Les ondes déroulées : sin et cos en fonction de l'angle
      const waveY = CY;
      const amp = R * 0.75;
      ctx.strokeStyle = colAxis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(WAVE_X, waveY);
      ctx.lineTo(WAVE_X + WAVE_W, waveY);
      ctx.stroke();

      const plot = (f: (a: number) => number, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= WAVE_W; i += 2) {
          const a = (i / WAVE_W) * Math.PI * 2;
          const y = waveY - f(a) * amp;
          if (i === 0) ctx.moveTo(WAVE_X + i, y);
          else ctx.lineTo(WAVE_X + i, y);
        }
        ctx.stroke();
      };
      plot(Math.sin, colSin);
      plot(Math.cos, colCos);

      // Curseur sur les ondes + liaison au cercle
      const cx2 = WAVE_X + (theta / (Math.PI * 2)) * WAVE_W;
      ctx.strokeStyle = colText;
      ctx.globalAlpha = 0.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(cx2, waveY - Math.sin(theta) * amp);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colSin;
      ctx.beginPath();
      ctx.arc(cx2, waveY - Math.sin(theta) * amp, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colCos;
      ctx.beginPath();
      ctx.arc(cx2, waveY - Math.cos(theta) * amp, 5, 0, Math.PI * 2);
      ctx.fill();

      // Valeurs
      ctx.font = '600 13px system-ui';
      ctx.fillStyle = colSin;
      ctx.fillText(`sin θ = ${Math.sin(theta).toFixed(2)}`, WAVE_X, 24);
      ctx.fillStyle = colCos;
      ctx.fillText(`cos θ = ${Math.cos(theta).toFixed(2)}`, WAVE_X + 110, 24);
      ctx.fillStyle = colText;
      ctx.fillText(`θ = ${((theta * 180) / Math.PI).toFixed(0)}°`, WAVE_X + 220, 24);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  const setThetaFromPointer = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W - CX;
    const y = CY - ((e.clientY - rect.top) / rect.height) * H;
    let a = Math.atan2(y, x);
    if (a < 0) a += Math.PI * 2;
    thetaRef.current = a;
  };

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <button type="button" className="btn" onClick={() => setPlaying((v) => !v)}>
          {playing ? '⏸ Stop' : '▶ Faire tourner'}
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: H, maxWidth: '100%', touchAction: 'none', cursor: 'grab' }}
        onPointerDown={(e) => {
          draggingRef.current = true;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          setThetaFromPointer(e);
        }}
        onPointerMove={(e) => {
          if (draggingRef.current) setThetaFromPointer(e);
        }}
        onPointerUp={() => {
          draggingRef.current = false;
        }}
        onPointerCancel={() => {
          draggingRef.current = false;
        }}
      />
      <p className="physics-caption">
        Attrape le point vert : le cosinus est son ombre horizontale, le sinus son ombre verticale.
        En déroulant l’angle, ces deux ombres dessinent les ondes — et Pythagore garantit
        sin²θ + cos²θ = 1 à chaque instant.
      </p>
    </div>
  );
}
