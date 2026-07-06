import { useState } from 'react';
import { ExercisePlayer } from '../components/Lesson/ExercisePlayer';
import { MathText } from '../components/Lesson/CourseView';
import type { Expedition as ExpeditionDef } from '../content/expeditions';
import { markExpeditionDone } from '../core/expedition';

interface ExpeditionProps {
  expedition: ExpeditionDef;
  onBack: () => void;
}

/**
 * Une expédition : un problème rédigé multi-étapes qui traverse plusieurs
 * stations du parcours. Chaque étape a ses indices progressifs (du coup de
 * pouce à la quasi-solution) — c'est l'entraînement vers les problèmes
 * de niveau olympiades.
 */
export function Expedition({ expedition, onBack }: ExpeditionProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const step = expedition.steps[index];

  const advance = () => {
    if (index + 1 < expedition.steps.length) {
      setIndex(index + 1);
    } else {
      markExpeditionDone(expedition.id);
      setFinished(true);
    }
  };

  return (
    <div className="page lesson-page">
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Parcours
      </button>
      <header className="lesson-header">
        <span className="lesson-phase">Expédition</span>
        <h1>
          {expedition.emoji} {expedition.title}
        </h1>
      </header>

      {finished ? (
        <div className="lesson-finished">
          <span className="lesson-finished-emoji">🏔️</span>
          <h2>Expédition réussie !</h2>
          <p>
            <MathText text={expedition.epilogue} />
          </p>
          <button type="button" className="btn btn-primary" onClick={onBack}>
            Retour au parcours
          </button>
        </div>
      ) : (
        <>
          {index === 0 && (
            <div className="lesson-intro">
              {expedition.story.map((p, i) => (
                <p key={i}>
                  <MathText text={p} />
                </p>
              ))}
            </div>
          )}

          <div className="lesson-progressbar">
            {expedition.steps.map((s, i) => (
              <span
                key={s.exercise.id}
                className={`dot ${i < index ? 'dot-done' : i === index ? 'dot-current' : ''}`}
              />
            ))}
          </div>
          <p style={{ textAlign: 'center', opacity: 0.75, margin: '0.2rem 0 0' }}>
            Étape {index + 1}/{expedition.steps.length}
          </p>

          <div className="lesson-intro">
            <p>
              <MathText text={step.intro} />
            </p>
          </div>

          <ExercisePlayer key={step.exercise.id} exercise={step.exercise} onSuccess={advance} />
        </>
      )}
    </div>
  );
}
