import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';
import { reachesGoal } from '../src/core/engine';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('intégration par gestes (int-*)', () => {
  it('∫ 3 dx = 3·x', () => {
    const [move] = movesOf(['Int', 3, 'x'], [], 'int-const');
    expect(move.result).toEqual(['Multiply', 3, 'x']);
  });

  it('∫ 1 dx = x (sans ×1 superflu)', () => {
    const [move] = movesOf(['Int', 1, 'x'], [], 'int-const');
    expect(move.result).toEqual('x');
  });

  it('∫ x dx = x²/2', () => {
    const [move] = movesOf(['Int', 'x', 'x'], [], 'int-id');
    expect(move.result).toEqual(['Divide', ['Power', 'x', 2], 2]);
  });

  it('∫ x² dx = x³/3 (la puissance remonte)', () => {
    const [move] = movesOf(['Int', ['Power', 'x', 2], 'x'], [], 'int-power');
    expect(move.result).toEqual(['Divide', ['Power', 'x', 3], 3]);
  });

  it('pas de règle de puissance pour n = −1 (c’est le ln)', () => {
    expect(movesOf(['Int', ['Power', 'x', -1], 'x'], [], 'int-power')).toHaveLength(0);
  });

  it('∫ (x² + 1) dx se scinde', () => {
    const [move] = movesOf(['Int', ['Add', ['Power', 'x', 2], 1], 'x'], [], 'int-sum');
    expect(move.result).toEqual(['Add', ['Int', ['Power', 'x', 2], 'x'], ['Int', 1, 'x']]);
  });

  it('∫ 5·x dx : la constante sort', () => {
    const [move] = movesOf(['Int', ['Multiply', 5, 'x'], 'x'], [], 'int-const-factor');
    expect(move.result).toEqual(['Multiply', 5, ['Int', 'x', 'x']]);
  });

  it('fonctions célèbres : sin → −cos, cos → sin, exp → exp, 1/x → ln', () => {
    expect(movesOf(['Int', ['Sin', 'x'], 'x'], [], 'int-sin')[0].result).toEqual([
      'Negate',
      ['Cos', 'x'],
    ]);
    expect(movesOf(['Int', ['Cos', 'x'], 'x'], [], 'int-cos')[0].result).toEqual(['Sin', 'x']);
    expect(movesOf(['Int', ['Exp', 'x'], 'x'], [], 'int-exp')[0].result).toEqual(['Exp', 'x']);
    expect(movesOf(['Int', ['Divide', 1, 'x'], 'x'], [], 'int-recip')[0].result).toEqual([
      'Ln',
      'x',
    ]);
  });

  it('théorème fondamental : D(∫f) → f', () => {
    const [move] = movesOf(['D', ['Int', ['Sin', 'x'], 'x'], 'x'], [], 'ftc-derive');
    expect(move.result).toEqual(['Sin', 'x']);
  });

  it('théorème fondamental : ∫(f′) → f', () => {
    const [move] = movesOf(['Int', ['D', ['Power', 'x', 2], 'x'], 'x'], [], 'ftc-int');
    expect(move.result).toEqual(['Power', 'x', 2]);
  });

  it('pas de FTC si les variables diffèrent', () => {
    expect(movesOf(['D', ['Int', ['Sin', 'x'], 'x'], 't'], [], 'ftc-derive')).toHaveLength(0);
  });

  it('une intégrale non résolue n’atteint pas le but (tête opaque)', () => {
    expect(reachesGoal(['Int', 'x', 'x'], ['Divide', ['Power', 'x', 2], 2])).toBe(false);
  });
});
