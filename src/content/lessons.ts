import type { Exercise, Lesson } from './schema';
import { lessonsPhases6to9 } from './phases678';
import { lessonsComplements } from './complements';
import { lessonsPhase11 } from './phase11';
import { lessonsPhase12 } from './phase12';

/** Entier aléatoire dans [min, max]. */
function rand(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Contenu Phases 1–2 du plan d'apprentissage : de l'équilibre des opérations
 * inverses à l'algèbre de la balance, jusqu'aux puissances et logarithmes.
 *
 * Gestes disponibles :
 * - glisser un terme/facteur de l'autre côté du « = »
 * - appuyer sur un calcul numérique pour l'effectuer
 * - glisser un terme sur son opposé pour les annuler
 * - glisser un facteur du numérateur sur le dénominateur pour simplifier
 * - appuyer sur un carré / une exponentielle pour appliquer l'inverse aux deux côtés
 */
const lessonsPhases1to5: Lesson[] = [
  {
    id: 'p1-equilibre-addition',
    phase: 1,
    title: "L'équilibre : addition et soustraction",
    tagline: 'Le + annule le −, et réciproquement',
    intro: [
      "Une équation est une balance en équilibre parfait. Ce qu'on fait à gauche, on doit le faire à droite — sinon la balance penche.",
      "Plutôt que de « soustraire des deux côtés », tu peux voir la même chose comme un geste : quand un terme traverse le signe =, il change de signe. Un +3 devient −3, un −5 devient +5. C'est la même opération, vue comme un mouvement.",
      'À toi : fais glisser les termes pour isoler x, puis appuie sur les calculs pour les effectuer.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole x (glisse le 3 de l’autre côté, puis appuie sur le calcul).',
        start: ['Equal', ['Add', 'x', 3], 7],
        goal: ['Equal', 'x', 4],
        hint: 'Attrape le 3 et dépose-le sur le 7. Il traversera le = en changeant de signe.',
      },
      {
        id: 'e2',
        prompt: 'Isole x. Attention au signe !',
        start: ['Equal', ['Add', 'x', -5], 2],
        goal: ['Equal', 'x', 7],
        hint: 'Le −5 devient +5 en traversant le signe =.',
      },
      {
        id: 'e3',
        prompt: 'Isole x. Le terme peut venir de la droite aussi.',
        start: ['Equal', 10, ['Add', 'x', 4]],
        goal: ['Equal', 6, 'x'],
        hint: 'Glisse le 4 vers la gauche : il devient −4.',
      },
    ],
    generator: (): Exercise => {
      const x0 = rand(2, 15);
      const b = rand(1, 12) * (Math.random() < 0.4 ? -1 : 1);
      return {
        id: `gen-${Date.now()}`,
        prompt: 'Exercice bonus : isole x.',
        start: ['Equal', ['Add', 'x', b], x0 + b],
        goal: ['Equal', 'x', x0],
        hint: `Le ${b} traverse le = en changeant de signe.`,
      };
    },
  },
  {
    id: 'p1-multiplication-division',
    phase: 1,
    title: "L'équilibre : multiplication et division",
    tagline: 'Le × annule le ÷, et réciproquement',
    intro: [
      "Même logique que pour l'addition : la multiplication et la division sont deux faces de la même pièce. Diviser par 3, c'est multiplier par un tiers.",
      'Quand un facteur traverse le signe =, il passe « de l’autre côté de la barre » : une multiplication devient une division, et inversement.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole x (glisse le 3 de l’autre côté).',
        start: ['Equal', ['Multiply', 3, 'x'], 12],
        goal: ['Equal', 'x', 4],
        hint: 'Le facteur 3 devient une division : 12 ÷ 3.',
      },
      {
        id: 'e2',
        prompt: 'Isole x : le diviseur change aussi de côté.',
        start: ['Equal', ['Divide', 'x', 4], 2],
        goal: ['Equal', 'x', 8],
        hint: 'Le 4 sous la barre devient une multiplication en traversant.',
      },
      {
        id: 'e3',
        prompt: 'Deux étapes : d’abord le +1, puis le 5.',
        start: ['Equal', ['Add', ['Multiply', 5, 'x'], 1], 16],
        goal: ['Equal', 'x', 3],
        hint: 'Commence par glisser le 1 : on « déshabille » l’équation de l’extérieur vers l’intérieur.',
      },
    ],
    generator: (): Exercise => {
      const a = rand(2, 9);
      const x0 = rand(2, 9);
      return {
        id: `gen-${Date.now()}`,
        prompt: 'Exercice bonus : isole x.',
        start: ['Equal', ['Multiply', a, 'x'], a * x0],
        goal: ['Equal', 'x', x0],
        hint: `Le facteur ${a} traverse et devient ÷${a}.`,
      };
    },
  },
  {
    id: 'p1-annulations',
    phase: 1,
    title: 'Les annulations',
    tagline: 'Un nombre et son opposé disparaissent ensemble',
    intro: [
      'Le cœur des mathématiques est la symétrie : chaque opération possède un inverse exact qui la défait.',
      'Quand un terme rencontre son opposé dans une somme, leur somme vaut 0 : ils s’annulent. Quand un même facteur apparaît en haut et en bas d’une fraction, il se simplifie : leur quotient vaut 1.',
      'Glisse un élément sur son inverse pour les faire disparaître.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Fais disparaître ce qui s’annule pour ne garder que x.',
        start: ['Add', 'x', 5, -5],
        goal: 'x',
        hint: 'Glisse le 5 sur le −5 : +5 − 5 = 0.',
      },
      {
        id: 'e2',
        prompt: 'Simplifie la fraction.',
        start: ['Divide', ['Multiply', 2, 'x'], 2],
        goal: 'x',
        hint: 'Glisse le 2 du haut sur le 2 du bas : ils se simplifient.',
      },
      {
        id: 'e3',
        prompt: 'Élimine l’élément neutre (appuie dessus).',
        start: ['Multiply', 'x', 1],
        goal: 'x',
        hint: 'Multiplier par 1 ne change rien : appuie sur le 1.',
      },
    ],
  },
  {
    id: 'p2-balance-algebrique',
    phase: 2,
    title: 'La balance algébrique',
    tagline: 'Déshabiller une équation, étape par étape',
    intro: [
      "Pour isoler x, on défait les opérations dans l'ordre inverse de leur construction : d'abord ce qui est le plus « extérieur » (les additions), puis les multiplications.",
      "C'est exactement comme retirer des couches de vêtements : la dernière enfilée est la première retirée.",
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Le grand classique : isole x en deux transpositions.',
        start: ['Equal', ['Add', ['Multiply', 2, 'x'], 3], 11],
        goal: ['Equal', 'x', 4],
        hint: 'D’abord le 3 (il devient −3), ensuite le 2 (il devient ÷2).',
      },
      {
        id: 'e2',
        prompt: 'Même logique, autres nombres.',
        start: ['Equal', ['Add', ['Multiply', 4, 'x'], -6], 10],
        goal: ['Equal', 'x', 4],
        hint: 'Le −6 devient +6 en traversant.',
      },
      {
        id: 'e3',
        prompt: 'Avec une fraction cette fois.',
        start: ['Equal', ['Add', ['Divide', 'x', 3], 2], 6],
        goal: ['Equal', 'x', 12],
        hint: 'Le 2 d’abord, puis le 3 sous la barre (il devient ×3).',
      },
    ],
    generator: (): Exercise => {
      const a = rand(2, 9);
      const x0 = rand(2, 9);
      const b = rand(1, 12) * (Math.random() < 0.4 ? -1 : 1);
      return {
        id: `gen-${Date.now()}`,
        prompt: 'Exercice bonus : isole x en deux transpositions.',
        start: ['Equal', ['Add', ['Multiply', a, 'x'], b], a * x0 + b],
        goal: ['Equal', 'x', x0],
        hint: 'Le terme seul d’abord, puis le facteur.',
      };
    },
  },
  {
    id: 'p2-distribution',
    phase: 2,
    title: 'Distribuer et factoriser',
    tagline: 'Étaler un produit, regrouper un facteur commun',
    intro: [
      'La multiplication se distribue sur l’addition : 2(x + 3) = 2x + 2·3. C’est une seule règle, mais elle se lit dans les deux sens.',
      'De gauche à droite, on « étale » (distribution). De droite à gauche, on « met en évidence » le facteur commun (factorisation). Deux gestes inverses, comme toujours.',
      'Appuie sur un produit pour le distribuer ; glisse un terme sur un autre pour factoriser leur facteur commun.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Distribue le 2, puis calcule 2·3.',
        start: ['Multiply', 2, ['Add', 'x', 3]],
        goal: ['Add', ['Multiply', 2, 'x'], 6],
        hint: 'Appuie sur le produit tout entier pour l’étaler.',
      },
      {
        id: 'e2',
        prompt: 'Résous en distribuant d’abord.',
        start: ['Equal', ['Multiply', 2, ['Add', 'x', 3]], 10],
        goal: ['Equal', 'x', 2],
        hint: 'Distribue, calcule 2·3, puis les gestes habituels : le 6 traverse, puis le 2.',
      },
      {
        id: 'e3',
        prompt: 'Factorise : glisse 2x sur 2y.',
        start: ['Add', ['Multiply', 2, 'x'], ['Multiply', 2, 'y']],
        goal: ['Multiply', 2, ['Add', 'x', 'y']],
        hint: 'Les deux termes partagent le facteur 2 : en les rapprochant, il se met en évidence.',
      },
    ],
  },
  {
    id: 'p2-fractions',
    phase: 2,
    title: 'L’addition de fractions',
    tagline: 'Le même dénominateur, sinon on le fabrique',
    intro: [
      'On ne peut additionner que des choses comparables : des cinquièmes avec des cinquièmes. Si les dénominateurs diffèrent, on les met au même dénominateur — en multipliant chaque fraction par 1 déguisé (d/d).',
      'Glisse une fraction sur l’autre pour les additionner.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Même dénominateur : additionne les deux fractions.',
        start: ['Add', ['Divide', 'x', 5], ['Divide', 2, 5]],
        goal: ['Divide', ['Add', 'x', 2], 5],
        hint: 'Glisse une fraction sur l’autre : les numérateurs s’additionnent.',
      },
      {
        id: 'e2',
        prompt: 'Dénominateurs différents : additionne, puis calcule pas à pas.',
        start: ['Add', ['Divide', 1, 2], ['Divide', 1, 3]],
        goal: ['Divide', 5, 6],
        hint: 'Après la fusion, calcule le numérateur (1·3 + 1·2) et le dénominateur (2·3). 5/6 est déjà une forme exacte parfaite.',
      },
      {
        id: 'e3',
        prompt: 'Résous l’équation avec une fraction des deux côtés du geste.',
        start: ['Equal', ['Divide', 'x', 2], ['Divide', 3, 4]],
        goal: ['Equal', 'x', 1.5],
        hint: 'Le 2 sous le x traverse et devient ×2, puis calcule.',
      },
    ],
  },
  {
    id: 'p2-trigo',
    phase: 2,
    title: 'Trigonométrie : retrouver l’angle',
    tagline: 'arcsin annule sin, comme la racine annule le carré',
    intro: [
      'Le sinus transforme un angle en un rapport de longueurs (côté opposé sur hypoténuse). Et comme toute opération, il a son inverse : arcsin transforme le rapport en angle.',
      'C’est exactement le même schéma que carré/racine ou exp/ln : une fonction et sa réciproque. Un seul geste à apprendre, trois fonctions à débloquer.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Retrouve l’angle : sin(x) = 0,5 (le résultat reste exact).',
        start: ['Equal', ['Sin', 'x'], 0.5],
        goal: ['Equal', 'x', ['Arcsin', 0.5]],
        hint: 'Appuie sur sin(x) : arcsin s’applique aux deux côtés.',
      },
      {
        id: 'e2',
        prompt: 'Même geste avec le cosinus.',
        start: ['Equal', ['Cos', 'x'], 0.5],
        goal: ['Equal', 'x', ['Arccos', 0.5]],
        hint: 'arccos annule cos.',
      },
      {
        id: 'e3',
        prompt: 'Une pente de 45° : tan(x) = 1.',
        start: ['Equal', ['Tan', 'x'], 1],
        goal: ['Equal', 'x', ['Arctan', 1]],
        hint: 'arctan annule tan. (arctan 1 = π/4, soit 45°.)',
      },
    ],
  },
  {
    id: 'p2-termes-des-deux-cotes',
    phase: 2,
    title: 'Des x des deux côtés',
    tagline: 'Rassembler les inconnues d’un même côté',
    intro: [
      "Quand l'inconnue apparaît des deux côtés, la stratégie est de rassembler tous les x d'un côté et tous les nombres de l'autre.",
      'Un terme en x se transpose exactement comme un nombre : il change de signe en traversant le signe =.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Rassemble les x à gauche et les nombres à droite, puis isole x.',
        start: ['Equal', ['Add', ['Multiply', 5, 'x'], 2], ['Add', ['Multiply', 3, 'x'], 10]],
        goal: ['Equal', 'x', 4],
        hint: 'Glisse le 3x vers la gauche (il devient −3x)… mais il faudra ensuite savoir que 5x − 3x = 2x : appuie sur le calcul une fois les x rassemblés.',
      },
    ],
  },
  {
    id: 'p2-puissances-racines',
    phase: 2,
    title: 'Puissances et racines',
    tagline: 'La racine carrée annule le carré',
    intro: [
      'Élever au carré et prendre la racine carrée sont deux opérations inverses : √(x²) = x (pour x positif).',
      "Sur une équation, appuyer sur un carré applique la racine carrée aux deux côtés d'un coup — c'est la même règle de la balance.",
      'Note pour plus tard : un carré a en réalité deux antécédents (x et −x). On y reviendra ; ici on travaille avec des valeurs positives.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole x (appuie sur le carré).',
        start: ['Equal', ['Power', 'x', 2], 16],
        goal: ['Equal', 'x', 4],
        hint: 'Appuie sur x² : la racine s’applique des deux côtés. Puis calcule √16.',
      },
      {
        id: 'e2',
        prompt: 'Deux étapes : d’abord dégager le carré, ensuite l’annuler.',
        start: ['Equal', ['Add', ['Power', 'x', 2], 9], 25],
        goal: ['Equal', 'x', 4],
        hint: 'Le 9 d’abord (il devient −9), puis le carré.',
      },
      {
        id: 'e3',
        prompt: 'La solution complète : x² = 9 a DEUX solutions. Choisis la racine « ± » dans le menu.',
        start: ['Equal', ['Power', 'x', 2], 9],
        goal: ['Equal', 'x', ['PlusMinus', 3]],
        hint: 'Appuie sur x² : un menu propose la racine positive ou la version complète ±. 3 et −3 ont le même carré !',
      },
    ],
  },
  {
    id: 'p2-exponentielle-log',
    phase: 2,
    title: 'Exponentielle et logarithme',
    tagline: 'ln annule exp — la clé des croissances',
    intro: [
      "L'exponentielle transforme les additions en multiplications ; le logarithme fait le chemin inverse. Ce duo gouverne les croissances de populations, la radioactivité, les décibels…",
      'Comme pour le carré et la racine : appuyer sur une exponentielle applique ln aux deux côtés.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole x (le résultat restera sous forme exacte ln 5).',
        start: ['Equal', ['Exp', 'x'], 5],
        goal: ['Equal', 'x', ['Ln', 5]],
        hint: 'Appuie sur eˣ : ln s’applique des deux côtés, et ln(eˣ) = x.',
      },
      {
        id: 'e2',
        prompt: 'Dégage d’abord l’exponentielle, puis annule-la.',
        start: ['Equal', ['Multiply', 2, ['Exp', 'x']], 10],
        goal: ['Equal', 'x', ['Ln', 5]],
        hint: 'Le 2 d’abord (10 ÷ 2 = 5), puis l’exponentielle. Le résultat exact est ln 5.',
      },
    ],
  },
  {
    id: 'p3-vitesse',
    phase: 3,
    title: 'La vitesse : d = v·t',
    tagline: 'Ta première formule de physique, en mouvement',
    intro: [
      'Voici le moment où les maths deviennent de la physique. La distance parcourue est le produit de la vitesse par le temps : d = v·t. Ce n’est pas une formule à apprendre par cœur — c’est une multiplication comme celles que tu manipules depuis le début.',
      'Regarde le mobile en dessous de l’équation : il parcourt réellement la distance dans le temps indiqué. En isolant v, tu calcules sa vitesse — celle que tu observes à l’écran.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole v dans la formule générale (glisse le t).',
        start: ['Equal', 'd', ['Multiply', 'v', 't']],
        goal: ['Equal', ['Divide', 'd', 't'], 'v'],
        hint: 'Le facteur t traverse le = et devient une division : v = d ÷ t.',
        sim: { type: 'kinematics', d: 120, t: 2 },
      },
      {
        id: 'e2',
        prompt: 'Ce mobile parcourt 120 m en 2 s. Quelle est sa vitesse ?',
        start: ['Equal', 120, ['Multiply', 'v', 2]],
        goal: ['Equal', 'v', 60],
        hint: 'Même geste qu’avec la formule générale : le 2 traverse et devient ÷2.',
        sim: { type: 'kinematics', d: 120, t: 2 },
      },
      {
        id: 'e3',
        prompt: 'Il roule à 50 m/s et parcourt 150 m. Combien de temps met-il ?',
        start: ['Equal', 150, ['Multiply', 50, 't']],
        goal: ['Equal', 't', 3],
        hint: 'Cette fois c’est le 50 qui traverse.',
        sim: { type: 'kinematics', d: 150, t: 3 },
      },
    ],
    generator: (): Exercise => {
      const t = rand(2, 6);
      const v = rand(4, 20) * 5;
      return {
        id: `gen-${Date.now()}`,
        prompt: `Exercice bonus : ce mobile parcourt ${v * t} m en ${t} s. Quelle est sa vitesse ?`,
        start: ['Equal', v * t, ['Multiply', 'v', t]],
        goal: ['Equal', 'v', v],
        hint: `Le ${t} traverse et devient une division.`,
        sim: { type: 'kinematics', d: v * t, t },
      };
    },
  },
  {
    id: 'p3-force',
    phase: 3,
    title: 'La force : F = m·a',
    tagline: 'La deuxième loi de Newton, un simple produit',
    intro: [
      'La loi la plus célèbre de la mécanique, F = m·a, a exactement la même forme que d = v·t : un produit de deux grandeurs. Si tu sais isoler v, tu sais isoler a.',
      'C’est ça, le super-pouvoir de l’algèbre : une seule structure mathématique, des dizaines de lois physiques.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole l’accélération a dans la loi de Newton.',
        start: ['Equal', 'F', ['Multiply', 'm', 'a']],
        goal: ['Equal', ['Divide', 'F', 'm'], 'a'],
        hint: 'La masse m traverse le = et devient une division.',
      },
      {
        id: 'e2',
        prompt: 'Une force de 12 N pousse une masse de 4 kg. Quelle accélération ?',
        start: ['Equal', 12, ['Multiply', 4, 'a']],
        goal: ['Equal', 'a', 3],
        hint: 'a = 12 ÷ 4. Le geste est toujours le même.',
      },
    ],
  },
  {
    id: 'p3-energie',
    phase: 3,
    title: 'L’énergie cinétique : E = mv²/2',
    tagline: 'Trois gestes appris séparément, une vraie formule',
    intro: [
      'L’énergie d’un corps en mouvement vaut E = m·v²/2. Pour retrouver la vitesse à partir de l’énergie, il faut enchaîner tout ce que tu as appris : transposer le 2, transposer le m, puis annuler le carré avec la racine.',
      'C’est exactement comme ça qu’un physicien « lit » une formule : une suite d’opérations inverses à défaire, de l’extérieur vers l’intérieur.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole v dans la formule générale (trois étapes).',
        start: ['Equal', 'E', ['Divide', ['Multiply', 'm', ['Power', 'v', 2]], 2]],
        goal: ['Equal', ['Sqrt', ['Divide', ['Multiply', 'E', 2], 'm']], 'v'],
        hint: 'Le 2 du dessous d’abord (il devient ×2), puis le m, puis appuie sur le carré.',
      },
      {
        id: 'e2',
        prompt: 'E = 100 J, m = 2 kg : quelle est la vitesse ?',
        start: ['Equal', ['Divide', ['Multiply', 2, ['Power', 'v', 2]], 2], 100],
        goal: ['Equal', 'v', 10],
        hint: 'Dégage le 2 du bas, calcule, dégage le 2 du haut, calcule, puis la racine.',
      },
    ],
  },
  {
    id: 'p3-chute-libre',
    phase: 3,
    title: 'La chute libre : h = gt²/2',
    tagline: 'Même squelette que l’énergie cinétique',
    intro: [
      'La hauteur de chute vaut h = g·t²/2. Regarde bien : c’est exactement la même structure que E = m·v²/2. Un physicien reconnaît le squelette avant les lettres.',
      'Puisque la structure est la même, les gestes pour isoler t sont les mêmes que pour isoler v. C’est l’analogie structurelle : ton intuition se transfère d’une loi à l’autre gratuitement.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Isole t dans la formule générale.',
        start: ['Equal', 'h', ['Divide', ['Multiply', 'g', ['Power', 't', 2]], 2]],
        goal: ['Equal', ['Sqrt', ['Divide', ['Multiply', 'h', 2], 'g']], 't'],
        hint: 'Le 2 du bas, puis le g, puis la racine sur t². Comme pour l’énergie cinétique.',
      },
      {
        id: 'e2',
        prompt: 'Un objet tombe de 20 m (g = 10). Combien de temps dure la chute ?',
        start: ['Equal', 20, ['Divide', ['Multiply', 10, ['Power', 't', 2]], 2]],
        goal: ['Equal', 't', 2],
        hint: 'Dégage le 2, calcule 20×2, dégage le 10, calcule, puis la racine (choisis la racine positive : un temps est positif).',
      },
    ],
  },
  {
    id: 'p4-derivee-pente',
    phase: 4,
    title: 'La dérivée : une machine à pentes',
    tagline: 'Le taux de variation instantané, vu et touché',
    intro: [
      'Jusqu’ici tu as manipulé des états figés. Le calcul infinitésimal étudie le changement : à quelle vitesse une courbe monte-t-elle en un point précis ?',
      'La réponse est la pente de la tangente en ce point. Pour la parabole y = x², cette pente vaut toujours 2x : c’est la dérivée de x². Une fonction qui, pour chaque x, te donne la pente.',
      'Commence par explorer la courbe ci-dessous, puis mets la règle en pratique.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Fais glisser le point le long de la courbe et observe la pente. Vérifie : elle vaut toujours 2x.',
        start: ['Equal', 'y', ['Power', 'x', 2]],
        free: true,
        sim: { type: 'tangent' },
      },
      {
        id: 'e2',
        prompt: 'La pente de y = x² au point x = 3 : calcule m = 2·3.',
        start: ['Equal', 'm', ['Multiply', 2, 3]],
        goal: ['Equal', 'm', 6],
        hint: 'Appuie sur le produit 2·3 pour le calculer.',
      },
      {
        id: 'e3',
        prompt: 'En quel x la pente de y = x² vaut-elle 10 ? Résous 2x = 10.',
        start: ['Equal', ['Multiply', 2, 'x'], 10],
        goal: ['Equal', 'x', 5],
        hint: 'Le même geste que toujours : le 2 traverse et devient ÷2. La dérivée s’utilise avec l’algèbre que tu connais déjà.',
      },
    ],
  },
  {
    id: 'p4-integrale-aire',
    phase: 4,
    title: 'L’intégrale : accumuler',
    tagline: 'L’aire sous la courbe, l’inverse de la dérivée',
    intro: [
      'Si la dérivée découpe (quelle est la pente ici ?), l’intégrale accumule (combien s’est-il entassé jusqu’ici ?). L’aire sous la courbe de la vitesse, c’est la distance parcourue.',
      'Explore : l’aire sous y = x jusqu’à b vaut toujours b²/2. Et la dérivée de b²/2 est… b. Les deux opérations se défont l’une l’autre : c’est le théorème fondamental de l’analyse, le même jeu d’inverses que + et −.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Fais glisser la borne et observe l’aire accumulée. Vérifie : elle vaut b²/2.',
        start: ['Equal', 'A', ['Divide', ['Power', 'b', 2], 2]],
        free: true,
        sim: { type: 'area' },
      },
      {
        id: 'e2',
        prompt: 'Calcule l’aire accumulée jusqu’à b = 4 : A = 4²/2.',
        start: ['Equal', 'A', ['Divide', ['Power', 4, 2], 2]],
        goal: ['Equal', 'A', 8],
        hint: 'Appuie sur 4² d’abord, puis sur la division.',
      },
    ],
  },
  {
    id: 'p5-champs',
    phase: 5,
    title: 'Les champs de vecteurs',
    tagline: 'Sources et tourbillons : divergence et rotationnel',
    intro: [
      'Un champ de vecteurs attache une flèche à chaque point de l’espace : le vent, un courant, un champ électrique. Deux questions suffisent à en décrire la topologie locale :',
      'Est-ce que ça jaillit ou s’engouffre ici ? (la divergence). Est-ce que ça tourne autour d’ici ? (le rotationnel).',
      'Explore les trois champs : la source (divergence pure, comme le champ électrique d’une charge), le tourbillon (rotationnel pur, comme le champ magnétique autour d’un fil), et l’uniforme (ni l’un ni l’autre). Les particules suivent le champ : regarde-les vivre.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Observe les trois champs. Repère : où ça diverge, où ça tourne, où rien ne change.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'vector-field' },
      },
    ],
  },
  {
    id: 'p5-oscillateur',
    phase: 5,
    title: 'L’équation différentielle : l’oscillateur',
    tagline: 'x″ = −(k/m)·x — la règle locale qui écrit une sinusoïde',
    intro: [
      'Une équation différentielle ne donne pas la réponse : elle donne la règle locale du changement. Pour un ressort : « le rappel est proportionnel à l’écart » — x″ = −(k/m)·x. C’est tout.',
      'La simulation applique bêtement cette règle, pas à pas (méthode d’Euler). Et pourtant une sinusoïde parfaite émerge, de pulsation ω = √(k/m). Résoudre une EDO, c’est deviner l’histoire entière à partir de la règle locale.',
      'Joue avec k et m, puis retrouve ω par le calcul.',
    ],
    exercises: [
      {
        id: 'e1',
        prompt: 'Règle k et m. Vérifie : plus raide → plus rapide ; plus lourd → plus lent.',
        start: ['Equal', 0, 0],
        free: true,
        sim: { type: 'spring' },
      },
      {
        id: 'e2',
        prompt: 'La pulsation vérifie ω² = k/m. Isole ω.',
        start: ['Equal', ['Power', 'omega', 2], ['Divide', 'k', 'm']],
        goal: ['Equal', 'omega', ['Sqrt', ['Divide', 'k', 'm']]],
        hint: 'Appuie sur ω² : la racine s’applique aux deux côtés (ω est positif, prends la racine positive).',
      },
      {
        id: 'e3',
        prompt: 'k = 9, m = 1 : calcule ω.',
        start: ['Equal', ['Power', 'omega', 2], ['Divide', 9, 1]],
        goal: ['Equal', 'omega', 3],
        hint: 'Simplifie la division d’abord (÷1 ne change rien), puis la racine, puis calcule.',
      },
    ],
  },
];

export const lessons: Lesson[] = [
  ...lessonsPhases1to5,
  ...lessonsPhases6to9,
  ...lessonsComplements,
  ...lessonsPhase11,
  ...lessonsPhase12,
];

export function lessonById(id: string): Lesson | undefined {
  return lessons.find((l) => l.id === id);
}
