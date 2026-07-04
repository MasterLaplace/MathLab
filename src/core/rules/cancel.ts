import {
  type Expr,
  type Path,
  evalNumeric,
  getAt,
  isCall,
  negateTerm,
  normalize,
  removeArgAt,
  sameExpr,
  setAt,
  tidyNumber,
} from '../ast';
import type { Move, Rule } from './types';

/**
 * Calculer un sous-arbre entièrement numérique : appuyer sur `11 - 3`
 * le remplace par `8`. On n'auto-calcule jamais : chaque étape est un geste.
 */
export const computeNumeric: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node)) return [];
  const value = evalNumeric(node);
  // On ne propose le calcul que si le résultat est « propre » (entier ou
  // deux décimales) : ln 5 doit rester ln 5, une forme exacte.
  if (value === undefined || !isNice(value)) return [];
  return [
    {
      ruleId: 'compute',
      kind: 'tap',
      from,
      label: 'Calculer',
      result: setAt(expr, from, tidyNumber(value)),
    },
  ];
};

function isNice(n: number): boolean {
  return Math.abs(tidyNumber(n) * 100 - Math.round(tidyNumber(n) * 100)) < 1e-9;
}

/** Retirer un élément neutre : `x + 0` → `x`, `x × 1` → `x`, `x ÷ 1` → `x`, `x¹` → `x`. */
export const removeNeutral: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const node = getAt(expr, from);
  const parent = getAt(expr, from.slice(0, -1));
  if (node === undefined || parent === undefined || !isCall(parent)) return [];
  const index = from[from.length - 1];
  const h = parent[0];

  if (h === 'Add' && node === 0) {
    return [neutralMove(expr, from, 'Ajouter 0 ne change rien : le zéro disparaît')];
  }
  if (h === 'Multiply' && node === 1) {
    return [neutralMove(expr, from, 'Multiplier par 1 ne change rien : le 1 disparaît')];
  }
  if (h === 'Divide' && index === 2 && node === 1) {
    const numerator = parent[1] as Expr;
    return [
      {
        ruleId: 'neutral',
        kind: 'tap',
        from,
        label: 'Diviser par 1 ne change rien',
        result: setAt(expr, from.slice(0, -1), numerator),
      },
    ];
  }
  if (h === 'Power' && index === 2 && node === 1) {
    const base = parent[1] as Expr;
    return [
      {
        ruleId: 'neutral',
        kind: 'tap',
        from,
        label: 'Un exposant 1 ne change rien',
        result: setAt(expr, from.slice(0, -1), base),
      },
    ];
  }
  return [];
};

function neutralMove(expr: Expr, from: Path, label: string): Move {
  return { ruleId: 'neutral', kind: 'tap', from, label, result: removeArgAt(expr, from) };
}

/**
 * Annulation additive : dans une somme, glisser `a` sur `-a` (ou l'inverse)
 * fait disparaître les deux — ils s'annulent.
 */
export const cancelAdditivePair: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  const term = getAt(expr, from);
  if (term === undefined) return [];
  const opposite = negateTerm(term);
  const moves: Move[] = [];
  for (let i = 1; i < parent.length; i++) {
    if (i === from[from.length - 1]) continue;
    if (sameExpr(parent[i] as Expr, opposite)) {
      const to = [...parentPath, i];
      // retirer d'abord l'index le plus grand pour ne pas décaler l'autre
      const [first, second] = from[from.length - 1] > i ? [from, to] : [to, from];
      const result = removeArgAt(removeArgAt(expr, first), second);
      moves.push({
        ruleId: 'cancel-add',
        kind: 'drag',
        from,
        to,
        label: 'Un nombre et son opposé s’annulent : leur somme fait 0',
        result,
      });
      break;
    }
  }
  return moves;
};

/**
 * Simplification d'une fraction : dans `(k·u)/k` ou `k/(k·u)`, glisser le
 * facteur du numérateur sur le même facteur du dénominateur les annule.
 */
export const cancelFractionFactor: Rule = (expr, from) => {
  if (from.length < 2) return [];
  // `from` désigne un facteur direct du numérateur ou dénominateur d'un Divide,
  // ou le numérateur/dénominateur lui-même.
  const candidates = fractionContext(expr, from);
  if (!candidates) return [];
  const { dividePath, sideIndex } = candidates;
  const divide = getAt(expr, dividePath) as [string, Expr, Expr];
  const factor = getAt(expr, from);
  if (factor === undefined) return [];
  const otherIndex = sideIndex === 1 ? 2 : 1;
  const otherSide = divide[otherIndex] as Expr;

  const match = findFactor(otherSide, factor);
  if (match === null) return [];
  const to = [...dividePath, otherIndex, ...match];

  // Retire le facteur des deux côtés puis reconstruit la fraction.
  const newSame = withoutFactor(divide[sideIndex] as Expr, from.slice(dividePath.length + 1));
  const newOther = withoutFactor(otherSide, match);
  const simplified = normalize(
    sameExpr(newOther, 1) && otherIndex === 2
      ? newSame
      : sideIndex === 1
        ? ['Divide', newSame, newOther]
        : ['Divide', newOther, newSame],
  );
  return [
    {
      ruleId: 'cancel-fraction',
      kind: 'drag',
      from,
      to,
      label: 'Le même facteur en haut et en bas d’une fraction se simplifie',
      result: setAt(expr, dividePath, simplified),
    },
  ];
};

/** Trouve le Divide englobant si `from` désigne un facteur d'un de ses côtés. */
function fractionContext(
  expr: Expr,
  from: Path,
): { dividePath: Path; sideIndex: 1 | 2 } | null {
  // cas 1 : from = [...divide, side] (le côté entier est le facteur)
  const p1 = from.slice(0, -1);
  const side1 = from[from.length - 1];
  const d1 = getAt(expr, p1);
  if (isCall(d1 ?? 0) && (d1 as Expr[])[0] === 'Divide' && (side1 === 1 || side1 === 2)) {
    return { dividePath: p1, sideIndex: side1 as 1 | 2 };
  }
  // cas 2 : from = [...divide, side, i] (facteur d'un produit)
  if (from.length >= 2) {
    const p2 = from.slice(0, -2);
    const side2 = from[from.length - 2];
    const d2 = getAt(expr, p2);
    const product = getAt(expr, from.slice(0, -1));
    if (
      isCall(d2 ?? 0) &&
      (d2 as Expr[])[0] === 'Divide' &&
      (side2 === 1 || side2 === 2) &&
      isCall(product ?? 0) &&
      (product as Expr[])[0] === 'Multiply'
    ) {
      return { dividePath: p2, sideIndex: side2 as 1 | 2 };
    }
  }
  return null;
}

/** Cherche `factor` dans `side` (le côté entier, ou un facteur direct d'un produit). */
function findFactor(side: Expr, factor: Expr): Path | null {
  if (sameExpr(side, factor)) return [];
  if (isCall(side) && side[0] === 'Multiply') {
    for (let i = 1; i < side.length; i++) {
      if (sameExpr(side[i] as Expr, factor)) return [i];
    }
  }
  return null;
}

/** Retire le facteur désigné par `rel` (chemin relatif au côté). */
function withoutFactor(side: Expr, rel: Path): Expr {
  if (rel.length === 0) return 1;
  return normalize(removeArgAt(side, rel));
}

/**
 * Combiner des termes semblables : dans une somme, glisser `5x` sur `-3x`
 * (même partie littérale) les fusionne en `2x`. Fonctionne aussi pour les
 * nombres purs (`5` sur `3` → `8`).
 */
export const combineLikeTerms: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  const index = from[from.length - 1];
  const source = splitTerm(parent[index] as Expr);
  if (!source) return [];

  const moves: Move[] = [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = splitTerm(parent[i] as Expr);
    if (!target) continue;
    if ((source.base === null) !== (target.base === null)) continue;
    if (source.base !== null && !sameExpr(source.base, target.base as Expr)) continue;

    const coeff = tidyNumber(source.coeff + target.coeff);
    let combined: Expr;
    if (source.base === null) combined = coeff;
    else if (coeff === 0) combined = 0;
    else if (coeff === 1) combined = source.base;
    else if (coeff === -1) combined = ['Negate', source.base];
    else combined = ['Multiply', coeff, source.base];

    // Remplace la cible par la fusion, retire la source.
    let result = setAt(expr, [...parentPath, i], combined);
    result = removeArgAt(result, from);
    // Si la fusion vaut 0 dans une somme, elle disparaît aussi.
    if (combined === 0) {
      const newIndex = i > index ? i - 1 : i;
      const parentAfter = getAt(result, parentPath);
      if (isCall(parentAfter ?? 0) && (parentAfter as Expr[])[0] === 'Add') {
        result = removeArgAt(result, [...parentPath, newIndex]);
      }
    }
    moves.push({
      ruleId: 'combine-terms',
      kind: 'drag',
      from,
      to: [...parentPath, i],
      label:
        source.base === null
          ? 'Additionner les deux nombres'
          : 'Des termes semblables se combinent : on additionne leurs coefficients',
      result,
    });
    break;
  }
  return moves;
};

/** Décompose un terme en (coefficient, partie littérale). `5x` → (5, x) ; `7` → (7, null). */
function splitTerm(t: Expr): { coeff: number; base: Expr | null } | null {
  if (typeof t === 'number') return { coeff: t, base: null };
  if (typeof t === 'string') return { coeff: 1, base: t };
  if (t[0] === 'Negate') {
    const inner = splitTerm(t[1] as Expr);
    return inner ? { coeff: -inner.coeff, base: inner.base } : null;
  }
  if (t[0] === 'Multiply' && t.length === 3 && typeof t[1] === 'number') {
    return { coeff: t[1], base: t[2] as Expr };
  }
  if (isCall(t)) return { coeff: 1, base: t };
  return null;
}

export const cancelRules: Rule[] = [
  computeNumeric,
  removeNeutral,
  cancelAdditivePair,
  combineLikeTerms,
  cancelFractionFactor,
];
