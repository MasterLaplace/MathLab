import { lessons } from '../content/lessons';
import type { Progress } from '../core/progress';

interface HomeProps {
  progress: Progress;
  onOpenLesson: (id: string) => void;
  onOpenPlayground: () => void;
  onResetProgress: () => void;
}

const PHASE_TITLES: Record<number, string> = {
  1: 'Phase 1 — Les fondations : les opérations inverses',
  2: 'Phase 2 — L’algèbre de la balance',
  3: 'Phase 3 — Les maths en action : la physique',
  4: 'Phase 4 — Le changement : vers le calcul infinitésimal',
  5: 'Phase 5 — Champs et équations différentielles',
  6: 'Phase 6 — Les méthodes d’expert',
  7: 'Phase 7 — L’algèbre du plan et de l’espace',
  8: 'Phase 8 — Surfaces et champs : la 3ᵉ dimension',
  9: 'Phase 9 — Ondes et grandes équations',
  10: 'Phase 10 — Le hasard apprivoisé : probabilités',
};

/** Une leçon terminée depuis plus de 3 jours mérite une révision. */
const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function needsReview(completedAt?: string): boolean {
  if (!completedAt) return false;
  return Date.now() - new Date(completedAt).getTime() > REVIEW_AFTER_MS;
}

export function Home({ progress, onOpenLesson, onOpenPlayground, onResetProgress }: HomeProps) {
  const phases = [...new Set(lessons.map((l) => l.phase))].sort((a, b) => a - b);
  const doneCount = lessons.filter((l) => progress.lessons[l.id]?.completed).length;

  return (
    <div className="page home-page">
      <header className="home-hero">
        <h1>
          Math<span className="accent">Lab</span>
        </h1>
        <p className="home-sub">
          Apprendre les mathématiques en les manipulant : attrape un terme, fais-le glisser,
          et découvre comment chaque opération possède son inverse.
        </p>
        <p className="home-progress">
          {doneCount}/{lessons.length} leçons terminées
        </p>
      </header>

      {phases.map((phase) => (
        <section key={phase} className="home-phase">
          <h2>{PHASE_TITLES[phase]}</h2>
          <div className="lesson-grid">
            {lessons
              .filter((l) => l.phase === phase)
              .map((lesson) => {
                const p = progress.lessons[lesson.id];
                const done = p?.completed ?? false;
                const review = done && needsReview(p?.completedAt);
                return (
                  <button
                    type="button"
                    key={lesson.id}
                    className={`lesson-card ${done ? 'lesson-card-done' : ''}`}
                    onClick={() => onOpenLesson(lesson.id)}
                  >
                    <span className="lesson-card-status">
                      {done ? '✓' : '○'}
                      {review && <span className="lesson-card-review"> À réviser</span>}
                    </span>
                    <span className="lesson-card-title">{lesson.title}</span>
                    <span className="lesson-card-tagline">{lesson.tagline}</span>
                    <span className="lesson-card-count">
                      {p?.exercisesDone ?? 0}/{lesson.exercises.length} exercices
                    </span>
                  </button>
                );
              })}
          </div>
        </section>
      ))}

      <section className="home-phase">
        <h2>Terrain de jeu</h2>
        <button type="button" className="lesson-card lesson-card-playground" onClick={onOpenPlayground}>
          <span className="lesson-card-title">🧪 Playground</span>
          <span className="lesson-card-tagline">Manipule librement n’importe quelle équation</span>
        </button>
      </section>

      {doneCount > 0 && (
        <button
          type="button"
          className="btn btn-ghost home-reset"
          onClick={() => {
            if (window.confirm('Effacer toute la progression ?')) onResetProgress();
          }}
        >
          ↺ Réinitialiser la progression
        </button>
      )}
    </div>
  );
}
