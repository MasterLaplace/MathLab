import { type Expr, type Path, getAt, isCall, normalize, removeArgAt, sameExpr, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * Les règles du logarithme par gestes (station C) — « le log transforme ×
 * en + », et son miroir « l'exponentielle transforme + en × ».
 * Têtes : `['Ln', u]` et `['Log', u, base]`.
 * - `log-product`  : ln(a·b) → ln a + ln b (tap)          ⇄ `log-merge` (glisser ln a sur ln b)
 * - `log-quotient` : ln(a/b) → ln a − ln b (tap)          ⇄ `log-merge` (glisser ln a sur −ln b)
 * - `log-power`    : ln(aⁿ) → n·ln a (tap)                ⇄ `log-power-up` (glisser n sur ln a)
 * - `log-exact`    : log_b(bᵏ) → k, log_b(b) → 1, ln 1 → 0, ln(eᵘ) → u
 * - `log-change-base` : log_b(x) → ln x / ln b
 * - `exp-merge` : eᵃ·eᵇ → eᵃ⁺ᵇ (glisser) ; `exp-quotient` : eᵃ/eᵇ → eᵃ⁻ᵇ (tap)
 */

/** Un nœud logarithme : sa fonction de reconstruction et son argument. */
interface LogNode {
  arg: Expr;
  /** Reconstruit un log de même base autour d'un nouvel argument. */
  wrap: (u: Expr) => Expr;
  name: string;
}

function asLog(e: Expr | undefined): LogNode | null {
  if (e === undefined || !isCall(e)) return null;
  if (e[0] === 'Ln' && e.length === 2) return { arg: e[1] as Expr, wrap: (u) => ['Ln', u], name: 'ln' };
  if (e[0] === 'Log' && e.length === 3) {
    const base = e[2] as Expr;
    return { arg: e[1] as Expr, wrap: (u) => ['Log', u, base], name: `log${typeof base === 'number' ? subscript(base) : ''}` };
  }
  return null;
}

function sameBase(a: Expr, b: Expr): boolean {
  if (!isCall(a) || !isCall(b) || a[0] !== b[0]) return false;
  return a[0] === 'Ln' || sameExpr(a[2] as Expr, b[2] as Expr);
}

function subscript(n: number): string {
  const digits = '₀₁₂₃₄₅₆₇₈₉';
  return String(n)
    .split('')
    .map((c) => (c >= '0' && c <= '9' ? digits[Number(c)] : c))
    .join('');
}

function tap(expr: Expr, from: Path, ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, normalize(replacement)) };
}

/** ln(a·b·…) → ln a + ln b + …, ln(a/b) → ln a − ln b, ln(aⁿ) → n·ln a. */
export const logSplit: Rule = (expr, from) => {
  const node = getAt(expr, from);
  const log = asLog(node);
  if (!log || !isCall(log.arg)) return [];
  const u = log.arg;
  if (u[0] === 'Multiply') {
    const parts = (u.slice(1) as Expr[]).map((f) => log.wrap(f));
    return [
      tap(expr, from, 'log-product', `Le ${log.name} d’un produit est la somme des ${log.name}`,
        'Multiplier des nombres, c’est additionner leurs exposants : le logarithme, qui LIT l’exposant, transforme donc × en +. C’est tout le secret de la règle à calcul.',
        ['Add', ...parts]),
    ];
  }
  if (u[0] === 'Divide') {
    return [
      tap(expr, from, 'log-quotient', `Le ${log.name} d’un quotient est la différence des ${log.name}`,
        'Diviser, c’est soustraire les exposants : ÷ devient −.',
        ['Add', log.wrap(u[1] as Expr), ['Negate', log.wrap(u[2] as Expr)]]),
    ];
  }
  if (u[0] === 'Power' && !(node && isCall(node) && node[0] === 'Log' && sameExpr(u[1] as Expr, node[2] as Expr))) {
    return [
      tap(expr, from, 'log-power', `L’exposant descend devant le ${log.name}`,
        'aⁿ = a·a·…·a (n fois) : le log de ce produit est n fois le log de a. L’exposant devient un simple facteur.',
        ['Multiply', u[2] as Expr, log.wrap(u[1] as Expr)]),
    ];
  }
  return [];
};

/** Valeurs exactes : log_b(bᵏ) = k, log_b(b) = 1, log(1) = 0, ln(eᵘ) = u. */
export const logExact: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node)) return [];
  if (node[0] === 'Ln' && node.length === 2) {
    const u = node[1] as Expr;
    if (u === 1) return [tap(expr, from, 'log-exact', 'ln 1 = 0', 'e⁰ = 1 : il faut l’exposant 0 pour obtenir 1.', 0)];
    if (isCall(u) && u[0] === 'Exp') {
      return [tap(expr, from, 'log-exact', 'ln défait l’exponentielle : ln(eᵘ) = u', 'Le logarithme répond à la question « e puissance combien ? » — ici, la réponse est écrite.', u[1] as Expr)];
    }
    return [];
  }
  if (node[0] !== 'Log' || node.length !== 3) return [];
  const u = node[1] as Expr;
  const b = node[2] as Expr;
  if (u === 1) return [tap(expr, from, 'log-exact', 'log(1) = 0', 'b⁰ = 1 quelle que soit la base.', 0)];
  if (sameExpr(u, b)) return [tap(expr, from, 'log-exact', 'log_b(b) = 1', 'b¹ = b : il faut l’exposant 1.', 1)];
  if (isCall(u) && u[0] === 'Power' && sameExpr(u[1] as Expr, b)) {
    return [tap(expr, from, 'log-exact', 'Le log défait la puissance : log_b(bᵏ) = k', 'Le logarithme en base b répond à « b puissance combien ? » — l’exposant est sous nos yeux.', u[2] as Expr)];
  }
  if (typeof u === 'number' && typeof b === 'number' && b > 1 && u > 0) {
    const k = Math.round(Math.log(u) / Math.log(b));
    if (k >= 2 && Math.pow(b, k) === u) {
      return [tap(expr, from, 'log-exact', `${b}${superscript(k)} = ${u}, donc log${subscript(b)}(${u}) = ${k}`, `Compter les facteurs ${b} : ${u} = ${Array(k).fill(b).join(' × ')}.`, k)];
    }
  }
  return [];
};

function superscript(n: number): string {
  const digits = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  return String(n)
    .split('')
    .map((c) => digits[Number(c)] ?? c)
    .join('');
}

/** Changement de base : log_b(x) = ln x / ln b. */
export const logChangeBase: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Log' || node.length !== 3) return [];
  const u = node[1] as Expr;
  const b = node[2] as Expr;
  if (sameExpr(u, b) || u === 1) return [];
  return [
    tap(expr, from, 'log-change-base', 'Changer de base : log_b(x) = ln x / ln b',
      'Tous les logarithmes sont proportionnels : passer de la base e à la base b, c’est changer d’unité, comme passer des mètres aux pieds.',
      ['Divide', ['Ln', u], ['Ln', b]]),
  ];
};

/**
 * Fusionner : dans une somme, glisser ln a sur ln b → ln(a·b) ; sur −ln b → ln(a/b).
 * Les deux logs doivent être de même base.
 */
export const logMerge: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Add') return [];
  const index = from[from.length - 1];
  const source = parent[index] as Expr;
  const srcLog = asLog(source);
  if (!srcLog) return [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = parent[i] as Expr;
    const negated = isCall(target) && target[0] === 'Negate';
    const tgt = negated ? (target as Expr[])[1] : target;
    const tgtLog = asLog(tgt);
    if (!tgtLog || !sameBase(source, tgt)) continue;
    const merged = negated
      ? srcLog.wrap(['Divide', srcLog.arg, tgtLog.arg])
      : srcLog.wrap(normalize(['Multiply', srcLog.arg, tgtLog.arg]));
    let result = setAt(expr, [...parentPath, i], merged);
    result = removeArgAt(result, from);
    return [
      {
        ruleId: 'log-merge',
        kind: 'drag',
        from,
        to: [...parentPath, i],
        label: negated ? 'Deux logs qui se soustraient fusionnent en log d’un quotient' : 'Deux logs qui s’additionnent fusionnent en log d’un produit',
        why: 'C’est la règle du produit lue à l’envers : + redevient ×.',
        result: normalize(result),
      },
    ];
  }
  return [];
};

/** Remonter l'exposant : dans n·ln a, glisser n sur ln a → ln(aⁿ). */
export const logPowerUp: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Multiply' || parent.length !== 3) return [];
  const index = from[from.length - 1];
  const other = index === 1 ? 2 : 1;
  const n = parent[index] as Expr;
  const log = asLog(parent[other] as Expr);
  if (!log || asLog(n)) return [];
  return [
    {
      ruleId: 'log-power-up',
      kind: 'drag',
      from,
      to: [...parentPath, other],
      label: 'Le facteur remonte en exposant : n·ln a = ln(aⁿ)',
      why: 'La règle de la puissance lue à l’envers.',
      result: setAt(expr, parentPath, log.wrap(['Power', log.arg, n])),
    },
  ];
};

/** eᵃ·eᵇ → eᵃ⁺ᵇ : glisser une exponentielle sur une autre dans un produit. */
export const expMerge: Rule = (expr, from) => {
  if (from.length === 0) return [];
  const parentPath = from.slice(0, -1);
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent) || parent[0] !== 'Multiply') return [];
  const index = from[from.length - 1];
  const source = parent[index] as Expr;
  if (!isCall(source) || source[0] !== 'Exp') return [];
  for (let i = 1; i < parent.length; i++) {
    if (i === index) continue;
    const target = parent[i] as Expr;
    if (!isCall(target) || target[0] !== 'Exp') continue;
    let result = setAt(expr, [...parentPath, i], ['Exp', normalize(['Add', source[1] as Expr, target[1] as Expr])]);
    result = removeArgAt(result, from);
    return [
      {
        ruleId: 'exp-merge',
        kind: 'drag',
        from,
        to: [...parentPath, i],
        label: 'eᵃ · eᵇ = eᵃ⁺ᵇ : les exposants s’additionnent',
        why: 'L’exponentielle transforme + en × — c’est le miroir exact du logarithme.',
        result: normalize(result),
      },
    ];
  }
  return [];
};

/** eᵃ / eᵇ → eᵃ⁻ᵇ (tap sur la fraction). */
export const expQuotient: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Divide') return [];
  const a = node[1] as Expr;
  const b = node[2] as Expr;
  if (!isCall(a) || a[0] !== 'Exp' || !isCall(b) || b[0] !== 'Exp') return [];
  return [
    tap(expr, from, 'exp-quotient', 'eᵃ / eᵇ = eᵃ⁻ᵇ : les exposants se soustraient',
      'Diviser par eᵇ, c’est multiplier par e⁻ᵇ. C’est ce rapport qui fixe la population relative de deux niveaux d’énergie (Boltzmann).',
      ['Exp', ['Add', a[1] as Expr, ['Negate', b[1] as Expr]]]),
  ];
};

export const logRules: Rule[] = [logSplit, logExact, logChangeBase, logMerge, logPowerUp, expMerge, expQuotient];
