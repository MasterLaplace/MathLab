import type { Exercise, Lesson } from './schema';

/**
 * Batch 5 : approfondissements de quatre stations.
 * - Station H : l'intégration par parties (Phase 4).
 * - Station T : arbres de probabilité + espérance (Phase 10).
 * - Station P : ℒ{y′} = sY − y₀, le pipeline EDO complet par gestes (Phase 11).
 * - Station Q : les racines de l'unité (Phase 12).
 */

const HALF: ['Divide', number, number] = ['Divide', 1, 2];

export const lessonsApprofondissements: Lesson[] = [
  // ───────────────── Station H — intégration par parties (Phase 4) ─────────────────
  {
    id: 'p4-parties',
    phase: 4,
    title: 'L’intégration par parties',
    tagline: '∫u·v′ = u·v − ∫u′·v : le produit se déshabille',
    intro: ['Quand l’intégrande est un produit, on intègre un facteur et on dérive l’autre : le produit se simplifie d’un tour à chaque geste.'],
    course: [
      {
        kind: 'p',
        text:
          'Comment intégrer $x\\cos x$ ? Aucune ligne de ta table ne correspond. Mais souviens-toi de la **règle du produit** : $(u\\,v)\' = u\'v + u\\,v\'$. Intègre les deux côtés et réarrange :',
      },
      {
        kind: 'math',
        latex: '\\int u\\,v\'\\,dx = u\\,v - \\int u\'\\,v\\,dx',
        caption:
          'L’intégration par parties : la règle du produit lue à l’envers. On intègre le facteur « facile » (v′ → v) et on dérive l’autre (u → u′) — le nouveau problème est plus simple que l’ancien.',
      },
      {
        kind: 'example',
        title: '∫ x·cos x dx, pas à pas',
        steps: [
          'Choisis $u = x$ (il va se **dériver en 1** : il disparaîtra) et $v\' = \\cos x$ (sa primitive est connue : $\\sin x$).',
          'Par parties : $\\int x\\cos x\\,dx = x\\sin x - \\int 1\\cdot\\sin x\\,dx$.',
          'La nouvelle intégrale est de la table : $\\int \\sin x\\,dx = -\\cos x$.',
          'Résultat : $x\\sin x + \\cos x$. Dérive-le pour vérifier — le jeu est réversible !',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le bon choix de $u$ : ce qui **meurt en dérivant** (les polynômes : $x \\to 1 \\to 0$). Le bon $v\'$ : ce qui s’intègre sans douleur ($\\cos$, $\\sin$, $e^x$). Un mauvais choix te renvoie une intégrale pire que la première — retourne-le.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Le nom anglais est plus honnête : *integration by parts*, l’intégration « par morceaux ». Brook Taylor l’a publiée en 1715 — c’est le même Taylor que les séries, et c’est probablement l’outil le plus utilisé de tout le calcul intégral universitaire.',
      },
    ],
    exercises: [
      {
        id: 'parties-xcos',
        prompt: 'Intègre x·cos x par parties (u = x se dérive en 1 et disparaît).',
        start: ['Int', ['Multiply', 'x', ['Cos', 'x']], 'x'],
        goal: ['Add', ['Multiply', 'x', ['Sin', 'x']], ['Cos', 'x']],
        hint: 'Appuie sur l’intégrale : par parties. Puis résous le d/dx en attente, retire le 1, et finis avec la table.',
      },
      {
        id: 'parties-xexp',
        prompt: 'Intègre x·eˣ par parties.',
        start: ['Int', ['Multiply', 'x', ['Exp', 'x']], 'x'],
        goal: ['Add', ['Multiply', 'x', ['Exp', 'x']], ['Negate', ['Exp', 'x']]],
        hint: 'u = x, v′ = eˣ. La nouvelle intégrale ∫eˣ est de la table.',
      },
      {
        id: 'parties-xsin',
        prompt: 'Intègre x·sin x par parties (attention aux signes !).',
        start: ['Int', ['Multiply', 'x', ['Sin', 'x']], 'x'],
        goal: ['Add', ['Negate', ['Multiply', 'x', ['Cos', 'x']]], ['Sin', 'x']],
        hint: 'La primitive de sin est −cos : le premier terme sort avec un moins, et le moins de l’intégrale devient un plus.',
      },
    ],
    generator: () => {
      const kinds = [
        { f: 'Cos', goal: (u: string): Exercise['goal'] => ['Add', ['Multiply', u, ['Sin', u]], ['Cos', u]] },
        { f: 'Exp', goal: (u: string): Exercise['goal'] => ['Add', ['Multiply', u, ['Exp', u]], ['Negate', ['Exp', u]]] },
      ];
      const k = kinds[Math.floor(Math.random() * kinds.length)];
      const fn = k.f === 'Cos' ? 'cos' : 'e^';
      return {
        id: `gen-parties-${k.f}`,
        prompt: `Intègre x·${fn === 'cos' ? 'cos x' : 'eˣ'} par parties.`,
        start: ['Int', ['Multiply', 'x', [k.f, 'x']], 'x'],
        goal: k.goal('x'),
        hint: 'u = x se dérive en 1 : le produit se déshabille.',
      };
    },
  },

  // ───────────────── Station T — arbres de probabilité (Phase 10) ─────────────────
  {
    id: 'p10-arbres',
    phase: 10,
    title: 'Les arbres de probabilité',
    tagline: 'Multiplier le long des branches, additionner les feuilles',
    intro: ['Un arbre pondéré organise le hasard : chaque branche porte sa probabilité, chaque feuille est un scénario complet.'],
    course: [
      {
        kind: 'p',
        text:
          'Quand le hasard se déroule en **plusieurs étapes** (tirer une urne, puis une boule ; être malade, puis testé), dessine un arbre. Deux lois suffisent pour tout lire :',
      },
      {
        kind: 'example',
        title: 'Les deux lois de l’arbre',
        steps: [
          '**Le long d’un chemin, on multiplie** : $P(A \\cap B) = P(A) \\times P(B|A)$ — la probabilité d’arriver au bout d’une branche est le produit des étapes.',
          '**Entre chemins, on additionne** : $P(B) = P(A \\cap B) + P(\\bar{A} \\cap B)$ — la probabilité totale ramasse toutes les feuilles où B arrive.',
          'Garde-fou : la somme de **toutes** les feuilles fait toujours 1. Si ce n’est pas le cas, l’arbre est faux.',
        ],
      },
      {
        kind: 'math',
        latex: 'P(B) = P(A)\\,P(B|A) + P(\\bar{A})\\,P(B|\\bar{A})',
        caption:
          'La formule des probabilités totales : la traduction algébrique de « je ramasse toutes les feuilles B ». C’est exactement le dénominateur de la formule de Bayes que tu as déjà rencontrée.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          '$P(B|A)$ (« B sachant A ») n’est **pas** $P(A|B)$. Le test médical de la leçon de Bayes vivait précisément de cette confusion : détecter la maladie chez les malades ≠ être malade quand le test sonne.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Blaise Pascal et Pierre de Fermat ont inventé les probabilités en 1654 dans un échange de lettres sur… un problème de jeu d’argent interrompu. Leur méthode : énumérer les chemins possibles — des arbres, déjà.',
      },
    ],
    exercises: [
      {
        id: 'arbre-explore',
        prompt: 'Fais glisser les trois curseurs : regarde les feuilles se recalculer et leur somme rester à 1.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'prob-tree' },
      },
      {
        id: 'arbre-branche',
        prompt: 'Un chemin de l’arbre : P = (1/2)·(1/3). Multiplie les fractions.',
        start: ['Equal', 'P', ['Multiply', HALF, ['Divide', 1, 3]]],
        goal: ['Equal', 'P', ['Divide', 1, 6]],
        strictGoal: true,
        hint: 'Glisse une fraction sur l’autre : les hauts se multiplient ensemble, les bas ensemble.',
      },
      {
        id: 'arbre-totale',
        prompt: 'Probabilité totale : deux feuilles mènent à B. P(B) = 1/8 + 3/8.',
        start: ['Equal', 'P', ['Add', ['Divide', 1, 8], ['Divide', 3, 8]]],
        goal: ['Equal', 'P', 0.5],
        strictGoal: true,
        hint: 'Même dénominateur : glisse une fraction sur l’autre, puis calcule.',
      },
    ],
    generator: () => {
      const denoms = [
        [2, 3],
        [2, 5],
        [3, 4],
        [2, 7],
      ];
      const [b, d] = denoms[Math.floor(Math.random() * denoms.length)];
      return {
        id: `gen-arbre-${b}-${d}`,
        prompt: `Un chemin de l’arbre : P = (1/${b})·(1/${d}). Multiplie les fractions.`,
        start: ['Equal', 'P', ['Multiply', ['Divide', 1, b], ['Divide', 1, d]]],
        goal: ['Equal', 'P', ['Divide', 1, b * d]],
        strictGoal: true,
        hint: 'Les hauts ensemble, les bas ensemble.',
      };
    },
  },
  {
    id: 'p10-esperance',
    phase: 10,
    title: 'L’espérance : la moyenne du hasard',
    tagline: 'E = Σ valeur × probabilité — ce que le long terme te paiera',
    intro: ['L’espérance est la moyenne pondérée des issues : chaque valeur compte au prorata de sa probabilité.'],
    course: [
      {
        kind: 'p',
        text:
          'Un dé honnête paie sa face en euros. Combien « vaut » un lancer ? Aucun lancer ne donne 3,50 € — et pourtant c’est la seule bonne réponse. L’**espérance** est la moyenne des valeurs, pondérée par leurs probabilités :',
      },
      {
        kind: 'math',
        latex: 'E[X] = \\sum_i x_i\\, p_i = 1\\cdot\\tfrac16 + 2\\cdot\\tfrac16 + \\dots + 6\\cdot\\tfrac16 = 3{,}5',
        caption:
          'Sur mille lancers, la moyenne observée collera à 3,5 — c’est la loi des grands nombres. L’espérance est ce que le hasard promet *en moyenne*, jamais ce qu’il donne *à chaque fois*.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Un jeu est **équitable** quand son espérance de gain est nulle. Toutes les loteries réelles ont une espérance négative : le mathématicien y voit une taxe volontaire sur l’optimisme.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Le paradoxe de Saint-Pétersbourg (Daniel Bernoulli, 1738) : un jeu d’espérance **infinie** que personne ne paierait cher. La solution de Bernoulli — l’utilité marginale décroissante de l’argent — a fondé l’économie moderne trois siècles en avance.',
      },
    ],
    exercises: [
      {
        id: 'esperance-de',
        prompt: 'Le dé qui paie sa face : E = (1+2+3+4+5+6)/6. Calcule.',
        start: ['Equal', 'E', ['Divide', ['Add', 1, 2, 3, 4, 5, 6], 6]],
        goal: ['Equal', 'E', 3.5],
        strictGoal: true,
        hint: 'Calcule d’abord la somme du haut, puis la division.',
      },
      {
        id: 'esperance-pari',
        prompt: 'Un pari : gagner 10 € avec probabilité 1/4, mise de 2 €. E = 10·(1/4) − 2.',
        start: ['Equal', 'E', ['Add', ['Multiply', 10, ['Divide', 1, 4]], -2]],
        goal: ['Equal', 'E', 0.5],
        strictGoal: true,
        hint: 'Calcule le produit 10·(1/4), puis la somme. Positif : le pari vaut le coup (en moyenne !).',
      },
    ],
  },

  // ───────────────── Station P — ℒ{y′} = sY − y₀ (Phase 11) ─────────────────
  {
    id: 'p11-lt-derivee',
    phase: 11,
    title: 'ℒ{y′} : la dérivée devient multiplication',
    tagline: 'Le pipeline EDO entier, désormais 100 % par gestes',
    intro: ['La propriété reine de Laplace, maintenant comme geste : transformer y′, isoler Y, revenir — sans quitter l’équation.'],
    course: [
      {
        kind: 'p',
        text:
          'Dans la leçon du pays de Laplace, l’étape « transformer l’équation » t’était donnée toute faite. Voici le geste qui manquait — la propriété qui fait tout marcher :',
      },
      {
        kind: 'math',
        latex: '\\mathcal{L}\\{y\'\\} = s\\,Y - y_0',
        caption:
          'Dériver dans le temps, c’est multiplier par s au pays de Laplace — moins y₀ = y(0), le souvenir de la condition initiale. La preuve : une intégration par parties sur la définition (que tu viens d’apprendre !).',
      },
      {
        kind: 'example',
        title: 'y′ = −2y, résolu de bout en bout par gestes',
        steps: [
          'Transformer chaque côté : $\\mathcal{L}\\{y\'\\} = s\\,Y - y_0$ à gauche ; à droite la constante sort puis $\\mathcal{L}\\{y\\} = Y$.',
          'Il ne reste que de l’algèbre : $s\\,Y - y_0 = -2\\,Y$, donc $Y(s+2) = y_0$ (factorise !).',
          'Isoler : $Y = \\dfrac{y_0}{s+2}$ — le geste de la balance, comme en Phase 2.',
          'Revenir : $y = y_0\\,e^{-2t}$. La solution générale, condition initiale comprise. ✓',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Regarde ce qui vient de se passer : l’équation différentielle a été résolue **sans jamais intégrer**. La transformée a déplacé le problème au pays où dériver = multiplier, ton algèbre a fait le travail, et la table t’a ramené.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'N’oublie jamais le $-\\,y_0$ : c’est lui qui porte la condition initiale à travers tout le calcul. L’oublier, c’est résoudre une autre équation — celle qui part de zéro.',
      },
    ],
    exercises: [
      {
        id: 'ltd-transforme',
        prompt: 'Le geste nouveau : transforme ℒ{y′}.',
        start: ['LT', ['D', 'y', 't']],
        goal: ['Add', ['Multiply', 's', 'Y'], ['Negate', 'y₀']],
        hint: 'Un tap : la dérivée devient s·Y, moins la condition initiale y₀.',
      },
      {
        id: 'ltd-equation',
        prompt: 'Transforme les deux côtés de y′ = −2y.',
        start: ['Equal', ['LT', ['D', 'y', 't']], ['LT', ['Multiply', -2, 'y']]],
        goal: ['Equal', ['Add', ['Multiply', 's', 'Y'], ['Negate', 'y₀']], ['Multiply', -2, 'Y']],
        hint: 'À gauche : la propriété reine. À droite : sors la constante, puis ℒ{y} = Y.',
      },
      {
        id: 'ltd-isole',
        prompt: 'Rassemblés à gauche : s·Y + 2·Y = y₀. Isole Y.',
        start: ['Equal', ['Add', ['Multiply', 's', 'Y'], ['Multiply', 2, 'Y']], 'y₀'],
        goal: ['Equal', 'Y', ['Divide', 'y₀', ['Add', 's', 2]]],
        hint: 'Factorise Y (glisse un terme sur l’autre), puis fais traverser le facteur (s+2).',
      },
      {
        id: 'ltd-retour',
        prompt: 'Reviens dans le temps : la solution générale, y₀ compris.',
        start: ['Equal', 'y', ['ILT', ['Divide', 'y₀', ['Add', 's', 2]]]],
        goal: ['Equal', 'y', ['Multiply', 'y₀', ['Exp', ['Multiply', -2, 't']]]],
        hint: 'Le pôle en s = −2 redevient e^(−2t) — le y₀ suit comme un simple facteur.',
      },
    ],
  },

  // ───────────────── Station Q — racines de l'unité (Phase 12) ─────────────────
  {
    id: 'p12-racines',
    phase: 12,
    title: 'Les racines de l’unité',
    tagline: 'zⁿ = 1 a n solutions : un polygone parfait sur le cercle',
    intro: ['Combien de nombres, élevés au cube, donnent 1 ? Trois. Ils dessinent un triangle équilatéral sur le cercle unité.'],
    course: [
      {
        kind: 'p',
        text:
          'Sur la droite réelle, $z^3 = 1$ n’a qu’une solution : 1. Mais dans le plan complexe, élever à la puissance $n$ **multiplie l’angle par n** : $\\left(e^{i\\theta}\\right)^n = e^{in\\theta}$. Il suffit donc qu’un angle, multiplié par $n$, fasse un nombre entier de tours !',
      },
      {
        kind: 'math',
        latex: '\\omega_k = e^{2\\pi i k/n}, \\quad k = 0, 1, \\dots, n-1',
        caption:
          'Les n racines n-ièmes de l’unité : n points également espacés sur le cercle, les sommets d’un polygone régulier. Pour n = 3 : 1, e^{2πi/3}, e^{4πi/3} — un triangle équilatéral.',
      },
      {
        kind: 'example',
        title: 'Vérifier que ω = e^{2πi/3} est bien une racine cubique de 1',
        steps: [
          'Élève à la puissance : $\\omega^3 = e^{3 \\cdot 2\\pi i/3} = e^{2\\pi i}$ — l’angle fait un tour complet.',
          'Déplie Euler : $e^{2\\pi i} = \\cos 2\\pi + i \\sin 2\\pi$.',
          'Lis le cercle : $\\cos 2\\pi = 1$, $\\sin 2\\pi = 0$. Donc $\\omega^3 = 1$. ✓',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'La somme des $n$ racines vaut **zéro** : le polygone est parfaitement équilibré autour de l’origine. Cette annulation est le cœur de la transformée de Fourier discrète — l’algorithme FFT qui fait tourner le son, l’image et la 5G.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Gauss, à 18 ans, a prouvé que le polygone régulier à 17 côtés est constructible à la règle et au compas — en jouant avec les racines 17-ièmes de l’unité. Il en fut si fier qu’il voulut un heptadécagone gravé sur sa tombe.',
      },
    ],
    exercises: [
      {
        id: 'racines-explore',
        prompt: 'Monte n et change le pas de la marche : polygones, étoiles… et une somme toujours nulle.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'roots' },
      },
      {
        id: 'racines-i4',
        prompt: 'i est une racine quatrième de 1 : vérifie que i⁴ = 1.',
        start: ['Power', 'i', 4],
        goal: 1,
        strictGoal: true,
        hint: 'Le cycle de i : quatre quarts de tour ramènent au départ.',
      },
      {
        id: 'racines-carre',
        prompt: '(e^{iπ/2})² : deux quarts de tour. Montre que ça fait −1.',
        start: ['Power', ['Exp', ['Multiply', 'i', ['Divide', 'pi', 2]]], 2],
        goal: -1,
        strictGoal: true,
        hint: 'La puissance multiplie l’angle, puis déplie Euler et lis le cercle.',
        sim: { type: 'unit-circle' },
      },
      {
        id: 'racines-cube',
        prompt: 'Le grand final : vérifie que ω = e^{2πi/3} est racine cubique de 1.',
        start: ['Power', ['Exp', ['Multiply', 'i', ['Divide', ['Multiply', 2, 'pi'], 3]]], 3],
        goal: 1,
        strictGoal: true,
        hint: 'Élève (l’angle fait un tour complet), déplie Euler, lis le cercle en 2π, anéantis le 0.',
      },
    ],
  },
];
