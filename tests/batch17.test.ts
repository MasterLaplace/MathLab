import { describe, expect, it } from 'vitest';
import { type Expr, normalize } from '../src/core/ast';
import { reachesGoal } from '../src/core/engine';
import { legalMoves } from '../src/core/rules';

const moves = (expr: Expr, from: number[], ruleId: string) =>
  legalMoves(normalize(expr), from).filter((m) => m.ruleId === ruleId);
const result = (expr: Expr, from: number[], ruleId: string) => {
  const ms = moves(expr, from, ruleId);
  expect(ms).toHaveLength(1);
  return normalize(ms[0].result);
};

describe('second degré : identités remarquables (batch 17)', () => {
  it('(a + b)² se déplie avec le double produit, nombres en tête', () => {
    expect(result(['Power', ['Add', 'x', 3], 2], [], 'expand-square')).toEqual([
      'Add', ['Power', 'x', 2], ['Multiply', 2, 3, 'x'], ['Power', 3, 2],
    ]);
  });
  it('(a − b)² : le double produit hérite du signe', () => {
    expect(result(['Power', ['Add', 'x', -3], 2], [], 'expand-square')).toEqual([
      'Add', ['Power', 'x', 2], ['Negate', ['Multiply', 2, 3, 'x']], ['Power', 3, 2],
    ]);
  });
  it('pas de dépliage pour un cube ni pour une somme de trois termes', () => {
    expect(moves(['Power', ['Add', 'x', 3], 3], [], 'expand-square')).toHaveLength(0);
    expect(moves(['Power', ['Add', 'x', 'y', 1], 2], [], 'expand-square')).toHaveLength(0);
  });
  it('reconnaît un carré parfait, avec + ou −', () => {
    expect(result(['Add', ['Power', 'x', 2], ['Multiply', 6, 'x'], 9], [], 'factor-square')).toEqual(['Power', ['Add', 'x', 3], 2]);
    expect(result(['Add', ['Power', 'x', 2], ['Negate', ['Multiply', 10, 'x']], 25], [], 'factor-square')).toEqual(['Power', ['Add', 'x', -5], 2]);
  });
  it('refuse un faux carré parfait (double produit erroné)', () => {
    expect(moves(['Add', ['Power', 'x', 2], ['Multiply', 5, 'x'], 9], [], 'factor-square')).toHaveLength(0);
    expect(moves(['Add', ['Power', 'x', 2], ['Multiply', 6, 'x'], 8], [], 'factor-square')).toHaveLength(0);
  });
  it('(a + b)(a − b) ⇄ a² − b²', () => {
    expect(result(['Multiply', ['Add', 'x', 2], ['Add', 'x', -2]], [], 'diff-squares')).toEqual(['Add', ['Power', 'x', 2], ['Negate', ['Power', 2, 2]]]);
    expect(result(['Add', ['Power', 'x', 2], -9], [], 'factor-diff-squares')).toEqual(['Multiply', ['Add', 'x', 3], ['Add', 'x', -3]]);
    // (x + 2)(x + 2) n'est pas une différence de carrés.
    expect(moves(['Multiply', ['Add', 'x', 2], ['Add', 'x', 2]], [], 'diff-squares')).toHaveLength(0);
    // x² + 9 non plus.
    expect(moves(['Add', ['Power', 'x', 2], 9], [], 'factor-diff-squares')).toHaveLength(0);
  });
  it('compléter le carré : x² + 6x → (x + 3)² − 3²', () => {
    const eq: Expr = ['Equal', ['Add', ['Power', 'x', 2], ['Multiply', 6, 'x'], 5], 0];
    expect(result(eq, [1, 1], 'complete-square')).toEqual([
      'Equal', ['Add', ['Power', ['Add', 'x', 3], 2], ['Negate', ['Power', 3, 2]], 5], 0,
    ]);
  });
  it('compléter le carré avec b négatif ou impair', () => {
    const eq: Expr = ['Equal', ['Add', ['Power', 'x', 2], ['Negate', ['Multiply', 4, 'x']]], 5];
    expect(result(eq, [1, 1], 'complete-square')).toEqual(['Equal', ['Add', ['Power', ['Add', 'x', -2], 2], ['Negate', ['Power', 2, 2]]], 5]);
    const odd: Expr = ['Add', ['Power', 'y', 2], ['Negate', 'y']];
    expect(result(odd, [1], 'complete-square')).toEqual(['Add', ['Power', ['Add', 'y', -0.5], 2], ['Negate', ['Power', 0.5, 2]]]);
  });
  it('pas de complétion sans terme en x de la même variable', () => {
    expect(moves(['Add', ['Power', 'x', 2], 5], [1], 'complete-square')).toHaveLength(0);
    expect(moves(['Add', ['Power', 'x', 2], ['Multiply', 4, 'y']], [1], 'complete-square')).toHaveLength(0);
  });
});

describe('logarithmes : × devient + (batch 17)', () => {
  it('produit, quotient, puissance', () => {
    expect(result(['Ln', ['Multiply', 'x', 'y']], [], 'log-product')).toEqual(['Add', ['Ln', 'x'], ['Ln', 'y']]);
    expect(result(['Ln', ['Divide', 'x', 'y']], [], 'log-quotient')).toEqual(['Add', ['Ln', 'x'], ['Negate', ['Ln', 'y']]]);
    expect(result(['Log', ['Power', 2, 100], 10], [], 'log-power')).toEqual(['Multiply', 100, ['Log', 2, 10]]);
  });
  it('la base est conservée pour log_b', () => {
    expect(result(['Log', ['Multiply', 2, 'x'], 10], [], 'log-product')).toEqual(['Add', ['Log', 2, 10], ['Log', 'x', 10]]);
  });
  it('pas de règle pour le log d’une somme (le piège)', () => {
    const ms = legalMoves(['Ln', ['Add', 'x', 'y']], []).filter((m) => m.ruleId.startsWith('log-'));
    expect(ms).toHaveLength(0);
  });
  it('valeurs exactes', () => {
    expect(result(['Log', ['Power', 10, 7], 10], [], 'log-exact')).toBe(7);
    expect(result(['Log', 1000, 10], [], 'log-exact')).toBe(3);
    expect(result(['Ln', 1], [], 'log-exact')).toBe(0);
    expect(result(['Ln', ['Exp', 'u']], [], 'log-exact')).toBe('u');
    expect(moves(['Log', 999, 10], [], 'log-exact')).toHaveLength(0);
  });
  it('fusionner : somme → produit, différence → quotient, même base seulement', () => {
    expect(result(['Add', ['Ln', 2], ['Ln', 5]], [1], 'log-merge')).toEqual(['Ln', ['Multiply', 2, 5]]);
    expect(result(['Add', ['Ln', 'a'], ['Negate', ['Ln', 'b']]], [1], 'log-merge')).toEqual(['Ln', ['Divide', 'a', 'b']]);
    expect(moves(['Add', ['Ln', 2], ['Log', 5, 10]], [1], 'log-merge')).toHaveLength(0);
  });
  it('remonter l’exposant : n·ln a → ln(aⁿ)', () => {
    expect(result(['Multiply', 3, ['Ln', 'x']], [1], 'log-power-up')).toEqual(['Ln', ['Power', 'x', 3]]);
  });
  it('changement de base', () => {
    expect(result(['Log', 8, 2], [], 'log-change-base')).toEqual(['Divide', ['Ln', 8], ['Ln', 2]]);
  });
  it('exponentielle : + devient ×', () => {
    expect(result(['Multiply', ['Exp', 'a'], ['Exp', 'b']], [1], 'exp-merge')).toEqual(['Exp', ['Add', 'a', 'b']]);
    expect(result(['Divide', ['Exp', -3], ['Exp', -1]], [], 'exp-quotient')).toEqual(['Exp', ['Add', -3, 1]]);
    expect(moves(['Divide', ['Exp', 'a'], 'b'], [], 'exp-quotient')).toHaveLength(0);
  });
});

describe('combinatoire : factorielles et binomiaux (batch 17)', () => {
  it('n! se pèle d’un facteur, jusqu’à 1', () => {
    expect(result(['Factorial', 5], [], 'fact-peel')).toEqual(['Multiply', 5, ['Factorial', 4]]);
    expect(result(['Factorial', 'n'], [], 'fact-peel')).toEqual(['Multiply', 'n', ['Factorial', ['Add', 'n', -1]]]);
    expect(result(['Factorial', 0], [], 'fact-base')).toBe(1);
    expect(result(['Factorial', 1], [], 'fact-base')).toBe(1);
    expect(legalMoves(['Factorial', 2.5], [])).toHaveLength(0);
  });
  it('5!/3! se simplifie avec le geste d’annulation habituel', () => {
    const peeled: Expr = ['Divide', ['Multiply', 5, 4, ['Factorial', 3]], ['Factorial', 3]];
    expect(result(peeled, [1, 3], 'cancel-fraction')).toEqual(['Multiply', 5, 4]);
  });
  it('C(n, k) : définition, Pascal, symétrie', () => {
    expect(result(['Binom', 4, 2], [], 'binom-def')).toEqual(['Divide', ['Factorial', 4], ['Multiply', ['Factorial', 2], ['Factorial', 2]]]);
    expect(result(['Binom', 4, 2], [], 'binom-pascal')).toEqual(['Add', ['Binom', 3, 1], ['Binom', 3, 2]]);
    expect(result(['Binom', 5, 4], [], 'binom-sym')).toEqual(['Binom', 5, 1]);
    expect(moves(['Binom', 5, 2], [], 'binom-sym')).toHaveLength(0);
  });
  it('les bords se lisent directement', () => {
    expect(result(['Binom', 7, 0], [], 'binom-edge')).toBe(1);
    expect(result(['Binom', 7, 7], [], 'binom-edge')).toBe(1);
    expect(result(['Binom', 'n', 1], [], 'binom-edge')).toBe('n');
  });
  it('Factorial et Binom sont opaques : le CAS ne compte pas à la place de l’élève', () => {
    expect(reachesGoal(['Binom', 4, 2], 6)).toBe(false);
    expect(reachesGoal(['Factorial', 3], 6)).toBe(false);
  });
});

describe('séries : Taylor et série géométrique (batch 17)', () => {
  const T = (f: Expr, k: number, x = 'x'): Expr => ['Taylor', f, x, k];
  it('eˣ se déplie terme à terme, dénominateurs en factorielles', () => {
    const eq: Expr = ['Equal', ['Exp', 'x'], T(['Exp', 'x'], 0)];
    const r1 = result(eq, [2], 'taylor-term');
    expect(r1).toEqual(['Equal', ['Exp', 'x'], ['Add', 1, T(['Exp', 'x'], 1)]]);
    const r3 = result(['Equal', ['Exp', 'x'], ['Add', 1, 'x', T(['Exp', 'x'], 2)]], [2, 3], 'taylor-term');
    expect(r3).toEqual(['Equal', ['Exp', 'x'], ['Add', 1, 'x', ['Divide', ['Power', 'x', 2], ['Factorial', 2]], T(['Exp', 'x'], 3)]]);
  });
  it('sin saute les termes pairs et alterne les signes', () => {
    const r = result(['Equal', ['Sin', 'x'], T(['Sin', 'x'], 0)], [2], 'taylor-term');
    expect(r).toEqual(['Equal', ['Sin', 'x'], ['Add', 'x', T(['Sin', 'x'], 3)]]);
    const r2 = result(['Equal', ['Sin', 'x'], ['Add', 'x', T(['Sin', 'x'], 3)]], [2, 2], 'taylor-term');
    expect(r2).toEqual(['Equal', ['Sin', 'x'], ['Add', 'x', ['Negate', ['Divide', ['Power', 'x', 3], ['Factorial', 3]]], T(['Sin', 'x'], 5)]]);
  });
  it('coefficients exacts du binôme : √(1 + x) et 1/√(1 − u)', () => {
    const sq: Expr = ['Sqrt', ['Add', 1, 'x']];
    expect(result(['Add', 1, ['Divide', 'x', 2], T(sq, 2)], [3], 'taylor-term')).toEqual([
      'Add', 1, ['Divide', 'x', 2], ['Negate', ['Divide', ['Power', 'x', 2], 8]], T(sq, 3),
    ]);
    const lorentz: Expr = ['Divide', 1, ['Sqrt', ['Add', 1, ['Negate', 'u']]]];
    expect(result(['Add', 1, ['Divide', 'u', 2], T(lorentz, 2, 'u')], [3], 'taylor-term')).toEqual([
      'Add', 1, ['Divide', 'u', 2], ['Divide', ['Multiply', 3, ['Power', 'u', 2]], 8], T(lorentz, 3, 'u'),
    ]);
  });
  it('tronquer : le reste disparaît et = devient ≈', () => {
    const eq: Expr = ['Equal', ['Sin', 'theta'], ['Add', 'theta', T(['Sin', 'theta'], 3, 'theta')]];
    expect(result(eq, [2, 2], 'taylor-truncate')).toEqual(['Approx', ['Sin', 'theta'], 'theta']);
    // Rien à tronquer tant que rien n'est déplié.
    expect(moves(['Equal', ['Sin', 'x'], T(['Sin', 'x'], 0)], [2], 'taylor-truncate')).toHaveLength(0);
  });
  it('un reste O(xᵏ) ne traverse pas le signe =', () => {
    const eq: Expr = ['Equal', ['Sin', 'x'], ['Add', 'x', T(['Sin', 'x'], 3)]];
    expect(moves(eq, [2, 2], 'move-term')).toHaveLength(0);
  });
  it('une fonction hors table ne se déplie pas', () => {
    expect(legalMoves(['Taylor', ['Tan', 'x'], 'x', 0], [])).toHaveLength(0);
  });
  it('≈ n’est jamais confondu avec = par le CAS', () => {
    expect(reachesGoal(['Approx', ['Sin', 'theta'], 'theta'], ['Equal', ['Sin', 'theta'], 'theta'])).toBe(false);
  });
  it('série géométrique : sommer si |r| < 1, toujours dérouler', () => {
    const s: Expr = ['GeomSeries', ['Divide', 1, 2], ['Divide', 1, 2]];
    expect(result(s, [], 'geom-sum')).toEqual(['Divide', ['Divide', 1, 2], ['Add', 1, ['Negate', ['Divide', 1, 2]]]]);
    expect(result(s, [], 'geom-shift')).toEqual(['Add', ['Divide', 1, 2], ['Multiply', ['Divide', 1, 2], s]]);
    expect(moves(['GeomSeries', 1, 2], [], 'geom-sum')).toHaveLength(0);
    expect(moves(['GeomSeries', 1, -1], [], 'geom-sum')).toHaveLength(0);
  });
});

describe('calcul exact : quotient de décimaux → fraction irréductible (batch 17)', () => {
  it('(1/4)/(3/4) se calcule en 1/3, exactement', () => {
    expect(result(['Divide', ['Divide', 1, 4], 0.75], [], 'compute')).toEqual(['Divide', 1, 3]);
    expect(result(['Divide', 4, 12], [], 'compute')).toEqual(['Divide', 1, 3]);
    expect(result(['Divide', -2, 6], [], 'compute')).toEqual(['Negate', ['Divide', 1, 3]]);
  });
  it('une fraction déjà irréductible n’offre rien, et une somme de fractions reste un exercice', () => {
    expect(moves(['Divide', 1, 3], [], 'compute')).toHaveLength(0);
    expect(moves(['Add', ['Divide', 1, 2], ['Divide', 1, 3]], [], 'compute')).toHaveLength(0);
  });
  it('un résultat décimal propre reste un décimal', () => {
    expect(result(['Divide', 3, 4], [], 'compute')).toBe(0.75);
  });
});
