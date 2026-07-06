import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId: string) {
  return legalMoves(expr, from).filter((m) => m.ruleId === ruleId);
}

describe('théorie des nombres (batch 10)', () => {
  it('un pas d’Euclide : pgcd(48, 18) → pgcd(18, 12)', () => {
    const [move] = movesOf(['Gcd', 48, 18], [], 'gcd-step');
    expect(move.result).toEqual(['Gcd', 18, 12]);
  });

  it('quand le reste divise : pgcd(12, 6) → 6', () => {
    const [move] = movesOf(['Gcd', 12, 6], [], 'gcd-done');
    expect(move.result).toEqual(6);
  });

  it('lecture de l’horloge : 17 mod 12 → 5', () => {
    const [move] = movesOf(['Mod', 17, 12], [], 'mod-eval');
    expect(move.result).toEqual(5);
  });

  it('réduire en chemin : le 17 de 17·23 mod 12 devient 5', () => {
    const [move] = movesOf(['Mod', ['Multiply', 17, 23], 12], [1, 1], 'mod-reduce');
    expect(move.result).toEqual(['Mod', ['Multiply', 5, 23], 12]);
  });

  it('jamais dans un exposant : le 10 de 2^10 mod 11 ne se réduit pas', () => {
    expect(movesOf(['Mod', ['Power', 2, 10], 11], [1, 2], 'mod-reduce')).toHaveLength(0);
  });

  it('ni dans le modulus : le 12 de 17 mod 12 ne se réduit pas', () => {
    expect(movesOf(['Mod', 17, 12], [2], 'mod-reduce')).toHaveLength(0);
  });
});
