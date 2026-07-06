import { type Expr, getAt, isCall, setAt } from '../ast';
import type { Rule } from './types';

/**
 * L'art de la preuve par gestes (station Z) — le geste fondateur est la
 * SUBSTITUTION : `['Subst', corps, variable, valeur]` remplace d'un tap
 * toutes les occurrences de la variable par la valeur.
 *
 * C'est le moteur de trois techniques :
 * - Récurrence : instancier P(n) en n = 1 (cas de base), puis transformer
 *   l'hypothèse P(k) en P(k+1) en substituant k → k+1.
 * - Absurde : injecter la forme supposée (a = 2c dans a² = 2b²) pour faire
 *   surgir la contradiction.
 * - Généralisation : vérifier une identité sur un cas concret.
 *
 * `Subst` est une tête opaque : tant qu'elle est là, le CAS ne « devine »
 * pas le résultat à la place de l'élève — c'est lui qui déclenche le calcul.
 */

/** Remplace toutes les occurrences du symbole `v` par `val` dans `e`. */
function substitute(e: Expr, v: string, val: Expr): Expr {
  if (typeof e === 'string') return e === v ? val : e;
  if (typeof e === 'number') return e;
  return [e[0], ...e.slice(1).map((x) => substitute(x as Expr, v, val))] as Expr;
}

/** Rendu compact d'une valeur pour le label du geste. */
function show(e: Expr): string {
  if (typeof e === 'number') return e < 0 ? `(${e})` : String(e);
  if (typeof e === 'string') return e;
  if (isCall(e) && e[0] === 'Add' && e.length === 3) return `${show(e[1])} + ${show(e[2])}`;
  if (isCall(e) && e[0] === 'Multiply' && e.length === 3) return `${show(e[1])}·${show(e[2])}`;
  return '(…)';
}

/**
 * Substituer : tap sur `['Subst', corps, v, valeur]` remplace v par la
 * valeur partout dans le corps et retire l'enveloppe Subst.
 */
export const substEval: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Subst' || node.length !== 4) return [];
  const body = node[1] as Expr;
  const v = node[2];
  const val = node[3] as Expr;
  if (typeof v !== 'string') return [];
  const result = substitute(body, v, val);
  return [
    {
      ruleId: 'subst',
      kind: 'tap',
      from,
      label: `On remplace ${v} par ${show(val)}`,
      why: `Substituer, c'est le seul geste dont la logique a besoin : partout où apparaît ${v}, on écrit ${show(val)}. Le reste de la preuve n'est plus que du calcul.`,
      result: setAt(expr, from, result),
    },
  ];
};

export const preuveRules: Rule[] = [substEval];
