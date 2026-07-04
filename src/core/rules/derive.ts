import { type Expr, freeVariables, getAt, isCall, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * La dérivée comme jeu de règles : un nœud ['D', corps, 'x'] se réécrit
 * par taps successifs. Rien n'est jamais dérivé automatiquement — chaque
 * règle est un geste, exactement comme le reste du moteur.
 */

/** L'expression dépend-elle de la variable ? */
function dependsOn(e: Expr, v: string): boolean {
  return freeVariables(e).has(v);
}

function tap(expr: Expr, from: number[], ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, replacement) };
}

/** Toutes les réécritures possibles d'un nœud D sélectionné. */
export const deriveRules: Rule[] = [
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'D' || node.length !== 3) return [];
    const body = node[1] as Expr;
    const v = node[2];
    if (typeof v !== 'string') return [];
    const moves: Move[] = [];

    // d/dx (constante) = 0 — tout ce qui ne dépend pas de x est une constante.
    if (!dependsOn(body, v)) {
      moves.push(
        tap(
          expr,
          from,
          'derive-const',
          'La dérivée d’une constante est nulle',
          'Une quantité qui ne dépend pas de la variable ne varie pas : sa pente est 0.',
          0,
        ),
      );
      return moves;
    }

    // d/dx (x) = 1
    if (body === v) {
      moves.push(
        tap(
          expr,
          from,
          'derive-id',
          'La dérivée de la variable elle-même vaut 1',
          `${v} grandit exactement au rythme de ${v} : pente 1 partout.`,
          1,
        ),
      );
      return moves;
    }

    if (isCall(body)) {
      const h = body[0];

      // d/dx (xⁿ) = n·xⁿ⁻¹
      if (h === 'Power' && body[1] === v && typeof body[2] === 'number') {
        const n = body[2];
        const reduced: Expr =
          n === 2 ? v : (['Power', v, n - 1] as Expr);
        moves.push(
          tap(
            expr,
            from,
            'derive-power',
            `La puissance descend : (${v}${sup(n)})′ = ${n}·${v}${n === 2 ? '' : sup(n - 1)}`,
            'L’exposant descend en facteur et diminue de 1 : c’est la règle de la puissance.',
            ['Multiply', n, reduced],
          ),
        );
      }

      // d/dx (f + g) = f′ + g′ — la dérivée se distribue sur la somme.
      if (h === 'Add' && body.length >= 3) {
        moves.push(
          tap(
            expr,
            from,
            'derive-sum',
            'La dérivée d’une somme est la somme des dérivées',
            'Chaque terme varie indépendamment : on dérive terme à terme (linéarité).',
            ['Add', ...body.slice(1).map((t) => ['D', t as Expr, v] as Expr)],
          ),
        );
      }

      // d/dx (Negate f) = −f′
      if (h === 'Negate') {
        moves.push(
          tap(
            expr,
            from,
            'derive-neg',
            'Le signe − sort de la dérivée',
            'Changer le signe d’une fonction change le signe de sa pente.',
            ['Negate', ['D', body[1] as Expr, v]],
          ),
        );
      }

      // d/dx (c·f) = c·f′ — les constantes sortent.
      if (h === 'Multiply') {
        const constants = body.slice(1).filter((a) => !dependsOn(a as Expr, v)) as Expr[];
        const varying = body.slice(1).filter((a) => dependsOn(a as Expr, v)) as Expr[];
        if (constants.length > 0 && varying.length > 0) {
          const rest: Expr = varying.length === 1 ? varying[0] : (['Multiply', ...varying] as Expr);
          moves.push(
            tap(
              expr,
              from,
              'derive-const-factor',
              'Les constantes sortent de la dérivée',
              'Un facteur constant étire la courbe : il étire la pente du même facteur.',
              ['Multiply', ...constants, ['D', rest, v]],
            ),
          );
        }
        // d/dx (f·g) = f′·g + f·g′ — règle du produit (deux facteurs variables).
        if (varying.length === 2 && constants.length === 0) {
          const [f, g] = varying;
          moves.push(
            tap(
              expr,
              from,
              'derive-product',
              'Règle du produit : (f·g)′ = f′·g + f·g′',
              'Quand deux quantités varient ensemble, chacune contribue pendant que l’autre est figée.',
              ['Add', ['Multiply', ['D', f, v], g], ['Multiply', f, ['D', g, v]]],
            ),
          );
        }
      }

      // Fonctions célèbres, argument exactement x.
      if (body.length === 2 && body[1] === v) {
        if (h === 'Sin') {
          moves.push(
            tap(expr, from, 'derive-sin', '(sin)′ = cos', 'La pente de la sinusoïde est décalée d’un quart de tour : c’est le cosinus.', ['Cos', v]),
          );
        }
        if (h === 'Cos') {
          moves.push(
            tap(expr, from, 'derive-cos', '(cos)′ = −sin', 'Même décalage d’un quart de tour, avec un signe − : le cosinus descend quand le sinus est positif.', ['Negate', ['Sin', v]]),
          );
        }
        if (h === 'Exp') {
          moves.push(
            tap(expr, from, 'derive-exp', '(eˣ)′ = eˣ', 'L’exponentielle est la fonction qui croît à la vitesse de sa propre valeur : elle est sa propre dérivée.', ['Exp', v]),
          );
        }
        if (h === 'Ln') {
          moves.push(
            tap(expr, from, 'derive-ln', '(ln)′ = 1/x', 'Le logarithme grimpe de plus en plus lentement : sa pente est l’inverse de la position.', ['Divide', 1, v]),
          );
        }
      }
    }

    return moves;
  },
];

function sup(n: number): string {
  const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  return String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
}
