import {
  type Expr,
  type Path,
  getAt,
  head,
  isCall,
  negateTerm,
  normalize,
  removeArgAt,
  setAt,
} from '../ast';
import type { Move, Rule } from './types';

function isEquation(expr: Expr): expr is [string, Expr, Expr] {
  return isCall(expr) && expr[0] === 'Equal' && expr.length === 3;
}

/** Si `from` désigne un nœud d'un côté d'une équation, renvoie (côté, autre côté). */
function sideOf(from: Path): { side: 1 | 2; other: 1 | 2 } | null {
  if (from.length === 0 || (from[0] !== 1 && from[0] !== 2)) return null;
  const side = from[0] as 1 | 2;
  return { side, other: side === 1 ? 2 : 1 };
}

/**
 * Transposer un terme additif : dans `a + b = c`, glisser `b` de l'autre côté
 * donne `a = c - b`. Le terme peut être le côté entier (`b = c` → `0 = c - b`
 * est exclu : on ne déplace pas un côté entier) ou un argument direct d'un
 * `Add` au sommet du côté.
 */
export const moveTermAcrossEquality: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 2) return [];
  const sideExpr = expr[loc.side];
  if (head(sideExpr) !== 'Add') return [];
  const term = getAt(expr, from);
  if (term === undefined) return [];

  const otherExpr = expr[loc.other];
  const moved = negateTerm(term);
  const withoutTerm = removeArgAt(expr, from);
  const newOther = normalize(['Add', otherExpr, moved]);
  const result = setAt(withoutTerm, [loc.other], newOther);
  const sign = isCall(term) && term[0] === 'Negate' ? '+' : '−';
  return [
    {
      ruleId: 'move-term',
      kind: 'drag',
      from,
      to: [loc.other],
      label: `Un terme qui change de côté change de signe : il devient « ${sign} »`,
      why: 'En réalité, on a appliqué la même soustraction (ou addition) aux deux côtés : l’équilibre est préservé.',
      result,
    },
  ];
};

/**
 * Transposer un facteur : dans `k·x = c`, glisser `k` de l'autre côté
 * donne `x = c / k`.
 */
export const moveFactorAcrossEquality: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 2) return [];
  const sideExpr = expr[loc.side];
  if (head(sideExpr) !== 'Multiply') return [];
  const factor = getAt(expr, from);
  if (factor === undefined) return [];

  const otherExpr = expr[loc.other];
  const withoutFactor = removeArgAt(expr, from);
  const newOther: Expr = ['Divide', otherExpr, factor];
  const result = setAt(withoutFactor, [loc.other], newOther);
  return [
    {
      ruleId: 'move-factor',
      kind: 'drag',
      from,
      to: [loc.other],
      label: 'Un facteur qui change de côté devient une division : × devient ÷',
      why: 'En réalité, on a divisé les deux côtés par ce facteur : l’équilibre est préservé.',
      result,
    },
  ];
};

/**
 * Transposer un dénominateur : dans `x / k = c`, glisser `k` de l'autre côté
 * donne `x = c · k`.
 */
export const moveDenominatorAcrossEquality: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 2 || from[1] !== 2) return [];
  const sideExpr = expr[loc.side];
  if (head(sideExpr) !== 'Divide') return [];
  const denominator = getAt(expr, from);
  if (denominator === undefined) return [];

  const numerator = (sideExpr as [string, Expr, Expr])[1];
  const otherExpr = expr[loc.other];
  const newOther = normalize(['Multiply', otherExpr, denominator]);
  let result = setAt(expr, [loc.side], numerator);
  result = setAt(result, [loc.other], newOther);
  return [
    {
      ruleId: 'move-denominator',
      kind: 'drag',
      from,
      to: [loc.other],
      label: 'Un diviseur qui change de côté devient une multiplication : ÷ devient ×',
      why: 'En réalité, on a multiplié les deux côtés par ce diviseur : l’équilibre est préservé.',
      result,
    },
  ];
};

/**
 * Défaire une puissance : sur `uⁿ = c`, appuyer applique la racine n-ième
 * aux deux côtés. Pour n pair, une seconde option propose la version
 * complète avec les deux racines (±).
 */
export const undoPowerBothSides: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 1) return [];
  const sideExpr = expr[loc.side];
  if (!isCall(sideExpr) || sideExpr[0] !== 'Power') return [];
  const n = sideExpr[2];
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 2) return [];
  const base = sideExpr[1];
  const otherExpr = expr[loc.other];
  const root: Expr = n === 2 ? ['Sqrt', otherExpr] : ['Root', otherExpr, n];

  const positive = setAt(setAt(expr, [loc.side], base), [loc.other], root);
  const moves: Move[] = [
    {
      ruleId: 'undo-power',
      kind: 'tap',
      from,
      label:
        n === 2
          ? 'La racine carrée annule le carré (racine positive)'
          : `La racine ${n}-ième annule la puissance ${n}`,
      why: 'On a appliqué la racine aux deux côtés : l’équilibre est préservé.',
      result: positive,
    },
  ];
  if (n % 2 === 0) {
    const both = setAt(setAt(expr, [loc.side], base), [loc.other], ['PlusMinus', root]);
    moves.push({
      ruleId: 'undo-power-pm',
      kind: 'tap',
      from,
      label: '…sans oublier la racine négative : la solution complète est ±',
      why: 'Un nombre et son opposé ont le même carré : il y a deux antécédents.',
      result: both,
    });
  }
  return moves;
};

/**
 * Défaire une puissance à base numérique : sur `bᵘ = c` (b connu, u inconnu),
 * appuyer applique le logarithme en base b → `u = log_b(c)`.
 */
export const undoExponentBase: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 1) return [];
  const sideExpr = expr[loc.side];
  if (!isCall(sideExpr) || sideExpr[0] !== 'Power') return [];
  const base = sideExpr[1];
  const exponent = sideExpr[2];
  if (typeof base !== 'number' || base <= 0 || base === 1) return [];
  if (typeof exponent === 'number') return [];
  const otherExpr = expr[loc.other];
  let result = setAt(expr, [loc.side], exponent as Expr);
  result = setAt(result, [loc.other], ['Log', otherExpr, base]);
  return [
    {
      ruleId: 'undo-exp-base',
      kind: 'tap',
      from,
      label: `Le logarithme en base ${base} annule ${base} puissance x`,
      why: 'On a appliqué log aux deux côtés : c’est l’opération inverse de l’exponentiation.',
      result,
    },
  ];
};

const TRIG_INVERSE: Record<string, { inv: string; label: string }> = {
  Sin: { inv: 'Arcsin', label: 'arcsin annule le sinus : on retrouve l’angle' },
  Cos: { inv: 'Arccos', label: 'arccos annule le cosinus : on retrouve l’angle' },
  Tan: { inv: 'Arctan', label: 'arctan annule la tangente : on retrouve l’angle' },
};

/** Défaire une fonction trigonométrique : `sin(u) = c` → `u = arcsin(c)`. */
export const undoTrigBothSides: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 1) return [];
  const sideExpr = expr[loc.side];
  if (!isCall(sideExpr)) return [];
  const entry = TRIG_INVERSE[sideExpr[0]];
  if (!entry) return [];
  const inner = sideExpr[1];
  const otherExpr = expr[loc.other];
  let result = setAt(expr, [loc.side], inner as Expr);
  result = setAt(result, [loc.other], [entry.inv, otherExpr]);
  return [
    {
      ruleId: 'undo-trig',
      kind: 'tap',
      from,
      label: entry.label,
      why: 'On a appliqué la fonction réciproque aux deux côtés.',
      result,
    },
  ];
};

/**
 * Défaire une exponentielle : sur `exp(u) = c`, appuyer applique `ln` aux
 * deux côtés → `u = ln(c)`.
 */
export const undoExpBothSides: Rule = (expr, from) => {
  if (!isEquation(expr)) return [];
  const loc = sideOf(from);
  if (!loc || from.length !== 1) return [];
  const sideExpr = expr[loc.side];
  if (!isCall(sideExpr) || sideExpr[0] !== 'Exp') return [];
  const inner = sideExpr[1];
  const otherExpr = expr[loc.other];
  let result = setAt(expr, [loc.side], inner);
  result = setAt(result, [loc.other], ['Ln', otherExpr]);
  return [
    {
      ruleId: 'undo-exp',
      kind: 'tap',
      from,
      label: 'Le logarithme népérien annule l’exponentielle : ln(eˣ) = x',
      result,
    },
  ];
};

export const equalityRules: Rule[] = [
  moveTermAcrossEquality,
  moveFactorAcrossEquality,
  moveDenominatorAcrossEquality,
  undoPowerBothSides,
  undoExponentBase,
  undoExpBothSides,
  undoTrigBothSides,
];
