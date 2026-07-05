import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('intégration par parties (int-parts)', () => {
  it('∫x·cos x → x·sin x − ∫D(x)·sin x', () => {
    const [move] = movesOf(['Int', ['Multiply', 'x', ['Cos', 'x']], 'x'], [], 'int-parts');
    expect(move).toBeDefined();
    expect(move.result).toEqual([
      'Add',
      ['Multiply', 'x', ['Sin', 'x']],
      ['Negate', ['Int', ['Multiply', ['D', 'x', 'x'], ['Sin', 'x']], 'x']],
    ]);
  });

  it('∫x·sin x → −x·cos x + ∫D(x)·cos x (les signes)', () => {
    const [move] = movesOf(['Int', ['Multiply', 'x', ['Sin', 'x']], 'x'], [], 'int-parts');
    expect(move.result).toEqual([
      'Add',
      ['Negate', ['Multiply', 'x', ['Cos', 'x']]],
      ['Int', ['Multiply', ['D', 'x', 'x'], ['Cos', 'x']], 'x'],
    ]);
  });

  it('∫x·eˣ → x·eˣ − ∫D(x)·eˣ', () => {
    const [move] = movesOf(['Int', ['Multiply', 'x', ['Exp', 'x']], 'x'], [], 'int-parts');
    expect(move.result).toEqual([
      'Add',
      ['Multiply', 'x', ['Exp', 'x']],
      ['Negate', ['Int', ['Multiply', ['D', 'x', 'x'], ['Exp', 'x']], 'x']],
    ]);
  });

  it('l’ordre des facteurs ne compte pas : ∫cos x·x marche aussi', () => {
    const moves = movesOf(['Int', ['Multiply', ['Cos', 'x'], 'x'], 'x'], [], 'int-parts');
    expect(moves.length).toBeGreaterThan(0);
  });

  it('pas de parties sur ∫2·cos x (le facteur constant sort, lui)', () => {
    expect(movesOf(['Int', ['Multiply', 2, ['Cos', 'x']], 'x'], [], 'int-parts')).toHaveLength(0);
  });
});

describe('deux moins font un plus (neg-neg)', () => {
  it('−(−cos x) → cos x', () => {
    const [move] = movesOf(['Negate', ['Negate', ['Cos', 'x']]], [], 'neg-neg');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Cos', 'x']);
  });

  it('pas de règle sur un simple −x', () => {
    expect(movesOf(['Negate', 'x'], [], 'neg-neg')).toHaveLength(0);
  });
});

describe('ℒ{y} et ℒ{y′} (lt-y, lt-derive)', () => {
  it('ℒ{y} = Y', () => {
    const [move] = movesOf(['LT', 'y'], [], 'lt-y');
    expect(move).toBeDefined();
    expect(move.result).toEqual('Y');
  });

  it('ℒ{y′} = s·Y − y₀', () => {
    const [move] = movesOf(['LT', ['D', 'y', 't']], [], 'lt-derive');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Add', ['Multiply', 's', 'Y'], ['Negate', 'y₀']]);
  });

  it('y n’est pas une constante : ℒ{−2y} sort le −2, pas de c/s', () => {
    const expr: Expr = ['LT', ['Multiply', -2, 'y']];
    expect(movesOf(expr, [], 'lt-const')).toHaveLength(0);
    const [move] = movesOf(expr, [], 'lt-const-factor');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Multiply', -2, ['LT', 'y']]);
  });

  it('ℒ⁻¹ accepte un numérateur symbolique : y₀/(s+2) → y₀·e^(−2t)', () => {
    const [move] = movesOf(['ILT', ['Divide', 'y₀', ['Add', 's', 2]]], [], 'ilt-exp');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Multiply', 'y₀', ['Exp', ['Multiply', -2, 't']]]);
  });
});

describe('la puissance multiplie l’angle (exp-power)', () => {
  it('(e^{iπ/2})² → e^{iπ}', () => {
    const start: Expr = ['Power', ['Exp', ['Multiply', 'i', ['Divide', 'pi', 2]]], 2];
    const [move] = movesOf(start, [], 'exp-power');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Exp', ['Multiply', 'i', 'pi']]);
  });

  it('(e^{2πi/3})³ → e^{2πi} : le dénominateur se replie', () => {
    const start: Expr = ['Power', ['Exp', ['Multiply', 'i', ['Divide', ['Multiply', 2, 'pi'], 3]]], 3];
    const [move] = movesOf(start, [], 'exp-power');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Exp', ['Multiply', 'i', 2, 'pi']]);
  });

  it('(e^{iθ})³ → e^{3iθ} quand rien ne se replie', () => {
    const [move] = movesOf(['Power', ['Exp', ['Multiply', 'i', 'theta']], 3], [], 'exp-power');
    expect(move.result).toEqual(['Exp', ['Multiply', 3, 'i', 'theta']]);
  });

  it('pas de règle sur x² ni sur un exposant symbolique', () => {
    expect(movesOf(['Power', 'x', 2], [], 'exp-power')).toHaveLength(0);
    expect(movesOf(['Power', ['Exp', 'x'], 'n'], [], 'exp-power')).toHaveLength(0);
  });
});

describe('multiplier des fractions (mul-fractions)', () => {
  it('(1/2)·(1/3) → (1·1)/(2·3)', () => {
    const expr: Expr = ['Multiply', ['Divide', 1, 2], ['Divide', 1, 3]];
    const [move] = movesOf(expr, [1], 'mul-fractions');
    expect(move).toBeDefined();
    expect(move.kind).toBe('drag');
    // Le résultat est une fraction unique dont haut et bas sont des produits
    // (éventuellement déjà repliés par normalize).
    const r = move.result as Expr[];
    expect(r[0]).toBe('Divide');
  });

  it('pas de fusion si l’autre facteur n’est pas une fraction', () => {
    expect(movesOf(['Multiply', ['Divide', 1, 2], 'x'], [1], 'mul-fractions')).toHaveLength(0);
  });
});
