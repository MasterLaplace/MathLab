import {
  type Expr,
  getAt,
  isCall,
  normalize,
  removeArgAt,
  sameExpr,
  setAt,
} from '../ast';
import type { Move, Rule } from './types';

/**
 * Distribuer : appuyer sur un produit contenant une somme l'étale.
 * `2(x + 3)` → `2x + 2·3`.
 */
export const distribute: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Multiply') return [];
  const factors = node.slice(1) as Expr[];
  const sumIndex = factors.findIndex((f) => isCall(f) && f[0] === 'Add');
  if (sumIndex === -1) return [];
  const sum = factors[sumIndex] as [string, ...Expr[]];
  const others = factors.filter((_, i) => i !== sumIndex);
  const terms = sum.slice(1).map((t) => normalize(['Multiply', ...others, t as Expr]));
  return [
    {
      ruleId: 'distribute',
      kind: 'tap',
      from,
      label: 'Distribuer : le facteur multiplie chaque terme de la somme',
      result: setAt(expr, from, normalize(['Add', ...terms])),
    },
  ];
};

/** Liste des facteurs d'un terme (un terme simple est son propre facteur). */
function factorsOf(t: Expr): Expr[] {
  if (isCall(t) && t[0] === 'Multiply') return t.slice(1) as Expr[];
  return [t];
}

function productOf(factors: Expr[]): Expr {
  if (factors.length === 0) return 1;
  if (factors.length === 1) return factors[0];
  return normalize(['Multiply', ...factors]);
}

/**
 * Factoriser : dans une somme, glisser `2x` sur `2y` (facteur commun 2)
 * les regroupe en `2(x + y)`. Inverse de la distribution.
 */
export const factorCommon: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  const index = from[from.length - 1];
  const source = parent[index] as Expr;
  const sourceFactors = factorsOf(source);

  const moves: Move[] = [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = parent[i] as Expr;
    const targetFactors = factorsOf(target);
    // Premier facteur strictement identique des deux côtés.
    const sIdx = sourceFactors.findIndex((f) => targetFactors.some((g) => sameExpr(f, g)));
    if (sIdx === -1) continue;
    const common = sourceFactors[sIdx];
    const tIdx = targetFactors.findIndex((g) => sameExpr(common, g));
    const restSource = productOf(sourceFactors.filter((_, k) => k !== sIdx));
    const restTarget = productOf(targetFactors.filter((_, k) => k !== tIdx));
    const grouped = normalize(['Multiply', common, ['Add', restSource, restTarget]]);
    let result = setAt(expr, [...parentPath, i], grouped);
    result = removeArgAt(result, from);
    moves.push({
      ruleId: 'factor-common',
      kind: 'drag',
      from,
      to: [...parentPath, i],
      label: 'Factoriser : le facteur commun se met en évidence',
      result,
    });
    break;
  }
  return moves;
};

/**
 * Additionner deux fractions : glisser `a/b` sur `c/d`.
 * Même dénominateur → `(a+c)/b` ; sinon mise au même dénominateur.
 */
export const addFractions: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  const index = from[from.length - 1];
  const source = parent[index] as Expr;
  if (!isCall(source) || source[0] !== 'Divide') return [];
  const [, a, b] = source as [string, Expr, Expr];

  const moves: Move[] = [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = parent[i] as Expr;
    if (!isCall(target) || target[0] !== 'Divide') continue;
    const [, c, d] = target as [string, Expr, Expr];
    let merged: Expr;
    let label: string;
    if (sameExpr(b, d)) {
      merged = ['Divide', normalize(['Add', a, c]), b];
      label = 'Même dénominateur : on additionne les numérateurs';
    } else {
      merged = [
        'Divide',
        normalize(['Add', ['Multiply', a, d], ['Multiply', c, b]]),
        normalize(['Multiply', b, d]),
      ];
      label = 'Mise au même dénominateur : a/b + c/d = (a·d + c·b)/(b·d)';
    }
    let result = setAt(expr, [...parentPath, i], merged);
    result = removeArgAt(result, from);
    moves.push({
      ruleId: 'add-fractions',
      kind: 'drag',
      from,
      to: [...parentPath, i],
      label,
      result,
    });
    break;
  }
  return moves;
};

/** Base et exposant d'un facteur : `x` → (x, 1) ; `xⁿ` → (x, n). Nombres exclus. */
function splitFactor(f: Expr): { base: Expr; exp: number } | null {
  if (typeof f === 'number') return null;
  if (isCall(f) && f[0] === 'Power' && typeof f[2] === 'number') {
    return { base: f[1] as Expr, exp: f[2] };
  }
  return { base: f, exp: 1 };
}

/**
 * Puissances : dans un produit, glisser `x` sur `x` les fusionne en `x²`
 * (et `xⁿ` sur `xᵐ` en `xⁿ⁺ᵐ`) — les exposants s'additionnent.
 */
export const combineEqualFactors: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Multiply') return [];
  const index = from[from.length - 1];
  const source = splitFactor(parent[index] as Expr);
  if (!source) return [];

  const moves: Move[] = [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = splitFactor(parent[i] as Expr);
    if (!target || !sameExpr(source.base, target.base)) continue;
    const exp = source.exp + target.exp;
    const combined: Expr = exp === 1 ? source.base : ['Power', source.base, exp];
    let result = setAt(expr, [...parentPath, i], combined);
    result = removeArgAt(result, from);
    moves.push({
      ruleId: 'combine-factors',
      kind: 'drag',
      from,
      to: [...parentPath, i],
      label: 'Les mêmes facteurs se regroupent : les exposants s’additionnent',
      result,
    });
    break;
  }
  return moves;
};

export const algebraRules: Rule[] = [distribute, factorCommon, addFractions, combineEqualFactors];
