import type { Lesson } from './schema';

/**
 * Batch 12 : la station X — la théorie des groupes commence ici. Phase 17 :
 * les 8 symétries du carré deviennent des objets manipulables (le premier
 * calcul sur autre chose que des nombres), la composition par table de
 * Cayley en un tap, la non-commutativité vécue, les inverses et le premier
 * sous-groupe (Klein).
 */

export const lessonsGroupes: Lesson[] = [
  {
    id: 'p17-symetries',
    phase: 17,
    title: 'Les huit symétries du carré',
    tagline: 'Calculer avec des mouvements — plus besoin de nombres',
    intro: ['Tourne un carré, retourne-le : huit positions possibles, pas une de plus. Et ces huit mouvements se composent comme des nombres se multiplient.'],
    course: [
      {
        kind: 'p',
        text:
          'Prends un carré, numérote ses coins, pose-le sur la table. Combien de façons de le reposer exactement sur son empreinte ? Quatre **rotations** ($\\mathbf{1}$ = ne rien faire, $r$ = quart de tour, $r^2$ = demi-tour, $r^3$ = trois quarts) et quatre **miroirs** ($h$ horizontal, $v$ vertical, $d$ et $d\'$ les deux diagonales). Huit symétries — c’est le groupe $D_4$.',
      },
      {
        kind: 'p',
        text:
          'Le coup de génie : ces mouvements se **composent**. Faire $b$ puis $a$ s’écrit $a \\circ b$ (on lit de droite à gauche, comme des fonctions) — et le résultat est toujours l’une des huit symétries. Un ensemble fermé sous la composition, avec un neutre ($\\mathbf{1}$) et des inverses : un **groupe**. Pour la première fois, tu calcules avec autre chose que des nombres.',
      },
      {
        kind: 'math',
        latex: 'r \\circ r = r^2, \\qquad r^4 = \\mathbf{1}, \\qquad h \\circ h = \\mathbf{1}',
        caption: 'Deux quarts de tour font un demi-tour ; quatre reviennent au départ ; un miroir appliqué deux fois s’efface.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Tu connais déjà deux groupes sans le savoir : les heures de l’horloge (mod 12, Phase 16) et les puissances de $i$ qui cyclent sur 4 (Phase 12). Les rotations du carré sont EXACTEMENT le même cycle à 4 crans — multiplier par $i$, c’est appliquer $r$.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'La théorie des groupes est née d’un drame : Évariste Galois, 20 ans, la griffonne la nuit précédant son duel fatal (1832) pour expliquer pourquoi l’équation de degré 5 n’a pas de formule. Son idée — étudier les symétries des solutions plutôt que les solutions — est devenue la langue de la physique moderne.',
      },
    ],
    exercises: [
      {
        id: 'sym-explore',
        prompt: 'Joue avec le carré : enchaîne rotations et miroirs, et observe que le résultat net est toujours l’une des 8 symétries.',
        start: ['Compose', 'r90', 'sH'],
        free: true,
        sim: { type: 'symmetry' },
      },
      {
        id: 'sym-rr',
        prompt: 'Compose : que font deux quarts de tour ? Tape sur la composition.',
        start: ['Equal', 'g', ['Compose', 'r90', 'r90']],
        goal: ['Equal', 'g', 'r180'],
        strictGoal: true,
        hint: 'Un quart de tour, puis un autre : les coins ont tourné d’un demi-tour.',
      },
      {
        id: 'sym-r4',
        prompt: 'Quatre quarts de tour : compose pas à pas jusqu’au résultat net.',
        start: ['Equal', 'g', ['Compose', 'r90', 'r90', 'r90', 'r90']],
        goal: ['Equal', 'g', 'idS'],
        strictGoal: true,
        hint: 'Chaque tap fusionne les deux symétries les plus à droite. r∘r = r², puis r∘r² = r³, puis r∘r³ = 𝟙.',
      },
      {
        id: 'sym-hh',
        prompt: 'Un miroir appliqué deux fois : que reste-t-il ?',
        start: ['Equal', 'g', ['Compose', 'sH', 'sH']],
        goal: ['Equal', 'g', 'idS'],
        strictGoal: true,
        hint: 'Réfléchir, puis réfléchir encore : chaque coin revient exactement à sa place.',
      },
    ],
  },
  {
    id: 'p17-cayley',
    phase: 17,
    title: 'L’ordre compte : la table de Cayley',
    tagline: 'r∘h ≠ h∘r — la non-commutativité, avec les mains',
    intro: ['Tourner puis réfléchir, ou réfléchir puis tourner : ce n’est pas pareil. Tu vas le prouver toi-même, geste par geste.'],
    course: [
      {
        kind: 'p',
        text:
          'Depuis l’école, $a·b = b·a$. Les symétries brisent cette habitude : **l’ordre des mouvements compte**. Prends le carré : miroir $h$ puis quart de tour $r$, ou quart de tour puis miroir — suis un coin, il n’atterrit pas au même endroit. La table de multiplication du groupe (sa **table de Cayley**) n’est pas symétrique.',
      },
      {
        kind: 'math',
        latex: "r \\circ h = d \\qquad \\text{mais} \\qquad h \\circ r = d'",
        caption: 'Les deux compositions donnent deux miroirs différents — les deux diagonales. Vérifie-le sur la simulation de la leçon précédente.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Tu as déjà rencontré cette surprise : les **matrices** (Phase 7, AB ≠ BA) et les mesures quantiques (Phase 14, Heisenberg). Ce n’est pas un hasard : matrices et symétries sont deux visages du même concept — les transformations. La non-commutativité EST la règle du monde ; c’est $a·b = b·a$ qui est l’exception.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Convention de lecture : $a \\circ b$ signifie « $b$ d’abord, puis $a$ » — comme $f(g(x))$ où $g$ agit en premier. Le tap réduit toujours la paire la plus à droite : celle qui agit en premier.',
      },
    ],
    exercises: [
      {
        id: 'cayley-rh',
        prompt: 'Miroir h d’abord, puis quart de tour r : compose.',
        start: ['Equal', 'g', ['Compose', 'r90', 'sH']],
        goal: ['Equal', 'g', 'sD'],
        strictGoal: true,
        hint: 'Suis le coin 1 : le miroir l’envoie en bas, la rotation le ramène sur la diagonale. Résultat : le miroir diagonal d.',
      },
      {
        id: 'cayley-hr',
        prompt: 'Maintenant l’inverse : rotation r d’abord, puis miroir h. Compare !',
        start: ['Equal', 'g', ['Compose', 'sH', 'r90']],
        goal: ['Equal', 'g', 'sA'],
        strictGoal: true,
        hint: 'Même deux gestes, autre ordre : cette fois c’est l’anti-diagonale d′. r∘h ≠ h∘r — prouvé de tes mains.',
      },
      {
        id: 'cayley-dd',
        prompt: 'Deux miroirs diagonaux à la suite : quelle rotation cela fait-il ?',
        start: ['Equal', 'g', ['Compose', 'sD', 'sA']],
        goal: ['Equal', 'g', 'r180'],
        strictGoal: true,
        hint: 'Deux miroirs font toujours une rotation — d’un angle double de celui entre les deux axes. Ici : 2·90° = 180°.',
      },
    ],
  },
  {
    id: 'p17-inverses',
    phase: 17,
    title: 'Défaire un mouvement : les inverses',
    tagline: '(a∘b)⁻¹ = b⁻¹∘a⁻¹ — chaussettes et chaussures',
    intro: ['Tout mouvement se défait : c’est la définition d’un groupe. Mais pour défaire une suite de mouvements, il faut remonter dans l’ordre inverse.'],
    course: [
      {
        kind: 'p',
        text:
          'Chaque symétrie a son **inverse** : le mouvement qui la défait. Le quart de tour $r$ se défait par trois quarts de tour ($r^{-1} = r^3$). Et un miroir ? Il se défait **lui-même** : $h^{-1} = h$ — réfléchir deux fois remet tout en place. Les quatre miroirs sont leurs propres inverses (on dit : des involutions).',
      },
      {
        kind: 'math',
        latex: '(a \\circ b)^{-1} = b^{-1} \\circ a^{-1}',
        caption: 'La règle chaussettes-chaussures : tu enfiles chaussettes PUIS chaussures ; pour te déchausser, chaussures d’abord. Ce qui a été fait en dernier se défait en premier.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Tu as vu cette règle chez les matrices : $(AB)^{-1} = B^{-1}A^{-1}$. Même formule, même raison — encore un indice que matrices et symétries parlent la même langue.',
      },
    ],
    exercises: [
      {
        id: 'inv-r',
        prompt: 'Quel mouvement défait le quart de tour ? Tape sur r⁻¹.',
        start: ['Equal', 'g', ['Inv', 'r90']],
        goal: ['Equal', 'g', 'r270'],
        strictGoal: true,
        hint: 'Pour annuler un quart de tour, continue de tourner : trois quarts de plus font un tour complet.',
      },
      {
        id: 'inv-h',
        prompt: 'Et l’inverse d’un miroir ?',
        start: ['Equal', 'g', ['Inv', 'sH']],
        goal: ['Equal', 'g', 'sH'],
        strictGoal: true,
        hint: 'Réfléchis deux fois dans le même miroir : chaque coin revient à sa place. h se défait lui-même.',
      },
      {
        id: 'inv-compose',
        prompt: 'Défais la suite « h puis r » : retourne l’ordre (tape sur l’inverse), puis calcule tout.',
        start: ['Equal', 'g', ['Inv', ['Compose', 'r90', 'sH']]],
        goal: ['Equal', 'g', 'sD'],
        strictGoal: true,
        hint: '(r∘h)⁻¹ = h⁻¹∘r⁻¹ : chaussettes-chaussures. Puis h⁻¹ = h, r⁻¹ = r³, et compose. (Et en effet : r∘h = d, qui est son propre inverse !)',
      },
    ],
  },
  {
    id: 'p17-klein',
    phase: 17,
    title: 'Des groupes dans le groupe',
    tagline: 'Le sous-groupe de Klein — et le théorème de Lagrange en embuscade',
    intro: ['Certaines familles de symétries se suffisent à elles-mêmes : composez-les entre elles, vous n’en sortirez jamais. Ce sont les sous-groupes.'],
    course: [
      {
        kind: 'p',
        text:
          'Prends seulement $\\{\\mathbf{1}, r^2, h, v\\}$ : compose n’importe lesquels, tu retombes toujours dans la famille — jamais un quart de tour, jamais une diagonale. C’est un **sous-groupe** : un groupe complet vivant à l’intérieur de $D_4$. On l’appelle le groupe de **Klein** ; c’est le groupe des symétries d’un rectangle (qui n’a pas les diagonales du carré).',
      },
      {
        kind: 'math',
        latex: 'h \\circ v = r^2',
        caption: 'Deux miroirs perpendiculaires font un demi-tour : le sous-groupe se referme sur lui-même.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Compte : les rotations forment un sous-groupe de taille 4, Klein aussi, $\\{\\mathbf{1}, h\\}$ de taille 2… toutes des tailles qui **divisent 8**. Ce n’est pas un hasard : le théorème de **Lagrange** dit que la taille d’un sous-groupe divise toujours celle du groupe. Le petit théorème de Fermat de la Phase 16 en est un corollaire direct !',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'La physique des particules est bâtie là-dessus : chaque loi de conservation (énergie, charge…) vient d’une symétrie (théorème de Noether), et le « modèle standard » est littéralement le nom d’un groupe. Comprendre $D_4$, c’est le premier pas vers la question « quelles symétries l’univers respecte-t-il ? ».',
      },
    ],
    exercises: [
      {
        id: 'klein-hv',
        prompt: 'Deux miroirs perpendiculaires : compose h et v.',
        start: ['Equal', 'g', ['Compose', 'sH', 'sV']],
        goal: ['Equal', 'g', 'r180'],
        strictGoal: true,
        hint: 'Le résultat reste dans la famille {𝟙, r², h, v} : un demi-tour.',
      },
      {
        id: 'klein-vr2',
        prompt: 'Encore dans la famille : compose v et r². Tu ne sortiras pas de Klein.',
        start: ['Equal', 'g', ['Compose', 'sV', 'r180']],
        goal: ['Equal', 'g', 'sH'],
        strictGoal: true,
        hint: 'Demi-tour puis miroir vertical : suis les coins — c’est exactement le miroir horizontal.',
      },
      {
        id: 'klein-chain',
        prompt: 'Le tour complet de la famille : h ∘ v ∘ r² — réduis tout.',
        start: ['Equal', 'g', ['Compose', 'sH', 'sV', 'r180']],
        goal: ['Equal', 'g', 'idS'],
        strictGoal: true,
        hint: 'v∘r² = h d’abord (paire de droite), puis h∘h = 𝟙 : la famille se referme sur son neutre.',
      },
    ],
  },
];
