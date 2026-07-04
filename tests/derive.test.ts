import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';
import { reachesGoal } from '../src/core/engine';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('dérivation par gestes (derive-*)', () => {
  it('D(5, x) : la constante se dérive en 0', () => {
    const [move] = movesOf(['D', 5, 'x'], [], 'derive-const');
    expect(move).toBeDefined();
    expect(move.result).toEqual(0);
  });

  it('D(a, x) : un symbole étranger à x est une constante', () => {
    const [move] = movesOf(['D', 'a', 'x'], [], 'derive-const');
    expect(move.result).toEqual(0);
  });

  it('D(x, x) = 1', () => {
    const [move] = movesOf(['D', 'x', 'x'], [], 'derive-id');
    expect(move.result).toEqual(1);
  });

  it('D(x², x) = 2·x (la puissance descend)', () => {
    const [move] = movesOf(['D', ['Power', 'x', 2], 'x'], [], 'derive-power');
    expect(move.result).toEqual(['Multiply', 2, 'x']);
  });

  it('D(x³, x) = 3·x²', () => {
    const [move] = movesOf(['D', ['Power', 'x', 3], 'x'], [], 'derive-power');
    expect(move.result).toEqual(['Multiply', 3, ['Power', 'x', 2]]);
  });

  it('pas de règle de puissance si la base n’est pas la variable', () => {
    expect(movesOf(['D', ['Power', 'y', 2], 'x'], [], 'derive-power')).toHaveLength(0);
  });

  it('D(x² + 3x, x) se scinde en somme de dérivées', () => {
    const body: Expr = ['Add', ['Power', 'x', 2], ['Multiply', 3, 'x']];
    const [move] = movesOf(['D', body, 'x'], [], 'derive-sum');
    expect(move.result).toEqual([
      'Add',
      ['D', ['Power', 'x', 2], 'x'],
      ['D', ['Multiply', 3, 'x'], 'x'],
    ]);
  });

  it('D(3x, x) : la constante 3 sort de la dérivée', () => {
    const [move] = movesOf(['D', ['Multiply', 3, 'x'], 'x'], [], 'derive-const-factor');
    expect(move.result).toEqual(['Multiply', 3, ['D', 'x', 'x']]);
  });

  it('D(x·sin x, x) : règle du produit', () => {
    const body: Expr = ['Multiply', 'x', ['Sin', 'x']];
    const [move] = movesOf(['D', body, 'x'], [], 'derive-product');
    expect(move.result).toEqual([
      'Add',
      ['Multiply', ['D', 'x', 'x'], ['Sin', 'x']],
      ['Multiply', 'x', ['D', ['Sin', 'x'], 'x']],
    ]);
  });

  it('pas de règle produit quand un facteur est constant (c’est la sortie de constante)', () => {
    expect(movesOf(['D', ['Multiply', 3, 'x'], 'x'], [], 'derive-product')).toHaveLength(0);
  });

  it('fonctions célèbres : sin → cos, cos → −sin, exp → exp, ln → 1/x', () => {
    expect(movesOf(['D', ['Sin', 'x'], 'x'], [], 'derive-sin')[0].result).toEqual(['Cos', 'x']);
    expect(movesOf(['D', ['Cos', 'x'], 'x'], [], 'derive-cos')[0].result).toEqual([
      'Negate',
      ['Sin', 'x'],
    ]);
    expect(movesOf(['D', ['Exp', 'x'], 'x'], [], 'derive-exp')[0].result).toEqual(['Exp', 'x']);
    expect(movesOf(['D', ['Ln', 'x'], 'x'], [], 'derive-ln')[0].result).toEqual([
      'Divide',
      1,
      'x',
    ]);
  });

  it('pas de règle célèbre si l’argument n’est pas exactement la variable', () => {
    expect(movesOf(['D', ['Sin', ['Multiply', 2, 'x']], 'x'], [], 'derive-sin')).toHaveLength(0);
  });

  it('la sélection doit être le nœud D lui-même', () => {
    const expr: Expr = ['Equal', 'y', ['D', ['Power', 'x', 2], 'x']];
    expect(movesOf(expr, [2], 'derive-power')).toHaveLength(1);
    expect(movesOf(expr, [2, 1], 'derive-power')).toHaveLength(0);
  });
});

describe('reachesGoal en présence de D', () => {
  it('une dérivée non résolue n’atteint jamais le résultat (pas d’auto-résolution)', () => {
    expect(reachesGoal(['D', ['Power', 'x', 2], 'x'], ['Multiply', 2, 'x'])).toBe(false);
  });

  it('la forme résolue structurellement identique est acceptée', () => {
    expect(reachesGoal(['Multiply', 2, 'x'], ['Multiply', 2, 'x'])).toBe(true);
  });
});
