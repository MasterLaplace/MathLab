import { describe, expect, it } from 'vitest';
import { lessons } from '../src/content/lessons';
import { dailyChallenges } from '../src/core/quest';

describe('défi du jour (batch 11)', () => {
  it('même jour → même tirage (déterministe)', () => {
    const a = dailyChallenges(lessons, '2026-07-05');
    const b = dailyChallenges(lessons, '2026-07-05');
    expect(a.map((c) => c.exercise.id)).toEqual(b.map((c) => c.exercise.id));
  });

  it('jours différents → tirages différents', () => {
    const a = dailyChallenges(lessons, '2026-07-05');
    const b = dailyChallenges(lessons, '2026-07-06');
    expect(a.map((c) => c.exercise.id)).not.toEqual(b.map((c) => c.exercise.id));
  });

  it('5 exercices à objectif, de 5 phases différentes, triés par phase', () => {
    const picks = dailyChallenges(lessons, '2026-07-05');
    expect(picks).toHaveLength(5);
    for (const p of picks) {
      expect(p.exercise.goal).toBeDefined();
      expect(p.exercise.free).toBeFalsy();
    }
    const phases = picks.map((p) => p.lesson.phase);
    expect(new Set(phases).size).toBe(5);
    expect([...phases].sort((x, y) => x - y)).toEqual(phases);
  });
});
