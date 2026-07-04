import type { Exercise, Lesson } from './schema';

/** Entier aléatoire dans [min, max]. */
function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Batch 2 : la spirale continue.
 * - Station D : le cercle unité (complément Phase 2).
 * - Station G : la dérivée devient un jeu de règles par taps (Phase 4).
 * - Station L : le champ de directions d'une EDO (complément Phase 5).
 * - Station T : les probabilités, Phase 10 (Galton, Bayes).
 */
export const lessonsComplements: Lesson[] = [
  // ───────────────── Station D — le cercle unité (Phase 2) ─────────────────
  {
    id: 'p2-cercle-unite',
    phase: 2,
    title: 'Le cercle unité',
    tagline: 'sin et cos sont les ombres d’un point qui tourne',
    intro: ['Un point tourne sur un cercle de rayon 1 : son ombre horizontale est cos θ, son ombre verticale est sin θ.'],
    course: [
      {
        kind: 'p',
        text:
          'Oublie un instant les touches sin et cos de la calculatrice. Prends un cercle de rayon 1, pose un point dessus, et fais-le tourner d’un angle $\\theta$. Son ombre sur l’axe horizontal, c’est $\\cos\\theta$. Son ombre sur l’axe vertical, c’est $\\sin\\theta$. C’est **tout** — la trigonométrie entière tient dans ce point qui tourne.',
      },
      {
        kind: 'p',
        text:
          'Et si tu laisses le point tourner en déroulant le temps, ses deux ombres dessinent des ondes. Voilà pourquoi sinus et cosinus surgissent partout où quelque chose tourne ou oscille : les saisons, une roue, un ressort, le courant alternatif.',
      },
      {
        kind: 'math',
        latex: '\\sin^2\\theta + \\cos^2\\theta = 1',
        caption:
          'Le point est sur un cercle de rayon 1, ses ombres forment un triangle rectangle d’hypoténuse 1 : c’est Pythagore, déguisé en identité trigonométrique.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Cette identité est une machine à compléter : si tu connais l’une des deux ombres, Pythagore te donne l’autre. C’est l’exercice ci-dessous.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Attrape le point vert, fais-le tourner. Regarde les ombres dessiner les deux ondes.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'unit-circle' },
      },
      {
        id: 'e2',
        prompt: 'On sait que cos²θ = 0,36. Trouve sin θ = s (positif) avec Pythagore : s² = 1 − 0,36.',
        start: ['Equal', ['Power', 's', 2], ['Subtract', 1, 0.36]],
        goal: ['Equal', 's', 0.8],
        hint: 'Calcule la soustraction, puis appuie sur s² pour prendre la racine (positive), puis calcule.',
      },
    ],
  },

  // ───────────────── Station G — la dérivée par gestes (Phase 4) ─────────────────
  {
    id: 'p4-regles-derivee',
    phase: 4,
    title: 'La dérivée : un jeu de règles',
    tagline: 'd/dx se joue par taps — puissance, somme, constantes',
    intro: ['La dérivée n’est pas un rituel : quatre règles suffisent à dériver presque tout, geste par geste.'],
    course: [
      {
        kind: 'p',
        text:
          'Tu as vu la dérivée à la leçon de la tangente : la pente instantanée. Voici la grande nouvelle : calculer une dérivée n’exige aucune inspiration — c’est un **jeu de règles**, comme la balance algébrique. Appuie sur un $\\frac{d}{dx}(\\dots)$, et le moteur te propose les règles applicables.',
      },
      {
        kind: 'example',
        title: 'Les quatre règles de base',
        steps: [
          'Constante : $\\dfrac{d}{dx}(7) = 0$ — ce qui ne bouge pas n’a pas de pente.',
          'Variable : $\\dfrac{d}{dx}(x) = 1$ — $x$ grandit au rythme de $x$.',
          'Puissance : $\\dfrac{d}{dx}(x^n) = n\\,x^{n-1}$ — l’exposant descend et diminue de 1.',
          'Somme : $\\dfrac{d}{dx}(f+g) = f\' + g\'$ — chaque terme se dérive séparément.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Et les constantes multiplicatives sortent : $(3x)\' = 3 \\cdot (x)\'$. Un facteur constant étire la courbe, donc il étire la pente du même facteur. Rien de nouveau : c’est la linéarité, la même qui faisait marcher la balance.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le piège classique : dériver $x^2$ en $x^2$ ou en $2x^2$. Regarde bien la règle : l’exposant **descend en facteur** puis **diminue de 1** — deux mouvements, pas un.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Appuie sur la dérivée : que vaut la pente d’une constante ?',
        start: ['D', 7, 'x'],
        goal: 0,
        hint: '7 ne dépend pas de x : sa courbe est plate, sa pente est nulle.',
      },
      {
        id: 'e2',
        prompt: 'La règle de la puissance : dérive x².',
        start: ['D', ['Power', 'x', 2], 'x'],
        goal: ['Multiply', 2, 'x'],
        hint: 'Appuie sur le d/dx : l’exposant 2 descend, il reste x¹ = x.',
      },
      {
        id: 'e3',
        prompt: 'Dérive x² + 3x, règle par règle, jusqu’à 2x + 3.',
        start: ['D', ['Add', ['Power', 'x', 2], ['Multiply', 3, 'x']], 'x'],
        goal: ['Add', ['Multiply', 2, 'x'], 3],
        hint: 'Scinde la somme, puis traite chaque morceau : puissance d’un côté, sortie du 3 puis (x)′ = 1 de l’autre.',
      },
    ],
    generator: (): Exercise => {
      const n = rand(3, 6);
      return {
        id: `gen-${Date.now()}`,
        prompt: `Bonus : dérive x${'⁰¹²³⁴⁵⁶'[n]}.`,
        start: ['D', ['Power', 'x', n], 'x'],
        goal: ['Multiply', n, ['Power', 'x', n - 1]],
        hint: 'L’exposant descend en facteur et diminue de 1.',
      };
    },
  },
  {
    id: 'p4-derivees-celebres',
    phase: 4,
    title: 'Les dérivées célèbres',
    tagline: 'sin, exponentielle, et la règle du produit',
    intro: ['Trois dérivées à connaître comme des amis : sin → cos, eˣ → eˣ, et le produit qui se partage.'],
    course: [
      {
        kind: 'p',
        text:
          'Trois résultats reviennent partout en sciences. D’abord le plus beau : $(e^x)\' = e^x$. L’exponentielle croît **à la vitesse de sa propre valeur** — c’est sa définition même, et c’est pour ça qu’elle gouverne tout ce qui s’emballe : populations, intérêts composés, épidémies.',
      },
      {
        kind: 'math',
        latex: "(\\sin x)' = \\cos x, \\qquad (\\cos x)' = -\\sin x",
        caption:
          'Repense au cercle unité : la pente du sinus à un instant, c’est la valeur du cosinus au même instant — les deux ondes se poursuivent avec un quart de tour de décalage.',
      },
      {
        kind: 'p',
        text:
          'Et quand deux quantités varient **ensemble** ? La règle du produit répond : chacune contribue pendant que l’autre est figée.',
      },
      {
        kind: 'math',
        latex: "(f \\cdot g)' = f'\\cdot g + f \\cdot g'",
        caption:
          'L’aire d’un rectangle qui grandit : un côté qui s’allonge × l’autre figé, plus l’inverse.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Dérive quatre fois sin : sin → cos → −sin → −cos → sin. Le cercle se referme en quatre quarts de tour — exactement le point qui tourne du cercle unité. Rien n’est un hasard.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Dérive sin x.',
        start: ['D', ['Sin', 'x'], 'x'],
        goal: ['Cos', 'x'],
        hint: 'La pente de la sinusoïde est le cosinus.',
      },
      {
        id: 'e2',
        prompt: 'Dérive eˣ. (Oui, c’est aussi simple que ça en a l’air.)',
        start: ['D', ['Exp', 'x'], 'x'],
        goal: ['Exp', 'x'],
        hint: 'L’exponentielle est sa propre dérivée.',
      },
      {
        id: 'e3',
        prompt: 'La règle du produit : dérive x·sin x jusqu’à sin x + x·cos x.',
        start: ['D', ['Multiply', 'x', ['Sin', 'x']], 'x'],
        goal: ['Add', ['Sin', 'x'], ['Multiply', 'x', ['Cos', 'x']]],
        hint: 'Applique le produit, puis dérive chaque morceau ((x)′ = 1 disparaît avec ×1).',
      },
    ],
  },

  // ───────────────── Station L — le champ de directions (Phase 5) ─────────────────
  {
    id: 'p5-champ-directions',
    phase: 5,
    title: 'Le champ de directions',
    tagline: 'Une EDO dessine des pentes ; les solutions les suivent',
    intro: ['Une équation différentielle impose une pente en chaque point. Lâche une condition initiale : l’histoire s’écrit toute seule.'],
    course: [
      {
        kind: 'p',
        text:
          'Avec le ressort, tu as vu qu’une équation différentielle est une **règle locale**. Voici la meilleure façon de la *voir* : en chaque point du plan, dessine un petit segment de pente $y\' = f(x, y)$. C’est le champ de directions — la carte des courants de la rivière.',
      },
      {
        kind: 'p',
        text:
          'Résoudre l’équation, c’est lâcher un bouchon dans la rivière : depuis la condition initiale, la solution suit les segments, de proche en proche. Clique n’importe où dans la simulation : chaque clic est un début d’histoire différent, mais toutes obéissent à la même règle.',
      },
      {
        kind: 'math',
        latex: "y' = 3 - y",
        caption:
          'Le café qui refroidit (loi de Newton) : plus l’écart à la température ambiante (3) est grand, plus ça change vite. Le signe ramène toujours vers 3.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Les lignes vertes sont les **équilibres** : là où $y\' = 0$, plus rien ne bouge. Un équilibre est *stable* si les courants y ramènent (le café à 3), *instable* s’ils en fuient (une population de 0 individus : au moindre couple, ça explose).',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Clique pour lâcher des solutions dans les trois rivières. Trouve les équilibres stables et instables.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'direction-field' },
      },
      {
        id: 'e2',
        prompt: 'L’équilibre du café : résous 0 = 3 − y.',
        start: ['Equal', 0, ['Subtract', 3, 'y']],
        goal: ['Equal', 'y', 3],
        hint: 'Fais traverser le −y (il devient +y), puis nettoie le +0.',
      },
    ],
  },

  // ───────────────── Station T — probabilités (Phase 10) ─────────────────
  {
    id: 'p10-hasard-compte',
    phase: 10,
    title: 'Compter le hasard',
    tagline: 'Une probabilité est une fraction : favorables / possibles',
    intro: ['Le hasard se compte : cas favorables divisés par cas possibles, quand tous les cas se valent.'],
    course: [
      {
        kind: 'p',
        text:
          'Le hasard paraît insaisissable, et pourtant il se **compte**. Quand tous les résultats se valent (un dé honnête, une pièce équilibrée), la probabilité d’un événement est une simple fraction :',
      },
      {
        kind: 'math',
        latex: 'P(A) = \\dfrac{\\text{cas favorables}}{\\text{cas possibles}}',
        caption: 'Toujours entre 0 (impossible) et 1 (certain). Un nombre pur, sans dimension — l’analyse dimensionnelle approuve.',
      },
      {
        kind: 'example',
        title: 'Le dé',
        steps: [
          '« Obtenir un nombre pair » : les cas favorables sont 2, 4, 6 — il y en a 3.',
          'Les cas possibles : 1, 2, 3, 4, 5, 6 — il y en a 6.',
          '$P = 3/6 = 0{,}5$. Une chance sur deux.',
        ],
      },
      {
        kind: 'p',
        text:
          'Deux événements **indépendants** (l’un n’influence pas l’autre) ? Leurs probabilités se **multiplient** : deux « pile » de suite, c’est $\\frac{1}{2} \\times \\frac{1}{2} = \\frac{1}{4}$. Et l’événement contraire se calcule en soustrayant de 1 : encore le vieux réflexe des opérations inverses.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le piège du joueur : après cinq « pile » d’affilée, la pièce ne « doit » rien. Le sixième lancer reste à $\\frac{1}{2}$ — la pièce n’a pas de mémoire.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Un dé : P(pair) = 3 cas sur 6. Calcule.',
        start: ['Equal', 'p', ['Divide', 3, 6]],
        goal: ['Equal', 'p', 0.5],
        strictGoal: true,
        hint: 'Appuie sur la fraction.',
      },
      {
        id: 'e2',
        prompt: 'Deux « pile » de suite : les indépendants se multiplient.',
        start: ['Equal', 'p', ['Multiply', ['Divide', 1, 2], ['Divide', 1, 2]]],
        goal: ['Equal', 'p', 0.25],
        strictGoal: true,
        hint: 'Appuie sur le produit des deux fractions.',
      },
      {
        id: 'e3',
        prompt: 'La probabilité du contraire : P(au moins un face) = 1 − 1/4.',
        start: ['Equal', 'p', ['Subtract', 1, ['Divide', 1, 4]]],
        goal: ['Equal', 'p', 0.75],
        strictGoal: true,
        hint: 'Le contraire de « aucun face » : appuie sur le calcul.',
      },
    ],
    generator: (): Exercise => {
      const n = [4, 5, 10][rand(0, 2)];
      const k = rand(1, n - 1);
      return {
        id: `gen-${Date.now()}`,
        prompt: `Bonus : ${k} cas favorable${k > 1 ? 's' : ''} sur ${n} possibles. Calcule p.`,
        start: ['Equal', 'p', ['Divide', k, n]],
        goal: ['Equal', 'p', k / n],
        strictGoal: true,
        hint: 'Favorables sur possibles.',
      };
    },
  },
  {
    id: 'p10-galton',
    phase: 10,
    title: 'La planche de Galton',
    tagline: 'Mille hasards individuels, une seule forme collective',
    intro: ['Chaque bille choisit au hasard, gauche ou droite, dix fois. Et pourtant le tas final a toujours la même forme : la cloche.'],
    course: [
      {
        kind: 'p',
        text:
          'Chaque bille qui tombe fait 10 choix pile-ou-face. Son trajet est **imprévisible**. Mais lâche cent billes, mille billes… et le tas prend toujours la même forme : une cloche, haute au centre, fine aux bords. L’ordre naît du désordre.',
      },
      {
        kind: 'p',
        text:
          'Pourquoi le centre gagne-t-il ? Parce qu’il y a **beaucoup plus de chemins** qui y mènent. Pour finir tout à gauche, il faut 10 « gauche » d’affilée : un seul chemin sur 1024. Pour finir au centre, n’importe quels 5 « gauche » sur 10 suffisent : 252 chemins. La probabilité, c’est du comptage de chemins.',
      },
      {
        kind: 'math',
        latex: 'P(k) = \\dfrac{\\binom{10}{k}}{2^{10}}',
        caption:
          'La loi binomiale : nombre de chemins vers la case $k$, sur le nombre total. En orange dans la simulation — les billes la retrouvent toutes seules.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'C’est le théorème central limite, le plus important des probabilités : additionne beaucoup de petits hasards indépendants, et la cloche de Gauss apparaît — tailles humaines, erreurs de mesure, bruit électronique. Francis Galton appelait sa planche le « quinconce » et y voyait « la loi suprême du désordre ».',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Lâche 1 bille (imprévisible), puis 100 (prévisible !). Compare le tas à la courbe orange.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'galton' },
      },
      {
        id: 'e2',
        prompt: 'Mini-planche à 4 rangées : 16 chemins possibles, 4 mènent à la case 1. Calcule p.',
        start: ['Equal', 'p', ['Divide', 4, 16]],
        goal: ['Equal', 'p', 0.25],
        strictGoal: true,
        hint: 'Chemins favorables sur chemins possibles : la leçon précédente, appliquée aux trajets.',
      },
    ],
  },
  {
    id: 'p10-bayes',
    phase: 10,
    title: 'Le piège de Bayes',
    tagline: 'Test positif ≠ malade : la maladie rare noie le test',
    intro: ['Un test fiable à 99 % rend positif… et pourtant tu n’as qu’une chance sur dix d’être malade. Compte les points pour comprendre.'],
    course: [
      {
        kind: 'p',
        text:
          'Une maladie touche 1 personne sur 100. Le test la détecte 99 fois sur 100, et ne donne que 9 % de fausses alertes. Ton test est **positif**. Quelle est la probabilité que tu sois malade ? Presque tout le monde répond « 99 % ». La vraie réponse : environ **10 %**.',
      },
      {
        kind: 'p',
        text:
          'Le secret : ne raisonne pas en pourcentages, raisonne en **population**. Sur 10 000 personnes : 100 sont malades, le test en détecte 99. Mais 9 900 sont saines, et 9 % de fausses alertes, c’est **891 personnes saines** avec un test positif. Les vrais cas sont noyés dans les fausses alertes, car la maladie est rare.',
      },
      {
        kind: 'math',
        latex: 'P(\\text{malade} \\mid +) = \\dfrac{99}{99 + 891} = \\dfrac{99}{990} = 0{,}1',
        caption:
          'La formule de Bayes, version comptage : les vrais positifs, divisés par tous les positifs. Le dénominateur est un tout : encore favorables / possibles.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Dans la simulation, baisse la prévalence : plus la maladie est rare, plus $P(\\text{malade}\\mid+)$ s’effondre — avec le **même** test. La qualité d’un test ne veut rien dire sans le contexte. C’est pourquoi on ne dépiste pas toute la population pour une maladie rarissime.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Ce raisonnement a un nom : le théorème de Bayes (1763). Il gouverne le diagnostic médical, les filtres anti-spam, la justice (l’erreur du procureur !) et l’apprentissage des IA : réviser une croyance à la lumière d’un indice.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Joue avec les trois curseurs. Trouve un réglage où le test positif est presque sûr — et un où il ne veut presque rien dire.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'bayes' },
      },
      {
        id: 'e2',
        prompt: 'Compte : 99 vrais positifs, 891 fausses alertes. Calcule P = 99/(99+891).',
        start: ['Equal', 'P', ['Divide', 99, ['Add', 99, 891]]],
        goal: ['Equal', 'P', 0.1],
        strictGoal: true,
        hint: 'Calcule d’abord le dénominateur, puis la fraction.',
      },
    ],
  },
];
