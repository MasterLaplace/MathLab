import type { Expr } from '../core/ast';
import type { Lesson } from './schema';

/**
 * Batch 14 : l'arithmétique complexe complète (Phase 12) — le produit
 * (a+bi)(c+di) entièrement par gestes (distribution, i² = −1, regroupement),
 * le conjugué qui se déplie, le module par z·z̄ — et la matrice de Pauli σy
 * (Phase 14), enfin accessible maintenant que i sait entrer dans une matrice.
 */

/** σy = [[0, −i], [i, 0]] : la Pauli imaginaire. */
const SIGMA_Y: Expr = ['Mat2', 0, ['Negate', 'i'], 'i', 0];

export const lessonsComplexe: Lesson[] = [
  {
    id: 'p12-produit',
    phase: 12,
    title: 'Multiplier deux nombres complexes',
    tagline: '(a+bi)(c+di) — distribuer, i² = −1, regrouper : rien de neuf !',
    intro: ['Tu sais déjà tout faire : distribuer comme en algèbre, remplacer i² par −1, regrouper les termes. Le produit complexe n’est qu’un assemblage de gestes connus.'],
    course: [
      {
        kind: 'p',
        text:
          'Multiplier $(a+bi)(c+di)$, c’est de l’algèbre ordinaire **plus une seule règle** : $i^2 = -1$. On distribue (double distribution, comme $(x+2)(x+3)$), on remplace chaque $i^2$ par $-1$, et on regroupe la partie réelle et la partie imaginaire. Aucune formule à mémoriser — la formule SE FABRIQUE sous tes doigts.',
      },
      {
        kind: 'math',
        latex: '(a+bi)(c+di) = (ac - bd) + (ad + bc)\\,i',
        caption: 'Le résultat général — mais ne l’apprends pas : chaque produit se déroule par gestes, et cette formule apparaît toute seule.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Géométriquement (Phase 12, plan complexe) : les **modules se multiplient**, les **angles s’additionnent**. Le calcul algébrique et la rotation géométrique sont le même acte — c’est LA raison d’être des nombres complexes.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Bombelli (1572) fut le premier à oser calculer avec $\\sqrt{-1}$ — non par goût de l’abstraction, mais parce que la formule de Cardan pour les équations cubiques **exigeait** de traverser les imaginaires pour atteindre des solutions bien réelles. « Cette chose folle qui marche », écrivait-il.',
      },
    ],
    exercises: [
      {
        id: 'prod-i',
        prompt: 'Multiplie par i : distribue, puis fais tourner i·i.',
        start: ['Multiply', 'i', ['Add', 2, ['Multiply', 3, 'i']]],
        goal: ['Add', -3, ['Multiply', 2, 'i']],
        strictGoal: true,
        hint: 'Distribue d’abord (tape sur le produit). Puis glisse i sur i : i² = −1, et 3·(−1) = −3.',
        depth: 8,
      },
      {
        id: 'prod-complet',
        prompt: 'Le produit complet : (2+i)(1+3i). Distribue tout, chasse les i², regroupe.',
        start: ['Multiply', ['Add', 2, 'i'], ['Add', 1, ['Multiply', 3, 'i']]],
        goal: ['Add', -1, ['Multiply', 7, 'i']],
        strictGoal: true,
        hint: '2·1 + 2·3i + i·1 + 3i² = 2 + 6i + i − 3. Regroupe : réels ensemble, imaginaires ensemble.',
        depth: 13,
      },
      {
        id: 'prod-conjugues',
        prompt: '(2+i)(2−i) : multiplie un nombre par son conjugué. Le résultat va te surprendre.',
        start: ['Multiply', ['Add', 2, 'i'], ['Add', 2, ['Negate', 'i']]],
        goal: 5,
        strictGoal: true,
        hint: 'Les termes croisés +2i et −2i s’annulent (glisse l’un sur l’autre), et −i² = +1. Reste 4 + 1 = 5 : un réel pur.',
        depth: 13,
      },
    ],
  },
  {
    id: 'p12-conjugue',
    phase: 12,
    title: 'Le conjugué : le miroir du plan',
    tagline: 'z̄ se déplie par gestes — et z·z̄ donne le module au carré',
    intro: ['Une barre au-dessus d’un nombre complexe : son reflet dans l’axe réel. Ce miroir traverse sommes et produits, et mesure les longueurs.'],
    course: [
      {
        kind: 'p',
        text:
          'Le **conjugué** de $z = a + bi$ est $\\bar{z} = a - bi$ : le reflet de $z$ par rapport à l’axe réel. Le miroir est compatible avec tout : $\\overline{z+w} = \\bar{z} + \\bar{w}$ et $\\overline{z\\,w} = \\bar{z}\\,\\bar{w}$ — il se **déplie** membre à membre, par gestes.',
      },
      {
        kind: 'math',
        latex: 'z\\,\\bar{z} = (a+bi)(a-bi) = a^2 + b^2 = |z|^2',
        caption: 'Le produit d’un nombre par son reflet est toujours un réel positif : le carré de sa distance à l’origine. C’est le théorème de Pythagore déguisé en multiplication.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est ainsi qu’on **divise** les complexes : multiplier numérateur et dénominateur par le conjugué du bas rend le dénominateur réel. Le conjugué est à la division complexe ce que la quantité conjuguée était aux racines (Phase 6).',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'En mécanique quantique (Phase 14), la probabilité d’un état est $\\psi\\bar{\\psi} = |\\psi|^2$ : la règle de Born est exactement ce geste — un nombre complexe fois son miroir donne un réel mesurable. Tout l’étrange du quantique tient dans cette barre.',
      },
    ],
    exercises: [
      {
        id: 'conj-deplie',
        prompt: 'Déplie le conjugué de 3 + 4i, membre à membre.',
        start: ['Conj', ['Add', 3, ['Multiply', 4, 'i']]],
        goal: ['Add', 3, ['Negate', ['Multiply', 4, 'i']]],
        strictGoal: true,
        hint: 'Le miroir traverse la somme, puis le produit : seul i change de signe. 3 + 4i devient 3 − 4i.',
        depth: 8,
      },
      {
        id: 'conj-produit',
        prompt: 'Le conjugué d’un produit : déplie conj(2i).',
        start: ['Conj', ['Multiply', 2, 'i']],
        goal: ['Negate', ['Multiply', 2, 'i']],
        strictGoal: true,
        hint: 'conj(2·i) = conj(2)·conj(i) = 2·(−i). Puis sors le signe du produit.',
      },
      {
        id: 'conj-module',
        prompt: 'Le module au carré : calcule (1+i)(1−i) et mesure la diagonale du carré unité.',
        start: ['Multiply', ['Add', 1, 'i'], ['Add', 1, ['Negate', 'i']]],
        goal: 2,
        strictGoal: true,
        hint: 'Distribue : 1 − i + i − i². Les i s’annulent, −i² = +1. |1+i|² = 2 : la diagonale vaut √2, Pythagore est content.',
        depth: 13,
      },
    ],
  },
  {
    id: 'p14-spin-y',
    phase: 14,
    title: 'La Pauli imaginaire : σy',
    tagline: 'La matrice qui n’existe qu’avec i — le spin dans la 2ᵉ direction',
    intro: ['σx retournait le spin avec des 0 et des 1. σy fait pareil dans l’autre direction — mais elle est impossible à écrire sans nombres imaginaires.'],
    course: [
      {
        kind: 'p',
        text:
          'Les trois matrices de Pauli mesurent le spin selon les trois axes. Tu connais $\\sigma_x$ (Phase 14). Voici $\\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}$ : **impossible** de mesurer le spin selon y avec des nombres réels. La mécanique quantique n’utilise pas les complexes par confort — elle ne peut PAS s’écrire sans eux.',
      },
      {
        kind: 'math',
        latex: '\\sigma_y \\lvert\\uparrow\\rangle = i\\,\\lvert\\downarrow\\rangle, \\qquad \\det \\sigma_y = -1',
        caption: 'σy retourne le spin (comme σx) mais ajoute une phase i — la rotation cachée que seuls les complexes savent écrire.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Tous tes acquis convergent ici : les matrices (Phase 7) donnent le cadre, $i$ (Phase 12) la phase, le spin (Phase 14) la physique. $\\sigma_x\\sigma_y = i\\sigma_z$ : les trois axes de l’espace sont cousus ensemble par l’arithmétique de $i$.',
      },
    ],
    exercises: [
      {
        id: 'sy-up',
        prompt: 'Applique σy au spin haut (1, 0) : étale le produit, puis calcule chaque entrée.',
        start: ['MatVec', SIGMA_Y, ['Vec2', 1, 0]],
        goal: ['Vec2', 0, 'i'],
        strictGoal: true,
        hint: 'Ligne 1 : 0·1 + (−i)·0 = 0. Ligne 2 : i·1 + 0·0 = i. Le spin bascule vers le bas, avec la phase i en cadeau.',
        depth: 10,
      },
      {
        id: 'sy-det',
        prompt: 'Le déterminant de σy : déplie ad − bc et fais tourner les i.',
        start: ['Det', SIGMA_Y],
        goal: -1,
        strictGoal: true,
        hint: '0·0 − (−i)·i : sors le signe, glisse i sur i, remplace i² par −1. Comme σx : déterminant −1, un miroir.',
        depth: 10,
      },
      {
        id: 'sy-propre',
        prompt: 'Vérifie que (1, i) est un état propre de σy : applique la matrice, tu dois retrouver (1, i).',
        start: ['MatVec', SIGMA_Y, ['Vec2', 1, 'i']],
        goal: ['Vec2', 1, 'i'],
        strictGoal: true,
        hint: 'Ligne 1 : 0·1 + (−i)·i = −i² = 1. Ligne 2 : i·1 + 0·i = i. Le vecteur ressort intact : valeur propre +1 — le spin pointe vers +y.',
        depth: 12,
      },
    ],
  },
];
