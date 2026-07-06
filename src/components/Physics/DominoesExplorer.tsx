import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * La récurrence, avec les mains : une file de dominos. Cliquer sur le
 * premier déclenche la chute, et chaque domino fait tomber le suivant —
 * l'image exacte de l'hérédité. « Le premier tombe » (cas de base) + « si
 * l'un tombe, le suivant tombe » (hérédité) ⟹ tous tombent.
 */

const N = 9;

export function DominoesExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallen, setFallen] = useState(0); // nombre de dominos tombés
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (fallen >= N) {
      setRunning(false);
      return;
    }
    const id = setTimeout(() => setFallen((f) => f + 1), 260);
    return () => clearTimeout(id);
  }, [running, fallen]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Sol.
    const groundY = H - 24;
    ctx.strokeStyle = 'rgba(128,128,128,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();

    const gap = W / (N + 1);
    const dw = 12;
    const dh = 52;
    for (let i = 0; i < N; i++) {
      const x = gap * (i + 1);
      const isDown = i < fallen;
      ctx.save();
      ctx.translate(x, groundY);
      if (isDown) ctx.rotate(-Math.PI / 2.2); // couché vers la droite
      ctx.fillStyle = isDown ? '#6c8cff' : '#8a5cf6';
      ctx.fillRect(-dw / 2, -dh, dw, dh);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.strokeRect(-dw / 2, -dh, dw, dh);
      ctx.restore();
      // Numéro du domino.
      ctx.fillStyle = 'rgba(128,128,128,0.85)';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x, groundY + 16);
    }
  }, [fallen]);

  return (
    <div className="physics-sim">
      <canvas ref={canvasRef} width={320} height={140} style={{ width: 320, height: 140, maxWidth: '100%' }} />
      <div className="physics-controls" style={{ flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setFallen(1); // le premier domino tombe (cas de base)
            setRunning(true);
          }}
        >
          Pousser le 1ᵉʳ domino
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setRunning(false);
            setFallen(0);
          }}
        >
          Relever
        </button>
      </div>
      <p className="physics-caption">
        {fallen === 0
          ? 'Le premier tombe (n = 1), et chacun fait tomber le suivant (n → n+1). Résultat : tous.'
          : fallen >= N
            ? 'Tous les dominos sont tombés — une infinité d’énoncés prouvés d’un seul geste.'
            : `${fallen} domino(s) tombé(s)… l’hérédité fait le reste.`}
      </p>
    </div>
  );
}
