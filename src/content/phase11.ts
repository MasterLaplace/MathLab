import type { Lesson } from './schema';

/**
 * Batch 3 : défaire le calcul.
 * - Station H : l'intégration par gestes + le théorème fondamental (Phase 4).
 * - Station P : la transformée de Laplace, Phase 11 — l'ultime opération
 *   inverse : les EDO deviennent de l'algèbre de collège.
 */
export const lessonsPhase11: Lesson[] = [
  // ───────────────── Station H — l'intégration par gestes (Phase 4) ─────────────────
  {
    id: 'p4-integration-gestes',
    phase: 4,
    title: 'L’intégrale : le jeu inverse',
    tagline: '∫ défait d/dx — le théorème fondamental en un tap',
    intro: ['Chaque règle de dérivation, lue à l’envers, devient une règle d’intégration. Et le théorème fondamental relie les deux en un geste.'],
    course: [
      {
        kind: 'p',
        text:
          'Tu sais maintenant dériver par gestes. Retourne chaque règle comme un gant : voici l’intégration. La puissance qui descendait **remonte** : $\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1}$. La somme se scinde toujours, les constantes sortent toujours — la linéarité ne t’abandonnera jamais.',
      },
      {
        kind: 'p',
        text:
          'Mais que calcule une intégrale, au juste ? Une **accumulation**. La simulation ci-dessous empile des rectangles sous la courbe $y = x^2$ : quelques rectangles grossiers donnent une aire approximative ; des milliers de rectangles fins donnent l’aire exacte. L’intégrale est cette limite — Riemann l’a définie ainsi.',
      },
      {
        kind: 'math',
        latex: '\\frac{d}{dx}\\!\\int f(x)\\,dx = f(x)',
        caption:
          'Le théorème fondamental de l’analyse : dériver une accumulation rend la fonction. La vitesse à laquelle l’aire grandit, c’est la hauteur de la courbe. Pente et aire sont deux faces de la même pièce.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Une primitive est définie « à une constante près » : $x^2$ et $x^2 + 5$ ont la même dérivée. Ici, ∫ désigne *une* primitive (la plus simple) ; garde en tête que toute la famille $+\\,C$ marche aussi.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Newton et Leibniz ont découvert ce lien indépendamment dans les années 1670 — et se sont déchirés pour la paternité. Le calcul intégral existait pourtant en germe chez Archimède, qui « épuisait » les aires avec des polygones : les rectangles de Riemann, deux mille ans plus tôt.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Monte le curseur : regarde la somme des rectangles converger vers 8/3.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'riemann' },
      },
      {
        id: 'e2',
        prompt: 'Intègre x (l’aire sous la diagonale).',
        start: ['Int', 'x', 'x'],
        goal: ['Divide', ['Power', 'x', 2], 2],
        hint: 'Appuie sur l’intégrale : le triangle sous la diagonale vaut x²/2.',
      },
      {
        id: 'e3',
        prompt: 'Intègre x² + 1, règle par règle.',
        start: ['Int', ['Add', ['Power', 'x', 2], 1], 'x'],
        goal: ['Add', ['Divide', ['Power', 'x', 3], 3], 'x'],
        hint: 'Scinde la somme, puis : la puissance remonte d’un côté, la constante fait une droite de l’autre.',
      },
      {
        id: 'e4',
        prompt: 'Le théorème fondamental en un geste : dérive l’intégrale de sin.',
        start: ['D', ['Int', ['Sin', 'x'], 'x'], 'x'],
        goal: ['Sin', 'x'],
        hint: 'd/dx et ∫ sont inverses : ils s’annulent — un seul tap.',
      },
    ],
  },

  // ───────────────── Station P — Laplace (Phase 11) ─────────────────
  {
    id: 'p11-laplace-table',
    phase: 11,
    title: 'Le pays de Laplace',
    tagline: 'ℒ : traduire le temps en fréquence, ligne par ligne',
    intro: ['La transformée de Laplace traduit une fonction du temps en une fonction de s. Chaque ligne de la table est un tap.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici l’outil le plus magique de l’ingénieur. La transformée de Laplace $\\mathcal{L}$ prend une fonction du temps $f(t)$ et la traduit dans une autre langue : une fonction de $s$. Pourquoi ce détour ? Parce que dans le pays de $s$, **dériver devient multiplier** — les équations différentielles y deviennent de l’algèbre de collège. Ton algèbre.',
      },
      {
        kind: 'math',
        latex: 'F(s) = \\mathcal{L}\\{f(t)\\} = \\int_0^{\\infty} f(t)\\,e^{-st}\\,dt',
        caption:
          'La définition officielle — une intégrale que tu sais maintenant lire ! En pratique, personne ne la recalcule : on utilise une table, et chaque ligne est un geste.',
      },
      {
        kind: 'example',
        title: 'Les lignes essentielles de la table',
        steps: [
          '$\\mathcal{L}\\{1\\} = \\dfrac{1}{s}$ — une constante devient une fraction simple.',
          '$\\mathcal{L}\\{t\\} = \\dfrac{1}{s^2}$ — la rampe : chaque intégration ajoute un /s.',
          '$\\mathcal{L}\\{e^{at}\\} = \\dfrac{1}{s-a}$ — l’exponentielle devient un **pôle** en $s = a$.',
          '$\\mathcal{L}\\{\\sin \\omega t\\} = \\dfrac{\\omega}{s^2+\\omega^2}$ — une oscillation, deux pôles imaginaires.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'ℒ est **linéaire**, comme la dérivée et l’intégrale avant elle : les sommes se scindent, les constantes sortent. Tu connais déjà ces gestes — seule la table est nouvelle.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Pierre-Simon de Laplace (1749–1827) voulait prédire le mouvement des planètes. Sa transformée fait aujourd’hui atterrir des fusées, stabiliser des drones et filtrer le son de tes écouteurs : toute la théorie du contrôle vit dans le pays de s.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Première ligne de la table : transforme la constante 1.',
        start: ['LT', 1],
        goal: ['Divide', 1, 's'],
        hint: 'Appuie sur ℒ{1}.',
      },
      {
        id: 'e2',
        prompt: 'La ligne la plus utile : transforme e^(−2t).',
        start: ['LT', ['Exp', ['Multiply', -2, 't']]],
        goal: ['Divide', 1, ['Add', 's', 2]],
        hint: 'e^(at) devient 1/(s − a). Ici a = −2, donc s + 2.',
      },
      {
        id: 'e3',
        prompt: 'Linéarité : transforme 3·e^(−2t) en deux gestes.',
        start: ['LT', ['Multiply', 3, ['Exp', ['Multiply', -2, 't']]]],
        goal: ['Multiply', 3, ['Divide', 1, ['Add', 's', 2]]],
        hint: 'Sors d’abord la constante 3, puis applique la table.',
      },
      {
        id: 'e4',
        prompt: 'Une oscillation : transforme sin(3t).',
        start: ['LT', ['Sin', ['Multiply', 3, 't']]],
        goal: ['Divide', 3, ['Add', ['Power', 's', 2], 9]],
        hint: 'sin(ωt) devient ω/(s² + ω²), avec ω = 3.',
      },
    ],
  },
  {
    id: 'p11-laplace-edo',
    phase: 11,
    title: 'Résoudre une EDO sans la résoudre',
    tagline: 'Aller-retour : ℒ, algèbre de collège, ℒ⁻¹',
    intro: ['Le pipeline complet : transformer l’équation différentielle, isoler Y avec tes vieux gestes, revenir par ℒ⁻¹.'],
    course: [
      {
        kind: 'p',
        text:
          'Voici le voyage complet, sur l’EDO du refroidissement $y\' = -2y$ avec $y(0) = 1$ (le café de la leçon du champ de directions !). La propriété clé : $\\mathcal{L}\\{y\'\\} = s\\,Y - y(0)$ — **dériver dans le temps, c’est multiplier par s** au pays de Laplace.',
      },
      {
        kind: 'example',
        title: 'Le voyage en quatre étapes',
        steps: [
          'Transformer les deux côtés : $s\\,Y - 1 = -2\\,Y$. Plus aucune dérivée !',
          'Rassembler les $Y$ (tes gestes de la balance) : $Y(s + 2) = 1$.',
          'Isoler : $Y = \\dfrac{1}{s+2}$. De l’algèbre de Phase 2.',
          'Revenir : $y = \\mathcal{L}^{-1}\\left\\{\\dfrac{1}{s+2}\\right\\} = e^{-2t}$. Le café refroidit exponentiellement. ✓',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Relis bien : l’étape « difficile » (résoudre une équation différentielle) a été remplacée par isoler $Y$ — un geste que tu maîtrises depuis la Phase 2. C’est ça, une transformée : déplacer le problème là où il est facile.',
      },
      {
        kind: 'p',
        text:
          'Le retour utilise la table à l’envers : chaque forme en $s$ correspond à une fonction du temps. $\\dfrac{1}{s+a}$ redevient $e^{-at}$ — retiens cette paire, c’est la respiration de toute la théorie du contrôle.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Étape 3 du voyage : isole Y dans Y·(s+2) = 1.',
        start: ['Equal', ['Multiply', 'Y', ['Add', 's', 2]], 1],
        goal: ['Equal', 'Y', ['Divide', 1, ['Add', 's', 2]]],
        hint: 'Le facteur (s+2) traverse le = en division — le geste de toujours.',
      },
      {
        id: 'e2',
        prompt: 'Étape 4 : reviens dans le temps avec ℒ⁻¹.',
        start: ['Equal', 'y', ['ILT', ['Divide', 1, ['Add', 's', 2]]]],
        goal: ['Equal', 'y', ['Exp', ['Multiply', -2, 't']]],
        hint: 'Le pôle en s = −2 redevient e^(−2t) : un tap.',
      },
      {
        id: 'e3',
        prompt: 'Autre système : gain 2, pôle en −3. Reviens dans le temps.',
        start: ['Equal', 'y', ['ILT', ['Divide', 2, ['Add', 's', 3]]]],
        goal: ['Equal', 'y', ['Multiply', 2, ['Exp', ['Multiply', -3, 't']]]],
        hint: '2/(s+3) redevient 2·e^(−3t).',
      },
    ],
  },
  {
    id: 'p11-poles',
    phase: 11,
    title: 'Pôles et stabilité',
    tagline: 'La position du pôle EST le destin du système',
    intro: ['Un pôle à gauche : le système s’amortit. À droite : il explose. Sur l’axe : il oscille pour toujours.'],
    course: [
      {
        kind: 'p',
        text:
          'Un **pôle** est une valeur de $s$ qui annule le dénominateur : $\\dfrac{1}{s+2}$ a un pôle en $s = -2$. Et tu viens de le voir : ce pôle redevient $e^{-2t}$ dans le temps. La position du pôle **est** le comportement du système — c’est l’idée la plus payante de toute l’ingénierie.',
      },
      {
        kind: 'example',
        title: 'Lire un pôle σ + iω',
        steps: [
          'Partie réelle $\\sigma < 0$ (moitié gauche) : $e^{\\sigma t}$ décroît — le système **s’amortit**. Stable.',
          'Partie réelle $\\sigma > 0$ (moitié droite) : $e^{\\sigma t}$ explose — **instable**. Le pont s’effondre.',
          'Partie imaginaire $\\omega$ : la fréquence d’oscillation — plus le pôle est haut, plus ça vibre vite.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Concevoir un autopilote, c’est littéralement **déplacer des pôles** : on ajoute des correcteurs jusqu’à ce que tous les pôles du système soient confortablement dans la moitié gauche. Les ingénieurs disent « placer les pôles » comme on place des meubles.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Note la spirale : le ressort de la Phase 5 avait $\\omega = \\sqrt{k/m}$ — c’étaient déjà deux pôles sur l’axe imaginaire, en $\\pm i\\omega$. L’oscillation éternelle du ressort sans frottement, c’est la limite de stabilité du plan de Laplace.',
      },
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Déplace le pôle : à gauche, à droite, sur l’axe. Regarde la réponse changer de destin.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'poles' },
      },
      {
        id: 'e2',
        prompt: 'Trouve le pôle de 1/(s+2) : résous 0 = s + 2.',
        start: ['Equal', 0, ['Add', 's', 2]],
        goal: ['Equal', 's', -2],
        hint: 'Le 2 traverse le = en changeant de signe, puis calcule.',
      },
    ],
  },
];
