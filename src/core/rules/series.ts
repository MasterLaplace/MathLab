import { type Expr, evalNumeric, getAt, isCall, normalize, removeArgAt, sameExpr, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * L'infini apprivoisé (station H′).
 *
 * `['Taylor', f, x, k]` : « tout ce qu'il reste à déplier » du développement
 * de f en 0, à partir de l'ordre k. Rendu 𝒯{f} quand rien n'est encore
 * déplié (k = 0), puis O(xᵏ) — la notation des manuels. Chaque tap sort le
 * terme suivant (coefficient exact f⁽ʲ⁾(0)/j!) et laisse le reste en attente,
 * comme le d/dx de la règle de la chaîne. Tronquer est un geste explicite :
 * le reste disparaît et le signe = devient ≈ — on ne ment jamais sur l'égalité.
 *
 * `['GeomSeries', a, r]` : a + ar + ar² + ⋯. Un tap la somme en a/(1 − r)
 * quand |r| < 1, ou la déroule en a + r·(a + ar + ⋯) — la série contient
 * une copie d'elle-même, le cœur de la preuve.
 */

type Rational = [number, number]; // [numérateur, dénominateur > 0]

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
function rat(p: number, q: number): Rational {
  const g = gcd(p, q);
  return q < 0 ? [-p / g, -q / g] : [p / g, q / g];
}
function mulRat(a: Rational, b: Rational): Rational {
  return rat(a[0] * b[0], a[1] * b[1]);
}
function fact(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/** Une fonction dont on connaît la série, et le style d'écriture de ses termes. */
interface Known {
  name: string;
  /** Coefficient exact d'ordre j. */
  coeff: (j: number) => Rational;
  /** Écrire le dénominateur sous forme j! (eˣ, sin, cos) plutôt que calculé. */
  factorialStyle: boolean;
}

/** Coefficients du binôme généralisé (1 + x)^α pour α = num/den. */
function binomialSeries(num: number, den: number): (j: number) => Rational {
  return (j) => {
    let c: Rational = [1, 1];
    for (let i = 1; i <= j; i++) c = mulRat(c, rat(num - (i - 1) * den, den * i));
    return c;
  };
}

function isOnePlus(e: Expr, x: string, negated: boolean): boolean {
  if (!isCall(e) || e[0] !== 'Add' || e.length !== 3) return false;
  const t = negated ? ['Negate', x] : x;
  return (e[1] === 1 && sameExpr(e[2] as Expr, t as Expr)) || (e[2] === 1 && sameExpr(e[1] as Expr, t as Expr));
}

/** Reconnaît f parmi la table des séries célèbres. */
function knownSeries(f: Expr, x: string): Known | null {
  if (!isCall(f)) return null;
  const h = f[0];
  const a = f[1] as Expr;
  if (h === 'Exp' && a === x) return { name: 'eˣ', coeff: (j) => [1, fact(j)], factorialStyle: true };
  if (h === 'Sin' && a === x)
    return { name: 'sin', coeff: (j) => (j % 2 === 1 ? [((j - 1) / 2) % 2 === 0 ? 1 : -1, fact(j)] : [0, 1]), factorialStyle: true };
  if (h === 'Cos' && a === x)
    return { name: 'cos', coeff: (j) => (j % 2 === 0 ? [(j / 2) % 2 === 0 ? 1 : -1, fact(j)] : [0, 1]), factorialStyle: true };
  if (h === 'Arctan' && a === x)
    return { name: 'arctan', coeff: (j) => (j % 2 === 1 ? [((j - 1) / 2) % 2 === 0 ? 1 : -1, j] : [0, 1]), factorialStyle: false };
  if (h === 'Ln' && isOnePlus(a, x, false))
    return { name: 'ln(1 + x)', coeff: (j) => (j === 0 ? [0, 1] : [j % 2 === 1 ? 1 : -1, j]), factorialStyle: false };
  if (h === 'Sqrt' && isOnePlus(a, x, false)) return { name: '√(1 + x)', coeff: binomialSeries(1, 2), factorialStyle: false };
  if (h === 'Divide' && a === 1) {
    const d = f[2] as Expr;
    if (isOnePlus(d, x, true)) return { name: '1/(1 − x)', coeff: () => [1, 1], factorialStyle: false };
    // 1/√(1 − x) = (1 − x)^(−1/2) : le facteur de Lorentz quand x = v²/c².
    if (isCall(d) && d[0] === 'Sqrt' && isOnePlus(d[1] as Expr, x, true)) {
      const c = binomialSeries(-1, 2);
      return { name: '1/√(1 − x)', coeff: (j) => (j % 2 === 0 ? c(j) : rat(-c(j)[0], c(j)[1])), factorialStyle: false };
    }
  }
  return null;
}

const MAX_ORDER = 12;

function nextNonZero(k: Known, from: number): number | null {
  for (let j = from; j <= MAX_ORDER; j++) if (k.coeff(j)[0] !== 0) return j;
  return null;
}

/** Le terme c·xʲ écrit comme un humain l'écrirait : x³/3!, −x²/2, 3x²/8… */
function termOf(k: Known, j: number, x: string): Expr {
  const [p, q] = k.coeff(j);
  const mono: Expr = j === 0 ? 1 : j === 1 ? x : ['Power', x, j];
  let core: Expr;
  if (k.factorialStyle && j >= 2 && Math.abs(p) === 1 && q === fact(j)) {
    core = ['Divide', mono, ['Factorial', j]];
  } else {
    const numer: Expr = Math.abs(p) === 1 ? mono : j === 0 ? Math.abs(p) : ['Multiply', Math.abs(p), mono];
    core = q === 1 ? numer : ['Divide', numer, q];
  }
  return p < 0 ? (typeof core === 'number' ? -core : ['Negate', core]) : core;
}

function ordinal(j: number): string {
  return j === 0 ? 'constant' : j === 1 ? 'd’ordre 1' : `d’ordre ${j}`;
}

/** Déplier un terme / tronquer. */
export const taylorRules: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Taylor' || node.length !== 4) return [];
  const f = node[1] as Expr;
  const x = node[2];
  const k = node[3];
  if (typeof x !== 'string' || typeof k !== 'number') return [];
  const known = knownSeries(f, x);
  if (!known) return [];
  const moves: Move[] = [];

  const j = nextNonZero(known, k);
  if (j !== null) {
    const after = nextNonZero(known, j + 1) ?? MAX_ORDER + 1;
    const skipped = j > k && k > 0 ? ` (le terme d’ordre ${k} est nul)` : '';
    moves.push({
      ruleId: 'taylor-term',
      kind: 'tap',
      from,
      label: `Déplier le terme ${ordinal(j)} de ${known.name}${skipped}`,
      why:
        j === 0
          ? 'Le terme constant, c’est la valeur en 0 : la meilleure approximation « plate ».'
          : `Le coefficient d’ordre ${j} vaut f⁽${j}⁾(0)/${j}! : la dérivée ${j}-ième en 0, divisée par ${j}!. Chaque terme corrige la courbure que les précédents ratent.`,
      result: normalize(setAt(expr, from, ['Add', termOf(known, j, x), ['Taylor', f, x, after]])),
    });
  }

  // Tronquer : seulement une fois qu'au moins un terme est sorti, et dans une somme.
  if (k > 0 && from.length >= 1) {
    const parent = getAt(expr, from.slice(0, -1));
    if (parent !== undefined && isCall(parent) && parent[0] === 'Add') {
      let result = removeArgAt(expr, from);
      if (isCall(result) && result[0] === 'Equal') result = ['Approx', ...(result.slice(1) as Expr[])];
      moves.push({
        ruleId: 'taylor-truncate',
        kind: 'tap',
        from,
        label: 'Tronquer : on néglige le reste, = devient ≈',
        why: `Près de 0, xᵏ est minuscule devant les termes déjà sortis : on le jette. L’égalité devient une approximation — et on l’écrit.`,
        result: normalize(result),
      });
    }
  }
  return moves;
};

/** a + ar + ar² + ⋯ : sommer (|r| < 1) ou dérouler. */
export const geomSeriesRules: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'GeomSeries' || node.length !== 3) return [];
  const a = node[1] as Expr;
  const r = node[2] as Expr;
  const rv = evalNumeric(r);
  const moves: Move[] = [];
  if (rv === undefined || Math.abs(rv) < 1) {
    moves.push({
      ruleId: 'geom-sum',
      kind: 'tap',
      from,
      label: rv === undefined ? 'Sommer la série : a/(1 − r) (si |r| < 1)' : 'Sommer la série géométrique : a/(1 − r)',
      why: 'S = a + rS : la série contient une copie réduite d’elle-même. D’où S − rS = a, puis S = a/(1 − r). Zénon est vaincu : une infinité de morceaux, une somme finie.',
      result: setAt(expr, from, ['Divide', a, normalize(['Add', 1, ['Negate', r]])]),
    });
  }
  moves.push({
    ruleId: 'geom-shift',
    kind: 'tap',
    from,
    label: 'Dérouler : a + ar + ar² + ⋯ = a + r·(a + ar + ⋯)',
    why: 'Mets r en facteur dans tout ce qui suit le premier terme : on retrouve la série elle-même. C’est l’autoportrait qui permet de la sommer.',
    result: normalize(setAt(expr, from, ['Add', a, ['Multiply', r, node]])),
  });
  return moves;
};

export const seriesRules: Rule[] = [taylorRules, geomSeriesRules];

/** Pour les tests et le renderer : la série est-elle connue ? */
export function isKnownSeries(f: Expr, x: string): boolean {
  return knownSeries(f, x) !== null;
}
