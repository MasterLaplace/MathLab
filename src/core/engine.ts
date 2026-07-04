import { ComputeEngine } from '@cortex-js/compute-engine';
import { type Expr, evalNumeric, freeVariables, isCall, normalize, sameExpr, substitute } from './ast';

let ce: ComputeEngine | null = null;
function engine(): ComputeEngine {
  if (!ce) ce = new ComputeEngine();
  return ce;
}

/** Sérialise une expression en LaTeX (pour les textes de leçon et le debug). */
export function toLatex(expr: Expr): string {
  return engine().box(expr as Parameters<ComputeEngine['box']>[0]).latex;
}

/** Parse du LaTeX vers MathJSON (mode Playground). */
export function parseLatex(latex: string): Expr {
  return engine().parse(latex).json as Expr;
}

/**
 * L'objectif d'un exercice est-il atteint ? Comparaison canonique via
 * compute-engine, en acceptant `x = 4` aussi bien que `4 = x`.
 */
export function reachesGoal(current: Expr, goal: Expr, strict = false): boolean {
  // Comparaison structurelle d'abord : elle couvre aussi les têtes que
  // compute-engine ne connaît pas (PlusMinus, Root…).
  if (structurallySame(current, goal)) return true;
  if (strict) return false;
  // Un opérateur non résolu (dérivée, primitive, Laplace) doit rester un
  // geste de l'élève : compute-engine évaluerait D(x², x) = 2x et
  // « résoudrait » l'exercice à sa place.
  if (OPAQUE_HEADS.some((h) => containsHead(current, h) || containsHead(goal, h))) return false;
  try {
    const c = engine().box(current as Parameters<ComputeEngine['box']>[0]);
    const g = engine().box(goal as Parameters<ComputeEngine['box']>[0]);
    if (c.isSame(g)) return true;
    if (isCall(goal) && goal[0] === 'Equal') {
      const swapped: Expr = ['Equal', goal[2], goal[1]];
      return c.isSame(engine().box(swapped as Parameters<ComputeEngine['box']>[0]));
    }
  } catch {
    // tête inconnue du moteur : la comparaison structurelle a déjà tranché
  }
  return false;
}

const OPAQUE_HEADS = ['D', 'Int', 'LT', 'ILT'];

function containsHead(e: Expr, h: string): boolean {
  if (!isCall(e)) return false;
  if (e[0] === h) return true;
  return e.slice(1).some((a) => containsHead(a as Expr, h));
}

function structurallySame(a: Expr, b: Expr): boolean {
  const na = normalize(a);
  const nb = normalize(b);
  if (sameExpr(na, nb)) return true;
  if (isCall(na) && na[0] === 'Equal' && isCall(nb) && nb[0] === 'Equal') {
    return sameExpr(na[1] as Expr, nb[2] as Expr) && sameExpr(na[2] as Expr, nb[1] as Expr);
  }
  return false;
}

/**
 * Garde-fou : deux expressions (sans `Equal`) sont-elles numériquement
 * équivalentes ? Échantillonnage des variables libres.
 */
export function numericallyEquivalent(a: Expr, b: Expr): boolean {
  const vars = [...new Set([...freeVariables(a), ...freeVariables(b)])];
  const samples = [0.7, 1.3, 2.9, -1.7, 4.2];
  let compared = 0;
  for (let s = 0; s < samples.length; s++) {
    let ea: Expr = a;
    let eb: Expr = b;
    for (let k = 0; k < vars.length; k++) {
      const value = samples[(s + k) % samples.length] + k;
      ea = substitute(ea, vars[k], value);
      eb = substitute(eb, vars[k], value);
    }
    const va = evalNumeric(ea);
    const vb = evalNumeric(eb);
    if (va === undefined || vb === undefined) continue;
    compared++;
    if (Math.abs(va - vb) > 1e-9 * Math.max(1, Math.abs(va), Math.abs(vb))) return false;
  }
  return compared > 0;
}
