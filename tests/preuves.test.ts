import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { reachesGoal } from '../src/core/engine';
import { legalMoves } from '../src/core/rules';

const moves = (expr: Expr, from: number[], ruleId: string) =>
  legalMoves(expr, from).filter((m) => m.ruleId === ruleId);

describe('l’art de la preuve : substitution (batch 16)', () => {
  it('instancie une variable par un nombre (cas de base)', () => {
    const ms = moves(['Subst', ['Power', 'n', 2], 'n', 1], [], 'subst');
    expect(ms).toHaveLength(1);
    expect(ms[0].result).toEqual(['Power', 1, 2]);
  });

  it('remplace toutes les occurrences de la variable', () => {
    const ms = moves(['Subst', ['Add', 'n', ['Multiply', 'n', 'n']], 'n', 3], [], 'subst');
    expect(ms[0].result).toEqual(['Add', 3, ['Multiply', 3, 3]]);
  });

  it('injecte une expression composée (hérédité : k → k+1)', () => {
    const ms = moves(['Subst', ['Power', 'n', 2], 'n', ['Add', 'k', 1]], [], 'subst');
    expect(ms[0].result).toEqual(['Power', ['Add', 'k', 1], 2]);
  });

  it('injecte l’hypothèse de récurrence (S → k²)', () => {
    const start: Expr = ['Subst', ['Add', 'S', ['Add', ['Multiply', 2, 'k'], 1]], 'S', ['Power', 'k', 2]];
    const ms = moves(start, [], 'subst');
    expect(ms[0].result).toEqual(['Add', ['Power', 'k', 2], ['Add', ['Multiply', 2, 'k'], 1]]);
  });

  it('Subst est une tête opaque : pas d’auto-résolution avant le geste', () => {
    // Tant que Subst enveloppe l'expression, le but ne peut pas être atteint.
    expect(reachesGoal(['Subst', ['Power', 'a', 2], 'a', ['Multiply', 2, 'c']], ['Power', ['Multiply', 2, 'c'], 2])).toBe(false);
    // Une fois substitué, la forme brute correspond structurellement au but.
    expect(reachesGoal(['Power', ['Multiply', 2, 'c'], 2], ['Power', ['Multiply', 2, 'c'], 2])).toBe(true);
  });
});
