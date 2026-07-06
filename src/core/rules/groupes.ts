import { type Expr, getAt, isCall, setAt } from '../ast';
import type { Rule } from './types';

/**
 * Le groupe des symétries du carré (D₄) par gestes — le premier calcul sur
 * des objets qui ne sont pas des nombres : les 8 symétries sont des symboles
 * de l'AST, et `['Compose', a, b]` (lire « a après b » : b s'applique
 * d'abord) se réduit d'un tap grâce à la table de Cayley. `['Inv', g]`
 * donne l'inverse ; l'inverse d'une composition se retourne comme des
 * chaussettes : (a∘b)⁻¹ = b⁻¹∘a⁻¹.
 *
 * Représentation interne : chaque élément est r^k f^ε — k quarts de tour
 * (sens antihoraire) suivis éventuellement du miroir horizontal f, avec la
 * relation f·r = r⁻¹·f. La composition et l'inversion sont calculées, pas
 * tabulées à la main : impossible de se tromper dans la table.
 */

interface Dihedral {
  /** Quarts de tour (0–3). */
  k: number;
  /** 1 si l'élément contient le miroir. */
  f: 0 | 1;
}

/** Les 8 éléments : symbole AST → forme normale r^k f^ε. */
const ELEMENTS: Record<string, Dihedral> = {
  idS: { k: 0, f: 0 },
  r90: { k: 1, f: 0 },
  r180: { k: 2, f: 0 },
  r270: { k: 3, f: 0 },
  sH: { k: 0, f: 1 }, // miroir horizontal (axe horizontal)
  sD: { k: 1, f: 1 }, // miroir diagonal (axe y = x)
  sV: { k: 2, f: 1 }, // miroir vertical
  sA: { k: 3, f: 1 }, // miroir anti-diagonal (axe y = −x)
};

const PRETTY: Record<string, string> = {
  idS: '𝟙',
  r90: 'r',
  r180: 'r²',
  r270: 'r³',
  sH: 'h',
  sV: 'v',
  sD: 'd',
  sA: 'd′',
};

/** Nom affiché d'un élément (pour les labels pédagogiques). */
export function symName(sym: string): string {
  return PRETTY[sym] ?? sym;
}

function toSymbol(g: Dihedral): string {
  for (const [name, val] of Object.entries(ELEMENTS)) {
    if (val.k === g.k && val.f === g.f) return name;
  }
  /* istanbul ignore next -- les 8 formes normales sont toutes tabulées */
  throw new Error('élément D₄ inconnu');
}

/** a ∘ b : on applique b d'abord, puis a (f·r^k = r^{-k}·f). */
export function composeD4(a: Dihedral, b: Dihedral): Dihedral {
  const k = (a.k + (a.f === 1 ? (4 - b.k) % 4 : b.k)) % 4;
  return { k, f: (a.f ^ b.f) as 0 | 1 };
}

export function inverseD4(g: Dihedral): Dihedral {
  return g.f === 1 ? g : { k: (4 - g.k) % 4, f: 0 };
}

function asElement(e: Expr | undefined): { sym: string; g: Dihedral } | null {
  if (typeof e !== 'string' || !(e in ELEMENTS)) return null;
  return { sym: e, g: ELEMENTS[e] };
}

/**
 * Réduire une composition : tap sur le nœud `Compose` fusionne la paire la
 * plus à droite (celle qui agit en premier) de deux éléments connus.
 */
export const symCompose: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Compose' || node.length < 3) return [];
  const args = node.slice(1) as Expr[];
  // Paire adjacente la plus à droite : « on applique d'abord ce qui est à droite ».
  for (let i = args.length - 2; i >= 0; i--) {
    const a = asElement(args[i]);
    const b = asElement(args[i + 1]);
    if (!a || !b) continue;
    const product = toSymbol(composeD4(a.g, b.g));
    const rest = [...args.slice(0, i), product as Expr, ...args.slice(i + 2)];
    const result: Expr = rest.length === 1 ? rest[0] : ['Compose', ...rest];
    return [
      {
        ruleId: 'sym-compose',
        kind: 'tap',
        from,
        label: `${symName(a.sym)} ∘ ${symName(b.sym)} = ${symName(product)}`,
        why: `On applique d'abord ${symName(b.sym)}, puis ${symName(a.sym)} : suivre les coins du carré montre que l'effet total est exactement ${symName(product)}. Composer deux symétries donne toujours une symétrie — c'est la fermeture du groupe.`,
        result: setAt(expr, from, result),
      },
    ];
  }
  return [];
};

/** Inverse d'un élément connu : tap sur `Inv(g)` donne l'élément qui annule g. */
export const invEval: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Inv' || node.length !== 2) return [];
  const el = asElement(node[1]);
  if (!el) return [];
  const inv = toSymbol(inverseD4(el.g));
  const isSelf = inv === el.sym;
  return [
    {
      ruleId: 'inv-eval',
      kind: 'tap',
      from,
      label: `${symName(el.sym)}⁻¹ = ${symName(inv)}`,
      why: isSelf
        ? `Un miroir est son propre inverse : réfléchir deux fois remet chaque coin à sa place.`
        : `${symName(inv)} annule ${symName(el.sym)} : leur composition ramène le carré à l'identité.`,
      result: setAt(expr, from, inv),
    },
  ];
};

/** (a ∘ b)⁻¹ = b⁻¹ ∘ a⁻¹ : l'inverse retourne l'ordre, comme chaussettes et chaussures. */
export const invCompose: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Inv' || node.length !== 2) return [];
  const inner = node[1];
  if (!isCall(inner) || inner[0] !== 'Compose' || inner.length < 3) return [];
  const reversed = (inner.slice(1) as Expr[]).reverse().map((g): Expr => ['Inv', g]);
  return [
    {
      ruleId: 'inv-compose',
      kind: 'tap',
      from,
      label: '(a ∘ b)⁻¹ = b⁻¹ ∘ a⁻¹ : l’inverse retourne l’ordre',
      why: 'Pour défaire « chaussettes puis chaussures », on enlève d’abord les chaussures : ce qui a été fait en dernier se défait en premier.',
      result: setAt(expr, from, ['Compose', ...reversed]),
    },
  ];
};

export const groupeRules: Rule[] = [symCompose, invEval, invCompose];
