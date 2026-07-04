/**
 * Représentation des expressions mathématiques, alignée sur MathJSON :
 * un nombre, un symbole (chaîne), ou un appel `[tête, ...arguments]`.
 *
 * Forme canonique interne :
 * - `Subtract(a, b)` est normalisé en `Add(a, Negate(b))`
 * - `Add` et `Multiply` sont n-aires et aplatis
 * - `Negate(nombre)` devient le nombre négatif
 */
export type Expr = number | string | ExprCall;
export type ExprCall = [string, ...Expr[]];

/** Chemin vers un sous-nœud : indices d'arguments (1 = premier argument). */
export type Path = number[];

export function isCall(e: Expr): e is ExprCall {
  return Array.isArray(e);
}

export function head(e: Expr): string | null {
  return isCall(e) ? e[0] : null;
}

export function args(e: Expr): Expr[] {
  return isCall(e) ? e.slice(1) : [];
}

export function getAt(expr: Expr, path: Path): Expr | undefined {
  let node: Expr = expr;
  for (const i of path) {
    if (!isCall(node) || i < 1 || i >= node.length) return undefined;
    node = node[i];
  }
  return node;
}

/** Remplace le nœud à `path` (immutable). */
export function setAt(expr: Expr, path: Path, replacement: Expr): Expr {
  if (path.length === 0) return replacement;
  if (!isCall(expr)) return expr;
  const [i, ...rest] = path;
  const copy = expr.slice() as ExprCall;
  copy[i] = setAt(expr[i], rest, replacement);
  return copy;
}

/**
 * Supprime un argument d'un nœud n-aire (`Add`/`Multiply`) désigné par le
 * chemin de l'argument. Si le parent n'a plus qu'un argument, il s'effondre
 * sur celui-ci ; s'il n'en a plus aucun, il devient son élément neutre.
 */
export function removeArgAt(expr: Expr, argPath: Path): Expr {
  const parentPath = argPath.slice(0, -1);
  const index = argPath[argPath.length - 1];
  const parent = getAt(expr, parentPath);
  if (parent === undefined || !isCall(parent)) return expr;
  const remaining = (parent.slice(1) as Expr[]).filter((_, k) => k + 1 !== index);
  let replacement: Expr;
  if (remaining.length === 0) {
    replacement = parent[0] === 'Multiply' ? 1 : 0;
  } else if (remaining.length === 1 && (parent[0] === 'Add' || parent[0] === 'Multiply')) {
    replacement = remaining[0];
  } else {
    replacement = [parent[0], ...remaining];
  }
  return setAt(expr, parentPath, replacement);
}

/** Négation "pédagogique" : enveloppe dans Negate, ou déballe un Negate existant. */
export function negateTerm(t: Expr): Expr {
  if (typeof t === 'number') return -t;
  if (isCall(t) && t[0] === 'Negate') return t[1];
  return ['Negate', t];
}

export function sameExpr(a: Expr, b: Expr): boolean {
  if (a === b) return true;
  if (isCall(a) && isCall(b) && a.length === b.length) {
    return a.every((x, i) => sameExpr(x, b[i] as Expr));
  }
  return false;
}

/**
 * Égalité structurelle à commutativité près : `3 + 3i` et `3i + 3` sont le
 * même état. Seuls `Add` et `Multiply` autorisent la permutation des
 * arguments (appariement multiset avec retour arrière — arités minuscules).
 */
export function sameExprUpToOrder(a: Expr, b: Expr): boolean {
  if (a === b) return true;
  if (!isCall(a) || !isCall(b) || a[0] !== b[0] || a.length !== b.length) return false;
  if (a[0] === 'Add' || a[0] === 'Multiply') {
    const rest = b.slice(1) as Expr[];
    const used = new Array<boolean>(rest.length).fill(false);
    const match = (i: number): boolean => {
      if (i >= a.length) return true;
      for (let j = 0; j < rest.length; j++) {
        if (used[j] || !sameExprUpToOrder(a[i] as Expr, rest[j])) continue;
        used[j] = true;
        if (match(i + 1)) return true;
        used[j] = false;
      }
      return false;
    };
    return match(1);
  }
  return a.every((x, i) => i === 0 || sameExprUpToOrder(x as Expr, b[i] as Expr));
}

/** Met en forme canonique : Subtract→Add/Negate, aplatit Add/Multiply, plie Negate. */
export function normalize(e: Expr): Expr {
  if (!isCall(e)) return e;
  const h = e[0];
  const a = e.slice(1).map((x) => normalize(x as Expr));
  if (h === 'Subtract' && a.length === 2) {
    return normalize(['Add', a[0], negateTerm(a[1])]);
  }
  if (h === 'Negate') {
    const inner = a[0];
    if (typeof inner === 'number') return -inner;
    if (isCall(inner) && inner[0] === 'Negate') return inner[1];
    return ['Negate', inner];
  }
  if (h === 'Add' || h === 'Multiply') {
    const flat: Expr[] = [];
    for (const x of a) {
      if (isCall(x) && x[0] === h) flat.push(...x.slice(1));
      else flat.push(x);
    }
    if (flat.length === 1) return flat[0];
    return [h, ...flat];
  }
  return [h, ...a];
}

/** Évalue numériquement un sous-arbre entièrement constant, sinon undefined. */
export function evalNumeric(e: Expr): number | undefined {
  if (typeof e === 'number') return e;
  if (typeof e === 'string') return undefined;
  const vals = e.slice(1).map((x) => evalNumeric(x as Expr));
  if (vals.some((v) => v === undefined)) return undefined;
  const v = vals as number[];
  switch (e[0]) {
    case 'Add':
      return v.reduce((s, x) => s + x, 0);
    case 'Multiply':
      return v.reduce((s, x) => s * x, 1);
    case 'Subtract':
      return v[0] - v[1];
    case 'Divide':
      return v[1] === 0 ? undefined : v[0] / v[1];
    case 'Negate':
      return -v[0];
    case 'Power':
      return Math.pow(v[0], v[1]);
    case 'Sqrt':
      return v[0] < 0 ? undefined : Math.sqrt(v[0]);
    case 'Ln':
      return v[0] <= 0 ? undefined : Math.log(v[0]);
    case 'Exp':
      return Math.exp(v[0]);
    case 'Log':
      return v[0] <= 0 || v[1] <= 0 ? undefined : Math.log(v[0]) / Math.log(v[1]);
    case 'Root': {
      const [x, n] = v;
      if (!Number.isInteger(n) || n < 2) return undefined;
      if (x < 0) return n % 2 === 1 ? -Math.pow(-x, 1 / n) : undefined;
      return Math.pow(x, 1 / n);
    }
    case 'Sin':
      return Math.sin(v[0]);
    case 'Cos':
      return Math.cos(v[0]);
    case 'Tan':
      return Math.tan(v[0]);
    case 'Arcsin':
      return Math.abs(v[0]) > 1 ? undefined : Math.asin(v[0]);
    case 'Arccos':
      return Math.abs(v[0]) > 1 ? undefined : Math.acos(v[0]);
    case 'Arctan':
      return Math.atan(v[0]);
    // PlusMinus a deux valeurs : pas d'évaluation unique.
    default:
      return undefined;
  }
}

/** Arrondit les artefacts flottants (0.30000000000000004 → 0.3). */
export function tidyNumber(n: number): number {
  const r = Math.round(n * 1e10) / 1e10;
  return Object.is(r, -0) ? 0 : r;
}

/** Remplace toutes les occurrences d'un symbole par une valeur. */
export function substitute(e: Expr, name: string, value: Expr): Expr {
  if (e === name) return value;
  if (!isCall(e)) return e;
  return [e[0], ...e.slice(1).map((x) => substitute(x as Expr, name, value))] as ExprCall;
}

/** Évalue l'expression pour des valeurs données des variables (undefined si impossible). */
export function evalAt(e: Expr, values: Record<string, number>): number | undefined {
  let out = e;
  for (const [name, v] of Object.entries(values)) out = substitute(out, name, v);
  return evalNumeric(out);
}

/** Liste les variables libres (symboles) de l'expression. */
export function freeVariables(e: Expr, out: Set<string> = new Set()): Set<string> {
  if (typeof e === 'string') out.add(e);
  else if (isCall(e)) for (const x of e.slice(1)) freeVariables(x as Expr, out);
  return out;
}
