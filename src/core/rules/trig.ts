import { type Expr, getAt, isCall, normalize, sameExpr, setAt } from '../ast';
import type { Rule } from './types';

/**
 * Les valeurs exactes du cercle unité, par taps : sin et cos des angles
 * célèbres (0, π/6, π/4, π/3, π/2, π, 2π). Chaque tap est une lecture
 * du cercle, pas un calcul de calculatrice.
 */

interface Entry {
  arg: Expr;
  name: string;
  sin: Expr;
  sinTxt: string;
  cos: Expr;
  cosTxt: string;
  where: string;
}

const HALF: Expr = ['Divide', 1, 2];
const SQRT2_2: Expr = ['Divide', ['Sqrt', 2], 2];
const SQRT3_2: Expr = ['Divide', ['Sqrt', 3], 2];

const TABLE: Entry[] = [
  { arg: 0, name: '0', sin: 0, sinTxt: '0', cos: 1, cosTxt: '1', where: 'à l’angle 0, on part du point (1, 0)' },
  { arg: ['Divide', 'pi', 6], name: 'π/6', sin: HALF, sinTxt: '1/2', cos: SQRT3_2, cosTxt: '√3/2', where: 'π/6, c’est 30° : hauteur 1/2 sur le cercle' },
  { arg: ['Divide', 'pi', 4], name: 'π/4', sin: SQRT2_2, sinTxt: '√2/2', cos: SQRT2_2, cosTxt: '√2/2', where: 'π/4, c’est la diagonale : sin et cos sont égaux' },
  { arg: ['Divide', 'pi', 3], name: 'π/3', sin: SQRT3_2, sinTxt: '√3/2', cos: HALF, cosTxt: '1/2', where: 'π/3, c’est 60° : le miroir de π/6' },
  { arg: ['Divide', 'pi', 2], name: 'π/2', sin: 1, sinTxt: '1', cos: 0, cosTxt: '0', where: 'à π/2, on est tout en haut du cercle, au point (0, 1)' },
  { arg: 'pi', name: 'π', sin: 0, sinTxt: '0', cos: -1, cosTxt: '−1', where: 'à π, on a fait un demi-tour : point (−1, 0)' },
  { arg: ['Multiply', 2, 'pi'], name: '2π', sin: 0, sinTxt: '0', cos: 1, cosTxt: '1', where: 'à 2π, le tour est complet : on est revenu en (1, 0)' },
];

export const trigRules: Rule[] = [
  (expr, from) => {
    const node = getAt(expr, from);
    if (node === undefined || !isCall(node) || node.length !== 2) return [];
    const h = node[0];
    if (h !== 'Sin' && h !== 'Cos') return [];
    const arg = normalize(node[1] as Expr);
    const entry = TABLE.find((e) => sameExpr(arg, normalize(e.arg)));
    if (!entry) return [];
    const value = h === 'Sin' ? entry.sin : entry.cos;
    const valueTxt = h === 'Sin' ? entry.sinTxt : entry.cosTxt;
    return [
      {
        ruleId: 'trig-eval',
        kind: 'tap',
        from,
        label: `${h === 'Sin' ? 'sin' : 'cos'}(${entry.name}) = ${valueTxt}`,
        why: `Sur le cercle unité : ${entry.where}. Le cosinus se lit sur l’axe horizontal, le sinus sur l’axe vertical.`,
        result: setAt(expr, from, value),
      },
    ];
  },
];
