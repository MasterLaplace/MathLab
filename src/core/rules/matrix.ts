import { type Expr, type ExprCall, getAt, isCall, normalize, setAt } from '../ast';
import type { Rule } from './types';

/**
 * Les matrices entrent dans l'AST — le palier « objets non numériques ».
 * Représentation : `['Mat2', a, b, c, d]` (2×2, ligne par ligne) et
 * `['Vec2', x, y]` (vecteur colonne). Les opérations restent des gestes :
 * - `['MatVec', M, v]` : la matrice agit sur le vecteur (tap → ligne × colonne),
 * - `['MatMul', A, B]` : composition de deux transformations,
 * - `['Det', M]`       : le déterminant se déplie en ad − bc,
 * - `['VecScale', k, v]` : λv, l'étirement d'un vecteur.
 * Chaque tap ne fait qu'étaler le calcul ; c'est `computeNumeric` (un geste
 * par entrée) qui termine — jamais d'auto-calcul.
 */

function asMat2(e: Expr | undefined): [Expr, Expr, Expr, Expr] | null {
  if (e === undefined || !isCall(e) || e[0] !== 'Mat2' || e.length !== 5) return null;
  return [e[1], e[2], e[3], e[4]] as [Expr, Expr, Expr, Expr];
}

function asVec2(e: Expr | undefined): [Expr, Expr] | null {
  if (e === undefined || !isCall(e) || e[0] !== 'Vec2' || e.length !== 3) return null;
  return [e[1], e[2]] as [Expr, Expr];
}

function isIdentity(m: [Expr, Expr, Expr, Expr]): boolean {
  return m[0] === 1 && m[1] === 0 && m[2] === 0 && m[3] === 1;
}

/** k·x, mais un coefficient négatif s'écrit −(|k|·x) pour s'afficher « … − 0,75·x ». */
function scaledTerm(k: Expr, x: Expr): Expr {
  if (typeof k === 'number' && k < 0) return ['Negate', ['Multiply', -k, x]];
  return ['Multiply', k, x];
}

/** Produit « ligne × colonne » : a·x + b·y, prêt à être calculé par taps. */
function rowDotCol(a: Expr, b: Expr, x: Expr, y: Expr): Expr {
  return normalize(['Add', scaledTerm(a, x), scaledTerm(b, y)]);
}

/** Av : appuyer sur le produit matrice·vecteur l'étale ligne par ligne. */
export const matVec: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'MatVec' || node.length !== 3) return [];
  const m = asMat2(node[1] as Expr);
  const v = asVec2(node[2] as Expr);
  if (!m || !v) return [];
  if (isIdentity(m)) {
    return [
      {
        ruleId: 'mat-identity',
        kind: 'tap',
        from,
        label: 'La matrice identité ne change rien : Iv = v',
        why: 'Sa première colonne est î, sa seconde ĵ : chaque vecteur est envoyé sur lui-même.',
        result: setAt(expr, from, node[2] as Expr),
      },
    ];
  }
  const result: ExprCall = ['Vec2', rowDotCol(m[0], m[1], v[0], v[1]), rowDotCol(m[2], m[3], v[0], v[1])];
  return [
    {
      ruleId: 'mat-vec',
      kind: 'tap',
      from,
      label: 'Ligne × colonne : chaque ligne de la matrice rencontre le vecteur',
      why: 'La 1ʳᵉ composante du résultat est (1ʳᵉ ligne)·(vecteur), la 2ᵉ est (2ᵉ ligne)·(vecteur). La matrice est une machine à transformer les vecteurs.',
      result: setAt(expr, from, result),
    },
  ];
};

/** AB : composer deux transformations — les lignes de A rencontrent les colonnes de B. */
export const matMul: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'MatMul' || node.length !== 3) return [];
  const a = asMat2(node[1] as Expr);
  const b = asMat2(node[2] as Expr);
  if (!a || !b) return [];
  const result: ExprCall = [
    'Mat2',
    rowDotCol(a[0], a[1], b[0], b[2]),
    rowDotCol(a[0], a[1], b[1], b[3]),
    rowDotCol(a[2], a[3], b[0], b[2]),
    rowDotCol(a[2], a[3], b[1], b[3]),
  ];
  return [
    {
      ruleId: 'mat-mul',
      kind: 'tap',
      from,
      label: 'Composer : lignes de A × colonnes de B',
      why: 'AB, c’est « appliquer B, puis A ». L’entrée (i, j) du produit est (ligne i de A)·(colonne j de B).',
      result: setAt(expr, from, result),
    },
  ];
};

/** det M : le déterminant se déplie en ad − bc (le facteur d'aire). */
export const detExpand: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Det' || node.length !== 2) return [];
  const m = asMat2(node[1] as Expr);
  if (!m) return [];
  const result = normalize(['Add', ['Multiply', m[0], m[3]], ['Negate', ['Multiply', m[1], m[2]]]]);
  return [
    {
      ruleId: 'det-expand',
      kind: 'tap',
      from,
      label: 'det = ad − bc : la diagonale moins l’anti-diagonale',
      why: 'Le déterminant mesure le facteur par lequel la matrice multiplie les aires (négatif = le plan est retourné, 0 = il est écrasé).',
      result: setAt(expr, from, result),
    },
  ];
};

/** λv : multiplier un vecteur par un scalaire étire chaque composante. */
export const vecScale: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'VecScale' || node.length !== 3) return [];
  const v = asVec2(node[2] as Expr);
  if (!v) return [];
  const k = node[1] as Expr;
  // Tout numérique → composantes calculées d'un coup (l'étirement se voit) ;
  // sinon les produits restent posés, à calculer par taps.
  const comp = (c: Expr): Expr =>
    typeof k === 'number' && typeof c === 'number' ? k * c : normalize(scaledTerm(k, c));
  const result: ExprCall = ['Vec2', comp(v[0]), comp(v[1])];
  return [
    {
      ruleId: 'vec-scale',
      kind: 'tap',
      from,
      label: 'λv : le scalaire étire chaque composante',
      why: 'Multiplier un vecteur par λ, c’est l’allonger d’un facteur λ sans changer sa direction — chaque composante est multipliée.',
      result: setAt(expr, from, result),
    },
  ];
};

export const matrixRules: Rule[] = [matVec, matMul, detExpand, vecScale];
