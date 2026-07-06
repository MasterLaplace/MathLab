import type { Lesson } from './schema';
import type { Expr } from '../core/ast';

/**
 * Batch 9 : les matrices entrent dans l'AST — le palier « objets non
 * numériques » (stations K et X). Av, AB, det et Av = λv deviennent des
 * gestes ; puis la spirale se referme deux fois : le spin (station V,
 * matrices de Pauli) et le boost de Lorentz (station W) sont des 2×2.
 */

const R90: Expr = ['Mat2', 0, -1, 1, 0];
const SIGMA_X: Expr = ['Mat2', 0, 1, 1, 0];
/** Boost de Lorentz pour v = 0,6c : γ = 1,25, γv = 0,75. */
const BOOST: Expr = ['Mat2', 1.25, -0.75, -0.75, 1.25];

export const lessonsMatrices: Lesson[] = [
  // ───────────────── Station K — la matrice agit (Phase 7) ─────────────────
  {
    id: 'p7-matvec',
    phase: 7,
    title: 'La matrice en action : Av',
    tagline: 'Ligne × colonne — la machine à transformer les vecteurs',
    intro: ['Une matrice n’est pas un tableau de nombres : c’est une machine. On lui donne un vecteur, elle en rend un autre.'],
    course: [
      {
        kind: 'p',
        text:
          'Tu as fait tourner la grille avec `MatrixExplorer` : chaque matrice 2×2 **transforme le plan entier**. Voici maintenant le calcul sous le geste. La recette tient en trois mots : **ligne fois colonne**.',
      },
      {
        kind: 'math',
        latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}',
        caption:
          'La 1ʳᵉ composante du résultat : la 1ʳᵉ ligne rencontre le vecteur. La 2ᵉ : la 2ᵉ ligne. Deux produits scalaires — le geste de la station J, deux fois.',
      },
      {
        kind: 'example',
        title: 'Lire une matrice en un coup d’œil',
        steps: [
          'Sa **première colonne** est l’image de î = (1, 0) : calcule A·î, tu obtiens (a, c).',
          'Sa **seconde colonne** est l’image de ĵ = (0, 1). La matrice, c’est juste « où vont les deux flèches de base ».',
          'La matrice $\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$ envoie î sur (0, 1) et ĵ sur (−1, 0) : c’est la **rotation de 90°** — le i du plan (station Q !).',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'La spirale continue : le « × » devient composition. Un nombre étire la droite, un complexe fait tourner le plan, une matrice fait **ce qu’elle veut** du plan — étirer, tourner, cisailler, écraser. L’algèbre linéaire, c’est l’algèbre des transformations.',
      },
    ],
    exercises: [
      {
        id: 'matvec-explore',
        prompt: 'Attrape les images de î et ĵ : la grille suit. La matrice, c’est ces deux flèches.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'matrix', mode: 'transform' },
      },
      {
        id: 'matvec-etire',
        prompt: 'Applique la matrice au vecteur : tape sur le produit, puis calcule chaque composante.',
        start: ['Equal', 'w', ['MatVec', ['Mat2', 2, 0, 0, 3], ['Vec2', 1, 1]]],
        goal: ['Equal', 'w', ['Vec2', 2, 3]],
        strictGoal: true,
        hint: 'Ligne × colonne : la 1ʳᵉ composante est 2·1 + 0·1. Cette matrice étire x par 2 et y par 3.',
      },
      {
        id: 'matvec-rotation',
        prompt: 'La rotation de 90° appliquée à î = (1, 0) : où atterrit la première flèche ?',
        start: ['Equal', 'w', ['MatVec', R90, ['Vec2', 1, 0]]],
        goal: ['Equal', 'w', ['Vec2', 0, 1]],
        strictGoal: true,
        hint: 'î part vers le haut : (1, 0) devient (0, 1). C’est exactement ce que fait i sur le plan complexe.',
      },
      {
        id: 'matvec-identite',
        prompt: 'La matrice identité : que fait-elle à (5, 7) ?',
        start: ['Equal', 'w', ['MatVec', ['Mat2', 1, 0, 0, 1], ['Vec2', 5, 7]]],
        goal: ['Equal', 'w', ['Vec2', 5, 7]],
        strictGoal: true,
        hint: 'Ses colonnes sont î et ĵ eux-mêmes : elle ne bouge rien. C’est le « 1 » des matrices.',
      },
    ],
  },
  {
    id: 'p7-matmul',
    phase: 7,
    title: 'Composer : le produit de matrices',
    tagline: 'AB = « faire B, puis A » — et l’ordre compte !',
    intro: ['Enchaîner deux transformations, c’est les multiplier. Et pour la première fois de ta vie : AB ≠ BA.'],
    course: [
      {
        kind: 'p',
        text:
          'Que se passe-t-il si on tourne le plan, puis qu’on le tourne encore ? On obtient **une seule** transformation : la composée. Le produit de matrices est fait exactement pour ça : $AB$ signifie « appliquer $B$ d’abord, puis $A$ ». L’entrée $(i, j)$ du produit est (ligne $i$ de $A$) · (colonne $j$ de $B$) — le même geste ligne × colonne, quatre fois.',
      },
      {
        kind: 'math',
        latex: 'AB \\ne BA \\quad \\text{(en général)}',
        caption:
          'Mets tes chaussettes puis tes chaussures, ou tes chaussures puis tes chaussettes : le résultat n’est pas le même. Les transformations du plan non plus. C’est la première multiplication non commutative de ton parcours — et elle est partout (quantique comprise).',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Heisenberg a construit la mécanique quantique (1925) avec des tableaux de nombres qui ne commutaient pas — sans savoir que les mathématiciens appelaient ça des matrices depuis 70 ans. C’est Max Born qui a reconnu l’objet. Le fameux pq − qp ≠ 0 est **la** signature du monde quantique.',
      },
    ],
    exercises: [
      {
        id: 'matmul-demi',
        prompt: 'Deux rotations de 90° : tape sur le produit, calcule les 4 entrées. Que reconnais-tu ?',
        start: ['Equal', 'C', ['MatMul', R90, R90]],
        goal: ['Equal', 'C', ['Mat2', -1, 0, 0, -1]],
        strictGoal: true,
        hint: '90° + 90° = 180° : le demi-tour, qui envoie (x, y) sur (−x, −y). C’est −I — et i² = −1 en écho.',
      },
      {
        id: 'matmul-ab',
        prompt: 'A = cisaillement, B = rotation. Calcule AB (« tourner, puis cisailler »).',
        start: ['Equal', 'P', ['MatMul', ['Mat2', 1, 1, 0, 1], R90]],
        goal: ['Equal', 'P', ['Mat2', 1, -1, 1, 0]],
        strictGoal: true,
        hint: 'Ligne de A × colonne de B, quatre fois. Garde le résultat en tête pour l’exercice suivant…',
      },
      {
        id: 'matmul-ba',
        prompt: 'Les mêmes, dans l’autre ordre : BA (« cisailler, puis tourner »). Compare !',
        start: ['Equal', 'Q', ['MatMul', R90, ['Mat2', 1, 1, 0, 1]]],
        goal: ['Equal', 'Q', ['Mat2', 0, -1, 1, 1]],
        strictGoal: true,
        hint: 'Résultat différent de AB : l’ordre des transformations compte. AB ≠ BA, tu viens de le prouver.',
      },
    ],
  },
  {
    id: 'p7-det',
    phase: 7,
    title: 'Le déterminant : le facteur d’aire',
    tagline: 'ad − bc — combien la matrice gonfle (ou écrase) le plan',
    intro: ['Un seul nombre résume ce que la matrice fait aux aires. S’il est nul, le plan entier s’écrase sur une droite.'],
    course: [
      {
        kind: 'p',
        text:
          'Prends le carré unité (côtés î et ĵ, aire 1). La matrice l’envoie sur un parallélogramme. Son aire ? C’est le **déterminant**. Tout est là : det = 6 signifie « toutes les aires sont multipliées par 6 », det négatif signifie « le plan est retourné comme une crêpe », det = 0 signifie « le plan est écrasé — plus moyen de revenir en arrière ».',
      },
      {
        kind: 'math',
        latex: '\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc',
        caption:
          'La diagonale moins l’anti-diagonale. Et le miracle : det(AB) = det(A)·det(B) — composer les transformations multiplie les facteurs d’aire, forcément.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'det = 0 est **le** cas critique : la matrice écrase le plan sur une droite (ou un point), l’information est perdue, aucune matrice inverse n’existe. C’est le « diviser par zéro » de l’algèbre linéaire — et le test que tu feras toute ta vie avant d’inverser quoi que ce soit.',
      },
    ],
    exercises: [
      {
        id: 'det-calc',
        prompt: 'Tape sur det : la formule se déplie, puis calcule. De combien cette matrice gonfle-t-elle les aires ?',
        start: ['Equal', 'd', ['Det', ['Mat2', 3, 1, 1, 2]]],
        goal: ['Equal', 'd', 5],
        strictGoal: true,
        hint: 'ad − bc = 3·2 − 1·1. Toutes les aires du plan sont multipliées par 5.',
      },
      {
        id: 'det-miroir',
        prompt: 'Le déterminant du miroir (qui échange x et y). Pourquoi négatif ?',
        start: ['Equal', 'd', ['Det', ['Mat2', 0, 1, 1, 0]]],
        goal: ['Equal', 'd', -1],
        strictGoal: true,
        hint: '0·0 − 1·1 = −1 : les aires sont conservées mais le plan est retourné — comme dans un miroir.',
      },
      {
        id: 'det-ecrase',
        prompt: 'Et celle-ci ? Regarde ses colonnes : (2, 1) et (4, 2)…',
        start: ['Equal', 'd', ['Det', ['Mat2', 2, 4, 1, 2]]],
        goal: ['Equal', 'd', 0],
        strictGoal: true,
        hint: 'Les deux colonnes sont alignées (l’une est le double de l’autre) : le plan entier s’écrase sur cette droite. det = 0, pas d’inverse.',
      },
    ],
  },
  {
    id: 'p7-eigen',
    phase: 7,
    title: 'Av = λv : les directions fidèles',
    tagline: 'Les vecteurs propres — ceux que la matrice ne fait qu’étirer',
    intro: ['Presque tous les vecteurs sont déviés par la matrice. Quelques-uns, non : ils sont seulement étirés. Ce sont les axes cachés de la transformation.'],
    course: [
      {
        kind: 'p',
        text:
          'Applique une matrice à tous les vecteurs du plan : la plupart **changent de direction**. Mais certains restent sur leur droite — la matrice ne fait que les étirer d’un facteur $\\lambda$. On les appelle **vecteurs propres**, et $\\lambda$ est leur **valeur propre** :',
      },
      {
        kind: 'math',
        latex: 'A\\vec{v} = \\lambda \\vec{v}',
        caption:
          'À gauche, toute la machine ; à droite, une simple multiplication. Trouver les v et λ, c’est trouver les axes le long desquels la matrice est aussi simple qu’un nombre.',
      },
      {
        kind: 'example',
        title: 'Pourquoi c’est LA question de l’algèbre linéaire',
        steps: [
          '**Vibrations** : les modes propres de la corde (station O) sont les vecteurs propres de l’opérateur d’onde — chaque mode vibre sans se déformer.',
          '**Quantique** : les niveaux d’énergie Eₙ du puits (station V) sont les valeurs propres de l’équation de Schrödinger. « Propre » vient de là (eigen, en allemand).',
          '**Google** : PageRank est le vecteur propre géant de la matrice du web — la direction stable vers laquelle converge la navigation.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Dans la simulation, cherche les directions dessinées en surbrillance : tire un vecteur le long d’elles, son image reste **alignée**. Partout ailleurs, elle dévie. Tu *vois* les vecteurs propres avant de les calculer.',
      },
    ],
    exercises: [
      {
        id: 'eigen-explore',
        prompt: 'Trouve les directions qui ne tournent pas : les images restent alignées sur elles.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'matrix', mode: 'eigen' },
      },
      {
        id: 'eigen-verifie',
        prompt: 'Vérifie que v = (1, 1) est propre pour λ = 3 : calcule les DEUX côtés de Av = λv.',
        start: ['Equal', ['MatVec', ['Mat2', 2, 1, 1, 2], ['Vec2', 1, 1]], ['VecScale', 3, ['Vec2', 1, 1]]],
        goal: ['Equal', ['Vec2', 3, 3], ['Vec2', 3, 3]],
        strictGoal: true,
        hint: 'À gauche : ligne × colonne puis calcule. À droite : λ étire chaque composante. Les deux donnent (3, 3) — v est bien propre.',
      },
      {
        id: 'eigen-autre',
        prompt: 'La même matrice a une seconde direction fidèle : v = (1, −1), avec λ = 1. Vérifie.',
        start: ['Equal', ['MatVec', ['Mat2', 2, 1, 1, 2], ['Vec2', 1, -1]], ['VecScale', 1, ['Vec2', 1, -1]]],
        goal: ['Equal', ['Vec2', 1, -1], ['Vec2', 1, -1]],
        strictGoal: true,
        hint: '2·1 + 1·(−1) = 1 et 1·1 + 2·(−1) = −1 : le vecteur ne bouge pas du tout (λ = 1). Deux axes propres : (1,1) étiré par 3, (1,−1) figé.',
      },
    ],
  },

  // ───────────────── Station V (clôture) — le spin (Phase 14) ─────────────────
  {
    id: 'p14-spin',
    phase: 14,
    title: 'Le spin : la quantique en 2×2',
    tagline: 'Les matrices de Pauli — l’état quantique le plus simple du monde',
    intro: ['Le spin de l’électron n’a que deux états : ↑ et ↓. Toute sa physique tient dans trois matrices 2×2. Tu as maintenant tous les outils.'],
    course: [
      {
        kind: 'p',
        text:
          'L’électron porte un moment magnétique intrinsèque, le **spin**, qui ne peut donner que deux réponses à la mesure : haut $\\lvert\\uparrow\\rangle = (1, 0)$ ou bas $\\lvert\\downarrow\\rangle = (0, 1)$. Deux états → des vecteurs à 2 composantes → des **matrices 2×2** comme opérations. La station K devient de la physique quantique, telle quelle.',
      },
      {
        kind: 'math',
        latex: '\\sigma_x = \\begin{pmatrix} 0 & 1 \\\\ 1 & 0 \\end{pmatrix}, \\quad \\sigma_y = \\begin{pmatrix} 0 & -i \\\\ i & 0 \\end{pmatrix}, \\quad \\sigma_z = \\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}',
        caption:
          'Les trois matrices de Pauli (1927). σx est le miroir de la station K : elle échange ↑ et ↓. σy mélange avec des i (station Q !), σz mesure : +1 pour ↑, −1 pour ↓ — ses valeurs propres.',
      },
      {
        kind: 'example',
        title: 'Tout ton parcours en une leçon',
        steps: [
          'σx **retourne** le spin : σx·(1, 0) = (0, 1) — un simple produit matrice-vecteur (station K).',
          'Deux retournements = rien : σx² = I — un produit de matrices (composition).',
          'Les vecteurs propres de σx sont (1, 1) et (1, −1) : le spin « à moitié ↑, à moitié ↓ » — la **superposition** du puits quantique, en version 2×2.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Stern et Gerlach (1922) ont envoyé des atomes d’argent dans un aimant : au lieu d’une tache étalée (prédiction classique), **deux taches nettes**. Le spin ne prend que deux valeurs — la quantification, vue à l’œil nu sur une plaque photographique. C’est l’expérience fondatrice des « deux états ».',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Un **qubit**, c’est exactement ça : un état (α, β) dans le plan des spins, et des matrices 2×2 comme portes logiques. σx est la porte NOT quantique. L’ordinateur quantique, c’est la station K prise au sérieux.',
      },
    ],
    exercises: [
      {
        id: 'spin-flip',
        prompt: 'σx agit sur le spin haut (1, 0) : calcule. C’est la porte NOT quantique.',
        start: ['Equal', 'r', ['MatVec', SIGMA_X, ['Vec2', 1, 0]]],
        goal: ['Equal', 'r', ['Vec2', 0, 1]],
        strictGoal: true,
        hint: 'Ligne × colonne : (0·1 + 1·0, 1·1 + 0·0) = (0, 1). Le spin haut devient spin bas.',
      },
      {
        id: 'spin-deux',
        prompt: 'Deux retournements : calcule σx·σx. Que retrouves-tu ?',
        start: ['Equal', 'M', ['MatMul', SIGMA_X, SIGMA_X]],
        goal: ['Equal', 'M', ['Mat2', 1, 0, 0, 1]],
        strictGoal: true,
        hint: 'NOT puis NOT = identité. σx² = I : comme (−1)² = 1, comme deux miroirs face à face.',
      },
      {
        id: 'spin-propre',
        prompt: 'Le spin « mi-haut mi-bas » v = (1, 1) est propre pour σx avec λ = 1 : vérifie les deux côtés.',
        start: ['Equal', ['MatVec', SIGMA_X, ['Vec2', 1, 1]], ['VecScale', 1, ['Vec2', 1, 1]]],
        goal: ['Equal', ['Vec2', 1, 1], ['Vec2', 1, 1]],
        strictGoal: true,
        hint: 'σx échange les composantes de (1, 1)… qui ne change donc pas. La superposition égale est fidèle au retournement.',
      },
    ],
  },

  // ───────────────── Station W (suite) — Lorentz est une matrice (Phase 15) ─────────────────
  {
    id: 'p15-lorentz',
    phase: 15,
    title: 'Lorentz est une matrice',
    tagline: 'Le changement d’observateur = une transformation 2×2 de l’espace-temps',
    intro: ['Les axes en ciseaux du diagramme de Minkowski ? C’est une matrice qui les referme. Et son déterminant vaut exactement 1.'],
    course: [
      {
        kind: 'p',
        text:
          'Passer de tes coordonnées $(ct, x)$ à celles de l’observateur mobile, c’est appliquer une matrice — le **boost de Lorentz**. La station K et la station W sont la même histoire :',
      },
      {
        kind: 'math',
        latex: '\\begin{pmatrix} ct\' \\\\ x\' \\end{pmatrix} = \\begin{pmatrix} \\gamma & -\\gamma v \\\\ -\\gamma v & \\gamma \\end{pmatrix}\\begin{pmatrix} ct \\\\ x \\end{pmatrix}',
        caption:
          'Pour v = 0,6c : γ = 1,25 et γv = 0,75. Cette matrice est symétrique (le temps et l’espace jouent le même jeu) et referme les axes en ciseaux — c’est elle que tu manipulais au curseur.',
      },
      {
        kind: 'example',
        title: 'La rotation qui n’en est pas une',
        steps: [
          'Une rotation ordinaire préserve $x^2 + y^2$ (le cercle). Le boost préserve $(ct)^2 - x^2$ (l’hyperbole) : c’est une **rotation hyperbolique**.',
          'det(rotation) = 1, et det(boost) = γ² − γ²v² = γ²(1 − v²) = **1** aussi : l’aire de l’espace-temps est sacrée.',
          'Composer deux boosts = additionner leurs « angles hyperboliques » (les rapidités) — jamais dépasser c, exactement comme deux rotations ne font qu’un tour.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'L’événement (ct, x) = (5, 3) avait un intervalle s = 4 (leçon Minkowski). Applique le boost : tu vas trouver (4, 0). Pour l’observateur mobile, l’événement se produit **sur place** (x′ = 0) — et son horloge lit ct′ = 4 = s. L’intervalle invariant, c’est le temps propre de celui qui y assiste sur place.',
      },
    ],
    exercises: [
      {
        id: 'lorentz-boost',
        prompt: 'Boost à v = 0,6c de l’événement (ct, x) = (5, 3) : calcule (ct′, x′).',
        start: ['Equal', 'e', ['MatVec', BOOST, ['Vec2', 5, 3]]],
        goal: ['Equal', 'e', ['Vec2', 4, 0]],
        strictGoal: true,
        hint: '1,25·5 − 0,75·3 = 4 et −0,75·5 + 1,25·3 = 0. L’observateur mobile voit l’événement chez lui, à l’instant 4 — l’intervalle s de la leçon Minkowski !',
      },
      {
        id: 'lorentz-det',
        prompt: 'Le déterminant du boost : déplie, calcule. Les boosts préservent-ils l’aire de l’espace-temps ?',
        start: ['Equal', 'd', ['Det', BOOST]],
        goal: ['Equal', 'd', 1],
        strictGoal: true,
        hint: '1,25² − (−0,75)² = 1,5625 − 0,5625 = 1. Comme une rotation : rien ne se perd dans l’espace-temps.',
      },
    ],
  },
];
