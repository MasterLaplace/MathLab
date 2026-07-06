import type { Exercise, Lesson } from '../content/schema';

/**
 * Le mode « Défi du jour » (station Z) : chaque jour, une sélection
 * déterministe d'exercices piochés dans TOUT le parcours — la révision
 * espacée à l'échelle du curriculum entier. Mode examen : pas d'indices.
 */

export interface DailyChallenge {
  lesson: Lesson;
  exercise: Exercise;
}

export interface QuestState {
  /** Dernier jour entièrement réussi (clé AAAA-MM-JJ). */
  lastDate?: string;
  /** Jours consécutifs réussis. */
  streak: number;
  /** Record de série. */
  best: number;
  /** Nombre total de défis réussis. */
  totalDone: number;
}

const STORAGE_KEY = 'learningapp.quest.v1';

/** Clé du jour local, AAAA-MM-JJ. */
export function todayKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** PRNG déterministe (mulberry32) semé par une chaîne. */
function seededRandom(seed: string): () => number {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Le tirage du jour : `count` exercices à objectif, tous de leçons
 * différentes, et de phases différentes tant que possible — pour balayer
 * le parcours du début à la fin. Déterministe : même jour, même défi.
 */
export function dailyChallenges(lessons: Lesson[], dateKey: string, count = 5): DailyChallenge[] {
  const rand = seededRandom(dateKey);
  const pool = lessons
    .map((lesson) => ({
      lesson,
      exercises: lesson.exercises.filter((e) => e.goal !== undefined && !e.free),
    }))
    .filter((c) => c.exercises.length > 0);
  // Mélange de Fisher-Yates semé.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const picked: DailyChallenge[] = [];
  const usedPhases = new Set<number>();
  // 1ᵉʳ passage : une leçon par phase (couvrir large).
  for (const c of pool) {
    if (picked.length >= count) break;
    if (usedPhases.has(c.lesson.phase)) continue;
    usedPhases.add(c.lesson.phase);
    picked.push({ lesson: c.lesson, exercise: c.exercises[Math.floor(rand() * c.exercises.length)] });
  }
  // 2ᵉ passage si le parcours a moins de phases que `count`.
  for (const c of pool) {
    if (picked.length >= count) break;
    if (picked.some((p) => p.lesson.id === c.lesson.id)) continue;
    picked.push({ lesson: c.lesson, exercise: c.exercises[Math.floor(rand() * c.exercises.length)] });
  }
  // Du plus ancien au plus récent : on remonte le parcours.
  picked.sort((a, b) => a.lesson.phase - b.lesson.phase);
  return picked;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadQuest(): QuestState {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as QuestState;
      if (parsed && typeof parsed.streak === 'number') return parsed;
    } catch {
      // données corrompues : on repart de zéro
    }
  }
  return { streak: 0, best: 0, totalDone: 0 };
}

/** La veille d'une clé AAAA-MM-JJ. */
function previousDay(dateKey: string): string {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

/** Enregistre un défi du jour entièrement réussi ; renvoie l'état à jour. */
export function recordQuestDone(dateKey: string): QuestState {
  const state = loadQuest();
  if (state.lastDate === dateKey) return state; // déjà compté aujourd'hui
  const streak = state.lastDate === previousDay(dateKey) ? state.streak + 1 : 1;
  const next: QuestState = {
    lastDate: dateKey,
    streak,
    best: Math.max(state.best, streak),
    totalDone: state.totalDone + 1,
  };
  storage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function isQuestDone(dateKey: string): boolean {
  return loadQuest().lastDate === dateKey;
}
