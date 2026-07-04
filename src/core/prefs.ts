/** Préférences d'interface (thème, son), persistées en localStorage. */

export type Theme = 'dark' | 'light';

const THEME_KEY = 'learningapp.theme';
const SOUND_KEY = 'learningapp.sound';

function storage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function loadTheme(): Theme {
  const saved = storage()?.getItem(THEME_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function saveTheme(theme: Theme): void {
  storage()?.setItem(THEME_KEY, theme);
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
}

export function loadSoundEnabled(): boolean {
  return storage()?.getItem(SOUND_KEY) !== 'off';
}

export function saveSoundEnabled(enabled: boolean): void {
  storage()?.setItem(SOUND_KEY, enabled ? 'on' : 'off');
}
