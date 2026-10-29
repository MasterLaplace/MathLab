import type { Exercise } from './schema';

/**
 * Batch 15 : les expéditions — des problèmes rédigés multi-étapes qui
 * traversent plusieurs stations du parcours, avec des indices progressifs
 * (du coup de pouce à la quasi-solution). C'est le format d'entraînement
 * vers les problèmes de niveau olympiades/HLE : un récit, un objectif,
 * et plusieurs domaines mathématiques à mobiliser dans le bon ordre.
 */

export interface ExpeditionStep {
  /** Texte narratif introduisant l'étape (`$...$` rendu par KaTeX). */
  intro: string;
  exercise: Exercise;
}

export interface Expedition {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  /** Mise en situation, affichée avant la première étape. */
  story: string[];
  steps: ExpeditionStep[];
  /** Conclusion affichée à la victoire. */
  epilogue: string;
}

export const expeditions: Expedition[] = [
  {
    id: 'exp-rsa',
    emoji: '🕵️',
    title: 'L’interception',
    tagline: 'Casse un vrai chiffrement RSA — théorie des nombres, 3 étapes',
    story: [
      'Un message chiffré vient d’être intercepté : **c = 8**. La clé publique de la cible est **(n = 15, e = 3)** — elle est affichée au grand jour, c’est le principe de RSA.',
      'Le point faible ? n = 15 se factorise de tête : 3 × 5. Or qui sait factoriser n sait calculer φ(n), et qui connaît φ(n) peut fabriquer la clé privée. À toi de dérouler l’attaque, geste par geste.',
    ],
    steps: [
      {
        intro: 'Étape 1 — L’horloge secrète. Tout RSA repose sur un nombre que le propriétaire de la clé garde caché : $\\varphi(n)$. Toi, tu sais que $15 = 3 \\times 5$…',
        exercise: {
          id: 'exp-rsa-phi',
          prompt: 'Calcule φ(15) par gestes : factorise, déplie, multiplie.',
          start: ['Equal', 'n', ['Phi', 15]],
          goal: ['Equal', 'n', 8],
          strictGoal: true,
          hints: [
            'φ est multiplicative quand les facteurs sont premiers entre eux : tape sur φ(15) pour la scinder.',
            'φ(3) = 3 − 1 et φ(5) = 5 − 1 : un nombre premier est étranger à tout le monde avant lui.',
            'φ(15) = φ(3)·φ(5) = 2·4. Il reste à calculer le produit : 8. C’est l’horloge secrète.',
          ],
        },
      },
      {
        intro: 'Étape 2 — La clé privée. La clé privée $d$ doit défaire la clé publique : $e·d \\equiv 1 \\pmod{\\varphi(n)}$. Tu paries que $d = 3$ fonctionne (car $e = 3$ et $3·3 = 9$)…',
        exercise: {
          id: 'exp-rsa-cle',
          prompt: 'Vérifie que d = 3 est bien l’inverse de e = 3 sur l’horloge à 8.',
          start: ['Equal', 'v', ['Mod', ['Multiply', 3, 3], 8]],
          goal: ['Equal', 'v', 1],
          strictGoal: true,
          hints: [
            'Commence par calculer le produit 3·3 (tape dessus).',
            '9 sur une horloge à 8 heures : un tour complet, puis… tape sur le mod pour lire l’aiguille.',
            '9 = 1·8 + 1 : reste 1. La clé privée est d = 3 — l’attaque peut continuer.',
          ],
        },
      },
      {
        intro: 'Étape 3 — Le déchiffrement. RSA déchiffre par $m = c^d \\bmod n$. Tu as tout : $c = 8$, $d = 3$, $n = 15$.',
        exercise: {
          id: 'exp-rsa-dechiffre',
          prompt: 'Déchiffre le message intercepté : calcule 8³ mod 15.',
          start: ['Equal', 'm', ['Mod', ['Power', 8, 3], 15]],
          goal: ['Equal', 'm', 2],
          strictGoal: true,
          hints: [
            'Calcule d’abord la puissance 8³ (tape dessus).',
            '512 sur l’horloge à 15 : 512 = 34·15 + 2. Tape sur le mod.',
            'Le message en clair est m = 2. RSA-15 est tombé — parce que 15 se factorise. RSA-2048 tient parce que personne ne sait factoriser un nombre de 600 chiffres.',
          ],
        },
      },
    ],
    epilogue:
      'Message déchiffré : m = 2. Tu viens d’exécuter l’attaque complète — factoriser n, calculer φ, fabriquer d, déchiffrer. Toute la sécurité d’Internet tient à une seule chose : pour un vrai n, ta première étape est impossible.',
  },
  {
    id: 'exp-ressort',
    emoji: '🌉',
    title: 'Le pont qui oscille',
    tagline: 'Une EDO du 2ᵉ ordre résolue de bout en bout — physique + Laplace',
    story: [
      'Le tablier d’une passerelle vient d’être heurté : écarté de sa position d’équilibre, il oscille. Son mouvement obéit à $y\'\' = -4y$ — la loi du ressort de la Phase 5, avec $\\omega^2 = 4$.',
      'Les ingénieurs veulent la trajectoire exacte $y(t)$. Ta stratégie : émigrer au pays de Laplace (les dérivées y deviennent des multiplications), résoudre à la balance, puis revenir dans le temps.',
    ],
    steps: [
      {
        intro: 'Étape 1 — L’aller. Transforme la dérivée seconde : c’est le geste $\\mathcal{L}\\{y\'\'\\} = s^2Y - s\\,y_0 - v_0$, qui emporte l’EDO entière au pays de s.',
        exercise: {
          id: 'exp-ressort-lt',
          prompt: 'Transforme ℒ{y″} d’un tap.',
          start: ['LT', ['D', ['D', 'y', 't'], 't']],
          goal: ['Add', ['Multiply', ['Power', 's', 2], 'Y'], ['Negate', ['Multiply', 's', 'y₀']], ['Negate', 'v₀']],
          hints: [
            'Tape sur ℒ{…} : la table fait le voyage.',
            'Deux dérivées = deux multiplications par s, et deux conditions initiales qui tombent : s·y₀ (position) et v₀ (vitesse).',
            'Résultat : s²Y − s·y₀ − v₀. Avec y₀ = 1, v₀ = 0, l’équation devient (s²+4)Y = s, donc Y = s/(s²+4).',
          ],
        },
      },
      {
        intro: 'Étape 2 — Le retour. La balance a donné $Y = \\dfrac{s}{s^2+4}$. Reste à retraverser le miroir : quelle fonction du temps a cette transformée ?',
        exercise: {
          id: 'exp-ressort-retour',
          prompt: 'Reviens dans le temps : que vaut y(t) ?',
          start: ['Equal', 'y', ['ILT', ['Divide', 's', ['Add', ['Power', 's', 2], 4]]]],
          goal: ['Equal', 'y', ['Cos', ['Multiply', 2, 't']]],
          hints: [
            'Regarde le numérateur : un s tout seul. Quelle ligne de la table a cette signature ?',
            's/(s²+ω²) est la transformée du cosinus, avec ici ω² = 4.',
            'y(t) = cos(2t) : le pont oscille pour toujours (aucun amortissement) — ses pôles sont SUR l’axe imaginaire.',
          ],
        },
      },
      {
        intro: 'Étape 3 — L’amortisseur. On ajoute un amortisseur ; le nouveau dénominateur a deux pôles réels : $Y = \\dfrac{1}{(s+1)(s+2)}$. Aucune ligne de la table ne correspond — il faut casser la fraction.',
        exercise: {
          id: 'exp-ressort-amorti',
          prompt: 'Casse en éléments simples, puis fais revenir chaque morceau.',
          start: ['ILT', ['Divide', 1, ['Multiply', ['Add', 's', 1], ['Add', 's', 2]]]],
          goal: ['Add', ['Exp', ['Multiply', -1, 't']], ['Negate', ['Exp', ['Multiply', -2, 't']]]],
          hints: [
            'Tape sur la fraction : les deux pôles se séparent en 1/(s+1) − 1/(s+2).',
            'Sépare ensuite l’ILT de la somme, puis tape chaque morceau : chaque pôle réel négatif est une exponentielle décroissante.',
            'y(t) = e^{−t} − e^{−2t} : le pont revient au repos sans osciller. Les pôles ont quitté l’axe imaginaire — la physique a changé de régime.',
          ],
        },
      },
    ],
    epilogue:
      'Trois étapes, trois stations : la physique a posé l’équation, Laplace l’a rendue algébrique, la table l’a fait revenir. Sans amortisseur : cos(2t), oscillation éternelle. Avec : deux exponentielles qui meurent. C’est exactement ainsi qu’on dimensionne les amortisseurs des vrais ponts.',
  },
  {
    id: 'exp-rotation',
    emoji: '🌀',
    title: 'Deux visages de la rotation',
    tagline: 'La matrice R et le nombre i font le MÊME geste — prouve-le',
    story: [
      'Deux élèves se disputent. L’un dit : « pour tourner le plan d’un quart de tour, il faut la matrice $R = \\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$ ». L’autre : « pas besoin de matrice, je multiplie par $i$ ».',
      'Ils ont raison tous les deux — et tu vas le prouver en tournant le MÊME point des deux façons : le point (2, 1), alias le nombre complexe $2 + i$.',
    ],
    steps: [
      {
        intro: 'Étape 1 — À la matrice. Applique la rotation $R$ au vecteur $(2, 1)$ : ligne × colonne, puis calcule chaque entrée.',
        exercise: {
          id: 'exp-rot-matrice',
          prompt: 'Calcule R·(2, 1) par gestes.',
          start: ['MatVec', ['Mat2', 0, -1, 1, 0], ['Vec2', 2, 1]],
          goal: ['Vec2', -1, 2],
          strictGoal: true,
          hints: [
            'Tape sur le produit matrice·vecteur pour étaler « ligne × colonne ».',
            'Ligne 1 : 0·2 − 1·1 = −1. Ligne 2 : 1·2 + 0·1 = 2. Calcule chaque morceau d’un tap.',
            'Résultat : (−1, 2). Le point (2, 1) a tourné d’un quart de tour antihoraire.',
          ],
          depth: 10,
        },
      },
      {
        intro: 'Étape 2 — Au nombre i. Le même point s’écrit $z = 2 + i$. Multiplie-le par $i$ : distribue, et laisse $i^2$ faire son travail.',
        exercise: {
          id: 'exp-rot-i',
          prompt: 'Calcule i·(2 + i) par gestes.',
          start: ['Multiply', 'i', ['Add', 2, 'i']],
          goal: ['Add', -1, ['Multiply', 2, 'i']],
          strictGoal: true,
          hints: [
            'Distribue : i·2 + i·i.',
            'Glisse i sur i : i² = −1 — c’est le quart de tour au carré qui fait demi-tour.',
            'Résultat : −1 + 2i, c’est-à-dire le point (−1, 2). Exactement le résultat de la matrice !',
          ],
        },
      },
      {
        intro: 'Étape 3 — Le verdict. $(2,1) \\mapsto (-1,2)$ des deux côtés : multiplier par $i$ **est** la matrice $R$. Observe-le dans le plan : fais glisser $z$ et $w$, et regarde les angles s’additionner.',
        exercise: {
          id: 'exp-rot-verdict',
          prompt: 'Explore le plan complexe : le produit z·w tourne z de l’angle de w. Quand w = i (angle 90°), c’est la rotation R.',
          start: ['Multiply', 'i', 'z'],
          free: true,
          sim: { type: 'complex' },
        },
      },
    ],
    epilogue:
      'Le nombre i EST la matrice R : deux notations pour le même geste géométrique. C’est pour cela que les complexes savent parler de rotations, d’ondes et de spin — et pourquoi σy (Phase 14) a besoin de i pour tourner dans la deuxième direction.',
  },
  {
    id: 'exp-babylone',
    emoji: '🏺',
    title: 'La tablette de Babylone',
    tagline: 'Retrouve √2 comme un scribe — géométrie, suites, Newton, 3 étapes',
    story: [
      'Université Yale, collection babylonienne, tablette **YBC 7289** (vers 1700 av. J.-C.) : un carré, ses deux diagonales, et gravé en écriture cunéiforme le nombre $1;24,51,10$ en base 60 — soit $1 + \\frac{24}{60} + \\frac{51}{3600} + \\frac{10}{216\\,000} \\approx 1{,}4142130$.',
      'C’est $\\sqrt{2}$ avec six décimales justes, trois mille ans avant les calculatrices. Comment un scribe a-t-il fait ? Tu vas refaire son raisonnement, avec trois outils du parcours.',
    ],
    steps: [
      {
        intro: 'Étape 1 — Le carré. Un carré de côté 1 : sa diagonale est l’hypoténuse d’un triangle rectangle de côtés 1 et 1. Pythagore donne son carré.',
        exercise: {
          id: 'exp-bab-diag',
          prompt: 'Trouve la diagonale $d$ du carré de côté 1.',
          start: ['Equal', ['Power', 'd', 2], ['Add', ['Power', 1, 2], ['Power', 1, 2]]],
          goal: ['Equal', 'd', ['Sqrt', 2]],
          hints: [
            'Calcule la somme des carrés : 1 + 1.',
            'd² = 2 : défais le carré (une longueur est positive).',
            'd = √2. Reste à savoir combien ça vaut…',
          ],
        },
      },
      {
        intro: 'Étape 2 — La recette. Les scribes connaissaient une recette : si $u$ est une approximation de $\\sqrt2$, alors $\\frac12\\left(u + \\frac{2}{u}\\right)$ est meilleure (trop grand d’un côté, trop petit de l’autre : la moyenne est plus juste). Si la recette converge, sa limite $\\ell$ ne bouge plus.',
        exercise: {
          id: 'exp-bab-heron',
          prompt: 'Montre que le point fixe de la recette vérifie $\\ell = \\sqrt2$.',
          start: ['Equal', 'ell', ['Divide', ['Add', 'ell', ['Divide', 2, 'ell']], 2]],
          goal: ['Equal', 'ell', ['Sqrt', 2]],
          depth: 10,
          hints: [
            'Fais passer le dénominateur 2 de l’autre côté.',
            'Rassemble les ℓ : il reste ℓ = 2/ℓ.',
            'Le ℓ du dénominateur traverse : ℓ² = 2. Racine positive.',
          ],
        },
      },
      {
        intro: 'Étape 3 — Le premier pas. Partons de la pire estimation raisonnable, $u_0 = 1$. La recette de Héron est exactement un pas de Newton pour $f(x) = x^2 - 2$ : $x - \\frac{x^2 - 2}{2x}$.',
        exercise: {
          id: 'exp-bab-pas',
          prompt: 'Calcule le premier pas depuis $x = 1$.',
          start: ['Subst', ['Add', 'x', ['Negate', ['Divide', ['Add', ['Power', 'x', 2], -2], ['Multiply', 2, 'x']]]], 'x', 1],
          goal: 1.5,
          strictGoal: true,
          sim: { type: 'newton' },
          hints: [
            'Substitue x → 1.',
            'Calcule : 1 − (1 − 2)/2 = 1 + 0,5.',
            '1,5 — puis 17/12 ≈ 1,4167, puis 577/408 ≈ 1,414216 : les décimales justes doublent à chaque pas.',
          ],
        },
      },
    ],
    epilogue:
      'Trois pas de recette depuis 1 donnent $\\frac{577}{408} = 1{,}4142157$ — le niveau de précision de la tablette. Le scribe babylonien, Héron d’Alexandrie et Newton ont fait le même geste : remplacer une courbe par sa tangente, et recommencer. Ta calculatrice le fait encore aujourd’hui.',
  },
  {
    id: 'exp-fleche',
    emoji: '🌡️',
    title: 'La flèche du temps',
    tagline: 'Pourquoi le café ne se réchauffe jamais seul — combinatoire, logarithmes, entropie, 4 étapes',
    story: [
      'Les lois de Newton marchent aussi bien à l’endroit qu’à l’envers : filme une collision de deux billes et passe le film à rebours, rien ne choque. Pourtant, un café refroidit et ne se réchauffe jamais tout seul. D’où vient la **flèche du temps** ?',
      'Boltzmann a répondu en 1877 : il suffit de **compter**. Une boîte, une paroi percée, et 4 molécules qui partent toutes à gauche. À toi de compter.',
    ],
    steps: [
      {
        intro: 'Étape 1 — L’état rangé. De combien de façons les 4 molécules peuvent-elles être **toutes** à gauche ?',
        exercise: {
          id: 'exp-fl-range',
          prompt: 'Calcule $\\Omega = \\binom{4}{4}$.',
          start: ['Equal', 'Omega', ['Binom', 4, 4]],
          goal: ['Equal', 'Omega', 1],
          strictGoal: true,
          sim: { type: 'ehrenfest' },
          hints: [
            'Choisir les 4 molécules parmi 4 : tape sur le coefficient.',
            'Une seule façon : Ω = 1. L’état rangé est unique.',
          ],
        },
      },
      {
        intro: 'Étape 2 — L’état mélangé. Et 2 à gauche, 2 à droite ?',
        exercise: {
          id: 'exp-fl-melange',
          prompt: 'Calcule $\\Omega = \\binom{4}{2}$.',
          start: ['Equal', 'Omega', ['Binom', 4, 2]],
          goal: ['Equal', 'Omega', 6],
          strictGoal: true,
          depth: 9,
          hints: [
            'Règle de Pascal : C(3,1) + C(3,2).',
            'C(3,1) = 3 (un élu parmi 3), et C(3,2) = C(3,1) par symétrie.',
            '3 + 3 = 6 : six fois plus de façons d’être mélangé que rangé, déjà avec 4 molécules.',
          ],
        },
      },
      {
        intro: 'Étape 3 — Pourquoi un logarithme. La boîte de gauche et celle de droite sont deux sous-systèmes indépendants : $\\Omega = \\Omega_1 \\Omega_2$. Pour que l’entropie s’additionne comme une masse, Boltzmann prend le logarithme.',
        exercise: {
          id: 'exp-fl-additive',
          prompt: 'Montre que $\\ln(\\Omega_1 \\Omega_2)$ est une somme.',
          start: ['Ln', ['Multiply', 'Omega1', 'Omega2']],
          goal: ['Add', ['Ln', 'Omega1'], ['Ln', 'Omega2']],
          strictGoal: true,
          hints: ['Le log d’un produit est la somme des logs.'],
        },
      },
      {
        intro: 'Étape 4 — Le passage à l’échelle. Avec $N = 100$ molécules, chacune à gauche ou à droite, il y a $2^{100}$ micro-états, dont un seul « tout à gauche ». Combien de chiffres a ce nombre ?',
        exercise: {
          id: 'exp-fl-echelle',
          prompt: 'Fais descendre l’exposant : $\\log_{10}(2^{100})$.',
          start: ['Log', ['Power', 2, 100], 10],
          goal: ['Multiply', 100, ['Log', 2, 10]],
          strictGoal: true,
          hints: [
            'log(aⁿ) = n log a.',
            '100 × 0,301 ≈ 30,1 : 2¹⁰⁰ ≈ 10³⁰. Une chance sur un million de milliards de milliards de milliards.',
          ],
        },
      },
    ],
    epilogue:
      'Pour revoir les 100 molécules toutes à gauche, il faudrait en moyenne $2^{100} \\approx 10^{30}$ essais : même à un milliard d’essais par seconde depuis le Big Bang ($4 \\times 10^{17}$ s), on n’en serait qu’à $4 \\times 10^{26}$. Le retour en arrière n’est pas interdit — il est juste astronomiquement improbable. La flèche du temps est une flèche de **comptage**, et le logarithme de la Phase 2 en est l’unité de mesure.',
  },
];
