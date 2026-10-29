import { type Expr, evalAt, freeVariables, getAt, isCall, normalize, sameExpr, setAt, tidyNumber } from '../ast';
import type { Move, Rule } from './types';

/**
 * Le second degré par gestes (station B) — l'algèbre vue comme des aires :
 * - `expand-square` : (a + b)² se déplie en a² + 2·a·b + b² (le carré de
 *   côté a + b découpé en quatre tuiles) ;
 * - `factor-square` : le geste inverse, reconnaître un carré parfait ;
 * - `diff-squares` / `factor-diff-squares` : (a + b)(a − b) ⇄ a² − b² ;
 * - `complete-square` : le geste d'al-Khwarizmi, x² + bx → (x + b/2)² − (b/2)².
 * Comme ailleurs, jamais d'auto-calcul : 3² reste 3² jusqu'au tap de l'élève.
 */

/** Signe et magnitude d'un terme : −c → (−1, c), −(u) → (−1, u). */
function signed(t: Expr): { sign: 1 | -1; mag: Expr } {
  if (typeof t === 'number' && t < 0) return { sign: -1, mag: -t };
  if (isCall(t) && t[0] === 'Negate') return { sign: -1, mag: t[1] as Expr };
  return { sign: 1, mag: t };
}

/** Produit avec les nombres en tête : 2·3·x plutôt que 2·x·3 (pour que « 6x » se lise). */
function product(...factors: Expr[]): Expr {
  const nums = factors.filter((f) => typeof f === 'number');
  const rest = factors.filter((f) => typeof f !== 'number');
  return normalize(['Multiply', ...nums, ...rest]);
}

function withSign(sign: 1 | -1, e: Expr): Expr {
  return sign === 1 ? e : ['Negate', e];
}

/** (a ± b)² → a² ± 2·a·b + b². */
export const expandSquare: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Power' || node[2] !== 2) return [];
  const base = node[1] as Expr;
  if (!isCall(base) || base[0] !== 'Add' || base.length !== 3) return [];
  const a = base[1] as Expr;
  const { sign, mag: b } = signed(base[2] as Expr);
  const expanded = normalize([
    'Add',
    ['Power', a, 2],
    withSign(sign, product(2, a, b)),
    ['Power', b, 2],
  ]);
  return [
    {
      ruleId: 'expand-square',
      kind: 'tap',
      from,
      label: sign === 1 ? 'Identité remarquable : (a + b)² = a² + 2ab + b²' : 'Identité remarquable : (a − b)² = a² − 2ab + b²',
      why: 'Le carré de côté a + b se découpe en quatre tuiles : le carré a², le carré b², et DEUX rectangles a·b. Oublier le double produit, c’est oublier deux tuiles.',
      result: setAt(expr, from, expanded),
    },
  ];
};

/** Racine « visible » d'un terme carré : u² → u ; 9 → 3 (carré parfait). */
function squareRoot(t: Expr): Expr | null {
  if (isCall(t) && t[0] === 'Power' && t[2] === 2) return t[1] as Expr;
  if (typeof t === 'number' && t > 0) {
    const r = Math.round(Math.sqrt(t));
    if (r * r === t && r > 1) return r;
  }
  return null;
}

const SAMPLES = [0.37, 1.61, -2.23, 2.9];

/** Égalité numérique par échantillonnage des variables libres (pas besoin du CAS). */
function sameValue(a: Expr, b: Expr): boolean {
  const vars = [...new Set([...freeVariables(a), ...freeVariables(b)])];
  let compared = 0;
  for (let s = 0; s < SAMPLES.length; s++) {
    const values: Record<string, number> = {};
    vars.forEach((v, k) => (values[v] = SAMPLES[(s + k) % SAMPLES.length] + 0.5 * k));
    const va = evalAt(a, values);
    const vb = evalAt(b, values);
    if (va === undefined || vb === undefined) continue;
    compared++;
    if (Math.abs(va - vb) > 1e-9 * Math.max(1, Math.abs(va))) return false;
  }
  return compared > 0;
}

/** a² ± 2ab + b² → (a ± b)² : reconnaître le carré parfait (tap sur la somme). */
export const factorSquare: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Add' || node.length !== 4) return [];
  const terms = node.slice(1) as Expr[];
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const u = squareRoot(terms[i]);
      const v = squareRoot(terms[j]);
      if (u === null || v === null) continue;
      const middle = terms[3 - i - j];
      const twoUV = product(2, u, v);
      let sign: 1 | -1 | 0 = 0;
      if (sameValue(middle, twoUV)) sign = 1;
      else if (sameValue(middle, ['Negate', twoUV])) sign = -1;
      if (sign === 0) continue;
      const square: Expr = ['Power', normalize(['Add', u, withSign(sign, v)]), 2];
      return [
        {
          ruleId: 'factor-square',
          kind: 'tap',
          from,
          label: sign === 1 ? 'Carré parfait reconnu : a² + 2ab + b² = (a + b)²' : 'Carré parfait reconnu : a² − 2ab + b² = (a − b)²',
          why: 'Deux carrés et leur double produit : les quatre tuiles se recollent en un seul grand carré.',
          result: setAt(expr, from, square),
        },
      ];
    }
  }
  return [];
};

/** (a + b)(a − b) → a² − b² (tap sur le produit). */
export const diffSquares: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Multiply' || node.length !== 3) return [];
  const p = node[1] as Expr;
  const q = node[2] as Expr;
  if (!isCall(p) || p[0] !== 'Add' || p.length !== 3 || !isCall(q) || q[0] !== 'Add' || q.length !== 3) return [];
  if (!sameExpr(p[1] as Expr, q[1] as Expr)) return [];
  const sp = signed(p[2] as Expr);
  const sq = signed(q[2] as Expr);
  if (sp.sign === sq.sign || !sameExpr(sp.mag, sq.mag)) return [];
  const result = normalize(['Add', ['Power', p[1] as Expr, 2], ['Negate', ['Power', sp.mag, 2]]]);
  return [
    {
      ruleId: 'diff-squares',
      kind: 'tap',
      from,
      label: 'Identité remarquable : (a + b)(a − b) = a² − b²',
      why: 'Les doubles produits +ab et −ab s’annulent : il ne reste que la différence des carrés. C’est le calcul mental 49 × 51 = 50² − 1².',
      result: setAt(expr, from, result),
    },
  ];
};

/** a² − b² → (a + b)(a − b) (tap sur la somme). */
export const factorDiffSquares: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Add' || node.length !== 3) return [];
  for (const [i, j] of [[1, 2], [2, 1]]) {
    const pos = node[i] as Expr;
    const neg = signed(node[j] as Expr);
    if (neg.sign !== -1 || signed(pos).sign !== 1) continue;
    const a = squareRoot(pos);
    const b = squareRoot(neg.mag);
    if (a === null || b === null) continue;
    const result: Expr = ['Multiply', normalize(['Add', a, b]), normalize(['Add', a, ['Negate', b]])];
    return [
      {
        ruleId: 'factor-diff-squares',
        kind: 'tap',
        from,
        label: 'Différence de deux carrés : a² − b² = (a + b)(a − b)',
        why: 'Un produit nul a forcément un facteur nul : factoriser transforme une équation du second degré en deux équations du premier.',
        result: setAt(expr, from, result),
      },
    ];
  }
  return [];
};

/** Coefficient de `x` dans un terme : x → 1 ; 6x → 6 ; −x → −1 ; −(6x) → −6. */
function linearCoeff(t: Expr, x: string): number | null {
  if (t === x) return 1;
  if (isCall(t) && t[0] === 'Multiply' && t.length === 3 && typeof t[1] === 'number' && t[2] === x) return t[1];
  if (isCall(t) && t[0] === 'Negate') {
    const c = linearCoeff(t[1] as Expr, x);
    return c === null ? null : -c;
  }
  return null;
}

/**
 * Compléter le carré (al-Khwarizmi, vers 820) : tap sur x² dans une somme
 * qui contient aussi b·x → (x + b/2)² − (b/2)². Le rectangle b·x, coupé en
 * deux bandes recollées autour du carré, laisse un coin vide (b/2)² : on
 * l'ajoute… et on le retire aussitôt pour ne rien changer.
 */
export const completeSquare: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const node = getAt(expr, from);
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (node === undefined || parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  if (!isCall(node) || node[0] !== 'Power' || node[2] !== 2 || typeof node[1] !== 'string') return [];
  const x = node[1];
  const index = from[from.length - 1];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const b = linearCoeff(parent[i] as Expr, x);
    if (b === null) continue;
    const h = tidyNumber(b / 2);
    const square: Expr = ['Power', normalize(['Add', x, h]), 2];
    const corner: Expr = ['Negate', ['Power', Math.abs(h), 2]];
    let result = setAt(expr, from, square);
    result = setAt(result, [...parentPath, i], corner);
    const move: Move = {
      ruleId: 'complete-square',
      kind: 'tap',
      from,
      label: `Compléter le carré : x² ${b < 0 ? '−' : '+'} ${fmt(Math.abs(b))}x = (x ${h < 0 ? '−' : '+'} ${fmt(Math.abs(h))})² − ${fmt(Math.abs(h))}²`,
      why: `Le rectangle ${fmt(Math.abs(b))}·x se coupe en deux bandes de largeur ${fmt(Math.abs(h))}, recollées de part et d’autre du carré x² : il manque juste un coin ${fmt(Math.abs(h))} × ${fmt(Math.abs(h))} pour faire un grand carré. On l’ajoute… et on le retire.`,
      result: normalize(result),
    };
    return [move];
  }
  return [];
};

function fmt(n: number): string {
  return String(n).replace('.', ',');
}

export const polynomeRules: Rule[] = [expandSquare, factorSquare, diffSquares, factorDiffSquares, completeSquare];
