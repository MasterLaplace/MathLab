import type { Expr, Path } from '../ast';
import { algebraRules } from './algebra';
import { cancelRules } from './cancel';
import { complexRules } from './complex';
import { deriveRules } from './derive';
import { equalityRules } from './equality';
import { integrateRules } from './integrate';
import { laplaceRules } from './laplace';
import { trigRules } from './trig';
import type { Move, Rule } from './types';

export type { Move, Rule } from './types';

const allRules: Rule[] = [
  ...equalityRules,
  ...cancelRules,
  ...algebraRules,
  ...deriveRules,
  ...integrateRules,
  ...laplaceRules,
  ...complexRules,
  ...trigRules,
];

/** Toutes les manipulations légales pour le nœud sélectionné. */
export function legalMoves(expr: Expr, from: Path): Move[] {
  return allRules.flatMap((rule) => rule(expr, from));
}
