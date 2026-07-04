import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { sameExprUpToOrder } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';
import { reachesGoal } from '../src/core/engine';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('le nombre i (i-power)', () => {
  it('i² = −1', () => {
    const [move] = movesOf(['Power', 'i', 2], [], 'i-power');
    expect(move).toBeDefined();
    expect(move.result).toEqual(-1);
  });

  it('i³ = −i', () => {
    const [move] = movesOf(['Power', 'i', 3], [], 'i-power');
    expect(move.result).toEqual(['Negate', 'i']);
  });

  it('i⁴ = 1 et i⁵ = i : le cycle', () => {
    expect(movesOf(['Power', 'i', 4], [], 'i-power')[0].result).toEqual(1);
    expect(movesOf(['Power', 'i', 5], [], 'i-power')[0].result).toEqual('i');
  });

  it('pas de règle sur x² ni sur i^x', () => {
    expect(movesOf(['Power', 'x', 2], [], 'i-power')).toHaveLength(0);
    expect(movesOf(['Power', 'i', 'x'], [], 'i-power')).toHaveLength(0);
  });
});

describe('formule d’Euler (euler-expand / euler-fold)', () => {
  it('e^{iθ} se déplie en cos θ + i·sin θ', () => {
    const [move] = movesOf(['Exp', ['Multiply', 'i', 'theta']], [], 'euler-expand');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Add', ['Cos', 'theta'], ['Multiply', 'i', ['Sin', 'theta']]]);
  });

  it('e^{2it} : l’angle emporte les autres facteurs', () => {
    const [move] = movesOf(['Exp', ['Multiply', 2, 'i', 't']], [], 'euler-expand');
    const m2t: Expr = ['Multiply', 2, 't'];
    expect(move.result).toEqual(['Add', ['Cos', m2t], ['Multiply', 'i', ['Sin', m2t]]]);
  });

  it('pas d’Euler sur e^x (aucun facteur i)', () => {
    expect(movesOf(['Exp', 'x'], [], 'euler-expand')).toHaveLength(0);
    expect(movesOf(['Exp', ['Multiply', 2, 'x']], [], 'euler-expand')).toHaveLength(0);
  });

  it('cos θ + i·sin θ se replie en e^{iθ}', () => {
    const expr: Expr = ['Add', ['Cos', 'theta'], ['Multiply', 'i', ['Sin', 'theta']]];
    const [move] = movesOf(expr, [], 'euler-fold');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Exp', ['Multiply', 'i', 'theta']]);
  });

  it('le repli accepte les termes dans l’autre ordre', () => {
    const expr: Expr = ['Add', ['Multiply', 'i', ['Sin', 'pi']], ['Cos', 'pi']];
    const [move] = movesOf(expr, [], 'euler-fold');
    expect(move).toBeDefined();
  });

  it('pas de repli si les angles diffèrent', () => {
    const expr: Expr = ['Add', ['Cos', 'theta'], ['Multiply', 'i', ['Sin', 'pi']]];
    expect(movesOf(expr, [], 'euler-fold')).toHaveLength(0);
  });
});

describe('règles d’algèbre du batch (mult-zero, combine-factors)', () => {
  it('i·0 : taper le 0 effondre le produit', () => {
    const [move] = movesOf(['Multiply', 'i', 0], [2], 'mult-zero');
    expect(move).toBeDefined();
    expect(move.result).toEqual(0);
  });

  it('−1 + i·0 : l’effondrement est local', () => {
    const expr: Expr = ['Add', -1, ['Multiply', 'i', 0]];
    const [move] = movesOf(expr, [2, 2], 'mult-zero');
    expect(move.result).toEqual(['Add', -1, 0]);
  });

  it('x·x → x² (glisser un facteur sur son jumeau)', () => {
    const [move] = movesOf(['Multiply', 'x', 'x'], [1], 'combine-factors');
    expect(move).toBeDefined();
    expect(move.result).toEqual(['Power', 'x', 2]);
  });

  it('x²·x³ → x⁵ (les exposants s’additionnent)', () => {
    const expr: Expr = ['Multiply', ['Power', 'x', 2], ['Power', 'x', 3]];
    const [move] = movesOf(expr, [1], 'combine-factors');
    expect(move.result).toEqual(['Power', 'x', 5]);
  });

  it('2·i·3·i : les deux i se regroupent, pas les nombres', () => {
    const expr: Expr = ['Multiply', 2, 'i', 3, 'i'];
    const [move] = movesOf(expr, [2], 'combine-factors');
    expect(move.result).toEqual(['Multiply', 2, 3, ['Power', 'i', 2]]);
    expect(movesOf(expr, [1], 'combine-factors')).toHaveLength(0);
  });
});

describe('égalité structurelle à commutativité près', () => {
  it('3 + 3i ≡ 3i + 3', () => {
    const a: Expr = ['Add', 3, ['Multiply', 3, 'i']];
    const b: Expr = ['Add', ['Multiply', 3, 'i'], 3];
    expect(sameExprUpToOrder(a, b)).toBe(true);
    expect(reachesGoal(a, b, true)).toBe(true);
  });

  it('l’ordre compte toujours pour Divide et Power', () => {
    expect(sameExprUpToOrder(['Divide', 1, 2], ['Divide', 2, 1])).toBe(false);
    expect(sameExprUpToOrder(['Power', 2, 3], ['Power', 3, 2])).toBe(false);
  });

  it('multiset strict : x + x + y ≢ x + y + y', () => {
    expect(
      sameExprUpToOrder(['Add', 'x', 'x', 'y'], ['Add', 'x', 'y', 'y']),
    ).toBe(false);
  });

  it('reachesGoal strict reste opaque au CAS : i² ≠ −1 sans le geste', () => {
    expect(reachesGoal(['Power', 'i', 2], -1, true)).toBe(false);
  });
});
