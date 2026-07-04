/**
 * Retours sonores synthétisés en WebAudio — aucun fichier audio à charger.
 * Le contexte est créé paresseusement (les navigateurs exigent un geste
 * utilisateur avant de produire du son, ce qui est toujours notre cas).
 */
import { loadSoundEnabled } from './prefs';

let ctx: AudioContext | null = null;
let enabled = loadSoundEnabled();

export function setSoundEnabled(on: boolean): void {
  enabled = on;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    if (!ctx) ctx = new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, duration: number, volume: number, type: OscillatorType = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ac.currentTime + start;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

/** Petit clic satisfaisant quand une manipulation est appliquée. */
export function playTick(): void {
  tone(880, 0, 0.08, 0.12);
  tone(1320, 0.01, 0.06, 0.05);
}

/** Carillon de réussite (accord majeur arpégé). */
export function playSuccess(): void {
  tone(523.25, 0, 0.35, 0.14); // do
  tone(659.25, 0.09, 0.35, 0.14); // mi
  tone(783.99, 0.18, 0.45, 0.14); // sol
  tone(1046.5, 0.27, 0.6, 0.1); // do aigu
}

/** Buzz très doux sur un geste illégal (jamais punitif). */
export function playNope(): void {
  tone(196, 0, 0.12, 0.08, 'triangle');
  tone(185, 0.1, 0.14, 0.06, 'triangle');
}
