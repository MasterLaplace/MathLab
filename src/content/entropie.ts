import type { Exercise, Lesson } from './schema';

/**
 * Phase 20 — Compter pour comprendre la chaleur (stations Y et T′).
 * Le dénombrement par gestes (`Factorial` qui se pèle, `Binom` qui se
 * déplie, règle de Pascal), puis l'entropie S = k ln Ω — où les règles du
 * logarithme de la Phase 2 deviennent la raison pour laquelle l'entropie
 * s'additionne — et enfin Boltzmann et l'aimant d'Ising.
 */

function randInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export const lessonsEntropie: Lesson[] = [
  {
    id: 'p20-denombrer',
    phase: 20,
    title: 'Compter sans compter',
    tagline: 'Factorielles, coefficients binomiaux et triangle de Pascal',
    intro: ['Combien de façons de ranger, de choisir, de répartir ? Les nombres explosent — mais trois gestes suffisent.'],
    course: [
      {
        kind: 'predict',
        question: 'De combien de façons peut-on ranger 10 livres différents sur une étagère ?',
        choices: ['100', 'environ 3,6 millions', 'environ 10 milliards'],
        answer: 1,
        explain: '10 choix pour la première place, puis 9, puis 8… soit $10 \\times 9 \\times \\dots \\times 1 = 10! = 3\\,628\\,800$. Avec 20 livres : $2{,}4 \\times 10^{18}$, plus que de secondes depuis le Big Bang.',
      },
      { kind: 'math', latex: 'n! = n \\times (n-1)! \\qquad 0! = 1', caption: 'On choisit le premier, puis on range les autres. Le moteur pèle un facteur par tap.' },
      { kind: 'p', text: 'Pour **choisir** $k$ objets parmi $n$ sans tenir compte de l’ordre, on les range tous ($n!$), on garde les $k$ premiers… puis on divise par les ordres internes qui ne comptent pas : celui des élus ($k!$) et celui des recalés ($(n-k)!$).' },
      { kind: 'math', latex: '\\binom{n}{k} = \\frac{n!}{k!\\,(n-k)!}', caption: '« $k$ parmi $n$ ».' },
      { kind: 'callout', tone: 'analogy', text: 'Choisir 2 délégués parmi 5 élèves : on les aligne ($5 \\times 4 = 20$ façons), mais « Ana puis Bilal » et « Bilal puis Ana » forment le même duo. On divise par $2! = 2$ : **10** duos. Diviser par $k!$, c’est oublier l’ordre.' },
      { kind: 'sim', sim: { type: 'pascal', mode: 'paths' }, caption: 'Clique une case : chaque chemin depuis le sommet est une suite de choix gauche/droite. Le nombre de chemins, c’est $\\binom{n}{k}$ — exactement les billes de la planche de Galton (Phase 10).' },
      { kind: 'math', latex: '\\binom{n}{k} = \\binom{n-1}{k-1} + \\binom{n-1}{k}', caption: 'Règle de Pascal : le dernier objet est choisi, ou il ne l’est pas.' },
      { kind: 'sim', sim: { type: 'pascal', mode: 'sierpinski' }, caption: 'Colorie les nombres impairs : le triangle de Sierpiński apparaît. Une fractale cachée dans la parité.' },
      { kind: 'callout', tone: 'idea', text: 'Les lignes du triangle sont les coefficients de $(a+b)^n$ : $(a+b)^2 = 1\\,a^2 + 2\\,ab + 1\\,b^2$ — l’identité remarquable de la Phase 2. Développer, c’est compter les façons de choisir $a$ ou $b$ dans chaque parenthèse.' },
      { kind: 'callout', tone: 'story', text: 'Pascal publie son *Traité du triangle arithmétique* en 1654. Mais Yang Hui le dessinait en Chine dès 1261, al-Karaji à Bagdad vers l’an 1000, et le poète indien Pingala comptait déjà les rythmes de syllabes avec lui vers 200 av. J.-C.' },
    ],
    exercises: [
      {
        id: 'den-fact',
        prompt: 'Calcule $\\dfrac{5!}{3!}$ sans calculer les factorielles : pèle, puis simplifie.',
        start: ['Divide', ['Factorial', 5], ['Factorial', 3]],
        goal: 20,
        strictGoal: true,
        hint: 'Pèle 5! en 5·4!, puis 4! en 4·3! : le 3! se simplifie avec celui du bas.',
      },
      {
        id: 'den-pascal',
        prompt: 'Applique la règle de Pascal à $\\binom{5}{2}$.',
        start: ['Binom', 5, 2],
        goal: ['Add', ['Binom', 4, 1], ['Binom', 4, 2]],
        strictGoal: true,
        sim: { type: 'pascal', mode: 'paths' },
        hint: 'Tape sur le coefficient et choisis la règle de Pascal : les deux parents de la case.',
      },
      {
        id: 'den-c42',
        prompt: 'Combien de façons de choisir 2 objets parmi 4 ? Calcule $\\binom{4}{2}$.',
        start: ['Binom', 4, 2],
        goal: 6,
        strictGoal: true,
        depth: 9,
        hint: 'Par Pascal : C(3,1) + C(3,2). Choisir 1 parmi 3 : 3 façons. Et C(3,2) = C(3,1) par symétrie.',
      },
      {
        id: 'den-delegues',
        prompt: 'Les délégués : choisis 2 élèves parmi 5. Calcule $\\binom{5}{2}$ avec la définition.',
        start: ['Binom', 5, 2],
        goal: 10,
        strictGoal: true,
        depth: 10,
        hints: [
          'Déplie la définition : 5!/(2!·3!).',
          'Pèle 5! jusqu’à faire apparaître 3!, et simplifie-le avec celui du bas.',
          'Il reste 5·4/2! : pèle 2! en 2·1!, 1! = 1, et calcule.',
        ],
      },
    ],
    generator: (): Exercise => {
      const n = randInt(4, 8);
      return {
        id: `den-gen-${n}`,
        prompt: `Bonus : calcule $\\dfrac{${n}!}{${n - 2}!}$ en pelant les factorielles.`,
        start: ['Divide', ['Factorial', n], ['Factorial', n - 2]],
        goal: n * (n - 1),
        strictGoal: true,
        hint: `Pèle deux fois : ${n}·${n - 1}·${n - 2}!, puis simplifie.`,
      };
    },
  },
  {
    id: 'p20-entropie',
    phase: 20,
    title: 'L’entropie : compter le désordre',
    tagline: 'S = k ln Ω, la flèche du temps',
    intro: ['Pourquoi le café refroidit-il et ne se réchauffe-t-il jamais tout seul ? Aucune loi ne l’interdit. C’est une affaire de comptage.'],
    course: [
      {
        kind: 'predict',
        question: 'Tu secoues une boîte de 100 pièces. Pourquoi ne tombes-tu jamais sur 100 « pile » ?',
        choices: ['La physique l’interdit', 'C’est possible, mais 1 seule configuration contre ~10²⁹ pour le « moitié-moitié »', 'Les pièces se repoussent'],
        answer: 1,
        explain: 'Rien ne l’interdit. Mais « 100 pile » ne se réalise que d’**une** façon, alors que « 50 pile, 50 face » se réalise de $\\binom{100}{50} \\approx 10^{29}$ façons. En secouant au hasard, tu tombes là où il y a le plus de façons.',
      },
      { kind: 'p', text: 'Un **macro-état** est ce qu’on observe (« 2 molécules à gauche »). Les **micro-états** sont toutes les configurations détaillées qui le réalisent. Leur nombre se note $\\Omega$. Avec 4 molécules : $\\Omega(\\text{4 à gauche}) = 1$, mais $\\Omega(\\text{2 à gauche}) = \\binom42 = 6$.' },
      { kind: 'sim', sim: { type: 'ehrenfest' }, caption: 'Toutes les particules partent à gauche. Avec 4, elles y reviennent souvent ; avec 400, plus jamais — le temps de retour moyen vaut $2^N$ coups.' },
      { kind: 'math', latex: 'S = k \\ln \\Omega', caption: 'L’entropie de Boltzmann (1877), gravée sur sa tombe à Vienne.' },
      { kind: 'p', text: 'Pourquoi un **logarithme** ? Deux systèmes indépendants ont $\\Omega = \\Omega_1 \\times \\Omega_2$ micro-états (on combine chaque état de l’un avec chaque état de l’autre). Or l’entropie doit s’**additionner**, comme une masse. La seule fonction qui transforme × en + : le logarithme (Phase 2).' },
      { kind: 'callout', tone: 'analogy', text: 'Ta chambre : il existe une poignée de façons d’être rangée, et des millions d’être en désordre. Si tu bouges les objets au hasard, tu tombes presque toujours dans le désordre — non qu’une force t’y pousse, mais parce qu’il y a **beaucoup plus** de désordres que d’ordres. C’est tout le deuxième principe.' },
      { kind: 'callout', tone: 'story', text: 'Ludwig Boltzmann (1877) explique l’irréversibilité par le comptage, contre une partie de la communauté qui doute même de l’existence des atomes. Il meurt en 1906 ; deux ans plus tard, Jean Perrin prouve les atomes… avec le mouvement brownien (les marches aléatoires de la Phase 10).' },
      { kind: 'callout', tone: 'idea', text: 'Claude Shannon (1948) retrouve la même formule pour l’**information** : un message parmi $\\Omega$ possibles porte $\\log_2 \\Omega$ bits. Un mot de passe de 8 lettres minuscules : $\\log_2(26^8) = 8\\log_2 26 \\approx 37{,}6$ bits.' },
      { kind: 'callout', tone: 'warn', text: 'L’entropie n’est pas « l’aspect désordonné » : c’est un **nombre de configurations**. Un cristal qui se forme dans une solution baisse son entropie… en libérant de la chaleur qui augmente bien plus celle du liquide autour.' },
    ],
    exercises: [
      {
        id: 'ent-omega',
        prompt: '4 molécules, une paroi : combien de micro-états ont exactement 2 molécules à gauche ? $\\Omega = \\binom{4}{2}$.',
        start: ['Binom', 4, 2],
        goal: 6,
        strictGoal: true,
        depth: 9,
        sim: { type: 'ehrenfest' },
        hint: 'Pascal : C(3,1) + C(3,2), puis les bords et la symétrie.',
      },
      {
        id: 'ent-rangee',
        prompt: 'Toutes les molécules à gauche : calcule l’entropie $\\ln \\binom{4}{4}$.',
        start: ['Ln', ['Binom', 4, 4]],
        goal: 0,
        strictGoal: true,
        hint: 'Il n’y a qu’une façon de mettre les 4 à gauche : Ω = 1. Et ln 1 = 0 : entropie nulle.',
      },
      {
        id: 'ent-additive',
        prompt: 'Deux systèmes indépendants : $\\Omega = \\Omega_1 \\Omega_2$. Montre que l’entropie s’additionne.',
        start: ['Ln', ['Multiply', 'Omega1', 'Omega2']],
        goal: ['Add', ['Ln', 'Omega1'], ['Ln', 'Omega2']],
        strictGoal: true,
        hint: 'Le log d’un produit est la somme des logs : tape sur ln.',
      },
      {
        id: 'ent-pieces',
        prompt: '$N$ pièces de monnaie ont $\\Omega = 2^N$ configurations. Simplifie $\\ln(2^N)$.',
        start: ['Ln', ['Power', 2, 'N']],
        goal: ['Multiply', 'N', ['Ln', 2]],
        strictGoal: true,
        hint: 'L’exposant descend : S/k = N ln 2. L’entropie est proportionnelle à N — elle est « extensive », comme une masse.',
      },
      {
        id: 'ent-shannon',
        prompt: 'Combien de bits pour désigner un octet parmi les $2^8$ possibles ? Calcule $\\log_2(2^8)$.',
        start: ['Log', ['Power', 2, 8], 2],
        goal: 8,
        strictGoal: true,
        hint: 'Le log en base 2 défait la puissance de 2 : 8 bits.',
      },
    ],
  },
  {
    id: 'p20-boltzmann',
    phase: 20,
    title: 'Boltzmann et l’aimant',
    tagline: 'La température arbitre entre énergie et entropie',
    intro: ['Pourquoi un aimant chauffé perd-il son aimantation, d’un coup, à une température précise ?'],
    course: [
      { kind: 'p', text: 'À l’équilibre à la température $T$, un état d’énergie $E$ apparaît avec une probabilité proportionnelle au **facteur de Boltzmann**. Les états coûteux sont rares — d’autant plus rares qu’il fait froid.' },
      { kind: 'math', latex: 'P(E) \\propto e^{-E/kT} \\qquad \\frac{P_2}{P_1} = e^{-(E_2 - E_1)/kT}', caption: 'Seule la différence d’énergie compte, mesurée en unités d’agitation thermique $kT$.' },
      {
        kind: 'predict',
        question: 'Pourquoi l’air est-il plus rare au sommet de l’Everest ?',
        choices: ['Le froid détruit l’oxygène', 'Monter coûte l’énergie mgh : le facteur $e^{-mgh/kT}$ raréfie les molécules', 'L’oxygène est plus lourd que l’azote'],
        answer: 1,
        explain: 'Une molécule en altitude a une énergie potentielle $mgh$ de plus : sa probabilité est multipliée par $e^{-mgh/kT}$. Pour l’air, $kT/mg \\approx 8$ km : à 8 800 m, il reste environ $e^{-1{,}1} \\approx \\frac13$ de l’air du niveau de la mer.',
      },
      { kind: 'p', text: 'Le **modèle d’Ising** : une grille de petits aimants (spins) qui valent +1 ou −1. Deux voisins alignés baissent l’énergie. Chaque spin tente de se retourner et accepte avec la probabilité de Boltzmann. Deux forces s’affrontent : l’énergie veut l’**ordre**, l’entropie veut le **désordre** — et la température arbitre.' },
      { kind: 'sim', sim: { type: 'ising' }, caption: 'Baisse la température sous $T_c \\approx 2{,}27$ : de grands domaines se forment, l’aimant s’aimante. Au-dessus : du bruit. Au point critique : des îles de toutes tailles, fractales.' },
      { kind: 'callout', tone: 'analogy', text: 'Une salle de concert : quand la musique est douce (froid), tout le monde finit par se lever ensemble — l’ordre. Quand c’est le chaos (chaud), chacun fait ce qu’il veut. Au point critique, des groupes de toutes tailles se forment et se défont sans cesse.' },
      { kind: 'callout', tone: 'story', text: 'Ernst Ising (1925) résout le modèle en une dimension, n’y trouve aucune transition… et conclut à tort qu’il n’y en a jamais. En 1941, Kramers et Wannier découvrent une **dualité** qui échange le chaud et le froid et localise $T_c$ ; en 1944, Lars Onsager résout exactement le cas 2D : $T_c = \\dfrac{2}{\\ln(1+\\sqrt2)}$.' },
      { kind: 'callout', tone: 'idea', text: 'Le fer perd son aimantation à 770 °C (le point de Curie) : c’est exactement la transition d’Ising. Et le même mathématique décrit l’eau qui bout, les alliages, et même certains réseaux de neurones.' },
      { kind: 'example', title: 'Deux niveaux d’énergie', steps: ['Un système a deux états : $E = 0$ et $E = \\varepsilon$.', 'Rapport des populations : $e^{-\\varepsilon/kT}$.', 'Si $kT \\ll \\varepsilon$ : presque tout dans le bas. Si $kT \\gg \\varepsilon$ : moitié-moitié — l’entropie a gagné.'] },
    ],
    exercises: [
      {
        id: 'bol-ising',
        prompt: 'Explore : trouve la température où l’aimant hésite entre ordre et désordre.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'ising' },
      },
      {
        id: 'bol-rapport',
        prompt: 'Deux états d’énergies $3kT$ et $kT$ : simplifie le rapport $\\dfrac{e^{-3}}{e^{-1}}$.',
        start: ['Divide', ['Exp', -3], ['Exp', -1]],
        goal: ['Exp', -2],
        strictGoal: true,
        hint: 'Diviser des exponentielles, c’est soustraire les exposants : −3 − (−1) = −2. L’état haut est e² ≈ 7,4 fois plus rare.',
      },
      {
        id: 'bol-independants',
        prompt: 'Deux systèmes indépendants : les probabilités se multiplient. Fusionne $e^{-a} \\cdot e^{-b}$.',
        start: ['Multiply', ['Exp', ['Negate', 'a']], ['Exp', ['Negate', 'b']]],
        goal: ['Exp', ['Add', ['Negate', 'a'], ['Negate', 'b']]],
        strictGoal: true,
        hint: 'Glisse une exponentielle sur l’autre : les exposants (les énergies) s’additionnent.',
      },
      {
        id: 'bol-log',
        prompt: 'Le log ramène l’énergie : simplifie $\\ln\\left(e^{-E/kT}\\right)$.',
        start: ['Ln', ['Exp', ['Negate', ['Divide', 'E', ['Multiply', 'k', 'T']]]]],
        goal: ['Negate', ['Divide', 'E', ['Multiply', 'k', 'T']]],
        strictGoal: true,
        hint: 'ln défait l’exponentielle. C’est ainsi qu’on lit une énergie sur un graphe en échelle log.',
      },
    ],
  },
];
