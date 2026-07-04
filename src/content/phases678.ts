import type { Exercise, Lesson } from './schema';

/** Entier aléatoire dans [min, max]. */
function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Phases 6–9 : le tournant universitaire.
 * Méthodes d'expert (analyse dimensionnelle, cas limites), algèbre linéaire
 * visuelle, multivariable en 3D, Fourier et les grandes équations lues comme
 * de la prose. Chaque leçon a un cours riche (KaTeX) + des gestes.
 */
export const lessonsPhases6to9: Lesson[] = [
  // ───────────────────────── Phase 6 — Méthodes d'expert ─────────────────────────
  {
    id: 'p6-analyse-dimensionnelle',
    phase: 6,
    title: "L'analyse dimensionnelle",
    tagline: 'Deviner une formule sans rien résoudre',
    intro: ['Les unités doivent s’équilibrer de chaque côté du = : c’est le filtre de réalité de la physique.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici le premier réflexe des experts, et il ne demande aucun calcul : regarder les unités. Une équation de physique n’a le droit d’exister que si ses dimensions s’équilibrent parfaitement de part et d’autre du signe $=$. Des mètres d’un côté exigent des mètres de l’autre.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'On raconte que les physiciens « vérifient les dimensions » avant même de lire une formule. Geoffrey Taylor a estimé l’énergie de la première bombe atomique — un secret militaire — à partir d’une simple photo de la boule de feu, uniquement par analyse dimensionnelle.',
      },
      {
        kind: 'p',
        text:
          'Le jeu : le pendule. Sa période $T$ (un temps) pourrait dépendre de la longueur $L$ du fil (une longueur), de la masse $m$ (une masse) et de la gravité $g$ (une accélération : longueur ÷ temps²). Quelle combinaison donne un temps pur ?',
      },
      {
        kind: 'example',
        title: 'La déduction, pas à pas',
        steps: [
          'Il faut fabriquer des secondes. Or $[g] = \\mathrm{m}/\\mathrm{s}^2$ : c’est la seule source de « temps » disponible.',
          'Divisons : $[L/g] = \\mathrm{m} \\div (\\mathrm{m}/\\mathrm{s}^2) = \\mathrm{s}^2$. Des secondes au carré !',
          'Une racine carrée termine le travail : $\\sqrt{L/g}$ est un temps.',
          'Et la masse $m$ ? Aucune autre grandeur ne contient des kilogrammes pour l’annuler… donc elle ne peut pas apparaître. Un pendule lourd et un pendule léger battent la même mesure.',
        ],
      },
      {
        kind: 'math',
        latex: 'T = 2\\pi\\sqrt{\\dfrac{L}{g}}',
        caption:
          'La vraie formule. L’analyse dimensionnelle donne toute la structure — seul le $2\\pi$ (sans dimension) demande de résoudre l’équation différentielle.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Sans dimension homogène, pas d’équation : si ton résultat donne $T = L \\cdot g$, inutile de vérifier le calcul, c’est faux. Ce filtre attrape la majorité des erreurs en une seconde.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'La structure du pendule : T² = L/g. Isole T (période positive).',
        start: ['Equal', ['Power', 'T', 2], ['Divide', 'L', 'g']],
        goal: ['Equal', 'T', ['Sqrt', ['Divide', 'L', 'g']]],
        hint: 'Appuie sur T² : la racine s’applique aux deux côtés. Une période est positive.',
      },
      {
        id: 'e2',
        prompt: 'Les dimensions de g : g = L/T². Fais passer T² pour exprimer L.',
        start: ['Equal', 'g', ['Divide', 'L', ['Power', 'T', 2]]],
        goal: ['Equal', ['Multiply', 'g', ['Power', 'T', 2]], 'L'],
        hint: 'Attrape le T² au dénominateur et fais-le traverser le = : il repasse en multiplication.',
      },
      {
        id: 'e3',
        prompt: 'L’énergie cinétique donne 2E = m·v². Isole v (vitesse positive).',
        start: ['Equal', ['Multiply', 2, 'E'], ['Multiply', 'm', ['Power', 'v', 2]]],
        goal: ['Equal', 'v', ['Sqrt', ['Divide', ['Multiply', 2, 'E'], 'm']]],
        hint: 'Fais d’abord traverser le facteur m, puis appuie sur v².',
      },
    ],
  },
  {
    id: 'p6-cas-limites',
    phase: 6,
    title: 'Les cas limites',
    tagline: 'Pousser une formule à ses extrêmes pour la comprendre',
    intro: ['Que fait la formule quand une variable tend vers 0 ou vers l’infini ? Si ça contredit le bon sens, la formule est fausse.'],
    course: [
      {
        kind: 'p',
        text:
          'Deuxième réflexe d’expert : au lieu de contempler une formule opaque, on la pousse à bout. On envoie chaque variable vers $0$ ou vers l’infini, et on vérifie que le résultat colle au bon sens physique. Une formule qui survit à tous ses cas limites est presque sûrement la bonne.',
      },
      {
        kind: 'math',
        latex: 'F = 6\\pi\\,\\eta\\, r\\, v',
        caption:
          'La force de frottement de Stokes sur une bille de rayon $r$ qui tombe à la vitesse $v$ dans un fluide de viscosité $\\eta$ (du miel : $\\eta$ grand ; de l’air : $\\eta$ minuscule).',
      },
      {
        kind: 'example',
        title: 'Trois coups de boutoir',
        steps: [
          '$r \\to 0$ : la bille disparaît… et $F \\to 0$. Une bille inexistante ne frotte pas. ✓',
          '$v \\to 0$ : la bille immobile… $F \\to 0$. Pas de mouvement, pas de frottement. ✓',
          '$\\eta \\to \\infty$ : du béton liquide… $F \\to \\infty$. Impossible d’y avancer. ✓',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le piège inverse : une formule qui donne une force infinie pour une vitesse nulle, ou une énergie négative quand la masse grandit, est morte avant tout calcul. Teste toujours les extrêmes en premier.',
      },
      {
        kind: 'p',
        text:
          'Ce réflexe s’appelle parfois « Street-Fighting Mathematics » (Sanjoy Mahajan, MIT) : mieux vaut une réponse approximative comprise qu’une réponse exacte incomprise. Les gestes ci-dessous te font manipuler la formule de Stokes elle-même.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Mesure : F = 36, avec un coefficient 6 et r = 2. Trouve v.',
        start: ['Equal', 36, ['Multiply', 6, 2, 'v']],
        goal: ['Equal', 3, 'v'],
        hint: 'Fais traverser les facteurs 6 puis 2 (ils deviennent des divisions), et calcule.',
      },
      {
        id: 'e2',
        prompt: 'En symboles : F = k·r·v. Isole v pour voir la structure.',
        start: ['Equal', 'F', ['Multiply', 'k', 'r', 'v']],
        goal: ['Equal', 'v', ['Divide', 'F', ['Multiply', 'k', 'r']]],
        hint: 'Fais traverser k puis r : chacun passe au dénominateur.',
      },
    ],
    generator: (): Exercise => {
      const r = rand(2, 5);
      const v = rand(2, 9);
      const k = rand(2, 4);
      return {
        id: `gen-${Date.now()}`,
        prompt: `Bonus : F = ${k * r * v}, coefficient ${k}, rayon ${r}. Trouve v.`,
        start: ['Equal', k * r * v, ['Multiply', k, r, 'v']],
        goal: ['Equal', v, 'v'],
        hint: 'Fais traverser les deux facteurs connus, puis calcule.',
      };
    },
  },

  // ───────────────── Phase 7 — L'algèbre du plan et de l'espace ─────────────────
  {
    id: 'p7-vecteurs',
    phase: 7,
    title: 'Les flèches qui s’additionnent',
    tagline: 'Vecteurs : le + devient géométrique',
    intro: ['Un vecteur est une flèche : une direction et une longueur. Leur addition suit la règle du parallélogramme.'],
    course: [
      {
        kind: 'p',
        text:
          'Te souviens-tu du tout premier chapitre — le $+$ qui déplace sur une droite ? Le voici qui grandit : un vecteur est une flèche du plan, avec une direction et une longueur. Additionner deux vecteurs, c’est mettre les flèches bout à bout.',
      },
      {
        kind: 'math',
        latex: '\\vec{u} + \\vec{v} = (u_x + v_x,\\; u_y + v_y)',
        caption: 'Composante par composante : deux additions ordinaires, une dans chaque direction.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est la spirale de l’apprentissage : le $+$ de l’école primaire revient, mais en deux dimensions. Il reviendra encore — addition de matrices, superposition d’ondes, états quantiques. Toujours le même geste.',
      },
      {
        kind: 'p',
        text:
          'Et la longueur d’un vecteur ? Ses composantes forment un triangle rectangle, donc Pythagore répond : $\\|\\vec{v}\\|^2 = v_x^2 + v_y^2$. Une force de 3 N vers l’est plus 4 N vers le nord n’a pas une intensité de 7 N, mais de 5 N — la diagonale est plus courte que le chemin.',
      },
      {
        kind: 'example',
        title: 'Le triangle 3-4-5',
        steps: [
          'Composantes : $v_x = 3$, $v_y = 4$.',
          'Pythagore : $\\|\\vec{v}\\|^2 = 3^2 + 4^2 = 9 + 16 = 25$.',
          'Racine (une longueur est positive) : $\\|\\vec{v}\\| = 5$.',
        ],
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Attrape les extrémités de u et v. Observe la diagonale du parallélogramme.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'vectors' },
      },
      {
        id: 'e2',
        prompt: 'Le vecteur (3, 4) : calcule sa norme n (positive).',
        start: ['Equal', ['Power', 'n', 2], ['Add', ['Power', 3, 2], ['Power', 4, 2]]],
        goal: ['Equal', 'n', 5],
        hint: 'Calcule les carrés, additionne, puis appuie sur n² pour prendre la racine.',
      },
    ],
    generator: (): Exercise => {
      const triples: [number, number, number][] = [
        [3, 4, 5],
        [6, 8, 10],
        [5, 12, 13],
        [8, 15, 17],
      ];
      const [a, b, c] = triples[rand(0, triples.length - 1)];
      return {
        id: `gen-${Date.now()}`,
        prompt: `Bonus : norme du vecteur (${a}, ${b}).`,
        start: ['Equal', ['Power', 'n', 2], ['Add', ['Power', a, 2], ['Power', b, 2]]],
        goal: ['Equal', 'n', c],
        hint: 'Carrés, somme, racine.',
      };
    },
  },
  {
    id: 'p7-matrices',
    phase: 7,
    title: 'Les matrices transforment le plan',
    tagline: 'Une matrice est un verbe : elle agit sur l’espace',
    intro: ['Une matrice 2×2 n’est pas un tableau de nombres : c’est une transformation du plan tout entier.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici l’idée qui déverrouille toute l’algèbre linéaire : une matrice n’est pas un tableau de nombres, c’est un **verbe**. Elle prend chaque point du plan et l’envoie ailleurs — rotation, étirement, cisaillement. Et pour la connaître entièrement, il suffit de savoir où vont deux flèches : $\\hat{\\imath} = (1,0)$ et $\\hat{\\jmath} = (0,1)$.',
      },
      {
        kind: 'math',
        latex: 'M = \\begin{pmatrix} a & c \\\\ b & d \\end{pmatrix} \\;:\\quad \\hat{\\imath} \\mapsto (a, b), \\quad \\hat{\\jmath} \\mapsto (c, d)',
        caption: 'Les colonnes de la matrice sont les destinations de î et ĵ. Tout le reste suit par linéarité.',
      },
      {
        kind: 'p',
        text:
          'Et le déterminant ? C’est le facteur d’aire. Le petit carré unité (côtés $\\hat{\\imath}$ et $\\hat{\\jmath}$) devient un parallélogramme : son aire est $|\\det M|$. Si $\\det M < 0$, le plan a été retourné comme une crêpe. Si $\\det M = 0$, le plan est écrasé sur une droite — et il n’y a plus de retour possible : la matrice n’est pas inversible.',
      },
      {
        kind: 'math',
        latex: '\\det M = ad - bc',
        caption: 'Aire (orientée) de l’image du carré unité.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'La matrice inverse $M^{-1}$ est le verbe qui **défait** : elle ramène chaque point d’où il vient. Le vieux réflexe des opérations inverses — défaire une addition, défaire un carré — s’applique maintenant à l’espace entier.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Composer deux transformations se lit de droite à gauche : $AB$ signifie « d’abord $B$, puis $A$ ». Et en général $AB \\neq BA$ — tourner puis étirer n’est pas étirer puis tourner. La multiplication perd sa commutativité en grandissant.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Fais glisser M·î et M·ĵ. Essaie les préréglages : regarde l’aire bleue (le déterminant).',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'matrix' },
      },
      {
        id: 'e2',
        prompt: 'Calcule le déterminant : D = 2·3 − 1·4.',
        start: ['Equal', 'D', ['Subtract', ['Multiply', 2, 3], ['Multiply', 1, 4]]],
        goal: ['Equal', 'D', 2],
        hint: 'Appuie sur chaque produit, puis sur la soustraction.',
      },
      {
        id: 'e3',
        prompt: 'Une transformation triple les aires : 12 = 3·A. Quelle était l’aire de départ ?',
        start: ['Equal', 12, ['Multiply', 3, 'A']],
        goal: ['Equal', 4, 'A'],
        hint: 'Le facteur 3 traverse le = en division.',
      },
    ],
  },
  {
    id: 'p7-directions-propres',
    phase: 7,
    title: 'Les directions propres',
    tagline: 'Les axes que la transformation ne fait pas tourner',
    intro: ['Certaines directions résistent : la matrice les étire sans les faire tourner. Ce sont les vecteurs propres.'],
    course: [
      {
        kind: 'p',
        text:
          'Applique une transformation au plan : presque toutes les flèches changent de direction. Presque. Certaines directions privilégiées sont seulement **étirées** — la flèche reste sur sa droite, elle s’allonge ou se comprime. Ce sont les *vecteurs propres*, et leur facteur d’étirement est la *valeur propre* $\\lambda$.',
      },
      {
        kind: 'math',
        latex: 'M\\vec{v} = \\lambda \\vec{v}',
        caption:
          'La définition tient en quatre symboles : transformer $\\vec{v}$ revient simplement à le multiplier par un nombre.',
      },
      {
        kind: 'example',
        title: 'L’intuition de la caisse',
        steps: [
          'Pousse une caisse exactement dans l’axe de sa poignée : elle avance tout droit. Ta poussée est un vecteur propre.',
          'Pousse de biais : la caisse avance **et** pivote. Direction non propre.',
          'La valeur propre dit combien la caisse avance pour une poussée donnée.',
        ],
      },
      {
        kind: 'p',
        text:
          'Deux indices gratuits, sans rien résoudre : la somme des valeurs propres égale la *trace* $a+d$, et leur produit égale le déterminant. Deux équations offertes par la matrice elle-même.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Ces directions invisibles sont partout : les axes principaux d’une rotation de planète, les modes de vibration d’un pont, les états stationnaires en mécanique quantique — et le PageRank de Google est un vecteur propre géant du graphe du web.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Cherche les droites vertes : glisse M·î et M·ĵ et observe quand elles existent (et quand tout tourne).',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'matrix', mode: 'eigen' },
      },
      {
        id: 'e2',
        prompt: 'Sur une direction propre : 3·v = λ·v. Trouve λ.',
        start: ['Equal', ['Multiply', 3, 'v'], ['Multiply', 'lambda', 'v']],
        goal: ['Equal', 3, 'lambda'],
        hint: 'Fais traverser v (il passe en division), puis simplifie v/v.',
      },
      {
        id: 'e3',
        prompt: 'La trace vaut la somme des valeurs propres : λ + 2 = 3 + 4. Trouve λ.',
        start: ['Equal', ['Add', 'lambda', 2], ['Add', 3, 4]],
        goal: ['Equal', 'lambda', 5],
        hint: 'Calcule la droite, puis fais traverser le 2.',
      },
    ],
  },

  // ───────────────── Phase 8 — Surfaces et champs : la 3e dimension ─────────────────
  {
    id: 'p8-surfaces',
    phase: 8,
    title: 'La 3e dimension : z = f(x, y)',
    tagline: 'Les fonctions deviennent des paysages',
    intro: ['Une fonction de deux variables dessine une surface : un paysage avec des vallées, des cols et des sommets.'],
    course: [
      {
        kind: 'p',
        text:
          'Jusqu’ici nos fonctions dessinaient des courbes : une entrée $x$, une sortie $y$. Donnons-leur deux entrées : $z = f(x, y)$. Le graphe n’est plus une courbe mais un **paysage** — chaque point du sol $(x,y)$ a son altitude $z$. Fais-le tourner avec la souris : c’est ta première surface.',
      },
      {
        kind: 'math',
        latex: 'z = x^2 + y^2 \\quad\\text{(le bol)}, \\qquad z = x^2 - y^2 \\quad\\text{(la selle)}',
        caption: 'Deux paysages fondamentaux. Le troisième bouton anime une onde : $z$ dépend alors aussi du temps.',
      },
      {
        kind: 'p',
        text:
          'Comment dériver un paysage ? En ne bougeant que dans **une** direction à la fois. La *dérivée partielle* $\\partial z/\\partial x$ gèle $y$ et mesure la pente si tu marches plein est. Pour $z = x^2 + y^2$ : $\\partial z/\\partial x = 2x$ — le $y^2$, gelé, disparaît comme une constante.',
      },
      {
        kind: 'example',
        title: 'Chercher le fond du bol',
        steps: [
          'Au fond d’une vallée, la pente est nulle dans **toutes** les directions.',
          'Vers l’est : $\\partial z/\\partial x = 2x = 0$, donc $x = 0$.',
          'Vers le nord : $\\partial z/\\partial y = 2y = 0$, donc $y = 0$.',
          'Le fond du bol est en $(0,0)$. C’est l’optimisation en dimension 2 — et le principe d’entraînement des réseaux de neurones.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'La selle piège les distraits : en $(0,0)$ ses deux pentes s’annulent aussi… mais c’est un col, pas un sommet — minimum selon $x$, maximum selon $y$. Pente nulle ne suffit pas : il faut regarder la courbure.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Fais tourner le bol, la selle, puis l’onde (fige le temps pour l’examiner).',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'surface3d', fn: 'bowl' },
      },
      {
        id: 'e2',
        prompt: 'Au fond du bol, la pente s’annule : 0 = 2x. Trouve x.',
        start: ['Equal', 0, ['Multiply', 2, 'x']],
        goal: ['Equal', 0, 'x'],
        hint: 'Le facteur 2 traverse le = ; 0 divisé par 2 reste 0.',
      },
      {
        id: 'e3',
        prompt: 'Sur la selle, pente vers l’est au point x = 3 : p = 2·3.',
        start: ['Equal', 'p', ['Multiply', 2, 3]],
        goal: ['Equal', 'p', 6],
        hint: 'Un appui suffit.',
      },
    ],
  },
  {
    id: 'p8-gradient',
    phase: 8,
    title: 'Le gradient : la boussole des pentes',
    tagline: '∇f pointe vers la plus forte montée',
    intro: ['Le gradient rassemble les dérivées partielles en une flèche qui pointe vers la montée la plus raide.'],
    course: [
      {
        kind: 'p',
        text:
          'Les dérivées partielles donnent la pente vers l’est et la pente vers le nord. Rangeons-les dans un vecteur : voici le **gradient**, la boussole des pentes. En chaque point du paysage, $\\nabla f$ pointe vers la montée la plus raide, et sa longueur dit à quel point ça grimpe.',
      },
      {
        kind: 'math',
        latex: '\\nabla f = \\left( \\dfrac{\\partial f}{\\partial x},\\; \\dfrac{\\partial f}{\\partial y} \\right)',
        caption: 'Le triangle inversé se lit « nabla ». Un champ de flèches né d’un paysage scalaire.',
      },
      {
        kind: 'p',
        text:
          'La physique adore la descente : une bille dans un bol suit $-\\nabla f$, la pente la plus raide vers le bas. Plus précisément, toute force conservative dérive d’une énergie potentielle : $\\vec{F} = -\\nabla U$. La gravité **est** l’anti-gradient du paysage d’énergie.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le gradient est un vecteur : sa norme se calcule exactement comme au chapitre des flèches, $\\|\\nabla f\\|^2 = f_x^2 + f_y^2$. La spirale continue — Pythagore sert maintenant à mesurer des pentes.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'La « descente de gradient » qui entraîne les IA modernes n’est rien d’autre : le réseau descend pas à pas le paysage de l’erreur en suivant $-\\nabla f$, comme une bille dans un bol à des millions de dimensions.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Colline, bol, selle : le fond clair est le potentiel, les flèches sont son gradient. Regarde les particules grimper ou dévaler.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'vector-field', mode: 'gradient' },
      },
      {
        id: 'e2',
        prompt: 'Pentes fx = 3 et fy = 4 : calcule la raideur g = ‖∇f‖ (positive).',
        start: ['Equal', ['Power', 'g', 2], ['Add', ['Power', 3, 2], ['Power', 4, 2]]],
        goal: ['Equal', 'g', 5],
        hint: 'Le même triangle 3-4-5 que pour la norme d’un vecteur.',
      },
      {
        id: 'e3',
        prompt: 'Force et potentiel : F = −(2·3). Calcule F.',
        start: ['Equal', 'F', ['Negate', ['Multiply', 2, 3]]],
        goal: ['Equal', 'F', -6],
        hint: 'Calcule le produit ; le signe − reste : la force s’oppose à la montée.',
      },
    ],
  },

  // ───────────────── Phase 9 — Ondes et grandes équations ─────────────────
  {
    id: 'p9-fourier',
    phase: 9,
    title: 'Construire une onde',
    tagline: 'Tout signal est une somme de sinusoïdes',
    intro: ['Théorème stupéfiant : n’importe quel signal périodique est une somme de simples sinus. Même un créneau à angles droits.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici l’un des théorèmes les plus stupéfiants des mathématiques : **n’importe quel** signal périodique — même un créneau à angles parfaitement droits — est une somme de sinusoïdes pures. Il suffit de choisir les bonnes amplitudes. La liste des ingrédients s’appelle le *spectre* : c’est la recette du signal.',
      },
      {
        kind: 'math',
        latex: '\\text{créneau}(x) = \\frac{4}{\\pi}\\left( \\sin x + \\frac{\\sin 3x}{3} + \\frac{\\sin 5x}{5} + \\cdots \\right)',
        caption:
          'Chaque harmonique corrige les précédentes. Monte le curseur : la somme épouse le créneau — sauf de petites cornes près des sauts, le phénomène de Gibbs, qui refuse de disparaître.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Joseph Fourier a inventé cette décomposition en 1807 pour étudier la chaleur — l’Académie, Lagrange en tête, a refusé d’y croire. Aujourd’hui elle compresse ta musique (MP3), tes images (JPEG) et transporte le Wi-Fi.',
      },
      {
        kind: 'p',
        text:
          'Encore la spirale : additionner des ondes, c’est le $+$ de l’école primaire appliqué à des fonctions entières. On dit *superposition*. Et pour une onde qui se propage, trois grandeurs se tiennent : la vitesse $v$, la longueur d’onde $\\lambda$ (les mètres d’un motif) et la fréquence $f$ (les motifs par seconde).',
      },
      {
        kind: 'math',
        latex: 'v = \\lambda f',
        caption: 'Des mètres par motif × des motifs par seconde = des mètres par seconde. L’analyse dimensionnelle approuve.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Monte le nombre d’harmoniques pour chaque signal. Observe les cornes de Gibbs près des sauts.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'fourier' },
      },
      {
        id: 'e2',
        prompt: 'Une onde vérifie v = λ·f. Isole la fréquence f.',
        start: ['Equal', 'v', ['Multiply', 'lambda', 'f']],
        goal: ['Equal', 'f', ['Divide', 'v', 'lambda']],
        hint: 'Le facteur λ traverse le = en division.',
      },
      {
        id: 'e3',
        prompt: 'La pulsation : ω = 2π·f. Isole f.',
        start: ['Equal', 'omega', ['Multiply', 2, 'pi', 'f']],
        goal: ['Equal', 'f', ['Divide', 'omega', ['Multiply', 2, 'pi']]],
        hint: 'Fais traverser le 2, puis le π.',
      },
    ],
  },
  {
    id: 'p9-maxwell',
    phase: 9,
    title: 'Lire Maxwell comme une histoire',
    tagline: 'Quatre phrases qui contiennent la lumière',
    intro: ['Les quatre équations de Maxwell ne se calculent pas ici : elles se lisent, comme quatre phrases sur les sources et les tourbillons.'],
    course: [
      {
        kind: 'p',
        text:
          'Tu connais maintenant tous les mots : les champs de flèches, les sources (divergence) et les tourbillons (rotationnel). Alors lisons — sans rien calculer — les quatre équations qui gouvernent toute l’électricité, tout le magnétisme et toute la lumière de l’univers.',
      },
      {
        kind: 'math',
        latex: '\\nabla \\cdot \\vec{E} = \\frac{\\rho}{\\varepsilon_0}',
        caption:
          '« Les charges électriques sont des sources. » Le champ $\\vec{E}$ jaillit des charges + et s’engouffre dans les charges −, exactement comme le champ « source » de la simulation.',
      },
      {
        kind: 'math',
        latex: '\\nabla \\cdot \\vec{B} = 0',
        caption:
          '« Le magnétisme n’a pas de sources. » Divergence nulle partout : les lignes de champ magnétique se referment toujours en boucles. Casse un aimant en deux : tu obtiens deux aimants, jamais un pôle nord isolé.',
      },
      {
        kind: 'math',
        latex: '\\nabla \\times \\vec{E} = -\\frac{\\partial \\vec{B}}{\\partial t}',
        caption:
          '« Un champ magnétique qui varie fabrique un tourbillon électrique. » Le signe − est une résistance au changement (Lenz). C’est la dynamo : tout l’électricité de ton mur naît de cette phrase.',
      },
      {
        kind: 'math',
        latex: '\\nabla \\times \\vec{B} = \\mu_0 \\vec{J} + \\mu_0 \\varepsilon_0 \\frac{\\partial \\vec{E}}{\\partial t}',
        caption:
          '« Un courant — ou un champ électrique qui varie — fabrique un tourbillon magnétique. » Le champ « tourbillon » de la simulation, enroulé autour d’un fil.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Le coup de génie : combine les phrases 3 et 4. Un $\\vec{E}$ qui varie crée un $\\vec{B}$ tourbillonnant… qui varie… qui crée un $\\vec{E}$ tourbillonnant… L’onde s’auto-entretient et file dans le vide à $c = 1/\\sqrt{\\mu_0 \\varepsilon_0} \\approx 3\\times10^8$ m/s. Maxwell calcula cette vitesse en 1865, reconnut celle de la lumière, et comprit — par pur jeu d’opérateurs — ce qu’est la lumière.',
      },
      {
        kind: 'p',
        text:
          'La lumière est une onde : elle obéit donc à $c = \\lambda f$, la relation du chapitre précédent. Toute la spirale se referme — et les stations suivantes de la roadmap (Navier-Stokes, Schrödinger) se liront de la même façon : comme des phrases.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Relis les champs avec tes nouveaux yeux : la source = phrase 1, le tourbillon = phrase 4.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'vector-field' },
      },
      {
        id: 'e2',
        prompt: 'La lumière est une onde : c = λ·f. Isole λ (couleur ↔ longueur d’onde).',
        start: ['Equal', 'c', ['Multiply', 'lambda', 'f']],
        goal: ['Equal', 'lambda', ['Divide', 'c', 'f']],
        hint: 'Le facteur f traverse le = en division.',
      },
    ],
  },
];
