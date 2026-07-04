import { useEffect, useRef, useState } from 'react';
import './physics.css';

const N = 10000;
const COLS = 125; // 125 × 80 points

/**
 * Le théorème de Bayes vu comme une population : 10 000 personnes, une
 * maladie rare, un test imparfait. La question piège : « mon test est
 * positif — quelle chance que je sois malade ? » La réponse se lit en
 * comptant les points, pas en devinant.
 */
export function BayesExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prevalence, setPrevalence] = useState(1); // %
  const [sensitivity, setSensitivity] = useState(99); // %
  const [falsePos, setFalsePos] = useState(9); // %

  const W = 560;
  const H = 400;
  const CELL = 4.2;
  const GX = (W - COLS * CELL) / 2;
  const GY = 8;

  const sick = Math.round((N * prevalence) / 100);
  const truePos = Math.round((sick * sensitivity) / 100);
  const falseNeg = sick - truePos;
  const healthy = N - sick;
  const falsePosCount = Math.round((healthy * falsePos) / 100);
  const positives = truePos + falsePosCount;
  const pSickGivenPos = positives > 0 ? truePos / positives : 0;

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
    const colWarn = css.getPropertyValue('--warn').trim() || '#ffb454';
    const colDim = css.getPropertyValue('--border').trim() || '#2e3550';
    const colSick = '#e5484d';

    ctx.clearRect(0, 0, W, H);

    // Chaque point est une personne. Les malades occupent le début de la
    // grille ; parmi eux les testés + sont vifs. Les faux positifs sont
    // répartis dans les sains (un pas régulier suffit visuellement).
    const fpStep = falsePosCount > 0 ? healthy / falsePosCount : Infinity;
    for (let i = 0; i < N; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = GX + col * CELL;
      const y = GY + row * CELL;
      let color: string;
      let alpha: number;
      if (i < truePos) {
        color = colSick; // vrai positif : malade, test +
        alpha = 1;
      } else if (i < sick) {
        color = colSick; // faux négatif : malade, test − (raté !)
        alpha = 0.32;
      } else {
        const j = i - sick;
        const isFalsePositive = Math.floor(j % fpStep) === 0 && j / fpStep < falsePosCount;
        if (isFalsePositive) {
          color = colWarn; // sain mais test + (fausse alerte)
          alpha = 1;
        } else {
          color = colDim; // sain, test −
          alpha = 0.45;
        }
      }
      ctx.fillStyle = color;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, CELL - 1.2, CELL - 1.2);
    }
    ctx.globalAlpha = 1;

    // Verdict
    const css2 = getComputedStyle(canvas);
    ctx.fillStyle = css2.getPropertyValue('--text').trim() || '#e8eaf2';
    ctx.font = '700 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(
      `P(malade | test +) = ${truePos} / ${positives} ≈ ${(pSickGivenPos * 100).toFixed(0)} %`,
      W / 2,
      H - 18,
    );
    ctx.textAlign = 'left';
  }, [prevalence, sensitivity, falsePos, sick, truePos, healthy, falsePosCount, positives, pSickGivenPos]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          maladie : {prevalence.toFixed(1)} %
          <input
            type="range"
            min={0.2}
            max={10}
            step={0.2}
            value={prevalence}
            onChange={(e) => setPrevalence(Number(e.target.value))}
          />
        </label>
        <label>
          test détecte : {sensitivity} %
          <input
            type="range"
            min={50}
            max={100}
            step={1}
            value={sensitivity}
            onChange={(e) => setSensitivity(Number(e.target.value))}
          />
        </label>
        <label>
          fausses alertes : {falsePos} %
          <input
            type="range"
            min={0}
            max={20}
            step={1}
            value={falsePos}
            onChange={(e) => setFalsePos(Number(e.target.value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        10 000 personnes. Rouge vif : malades détectés ({truePos}). Rouge pâle : malades ratés (
        {falseNeg}). Orange : fausses alertes ({falsePosCount}). La maladie est rare : les fausses
        alertes noient souvent les vrais cas — c’est tout le piège de Bayes.
      </p>
    </div>
  );
}
