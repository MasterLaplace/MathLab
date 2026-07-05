import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Les racines n-ièmes de l'unité : n points également répartis sur le
 * cercle unité, sommets d'un polygone régulier. Chaque racine est
 * e^{2πik/n} ; leur somme est nulle (le polygone est équilibré).
 */
export function RootsExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [n, setN] = useState(5);
  const [k, setK] = useState(1);

  const W = 560;
  const H = 340;
  const CX = W / 2;
  const CY = H / 2;
  const R = 125;

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
    const colAccent = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colOk = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    ctx.clearRect(0, 0, W, H);

    const px = (re: number) => CX + re * R;
    const py = (im: number) => CY - im * R;

    // Axes + cercle unité
    ctx.strokeStyle = colDim;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(CX - R - 24, CY);
    ctx.lineTo(CX + R + 24, CY);
    ctx.moveTo(CX, CY - R - 18);
    ctx.lineTo(CX, CY + R + 18);
    ctx.stroke();
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(CX, CY, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    const roots = Array.from({ length: n }, (_, j) => {
      const a = (2 * Math.PI * j) / n;
      return { re: Math.cos(a), im: Math.sin(a), j };
    });

    // Le polygone régulier
    ctx.strokeStyle = colAccent;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    roots.forEach((z, i) => {
      if (i === 0) ctx.moveTo(px(z.re), py(z.im));
      else ctx.lineTo(px(z.re), py(z.im));
    });
    ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = 1;

    // La marche des puissances de ω^k : 1 → ω^k → ω^2k → …
    ctx.strokeStyle = colOk;
    ctx.lineWidth = 2;
    ctx.beginPath();
    let cur = { re: 1, im: 0 };
    ctx.moveTo(px(1), py(0));
    for (let s = 1; s <= n; s++) {
      const a = (2 * Math.PI * ((s * k) % n)) / n;
      cur = { re: Math.cos(a), im: Math.sin(a) };
      ctx.lineTo(px(cur.re), py(cur.im));
    }
    ctx.stroke();

    // Les racines
    roots.forEach((z) => {
      const isOne = z.j === 0;
      const isW = z.j === k % n;
      ctx.fillStyle = isW ? colOk : isOne ? colDim : colAccent;
      ctx.beginPath();
      ctx.arc(px(z.re), py(z.im), isW ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = colDim;
      ctx.font = '600 13px system-ui';
      const lx = px(z.re) + (z.re >= 0 ? 10 : -34);
      const ly = py(z.im) + (z.im >= 0 ? -8 : 18);
      ctx.fillText(z.j === 0 ? '1' : `ω${supTxt(z.j)}`, lx, ly);
    });

    ctx.fillStyle = colDim;
    ctx.font = '600 13px system-ui';
    ctx.fillText(`ω = e^(2πi/${n})`, 16, 24);
    ctx.fillText(`somme des ${n} racines = 0`, 16, H - 14);
  }, [n, k]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          n = {n}
          <input type="range" min={2} max={12} value={n} onChange={(e) => { setN(Number(e.target.value)); setK(1); }} />
        </label>
        <label>
          marcher par ω^{k}
          <input type="range" min={1} max={Math.max(1, n - 1)} value={Math.min(k, n - 1)} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Les {n} solutions de zⁿ = 1 forment un polygone régulier : chaque racine est ω^j = e^(2πij/{n}),
        une rotation de 360°/{n}. Le chemin vert saute de ω^{k} en ω^{k} : si k et n sont premiers entre
        eux, il visite toutes les racines (une étoile) ; sinon il boucle plus tôt.
      </p>
    </div>
  );
}

function supTxt(j: number): string {
  const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return j === 1 ? '' : String(j).split('').map((c) => SUP[c] ?? c).join('');
}
