import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le principe de moindre action : une balle lancée en l'air suit la
 * parabole. Pourquoi ? Parmi tous les chemins imaginables entre les mêmes
 * deux événements, la nature choisit celui qui minimise S = ∫(T − V) dt.
 * Le curseur déforme le chemin — l'action remonte dès qu'on s'écarte.
 */
export function ActionExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [eps, setEps] = useState(0);

  const W = 560;
  const H = 320;
  const G = 9.8;
  const T = 2; // durée du vol
  const STEPS = 200;

  // Chemin vrai : y(t) = v₀t − gt²/2 avec v₀ = gT/2 (part et revient à 0).
  // Chemin perturbé : y_ε(t) = y(t) + ε·sin(πt/T) (mêmes extrémités).
  const yTrue = (t: number) => ((G * T) / 2) * t - (G * t * t) / 2;
  const yPert = (t: number, e: number) => yTrue(t) + e * Math.sin((Math.PI * t) / T);

  const action = (e: number): number => {
    let s = 0;
    const dt = T / STEPS;
    for (let i = 0; i < STEPS; i++) {
      const t = (i + 0.5) * dt;
      const v = (yPert(t + dt / 2, e) - yPert(t - dt / 2, e)) / dt;
      const kin = 0.5 * v * v;
      const pot = G * yPert(t, e);
      s += (kin - pot) * dt;
    }
    return s;
  };

  const e = eps / 20; // curseur −40..40 → ε −2..2 m
  const S = action(e);
  const S0 = action(0);

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
    const colTrue = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colPert = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    ctx.clearRect(0, 0, W, H);

    const PAD = 40;
    const YMAX = 8;
    const px = (t: number) => PAD + (t / T) * (W - 2 * PAD - 120);
    const py = (y: number) => H - 40 - (y / YMAX) * (H - 90);

    // Sol + événements de départ/arrivée
    ctx.strokeStyle = colDim;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(PAD - 12, py(0));
    ctx.lineTo(px(T) + 12, py(0));
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colDim;
    for (const t of [0, T]) {
      ctx.beginPath();
      ctx.arc(px(t), py(0), 5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.font = '600 13px system-ui';
    ctx.fillText('départ', px(0) - 20, py(0) + 20);
    ctx.fillText('arrivée', px(T) - 22, py(0) + 20);

    // Le vrai chemin (parabole)
    const curve = (fn: (t: number) => number, col: string, width: number, alpha = 1) => {
      ctx.strokeStyle = col;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) {
        const t = (T * i) / 120;
        if (i === 0) ctx.moveTo(px(t), py(fn(t)));
        else ctx.lineTo(px(t), py(fn(t)));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    };
    curve(yTrue, colTrue, 2, e === 0 ? 0 : 0.55);
    curve((t) => yPert(t, e), colPert, 3);

    ctx.fillStyle = colTrue;
    ctx.fillText('le vrai chemin (parabole)', PAD, 22);
    ctx.fillStyle = colPert;
    ctx.fillText(`ton chemin (ε = ${e.toFixed(1)} m)`, PAD, 40);

    // Jauge d'action à droite
    const gx = W - 92;
    const gTop = 30;
    const gH = H - 80;
    const sMin = S0 - 2;
    const sMax = S0 + 42;
    const yOf = (s: number) => gTop + gH - ((s - sMin) / (sMax - sMin)) * gH;
    ctx.strokeStyle = colDim;
    ctx.strokeRect(gx, gTop, 26, gH);
    ctx.fillStyle = colPert;
    const barTop = yOf(S);
    ctx.fillRect(gx + 1, barTop, 24, gTop + gH - barTop);
    ctx.strokeStyle = colTrue;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(gx - 6, yOf(S0));
    ctx.lineTo(gx + 32, yOf(S0));
    ctx.stroke();
    ctx.fillStyle = colDim;
    ctx.fillText('action S', gx - 8, gTop - 10);
    ctx.fillStyle = colTrue;
    ctx.fillText('S min', gx + 36, yOf(S0) + 4);
  }, [e, S, S0]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          déformer le chemin : ε = {e.toFixed(1)} m
          <input type="range" min={-40} max={40} value={eps} onChange={(ev) => setEps(Number(ev.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Mêmes départ et arrivée, chemins différents. Pour chacun, la nature calcule l’<strong>action</strong>{' '}
        S = ∫(T − V)dt : ici S = {S.toFixed(1)} (minimum {S0.toFixed(1)} sur la parabole). Écarte-toi
        dans un sens ou dans l’autre : S remonte <em>toujours</em>. La trajectoire réelle n’obéit pas à
        une force qui la pousse pas à pas — elle est le chemin le plus économe entre deux événements.
        F = ma et « S minimale » sont la même loi, écrite en deux langues.
      </p>
    </div>
  );
}
