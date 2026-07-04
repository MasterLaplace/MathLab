import { useState } from 'react';
import { ExercisePlayer } from '../components/Lesson/ExercisePlayer';
import { CourseView, MathText } from '../components/Lesson/CourseView';
import type { Exercise, Lesson } from '../content/schema';

interface LessonPageProps {
  lesson: Lesson;
  onExerciseDone: (lessonId: string) => void;
  onBack: () => void;
}

export function LessonPage({ lesson, onExerciseDone, onBack }: LessonPageProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [bonus, setBonus] = useState<Exercise | null>(null);
  const exercise = bonus ?? lesson.exercises[index];

  const handleSuccess = () => {
    if (bonus) {
      setBonus(null);
      return;
    }
    onExerciseDone(lesson.id);
    if (index + 1 < lesson.exercises.length) {
      setIndex(index + 1);
    } else {
      setFinished(true);
    }
  };

  return (
    <div className="page lesson-page">
      <button type="button" className="btn btn-ghost" onClick={onBack}>
        ← Parcours
      </button>
      <header className="lesson-header">
        <span className="lesson-phase">Phase {lesson.phase}</span>
        <h1>{lesson.title}</h1>
      </header>

      {index === 0 &&
        !finished &&
        (lesson.course ? (
          <CourseView blocks={lesson.course} />
        ) : (
          <div className="lesson-intro">
            {lesson.intro.map((p, i) => (
              <p key={i}>
                <MathText text={p} />
              </p>
            ))}
          </div>
        ))}

      {!finished || bonus ? (
        <>
          <div className="lesson-progressbar">
            {lesson.exercises.map((e, i) => (
              <span
                key={e.id}
                className={`dot ${i < index ? 'dot-done' : i === index ? 'dot-current' : ''}`}
              />
            ))}
          </div>
          <ExercisePlayer exercise={exercise} onSuccess={handleSuccess} />
        </>
      ) : (
        <div className="lesson-finished">
          <span className="lesson-finished-emoji">🎉</span>
          <h2>Leçon terminée !</h2>
          <p>Tu maîtrises : {lesson.tagline.toLowerCase()}.</p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {lesson.generator && (
              <button type="button" className="btn" onClick={() => setBonus(lesson.generator!())}>
                🎲 Exercice bonus
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Retour au parcours
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
