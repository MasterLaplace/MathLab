import { useCallback, useEffect, useRef, useState } from 'react';
import 'mathlive';
import type { MathfieldElement } from 'mathlive';
import { EquationView } from '../components/Equation/EquationView';
import { GraphView } from '../components/Graph/GraphView';
import { type Expr, freeVariables, isCall, normalize } from '../core/ast';
import { parseLatex } from '../core/engine';
import type { Move } from '../core/rules';
import { playNope, playTick } from '../core/sound';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': React.DetailedHTMLProps<React.HTMLAttributes<MathfieldElement>, MathfieldElement>;
    }
  }
}

const PRESETS: { label: string; expr: Expr }[] = [
  { label: '2x + 3 = 11', expr: ['Equal', ['Add', ['Multiply', 2, 'x'], 3], 11] },
  { label: '5x + 2 = 3x + 10', expr: ['Equal', ['Add', ['Multiply', 5, 'x'], 2], ['Add', ['Multiply', 3, 'x'], 10]] },
  { label: 'x² + 9 = 25', expr: ['Equal', ['Add', ['Power', 'x', 2], 9], 25] },
  { label: '2eˣ = 10', expr: ['Equal', ['Multiply', 2, ['Exp', 'x']], 10] },
  { label: 'E = mv²/2', expr: ['Equal', 'E', ['Divide', ['Multiply', 'm', ['Power', 'v', 2]], 2]] },
];

interface PlaygroundProps {
  onBack: () => void;
}

export function Playground({ onBack }: PlaygroundProps) {
  const [expr, setExpr] = useState<Expr>(normalize(PRESETS[0].expr));
  const [history, setHistory] = useState<Expr[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showGraph, setShowGraph] = useState(false);
  const mathfieldRef = useRef<MathfieldElement>(null);

  useEffect(() => {
    const mf = mathfieldRef.current;
    if (!mf) return;
    mf.value = '3x-4=8';
    const onEnter = (ev: Event) => {
      ev.preventDefault();
      load(ev.target ? (ev.target as MathfieldElement).value : '');
    };
    // MathLive émet "change" quand l'utilisateur valide avec Entrée.
    mf.addEventListener('change', onEnter);
    return () => mf.removeEventListener('change', onEnter);
  }, []);

  const apply = useCallback((move: Move) => {
    playTick();
    setExpr((prev) => {
      setHistory((h) => [...h, prev]);
      return normalize(move.result);
    });
  }, []);

  const undo = () => {
    setHistory((h) => {
      if (h.length === 0) return h;
      setExpr(h[h.length - 1]);
      return h.slice(0, -1);
    });
  };

  const loadExpr = (e: Expr) => {
    setExpr(normalize(e));
    setHistory([]);
    setError(null);
  };

  const load = (latex: string) => {
    try {
      const parsed = parseLatex(latex);
      if (parsed === undefined || parsed === null || parsed === 'Nothing') throw new Error('vide');
      loadExpr(parsed);
    } catch {
      setError('Impossible de lire cette expression. Essaie par exemple : 3x - 4 = 8');
    }
  };

  const graphable = isCall(expr) && expr[0] === 'Equal' && freeVariables(expr).size === 1;

  return (
    <div className="page playground-page">
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Parcours
      </button>
      <h1>🧪 Playground</h1>
      <p className="home-sub">
        Manipule librement : glisse les termes, appuie sur les calculs. Aucun objectif, juste
        l’exploration.
      </p>

      <div className="playground-presets">
        {PRESETS.map((p) => (
          <button type="button" key={p.label} className="btn" onClick={() => loadExpr(p.expr)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="playground-input">
        <math-field ref={mathfieldRef} />
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => load(mathfieldRef.current?.value ?? '')}
        >
          Charger
        </button>
      </div>
      {error && <p className="exercise-hint">{error}</p>}

      <div className="exercise-stage playground-stage">
        <EquationView expr={expr} onApply={apply} onIllegal={() => playNope()} />
      </div>

      {showGraph && graphable && <GraphView expr={expr} />}

      <div className="exercise-actions">
        <button type="button" className="btn" onClick={undo} disabled={history.length === 0}>
          ← Annuler
        </button>
        {graphable && (
          <button type="button" className="btn" onClick={() => setShowGraph((v) => !v)}>
            📈 {showGraph ? 'Masquer le graphe' : 'Voir le graphe'}
          </button>
        )}
      </div>
    </div>
  );
}
