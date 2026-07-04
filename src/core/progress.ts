/** Progression de l'apprenant, persistée en localStorage. */

export interface LessonProgress {
  completed: boolean;
  /** Nombre d'exercices réussis dans la leçon. */
  exercisesDone: number;
  completedAt?: string;
}

export interface Progress {
  lessons: Record<string, LessonProgress>;
}

const STORAGE_KEY = 'learningapp.progress.v1';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadProgress(): Progress {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Progress;
      if (parsed && typeof parsed.lessons === 'object') return parsed;
    } catch {
      // données corrompues : on repart de zéro
    }
  }
  return { lessons: {} };
}

export function saveProgress(progress: Progress): void {
  storage()?.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function markExerciseDone(progress: Progress, lessonId: string, totalExercises: number): Progress {
  const prev = progress.lessons[lessonId] ?? { completed: false, exercisesDone: 0 };
  const exercisesDone = Math.min(prev.exercisesDone + 1, totalExercises);
  const completed = exercisesDone >= totalExercises;
  const next: Progress = {
    lessons: {
      ...progress.lessons,
      [lessonId]: {
        completed,
        exercisesDone,
        completedAt: completed ? (prev.completedAt ?? new Date().toISOString()) : prev.completedAt,
      },
    },
  };
  saveProgress(next);
  return next;
}

export function resetProgress(): Progress {
  const empty: Progress = { lessons: {} };
  saveProgress(empty);
  return empty;
}
