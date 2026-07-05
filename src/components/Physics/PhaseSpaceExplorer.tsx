import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * L'espace des phases du pendule : axe horizontal θ, axe vertical ω.
 * Le champ hamiltonien est dessiné en fond ; un clic lance une trajectoire
 * (RK4). Petites énergies : des ovales (oscillation). Grandes : des vagues
 * (rotation). Entre les deux : la séparatrice, la frontière des destins.
 */
export function PhaseSpaceExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trajRef = useRef<[number, number][][]>([]);
  const [, setVersion] = useState(0);

  const W = 560;
  const H = 340;
  const TH_MAX = Math.PI * 1.6;
  const OM_MAX = 3.4;
  const G = 1; // g/L = 1 : ω_sep(0) = 2

  const px = (th: number) => ((th + TH_MAX) / (2 * TH_MAX)) * W;
  const py = (om: number) => H - ((om + OM_MAX) / (2 * OM_MAX)) * H;

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
    const colField = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';
    const colTraj = css.getPropertyValue('--accent').trim() || '#6a8dff';
    const colSep = css.getPropertyValue('--warn').trim() || '#e5a742';

    ctx.clearRect(0, 0, W, H);

    // Axes
    ctx.strokeStyle = colField;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, py(0));
    ctx.lineTo(W, py(0));
    ctx.moveTo(px(0), 0);
    ctx.lineTo(px(0), H);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colField;
    ctx.font = '600 13px system-ui';
    ctx.fillText('θ (angle)', W - 70, py(0) - 8);
    ctx.fillText('ω (vitesse)', px(0) + 8, 16);
    ctx.fillText('−π', px(-Math.PI) - 8, py(0) + 16);
    ctx.fillText('π', px(Math.PI) - 4, py(0) + 16);

    // Champ de directions (θ̇ = ω, ω̇ = −sin θ)
    ctx.strokeStyle = colField;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i <= 26; i++) {
      for (let j = 0; j <= 16; j++) {
        const th = -TH_MAX + (2 * TH_MAX * i) / 26;
        const om = -OM_MAX + (2 * OM_MAX * j) / 16;
        const dth = om;
        const dom = -G * Math.sin(th);
        const len = Math.hypot(dth, dom) || 1;
        const ux = (dth / len) * 8;
        const uy = (dom / len) * 8;
        const x = px(th);
        const y = py(om);
        ctx.beginPath();
        ctx.moveTo(x - ux / 2, y + (uy / 2) * (H / (2 * OM_MAX)) * ((2 * TH_MAX) / W));
        ctx.lineTo(x + ux / 2, y - (uy / 2) * (H / (2 * OM_MAX)) * ((2 * TH_MAX) / W));
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // La séparatrice : E = 2g ⟺ ω = ±2·cos(θ/2)
    ctx.strokeStyle = colSep;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    for (const sgn of [1, -1]) {
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const th = -TH_MAX + (2 * TH_MAX * i) / 200;
        const om = sgn * 2 * Math.sqrt(G) * Math.cos(th / 2) * (Math.abs(th) <= Math.PI ? 1 : NaN);
        if (Number.isNaN(om)) continue;
        const x = px(th);
        const y = py(om);
        if (i === 0 || Math.abs(th) > Math.PI) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.fillStyle = colSep;
    ctx.fillText('séparatrice', px(0) - 38, py(2) - 8);

    // Trajectoires lancées au clic
    ctx.strokeStyle = colTraj;
    ctx.lineWidth = 2;
    for (const traj of trajRef.current) {
      ctx.beginPath();
      traj.forEach(([th, om], i) => {
        if (i === 0 || Math.abs(th - traj[i - 1][0]) > 3) ctx.moveTo(px(th), py(om));
        else ctx.lineTo(px(th), py(om));
      });
      ctx.stroke();
      if (traj.length > 0) {
        const [th, om] = traj[0];
        ctx.fillStyle = colTraj;
        ctx.beginPath();
        ctx.arc(px(th), py(om), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  const launch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let th = (((e.clientX - rect.left) / rect.width) * 2 - 1) * TH_MAX;
    let om = -(((e.clientY - rect.top) / rect.height) * 2 - 1) * OM_MAX;
    const traj: [number, number][] = [];
    const dt = 0.03;
    for (let s = 0; s < 900; s++) {
      traj.push([th, om]);
      // RK2 suffit ici
      const k1th = om;
      const k1om = -G * Math.sin(th);
      const k2th = om + dt * k1om;
      const k2om = -G * Math.sin(th + dt * k1th);
      th += (dt / 2) * (k1th + k2th);
      om += (dt / 2) * (k1om + k2om);
      // Enroulement : θ revient dans [−1.6π, 1.6π]
      if (th > TH_MAX) th -= 2 * TH_MAX;
      if (th < -TH_MAX) th += 2 * TH_MAX;
    }
    trajRef.current = [...trajRef.current.slice(-4), traj];
    setVersion((v) => v + 1);
  };

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <button
          type="button"
          className="btn"
          onClick={() => {
            trajRef.current = [];
            setVersion((v) => v + 1);
          }}
        >
          effacer
        </button>
        <span className="physics-hint">clique pour lancer un pendule (θ, ω)</span>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%', cursor: 'crosshair', touchAction: 'none' }} onPointerDown={launch} />
      <p className="physics-caption">
        Chaque point du plan est un <strong>état complet</strong> du pendule (angle θ, vitesse ω) ; sa
        vie entière est une courbe. Près du centre : des ovales — l’oscillation. En haut et en bas :
        des vagues — le pendule tourne sans fin. Entre les deux, la <strong>séparatrice</strong>{' '}
        (pointillés orange) : l’énergie exacte pour atteindre le sommet… en un temps infini. Les
        courbes ne se croisent jamais : le flot hamiltonien conserve l’énergie — chaque trajectoire
        est une ligne de niveau de H = ω²/2 − cos θ.
      </p>
    </div>
  );
}
