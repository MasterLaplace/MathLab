import type { Expr } from '../core/ast';
import type { Lesson } from './schema';

/**
 * Batch 4 : la règle de la chaîne (complément Phase 4, station G) et la
 * Phase 12 — le plan complexe (station Q) : i, la rotation, Euler, et les
 * épicycles qui relient Fourier aux vecteurs tournants.
 */

const M2X: Expr = ['Multiply', 2, 'x'];
const M3X: Expr = ['Multiply', 3, 'x'];
const M2T: Expr = ['Multiply', 2, 't'];

export const lessonsPhase12: Lesson[] = [
  // ——————————————————————————————————————————————————————————
  // Phase 4 (complément station G) : la règle de la chaîne
  // ——————————————————————————————————————————————————————————
  {
    id: 'p4-chaine',
    phase: 4,
    title: 'La règle de la chaîne',
    tagline: 'Des fonctions emboîtées comme des poupées russes',
    intro: ['Dériver $\\sin(2x)$, ce n’est pas dériver $\\sin(x)$ : il y a une fonction *dans* la fonction.'],
    course: [
      {
        kind: 'p',
        text:
          'Jusqu’ici, tu as dérivé des fonctions simples : $x^2$, $\\sin x$, $e^x$. Mais la nature adore les emboîtements : ' +
          'la température dépend de l’altitude, qui dépend du temps de marche. À quelle vitesse la température change-t-elle pour le marcheur ? ' +
          'Les deux vitesses se **multiplient**.',
      },
      {
        kind: 'math',
        latex: '\\big(f(u(x))\\big)\' = f\'(u(x)) \\cdot u\'(x)',
        caption: 'La règle de la chaîne : la vitesse de l’extérieur, fois la vitesse de l’intérieur.',
      },
      {
        kind: 'p',
        text:
          'Pense à deux engrenages : si la roue intérieure tourne 2 fois plus vite que ta manivelle, et que la roue extérieure suit la roue ' +
          'intérieure, alors chaque vitesse se transmet en se multipliant. Dans $\\sin(2x)$, l’intérieur $2x$ avance 2 fois plus vite que $x$ : ' +
          'la pente de l’ensemble est doublée.',
      },
      {
        kind: 'example',
        title: 'Dériver sin(2x)',
        steps: [
          'L’extérieur est $\\sin(\\square)$, l’intérieur est $u = 2x$.',
          'Dérivée de l’extérieur au point intérieur : $\\cos(2x)$.',
          'Dérivée de l’intérieur : $(2x)\' = 2$.',
          'Produit : $(\\sin 2x)\' = 2\\cos(2x)$.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le piège n°1 de toutes les copies du monde : dériver $\\sin(2x)$ en $\\cos(2x)$ et **oublier le $\\times 2$**. ' +
          'La dérivée de l’intérieur n’est pas optionnelle : c’est elle qui porte la vitesse réelle.',
      },
      {
        kind: 'p',
        text:
          'Ici, chaque application de la chaîne est un tap : la dérivée de l’extérieur sort d’abord, et la dérivée de l’intérieur ' +
          'reste en attente sous forme d’un nouveau $\\frac{d}{dx}$ — que tu résous avec les gestes que tu connais déjà.',
      },
    ],
    exercises: [
      {
        id: 'chaine-sin',
        prompt: 'Dérive sin(2x) — n’oublie pas la vitesse intérieure.',
        start: ['D', ['Sin', M2X], 'x'],
        goal: ['Multiply', 2, ['Cos', M2X]],
        hint: 'Appuie sur le d/dx : la dérivée de l’extérieur (cos) sort d’abord, l’intérieur (2x) attend son tour dans un nouveau d/dx.',
      },
      {
        id: 'chaine-exp',
        prompt: 'Dérive e^(3x) : l’exponentielle se recopie, la vitesse intérieure sort en facteur.',
        start: ['D', ['Exp', M3X], 'x'],
        goal: ['Multiply', 3, ['Exp', M3X]],
        hint: '(eᵘ)′ = eᵘ·u′ : tape sur le d/dx, puis dérive le 3x qui reste.',
      },
      {
        id: 'chaine-carre',
        prompt: 'Dérive (x + 1)² sans développer : la puissance descend, l’intérieur suit.',
        start: ['D', ['Power', ['Add', 'x', 1], 2], 'x'],
        goal: ['Multiply', 2, ['Add', 'x', 1]],
        hint: '(u²)′ = 2u·u′, et ici u′ = (x+1)′ se dérive terme à terme.',
      },
      {
        id: 'chaine-ln',
        prompt: 'Dérive ln(2x). Surprise : la réponse ne contient plus le 2.',
        start: ['D', ['Ln', M2X], 'x'],
        goal: ['Divide', 1, 'x'],
        hint: '(ln u)′ = u′/u : dérive le 2x du numérateur, puis simplifie la fraction — les 2 s’en vont.',
      },
    ],
    generator: () => {
      const a = 2 + Math.floor(Math.random() * 4);
      const useSin = Math.random() < 0.5;
      const inner: Expr = ['Multiply', a, 'x'];
      return {
        id: `gen-chaine-${a}-${useSin ? 'sin' : 'exp'}`,
        prompt: `Dérive ${useSin ? `sin(${a}x)` : `e^(${a}x)`} avec la règle de la chaîne.`,
        start: ['D', [useSin ? 'Sin' : 'Exp', inner], 'x'],
        goal: ['Multiply', a, useSin ? ['Cos', inner] : ['Exp', inner]],
        hint: 'Dérive l’extérieur d’un tap, puis fais sortir la constante du d/dx intérieur.',
      };
    },
  },

  // ——————————————————————————————————————————————————————————
  // Phase 12 : le plan complexe (station Q)
  // ——————————————————————————————————————————————————————————
  {
    id: 'p12-nombre-i',
    phase: 12,
    title: 'Le nombre impossible',
    tagline: 'i² = −1 : le nombre qu’on a osé inventer',
    intro: ['Aucun nombre ne donne $-1$ quand on le met au carré… alors on en a inventé un.'],
    course: [
      {
        kind: 'p',
        text:
          'L’équation $x^2 = -1$ n’a pas de solution : un carré est toujours positif. Pendant des siècles, on s’est arrêté là. ' +
          'Puis, dans l’Italie du XVIᵉ siècle, des algébristes qui résolvaient des équations de degré 3 ont vu apparaître des racines ' +
          'de nombres négatifs **au milieu** de leurs calculs… qui s’évanouissaient à la fin en donnant des réponses justes et bien réelles.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Rafael Bombelli, 1572 : il ose calculer avec $\\sqrt{-121}$ « comme si c’était un nombre », et retrouve la solution $x = 4$ ' +
          'd’une cubique — une solution parfaitement réelle, atteinte en traversant l’impossible. Descartes appellera ces nombres ' +
          '« imaginaires » **pour s’en moquer**. Le nom est resté ; le mépris, non.',
      },
      {
        kind: 'p',
        text: 'La définition tient en un geste : on invente un nombre $i$ tel que :',
      },
      { kind: 'math', latex: 'i^2 = -1' },
      {
        kind: 'p',
        text:
          'Tout le reste suit les règles de l’algèbre que tu connais déjà. Les puissances de $i$ tournent en rond — c’est le premier indice ' +
          'que $i$ cache une **rotation** :',
      },
      {
        kind: 'math',
        latex: 'i^1 = i, \\quad i^2 = -1, \\quad i^3 = -i, \\quad i^4 = 1, \\quad i^5 = i, \\ \\ldots',
        caption: 'Le cycle des puissances : tous les quatre pas, on revient au départ.',
      },
      {
        kind: 'p',
        text:
          'Un **nombre complexe** est une somme $a + bi$ : deux dimensions dans un seul nombre. On additionne composante par composante, ' +
          'exactement comme les vecteurs de la Phase 7 : les réels ensemble, les imaginaires ensemble.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          '$i$ n’a rien d’« imaginaire » : c’est un quart de tour. Multiplier par $i$ fait tourner de 90°, deux quarts de tour font ' +
          'un demi-tour — et le demi-tour de $1$, c’est bien $-1$. La définition $i^2 = -1$ est de la géométrie déguisée.',
      },
    ],
    exercises: [
      {
        id: 'i-carre',
        prompt: 'Le geste fondateur : que vaut i² ?',
        start: ['Power', 'i', 2],
        goal: -1,
        strictGoal: true,
        hint: 'Tape sur i² : c’est la définition même de i.',
      },
      {
        id: 'i-cube',
        prompt: 'Et i³ ? Suis le cycle des quarts de tour.',
        start: ['Power', 'i', 3],
        goal: ['Negate', 'i'],
        strictGoal: true,
        hint: 'Trois quarts de tour : i³ = i²·i = −i.',
      },
      {
        id: 'i-somme',
        prompt: 'Simplifie 3 + i² : l’imaginaire disparaît.',
        start: ['Add', 3, ['Power', 'i', 2]],
        goal: 2,
        strictGoal: true,
        hint: 'Remplace d’abord i² par sa valeur, puis additionne les deux nombres.',
      },
      {
        id: 'i-addition',
        prompt: 'Additionne (2 + i) + (1 + 2i) : les réels ensemble, les imaginaires ensemble.',
        start: ['Add', 2, 'i', 1, ['Multiply', 2, 'i']],
        goal: ['Add', 3, ['Multiply', 3, 'i']],
        strictGoal: true,
        hint: 'Glisse le 2 sur le 1, puis le i sur le 2i : deux dimensions, deux additions séparées.',
      },
    ],
    generator: () => {
      const n = 2 + Math.floor(Math.random() * 8);
      const CYCLE: Expr[] = [1, 'i', -1, ['Negate', 'i']];
      return {
        id: `gen-i-${n}`,
        prompt: `Que vaut i^${n} ? Compte les quarts de tour.`,
        start: ['Power', 'i', n],
        goal: CYCLE[n % 4],
        strictGoal: true,
        hint: 'Toutes les 4 puissances, on revient à 1 : regarde le reste de la division par 4.',
      };
    },
  },

  {
    id: 'p12-plan',
    phase: 12,
    title: 'Le plan complexe',
    tagline: 'Multiplier, c’est tourner',
    intro: ['Un nombre complexe est un point du plan — et sa multiplication cache le plus beau secret de l’algèbre.'],
    course: [
      {
        kind: 'p',
        text:
          'Gauss et Argand ont donné à $a + bi$ un visage : le **point** $(a, b)$ du plan. L’axe horizontal porte les réels, ' +
          'l’axe vertical les imaginaires. Deux nombres à décrire une position — un nombre complexe est une flèche depuis l’origine, ' +
          'comme les vecteurs de la Phase 7.',
      },
      {
        kind: 'math',
        latex: 'z = a + bi = r(\\cos\\theta + i\\sin\\theta)',
        caption: 'Deux lectures du même point : coordonnées $(a, b)$, ou module $r$ et angle $\\theta$.',
      },
      {
        kind: 'p',
        text:
          'Le **module** $|z| = \\sqrt{a^2 + b^2}$ est la distance à l’origine (Pythagore !). L’**argument** $\\theta$ est l’angle avec ' +
          'l’axe réel. L’addition, tu la connais déjà : c’est le parallélogramme des vecteurs. Mais la multiplication…',
      },
      {
        kind: 'math',
        latex: '|zw| = |z|\\,|w| \\qquad \\arg(zw) = \\arg z + \\arg w',
        caption: 'La révélation : les longueurs se multiplient, les angles s’ADDITIONNENT.',
      },
      {
        kind: 'p',
        text:
          'C’est pour ça que $i^2 = -1$ : $i$ est à 90°, donc $i \\times i$ est à $90° + 90° = 180°$… c’est-à-dire sur l’axe réel, ' +
          'du côté négatif : $-1$. La définition algébrique et le quart de tour géométrique sont **la même chose**.',
      },
      {
        kind: 'example',
        title: 'Multiplier (2i) par (3i)',
        steps: [
          '$2i$ pointe vers le haut (90°), longueur 2 ; $3i$ aussi (90°), longueur 3.',
          'Produit : longueur $2 \\times 3 = 6$, angle $90° + 90° = 180°$.',
          'À 180° avec longueur 6 : c’est $-6$. Vérification algébrique : $6i^2 = -6$. ✓',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Multiplier par $i$ fait tourner de 90° sans rien déformer. Multiplier par $2i$ : tourner de 90° et doubler. ' +
          'Tout nombre complexe est une **consigne de rotation-zoom** — c’est exactement ce dont la physique des ondes a besoin.',
      },
    ],
    exercises: [
      {
        id: 'plan-explore',
        prompt: 'Attrape z et w : observe |z·w| et l’angle vert qui est la SOMME des deux autres. Mets z et w sur le cercle unité : le produit y reste.',
        start: ['Multiply', 'z', 'w'],
        free: true,
        sim: { type: 'complex' },
      },
      {
        id: 'plan-combine',
        prompt: 'Regroupe 2i + 3i : deux flèches de même direction s’additionnent.',
        start: ['Add', ['Multiply', 2, 'i'], ['Multiply', 3, 'i']],
        goal: ['Multiply', 5, 'i'],
        strictGoal: true,
        hint: 'Glisse 2i sur 3i : mêmes imaginaires, les coefficients s’additionnent.',
      },
      {
        id: 'plan-produit',
        prompt: 'Calcule (2i)·(3i) par gestes : le résultat est un réel négatif — deux quarts de tour.',
        start: ['Multiply', 2, 'i', 3, 'i'],
        goal: -6,
        strictGoal: true,
        hint: 'Glisse un i sur l’autre pour former i², remplace-le par −1, puis calcule le produit.',
      },
    ],
  },

  {
    id: 'p12-euler',
    phase: 12,
    title: 'La plus belle équation du monde',
    tagline: 'e^(iπ) + 1 = 0',
    intro: ['Que se passe-t-il quand on met un nombre imaginaire dans une exponentielle ? Le cercle apparaît.'],
    course: [
      {
        kind: 'p',
        text:
          'Souviens-toi de la Phase 4 : $e^x$ est LA fonction égale à sa propre dérivée — sa vitesse est toujours égale à sa position. ' +
          'Branchons-y un imaginaire : pour $z(\\theta) = e^{i\\theta}$, la vitesse vaut $i \\cdot z$, c’est-à-dire la position **tournée d’un quart de tour**. ' +
          'Une vitesse toujours perpendiculaire à la position : c’est la définition exacte du mouvement circulaire (Phase 3 !).',
      },
      {
        kind: 'math',
        latex: 'e^{i\\theta} = \\cos\\theta + i\\sin\\theta',
        caption: 'La formule d’Euler (1748) : l’exponentielle imaginaire parcourt le cercle unité.',
      },
      {
        kind: 'p',
        text:
          'Le point $e^{i\\theta}$ est sur le cercle unité, à l’angle $\\theta$ : sa partie réelle est le cosinus, sa partie imaginaire le sinus. ' +
          'La croissance est devenue rotation. Toute la trigonométrie tient désormais dans les règles des puissances : ' +
          '$e^{i\\alpha} e^{i\\beta} = e^{i(\\alpha+\\beta)}$ **démontre** les formules d’addition de sin et cos en une ligne.',
      },
      {
        kind: 'example',
        title: 'Un quart de tour : e^(iπ/2)',
        steps: [
          '$e^{i\\pi/2} = \\cos(\\pi/2) + i\\sin(\\pi/2)$',
          '$\\cos(\\pi/2) = 0$ et $\\sin(\\pi/2) = 1$ (en haut du cercle)',
          '$e^{i\\pi/2} = 0 + i \\cdot 1 = i$ : un quart de tour, c’est $i$. La boucle est bouclée.',
        ],
      },
      {
        kind: 'p',
        text:
          'Et à $\\theta = \\pi$, le demi-tour complet : $\\cos\\pi = -1$, $\\sin\\pi = 0$, donc $e^{i\\pi} = -1$. Réécrite, cette égalité relie ' +
          'les cinq constantes fondamentales des mathématiques en neuf symboles :',
      },
      {
        kind: 'math',
        latex: 'e^{i\\pi} + 1 = 0',
        caption: '$e$ (la croissance), $i$ (la rotation), $\\pi$ (le cercle), $1$ et $0$ (l’arithmétique).',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Richard Feynman, qui l’avait notée dans son cahier à 14 ans, l’appelait « la formule la plus remarquable des mathématiques ». ' +
          'Elle dit simplement ceci : si tu marches un demi-tour ($\\pi$) sur le cercle ($e^{i\\theta}$), tu arrives à l’opposé de ton départ ($-1$).',
      },
    ],
    exercises: [
      {
        id: 'euler-deplier',
        prompt: 'Déplie la formule d’Euler d’un tap : e^(iθ) devient cos θ + i·sin θ.',
        start: ['Exp', ['Multiply', 'i', 'theta']],
        goal: ['Add', ['Cos', 'theta'], ['Multiply', 'i', ['Sin', 'theta']]],
        strictGoal: true,
        hint: 'Tape sur l’exponentielle : elle s’ouvre en partie réelle (cos) et partie imaginaire (sin).',
      },
      {
        id: 'euler-quart',
        prompt: 'Montre que e^(iπ/2) = i : un quart de tour sur le cercle.',
        start: ['Exp', ['Multiply', 'i', ['Divide', 'pi', 2]]],
        goal: 'i',
        strictGoal: true,
        sim: { type: 'unit-circle' },
        hint: 'Déplie Euler, puis lis cos(π/2) et sin(π/2) sur le cercle : il ne restera que i.',
      },
      {
        id: 'euler-pi',
        prompt: 'Le demi-tour : montre que e^(iπ) = −1.',
        start: ['Exp', ['Multiply', 'i', 'pi']],
        goal: -1,
        strictGoal: true,
        hint: 'Déplie Euler, évalue cos(π) et sin(π), puis fais le ménage : ×0 anéantit, +0 disparaît.',
      },
      {
        id: 'euler-identite',
        prompt: 'La plus belle équation : montre que e^(iπ) + 1 vaut 0.',
        start: ['Add', ['Exp', ['Multiply', 'i', 'pi']], 1],
        goal: 0,
        strictGoal: true,
        hint: 'Après avoir déplié et évalué, il restera −1 + 1 : deux opposés qui s’annulent.',
      },
    ],
  },

  {
    id: 'p12-epicycles',
    phase: 12,
    title: 'Dessiner avec des cercles',
    tagline: 'Fourier était un manège',
    intro: ['La série de Fourier de la Phase 9, revue avec les yeux d’Euler : des cercles montés sur des cercles.'],
    course: [
      {
        kind: 'p',
        text:
          'En Phase 9, tu as vu un créneau se construire comme une somme de sinus. La formule d’Euler retourne l’image : ' +
          'chaque terme $\\sin(kt)$ est la trace verticale d’un **vecteur tournant** $e^{ikt}$. Une somme de sinus, c’est donc des cercles ' +
          'montés les uns sur les autres — le centre du cercle $k$ accroché au bout du bras du cercle $k-1$. Des **épicycles**.',
      },
      {
        kind: 'math',
        latex: 'y(t) = \\frac{4}{\\pi}\\left(\\sin t + \\frac{\\sin 3t}{3} + \\frac{\\sin 5t}{5} + \\cdots\\right)',
        caption: 'Le créneau : cercle k = rayon 4/(πk), vitesse de rotation k. Les harmoniques paires sont absentes.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Ptolémée (IIᵉ siècle) décrivait les orbites des planètes avec des cercles tournant sur des cercles — des épicycles. ' +
          'On s’en est moqué pendant des siècles… jusqu’à ce que Fourier prouve qu’avec assez de cercles, on peut dessiner ' +
          '**n’importe quelle courbe**. Ptolémée ne faisait pas de la mauvaise astronomie : il faisait de l’analyse de Fourier sans le savoir.',
      },
      {
        kind: 'p',
        text:
          'C’est le pont vers la suite du voyage : en électricité, en acoustique, en mécanique quantique, on ne travaille presque jamais ' +
          'avec $\\cos$ et $\\sin$ séparés — on travaille avec $e^{i\\omega t}$, le cercle qui les contient tous les deux. ' +
          'Un signal est une superposition de rotations.',
      },
    ],
    exercises: [
      {
        id: 'epicycles-explore',
        prompt: 'Ajoute des cercles avec le curseur : regarde le manège dessiner le créneau — et le petit sursaut de Gibbs qui ne part jamais.',
        start: ['Sin', 't'],
        free: true,
        sim: { type: 'epicycles' },
      },
      {
        id: 'epicycles-deplier',
        prompt: 'Le cercle k = 2 de la machine : déplie e^(2it) en ses deux composantes.',
        start: ['Exp', ['Multiply', 2, 'i', 't']],
        goal: ['Add', ['Cos', M2T], ['Multiply', 'i', ['Sin', M2T]]],
        strictGoal: true,
        hint: 'La formule d’Euler marche pour n’importe quel angle : ici θ = 2t.',
      },
    ],
  },
];
