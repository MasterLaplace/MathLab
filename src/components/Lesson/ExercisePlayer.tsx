import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type Expr, freeVariables, isCall, normalize } from '../../core/ast';
import { reachesGoal } from '../../core/engine';
import { playNope, playSuccess, playTick } from '../../core/sound';
import type { Move } from '../../core/rules';
import type { Exercise } from '../../content/schema';
import { EquationView } from '../Equation/EquationView';
import { GraphView } from '../Graph/GraphView';
import { SimView } from './SimView';
import { MathText } from './CourseView';
import './lesson.css';

interface ExercisePlayerProps {
  exercise: Exercise;
  onSuccess: () => void;
  /** Mode examen (Défi du jour) : aucun indice, ni bouton ni rattrapage. */
  exam?: boolean;
}

interface Step {
  label: string;
  why?: string;
  expr: Expr;
}

export function ExercisePlayer({ exercise, onSuccess, exam }: ExercisePlayerProps) {
  const [expr, setExpr] = useState<Expr>(() => normalize(exercise.start));
  const [steps, setSteps] = useState<Step[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const missesRef = useRef(0);

  // Indices progressifs (expéditions) ou indice unique (leçons classiques).
  const hintList = useMemo(
    () => exercise.hints ?? (exercise.hint ? [exercise.hint] : []),
    [exercise.hints, exercise.hint],
  );

  // Exploration pure : la simulation remplace l'équation.
  const pureExploration = Boolean(exercise.free && exercise.sim);

  const graphable =
    isCall(expr) && expr[0] === 'Equal' && freeVariables(expr).size === 1 && !exercise.sim;

  // Réinitialise quand on change d'exercice.
  useEffect(() => {
    setExpr(normalize(exercise.start));
    setSteps([]);
    setHint(null);
    setSolved(false);
    setHintIndex(0);
    missesRef.current = 0;
  }, [exercise]);

  const apply = useCallback(
    (move: Move) => {
      if (solved) return;
      const next = normalize(move.result);
      setExpr(next);
      setSteps((s) => [...s, { label: move.label, why: move.why, expr: next }]);
      setHint(null);
      if (exercise.goal !== undefined && reachesGoal(next, exercise.goal, exercise.strictGoal)) {
        setSolved(true);
        playSuccess();
      } else {
        playTick();
      }
    },
    [exercise.goal, exercise.strictGoal, solved],
  );

  const undo = useCallback(() => {
    setSteps((s) => {
      const next = s.slice(0, -1);
      setExpr(next.length > 0 ? next[next.length - 1].expr : normalize(exercise.start));
      return next;
    });
    setSolved(false);
    setHint(null);
  }, [exercise.start]);

  const restart = useCallback(() => {
    setExpr(normalize(exercise.start));
    setSteps([]);
    setSolved(false);
    setHint(null);
  }, [exercise.start]);

  const showHint = useCallback(() => {
    if (hintList.length === 0) {
      setHint('Essaie de glisser un terme vers l’autre côté du signe =.');
      return;
    }
    // Chaque appui révèle l'indice suivant, jusqu'au dernier.
    const next = Math.min(hintIndex, hintList.length - 1);
    setHint(hintList[next]);
    setHintIndex(next + 1);
  }, [hintList, hintIndex]);

  const onIllegal = useCallback(() => {
    playNope();
    // Le premier raté ne déclenche que le rebond ; l'indice arrive au deuxième.
    missesRef.current += 1;
    if (!exam && missesRef.current >= 2 && hintList.length > 0) setHint(hintList[0]);
  }, [hintList, exam]);

  return (
    <div className={`exercise ${solved ? 'exercise-solved' : ''}`}>
      <p className="exercise-prompt">
        <MathText text={exercise.prompt} />
      </p>

      <div className="exercise-stage" style={pureExploration ? { display: 'none' } : undefined}>
        <EquationView
          expr={expr}
          onApply={apply}
          onIllegal={onIllegal}
          interactive={!solved && !exercise.free}
        />
        {solved && (
          <div className="exercise-success">
            <span className="exercise-success-badge">✓ Résolu !</span>
            <button type="button" className="btn btn-primary" onClick={onSuccess}>
              Continuer
            </button>
          </div>
        )}
      </div>

      {exercise.sim && <SimView key={exercise.id} sim={exercise.sim} solved={solved} />}

      {exercise.free && !solved && (
        <button
          type="button"
          className="btn btn-primary"
          style={{ alignSelf: 'center' }}
          onClick={onSuccess}
        >
          J’ai exploré, continuer →
        </button>
      )}

      {showGraph && graphable && <GraphView expr={expr} />}

      {hint && !solved && (
        <p className="exercise-hint">
          💡 <MathText text={hint} />
        </p>
      )}

      {steps.length > 0 && (
        <ol className="exercise-steps">
          {steps.map((s, i) => (
            <li key={i}>
              {s.label}
              {showWhy && s.why && <span className="exercise-why"> — {s.why}</span>}
            </li>
          ))}
        </ol>
      )}

      <div className="exercise-actions">
        <button type="button" className="btn" onClick={undo} disabled={steps.length === 0}>
          ← Annuler
        </button>
        <button type="button" className="btn" onClick={restart} disabled={steps.length === 0}>
          ↺ Recommencer
        </button>
        {!solved && !exam && (
          <button type="button" className="btn" onClick={showHint}>
            💡 Indice
            {hintList.length > 1 && ` (${Math.min(hintIndex, hintList.length)}/${hintList.length})`}
          </button>
        )}
        {graphable && (
          <button type="button" className="btn" onClick={() => setShowGraph((v) => !v)}>
            📈 {showGraph ? 'Masquer le graphe' : 'Voir le graphe'}
          </button>
        )}
        {steps.some((s) => s.why) && (
          <button type="button" className="btn" onClick={() => setShowWhy((v) => !v)}>
            🤔 {showWhy ? 'Masquer le pourquoi' : 'Pourquoi ça marche ?'}
          </button>
        )}
      </div>
    </div>
  );
}
