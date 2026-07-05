import { useEffect, useRef, useState } from 'react';
import './physics.css';

/**
 * Navier-Stokes en direct : un solveur « stable fluids » (Jos Stam, 1999)
 * sur grille 64×64 — diffusion, advection, projection (incompressibilité),
 * en TypeScript pur. Glisse la souris : tu injectes de l'encre et de la
 * quantité de mouvement ; la viscosité décide du destin des tourbillons.
 */
const N = 64;
const SIZE = (N + 2) * (N + 2);
const IX = (i: number, j: number) => i + (N + 2) * j;

function addSource(x: Float32Array, s: Float32Array, dt: number) {
  for (let i = 0; i < SIZE; i++) x[i] += dt * s[i];
}

function setBnd(b: number, x: Float32Array) {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i)] = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
    x[IX(i, 0)] = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
  }
  x[IX(0, 0)] = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, N + 1)] = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
  x[IX(N + 1, 0)] = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

function linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number) {
  for (let k = 0; k < 12; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        x[IX(i, j)] =
          (x0[IX(i, j)] + a * (x[IX(i - 1, j)] + x[IX(i + 1, j)] + x[IX(i, j - 1)] + x[IX(i, j + 1)])) / c;
      }
    }
    setBnd(b, x);
  }
}

function diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number) {
  const a = dt * diff * N * N;
  linSolve(b, x, x0, a, 1 + 4 * a);
}

function advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number) {
  const dt0 = dt * N;
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      let x = i - dt0 * u[IX(i, j)];
      let y = j - dt0 * v[IX(i, j)];
      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      const i0 = Math.floor(x);
      const i1 = i0 + 1;
      const j0 = Math.floor(y);
      const j1 = j0 + 1;
      const s1 = x - i0;
      const s0 = 1 - s1;
      const t1 = y - j0;
      const t0 = 1 - t1;
      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) + s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  setBnd(b, d);
}

function project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array) {
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] = (-0.5 * (u[IX(i + 1, j)] - u[IX(i - 1, j)] + v[IX(i, j + 1)] - v[IX(i, j - 1)])) / N;
      p[IX(i, j)] = 0;
    }
  }
  setBnd(0, div);
  setBnd(0, p);
  linSolve(0, p, div, 1, 4);
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      u[IX(i, j)] -= 0.5 * N * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
      v[IX(i, j)] -= 0.5 * N * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
    }
  }
  setBnd(1, u);
  setBnd(2, v);
}

export function FluidExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visc, setVisc] = useState(5); // 10⁻⁴ … : curseur log
  const state = useRef({
    u: new Float32Array(SIZE),
    v: new Float32Array(SIZE),
    u0: new Float32Array(SIZE),
    v0: new Float32Array(SIZE),
    dens: new Float32Array(SIZE),
    dens0: new Float32Array(SIZE),
    mouse: { x: 0, y: 0, px: 0, py: 0, down: false },
  });

  const W = 480;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = N;
    canvas.height = N;

    const st = state.current;
    const dt = 0.1;
    const viscosity = 10 ** (-(10 - visc) / 2); // curseur 0..10 → 10⁻⁵ … 1

    let raf = 0;
    const img = ctx.createImageData(N, N);

    const step = () => {
      const { u, v, u0, v0, dens, dens0, mouse } = st;
      u0.fill(0);
      v0.fill(0);
      dens0.fill(0);

      // Souris : injecte encre + vitesse.
      if (mouse.down) {
        const i = Math.min(N, Math.max(1, Math.round(mouse.x * N)));
        const j = Math.min(N, Math.max(1, Math.round(mouse.y * N)));
        dens0[IX(i, j)] = 300;
        u0[IX(i, j)] = (mouse.x - mouse.px) * 600;
        v0[IX(i, j)] = (mouse.y - mouse.py) * 600;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
      }

      // Vitesse : sources → diffusion → projection → advection → projection.
      addSource(u, u0, dt);
      addSource(v, v0, dt);
      u0.set(u);
      diffuse(1, u, u0, viscosity, dt);
      v0.set(v);
      diffuse(2, v, v0, viscosity, dt);
      project(u, v, u0, v0);
      u0.set(u);
      v0.set(v);
      advect(1, u, u0, u0, v0, dt);
      advect(2, v, v0, u0, v0, dt);
      project(u, v, u0, v0);

      // Densité (l'encre) : source → diffusion → advection + évaporation.
      addSource(dens, dens0, dt);
      dens0.set(dens);
      diffuse(0, dens, dens0, 0.00001, dt);
      dens0.set(dens);
      advect(0, dens, dens0, u, v, dt);
      for (let k = 0; k < SIZE; k++) dens[k] *= 0.995;

      // Rendu : densité en bleu-blanc.
      const data = img.data;
      for (let j = 0; j < N; j++) {
        for (let i = 0; i < N; i++) {
          const d = Math.min(1, dens[IX(i + 1, j + 1)]);
          const idx = (j * N + i) * 4;
          data[idx] = 30 + d * 160;
          data[idx + 1] = 40 + d * 190;
          data[idx + 2] = 70 + d * 185;
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [visc]);

  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, down?: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const m = state.current.mouse;
    m.x = (e.clientX - rect.left) / rect.width;
    m.y = (e.clientY - rect.top) / rect.height;
    if (down !== undefined) {
      m.down = down;
      m.px = m.x;
      m.py = m.y;
    }
  };

  return (
    <div className="physics-sim">
      <div className="physics-controls">
        <label>
          viscosité : 10^{(-(10 - visc) / 2).toFixed(1)}
          <input type="range" min={0} max={10} value={visc} onChange={(e) => setVisc(Number(e.target.value))} />
        </label>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: W, height: W, maxWidth: '100%', imageRendering: 'auto', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          onPointer(e, true);
        }}
        onPointerMove={(e) => onPointer(e)}
        onPointerUp={(e) => onPointer(e, false)}
        onPointerLeave={(e) => onPointer(e, false)}
      />
      <p className="physics-caption">
        Navier-Stokes résolu 60 fois par seconde sur une grille 64×64 (méthode « stable fluids » de
        Stam) : diffusion (la viscosité lisse), advection (le fluide se transporte lui-même — le terme
        non linéaire !) et projection (la pression impose ∇·v = 0 : incompressible). <strong>Glisse la
        souris</strong> pour injecter de l’encre. Baisse la viscosité : les volutes survivent et
        s’enroulent — bienvenue vers la turbulence.
      </p>
    </div>
  );
}
