import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Le double pendule : deux tiges, deux masses, équations de Lagrange
 * intégrées en RK4 — et le chaos. Deux exemplaires partent avec un écart
 * d'un millième de degré : au début jumeaux, puis deux destins sans rapport.
 */
type State = [number, number, number, number]; // θ₁, θ₂, ω₁, ω₂

const G = 9.8;
const L1 = 1;
const L2 = 1;
const M1 = 1;
const M2 = 1;

function deriv([t1, t2, w1, w2]: State): State {
  const d = t1 - t2;
  const den = 2 * M1 + M2 - M2 * Math.cos(2 * d);
  const a1 =
    (-G * (2 * M1 + M2) * Math.sin(t1) -
      M2 * G * Math.sin(t1 - 2 * t2) -
      2 * Math.sin(d) * M2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) /
    (L1 * den);
  const a2 =
    (2 * Math.sin(d) * (w1 * w1 * L1 * (M1 + M2) + G * (M1 + M2) * Math.cos(t1) + w2 * w2 * L2 * M2 * Math.cos(d))) /
    (L2 * den);
  return [w1, w2, a1, a2];
}

function rk4(s: State, dt: number): State {
  const k1 = deriv(s);
  const k2 = deriv(s.map((v, i) => v + (dt / 2) * k1[i]) as State);
  const k3 = deriv(s.map((v, i) => v + (dt / 2) * k2[i]) as State);
  const k4 = deriv(s.map((v, i) => v + dt * k3[i]) as State);
  return s.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])) as State;
}

const START: State = [Math.PI / 2, Math.PI / 2, 0, 0];
const EPS = 0.00002;

export function DoublePendulumExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [twin, setTwin] = useState(true);
  const sRef = useRef<{ a: State; b: State; trace: [number, number][]; t: number }>({
    a: [...START] as State,
    b: [START[0] + EPS, START[1], 0, 0],
    trace: [],
    t: 0,
  });

  const W = 560;
  const H = 360;
  const CX = W / 2;
  const CYP = 110;
  const SCALE = 78;

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
    const colB = css.getPropertyValue('--warn').trim() || '#e5a742';
    const colDim = css.getPropertyValue('--text-dim').trim() || '#9aa2bd';

    const tip = (s: State): [number, number] => {
      const x1 = CX + SCALE * L1 * Math.sin(s[0]);
      const y1 = CYP + SCALE * L1 * Math.cos(s[0]);
      return [x1 + SCALE * L2 * Math.sin(s[1]), y1 + SCALE * L2 * Math.cos(s[1])];
    };

    const drawPendulum = (s: State, col: string, alpha: number) => {
      const x1 = CX + SCALE * L1 * Math.sin(s[0]);
      const y1 = CYP + SCALE * L1 * Math.cos(s[0]);
      const [x2, y2] = tip(s);
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(CX, CYP);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      for (const [x, y] of [
        [x1, y1],
        [x2, y2],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const draw = () => {
      const st = sRef.current;
      // Plusieurs petits pas RK4 par frame pour la stabilité.
      for (let k = 0; k < 3; k++) {
        st.a = rk4(st.a, 0.01);
        st.b = rk4(st.b, 0.01);
        st.t += 0.01;
      }
      const tipA = tip(st.a);
      st.trace.push(tipA);
      if (st.trace.length > 700) st.trace.shift();

      ctx.clearRect(0, 0, W, H);

      // Trace de la pointe A
      ctx.strokeStyle = colA;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      st.trace.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Pivot
      ctx.fillStyle = colDim;
      ctx.beginPath();
      ctx.arc(CX, CYP, 4, 0, Math.PI * 2);
      ctx.fill();

      if (twin) drawPendulum(st.b, colB, 0.85);
      drawPendulum(st.a, colA, 1);

      // Écart entre les jumeaux
      if (twin) {
        const tb = tip(st.b);
        const gap = Math.hypot(tipA[0] - tb[0], tipA[1] - tb[1]) / SCALE;
        ctx.fillStyle = colDim;
        ctx.font = '600 13px system-ui';
        ctx.fillText(`t = ${st.t.toFixed(1)} s   écart initial : 0,00002 rad   écart actuel : ${gap.toFixed(4)} m`, 14, 22);
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [twin]);

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          <input type="checkbox" checked={twin} onChange={(e) => setTwin(e.target.checked)} /> jumeau (écart 10⁻⁵)
        </label>
        <button
          type="button"
          className="btn"
          onClick={() => {
            sRef.current = { a: [...START] as State, b: [START[0] + EPS, START[1], 0, 0], trace: [], t: 0 };
          }}
        >
          relancer
        </button>
      </div>
      <canvas ref={canvasRef} style={{ width: W, height: H, maxWidth: '100%' }} />
      <p className="physics-caption">
        Deux pendules accrochés bout à bout : les équations sortent du lagrangien en dix lignes, mais
        leurs solutions sont <strong>chaotiques</strong>. Le jumeau orange part avec un écart de
        10⁻⁵ radian — indiscernable — et pourtant, au bout de quelques secondes, les deux trajectoires
        n’ont plus rien en commun. Déterministe ≠ prévisible : c’est l’effet papillon, mesuré sous tes
        yeux par l’« écart actuel ».
      </p>
    </div>
  );
}
