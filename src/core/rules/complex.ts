import { type Expr, getAt, isCall, normalize, sameExpr, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * Le nombre i par gestes : le cycle des puissances (i² = −1, un quart de
 * tour au carré fait demi-tour) et la formule d'Euler e^{iθ} = cos θ + i·sin θ
 * — la rotation écrite comme une exponentielle. Rien n'est jamais évalué
 * automatiquement : chaque identité est un tap.
 */

function tap(expr: Expr, from: number[], ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, replacement) };
}

/** iⁿ pour n mod 4 = 0, 1, 2, 3 : le cycle 1, i, −1, −i. */
const CYCLE: Expr[] = [1, 'i', -1, ['Negate', 'i']];
const CYCLE_TXT = ['1', 'i', '−1', '−i'];

/** Si `e` est un produit contenant exactement un facteur `i`, renvoie le reste (θ). */
function imaginaryAngle(e: Expr): Expr | null {
  if (!isCall(e) || e[0] !== 'Multiply') return null;
  const factors = e.slice(1) as Expr[];
  const idx = factors.findIndex((f) => f === 'i');
  if (idx === -1 || factors.some((f, k) => k !== idx && f === 'i')) return null;
  const rest = factors.filter((_, k) => k !== idx);
  if (rest.length === 0) return null;
  return rest.length === 1 ? rest[0] : (['Multiply', ...rest] as Expr);
}

export const complexRules: Rule[] = [
  // iⁿ → sa valeur dans le cycle 1, i, −1, −i.
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Power' || node[1] !== 'i') return [];
    const n = node[2];
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 2) return [];
    return [
      tap(
        expr,
        from,
        'i-power',
        n === 2 ? 'i² = −1 : c’est la définition de i' : `iⁿ retombe dans le cycle : i${sup(n)} = ${CYCLE_TXT[n % 4]}`,
        'Multiplier par i, c’est tourner d’un quart de tour : deux quarts de tour font un demi-tour (−1), et quatre ramènent au départ (1).',
        CYCLE[n % 4],
      ),
    ];
  },

  // e^{iθ} → cos θ + i·sin θ (formule d'Euler, sens « déplier »).
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Exp') return [];
    const theta = imaginaryAngle(node[1] as Expr);
    if (theta === null) return [];
    return [
      tap(
        expr,
        from,
        'euler-expand',
        'Formule d’Euler : e^{iθ} = cos θ + i·sin θ',
        'L’exponentielle imaginaire parcourt le cercle unité : sa partie réelle est le cosinus de l’angle, sa partie imaginaire le sinus.',
        ['Add', ['Cos', theta], ['Multiply', 'i', ['Sin', theta]]],
      ),
    ];
  },

  // cos θ + i·sin θ → e^{iθ} (le repli, même identité dans l'autre sens).
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Add' || node.length !== 3) return [];
    const terms = [node[1] as Expr, node[2] as Expr];
    for (const [a, b] of [[terms[0], terms[1]], [terms[1], terms[0]]] as const) {
      if (!isCall(a) || a[0] !== 'Cos' || a.length !== 2) continue;
      const theta = a[1] as Expr;
      if (!isCall(b) || b[0] !== 'Multiply' || b.length !== 3) continue;
      const factors = [b[1] as Expr, b[2] as Expr];
      const iIdx = factors.findIndex((f) => f === 'i');
      if (iIdx === -1) continue;
      const s = factors[1 - iIdx];
      if (!isCall(s) || s[0] !== 'Sin' || !sameExpr(s[1] as Expr, theta)) continue;
      return [
        tap(
          expr,
          from,
          'euler-fold',
          'Replier Euler : cos θ + i·sin θ = e^{iθ}',
          'Un cosinus et son sinus au même angle, c’est un point du cercle unité : il se range en une seule exponentielle.',
          ['Exp', normalize(['Multiply', 'i', theta])],
        ),
      ];
    }
    return [];
  },
  // (e^{θ})ⁿ → e^{n·θ} : élever une exponentielle à une puissance multiplie l'angle.
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Power') return [];
    const base = node[1];
    const n = node[2];
    if (!isCall(base) || base[0] !== 'Exp' || typeof n !== 'number' || !Number.isInteger(n) || n < 2) {
      return [];
    }
    return [
      tap(
        expr,
        from,
        'exp-power',
        `(e^θ)${sup(n)} = e^{${n}θ} : la puissance multiplie l’angle`,
        'Multiplier des exponentielles additionne leurs exposants : n copies du même angle font n fois l’angle. Sur le cercle, élever à la puissance n, c’est tourner n fois plus loin.',
        ['Exp', scaleAngle(base[1] as Expr, n)],
      ),
    ];
  },
  // Conjugué : z̄ se déplie par gestes — miroir du plan complexe.
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Conj' || node.length !== 2) return [];
    const z = node[1] as Expr;
    if (typeof z === 'number') {
      return [
        tap(expr, from, 'conj-real', `Un réel est son propre conjugué : ${z}̄ = ${z}`,
          'Le conjugué est le miroir par rapport à l’axe réel : un point de l’axe ne bouge pas.', z),
      ];
    }
    if (z === 'i') {
      return [
        tap(expr, from, 'conj-i', 'ī = −i : le miroir renverse l’axe imaginaire',
          'Conjuguer, c’est réfléchir par rapport à l’axe réel : i (en haut) devient −i (en bas).', ['Negate', 'i']),
      ];
    }
    if (isCall(z) && z[0] === 'Add') {
      return [
        tap(expr, from, 'conj-add', 'Le conjugué d’une somme est la somme des conjugués',
          'Le miroir réfléchit chaque terme séparément : conj(a + b) = conj(a) + conj(b).',
          ['Add', ...(z.slice(1) as Expr[]).map((t): Expr => ['Conj', t])]),
      ];
    }
    if (isCall(z) && z[0] === 'Multiply') {
      return [
        tap(expr, from, 'conj-mult', 'Le conjugué d’un produit est le produit des conjugués',
          'Les modules se multiplient et les angles s’additionnent — au miroir, chaque angle change de signe : conj(a·b) = conj(a)·conj(b).',
          ['Multiply', ...(z.slice(1) as Expr[]).map((f): Expr => ['Conj', f])]),
      ];
    }
    if (isCall(z) && z[0] === 'Negate') {
      return [
        tap(expr, from, 'conj-neg', 'Le conjugué traverse le signe moins',
          'Le miroir de l’opposé est l’opposé du miroir : conj(−u) = −conj(u).',
          ['Negate', ['Conj', z[1] as Expr]]),
      ];
    }
    return [];
  },
];

/** n·θ, en repliant n dans un éventuel dénominateur : 3·(2π/3) → 2π. */
function scaleAngle(theta: Expr, n: number): Expr {
  const factors = isCall(theta) && theta[0] === 'Multiply' ? (theta.slice(1) as Expr[]) : [theta];
  const dIdx = factors.findIndex(
    (f) => isCall(f) && f[0] === 'Divide' && typeof f[2] === 'number' && n % (f[2] as number) === 0,
  );
  if (dIdx !== -1) {
    const div = factors[dIdx] as [string, Expr, number];
    const k = n / div[2];
    const num = div[1];
    const numFactors = isCall(num) && num[0] === 'Multiply' ? (num.slice(1) as Expr[]) : [num];
    const rest = [...factors.slice(0, dIdx), ...factors.slice(dIdx + 1)];
    const all = k === 1 ? [...rest, ...numFactors] : [k, ...rest, ...numFactors];
    return all.length === 1 ? all[0] : normalize(['Multiply', ...all]);
  }
  return normalize(['Multiply', n, ...factors]);
}

function sup(n: number): string {
  const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  return String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
}
