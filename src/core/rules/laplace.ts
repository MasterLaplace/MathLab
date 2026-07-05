import { type Expr, freeVariables, getAt, isCall, setAt } from '../ast';
import type { Move, Rule } from './types';

/**
 * La transformée de Laplace comme jeu de règles : ['LT', f] transpose une
 * fonction du temps t vers le domaine de s, ['ILT', F] ramène à la maison.
 * Chaque entrée de la table est un tap — l'ultime opération inverse.
 */

function dependsOnT(e: Expr): boolean {
  // La fonction inconnue y vit dans le temps même si t n'apparaît pas.
  const vars = freeVariables(e);
  return vars.has('t') || vars.has('y');
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

    // ℒ{y} = Y : la fonction inconnue reçoit son nom au pays de s.
    if (body === 'y') {
      moves.push(
        tap(
          expr,
          from,
          'lt-y',
          'ℒ{y} = Y',
          'La fonction inconnue y(t) devient une inconnue algébrique Y(s) : c’est elle qu’on isolera avec les gestes de la balance.',
          'Y',
        ),
      );
      return moves;
    }

    // ℒ{y′} = s·Y − y₀ : dériver dans le temps, c'est multiplier par s.
    if (isCall(body) && body[0] === 'D' && body.length === 3 && body[1] === 'y' && body[2] === 't') {
      moves.push(
        tap(
          expr,
          from,
          'lt-derive',
          'ℒ{y′} = s·Y − y₀',
          'La propriété reine : au pays de s, la dérivée devient une multiplication par s — moins la condition initiale y₀ = y(0), le souvenir du départ.',
          ['Add', ['Multiply', 's', 'Y'], ['Negate', 'y₀']],
        ),
      );
      return moves;
    }

    // ℒ{y″} = s²·Y − s·y₀ − v₀ : deux dérivées, deux multiplications par s,
    // deux souvenirs du départ (position y₀ et vitesse v₀).
    if (
      isCall(body) &&
      body[0] === 'D' &&
      body.length === 3 &&
      body[2] === 't' &&
      isCall(body[1]) &&
      (body[1] as Expr[])[0] === 'D' &&
      (body[1] as Expr[])[1] === 'y' &&
      (body[1] as Expr[])[2] === 't'
    ) {
      moves.push(
        tap(
          expr,
          from,
          'lt-derive2',
          'ℒ{y″} = s²·Y − s·y₀ − v₀',
          'Dériver deux fois, c’est multiplier deux fois par s — et chaque étage emporte sa condition initiale : la position y₀ et la vitesse v₀.',
          [
            'Add',
            ['Multiply', ['Power', 's', 2], 'Y'],
            ['Negate', ['Multiply', 's', 'y₀']],
            ['Negate', 'v₀'],
          ],
        ),
      );
      return moves;
    }

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

      // ℒ⁻¹{c/(s + a)} = c·e^(−a·t) — c numérique ou symbolique (y₀…)
      if (
        (typeof num === 'number' || (typeof num === 'string' && num !== 's')) &&
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

    if (isCall(body) && body[0] === 'Divide') {
      const num = body[1] as Expr;
      const den = body[2] as Expr;

      // ℒ⁻¹{s/(s² + ω²)} = cos(ωt), ℒ⁻¹{ω/(s² + ω²)} = sin(ωt)
      if (
        isCall(den) &&
        den[0] === 'Add' &&
        den.length === 3 &&
        isCall(den[1]) &&
        (den[1] as Expr[])[0] === 'Power' &&
        (den[1] as Expr[])[1] === 's' &&
        (den[1] as Expr[])[2] === 2 &&
        typeof den[2] === 'number' &&
        den[2] > 0
      ) {
        const w = Math.sqrt(den[2]);
        if (Number.isInteger(w)) {
          const wt: Expr = w === 1 ? 't' : ['Multiply', w, 't'];
          if (num === 's') {
            moves.push(
              tap(expr, from, 'ilt-cos', `ℒ⁻¹{s/(s² + ${w * w})} = cos ${w === 1 ? '' : w}t`, 'Le s au numérateur signe un cosinus : le système part à pleine hauteur et oscille pour toujours — deux pôles sur l’axe imaginaire.', ['Cos', wt]),
            );
          }
          if (num === w) {
            moves.push(
              tap(expr, from, 'ilt-sin', `ℒ⁻¹{${w}/(s² + ${w * w})} = sin ${w === 1 ? '' : w}t`, 'Le numérateur constant signe un sinus : le système part de zéro avec de l’élan.', ['Sin', wt]),
            );
          }
        }
      }
    }

    // Le signe − traverse ℒ⁻¹ (linéarité, toujours).
    if (isCall(body) && body[0] === 'Negate') {
      moves.push(
        tap(expr, from, 'ilt-neg', 'Le signe − traverse ℒ⁻¹', 'Linéarité : l’opposé d’une transformée est la transformée de l’opposé.', ['Negate', ['ILT', body[1] as Expr]]),
      );
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
  // ── Décomposition en éléments simples : c/((s+a)(s+b)) se scinde ──
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node[0] !== 'Divide') return [];
    const c = node[1];
    const den = node[2];
    if (typeof c !== 'number' || !isCall(den) || den[0] !== 'Multiply' || den.length !== 3) return [];
    const poles: number[] = [];
    for (const f of den.slice(1) as Expr[]) {
      if (isCall(f) && f[0] === 'Add' && f.length === 3 && f[1] === 's' && typeof f[2] === 'number') {
        poles.push(f[2]);
      }
    }
    if (poles.length !== 2 || poles[0] === poles[1]) return [];
    const [a, b] = poles;
    const k = c / (b - a);
    if (!Number.isInteger(k)) return [];
    const part = (p: number): Expr => ['Divide', Math.abs(k), ['Add', 's', p]];
    const result: Expr =
      k > 0 ? ['Add', part(a), ['Negate', part(b)]] : ['Add', part(b), ['Negate', part(a)]];
    return [
      tap(
        expr,
        from,
        'partial-fractions',
        `Éléments simples : ${c}/((s+${a})(s+${b})) = ${Math.abs(k)}/(s+${k > 0 ? a : b}) − ${Math.abs(k)}/(s+${k > 0 ? b : a})`,
        'Deux pôles collés dans un même dénominateur se séparent en deux fractions à un pôle chacune — et chaque pôle isolé est une ligne de la table.',
        result,
      ),
    ];
  },
];

function fmtCoef(a: number): string {
  if (a === 1) return '';
  if (a === -1) return '−';
  return String(a).replace('-', '−');
}
