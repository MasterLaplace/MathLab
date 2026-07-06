import { type Expr, getAt, isCall } from '../ast';
import { setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * Théorie des nombres par gestes (station Y) :
 * - `['Gcd', a, b]` : un tap applique UN pas de l'algorithme d'Euclide —
 *   pgcd(a, b) = pgcd(b, a mod b), jusqu'à ce que le reste divise.
 * - `['Mod', a, n]` : la lecture de l'horloge (un tap réduit a modulo n).
 * - Réduction en chemin : un nombre ≥ n à l'intérieur d'un Mod se réduit
 *   d'un tap (17·23 mod 12 → 5·11 mod 12) — le réflexe de l'arithmétique
 *   modulaire : réduire d'abord, calculer ensuite.
 * Jamais d'auto-calcul : chaque pas d'Euclide, chaque réduction est un geste.
 */

function asInt(e: Expr | undefined): number | null {
  return typeof e === 'number' && Number.isInteger(e) ? e : null;
}

/** Un pas d'Euclide : pgcd(a, b) → pgcd(b, a mod b), ou b si b divise a. */
export const gcdStep: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Gcd' || node.length !== 3) return [];
  const a = asInt(node[1]);
  const b = asInt(node[2]);
  if (a === null || b === null || a <= 0 || b <= 0) return [];
  const r = a % b;
  if (r === 0) {
    return [
      {
        ruleId: 'gcd-done',
        kind: 'tap',
        from,
        label: `${b} divise ${a} : le pgcd est ${b}`,
        why: 'Quand le reste tombe à zéro, le dernier diviseur est le plus grand diviseur commun.',
        result: setAt(expr, from, b),
      },
    ];
  }
  return [
    {
      ruleId: 'gcd-step',
      kind: 'tap',
      from,
      label: `pgcd(${a}, ${b}) = pgcd(${b}, ${r}) — le reste remplace le grand`,
      why: `Tout diviseur commun de ${a} et ${b} divise aussi le reste ${a} − ${Math.floor(a / b)}·${b} = ${r} : les diviseurs communs sont exactement les mêmes. On rétrécit le problème sans rien perdre.`,
      result: setAt(expr, from, ['Gcd', b, r]),
    },
  ];
};

/** Lire l'horloge : a mod n → le reste. */
export const modEval: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Mod' || node.length !== 3) return [];
  const a = asInt(node[1]);
  const n = asInt(node[2]);
  if (a === null || n === null || n < 2 || a < 0) return [];
  const r = a % n;
  return [
    {
      ruleId: 'mod-eval',
      kind: 'tap',
      from,
      label: `${a} ≡ ${r} (mod ${n}) — sur l'horloge à ${n} heures`,
      why: `${a} = ${Math.floor(a / n)}·${n} + ${r} : après ${Math.floor(a / n)} tours complets de l'horloge, l'aiguille pointe sur ${r}.`,
      result: setAt(expr, from, r),
    },
  ];
};

/**
 * Réduire en chemin : un entier ≥ n à l'intérieur d'un `Mod` (dans des
 * sommes, produits ou bases de puissances — jamais dans un exposant !)
 * se remplace par son reste. C'est LE réflexe modulaire.
 */
export const modReduceInside: Rule = (expr, from) => {
  const node = getAt(expr, from);
  const value = asInt(node);
  if (value === null) return [];

  // Cherche un Mod englobant tel que `from` descende dans son 1ᵉʳ argument
  // par des positions sûres (Add/Multiply : partout ; Power : base seulement).
  for (let cut = from.length - 1; cut >= 0; cut--) {
    const prefix = from.slice(0, cut);
    const candidate = getAt(expr, prefix);
    if (candidate === undefined || !isCall(candidate) || candidate[0] !== 'Mod') continue;
    if (from[cut] !== 1) return []; // dans le modulus lui-même : on ne touche pas
    const n = asInt(candidate[2]);
    if (n === null || n < 2) return [];
    // Vérifie le chemin intérieur : chaque étage doit autoriser la réduction.
    let ok = true;
    let walker: Expr = candidate[1] as Expr;
    for (let i = cut + 1; i < from.length; i++) {
      if (!isCall(walker)) { ok = false; break; }
      const h = walker[0];
      const idx = from[i];
      if (h === 'Power' && idx !== 1) { ok = false; break; } // jamais l'exposant
      if (h !== 'Add' && h !== 'Multiply' && h !== 'Power') { ok = false; break; }
      walker = walker[idx] as Expr;
    }
    if (!ok || from.length === cut + 1) return []; // le Mod entier : c'est modEval
    const r = value % n;
    if (r === value || value < 0) return [];
    const moves: Move[] = [
      {
        ruleId: 'mod-reduce',
        kind: 'tap',
        from,
        label: `Réduire d'abord : ${value} ≡ ${r} (mod ${n})`,
        why: `Modulo ${n}, remplacer un nombre par son reste ne change rien au résultat final — autant calculer avec des petits nombres.`,
        result: setAt(expr, from, r),
      },
    ];
    return moves;
  }
  return [];
};

/** Plus petit facteur premier de n (n ≥ 2). */
function smallestPrimeFactor(n: number): number {
  for (let p = 2; p * p <= n; p++) {
    if (n % p === 0) return p;
  }
  return n;
}

/**
 * L'indicatrice d'Euler par gestes : `['Phi', n]` se déplie d'un tap.
 * - n premier : φ(p) = p − 1 (tous les nombres < p sont étrangers à p).
 * - n = p^k : φ(p^k) = p^k − p^{k−1} (on retire les multiples de p).
 * - n composé : φ est multiplicative — φ(p^a · m) = φ(p^a) · φ(m)
 *   quand les facteurs sont premiers entre eux.
 * La soustraction et le produit restent à calculer par gestes.
 */
export const phiExpand: Rule = (expr, from) => {
  const node = getAt(expr, from);
  if (node === undefined || !isCall(node) || node[0] !== 'Phi' || node.length !== 2) return [];
  const n = asInt(node[1]);
  if (n === null || n < 2) return [];
  const p = smallestPrimeFactor(n);

  // Puissance de p pure : p, p², p³…
  let q = n;
  while (q % p === 0) q = q / p;
  if (q === 1) {
    if (n === p) {
      return [
        {
          ruleId: 'phi-prime',
          kind: 'tap',
          from,
          label: `${p} est premier : φ(${p}) = ${p} − 1`,
          why: `Tous les nombres de 1 à ${p - 1} sont étrangers à ${p} — un nombre premier n'a rien à partager avec personne.`,
          result: setAt(expr, from, ['Add', p, -1]),
        },
      ];
    }
    return [
      {
        ruleId: 'phi-power',
        kind: 'tap',
        from,
        label: `φ(${n}) = ${n} − ${n / p} : on retire les multiples de ${p}`,
        why: `Parmi 1…${n}, seuls les multiples de ${p} partagent un facteur avec ${n} — il y en a exactement ${n / p}.`,
        result: setAt(expr, from, ['Add', n, -(n / p)]),
      },
    ];
  }

  // Composé : on détache la puissance de p (première partie), étrangère au reste.
  const pk = n / q;
  return [
    {
      ruleId: 'phi-split',
      kind: 'tap',
      from,
      label: `φ est multiplicative : φ(${n}) = φ(${pk}) · φ(${q})`,
      why: `${pk} et ${q} sont premiers entre eux : les restes modulo ${n} se lisent comme des paires (reste mod ${pk}, reste mod ${q}), et être étranger à ${n}, c'est l'être aux deux à la fois.`,
      result: setAt(expr, from, ['Multiply', ['Phi', pk], ['Phi', q]]),
    },
  ];
};

export const nombresRules: Rule[] = [gcdStep, modEval, modReduceInside, phiExpand];
