import { type Expr, freeVariables, getAt, isCall, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * La transformée de Laplace comme jeu de règles : ['LT', f] transpose une
 * fonction du temps t vers le domaine de s, ['ILT', F] ramène à la maison.
 * Chaque entrée de la table est un tap — l'ultime opération inverse.
 */

function dependsOnT(e: Expr): boolean {
  return freeVariables(e).has('t');
}

function tap(expr: Expr, from: number[], ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, replacement) };
}

/** Coefficient a dans un argument de la forme a·t (t, 3t, −2t…). */
function coefOfT(arg: Expr): number | undefined {
  if (arg === 't') return 1;
  if (isCall(arg) && arg[0] === 'Negate') {
    const inner = coefOfT(arg[1] as Expr);
    return inner === undefined ? undefined : -inner;
  }
  if (isCall(arg) && arg[0] === 'Multiply' && arg.length === 3 && typeof arg[1] === 'number' && arg[2] === 't') {
    return arg[1];
  }
  return undefined;
}

export const laplaceRules: Rule[] = [
  // ── Transformée directe : réécritures d'un nœud LT ──
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'LT' || node.length !== 2) return [];
    const body = node[1] as Expr;
    const moves: Move[] = [];

    // ℒ{c} = c/s
    if (!dependsOnT(body)) {
      moves.push(
        tap(
          expr,
          from,
          'lt-const',
          'ℒ{c} = c/s',
          'Une constante dans le temps devient une simple fraction en s : première ligne de la table.',
          ['Divide', body, 's'],
        ),
      );
      return moves;
    }

    // ℒ{t} = 1/s²
    if (body === 't') {
      moves.push(
        tap(expr, from, 'lt-t', 'ℒ{t} = 1/s²', 'La rampe du temps devient 1/s² : chaque intégration ajoute un « /s ».', ['Divide', 1, ['Power', 's', 2]]),
      );
      return moves;
    }

    if (isCall(body)) {
      const h = body[0];

      // ℒ{e^(a·t)} = 1/(s − a)
      if (h === 'Exp') {
        const a = coefOfT(body[1] as Expr);
        if (a !== undefined) {
          moves.push(
            tap(
              expr,
              from,
              'lt-exp',
              `ℒ{e^(${fmtCoef(a)}t)} = 1/(s ${a >= 0 ? '−' : '+'} ${Math.abs(a)})`,
              'L’exponentielle devient un pôle : un simple décalage de s. C’est la ligne la plus utile de la table.',
              ['Divide', 1, ['Add', 's', -a]],
            ),
          );
        }
      }

      // ℒ{sin(ωt)} = ω/(s² + ω²), ℒ{cos(ωt)} = s/(s² + ω²)
      if (h === 'Sin' || h === 'Cos') {
        const w = coefOfT(body[1] as Expr);
        if (w !== undefined && w > 0) {
          const denom: Expr = ['Add', ['Power', 's', 2], w * w];
          moves.push(
            h === 'Sin'
              ? tap(expr, from, 'lt-sin', `ℒ{sin ${fmtCoef(w)}t} = ${w}/(s² + ${w * w})`, 'Une oscillation devient une paire de pôles imaginaires : le dénominateur s² + ω² ne s’annule jamais sur l’axe réel.', ['Divide', w, denom])
              : tap(expr, from, 'lt-cos', `ℒ{cos ${fmtCoef(w)}t} = s/(s² + ${w * w})`, 'Même paire de pôles que le sinus ; le s au numérateur encode le départ à pleine hauteur.', ['Divide', 's', denom]),
          );
        }
      }

      // Linéarité : ℒ{f + g} = ℒ{f} + ℒ{g}
      if (h === 'Add' && body.length >= 3) {
        moves.push(
          tap(
            expr,
            from,
            'lt-sum',
            'ℒ d’une somme : chaque terme se transforme séparément',
            'La transformée est linéaire, comme la dérivée et l’intégrale avant elle.',
            ['Add', ...body.slice(1).map((a) => ['LT', a as Expr] as Expr)],
          ),
        );
      }

      // Linéarité : les constantes sortent
      if (h === 'Multiply') {
        const constants = body.slice(1).filter((a) => !dependsOnT(a as Expr)) as Expr[];
        const varying = body.slice(1).filter((a) => dependsOnT(a as Expr)) as Expr[];
        if (constants.length > 0 && varying.length > 0) {
          const rest: Expr = varying.length === 1 ? varying[0] : (['Multiply', ...varying] as Expr);
          moves.push(
            tap(expr, from, 'lt-const-factor', 'Les constantes sortent de ℒ', 'Linéarité, toujours : un facteur constant traverse la transformée.', ['Multiply', ...constants, ['LT', rest]]),
          );
        }
      }
    }

    return moves;
  },

  // ── Transformée inverse : réécritures d'un nœud ILT ──
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'ILT' || node.length !== 2) return [];
    const body = node[1] as Expr;
    const moves: Move[] = [];

    if (isCall(body) && body[0] === 'Divide') {
      const num = body[1] as Expr;
      const den = body[2] as Expr;

      // ℒ⁻¹{c/s} = c
      if (typeof num === 'number' && den === 's') {
        moves.push(
          tap(expr, from, 'ilt-const', `ℒ⁻¹{${num}/s} = ${num}`, 'Retour à la maison : c/s redevient la constante c.', num),
        );
      }

      // ℒ⁻¹{c/s²} = c·t
      if (typeof num === 'number' && isCall(den) && den[0] === 'Power' && den[1] === 's' && den[2] === 2) {
        moves.push(
          tap(expr, from, 'ilt-t', `ℒ⁻¹{${num}/s²} = ${num === 1 ? 't' : `${num}·t`}`, '1/s² redevient la rampe t.', num === 1 ? 't' : ['Multiply', num, 't']),
        );
      }

      // ℒ⁻¹{c/(s + a)} = c·e^(−a·t)
      if (
        typeof num === 'number' &&
        isCall(den) &&
        den[0] === 'Add' &&
        den.length === 3 &&
        den[1] === 's' &&
        typeof den[2] === 'number'
      ) {
        const a = den[2];
        const exp: Expr = ['Exp', ['Multiply', -a, 't']];
        moves.push(
          tap(
            expr,
            from,
            'ilt-exp',
            `ℒ⁻¹{${num}/(s ${a >= 0 ? '+' : '−'} ${Math.abs(a)})} = ${num === 1 ? '' : `${num}·`}e^(${fmtCoef(-a)}t)`,
            'Un pôle en s = −a redevient une exponentielle e^(−at) : la position du pôle EST le rythme de la réponse.',
            num === 1 ? exp : ['Multiply', num, exp],
          ),
        );
      }
    }

    // Linéarité : ℒ⁻¹{F + G}
    if (isCall(body) && body[0] === 'Add' && body.length >= 3) {
      moves.push(
        tap(
          expr,
          from,
          'ilt-sum',
          'ℒ⁻¹ d’une somme : chaque morceau revient séparément',
          'Linéarité dans les deux sens du voyage.',
          ['Add', ...body.slice(1).map((a) => ['ILT', a as Expr] as Expr)],
        ),
      );
    }

    return moves;
  },
];

function fmtCoef(a: number): string {
  if (a === 1) return '';
  if (a === -1) return '−';
  return String(a).replace('-', '−');
}
