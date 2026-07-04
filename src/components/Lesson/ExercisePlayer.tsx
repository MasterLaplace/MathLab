import { useCallback, useEffect, useRef, useState } from 'react';
import { type Expr, freeVariables, isCall, normalize } from '../../core/ast';
import { reachesGoal } from '../../core/engine';
import { playNope, playSuccess, playTick } from '../../core/sound';
import type { Move } from '../../core/rules';
import type { Exercise } from '../../content/schema';
import { EquationView } from '../Equation/EquationView';
import { GraphView } from '../Graph/GraphView';
import { KinematicsSim } from '../Physics/KinematicsSim';
import { TangentExplorer } from '../Physics/TangentExplorer';
import { AreaExplorer } from '../Physics/AreaExplorer';
import { SpringSim } from '../Physics/SpringSim';
import { VectorFieldExplorer } from '../Physics/VectorFieldExplorer';
import { VectorsExplorer } from '../Physics/VectorsExplorer';
import { MatrixExplorer } from '../Physics/MatrixExplorer';
import { FourierExplorer } from '../Physics/FourierExplorer';
import { Surface3D } from '../Physics/Surface3D';
import { UnitCircleExplorer } from '../Physics/UnitCircleExplorer';
import { DirectionFieldExplorer } from '../Physics/DirectionFieldExplorer';
import { GaltonExplorer } from '../Physics/GaltonExplorer';
import { BayesExplorer } from '../Physics/BayesExplorer';
import { RiemannExplorer } from '../Physics/RiemannExplorer';
import { PoleExplorer } from '../Physics/PoleExplorer';
import { ComplexExplorer } from '../Physics/ComplexExplorer';
import { EpicyclesExplorer } from '../Physics/EpicyclesExplorer';
import './lesson.css';

interface ExercisePlayerProps {
  exercise: Exercise;
  onSuccess: () => void;
}

interface Step {
  label: string;
  why?: string;
  expr: Expr;
}

export function ExercisePlayer({ exercise, onSuccess }: ExercisePlayerProps) {
  const [expr, setExpr] = useState<Expr>(() => normalize(exercise.start));
  const [steps, setSteps] = useState<Step[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [solved, setSolved] = useState(false);
  const [showGraph, setShowGraph] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const missesRef = useRef(0);

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
    setHint(exercise.hint ?? 'Essaie de glisser un terme vers l’autre côté du signe =.');
  }, [exercise.hint]);

  const onIllegal = useCallback(() => {
    playNope();
    // Le premier raté ne déclenche que le rebond ; l'indice arrive au deuxième.
    missesRef.current += 1;
    if (missesRef.current >= 2 && exercise.hint) setHint(exercise.hint);
  }, [exercise.hint]);

  return (
    <div className={`exercise ${solved ? 'exercise-solved' : ''}`}>
      <p className="exercise-prompt">{exercise.prompt}</p>

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

      {exercise.sim?.type === 'kinematics' && (
        <KinematicsSim d={exercise.sim.d} t={exercise.sim.t} solved={solved} />
      )}
      {exercise.sim?.type === 'tangent' && <TangentExplorer />}
      {exercise.sim?.type === 'area' && <AreaExplorer />}
      {exercise.sim?.type === 'vector-field' && (
        <VectorFieldExplorer key={exercise.id} mode={exercise.sim.mode} />
      )}
      {exercise.sim?.type === 'spring' && <SpringSim />}
      {exercise.sim?.type === 'vectors' && <VectorsExplorer />}
      {exercise.sim?.type === 'matrix' && <MatrixExplorer mode={exercise.sim.mode} />}
      {exercise.sim?.type === 'fourier' && <FourierExplorer />}
      {exercise.sim?.type === 'surface3d' && <Surface3D fn={exercise.sim.fn} />}
      {exercise.sim?.type === 'unit-circle' && <UnitCircleExplorer />}
      {exercise.sim?.type === 'direction-field' && <DirectionFieldExplorer />}
      {exercise.sim?.type === 'galton' && <GaltonExplorer />}
      {exercise.sim?.type === 'bayes' && <BayesExplorer />}
      {exercise.sim?.type === 'riemann' && <RiemannExplorer />}
      {exercise.sim?.type === 'poles' && <PoleExplorer />}
      {exercise.sim?.type === 'complex' && <ComplexExplorer />}
      {exercise.sim?.type === 'epicycles' && <EpicyclesExplorer />}

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

      {hint && !solved && <p className="exercise-hint">💡 {hint}</p>}

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
        {!solved && (
          <button type="button" className="btn" onClick={showHint}>
            💡 Indice
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
