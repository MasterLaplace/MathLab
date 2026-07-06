import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';
import { reachesGoal } from '../src/core/engine';

function movesOf(expr: Expr, from: number[], ruleId: string) {
  return legalMoves(expr, from).filter((m) => m.ruleId === ruleId);
}

const R90: Expr = ['Mat2', 0, -1, 1, 0];

describe('matrices dans l’AST (batch 9)', () => {
  it('Av : ligne × colonne, posé puis calculable', () => {
    const [move] = movesOf(['MatVec', ['Mat2', 2, 0, 0, 3], ['Vec2', 1, 1]], [], 'mat-vec');
    expect(move.result).toEqual([
      'Vec2',
      ['Add', ['Multiply', 2, 1], ['Multiply', 0, 1]],
      ['Add', ['Multiply', 0, 1], ['Multiply', 3, 1]],
    ]);
  });

  it('un coefficient négatif s’écrit − (0,75·x), pas + (−0,75)·x', () => {
    const [move] = movesOf(['MatVec', R90, ['Vec2', 1, 0]], [], 'mat-vec');
    expect(move.result).toEqual([
      'Vec2',
      ['Add', ['Multiply', 0, 1], ['Negate', ['Multiply', 1, 0]]],
      ['Add', ['Multiply', 1, 1], ['Multiply', 0, 0]],
    ]);
  });

  it('Iv = v en un tap (identité)', () => {
    const [move] = movesOf(['MatVec', ['Mat2', 1, 0, 0, 1], ['Vec2', 5, 7]], [], 'mat-identity');
    expect(move.result).toEqual(['Vec2', 5, 7]);
  });

  it('AB : composition, 4 entrées ligne × colonne', () => {
    const [move] = movesOf(['MatMul', R90, R90], [], 'mat-mul');
    expect(move.result).toEqual([
      'Mat2',
      ['Add', ['Multiply', 0, 0], ['Negate', ['Multiply', 1, 1]]],
      ['Add', ['Multiply', 0, -1], ['Negate', ['Multiply', 1, 0]]],
      ['Add', ['Multiply', 1, 0], ['Multiply', 0, 1]],
      ['Add', ['Multiply', 1, -1], ['Multiply', 0, 0]],
    ]);
  });

  it('det se déplie en ad − bc', () => {
    const [move] = movesOf(['Det', ['Mat2', 3, 1, 1, 2]], [], 'det-expand');
    expect(move.result).toEqual([
      'Add',
      ['Multiply', 3, 2],
      ['Negate', ['Multiply', 1, 1]],
    ]);
  });

  it('λv numérique se calcule d’un coup', () => {
    const [move] = movesOf(['VecScale', 3, ['Vec2', 1, -1]], [], 'vec-scale');
    expect(move.result).toEqual(['Vec2', 3, -3]);
  });

  it('les têtes matricielles sont opaques pour le CAS mais structurellement comparables', () => {
    expect(reachesGoal(['Vec2', 3, 3], ['Vec2', 3, 3], true)).toBe(true);
    // Le CAS ne doit pas « résoudre » Av à la place de l'élève.
    expect(
      reachesGoal(['MatVec', ['Mat2', 2, 0, 0, 3], ['Vec2', 1, 1]], ['Vec2', 2, 3]),
    ).toBe(false);
  });
});
