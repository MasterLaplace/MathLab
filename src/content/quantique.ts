import type { Lesson } from './schema';

/**
 * Batch 7 : le chaos (station U, suite) et le monde quantique (station V).
 * - Phase 13 : double pendule (l'effet papillon mesuré), espace des phases.
 * - Phase 14 : Schrödinger dans le puits infini, Heisenberg = Fourier.
 * Tout le spiralé converge ici : corde vibrante (O), complexes/Euler (Q),
 * Fourier (O), Lagrange (U) — la quantique n'utilise QUE des outils acquis.
 */

const HALF: ['Divide', number, number] = ['Divide', 1, 2];

export const lessonsQuantique: Lesson[] = [
  // ───────────────── Station U (suite) — le chaos (Phase 13) ─────────────────
  {
    id: 'p13-chaos',
    phase: 13,
    title: 'Le double pendule : le chaos',
    tagline: 'Déterministe ne veut pas dire prévisible',
    intro: ['Deux tiges, deux masses, des équations exactes — et un mouvement impossible à prédire au-delà de quelques secondes.'],
    course: [
      {
        kind: 'p',
        text:
          'Accroche un pendule au bout d’un autre. Le lagrangien de la leçon précédente crache les équations du mouvement en dix lignes — exactes, déterministes, sans le moindre hasard. Et pourtant : deux lancers **identiques au cent-millième près** divergent en quelques secondes, jusqu’à n’avoir plus rien en commun.',
      },
      {
        kind: 'math',
        latex: '\\delta(t) \\approx \\delta_0\\, e^{\\lambda t}',
        caption:
          'La signature du chaos : l’écart entre deux trajectoires voisines croît exponentiellement (λ est l’exposant de Lyapunov). Chaque seconde, l’erreur est multipliée par le même facteur — ton exponentielle de la Phase 3, dans son rôle le plus vertigineux.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le chaos n’est **pas** du hasard : rejoue exactement le même lancer, tu obtiens exactement le même film. Le problème est qu’« exactement » n’existe pas — aucune mesure n’a une précision infinie, et l’exponentielle dévore les décimales une à une.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Edward Lorenz découvre l’effet papillon en 1961 en relançant une simulation météo à partir d’un chiffre arrondi (0,506 au lieu de 0,506127) : la nouvelle météo n’avait plus rien à voir. D’où la limite fondamentale des prévisions à ~10 jours — ce n’est pas un problème d’ordinateur, c’est un théorème.',
      },
    ],
    exercises: [
      {
        id: 'chaos-explore',
        prompt: 'Regarde le jumeau orange (écart initial 10⁻⁵ rad) se détacher du bleu. Relance : le film est identique — jusqu’à la divergence.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'double-pendulum' },
      },
      {
        id: 'chaos-lyapunov',
        prompt: 'Un écart initial de 0,01 double chaque seconde. Que vaut-il après 10 s ? δ = 0,01·2¹⁰.',
        start: ['Equal', 'd', ['Multiply', 0.01, ['Power', 2, 10]]],
        goal: ['Equal', 'd', 10.24],
        strictGoal: true,
        hint: 'Calcule 2¹⁰, puis le produit : mille fois plus grand en dix secondes.',
      },
    ],
  },
  {
    id: 'p13-phases',
    phase: 13,
    title: 'L’espace des phases',
    tagline: 'Un point = un état complet ; une courbe = une vie entière',
    intro: ['Hamilton propose un autre regard : porter l’angle ET la vitesse en coordonnées. Toute la dynamique devient de la géométrie.'],
    course: [
      {
        kind: 'p',
        text:
          'Après Lagrange, le second regard de la mécanique analytique : celui de **Hamilton**. Au lieu de filmer le pendule, place un point dans le plan (θ, ω) — angle en abscisse, vitesse en ordonnée. Ce point code *tout* : l’avenir entier du pendule est déterminé. Sa vie est une courbe, et le champ de vecteurs qui la guide est le **flot hamiltonien**.',
      },
      {
        kind: 'math',
        latex: 'H(\\theta, \\omega) = \\frac{\\omega^2}{2} - \\cos\\theta = \\text{constante}',
        caption:
          'L’énergie totale H (cinétique + potentielle) ne change jamais : chaque trajectoire est une ligne de niveau de H. La dynamique entière du pendule se lit comme une carte topographique.',
      },
      {
        kind: 'example',
        title: 'Lire la carte',
        steps: [
          'Petites énergies : des **ovales** autour du centre — le pendule oscille (le ressort de la Phase 5 donnait des ellipses parfaites).',
          'Grandes énergies : des **vagues** qui filent — le pendule tourne par-dessus son sommet, sans fin.',
          'La frontière : la **séparatrice**, l’énergie exacte pour atteindre le sommet… en un temps infini. Le chaos du double pendule naît près d’elle.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Théorème de Liouville : le flot hamiltonien **conserve les aires** dans l’espace des phases — un nuage d’états s’étire et se cisaille, mais son aire est éternelle. C’est le fondement de la physique statistique… et l’ancêtre du principe d’incertitude qui t’attend en Phase 14.',
      },
    ],
    exercises: [
      {
        id: 'phases-explore',
        prompt: 'Clique dans le plan (θ, ω) : ovales dedans, vagues dehors, séparatrice entre les deux.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'phase-space' },
      },
      {
        id: 'phases-energie',
        prompt: 'L’énergie du ressort en (x, v) = (4, 3) : E = v²/2 + x²/2.',
        start: ['Equal', 'E', ['Add', ['Multiply', HALF, ['Power', 3, 2]], ['Multiply', HALF, ['Power', 4, 2]]]],
        goal: ['Equal', 'E', 12.5],
        strictGoal: true,
        hint: 'Deux carrés, deux moitiés, une somme : le rayon² /2 de l’ellipse dans l’espace des phases.',
      },
    ],
  },

  // ───────────────── Station V — la mécanique quantique (Phase 14) ─────────────────
  {
    id: 'p14-schrodinger',
    phase: 14,
    title: 'Schrödinger : la matière est une onde',
    tagline: 'Le puits infini — ta corde vibrante, devenue quantique',
    intro: ['L’électron coincé dans une boîte n’est pas une bille : c’est une onde. Et une onde entre deux murs, tu connais déjà.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici l’équation la plus célèbre du XXᵉ siècle — et la spirale du parcours entier se referme dessus. Lis-la avec tes stations : le $i$ de la Phase 12 (la phase qui tourne), la dérivée seconde de la Phase 4 (la **courbure**), le potentiel $V$ de la station U :',
      },
      {
        kind: 'math',
        latex: 'i\\hbar\\,\\frac{\\partial \\psi}{\\partial t} = -\\frac{\\hbar^2}{2m}\\frac{\\partial^2 \\psi}{\\partial x^2} + V\\psi',
        caption:
          'À gauche : « la phase de ψ tourne » (i = rotation !). À droite : l’énergie — cinétique (la courbure de ψ : plus l’onde ondule serré, plus ça coûte) plus potentielle. Schrödinger, c’est la conservation de l’énergie écrite pour une onde.',
      },
      {
        kind: 'p',
        text:
          'Enferme l’électron entre deux murs infranchissables : $\\psi$ doit s’annuler aux bords. C’est **mot pour mot** la corde vibrante de la station O ! Seuls survivent les modes $\\sin(n\\pi x/L)$ — et comme l’énergie est la courbure, $E_n = n^2 E_1$ : l’énergie est **quantifiée**. Les niveaux discrets des atomes, les couleurs des néons : de simples conditions aux bords.',
      },
      {
        kind: 'example',
        title: 'Lire la simulation',
        steps: [
          'Un état propre $n$ tourne dans le plan complexe ($e^{-iE_nt/\\hbar}$ : ta formule d’Euler) mais $|\\psi|^2$ — la probabilité de présence — reste **figée** : état stationnaire.',
          'Le mode $n$ a $n-1$ nœuds : des endroits où l’électron ne sera *jamais* trouvé, alors qu’il passe « des deux côtés ».',
          'Superpose $\\psi_1 + \\psi_2$ : les deux phases tournent à des vitesses différentes, battent, et $|\\psi|^2$ **oscille**. Le mouvement quantique est une interférence entre énergies.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Schrödinger a trouvé son équation pendant les vacances de Noël 1925, en cherchant l’équation d’onde dont les modes redonneraient les niveaux de l’atome de Bohr. La physique des ondes (corde, son, lumière) a fourni le moule ; il n’a « plus qu’à » y verser la matière.',
      },
    ],
    exercises: [
      {
        id: 'schrodinger-explore',
        prompt: 'Passe les niveaux en revue, regarde la phase tourner et |ψ|² rester figé. Puis superpose : le mouvement apparaît.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'quantum-well' },
      },
      {
        id: 'schrodinger-courbure',
        prompt: 'L’énergie est la courbure : calcule la dérivée seconde de sin x (dérive deux fois).',
        start: ['D', ['D', ['Sin', 'x'], 'x'], 'x'],
        goal: ['Negate', ['Sin', 'x']],
        hint: 'sin → cos → −sin : la fonction revient sur elle-même en négatif. sin est « fonction propre » de la courbure — voilà pourquoi les modes sont des sinus.',
      },
      {
        id: 'schrodinger-niveaux',
        prompt: 'Le puits a E₁ = 2 eV. Quelle est l’énergie du niveau n = 3 ? E₃ = 3²·E₁.',
        start: ['Equal', 'E', ['Multiply', ['Power', 3, 2], 2]],
        goal: ['Equal', 'E', 18],
        strictGoal: true,
        hint: 'L’énergie grandit comme n² : la courbure coûte cher.',
      },
    ],
  },
  {
    id: 'p14-heisenberg',
    phase: 14,
    title: 'Heisenberg : l’incertitude est de la géométrie',
    tagline: 'Δx·Δp ≥ ℏ/2 — la dualité de Fourier, pas une maladresse',
    intro: ['On ne peut pas connaître à la fois la position et la vitesse. Non par manque d’habileté : parce qu’une onde ne PEUT pas.'],
    course: [
      {
        kind: 'p',
        text:
          'Le principe le plus mal compris de la physique. Ce n’est **pas** « la mesure perturbe » : c’est un théorème sur les ondes, que tu possèdes déjà. De Broglie d’abord : la quantité de mouvement d’une particule est la *fréquence spatiale* de son onde,',
      },
      {
        kind: 'math',
        latex: 'p = \\frac{h}{\\lambda} \\qquad \\text{puis} \\qquad \\Delta x \\cdot \\Delta p \\geq \\frac{\\hbar}{2}',
        caption:
          'Position = où vit l’onde ; quantité de mouvement = à quelle fréquence elle ondule. Or ta station Fourier l’a montré : un signal bref a un spectre large, un signal pur dure longtemps. Position et impulsion sont un couple temps↔fréquence — Heisenberg EST la dualité de Fourier.',
      },
      {
        kind: 'example',
        title: 'Le raisonnement en trois pas',
        steps: [
          'Une onde localisée (Δx petit) est un **paquet** : pour la construire, il faut sommer beaucoup de fréquences — Δp grand. (Ton créneau de Fourier avait besoin d’une infinité d’harmoniques !)',
          'Une onde de fréquence pure (Δp petit) est une sinusoïde infinie : elle est **partout** — Δx infini.',
          'Le produit Δx·Δp a donc un plancher. Sa valeur, ℏ/2 ≈ 5·10⁻³⁵ J·s, dit pourquoi ton café ignore la quantique — mais pas l’électron.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est aussi pourquoi les atomes ne s’effondrent pas : confiner l’électron sur le noyau (Δx → 0) ferait exploser son impulsion (Δp → ∞), donc son énergie cinétique. La matière est rigide parce que Fourier l’interdit de se tasser. Tu poses la main sur une table : c’est Δx·Δp ≥ ℏ/2 qui te porte.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Heisenberg a eu l’idée en février 1927, en exil volontaire sur l’île d’Heligoland pour fuir le rhume des foins. Einstein n’a jamais accepté (« Dieu ne joue pas aux dés ») ; Bohr répondait : « Cessez de dire à Dieu ce qu’il doit faire. »',
      },
    ],
    exercises: [
      {
        id: 'heisenberg-plancher',
        prompt: 'Avec ℏ = 1 (unités du théoricien) : si Δx = 0,25, quel est le Δp minimal ? Δp = 1/(2·Δx).',
        start: ['Equal', 'p', ['Divide', 1, ['Multiply', 2, 0.25]]],
        goal: ['Equal', 'p', 2],
        strictGoal: true,
        hint: 'Serre la position d’un facteur 2, l’impulsion s’évase d’un facteur 2 : une balance parfaite.',
      },
      {
        id: 'heisenberg-broglie',
        prompt: 'De Broglie : une onde de longueur λ = 0,5 porte p = h/λ (avec h = 1). Calcule.',
        start: ['Equal', 'p', ['Divide', 1, 0.5]],
        goal: ['Equal', 'p', 2],
        strictGoal: true,
        hint: 'Une longueur d’onde deux fois plus courte, une impulsion deux fois plus grande.',
      },
    ],
  },
];
