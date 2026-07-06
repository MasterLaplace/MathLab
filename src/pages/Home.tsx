import { expeditions } from '../content/expeditions';
import { lessons } from '../content/lessons';
import { loadExpeditionsDone } from '../core/expedition';
import type { Progress } from '../core/progress';

interface HomeProps {
  progress: Progress;
  onOpenLesson: (id: string) => void;
  onOpenPlayground: () => void;
  onOpenQuest: () => void;
  onOpenExpedition: (id: string) => void;
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
  11: 'Phase 11 — Le pays de Laplace',
  12: 'Phase 12 — Le plan complexe : la rotation devenue nombre',
  13: 'Phase 13 — La nature optimise : action, chaos et fluides',
  14: 'Phase 14 — Le monde quantique : la matière est une onde',
  15: 'Phase 15 — L’espace-temps : la relativité',
  16: 'Phase 16 — Les nombres entiers : l’arithmétique secrète',
  17: 'Phase 17 — La symétrie devient calcul : les groupes',
  18: 'Phase 18 — L’art de la preuve : récurrence, absurde, tiroirs',
};

/** Une leçon terminée depuis plus de 3 jours mérite une révision. */
const REVIEW_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

function needsReview(completedAt?: string): boolean {
  if (!completedAt) return false;
  return Date.now() - new Date(completedAt).getTime() > REVIEW_AFTER_MS;
}

export function Home({ progress, onOpenLesson, onOpenPlayground, onOpenQuest, onOpenExpedition, onResetProgress }: HomeProps) {
  const phases = [...new Set(lessons.map((l) => l.phase))].sort((a, b) => a - b);
  const doneCount = lessons.filter((l) => progress.lessons[l.id]?.completed).length;
  const expeditionsDone = loadExpeditionsDone();

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
        <h2>Expéditions — problèmes multi-étapes</h2>
        <div className="lesson-grid">
          {expeditions.map((exp) => {
            const done = expeditionsDone.has(exp.id);
            return (
              <button
                type="button"
                key={exp.id}
                className={`lesson-card ${done ? 'lesson-card-done' : ''}`}
                onClick={() => onOpenExpedition(exp.id)}
              >
                <span className="lesson-card-status">{done ? '✓' : '○'}</span>
                <span className="lesson-card-title">
                  {exp.emoji} {exp.title}
                </span>
                <span className="lesson-card-tagline">{exp.tagline}</span>
                <span className="lesson-card-count">{exp.steps.length} étapes · indices progressifs</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="home-phase">
        <h2>Terrain de jeu</h2>
        <div className="lesson-grid">
          <button type="button" className="lesson-card lesson-card-playground" onClick={onOpenQuest}>
            <span className="lesson-card-title">⚔️ Défi du jour</span>
            <span className="lesson-card-tagline">5 exercices tirés dans tout le parcours — mode examen, sans indices</span>
          </button>
          <button type="button" className="lesson-card lesson-card-playground" onClick={onOpenPlayground}>
            <span className="lesson-card-title">🧪 Playground</span>
            <span className="lesson-card-tagline">Manipule librement n’importe quelle équation</span>
          </button>
        </div>
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
