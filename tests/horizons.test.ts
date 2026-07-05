import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId: string) {
  return legalMoves(expr, from).filter((m) => m.ruleId === ruleId);
}

describe('règles du batch 6', () => {
  it('substitution linéaire : ∫cos(2x) → sin(2x)/2', () => {
    const m2x: Expr = ['Multiply', 2, 'x'];
    expect(movesOf(['Int', ['Cos', m2x], 'x'], [], 'int-linear')[0].result).toEqual([
      'Divide',
      ['Sin', m2x],
      2,
    ]);
  });

  it('ℒ{y″} = s²Y − s·y₀ − v₀', () => {
    const [move] = movesOf(['LT', ['D', ['D', 'y', 't'], 't']], [], 'lt-derive2');
    expect(move.result).toEqual([
      'Add',
      ['Multiply', ['Power', 's', 2], 'Y'],
      ['Negate', ['Multiply', 's', 'y₀']],
      ['Negate', 'v₀'],
    ]);
  });

  it('éléments simples : 1/((s+1)(s+2)) se scinde', () => {
    const den: Expr = ['Multiply', ['Add', 's', 1], ['Add', 's', 2]];
    const [move] = movesOf(['Divide', 1, den], [], 'partial-fractions');
    expect(move.result).toEqual([
      'Add',
      ['Divide', 1, ['Add', 's', 1]],
      ['Negate', ['Divide', 1, ['Add', 's', 2]]],
    ]);
  });

  it('ℒ⁻¹{s/(s²+4)} = cos 2t et ℒ⁻¹{2/(s²+4)} = sin 2t', () => {
    const den: Expr = ['Add', ['Power', 's', 2], 4];
    expect(movesOf(['ILT', ['Divide', 's', den]], [], 'ilt-cos')[0].result).toEqual(['Cos', ['Multiply', 2, 't']]);
    expect(movesOf(['ILT', ['Divide', 2, den]], [], 'ilt-sin')[0].result).toEqual(['Sin', ['Multiply', 2, 't']]);
  });

  it('ℒ⁻¹ d’un opposé : le − traverse', () => {
    const [move] = movesOf(['ILT', ['Negate', ['Divide', 1, ['Add', 's', 2]]]], [], 'ilt-neg');
    expect(move.result).toEqual(['Negate', ['ILT', ['Divide', 1, ['Add', 's', 2]]]]);
  });
});
