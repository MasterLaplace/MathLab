import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('transformée de Laplace par gestes (lt-*)', () => {
  it('ℒ{1} = 1/s', () => {
    const [move] = movesOf(['LT', 1], [], 'lt-const');
    expect(move.result).toEqual(['Divide', 1, 's']);
  });

  it('ℒ{t} = 1/s²', () => {
    const [move] = movesOf(['LT', 't'], [], 'lt-t');
    expect(move.result).toEqual(['Divide', 1, ['Power', 's', 2]]);
  });

  it('ℒ{e^(−2t)} = 1/(s + 2)', () => {
    const [move] = movesOf(['LT', ['Exp', ['Multiply', -2, 't']]], [], 'lt-exp');
    expect(move.result).toEqual(['Divide', 1, ['Add', 's', 2]]);
  });

  it('ℒ{e^t} = 1/(s − 1)', () => {
    const [move] = movesOf(['LT', ['Exp', 't']], [], 'lt-exp');
    expect(move.result).toEqual(['Divide', 1, ['Add', 's', -1]]);
  });

  it('ℒ{sin 3t} = 3/(s² + 9)', () => {
    const [move] = movesOf(['LT', ['Sin', ['Multiply', 3, 't']]], [], 'lt-sin');
    expect(move.result).toEqual(['Divide', 3, ['Add', ['Power', 's', 2], 9]]);
  });

  it('ℒ{cos 2t} = s/(s² + 4)', () => {
    const [move] = movesOf(['LT', ['Cos', ['Multiply', 2, 't']]], [], 'lt-cos');
    expect(move.result).toEqual(['Divide', 's', ['Add', ['Power', 's', 2], 4]]);
  });

  it('linéarité : la somme se scinde, les constantes sortent', () => {
    const sum: Expr = ['LT', ['Add', 1, 't']];
    expect(movesOf(sum, [], 'lt-sum')[0].result).toEqual(['Add', ['LT', 1], ['LT', 't']]);
    const scaled: Expr = ['LT', ['Multiply', 3, ['Exp', ['Multiply', -2, 't']]]];
    expect(movesOf(scaled, [], 'lt-const-factor')[0].result).toEqual([
      'Multiply',
      3,
      ['LT', ['Exp', ['Multiply', -2, 't']]],
    ]);
  });
});

describe('transformée inverse (ilt-*)', () => {
  it('ℒ⁻¹{5/s} = 5', () => {
    const [move] = movesOf(['ILT', ['Divide', 5, 's']], [], 'ilt-const');
    expect(move.result).toEqual(5);
  });

  it('ℒ⁻¹{1/s²} = t', () => {
    const [move] = movesOf(['ILT', ['Divide', 1, ['Power', 's', 2]]], [], 'ilt-t');
    expect(move.result).toEqual('t');
  });

  it('ℒ⁻¹{1/(s + 2)} = e^(−2t) : le pôle devient le rythme', () => {
    const [move] = movesOf(['ILT', ['Divide', 1, ['Add', 's', 2]]], [], 'ilt-exp');
    expect(move.result).toEqual(['Exp', ['Multiply', -2, 't']]);
  });

  it('ℒ⁻¹{2/(s + 3)} = 2·e^(−3t)', () => {
    const [move] = movesOf(['ILT', ['Divide', 2, ['Add', 's', 3]]], [], 'ilt-exp');
    expect(move.result).toEqual(['Multiply', 2, ['Exp', ['Multiply', -3, 't']]]);
  });

  it('pas de règle exp si le dénominateur n’est pas s + a', () => {
    expect(movesOf(['ILT', ['Divide', 1, ['Add', 's', 't']]], [], 'ilt-exp')).toHaveLength(0);
  });

  it('linéarité : ℒ⁻¹ d’une somme se scinde', () => {
    const [move] = movesOf(
      ['ILT', ['Add', ['Divide', 1, 's'], ['Divide', 1, ['Add', 's', 2]]]],
      [],
      'ilt-sum',
    );
    expect(move.result).toEqual([
      'Add',
      ['ILT', ['Divide', 1, 's']],
      ['ILT', ['Divide', 1, ['Add', 's', 2]]],
    ]);
  });
});
