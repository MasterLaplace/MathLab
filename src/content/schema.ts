import type { Expr } from '../core/ast';

export interface Exercise {
  id: string;
  /** Consigne affichée à l'apprenant. */
  prompt: string;
  /** Équation ou expression de départ. */
  start: Expr;
  /** État à atteindre (comparé canoniquement). Absent pour une exploration libre. */
  goal?: Expr;
  /**
   * Comparaison structurelle uniquement : pour les exercices dont le but EST
   * le calcul (p = 3/6 → 0,5), l'équivalence sémantique validerait l'énoncé
   * lui-même.
   */
  strictGoal?: boolean;
  /** Exploration : pas d'objectif, un bouton « Continuer » valide l'étape. */
  free?: boolean;
  /** Indice affiché après un geste illégal. */
  hint?: string;
  /** Simulation ou visualisation affichée sous l'équation. */
  sim?: SimSpec;
}

export type SimSpec =
  | KinematicsSimSpec
  | TangentSimSpec
  | { type: 'area' }
  | { type: 'vector-field'; mode?: 'fields' | 'gradient' }
  | { type: 'spring' }
  | { type: 'vectors' }
  | { type: 'matrix'; mode?: 'transform' | 'eigen' }
  | { type: 'fourier' }
  | { type: 'surface3d'; fn?: SurfaceKind }
  | { type: 'unit-circle' }
  | { type: 'direction-field' }
  | { type: 'galton' }
  | { type: 'bayes' };

export type SurfaceKind = 'bowl' | 'saddle' | 'wave';

export interface KinematicsSimSpec {
  type: 'kinematics';
  /** Distance parcourue (m). */
  d: number;
  /** Durée (s). */
  t: number;
}

export interface TangentSimSpec {
  type: 'tangent';
}

/**
 * Bloc de cours : le contenu pédagogique riche d'une leçon.
 * Dans tous les champs texte, `$...$` est rendu en LaTeX via KaTeX.
 */
export type CourseBlock =
  /** Paragraphe de prose. */
  | { kind: 'p'; text: string }
  /** Équation mise en valeur, en mode display. */
  | { kind: 'math'; latex: string; caption?: string }
  /** Exemple travaillé pas à pas. */
  | { kind: 'example'; title?: string; steps: string[] }
  /** Encadré : intuition clé, piège classique, ou anecdote historique. */
  | { kind: 'callout'; tone: 'idea' | 'warn' | 'story'; text: string };

export interface Lesson {
  id: string;
  phase: number;
  title: string;
  /** Sous-titre court pour la carte du parcours. */
  tagline: string;
  /** Paragraphes d'introduction (texte simple, `$...$` rendu via KaTeX). */
  intro: string[];
  /** Cours riche affiché à la place de `intro` quand présent. */
  course?: CourseBlock[];
  exercises: Exercise[];
  /** Génère un exercice bonus aléatoire du même type (rejouabilité). */
  generator?: () => Exercise;
}
