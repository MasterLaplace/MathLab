import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Arbre de probabilité manipulable : deux étages de branches pondérées.
 * On fait glisser les curseurs — les probabilités des branches sœurs se
 * complètent à 1, les feuilles multiplient le long du chemin, et la somme
 * des feuilles fait toujours 1. La loi des probabilités totales, à la main.
 */
export function ProbTreeExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // p : P(A) ; q : P(B|A) ; r : P(B|Ā) — en pourcents pour les curseurs.
  const [p, setP] = useState(30);
  const [q, setQ] = useState(80);
  const [r, setR] = useState(20);

  const W = 560;
  const H = 300;

  const pf = p / 100;
  const qf = q / 100;
  const rf = r / 100;
  const leaves = [pf * qf, pf * (1 - qf), (1 - pf) * rf, (1 - pf) * (1 - rf)];
  const totalB = leaves[0] + leaves[2];

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
    const colA = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colB = css.getPropertyValue('--ok').trim() || '#4cc38a';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    ctx.clearRect(0, 0, W, H);

    const root = { x: 60, y: H / 2 };
    const mid = [
      { x: 250, y: 70 },
      { x: 250, y: H - 70 },
    ];
    const leafY = [34, 108, H - 108, H - 34];
    const leafX = 440;

    // Une branche : épaisseur proportionnelle à sa probabilité.
    const branch = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      prob: number,
      color: string,
      label: string,
    ) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5 + prob * 10;
      ctx.globalAlpha = 0.35 + prob * 0.6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.bezierCurveTo((x1 + x2) / 2, y1, (x1 + x2) / 2, y2, x2, y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = '600 13px system-ui';
      ctx.fillText(label, (x1 + x2) / 2 - 18, (y1 + y2) / 2 - 8);
    };

    branch(root.x, root.y, mid[0].x, mid[0].y, pf, colA, `A : ${pf.toFixed(2)}`);
    branch(root.x, root.y, mid[1].x, mid[1].y, 1 - pf, colDim, `Ā : ${(1 - pf).toFixed(2)}`);
    branch(mid[0].x, mid[0].y, leafX, leafY[0], qf, colB, `B : ${qf.toFixed(2)}`);
    branch(mid[0].x, mid[0].y, leafX, leafY[1], 1 - qf, colDim, `B̄ : ${(1 - qf).toFixed(2)}`);
    branch(mid[1].x, mid[1].y, leafX, leafY[2], rf, colB, `B : ${rf.toFixed(2)}`);
    branch(mid[1].x, mid[1].y, leafX, leafY[3], 1 - rf, colDim, `B̄ : ${(1 - rf).toFixed(2)}`);

    // Nœuds
    for (const n of [root, ...mid]) {
      ctx.fillStyle = colDim;
      ctx.beginPath();
      ctx.arc(n.x, n.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Feuilles : le produit du chemin. Les feuilles « B » sont surlignées.
    const leafTxt = ['A∩B', 'A∩B̄', 'Ā∩B', 'Ā∩B̄'];
    leaves.forEach((w, i) => {
      const isB = i === 0 || i === 2;
      ctx.fillStyle = isB ? colB : colDim;
      ctx.font = isB ? '700 14px system-ui' : '600 13px system-ui';
      ctx.fillText(`${leafTxt[i]} = ${w.toFixed(3)}`, leafX + 10, leafY[i] + 5);
    });

    ctx.fillStyle = colDim;
    ctx.font = '600 13px system-ui';
    ctx.fillText('départ', root.x - 22, root.y + 24);
  }, [pf, qf, rf, leaves]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          P(A) = {pf.toFixed(2)}
          <input type="range" min={5} max={95} value={p} onChange={(e) => setP(Number(e.target.value))} />
        </label>
        <label>
          P(B|A) = {qf.toFixed(2)}
          <input type="range" min={0} max={100} value={q} onChange={(e) => setQ(Number(e.target.value))} />
        </label>
        <label>
          P(B|Ā) = {rf.toFixed(2)}
          <input type="range" min={0} max={100} value={r} onChange={(e) => setR(Number(e.target.value))} />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Le long d’un chemin, les probabilités se <strong>multiplient</strong> ; entre chemins, elles
        s’<strong>additionnent</strong>. Somme des 4 feuilles : {leaves.reduce((s, w) => s + w, 0).toFixed(3)} —
        toujours 1. Probabilité totale de B (feuilles vertes) : P(B) = {leaves[0].toFixed(3)} +{' '}
        {leaves[2].toFixed(3)} = <strong>{totalB.toFixed(3)}</strong>.
      </p>
    </div>
  );
}
