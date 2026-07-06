import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { reachesGoal } from '../src/core/engine';
import { legalMoves } from '../src/core/rules';

const moves = (expr: Expr, from: number[], ruleId: string) =>
  legalMoves(expr, from).filter((m) => m.ruleId === ruleId);

describe('groupe D₄ (batch 12)', () => {
  it('r ∘ r = r² en un tap', () => {
    const ms = moves(['Compose', 'r90', 'r90'], [], 'sym-compose');
    expect(ms).toHaveLength(1);
    expect(ms[0].result).toBe('r180');
  });

  it('non-commutativité : r∘h = d mais h∘r = d′', () => {
    expect(moves(['Compose', 'r90', 'sH'], [], 'sym-compose')[0].result).toBe('sD');
    expect(moves(['Compose', 'sH', 'r90'], [], 'sym-compose')[0].result).toBe('sA');
  });

  it('composition n-aire : la paire la plus à droite se réduit d’abord', () => {
    const ms = moves(['Compose', 'sH', 'sV', 'r180'], [], 'sym-compose');
    // v ∘ r² = h : il reste h ∘ h.
    expect(ms[0].result).toEqual(['Compose', 'sH', 'sH']);
  });

  it('inverses : r⁻¹ = r³, un miroir est son propre inverse', () => {
    expect(moves(['Inv', 'r90'], [], 'inv-eval')[0].result).toBe('r270');
    expect(moves(['Inv', 'sD'], [], 'inv-eval')[0].result).toBe('sD');
  });

  it('chaussettes-chaussures : (a∘b)⁻¹ = b⁻¹∘a⁻¹', () => {
    const ms = moves(['Inv', ['Compose', 'r90', 'sH']], [], 'inv-compose');
    expect(ms[0].result).toEqual(['Compose', ['Inv', 'sH'], ['Inv', 'r90']]);
  });

  it('le CAS ne résout jamais une composition à la place de l’élève', () => {
    // r∘r vaut r² sémantiquement, mais seule l'égalité structurelle compte.
    expect(reachesGoal(['Compose', 'r90', 'r90'], 'r180', true)).toBe(false);
    expect(reachesGoal('r180', 'r180', true)).toBe(true);
  });
});

describe('φ d’Euler et arithmétique complexe (batches 13–14)', () => {
  it('φ(7) se déplie en 7 − 1 (premier)', () => {
    expect(moves(['Phi', 7], [], 'phi-prime')[0].result).toEqual(['Add', 7, -1]);
  });

  it('φ(9) se déplie en 9 − 3 (puissance de premier)', () => {
    expect(moves(['Phi', 9], [], 'phi-power')[0].result).toEqual(['Add', 9, -3]);
  });

  it('φ(12) se factorise en φ(4)·φ(3) (multiplicativité)', () => {
    expect(moves(['Phi', 12], [], 'phi-split')[0].result).toEqual([
      'Multiply',
      ['Phi', 4],
      ['Phi', 3],
    ]);
  });

  it('deux nombres d’un produit mixte se multiplient par drag', () => {
    const ms = moves(['Multiply', 3, 'i', 4], [1], 'combine-numbers');
    expect(ms).toHaveLength(1);
    expect(ms[0].result).toEqual(['Multiply', 'i', 12]);
  });

  it('le signe moins sort d’un produit : i·(−i) → −(i·i)', () => {
    const ms = moves(['Multiply', 'i', ['Negate', 'i']], [2], 'negate-out');
    expect(ms[0].result).toEqual(['Negate', ['Multiply', 'i', 'i']]);
  });

  it('le conjugué se déplie sur une somme puis change i en −i', () => {
    const sum = moves(['Conj', ['Add', 3, 'i']], [], 'conj-add');
    expect(sum[0].result).toEqual(['Add', ['Conj', 3], ['Conj', 'i']]);
    expect(moves(['Conj', 'i'], [], 'conj-i')[0].result).toEqual(['Negate', 'i']);
    expect(moves(['Conj', 3], [], 'conj-real')[0].result).toBe(3);
  });
});
