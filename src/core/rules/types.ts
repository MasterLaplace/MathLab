import type { Expr, Path } from '../ast';

/**
 * Une manipulation légale proposée pour une sélection donnée.
 * - `drag` : l'utilisateur fait glisser le nœud `from` vers la zone `to`.
 * - `tap`  : un simple appui sur `from` applique la transformation.
 */
export interface Move {
  ruleId: string;
  kind: 'drag' | 'tap';
  from: Path;
  /** Zone de dépôt (chemin dans l'expression d'origine). Absent pour `tap`. */
  to?: Path;
  /** Explication pédagogique courte, en français. */
  label: string;
  /** « Pourquoi ? » : l'opération équivalente appliquée aux deux côtés. */
  why?: string;
  /** Expression complète après application. */
  result: Expr;
}

export type Rule = (expr: Expr, from: Path) => Move[];
