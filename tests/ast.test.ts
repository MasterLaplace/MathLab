import { describe, expect, it } from 'vitest';
import {
  type Expr,
  evalAt,
  evalNumeric,
  freeVariables,
  getAt,
  negateTerm,
  normalize,
  removeArgAt,
  sameExpr,
  setAt,
  tidyNumber,
} from '../src/core/ast';

const eq2x3: Expr = ['Equal', ['Add', ['Multiply', 2, 'x'], 3], 11];

describe('navigation par chemin', () => {
  it('getAt atteint les sous-nœuds', () => {
    expect(getAt(eq2x3, [])).toEqual(eq2x3);
    expect(getAt(eq2x3, [1, 1, 2])).toBe('x');
    expect(getAt(eq2x3, [2])).toBe(11);
    expect(getAt(eq2x3, [1, 5])).toBeUndefined();
    expect(getAt(eq2x3, [2, 1])).toBeUndefined();
  });

  it('setAt remplace sans muter', () => {
    const out = setAt(eq2x3, [1, 2], 7);
    expect(getAt(out, [1, 2])).toBe(7);
    expect(getAt(eq2x3, [1, 2])).toBe(3);
  });

  it('removeArgAt effondre un Add à un seul terme', () => {
    const out = removeArgAt(eq2x3, [1, 2]);
    expect(getAt(out, [1])).toEqual(['Multiply', 2, 'x']);
  });

  it('removeArgAt remplace un n-aire vidé par son neutre', () => {
    expect(removeArgAt(['Add', 3] as Expr, [1])).toBe(0);
    expect(removeArgAt(['Multiply', 3] as Expr, [1])).toBe(1);
  });
});

describe('normalize', () => {
  it('convertit Subtract en Add + Negate', () => {
    expect(normalize(['Subtract', 'x', 3])).toEqual(['Add', 'x', -3]);
    expect(normalize(['Subtract', 'x', 'y'])).toEqual(['Add', 'x', ['Negate', 'y']]);
  });

  it('aplatit les Add imbriqués', () => {
    expect(normalize(['Add', ['Add', 1, 2], 3])).toEqual(['Add', 1, 2, 3]);
  });

  it('plie les doubles négations et les nombres négatifs', () => {
    expect(normalize(['Negate', 5])).toBe(-5);
    expect(normalize(['Negate', ['Negate', 'x']])).toBe('x');
  });
});

describe('negateTerm / sameExpr / evalNumeric', () => {
  it('negateTerm est involutif', () => {
    expect(negateTerm(3)).toBe(-3);
    expect(negateTerm(['Negate', 'x'])).toBe('x');
    expect(negateTerm('x')).toEqual(['Negate', 'x']);
  });

  it('sameExpr compare structurellement', () => {
    expect(sameExpr(['Add', 1, 'x'], ['Add', 1, 'x'])).toBe(true);
    expect(sameExpr(['Add', 1, 'x'], ['Add', 'x', 1])).toBe(false);
  });

  it('evalNumeric évalue les sous-arbres constants', () => {
    expect(evalNumeric(['Add', 11, -3])).toBe(8);
    expect(evalNumeric(['Divide', 8, 2])).toBe(4);
    expect(evalNumeric(['Sqrt', 16])).toBe(4);
    expect(evalNumeric(['Divide', 1, 0])).toBeUndefined();
    expect(evalNumeric(['Add', 'x', 1])).toBeUndefined();
  });

  it('tidyNumber élimine les artefacts flottants', () => {
    expect(tidyNumber(0.1 + 0.2)).toBe(0.3);
    expect(tidyNumber(-0)).toBe(0);
  });

  it('freeVariables collecte les symboles', () => {
    expect([...freeVariables(eq2x3)]).toEqual(['x']);
  });

  it('evalAt évalue avec des valeurs de variables', () => {
    expect(evalAt(['Add', ['Multiply', 2, 'x'], 3], { x: 4 })).toBe(11);
    expect(evalAt(['Divide', 'd', 't'], { d: 120, t: 2 })).toBe(60);
    expect(evalAt('x', {})).toBeUndefined();
  });
});
