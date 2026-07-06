import type { Lesson } from './schema';

/**
 * Phase 18 — L'art de la preuve (station Z).
 *
 * Les trois grandes techniques de démonstration, ramenées à leur unique
 * geste mécanique : la SUBSTITUTION (`['Subst', corps, variable, valeur]`).
 * - Récurrence : instancier en 1, puis injecter l'hypothèse P(k).
 * - Absurde : injecter la forme supposée pour faire surgir la contradiction.
 * - Tiroirs : le pourquoi des collisions modulaires.
 */
export const lessonsPreuves: Lesson[] = [
  {
    id: 'p18-recurrence',
    phase: 18,
    title: 'La récurrence : les dominos',
    tagline: 'Un domino tombe, tous tombent',
    intro: [
      "Comment prouver une infinité d'énoncés d'un seul coup ? On aligne des dominos : on montre que le premier tombe, et que chaque domino en fait tomber un suivant. Alors ils tombent tous.",
    ],
    course: [
      { kind: 'p', text: "On veut prouver que la somme des $n$ premiers nombres impairs vaut $n^2$ : $1 + 3 + 5 + \\dots + (2n-1) = n^2$." },
      { kind: 'math', latex: '1 = 1^2,\\quad 1+3 = 2^2,\\quad 1+3+5 = 3^2,\\ \\dots' },
      { kind: 'p', text: "**Le premier domino** (cas de base) : on vérifie l'énoncé en $n = 1$. C'est une simple substitution." },
      { kind: 'p', text: "**La chaîne** (hérédité) : on *suppose* la formule vraie au rang $k$ — c'est l'hypothèse de récurrence $S(k) = k^2$ — et on la fait tomber sur le rang $k+1$. Or $S(k+1) = S(k) + (2k+1)$ : il suffit d'injecter l'hypothèse." },
      { kind: 'example', title: "L'hérédité en un geste", steps: [
        "$S(k+1) = S(k) + (2k+1)$",
        "On remplace $S$ par l'hypothèse $k^2$ :",
        "$= k^2 + 2k + 1 = (k+1)^2$. Le domino $k$ a fait tomber le domino $k+1$.",
      ] },
      { kind: 'callout', tone: 'idea', text: "La substitution est le seul geste dont la logique a besoin. « Supposons P(k) » veut juste dire : partout où tu peux, écris l'hypothèse à la place." },
      { kind: 'callout', tone: 'story', text: "Le principe porte le nom de Pascal (1654), mais Maurolico l'utilisait déjà en 1575 pour cette même somme des impairs. Poincaré y voyait « le raisonnement mathématique par excellence »." },
    ],
    exercises: [
      {
        id: 'rec-base',
        prompt: "Le premier domino : instancie $n^2$ en $n = 1$ (tape la substitution, puis calcule).",
        start: ['Subst', ['Power', 'n', 2], 'n', 1],
        goal: 1,
        sim: { type: 'dominoes' },
        hint: "Tape le bloc de substitution : partout où il y a n, écris 1.",
      },
      {
        id: 'rec-n3',
        prompt: "Vérifie encore : que vaut la formule en $n = 3$ ? ($1+3+5 = 9$)",
        start: ['Subst', ['Power', 'n', 2], 'n', 3],
        goal: 9,
        hint: "Substitue n → 3, puis élève au carré.",
      },
      {
        id: 'rec-step',
        prompt: "L'hérédité : dans $S(k) + (2k+1)$, injecte l'hypothèse $S = k^2$. Tu obtiens $k^2 + 2k + 1$ — qui est justement $(k+1)^2$.",
        start: ['Subst', ['Add', 'S', ['Add', ['Multiply', 2, 'k'], 1]], 'S', ['Power', 'k', 2]],
        goal: ['Add', ['Power', 'k', 2], ['Add', ['Multiply', 2, 'k'], 1]],
        hint: "Remplace S par k² : il reste k² + 2k + 1, l'identité remarquable (k+1)².",
      },
    ],
  },
  {
    id: 'p18-absurde',
    phase: 18,
    title: "Le raisonnement par l'absurde",
    tagline: '√2 ne peut pas être une fraction',
    intro: [
      "Pour prouver qu'une chose est impossible, on suppose le contraire et on court à la catastrophe. Si l'hypothèse mène à une contradiction, c'est qu'elle était fausse.",
    ],
    course: [
      { kind: 'p', text: "Supposons que $\\sqrt{2}$ soit une fraction $\\frac{a}{b}$ **irréductible** (déjà simplifiée au maximum). Alors $a^2 = 2b^2$ : donc $a^2$ est pair, donc $a$ est pair. Écrivons $a = 2c$." },
      { kind: 'p', text: "**Le geste clé** : on injecte $a = 2c$ dans $a^2$." },
      { kind: 'math', latex: 'a^2 = (2c)^2 = 4c^2' },
      { kind: 'p', text: "Comme $a^2 = 2b^2$, on obtient $4c^2 = 2b^2$, soit $b^2 = 2c^2$ : donc $b$ est pair *lui aussi*." },
      { kind: 'callout', tone: 'warn', text: "Contradiction ! $a$ et $b$ sont tous les deux pairs, alors qu'on avait supposé la fraction irréductible. L'hypothèse « √2 est une fraction » s'effondre : √2 est irrationnel." },
      { kind: 'callout', tone: 'story', text: "La légende dit qu'Hippase de Métaponte, pythagoricien, aurait péri en mer pour avoir divulgué ce scandale : un nombre que le monde des fractions ne pouvait pas contenir." },
    ],
    exercises: [
      {
        id: 'abs-carre',
        prompt: "Injecte $a = 2c$ dans $a^2$ : tu obtiens $(2c)^2 = 4c^2$, donc $a^2$ est divisible par 4.",
        start: ['Subst', ['Power', 'a', 2], 'a', ['Multiply', 2, 'c']],
        goal: ['Power', ['Multiply', 2, 'c'], 2],
        hint: "Substitue a → 2c : il reste (2c)², c'est-à-dire 4c², un multiple de 4.",
      },
      {
        id: 'abs-injecte',
        prompt: "Dans l'équation $a^2 = 2b^2$, remplace $a^2$ par $4c^2$ (ce qu'on vient de trouver).",
        start: ['Subst', ['Equal', 'A', ['Multiply', 2, ['Power', 'b', 2]]], 'A', ['Multiply', 4, ['Power', 'c', 2]]],
        goal: ['Equal', ['Multiply', 4, ['Power', 'c', 2]], ['Multiply', 2, ['Power', 'b', 2]]],
        hint: "Remplace A par 4c² : tu obtiens 4c² = 2b², donc b² = 2c². b est pair aussi — la contradiction.",
      },
    ],
  },
  {
    id: 'p18-tiroirs',
    phase: 18,
    title: 'Le principe des tiroirs',
    tagline: 'Plus de pigeons que de cases',
    intro: [
      "Si vous rangez 13 chaussettes dans 12 tiroirs, un tiroir contient forcément au moins deux chaussettes. Évident — et pourtant l'une des armes les plus puissantes de toute la combinatoire.",
    ],
    course: [
      { kind: 'p', text: "**Le principe** : si l'on place $n$ objets dans $k$ boîtes avec $n > k$, alors au moins une boîte contient au moins deux objets. Impossible d'y échapper : sinon chaque boîte aurait au plus un objet, et il y en aurait au plus $k < n$." },
      { kind: 'p', text: "Où sont les « boîtes » en arithmétique ? Ce sont **les restes**. Modulo $n$, il n'existe que $n$ restes possibles : $0, 1, \\dots, n-1$. Dès qu'on regarde $n+1$ nombres, deux tombent forcément sur le même reste — deux pigeons dans la même case." },
      { kind: 'example', title: 'Une collision garantie', steps: [
        "Modulo 12, il n'y a que 12 tiroirs (les heures de l'horloge).",
        "$17 \\bmod 12 = 5$ et $29 \\bmod 12 = 5$ : deux nombres, une même case.",
        "Leur différence $29 - 17 = 12$ est donc un multiple de 12 — c'est toujours ce que le principe garantit.",
      ] },
      { kind: 'callout', tone: 'idea', text: "C'est ce principe qui fait « boucler » l'horloge : sur une infinité de nombres et seulement 12 heures, les collisions sont inévitables. Toute la périodicité modulaire en découle." },
    ],
    exercises: [
      {
        id: 'tir-mod1',
        prompt: "Dans quel tiroir (mod 12) tombe le nombre 17 ? Lis l'horloge.",
        start: ['Mod', 17, 12],
        goal: 5,
        hint: "17 = 12 + 5 : après un tour, l'aiguille pointe sur 5.",
      },
      {
        id: 'tir-mod2',
        prompt: "Et 29 ? S'il tombe dans le même tiroir que 17, le principe des tiroirs a frappé.",
        start: ['Mod', 29, 12],
        goal: 5,
        hint: "29 = 24 + 5 : deux tours et l'aiguille est encore sur 5 — même case que 17.",
      },
    ],
  },
];
