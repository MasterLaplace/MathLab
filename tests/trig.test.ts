import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('valeurs exactes du cercle unité (trig-eval)', () => {
  it('sin(π) = 0 et cos(π) = −1', () => {
    expect(movesOf(['Sin', 'pi'], [], 'trig-eval')[0].result).toEqual(0);
    expect(movesOf(['Cos', 'pi'], [], 'trig-eval')[0].result).toEqual(-1);
  });

  it('sin(π/2) = 1 et cos(π/2) = 0', () => {
    const halfPi: Expr = ['Divide', 'pi', 2];
    expect(movesOf(['Sin', halfPi], [], 'trig-eval')[0].result).toEqual(1);
    expect(movesOf(['Cos', halfPi], [], 'trig-eval')[0].result).toEqual(0);
  });

  it('sin(π/6) = 1/2 et cos(π/3) = 1/2', () => {
    expect(movesOf(['Sin', ['Divide', 'pi', 6]], [], 'trig-eval')[0].result).toEqual([
      'Divide',
      1,
      2,
    ]);
    expect(movesOf(['Cos', ['Divide', 'pi', 3]], [], 'trig-eval')[0].result).toEqual([
      'Divide',
      1,
      2,
    ]);
  });

  it('sin(π/4) = √2/2', () => {
    expect(movesOf(['Sin', ['Divide', 'pi', 4]], [], 'trig-eval')[0].result).toEqual([
      'Divide',
      ['Sqrt', 2],
      2,
    ]);
  });

  it('cos(2π) = 1 : le tour complet', () => {
    expect(movesOf(['Cos', ['Multiply', 2, 'pi']], [], 'trig-eval')[0].result).toEqual(1);
  });

  it('sin(0) = 0, cos(0) = 1', () => {
    expect(movesOf(['Sin', 0], [], 'trig-eval')[0].result).toEqual(0);
    expect(movesOf(['Cos', 0], [], 'trig-eval')[0].result).toEqual(1);
  });

  it('aucune règle pour un angle quelconque', () => {
    expect(movesOf(['Sin', 'x'], [], 'trig-eval')).toHaveLength(0);
    expect(movesOf(['Cos', ['Divide', 'pi', 5]], [], 'trig-eval')).toHaveLength(0);
  });
});

describe('règle de la chaîne (derive-chain)', () => {
  it('D(sin(2x), x) → cos(2x)·D(2x, x)', () => {
    const m2x: Expr = ['Multiply', 2, 'x'];
    const [move] = movesOf(['D', ['Sin', m2x], 'x'], [], 'derive-chain');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Multiply', ['Cos', m2x], ['D', m2x, 'x']]);
  });

  it('D(e^{3x}, x) → e^{3x}·D(3x, x)', () => {
    const m3x: Expr = ['Multiply', 3, 'x'];
    const [move] = movesOf(['D', ['Exp', m3x], 'x'], [], 'derive-chain');
    expect(move.result).toEqual(['Multiply', ['Exp', m3x], ['D', m3x, 'x']]);
  });

  it('D(ln(2x), x) → D(2x, x)/2x', () => {
    const m2x: Expr = ['Multiply', 2, 'x'];
    const [move] = movesOf(['D', ['Ln', m2x], 'x'], [], 'derive-chain');
    expect(move.result).toEqual(['Divide', ['D', m2x, 'x'], m2x]);
  });

  it('D((x+1)², x) → 2·(x+1)·D(x+1, x)', () => {
    const u: Expr = ['Add', 'x', 1];
    const [move] = movesOf(['D', ['Power', u, 2], 'x'], [], 'derive-chain-power');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Multiply', 2, u, ['D', u, 'x']]);
  });

  it('pas de chaîne quand l’argument est x lui-même', () => {
    expect(movesOf(['D', ['Sin', 'x'], 'x'], [], 'derive-chain')).toHaveLength(0);
    expect(movesOf(['D', ['Power', 'x', 2], 'x'], [], 'derive-chain-power')).toHaveLength(0);
  });

  it('pas de chaîne quand l’intérieur est constant', () => {
    expect(movesOf(['D', ['Sin', ['Multiply', 2, 'a']], 'x'], [], 'derive-chain')).toHaveLength(0);
  });
});
