import type { Lesson } from './schema';

/**
 * Batch 8 : l'effet tunnel (station V, suite) et la relativité restreinte
 * (station W — Phase 15). Pas de Three.js : l'espace-temps 1+1D est un
 * plan, le diagramme de Minkowski se dessine en canvas.
 */

export const lessonsRelativite: Lesson[] = [
  // ───────────────── Station V (suite) — l'effet tunnel (Phase 14) ─────────────────
  {
    id: 'p14-tunnel',
    phase: 14,
    title: 'L’effet tunnel',
    tagline: 'Traverser un mur infranchissable — avec ton exponentielle',
    intro: ['Quand l’énergie manque, ψ ne s’arrête pas net : elle décroît en e^(−κx). Si le mur est fin, elle ressort de l’autre côté.'],
    course: [
      {
        kind: 'p',
        text:
          'Lance une balle contre un mur trop haut : elle retombe, toujours. Lance un **électron** contre une barrière d’énergie trop haute : parfois, il apparaît de l’autre côté. Pas par-dessus — *à travers*. L’explication tient dans Schrödinger : dans la barrière, l’équation n’a plus de solution oscillante, mais elle a encore une solution — ton exponentielle décroissante :',
      },
      {
        kind: 'math',
        latex: '\\psi \\propto e^{-\\kappa x}, \\qquad \\kappa = \\sqrt{2m(V - E)}/\\hbar, \\qquad T \\approx e^{-2\\kappa L}',
        caption:
          'Dans le mur, ψ s’évanouit sans s’annuler. Si la largeur L est finie, il en reste quelque chose à la sortie : la probabilité de traverser T chute exponentiellement avec l’épaisseur — chaque angström compte.',
      },
      {
        kind: 'example',
        title: 'Là où le tunnel travaille',
        steps: [
          '**Le Soleil** : deux protons n’ont classiquement jamais l’énergie de fusionner (répulsion électrique). Ils passent par tunnel — sans lui, pas de lumière du jour.',
          '**La radioactivité α** : la particule α s’échappe du noyau par tunnel. Gamow (1928) en a déduit les demi-vies : première victoire de la quantique sur le noyau.',
          '**Le microscope à effet tunnel (STM)** : un courant d’électrons tunnelants entre une pointe et une surface, si sensible à la distance (exponentielle !) qu’il « voit » les atomes un à un. Nobel 1986.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'La sensibilité exponentielle est la clé : T ≈ e^(−2κL) veut dire que doubler l’épaisseur ne divise pas la probabilité par 2 — elle l’**élève au carré**. Un mur deux fois plus épais qui laissait passer 1 sur 10 laisse passer 1 sur 100. C’est pour ça que ton café ne traverse pas la tasse.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Ta mémoire flash fonctionne par tunnel : chaque bit est un paquet d’électrons poussés à travers un isolant « infranchissable » vers une grille flottante. Tu portes dans ta poche des milliards de murs quantiques traversés à la demande.',
      },
    ],
    exercises: [
      {
        id: 'tunnel-explore',
        prompt: 'Élargis la barrière : regarde l’onde transmise s’effondrer. Puis monte κ (mur plus haut).',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'tunnel' },
      },
      {
        id: 'tunnel-kappa',
        prompt: 'La raideur de l’évanescence : κ = √(2(V−E)) avec V−E = 8 (unités du théoricien).',
        start: ['Equal', 'k', ['Sqrt', ['Multiply', 2, 8]]],
        goal: ['Equal', 'k', 4],
        strictGoal: true,
        hint: 'Calcule sous la racine, puis la racine. Plus le mur dépasse E, plus ψ meurt vite.',
      },
      {
        id: 'tunnel-carre',
        prompt: 'Un mur laisse passer T = 0,1. On double son épaisseur : T′ = T². Calcule.',
        start: ['Equal', 'T', ['Power', 0.1, 2]],
        goal: ['Equal', 'T', 0.01],
        strictGoal: true,
        hint: 'Doubler L élève T au carré : de 1 sur 10 à 1 sur 100 — la loi exponentielle.',
      },
    ],
  },

  // ───────────────── Station W — la relativité restreinte (Phase 15) ─────────────────
  {
    id: 'p15-minkowski',
    phase: 15,
    title: 'L’espace-temps de Minkowski',
    tagline: 'Le « maintenant » n’existe pas : chacun a le sien',
    intro: ['Deux postulats — la physique est la même pour tous, la lumière va à c pour tous — et la simultanéité s’effondre.'],
    course: [
      {
        kind: 'p',
        text:
          'Einstein, 1905, part de deux phrases : les lois de la physique sont les mêmes pour tous les observateurs en mouvement uniforme, et la lumière va à $c$ **pour tous** — que tu la poursuives ou que tu la fuies. La seconde est folle (une voiture que tu poursuis semble ralentir ; la lumière, jamais). Tout le reste en découle par simple géométrie.',
      },
      {
        kind: 'p',
        text:
          'L’outil : le **diagramme de Minkowski**. Porte l’espace $x$ en abscisse et le temps $ct$ en ordonnée : chaque point est un **événement**, ta vie est une courbe (ta *ligne d’univers*), et la lumière trace les diagonales à 45° — le **cône** que rien ne franchit.',
      },
      {
        kind: 'math',
        latex: 's^2 = (ct)^2 - x^2',
        caption:
          'L’intervalle d’espace-temps : LA quantité sur laquelle tous les observateurs sont d’accord — le théorème de Pythagore de la relativité, avec un signe moins qui change tout. Chacun découpe s² en « temps » et « espace » à sa façon ; s² est invariant.',
      },
      {
        kind: 'example',
        title: 'Lire le diagramme (la simulation ci-dessous)',
        steps: [
          'Monte la vitesse : les axes de l’observateur mobile se **referment en ciseaux** sur le cône de lumière — jamais au-delà.',
          'Son axe $x\'$ est son « maintenant » : il **bascule**. Les événements A et B, simultanés pour toi, ne le sont plus pour lui.',
          'Ses secondes (points bleus 1, 2, 3) se lisent sur l’hyperbole $ct^2 - x^2 = 1$ : elles paraissent plus longues que les tiennes — la dilatation du temps, en géométrie pure.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'La question « que se passe-t-il *en ce moment* sur Mars ? » n’a pas de réponse unique : selon ta vitesse, ton « maintenant » y découpe des instants différents (de plusieurs minutes !). La simultanéité n’est pas une propriété du monde — c’est une propriété de l’observateur.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Minkowski, l’ancien prof de maths d’Einstein (qui le trouvait « paresseux »), a donné en 1908 la forme géométrique de la théorie : « Désormais, l’espace seul et le temps seul sont condamnés à s’évanouir en ombres, et seule une union des deux gardera une réalité indépendante. »',
      },
    ],
    exercises: [
      {
        id: 'minkowski-explore',
        prompt: 'Monte v : les ciseaux se referment, le « maintenant » bascule, B passe avant A.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'minkowski' },
      },
      {
        id: 'minkowski-intervalle',
        prompt: 'L’invariant : s² = (ct)² − x² pour ct = 5 et x = 3.',
        start: ['Equal', 's', ['Sqrt', ['Add', ['Power', 5, 2], ['Negate', ['Power', 3, 2]]]]],
        goal: ['Equal', 's', 4],
        strictGoal: true,
        hint: '25 − 9 = 16, puis la racine : le Pythagore de l’espace-temps, avec son signe moins.',
      },
    ],
  },
  {
    id: 'p15-dilatation',
    phase: 15,
    title: 'La dilatation du temps',
    tagline: 'γ = 1/√(1 − v²/c²) — les muons le prouvent à chaque seconde',
    intro: ['Une horloge en mouvement bat plus lentement — d’un facteur γ que tu vas calculer par gestes.'],
    course: [
      {
        kind: 'p',
        text:
          'Prends une horloge de lumière : un photon qui rebondit entre deux miroirs, tic, toc. Regarde-la passer à la vitesse $v$ : pour toi, le photon parcourt une **diagonale** — plus longue. Mais la lumière va à $c$ pour tout le monde (postulat 2) : donc, vu de toi, le tic-toc mobile prend **plus de temps**. Pythagore fait le reste :',
      },
      {
        kind: 'math',
        latex: '\\Delta t = \\gamma\\, \\Delta t_0, \\qquad \\gamma = \\frac{1}{\\sqrt{1 - v^2/c^2}}',
        caption:
          'Δt₀ est le temps propre (celui de l’horloge). À v = 0,6c, γ = 1,25 : les secondes mobiles durent 25 % de plus. À 0,995c, γ ≈ 10. Et γ → ∞ quand v → c : la lumière ne vieillit pas.',
      },
      {
        kind: 'example',
        title: 'La preuve tombe du ciel : les muons',
        steps: [
          'Les rayons cosmiques créent des **muons** à ~15 km d’altitude. Durée de vie : 2,2 μs — même à la vitesse de la lumière, ils devraient parcourir ~660 m et mourir en route.',
          'Pourtant ils pleuvent sur le sol par milliers chaque seconde. Leur γ ≈ 20 : *vu de nous*, leur horloge interne tourne 20 fois plus lentement — ils ont le temps.',
          'Vu du muon ? Son horloge est normale, mais l’atmosphère est **contractée** d’un facteur 20 : 750 m à traverser. Les deux récits diffèrent, les deux prédisent son arrivée. La physique est sauve.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Ton GPS vit de ces corrections : les horloges des satellites dérivent de −7 μs/jour (vitesse) et +45 μs/jour (gravité — la relativité générale). Sans correction, ta position glisserait de **10 km par jour**. La relativité n’est pas de la philosophie : c’est de l’ingénierie quotidienne.',
      },
    ],
    exercises: [
      {
        id: 'dilatation-gamma',
        prompt: 'Calcule γ pour v = 0,6c : γ = 1/√(1 − 0,6²).',
        start: ['Equal', 'g', ['Divide', 1, ['Sqrt', ['Add', 1, ['Negate', ['Power', 0.6, 2]]]]]],
        goal: ['Equal', 'g', 1.25],
        strictGoal: true,
        hint: '0,36 puis 0,64 puis 0,8 puis 1/0,8 : quatre taps de calcul, un facteur de Lorentz.',
      },
      {
        id: 'dilatation-temps',
        prompt: 'Un voyage de 8 ans (temps propre) à v = 0,6c : combien d’années pour la Terre ? Δt = γ·Δt₀.',
        start: ['Equal', 't', ['Multiply', 1.25, 8]],
        goal: ['Equal', 't', 10],
        strictGoal: true,
        hint: 'Le jumeau voyageur revient avec 8 ans de plus ; son frère en a pris 10.',
      },
    ],
  },
];
