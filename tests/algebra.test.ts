import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { evalNumeric } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('distribution (distribute)', () => {
  it('2(x + 3) se distribue en 2x + 2·3', () => {
    const e: Expr = ['Multiply', 2, ['Add', 'x', 3]];
    const [move] = movesOf(e, [], 'distribute');
    expect(move.kind).toBe('tap');
    expect(move.result).toEqual(['Add', ['Multiply', 2, 'x'], ['Multiply', 2, 3]]);
  });

  it('fonctionne dans une équation : 2(x+3) = 10', () => {
    const eq: Expr = ['Equal', ['Multiply', 2, ['Add', 'x', 3]], 10];
    const [move] = movesOf(eq, [1], 'distribute');
    expect(move.result).toEqual(['Equal', ['Add', ['Multiply', 2, 'x'], ['Multiply', 2, 3]], 10]);
  });

  it('pas de distribution sans somme dans le produit', () => {
    expect(movesOf(['Multiply', 2, 'x'], [], 'distribute')).toHaveLength(0);
  });
});

describe('factorisation (factor-common)', () => {
  it('2x + 2y : glisser 2x sur 2y donne 2(x + y)', () => {
    const e: Expr = ['Add', ['Multiply', 2, 'x'], ['Multiply', 2, 'y']];
    const [move] = movesOf(e, [1], 'factor-common');
    expect(move.to).toEqual([2]);
    expect(move.result).toEqual(['Multiply', 2, ['Add', 'x', 'y']]);
  });

  it('facteur symbolique : ax + ay → a(x + y)', () => {
    const e: Expr = ['Add', ['Multiply', 'a', 'x'], ['Multiply', 'a', 'y']];
    const [move] = movesOf(e, [1], 'factor-common');
    expect(move.result).toEqual(['Multiply', 'a', ['Add', 'x', 'y']]);
  });

  it('rien à factoriser entre 2x et 3y', () => {
    const e: Expr = ['Add', ['Multiply', 2, 'x'], ['Multiply', 3, 'y']];
    expect(movesOf(e, [1], 'factor-common')).toHaveLength(0);
  });
});

describe('addition de fractions (add-fractions)', () => {
  it('même dénominateur : x/5 + 2/5 → (x+2)/5', () => {
    const e: Expr = ['Add', ['Divide', 'x', 5], ['Divide', 2, 5]];
    const [move] = movesOf(e, [1], 'add-fractions');
    expect(move.result).toEqual(['Divide', ['Add', 'x', 2], 5]);
  });

  it('cas général : 1/2 + 1/3 → (1·3 + 1·2)/(2·3)', () => {
    const e: Expr = ['Add', ['Divide', 1, 2], ['Divide', 1, 3]];
    const [move] = movesOf(e, [1], 'add-fractions');
    expect(move.result).toEqual([
      'Divide',
      ['Add', ['Multiply', 1, 3], ['Multiply', 1, 2]],
      ['Multiply', 2, 3],
    ]);
  });
});

describe('racines n-ièmes et ± (undo-power)', () => {
  it('x³ = 8 : la racine cubique est proposée', () => {
    const eq: Expr = ['Equal', ['Power', 'x', 3], 8];
    const [move] = movesOf(eq, [1], 'undo-power');
    expect(move.result).toEqual(['Equal', 'x', ['Root', 8, 3]]);
  });

  it('puissance impaire : pas de variante ±', () => {
    const eq: Expr = ['Equal', ['Power', 'x', 3], 8];
    expect(movesOf(eq, [1], 'undo-power-pm')).toHaveLength(0);
  });

  it('x² = 9 : la variante ± existe', () => {
    const eq: Expr = ['Equal', ['Power', 'x', 2], 9];
    const [move] = movesOf(eq, [1], 'undo-power-pm');
    expect(move.result).toEqual(['Equal', 'x', ['PlusMinus', ['Sqrt', 9]]]);
  });
});

describe('log en base b (undo-exp-base)', () => {
  it('2ˣ = 8 : appuyer donne x = log₂(8)', () => {
    const eq: Expr = ['Equal', ['Power', 2, 'x'], 8];
    const [move] = movesOf(eq, [1], 'undo-exp-base');
    expect(move.result).toEqual(['Equal', 'x', ['Log', 8, 2]]);
  });

  it('pas de log si l’exposant est déjà un nombre', () => {
    const eq: Expr = ['Equal', ['Power', 2, 3], 8];
    expect(movesOf(eq, [1], 'undo-exp-base')).toHaveLength(0);
  });
});

describe('trigonométrie inverse (undo-trig)', () => {
  it('sin(x) = 0,5 : appuyer donne x = arcsin(0,5)', () => {
    const eq: Expr = ['Equal', ['Sin', 'x'], 0.5];
    const [move] = movesOf(eq, [1], 'undo-trig');
    expect(move.result).toEqual(['Equal', 'x', ['Arcsin', 0.5]]);
  });

  it('cos et tan aussi', () => {
    expect(movesOf(['Equal', ['Cos', 'x'], 0.5], [1], 'undo-trig')[0].result).toEqual([
      'Equal', 'x', ['Arccos', 0.5],
    ]);
    expect(movesOf(['Equal', ['Tan', 'x'], 1], [1], 'undo-trig')[0].result).toEqual([
      'Equal', 'x', ['Arctan', 1],
    ]);
  });
});

describe('evalNumeric étendu', () => {
  it('Root, trig et réciproques', () => {
    expect(evalNumeric(['Root', 8, 3])).toBe(2);
    expect(evalNumeric(['Root', -8, 3])).toBe(-2);
    expect(evalNumeric(['Root', -4, 2])).toBeUndefined();
    expect(evalNumeric(['Sin', 0])).toBe(0);
    expect(evalNumeric(['Arcsin', 2])).toBeUndefined();
    expect(evalNumeric(['Arctan', 1])).toBeCloseTo(Math.PI / 4);
    expect(evalNumeric(['PlusMinus', 3])).toBeUndefined();
  });

  it('Log base 2 propre : log₂(8) = 3 est proposé au calcul', () => {
    const eq: Expr = ['Equal', 'x', ['Log', 8, 2]];
    const [move] = movesOf(eq, [2], 'compute');
    expect(move.result).toEqual(['Equal', 'x', 3]);
  });
});
