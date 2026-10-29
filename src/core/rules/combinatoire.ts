import { type Expr, type Path, getAt, isCall, normalize, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * Compter sans compter (stations Y et T′) :
 * - `['Factorial', n]` : n! se pèle d'un facteur par tap, n! = n·(n−1)!,
 *   jusqu'à 1! = 0! = 1. Les factorielles se simplifient ensuite dans les
 *   fractions avec le geste d'annulation habituel (5!/3! = 5·4·3!/3!).
 * - `['Binom', n, k]` : « k parmi n ». Un tap propose la définition
 *   n!/(k!(n−k)!), la règle de Pascal C(n−1,k−1) + C(n−1,k), ou la symétrie
 *   C(n, n−k). Les bords se lisent directement : C(n,0) = C(n,n) = 1, C(n,1) = n.
 * Les deux têtes sont opaques pour le CAS : c'est l'élève qui compte.
 */

function asNat(e: Expr | undefined): number | null {
  return typeof e === 'number' && Number.isInteger(e) && e >= 0 ? e : null;
}

function tap(expr: Expr, from: Path, ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, normalize(replacement)) };
}

/** n − 1, calculé si n est un nombre, laissé symbolique sinon. */
function minusOne(n: Expr): Expr {
  return typeof n === 'number' ? n - 1 : normalize(['Add', n, -1]);
}

/** n! → n·(n−1)! ; 0! et 1! → 1. */
export const factorialPeel: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Factorial' || node.length !== 2) return [];
  const n = node[1] as Expr;
  const k = asNat(n);
  if (k !== null && k <= 1) {
    return [
      tap(expr, from, 'fact-base', `${k}! = 1`,
        k === 0
          ? 'Ranger zéro objet : il n’y a qu’une façon de le faire — ne rien faire. C’est aussi ce qui fait marcher n! = n·(n−1)! jusqu’au bout.'
          : 'Un seul objet ne se range que d’une seule façon.',
        1),
    ];
  }
  if (typeof n === 'number' && k === null) return [];
  return [
    tap(expr, from, 'fact-peel', 'On pèle un facteur : n! = n·(n−1)!',
      'Pour ranger n objets, on choisit d’abord celui qui va en tête (n choix), puis on range les n − 1 autres : (n−1)! façons.',
      ['Multiply', n, ['Factorial', minusOne(n)]]),
  ];
};

/** Les visages de C(n, k) : définition, Pascal, symétrie, bords. */
export const binomRules: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Binom' || node.length !== 3) return [];
  const nE = node[1] as Expr;
  const kE = node[2] as Expr;
  const n = asNat(nE);
  const k = asNat(kE);

  // Les bords : choisir rien, ou tout.
  if (k === 0 || (n !== null && k !== null && k === n)) {
    return [tap(expr, from, 'binom-edge', k === 0 ? 'Choisir 0 objet : une seule façon' : 'Choisir tous les objets : une seule façon',
      'Ne rien prendre, ou tout prendre : il n’y a aucun choix à faire. Ce sont les 1 des bords du triangle de Pascal.', 1)];
  }
  if (k === 1) {
    return [tap(expr, from, 'binom-edge', `Choisir 1 objet parmi ${typeof nE === 'number' ? nE : 'n'} : autant de façons que d’objets`,
      'Un seul élu : chacun des n objets peut l’être.', nE)];
  }

  const moves: Move[] = [];
  // Définition : n! / (k!·(n−k)!).
  const nMinusK: Expr = n !== null && k !== null ? n - k : normalize(['Add', nE, ['Negate', kE]]);
  moves.push(tap(expr, from, 'binom-def', 'Définition : C(n, k) = n! / (k!·(n − k)!)',
    'On range les n objets en file (n! façons), on garde les k premiers… mais l’ordre à l’intérieur des élus (k!) et des recalés ((n−k)!) ne compte pas : on divise.',
    ['Divide', ['Factorial', nE], ['Multiply', ['Factorial', kE], ['Factorial', nMinusK]]]));

  if (n !== null && k !== null && k > 0 && k < n) {
    moves.push(tap(expr, from, 'binom-pascal', `Règle de Pascal : C(${n}, ${k}) = C(${n - 1}, ${k - 1}) + C(${n - 1}, ${k})`,
      'Regarde le dernier objet : soit il est choisi (il reste k − 1 élus à prendre parmi n − 1), soit il ne l’est pas (k élus parmi n − 1). Deux cas qui ne se recouvrent pas : on additionne.',
      ['Add', ['Binom', n - 1, k - 1], ['Binom', n - 1, k]]));
    if (2 * k > n) {
      moves.push(tap(expr, from, 'binom-sym', `Symétrie : C(${n}, ${k}) = C(${n}, ${n - k})`,
        'Choisir les k élus, c’est exactement choisir les n − k recalés : le triangle de Pascal est symétrique.',
        ['Binom', n, n - k]));
    }
  }
  return moves;
};

export const combinatoireRules: Rule[] = [factorialPeel, binomRules];
