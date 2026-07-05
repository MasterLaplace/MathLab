import type { Lesson } from './schema';

/**
 * Batch 6 : les horizons — sept stations avancent d'un coup.
 * - H : substitution linéaire (Phase 4).
 * - R : ondes électromagnétiques animées (Phase 8).
 * - O : la corde vibrante, Fourier qu'on entend (Phase 9).
 * - T : marches aléatoires → diffusion (Phase 10).
 * - P : ℒ{y″}, éléments simples, l'oscillateur résolu (Phase 11).
 * - Q : domain coloring, les fonctions complexes peintes (Phase 12).
 * - U/S : Phase 13 — moindre action, Lagrange, et Navier-Stokes en direct.
 */

const M2X: ['Multiply', number, string] = ['Multiply', 2, 'x'];
const M3X: ['Multiply', number, string] = ['Multiply', 3, 'x'];

export const lessonsHorizons: Lesson[] = [
  // ───────────────── Station H — substitution linéaire (Phase 4) ─────────────────
  {
    id: 'p4-substitution',
    phase: 4,
    title: 'La substitution : intégrer f(ax)',
    tagline: '∫f(ax) = F(ax)/a — l’onde défile a fois plus vite',
    intro: ['La règle de la chaîne, lue à l’envers : quand l’argument défile a fois plus vite, la primitive se divise par a.'],
    course: [
      {
        kind: 'p',
        text:
          'Tu sais intégrer $\\cos x$. Mais $\\cos 2x$ ? La courbe est la même, **comprimée d’un facteur 2** : chaque arche est deux fois plus étroite, donc chaque aire est deux fois plus petite. La primitive doit s’en souvenir :',
      },
      {
        kind: 'math',
        latex: '\\int f(ax)\\,dx = \\frac{F(ax)}{a}',
        caption:
          'La substitution u = ax. Vérifie en dérivant : la règle de la chaîne fait descendre un facteur a, qui annule exactement le 1/a. Intégrer et dériver restent des jeux inverses.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le piège symétrique de la règle de la chaîne : en dérivant $\\sin 2x$ on **oublie** le 2 ; en intégrant, on oublie de **diviser** par 2. Les deux erreurs sont la même, dans les deux sens du voyage.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est le premier pas de la méthode générale du *changement de variable* — le u-substitution des cours de calcul. Ici u = ax ; plus tard, u pourra être n’importe quelle fonction, et l’intégrale se réécrira dans la nouvelle variable.',
      },
    ],
    exercises: [
      {
        id: 'sub-cos',
        prompt: 'Intègre cos(2x).',
        start: ['Int', ['Cos', M2X], 'x'],
        goal: ['Divide', ['Sin', M2X], 2],
        hint: 'La primitive de cos est sin — mais l’argument défile deux fois plus vite : divise par 2.',
      },
      {
        id: 'sub-exp',
        prompt: 'Intègre e^(3x).',
        start: ['Int', ['Exp', M3X], 'x'],
        goal: ['Divide', ['Exp', M3X], 3],
        hint: 'e reste e — au facteur 3 près.',
      },
      {
        id: 'sub-sin',
        prompt: 'Intègre sin(2x) (attention au signe).',
        start: ['Int', ['Sin', M2X], 'x'],
        goal: ['Divide', ['Negate', ['Cos', M2X]], 2],
        hint: 'La primitive de sin est −cos, puis divise par 2.',
      },
    ],
  },

  // ───────────────── Station R — l'onde électromagnétique (Phase 8) ─────────────────
  {
    id: 'p8-onde-em',
    phase: 8,
    title: 'La lumière : E et B qui s’engendrent',
    tagline: 'L’onde qui n’a besoin de personne — et file à c',
    intro: ['Un champ électrique qui varie crée un champ magnétique, qui en variant recrée un champ électrique : l’onde s’auto-entretient.'],
    course: [
      {
        kind: 'p',
        text:
          'Reprends les équations de Maxwell que tu as lues comme de la prose. Faraday : un $B$ qui varie fait tourbillonner $E$. Maxwell-Ampère : un $E$ qui varie fait tourbillonner $B$. Mets les deux ensemble, dans le vide, loin de toute charge : chaque champ **régénère l’autre**. La perturbation n’a plus besoin de support — elle voyage seule.',
      },
      {
        kind: 'math',
        latex: 'c = \\frac{1}{\\sqrt{\\varepsilon_0\\,\\mu_0}} \\approx 3\\times 10^8 \\text{ m/s}',
        caption:
          'En combinant ses équations, Maxwell obtient une équation d’onde dont la vitesse ne dépend que de deux constantes électriques mesurées en laboratoire… et le nombre qui sort est la vitesse de la lumière. « Nous pouvons difficilement éviter de conclure que la lumière EST une onde électromagnétique. »',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Maxwell publie en 1865 ; Hertz produit et détecte ces ondes en 1887 ; Marconi les fait traverser l’Atlantique en 1901. Radio, wifi, radar, fibre : toute la civilisation des télécoms tient dans ce calcul de 1865.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Une seule onde, un seul paramètre : la fréquence. Radio ($10^6$ Hz), micro-ondes, infrarouge, **lumière visible** ($\\sim 5\\times 10^{14}$ Hz), UV, X, gamma — le même phénomène, vu par des yeux différents. Et toujours $c = \\lambda f$.',
      },
    ],
    exercises: [
      {
        id: 'em-explore',
        prompt: 'Regarde E et B s’engendrer, perpendiculaires et en phase. Change la fréquence.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'em-wave' },
      },
      {
        id: 'em-cf',
        prompt: 'Une onde de longueur d’onde λ = 2 m et de fréquence f = 1,5·10⁸ Hz : vérifie que c = λ·f.',
        start: ['Equal', 'c', ['Multiply', 2, 150000000]],
        goal: ['Equal', 'c', 300000000],
        strictGoal: true,
        hint: 'Calcule le produit : tu dois retomber sur la vitesse de la lumière.',
      },
    ],
  },

  // ───────────────── Station O — la corde vibrante (Phase 9) ─────────────────
  {
    id: 'p9-corde',
    phase: 9,
    title: 'La corde vibrante : Fourier qu’on entend',
    tagline: 'Les modes propres — la musique est une série de Fourier',
    intro: ['Fixée aux deux bouts, la corde ne peut vibrer que sur certaines formes : les modes. Un son réel est leur mélange.'],
    course: [
      {
        kind: 'p',
        text:
          'Une corde de guitare est fixée aux deux extrémités : toute vibration doit s’**annuler aux attaches**. Cette simple contrainte interdit presque tout — ne survivent que les ondes $\\sin(n\\pi x/L)$, les **modes propres**. Le mode $n$ possède $n-1$ nœuds immobiles et vibre à la fréquence $f_n = n f_1$.',
      },
      {
        kind: 'math',
        latex: 'y(x,t) = \\sum_n a_n \\sin\\!\\left(\\frac{n\\pi x}{L}\\right)\\cos(n\\omega t)',
        caption:
          'N’importe quelle vibration de la corde est une somme de modes — une série de Fourier dans l’espace. Pince la corde : tu choisis les coefficients aₙ ; ton oreille les décompose instantanément en harmoniques.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est le problème qui a **créé** l’analyse de Fourier : d’Alembert, Euler et Daniel Bernoulli se sont disputés trente ans (1747–1777) pour savoir si « toute » forme de corde pouvait s’écrire en somme de sinus. Fourier a tranché — en étudiant la chaleur.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Pourquoi une guitare et un piano jouant le même la₄ (440 Hz) sonnent-ils différemment ? Même fondamental, **harmoniques différents** : le timbre est le vecteur des aₙ. Ton oreille fait une transformée de Fourier en temps réel depuis ta naissance.',
      },
    ],
    exercises: [
      {
        id: 'corde-explore',
        prompt: 'Passe les modes en revue (regarde les nœuds), puis coche « pincée » : le mélange.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'string-wave' },
      },
      {
        id: 'corde-harmonique',
        prompt: 'La corde de la₁ (fondamental 110 Hz) : quelle est la fréquence du mode 3 ?',
        start: ['Equal', 'f', ['Multiply', 3, 110]],
        goal: ['Equal', 'f', 330],
        strictGoal: true,
        hint: 'f₃ = 3·f₁ : les harmoniques sont les multiples entiers.',
      },
    ],
  },

  // ───────────────── Station T — marches aléatoires (Phase 10) ─────────────────
  {
    id: 'p10-marches',
    phase: 10,
    title: 'Marches aléatoires : le hasard qui diffuse',
    tagline: 'Personne ne sait où va UN marcheur — le nuage, si : en √t',
    intro: ['Pile ou face à chaque pas. Un marcheur est imprévisible ; mille marcheurs dessinent une loi exacte.'],
    course: [
      {
        kind: 'p',
        text:
          'Un marcheur part de 0 et fait un pas $\\pm 1$ à pile ou face. Après $t$ pas, où est-il ? **Impossible à dire.** Mais à quelle distance *typique* est-il ? Là, la réponse est exacte : les pas indépendants additionnent leurs **variances** (pas leurs écarts !), donc $\\sigma^2 = t$ et',
      },
      {
        kind: 'math',
        latex: '\\sigma = \\sqrt{t}',
        caption:
          'La signature du hasard : pour s’éloigner 2 fois plus, il faut marcher 4 fois plus longtemps. L’ivrogne de Pearson, le pollen de Brown, le cours de bourse — tous s’étalent en racine du temps.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Zoome arrière : des millions de marcheurs microscopiques (les molécules d’encre) donnent une concentration qui obéit à **l’équation de la chaleur** $\\partial_t u = D\\,\\partial_x^2 u$. La diffusion est une marche aléatoire vue de loin — le pont exact entre probabilités et physique.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'En 1905, Einstein a prédit la marche aléatoire du pollen de Brown à partir de l’hypothèse atomique — et Perrin l’a mesurée, prouvant l’existence des atomes. Le hasard microscopique est devenu la première preuve du monde moléculaire.',
      },
    ],
    exercises: [
      {
        id: 'marche-explore',
        prompt: '400 marcheurs jouent à pile ou face : regarde le nuage suivre la parabole √t et l’histogramme faire sa cloche.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'random-walk' },
      },
      {
        id: 'marche-sigma',
        prompt: 'Après 100 pas, à quelle distance typique est un marcheur ? d = √100.',
        start: ['Equal', 'd', ['Sqrt', 100]],
        goal: ['Equal', 'd', 10],
        strictGoal: true,
        hint: '√100 : un tap. Pour aller 2× plus loin, il faudra 400 pas.',
      },
    ],
  },

  // ───────────────── Station P — second ordre + éléments simples (Phase 11) ─────────────────
  {
    id: 'p11-second-ordre',
    phase: 11,
    title: 'ℒ{y″} et les éléments simples',
    tagline: 'L’oscillateur entier dans le pays de s — et le retour en morceaux',
    intro: ['Deux dérivées = deux multiplications par s. Et quand le dénominateur a deux pôles, on le casse en fractions simples.'],
    course: [
      {
        kind: 'p',
        text:
          'Le ressort de la Phase 5 obéit à $y\'\' = -\\omega^2 y$ — une **seconde** dérivée. Au pays de Laplace, même recette, appliquée deux fois :',
      },
      {
        kind: 'math',
        latex: '\\mathcal{L}\\{y\'\'\\} = s^2 Y - s\\,y_0 - v_0',
        caption:
          'Chaque étage de dérivation multiplie par s et laisse tomber une condition initiale : la position y₀, puis la vitesse v₀. L’EDO du ressort devient (s² + ω²)Y = s·y₀ — un polynôme.',
      },
      {
        kind: 'example',
        title: 'Le ressort résolu en trois lignes',
        steps: [
          '$y\'\' = -4y$, lâché en $y_0$ sans vitesse : $s^2Y - s\\,y_0 = -4Y$.',
          'Isoler : $Y = y_0\\,\\dfrac{s}{s^2+4}$ — tes gestes de la balance.',
          'La table à l’envers : $\\dfrac{s}{s^2+4} \\to \\cos 2t$. Donc $y = y_0 \\cos 2t$ : il oscille pour toujours. ✓',
        ],
      },
      {
        kind: 'p',
        text:
          'Dernier outil du retour : quand le dénominateur contient **deux pôles collés** — $\\dfrac{1}{(s+1)(s+2)}$ — aucune ligne de la table ne correspond. Casse-le en **éléments simples** : $\\dfrac{1}{s+1} - \\dfrac{1}{s+2}$, et chaque morceau redevient une exponentielle.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Relis le plan des pôles : $\\dfrac{s}{s^2+4}$ a ses deux pôles en $\\pm 2i$, **sur l’axe imaginaire** — l’oscillation éternelle. Et $(s+1)(s+2)$ a deux pôles réels négatifs : deux exponentielles qui meurent. La position des pôles EST la physique.',
      },
    ],
    exercises: [
      {
        id: 'ltd2-transforme',
        prompt: 'Le geste du second ordre : transforme ℒ{y″}.',
        start: ['LT', ['D', ['D', 'y', 't'], 't']],
        goal: ['Add', ['Multiply', ['Power', 's', 2], 'Y'], ['Negate', ['Multiply', 's', 'y₀']], ['Negate', 'v₀']],
        hint: 'Un tap : s²Y, moins s·y₀ (position), moins v₀ (vitesse).',
      },
      {
        id: 'ltd2-ressort',
        prompt: 'Le ressort : reviens dans le temps depuis Y = s/(s²+4).',
        start: ['Equal', 'y', ['ILT', ['Divide', 's', ['Add', ['Power', 's', 2], 4]]]],
        goal: ['Equal', 'y', ['Cos', ['Multiply', 2, 't']]],
        hint: 'Le s au numérateur signe un cosinus, avec ω² = 4 donc ω = 2.',
      },
      {
        id: 'ltd2-sinus',
        prompt: 'Et 2/(s²+4) ? Reviens dans le temps.',
        start: ['Equal', 'y', ['ILT', ['Divide', 2, ['Add', ['Power', 's', 2], 4]]]],
        goal: ['Equal', 'y', ['Sin', ['Multiply', 2, 't']]],
        hint: 'Numérateur constant = sinus : le système part de zéro avec de l’élan.',
      },
      {
        id: 'ltd2-elements',
        prompt: 'Deux pôles collés : casse 1/((s+1)(s+2)) en éléments simples, puis reviens.',
        start: ['ILT', ['Divide', 1, ['Multiply', ['Add', 's', 1], ['Add', 's', 2]]]],
        goal: ['Add', ['Exp', ['Multiply', -1, 't']], ['Negate', ['Exp', ['Multiply', -2, 't']]]],
        hint: 'Tape la fraction pour la scinder, sépare la somme, et chaque pôle redevient son exponentielle.',
      },
    ],
  },

  // ───────────────── Station Q — domain coloring (Phase 12) ─────────────────
  {
    id: 'p12-coloring',
    phase: 12,
    title: 'Peindre les fonctions complexes',
    tagline: 'Teinte = angle, luminosité = module : f(z) en une image',
    intro: ['Une fonction complexe transforme un plan en un plan : impossible à tracer en 2D… sauf si on la peint.'],
    course: [
      {
        kind: 'p',
        text:
          'Le graphe de $f: \\mathbb{C} \\to \\mathbb{C}$ vivrait en 4 dimensions. L’astuce du **domain coloring** : peindre chaque point $z$ du plan avec la couleur de $f(z)$ — la **teinte** code l’angle de $f(z)$ (le tour complet du cercle chromatique = un tour de 2π), la **luminosité** code le module.',
      },
      {
        kind: 'example',
        title: 'Lire une peinture complexe',
        steps: [
          'Un **zéro** : un puits sombre où toutes les teintes convergent. Les couleurs y tournent $n$ fois pour un zéro d’ordre $n$ — compte les arcs-en-ciel !',
          'Un **pôle** : le miroir du zéro — un sommet clair, couleurs tournant en sens inverse.',
          '$z^2$ : les teintes font **deux tours** autour de l’origine — c’est visible à l’œil nu que l’équation $z^2 = w$ a deux racines.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le théorème fondamental de l’algèbre devient visuel : un polynôme de degré $n$ fait tourner les couleurs $n$ fois au loin — il doit donc bien y avoir $n$ puits de couleurs quelque part à l’intérieur. Gauss aurait aimé nos écrans.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Les zéros de la fonction zêta de Riemann — l’hypothèse à un million de dollars — se *voient* en domain coloring : une rangée de puits de couleurs, tous mystérieusement alignés sur la droite $\\mathrm{Re}(s) = 1/2$.',
      },
    ],
    exercises: [
      {
        id: 'coloring-explore',
        prompt: 'Passe les quatre fonctions en revue : compte les tours de couleurs autour des zéros et des pôles.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'domain-coloring' },
      },
      {
        id: 'coloring-pole',
        prompt: 'Le pôle de 1/z en action : que vaut (2i)·(1/2)·(1/i) ? Simplifie i/i d’abord mentalement… puis par gestes : calcule 2·(1/2).',
        start: ['Equal', 'z', ['Multiply', 2, ['Divide', 1, 2]]],
        goal: ['Equal', 'z', 1],
        strictGoal: true,
        hint: 'Un facteur et son inverse s’annulent : 2·(1/2) = 1.',
      },
    ],
  },

  // ───────────────── Station U — moindre action (Phase 13) ─────────────────
  {
    id: 'p13-action',
    phase: 13,
    title: 'Le principe de moindre action',
    tagline: 'La nature ne calcule pas de forces : elle choisit le chemin le plus économe',
    intro: ['Parmi tous les chemins entre deux événements, la trajectoire réelle est celle qui minimise l’action S = ∫(T − V)dt.'],
    course: [
      {
        kind: 'p',
        text:
          'Newton dit : à chaque instant, la force pousse la balle. Lagrange dit autre chose : entre son départ et son arrivée, la balle a « essayé » **tous les chemins possibles**, et a suivi celui qui minimise une seule quantité, l’**action** :',
      },
      {
        kind: 'math',
        latex: 'S = \\int_{t_1}^{t_2} L\\,dt, \\qquad L = T - V',
        caption:
          'Le lagrangien L : énergie cinétique moins énergie potentielle. Exiger que S soit minimale (stationnaire) redonne exactement F = ma — mais formulé sans forces, sans vecteurs, dans n’importe quelles coordonnées.',
      },
      {
        kind: 'math',
        latex: '\\frac{d}{dt}\\frac{\\partial L}{\\partial v} = \\frac{\\partial L}{\\partial x}',
        caption:
          'L’équation d’Euler-Lagrange, la machine à équations du mouvement. ∂L/∂v est la quantité de mouvement p ; ∂L/∂x est la force. Pour L = mv²/2 − mgx : d(mv)/dt = −mg — la chute libre.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le théorème de **Noether** (1918) : chaque symétrie de L cache une loi de conservation. L insensible aux translations dans le temps ⟹ l’énergie se conserve ; aux translations d’espace ⟹ la quantité de mouvement ; aux rotations ⟹ le moment cinétique. La plus belle idée de la physique théorique.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Feynman a poussé l’idée au bout : en mécanique quantique, la particule prend **réellement tous les chemins** à la fois, chacun pondéré par $e^{iS/\\hbar}$ — une somme d’exponentielles imaginaires, tes épicycles ! Les chemins loin du minimum s’annulent par interférence ; il ne survit que la trajectoire classique.',
      },
    ],
    exercises: [
      {
        id: 'action-explore',
        prompt: 'Déforme le chemin de la balle : l’action remonte dès que tu quittes la parabole.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'action' },
      },
      {
        id: 'action-moment',
        prompt: 'La quantité de mouvement sort du lagrangien : calcule ∂(v²)/∂v.',
        start: ['D', ['Power', 'v', 2], 'v'],
        goal: ['Multiply', 2, 'v'],
        hint: 'La règle de la puissance, comme toujours — la variable s’appelle v, c’est tout.',
      },
      {
        id: 'action-force',
        prompt: 'La force sort du potentiel : calcule F = −∂(m·g·x)/∂x.',
        start: ['Negate', ['D', ['Multiply', 'm', 'g', 'x'], 'x']],
        goal: ['Negate', ['Multiply', 'm', 'g']],
        hint: 'm et g sont des constantes : sors-les, dérive x, retire le 1. La pesanteur, retrouvée.',
      },
    ],
  },

  // ───────────────── Station S — Navier-Stokes (Phase 13) ─────────────────
  {
    id: 'p13-fluides',
    phase: 13,
    title: 'Navier-Stokes : F = ma pour un fluide',
    tagline: 'Diffusion, advection, pression — et la turbulence au bout du curseur',
    intro: ['L’équation qui gouverne l’eau, l’air et les galaxies — résolue en direct dans la page.'],
    course: [
      {
        kind: 'p',
        text:
          'Un fluide est une infinité de petites masses. Écris $F = ma$ pour chacune et tu obtiens Navier-Stokes — terme à terme, c’est de la prose :',
      },
      {
        kind: 'math',
        latex: '\\rho\\left(\\frac{\\partial \\vec{v}}{\\partial t} + (\\vec{v}\\cdot\\nabla)\\vec{v}\\right) = -\\nabla p + \\mu\\,\\nabla^2 \\vec{v} + \\vec{f}',
        caption:
          'Masse × accélération = forces. (v·∇)v : le fluide se transporte lui-même — le terme non linéaire, source de tout le chaos. −∇p : la pression pousse du haut vers le bas. μ∇²v : la viscosité lisse (ton vieil ami le Laplacien). f : la gravité.',
      },
      {
        kind: 'example',
        title: 'Le nombre de Reynolds — l’analyse dimensionnelle au travail',
        steps: [
          'Compare l’inertie ($\\rho v L$) au frottement visqueux ($\\mu$) : $Re = \\dfrac{\\rho v L}{\\mu}$ — sans dimension (station des méthodes d’expert !).',
          '$Re$ petit (miel, bactéries) : la viscosité gagne — écoulement **laminaire**, réversible, sirupeux.',
          '$Re$ grand (rivière, avion) : l’inertie gagne — tourbillons, cascade d’échelles, **turbulence**.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Prouver que les solutions de Navier-Stokes existent et restent lisses en 3D est l’un des sept problèmes du millénaire, à un million de dollars. L’équation qui fait voler les avions n’est pas comprise mathématiquement — on la simule, comme ci-dessous.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'La simulation utilise la méthode « stable fluids » de Jos Stam (1999) : diffuser, transporter, puis **projeter** le champ de vitesses sur les champs à divergence nulle — ta station du calcul vectoriel, en action 60 fois par seconde.',
      },
    ],
    exercises: [
      {
        id: 'fluide-explore',
        prompt: 'Glisse la souris dans le fluide. Puis baisse la viscosité et regarde les volutes survivre.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'fluid' },
      },
      {
        id: 'fluide-reynolds',
        prompt: 'De l’eau (ρ = 1000, μ = 0,001) à 2 m/s dans un tuyau de 0,1 m : calcule Re = ρ·v·L/μ.',
        start: ['Equal', 'R', ['Divide', ['Multiply', 1000, 2, 0.1], 0.001]],
        goal: ['Equal', 'R', 200000],
        strictGoal: true,
        hint: 'Calcule le haut, puis divise : Re ≈ 2·10⁵ ≫ 2300 — franchement turbulent.',
      },
    ],
  },
];
