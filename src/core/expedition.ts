/**
 * Progression des expéditions (problèmes multi-étapes à indices progressifs) :
 * l'ensemble des expéditions terminées, en localStorage.
 */

const STORAGE_KEY = 'learningapp.expeditions.v1';

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadExpeditionsDone(): Set<string> {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export function markExpeditionDone(id: string): Set<string> {
  const done = loadExpeditionsDone();
  done.add(id);
  storage()?.setItem(STORAGE_KEY, JSON.stringify([...done]));
  return done;
}
