import { type Expr, freeVariables, getAt, isCall, sameExpr, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * L'intégration comme jeu de règles : un nœud ['Int', corps, 'x'] (une
 * primitive) se réécrit par taps. Et le théorème fondamental de l'analyse
 * devient un geste : D(Int(f)) → f, Int(D(f)) → f.
 */

function dependsOn(e: Expr, v: string): boolean {
  return freeVariables(e).has(v);
}

function tap(expr: Expr, from: number[], ruleId: string, label: string, why: string, replacement: Expr): Move {
  return { ruleId, kind: 'tap', from, label, why, result: setAt(expr, from, replacement) };
}

export const integrateRules: Rule[] = [
  // ── Réécritures d'un nœud Int sélectionné ──
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Int' || node.length !== 3) return [];
    const body = node[1] as Expr;
    const v = node[2];
    if (typeof v !== 'string') return [];
    const moves: Move[] = [];

    // ∫ c dx = c·x — accumuler une constante, c'est une droite.
    if (!dependsOn(body, v)) {
      const primitive: Expr = body === 1 ? v : ['Multiply', body, v];
      moves.push(
        tap(
          expr,
          from,
          'int-const',
          'Intégrer une constante donne une droite',
          'Accumuler c à vitesse constante trace la droite c·x — l’aire d’un rectangle qui s’allonge.',
          primitive,
        ),
      );
      return moves;
    }

    // ∫ x dx = x²/2
    if (body === v) {
      moves.push(
        tap(
          expr,
          from,
          'int-id',
          'L’aire sous x est le demi-carré : x²/2',
          'L’aire sous la diagonale est un triangle : base × hauteur ÷ 2.',
          ['Divide', ['Power', v, 2], 2],
        ),
      );
      return moves;
    }

    if (isCall(body)) {
      const h = body[0];

      // ∫ xⁿ dx = xⁿ⁺¹/(n+1) — la puissance remonte.
      if (h === 'Power' && body[1] === v && typeof body[2] === 'number' && body[2] !== -1) {
        const n = body[2];
        moves.push(
          tap(
            expr,
            from,
            'int-power',
            `La puissance remonte : ∫x${sup(n)} = x${sup(n + 1)}/${n + 1}`,
            'L’inverse exact de la règle de la puissance : l’exposant augmente de 1, puis on divise par le nouvel exposant.',
            ['Divide', ['Power', v, n + 1], n + 1],
          ),
        );
      }

      // ∫ (f + g) dx = ∫f + ∫g
      if (h === 'Add' && body.length >= 3) {
        moves.push(
          tap(
            expr,
            from,
            'int-sum',
            'L’intégrale d’une somme est la somme des intégrales',
            'Les aires s’empilent : chaque terme accumule la sienne (linéarité).',
            ['Add', ...body.slice(1).map((t) => ['Int', t as Expr, v] as Expr)],
          ),
        );
      }

      // ∫ (−f) dx = −∫f
      if (h === 'Negate') {
        moves.push(
          tap(
            expr,
            from,
            'int-neg',
            'Le signe − sort de l’intégrale',
            'Une aire comptée sous l’axe est simplement comptée en négatif.',
            ['Negate', ['Int', body[1] as Expr, v]],
          ),
        );
      }

      // ∫ c·f dx = c·∫f
      if (h === 'Multiply') {
        const constants = body.slice(1).filter((a) => !dependsOn(a as Expr, v)) as Expr[];
        const varying = body.slice(1).filter((a) => dependsOn(a as Expr, v)) as Expr[];
        if (constants.length > 0 && varying.length > 0) {
          const rest: Expr = varying.length === 1 ? varying[0] : (['Multiply', ...varying] as Expr);
          moves.push(
            tap(
              expr,
              from,
              'int-const-factor',
              'Les constantes sortent de l’intégrale',
              'Doubler la fonction double l’aire : un facteur constant traverse le signe ∫.',
              ['Multiply', ...constants, ['Int', rest, v]],
            ),
          );
        }
      }

      // Substitution linéaire : ∫ f(a·x) dx = F(a·x)/a — l'angle défile a
      // fois plus vite, l'aire est a fois plus petite.
      if ((h === 'Sin' || h === 'Cos' || h === 'Exp') && body.length === 2) {
        const arg = body[1] as Expr;
        if (isCall(arg) && arg[0] === 'Multiply' && arg.length === 3 && typeof arg[1] === 'number' && arg[2] === v) {
          const a = arg[1];
          const primitive: Expr =
            h === 'Sin' ? ['Negate', ['Cos', arg]] : h === 'Cos' ? ['Sin', arg] : ['Exp', arg];
          const name = h === 'Sin' ? 'sin' : h === 'Cos' ? 'cos' : 'e^';
          moves.push(
            tap(
              expr,
              from,
              'int-linear',
              `Substitution : ∫${name}(${a}x) = ${h === 'Sin' ? '−cos' : h === 'Cos' ? 'sin' : 'e^'}(${a}x)/${a}`,
              'Pose u = a·x : la fonction défile a fois plus vite, donc chaque arche est a fois plus étroite — la primitive se divise par a. Dérive le résultat (règle de la chaîne !) pour vérifier.',
              ['Divide', primitive, a],
            ),
          );
        }
      }

      // Intégration par parties : ∫ u·f dx = u·V − ∫ u′·V dx, où V est la
      // primitive (connue) de f = sin/cos/exp. Le u′ reste en attente dans
      // un nouveau D que l'élève résout avec ses gestes.
      if (h === 'Multiply' && body.length === 3) {
        for (const [u, f] of [
          [body[1] as Expr, body[2] as Expr],
          [body[2] as Expr, body[1] as Expr],
        ] as const) {
          if (!dependsOn(u, v) || !isCall(f) || f.length !== 2 || f[1] !== v) continue;
          const du: Expr = ['D', u, v];
          const why =
            'On intègre le facteur facile (V), on dérive l’autre (u′) : ∫u·f = u·V − ∫u′·V. Le produit se déshabille d’un facteur à chaque tour.';
          if (f[0] === 'Cos') {
            moves.push(
              tap(expr, from, 'int-parts', 'Par parties : ∫u·cos = u·sin − ∫u′·sin', why, [
                'Add',
                ['Multiply', u, ['Sin', v]],
                ['Negate', ['Int', ['Multiply', du, ['Sin', v]], v]],
              ]),
            );
          }
          if (f[0] === 'Sin') {
            moves.push(
              tap(expr, from, 'int-parts', 'Par parties : ∫u·sin = −u·cos + ∫u′·cos', why, [
                'Add',
                ['Negate', ['Multiply', u, ['Cos', v]]],
                ['Int', ['Multiply', du, ['Cos', v]], v],
              ]),
            );
          }
          if (f[0] === 'Exp') {
            moves.push(
              tap(expr, from, 'int-parts', 'Par parties : ∫u·eˣ = u·eˣ − ∫u′·eˣ', why, [
                'Add',
                ['Multiply', u, ['Exp', v]],
                ['Negate', ['Int', ['Multiply', du, ['Exp', v]], v]],
              ]),
            );
          }
          if (moves.some((m) => m.ruleId === 'int-parts')) break;
        }
      }

      // Fonctions célèbres, argument exactement x.
      if (body.length === 2 && body[1] === v) {
        if (h === 'Sin') {
          moves.push(
            tap(expr, from, 'int-sin', '∫sin = −cos', 'La primitive du sinus est −cos : dérive −cos pour le vérifier — le jeu est réversible.', ['Negate', ['Cos', v]]),
          );
        }
        if (h === 'Cos') {
          moves.push(
            tap(expr, from, 'int-cos', '∫cos = sin', 'La primitive du cosinus est le sinus : un quart de tour dans l’autre sens.', ['Sin', v]),
          );
        }
        if (h === 'Exp') {
          moves.push(
            tap(expr, from, 'int-exp', '∫eˣ = eˣ', 'Sa propre dérivée… donc sa propre primitive.', ['Exp', v]),
          );
        }
      }

      // ∫ 1/x dx = ln x
      if (h === 'Divide' && body[1] === 1 && body[2] === v) {
        moves.push(
          tap(expr, from, 'int-recip', '∫(1/x) = ln x', 'Le trou de la règle de la puissance (n = −1) est comblé par le logarithme.', ['Ln', v]),
        );
      }

      // ∫ f′ dx = f — le théorème fondamental, sens accumulation.
      if (h === 'D' && body.length === 3 && body[2] === v) {
        moves.push(
          tap(
            expr,
            from,
            'ftc-int',
            'Théorème fondamental : intégrer une dérivée rend la fonction',
            'Accumuler tous les petits changements de f reconstruit f (à une constante près).',
            body[1] as Expr,
          ),
        );
      }
    }

    return moves;
  },

  // ── Théorème fondamental, sens pente : D(Int(f)) → f ──
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'D' || node.length !== 3) return [];
    const body = node[1] as Expr;
    const v = node[2];
    if (typeof v !== 'string' || !isCall(body) || body[0] !== 'Int' || body.length !== 3) return [];
    if (!sameExpr(body[2] as Expr, v)) return [];
    return [
      tap(
        expr,
        from,
        'ftc-derive',
        'Théorème fondamental : dériver une intégrale rend la fonction',
        'La vitesse à laquelle l’aire s’accumule sous f… c’est la hauteur de f elle-même.',
        body[1] as Expr,
      ),
    ];
  },
];

function sup(n: number): string {
  const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
  return String(n)
    .split('')
    .map((c) => SUP[c] ?? c)
    .join('');
}
