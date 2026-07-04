import { describe, expect, it } from 'vitest';
import type { Expr } from '../src/core/ast';
import { legalMoves } from '../src/core/rules';

function movesOf(expr: Expr, from: number[], ruleId?: string) {
  const moves = legalMoves(expr, from);
  return ruleId ? moves.filter((m) => m.ruleId === ruleId) : moves;
}

describe('transposition de terme (move-term)', () => {
  const eq: Expr = ['Equal', ['Add', ['Multiply', 2, 'x'], 3], 11];

  it('2x + 3 = 11 : glisser le 3 donne 2x = 11 - 3', () => {
    const [move] = movesOf(eq, [1, 2], 'move-term');
    expect(move).toBeDefined();
    expect(move.to).toEqual([2]);
    expect(move.result).toEqual(['Equal', ['Multiply', 2, 'x'], ['Add', 11, -3]]);
  });

  it('un terme négatif change de signe en traversant', () => {
    const eqNeg: Expr = ['Equal', ['Add', 'x', -5], 2];
    const [move] = movesOf(eqNeg, [1, 2], 'move-term');
    expect(move.result).toEqual(['Equal', 'x', ['Add', 2, 5]]);
  });

  it('fonctionne aussi de droite à gauche', () => {
    const eqR: Expr = ['Equal', 10, ['Add', 'x', 4]];
    const [move] = movesOf(eqR, [2, 2], 'move-term');
    expect(move.to).toEqual([1]);
    expect(move.result).toEqual(['Equal', ['Add', 10, -4], 'x']);
  });

  it('glisser 2x en entier est aussi légal : 3 = 11 - 2x', () => {
    const [move] = movesOf(eq, [1, 1], 'move-term');
    expect(move.result).toEqual(['Equal', 3, ['Add', 11, ['Negate', ['Multiply', 2, 'x']]]]);
  });

  it('refuse un nœud profond ou un côté qui n’est pas une somme', () => {
    expect(movesOf(eq, [1, 1, 1], 'move-term')).toHaveLength(0);
    expect(movesOf(eq, [2], 'move-term')).toHaveLength(0);
  });
});

describe('transposition de facteur (move-factor)', () => {
  it('2x = 8 : glisser le 2 donne x = 8/2', () => {
    const eq: Expr = ['Equal', ['Multiply', 2, 'x'], 8];
    const [move] = movesOf(eq, [1, 1], 'move-factor');
    expect(move.result).toEqual(['Equal', 'x', ['Divide', 8, 2]]);
  });

  it('glisser le x de 2x = 8 donne 2 = 8/x', () => {
    const eq: Expr = ['Equal', ['Multiply', 2, 'x'], 8];
    const [move] = movesOf(eq, [1, 2], 'move-factor');
    expect(move.result).toEqual(['Equal', 2, ['Divide', 8, 'x']]);
  });

  it('refuse un terme profond (pas au sommet du côté)', () => {
    const eq: Expr = ['Equal', ['Add', ['Multiply', 2, 'x'], 3], 11];
    expect(movesOf(eq, [1, 1, 1], 'move-factor')).toHaveLength(0);
  });
});

describe('transposition de dénominateur (move-denominator)', () => {
  it('x/3 = 4 : glisser le 3 donne x = 4·3', () => {
    const eq: Expr = ['Equal', ['Divide', 'x', 3], 4];
    const [move] = movesOf(eq, [1, 2], 'move-denominator');
    expect(move.result).toEqual(['Equal', 'x', ['Multiply', 4, 3]]);
  });

  it('refuse de transposer le numérateur', () => {
    const eq: Expr = ['Equal', ['Divide', 'x', 3], 4];
    expect(movesOf(eq, [1, 1], 'move-denominator')).toHaveLength(0);
  });
});

describe('défaire puissance et exponentielle', () => {
  it('x² = 16 : appuyer sur le carré donne x = √16', () => {
    const eq: Expr = ['Equal', ['Power', 'x', 2], 16];
    const [move] = movesOf(eq, [1], 'undo-power');
    expect(move.kind).toBe('tap');
    expect(move.result).toEqual(['Equal', 'x', ['Sqrt', 16]]);
  });

  it('exp(x) = 5 : appuyer donne x = ln(5)', () => {
    const eq: Expr = ['Equal', ['Exp', 'x'], 5];
    const [move] = movesOf(eq, [1], 'undo-exp');
    expect(move.result).toEqual(['Equal', 'x', ['Ln', 5]]);
  });

  it('un cube se défait par la racine cubique', () => {
    const eq: Expr = ['Equal', ['Power', 'x', 3], 8];
    const [move] = movesOf(eq, [1], 'undo-power');
    expect(move.result).toEqual(['Equal', 'x', ['Root', 8, 3]]);
  });
});

describe('calcul numérique pas-à-pas (compute)', () => {
  it('11 - 3 se calcule en 8', () => {
    const eq: Expr = ['Equal', ['Multiply', 2, 'x'], ['Add', 11, -3]];
    const [move] = movesOf(eq, [2], 'compute');
    expect(move.result).toEqual(['Equal', ['Multiply', 2, 'x'], 8]);
  });

  it('pas de calcul si le sous-arbre contient une variable', () => {
    const eq: Expr = ['Equal', ['Multiply', 2, 'x'], 8];
    expect(movesOf(eq, [1], 'compute')).toHaveLength(0);
  });

  it('√16 se calcule en 4', () => {
    const eq: Expr = ['Equal', 'x', ['Sqrt', 16]];
    const [move] = movesOf(eq, [2], 'compute');
    expect(move.result).toEqual(['Equal', 'x', 4]);
  });
});

describe('éléments neutres (neutral)', () => {
  it('x + 0 : appuyer sur le 0 le retire', () => {
    const e: Expr = ['Add', 'x', 0];
    const [move] = movesOf(e, [2], 'neutral');
    expect(move.result).toBe('x');
  });

  it('x × 1 et x ÷ 1 se simplifient', () => {
    expect(movesOf(['Multiply', 'x', 1], [2], 'neutral')[0].result).toBe('x');
    expect(movesOf(['Divide', 'x', 1], [2], 'neutral')[0].result).toBe('x');
  });

  it('x¹ se simplifie, mais pas x²', () => {
    expect(movesOf(['Power', 'x', 1], [2], 'neutral')[0].result).toBe('x');
    expect(movesOf(['Power', 'x', 2], [2], 'neutral')).toHaveLength(0);
  });

  it('le 1 numérateur d’une division ne disparaît pas', () => {
    expect(movesOf(['Divide', 1, 'x'], [1], 'neutral')).toHaveLength(0);
  });
});

describe('annulation additive (cancel-add)', () => {
  it('x + 5 - 5 : glisser 5 sur -5 les annule', () => {
    const e: Expr = ['Add', 'x', 5, -5];
    const [move] = movesOf(e, [2], 'cancel-add');
    expect(move.to).toEqual([3]);
    expect(move.result).toBe('x');
  });

  it('fonctionne avec des termes symboliques : y + x - x', () => {
    const e: Expr = ['Add', 'y', 'x', ['Negate', 'x']];
    const [move] = movesOf(e, [2], 'cancel-add');
    expect(move.result).toBe('y');
  });

  it('rien à annuler dans x + 5 + 3', () => {
    expect(movesOf(['Add', 'x', 5, 3], [2], 'cancel-add')).toHaveLength(0);
  });
});

describe('termes semblables (combine-terms)', () => {
  it('5x - 3x : glisser 5x sur -3x donne 2x', () => {
    const e: Expr = ['Add', ['Multiply', 5, 'x'], ['Negate', ['Multiply', 3, 'x']]];
    const [move] = movesOf(e, [1], 'combine-terms');
    expect(move.to).toEqual([2]);
    expect(move.result).toEqual(['Multiply', 2, 'x']);
  });

  it('x + x donne 2x', () => {
    const e: Expr = ['Add', 'x', 'x'];
    const [move] = movesOf(e, [1], 'combine-terms');
    expect(move.result).toEqual(['Multiply', 2, 'x']);
  });

  it('deux nombres se combinent : y + 5 + 3 → y + 8', () => {
    const e: Expr = ['Add', 'y', 5, 3];
    const [move] = movesOf(e, [2], 'combine-terms');
    expect(move.result).toEqual(['Add', 'y', 8]);
  });

  it('pas de fusion entre 5x et 3y', () => {
    const e: Expr = ['Add', ['Multiply', 5, 'x'], ['Multiply', 3, 'y']];
    expect(movesOf(e, [1], 'combine-terms')).toHaveLength(0);
  });

  it('coefficient nul : 3x - 3x disparaît de la somme', () => {
    const e: Expr = ['Add', 'y', ['Multiply', 3, 'x'], ['Negate', ['Multiply', 3, 'x']]];
    const [move] = movesOf(e, [2], 'combine-terms');
    expect(move.result).toBe('y');
  });
});

describe('restriction de compute aux résultats propres', () => {
  it('ln(5) reste sous forme exacte (pas de tap Calculer)', () => {
    const eq: Expr = ['Equal', 'x', ['Ln', 5]];
    expect(movesOf(eq, [2], 'compute')).toHaveLength(0);
  });

  it('10 ÷ 4 = 2,5 est proposé', () => {
    const [move] = movesOf(['Divide', 10, 4], [], 'compute');
    expect(move.result).toBe(2.5);
  });
});

describe('simplification de fraction (cancel-fraction)', () => {
  it('(2x)/2 : glisser le 2 du haut sur le 2 du bas donne x', () => {
    const e: Expr = ['Divide', ['Multiply', 2, 'x'], 2];
    const [move] = movesOf(e, [1, 1], 'cancel-fraction');
    expect(move.to).toEqual([2]);
    expect(move.result).toBe('x');
  });

  it('dans une équation : x = (2·4)/2 → x = 4', () => {
    const eq: Expr = ['Equal', 'x', ['Divide', ['Multiply', 2, 4], 2]];
    const [move] = movesOf(eq, [2, 1, 1], 'cancel-fraction');
    expect(move.result).toEqual(['Equal', 'x', 4]);
  });

  it('pas de simplification si les facteurs diffèrent', () => {
    const e: Expr = ['Divide', ['Multiply', 2, 'x'], 3];
    expect(movesOf(e, [1, 1], 'cancel-fraction')).toHaveLength(0);
  });
});
