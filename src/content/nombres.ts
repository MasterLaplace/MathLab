import type { Lesson } from './schema';

/**
 * Batch 10 : la théorie des nombres (station Y — l'entraînement olympiades
 * commence ici). Phase 16 : l'algorithme d'Euclide en taps, l'arithmétique
 * de l'horloge, les puissances qui tournent en rond (Fermat), et RSA
 * décortiqué — chiffrer et déchiffrer un message par gestes.
 */

export const lessonsNombres: Lesson[] = [
  {
    id: 'p16-euclide',
    phase: 16,
    title: 'Le pgcd : l’algorithme d’Euclide',
    tagline: 'Le plus vieil algorithme du monde — et il tient en un geste',
    intro: ['Trouver le plus grand diviseur commun de deux nombres sans factoriser ni deviner : remplacer le grand par le reste, encore et encore.'],
    course: [
      {
        kind: 'p',
        text:
          'Le **pgcd** de deux entiers est le plus grand nombre qui les divise tous les deux : c’est lui qui simplifie les fractions (48/18 = 8/3 après division par 6), lui qui synchronise les engrenages, lui qui décide si deux horloges se recroiseront. Euclide (~300 av. J.-C.) a trouvé comment le calculer **sans factoriser** — une chance, car factoriser est terriblement difficile (tu verras : c’est le coffre-fort de RSA).',
      },
      {
        kind: 'math',
        latex: '\\mathrm{pgcd}(a, b) = \\mathrm{pgcd}(b, \\; a \\bmod b)',
        caption:
          'L’idée-clé : tout diviseur commun de a et b divise aussi le reste a − q·b. Les diviseurs communs de (a, b) et de (b, reste) sont EXACTEMENT les mêmes — on rétrécit le problème sans rien perdre, jusqu’à ce que le reste tombe à zéro.',
      },
      {
        kind: 'example',
        title: 'pgcd(48, 18) en trois gestes',
        steps: [
          '48 = 2·18 + **12** : pgcd(48, 18) = pgcd(18, 12).',
          '18 = 1·12 + **6** : pgcd(18, 12) = pgcd(12, 6).',
          '12 = 2·6 + **0** : 6 divise 12 — le pgcd est **6**. Fini. Aucune factorisation, aucune intuition : une mécanique.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'C’est le plus vieil algorithme non trivial encore en usage : livre VII des *Éléments* d’Euclide, il y a 23 siècles. Ton téléphone l’exécute des milliers de fois par seconde — chaque connexion sécurisée en dépend. Donald Knuth l’appelle « le grand-père de tous les algorithmes ».',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Le pire cas d’Euclide ? Deux nombres de **Fibonacci** consécutifs : le quotient vaut toujours 1, le reste rétrécit le plus lentement possible. Le nombre d’or se cache dans la lenteur de l’algorithme (théorème de Lamé, 1844).',
      },
    ],
    exercises: [
      {
        id: 'euclide-simple',
        prompt: 'Tape sur le pgcd : chaque tap est un pas d’Euclide. Trois pas suffisent.',
        start: ['Equal', 'd', ['Gcd', 48, 18]],
        goal: ['Equal', 'd', 6],
        strictGoal: true,
        hint: '48 = 2·18 + 12, donc pgcd(48, 18) = pgcd(18, 12). Continue jusqu’à ce que le reste divise.',
      },
      {
        id: 'euclide-fibo',
        prompt: 'Le pire cas : deux nombres de Fibonacci. Compte les pas !',
        start: ['Equal', 'd', ['Gcd', 21, 13]],
        goal: ['Equal', 'd', 1],
        strictGoal: true,
        hint: '21, 13, 8, 5, 3, 2, 1 : chaque reste est encore un Fibonacci. La descente la plus lente possible.',
      },
      {
        id: 'euclide-premiers',
        prompt: 'pgcd(17, 5) : que vaut-il quand les nombres n’ont rien en commun ?',
        start: ['Equal', 'd', ['Gcd', 17, 5]],
        goal: ['Equal', 'd', 1],
        strictGoal: true,
        hint: 'pgcd = 1 : on dit que 17 et 5 sont premiers entre eux. C’est le cas le plus important pour la cryptographie.',
      },
    ],
  },
  {
    id: 'p16-horloge',
    phase: 16,
    title: 'L’arithmétique de l’horloge',
    tagline: 'mod n — quand les nombres tournent en rond',
    intro: ['Il est 15 h ; dans 20 heures il sera 11 h. Tu fais de l’arithmétique modulaire depuis toujours — voici ses règles.'],
    course: [
      {
        kind: 'p',
        text:
          'Sur une horloge, 12 = 0 : les nombres **s’enroulent**. « a mod n » est le reste de a divisé par n — la position de l’aiguille après a heures sur une horloge à n heures. Deux nombres qui laissent le même reste sont dits **congrus** : 17 ≡ 5 (mod 12). Gauss a inventé cette notation à 21 ans, et elle a réorganisé toute la théorie des nombres.',
      },
      {
        kind: 'math',
        latex: '(a + b) \\bmod n = \\big((a \\bmod n) + (b \\bmod n)\\big) \\bmod n',
        caption:
          'La règle d’or (elle vaut aussi pour ×) : on peut réduire AVANT de calculer. Pour 17·23 mod 12, inutile de calculer 391 — réduis d’abord : 5·11 = 55, puis 55 mod 12 = 7. Les petits nombres suffisent toujours.',
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Tu as déjà rencontré des nombres qui s’enroulent : les **angles** (370° = 10°, station F) et les puissances de **i** qui cyclent sur 4 (station Q). L’arithmétique modulaire est le squelette commun — un cercle discret à n crans.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Pourquoi ton anniversaire tombe-t-il un jour de semaine différent chaque année ? Parce que 365 mod 7 = 1 : l’année décale tout d’un cran. Et les années bissextiles (366 ≡ 2) sautent d’un cran de plus — c’est tout l’art du calcul du jour de Pâques, premier grand problème modulaire de l’histoire.',
      },
    ],
    exercises: [
      {
        id: 'horloge-simple',
        prompt: 'Il est minuit ; 17 heures passent. Tape pour lire l’horloge.',
        start: ['Equal', 'h', ['Mod', 17, 12]],
        goal: ['Equal', 'h', 5],
        strictGoal: true,
        hint: '17 = 1·12 + 5 : un tour complet, puis l’aiguille pointe sur 5.',
      },
      {
        id: 'horloge-produit',
        prompt: '17·23 mod 12 : réduis chaque facteur D’ABORD (tape dessus), puis calcule petit.',
        start: ['Equal', 'r', ['Mod', ['Multiply', 17, 23], 12]],
        goal: ['Equal', 'r', 7],
        strictGoal: true,
        hint: '17 ≡ 5 et 23 ≡ 11 : le produit devient 5·11 = 55, et 55 mod 12 = 7. Jamais besoin de 391.',
      },
      {
        id: 'horloge-annee',
        prompt: '365 jours, 7 jours par semaine : de combien ton anniversaire se décale-t-il ?',
        start: ['Equal', 'j', ['Mod', 365, 7]],
        goal: ['Equal', 'j', 1],
        strictGoal: true,
        hint: '365 = 52·7 + 1 : les 52 semaines s’effacent, il reste un jour de décalage.',
      },
    ],
  },
  {
    id: 'p16-fermat',
    phase: 16,
    title: 'Les puissances tournent en rond',
    tagline: 'Le petit théorème de Fermat — le moteur caché de RSA',
    intro: ['Regarde les derniers chiffres de 7, 7², 7³, 7⁴… : 7, 9, 3, 1, puis ça recommence. Les puissances modulaires cyclent — toujours.'],
    course: [
      {
        kind: 'p',
        text:
          'Sur l’horloge à n heures, il n’y a que n positions : les puissances a, a², a³… doivent forcément **repasser par les mêmes cases** — elles cyclent. Fermat (1640) a trouvé la longueur du cycle quand n est premier :',
      },
      {
        kind: 'math',
        latex: 'a^{p-1} \\equiv 1 \\pmod{p} \\qquad (p \\text{ premier}, \\; a \\text{ non multiple de } p)',
        caption:
          'Le petit théorème de Fermat : élever à la puissance p − 1 ramène toujours à 1. Exemple : 3⁴ = 81 = 16·5 + 1 ≡ 1 (mod 5). Le cycle boucle — et tout ce qui boucle se prédit.',
      },
      {
        kind: 'example',
        title: 'Le superpouvoir : des exposants géants sans effort',
        steps: [
          'Que vaut 7^{403} mod 10 ? Le cycle des puissances de 7 mod 10 est (7, 9, 3, 1), de longueur 4.',
          '403 = 4·100 + 3 : les cent tours complets s’effacent (ils valent 1), il reste 7³ ≡ 3.',
          'Un nombre à 340 chiffres réduit à un calcul de tête : c’est CE raccourci qui rend RSA praticable — et sa réciproque introuvable qui le rend sûr.',
        ],
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Fermat a griffonné ce théorème dans une lettre, « je vous enverrais la démonstration si je ne craignais d’être trop long » — son habitude légendaire. Euler l’a démontré un siècle plus tard, puis généralisé à tous les n avec sa fonction φ. C’est la version d’Euler qui chiffre tes messages.',
      },
    ],
    exercises: [
      {
        id: 'fermat-cycle',
        prompt: 'Le dernier chiffre de 7² : calcule la puissance, puis lis l’horloge à 10.',
        start: ['Equal', 'r', ['Mod', ['Power', 7, 2], 10]],
        goal: ['Equal', 'r', 9],
        strictGoal: true,
        hint: '7² = 49, et 49 mod 10 = 9 : le dernier chiffre. L’horloge à 10 heures, c’est « ne garder que le chiffre des unités ».',
      },
      {
        id: 'fermat-quatre',
        prompt: 'Le dernier chiffre de 7⁴ : le cycle boucle-t-il ?',
        start: ['Equal', 'r', ['Mod', ['Power', 7, 4], 10]],
        goal: ['Equal', 'r', 1],
        strictGoal: true,
        hint: '7⁴ = 2401 ≡ 1 : le cycle (7, 9, 3, 1) est bouclé. Toutes les puissances de 7 sont désormais prévisibles.',
      },
      {
        id: 'fermat-petit',
        prompt: 'Vérifie Fermat pour a = 3, p = 5 : calcule 3⁴ mod 5.',
        start: ['Equal', 'r', ['Mod', ['Power', 3, 4], 5]],
        goal: ['Equal', 'r', 1],
        strictGoal: true,
        hint: '3⁴ = 81 = 16·5 + 1 : le théorème tient. a^{p−1} ≡ 1, à chaque fois que p est premier.',
      },
      {
        id: 'fermat-onze',
        prompt: 'Encore lui : 2¹⁰ mod 11 (p = 11 est premier, p − 1 = 10).',
        start: ['Equal', 'r', ['Mod', ['Power', 2, 10], 11]],
        goal: ['Equal', 'r', 1],
        strictGoal: true,
        hint: '2¹⁰ = 1024 = 93·11 + 1. Mille vingt-quatre, et l’horloge répond : 1. Fermat ne rate jamais.',
      },
    ],
  },
  {
    id: 'p16-rsa',
    phase: 16,
    title: 'RSA : les maths qui gardent tes secrets',
    tagline: 'Chiffre et déchiffre un vrai message — par gestes',
    intro: ['Chaque site web « https » utilise ce que tu viens d’apprendre : des puissances sur une horloge. Voici le mécanisme complet, en petit.'],
    course: [
      {
        kind: 'p',
        text:
          'Le problème millénaire : comment échanger un secret avec quelqu’un que tu n’as **jamais rencontré** ? RSA (Rivest, Shamir, Adleman, 1977) répond avec une idée renversante : une serrure **publique** que tout le monde peut fermer, mais que seul le détenteur de la clé privée sait ouvrir.',
      },
      {
        kind: 'math',
        latex: 'c = m^e \\bmod n \\qquad\\qquad m = c^d \\bmod n',
        caption:
          'Chiffrer = élever le message m à la puissance publique e (sur l’horloge n). Déchiffrer = élever à la puissance privée d. Ça marche parce que e·d ≡ 1 modulo φ(n) : par Fermat-Euler, les deux exponentiations se défont — des opérations inverses, comme toujours dans ce parcours.',
      },
      {
        kind: 'example',
        title: 'Un RSA de poche : n = 15, e = 3, d = 3',
        steps: [
          'Clés : n = 15 = 3·5 (les facteurs restent secrets !), φ = (3−1)(5−1) = 8, et e·d = 3·3 = 9 ≡ 1 (mod 8) ✓.',
          '**Chiffrer** le message m = 2 : c = 2³ mod 15 = 8. On publie 8 sans crainte.',
          '**Déchiffrer** : m = 8³ mod 15 = 512 mod 15 = 2. Le message revient, intact. Tu vas faire les deux.',
        ],
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Toute la sécurité tient dans UNE asymétrie : multiplier 3·5 = 15 est instantané, mais retrouver 3 et 5 à partir de 15… facile ici, **infaisable** quand n a 617 chiffres. Personne n’a jamais prouvé que factoriser est difficile — la civilisation numérique repose sur une conjecture.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Trois chercheurs du GCHQ britannique (Ellis, Cocks, Williamson) avaient inventé le même système **quatre ans avant** RSA — classé secret-défense, ils n’ont rien pu dire pendant 24 ans. Cocks avait trouvé l’algorithme en une soirée, « parce qu’il n’avait rien d’autre à faire ».',
      },
    ],
    exercises: [
      {
        id: 'rsa-cle',
        prompt: 'Vérifie la paire de clés : e·d = 3·3 doit valoir 1 sur l’horloge à φ = 8.',
        start: ['Equal', 'v', ['Mod', ['Multiply', 3, 3], 8]],
        goal: ['Equal', 'v', 1],
        strictGoal: true,
        hint: '9 = 1·8 + 1 : e et d sont bien inverses modulo 8. C’est ce « 1 » qui garantit que déchiffrer défait chiffrer.',
      },
      {
        id: 'rsa-chiffre',
        prompt: 'Chiffre le message m = 2 avec la clé publique (e = 3, n = 15).',
        start: ['Equal', 'c', ['Mod', ['Power', 2, 3], 15]],
        goal: ['Equal', 'c', 8],
        strictGoal: true,
        hint: '2³ = 8, et 8 < 15 : le chiffré est 8. N’importe qui peut faire ce calcul — c’est le but d’une clé publique.',
      },
      {
        id: 'rsa-dechiffre',
        prompt: 'Déchiffre c = 8 avec la clé privée (d = 3) : le message doit revenir.',
        start: ['Equal', 'm', ['Mod', ['Power', 8, 3], 15]],
        goal: ['Equal', 'm', 2],
        strictGoal: true,
        hint: '8³ = 512 = 34·15 + 2 : le message 2 ressort intact. Tu viens d’exécuter RSA de bout en bout, à la main.',
      },
    ],
  },
  {
    id: 'p16-phi',
    phase: 16,
    title: 'Compter les étrangers : la fonction φ d’Euler',
    tagline: 'D’où vient le 8 de RSA ? φ(15) = 8, calculé par gestes',
    intro: ['Combien de nombres entre 1 et n n’ont aucun facteur commun avec n ? Cette question anodine est la clé de voûte de RSA.'],
    course: [
      {
        kind: 'p',
        text:
          'La fonction **φ d’Euler** compte les entiers de 1 à $n$ **premiers avec** $n$ (pgcd = 1). Pour $n = 15$ : 1, 2, 4, 7, 8, 11, 13, 14 — huit nombres. Ce **8**, tu l’as déjà rencontré : c’est l’horloge secrète de RSA (leçon précédente), celle sur laquelle $e·d ≡ 1$. Euler a montré que $a^{φ(n)} ≡ 1 \\pmod n$ pour tout $a$ premier avec $n$ — la généralisation du petit théorème de Fermat.',
      },
      {
        kind: 'math',
        latex: '\\varphi(p) = p - 1, \\qquad \\varphi(p^k) = p^k - p^{k-1}, \\qquad \\varphi(m\\,n) = \\varphi(m)\\,\\varphi(n) \\;\\text{si pgcd}(m,n)=1',
        caption:
          'Trois règles suffisent : un premier n’a rien à partager (p − 1) ; une puissance de p évite seulement les multiples de p ; et φ est multiplicative sur les facteurs étrangers.',
      },
      {
        kind: 'example',
        title: 'φ(12) en quatre gestes',
        steps: [
          'φ(12) = φ(4)·φ(3) : 4 et 3 sont premiers entre eux — φ se factorise.',
          'φ(4) = 4 − 2 = **2** (on retire les multiples de 2 : 2 et 4).',
          'φ(3) = 3 − 1 = **2** (3 est premier).',
          'φ(12) = 2·2 = **4** : les étrangers de 12 sont 1, 5, 7, 11.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'Pourquoi la multiplicativité ? Le **théorème des restes chinois** : modulo 12, chaque nombre se lit comme une paire (reste mod 4, reste mod 3) — être étranger à 12, c’est l’être aux deux à la fois. Les choix se multiplient.',
      },
      {
        kind: 'callout',
        tone: 'warn',
        text:
          'Le cœur de la sécurité de RSA tient ici : calculer φ(n) exige de **factoriser** n. Pour n = 15, facile. Pour un n de 600 chiffres, aucune machine au monde n’y parvient — φ est publique en théorie, incalculable en pratique.',
      },
    ],
    exercises: [
      {
        id: 'phi-premier',
        prompt: '7 est premier : que vaut φ(7) ? Tape pour déplier, puis calcule.',
        start: ['Equal', 'n', ['Phi', 7]],
        goal: ['Equal', 'n', 6],
        strictGoal: true,
        hint: 'Un nombre premier est étranger à tous les nombres avant lui : φ(7) = 7 − 1.',
      },
      {
        id: 'phi-puissance',
        prompt: 'φ(9) : parmi 1…9, seuls les multiples de 3 sont à retirer.',
        start: ['Equal', 'n', ['Phi', 9]],
        goal: ['Equal', 'n', 6],
        strictGoal: true,
        hint: 'φ(9) = 9 − 3 : on retire 3, 6 et 9. Les six autres sont étrangers à 9.',
      },
      {
        id: 'phi-douze',
        prompt: 'φ(12) : factorise d’abord (tape), puis déplie chaque morceau.',
        start: ['Equal', 'n', ['Phi', 12]],
        goal: ['Equal', 'n', 4],
        strictGoal: true,
        hint: 'φ(12) = φ(4)·φ(3) = (4−2)·(3−1) = 2·2 = 4.',
      },
      {
        id: 'phi-rsa',
        prompt: 'Le secret de RSA : calcule φ(15) et retrouve le 8 de la leçon précédente.',
        start: ['Equal', 'n', ['Phi', 15]],
        goal: ['Equal', 'n', 8],
        strictGoal: true,
        hint: 'φ(15) = φ(3)·φ(5) = 2·4 = 8 : voilà l’horloge secrète sur laquelle e·d ≡ 1. Qui sait factoriser 15 sait déchiffrer.',
      },
    ],
  },
  {
    id: 'p16-inverse',
    phase: 16,
    title: 'L’inverse modulaire : diviser sur l’horloge',
    tagline: 'a·a⁻¹ ≡ 1 — le théorème de Bézout au travail',
    intro: ['Sur l’horloge, on ne divise pas : on multiplie par l’inverse. Encore faut-il qu’il existe — et c’est Bézout qui décide.'],
    course: [
      {
        kind: 'p',
        text:
          'Diviser par $a$ modulo $n$, c’est multiplier par le nombre $a^{-1}$ tel que $a·a^{-1} ≡ 1 \\pmod n$. Il n’existe **que si** $\\mathrm{pgcd}(a, n) = 1$ — c’est le théorème de **Bézout** : pgcd(a, n) = 1 équivaut à l’existence d’entiers $u, v$ avec $a·u + n·v = 1$… et modulo $n$, cette égalité se lit $a·u ≡ 1$ : le $u$ de Bézout EST l’inverse.',
      },
      {
        kind: 'example',
        title: 'Bézout à la main : l’inverse de 5 modulo 21',
        steps: [
          'Euclide descend : 21 = 4·5 + 1 — le reste 1 arrive dès le premier pas.',
          'On remonte : 1 = 21 − 4·5.',
          'Modulo 21, le terme 21 disparaît : 1 ≡ −4·5, donc 5⁻¹ ≡ −4 ≡ **17** (mod 21).',
          'Vérification (à toi de la faire par gestes) : 5·17 = 85 = 4·21 + 1 ✓.',
        ],
      },
      {
        kind: 'callout',
        tone: 'idea',
        text:
          'C’est exactement ainsi que la clé privée de RSA est fabriquée : $d = e^{-1}$ modulo φ(n), calculé en remontant Euclide. Sans Bézout, pas de clé privée — sans Euclide, pas de Bézout.',
      },
      {
        kind: 'callout',
        tone: 'story',
        text:
          'Le chiffre « affine » des espions du XIXᵉ siècle chiffrait chaque lettre par x ↦ a·x + b mod 26. Pour déchiffrer, il faut a⁻¹ mod 26 — donc a étranger à 26. Choisir a = 13 (pgcd 13) rendait des lettres indistinguables : message détruit, agent grillé.',
      },
    ],
    exercises: [
      {
        id: 'inv-verifie',
        prompt: 'Vérifie que 17 est bien l’inverse de 5 modulo 21 : calcule 5·17 mod 21.',
        start: ['Equal', 'v', ['Mod', ['Multiply', 5, 17], 21]],
        goal: ['Equal', 'v', 1],
        strictGoal: true,
        hint: '5·17 = 85, puis 85 = 4·21 + 1 : reste 1. Diviser par 5, modulo 21, c’est multiplier par 17.',
      },
      {
        id: 'inv-cesar',
        prompt: 'Le chiffre affine : montre que 9 défait la multiplication par 3, modulo 26.',
        start: ['Equal', 'v', ['Mod', ['Multiply', 3, 9], 26]],
        goal: ['Equal', 'v', 1],
        strictGoal: true,
        hint: '3·9 = 27 = 1·26 + 1 : reste 1. Chaque lettre chiffrée ×3 se déchiffre ×9.',
      },
      {
        id: 'inv-onze',
        prompt: 'Trouvé par Bézout : 7⁻¹ ≡ 8 (mod 11). Vérifie par gestes.',
        start: ['Equal', 'v', ['Mod', ['Multiply', 7, 8], 11]],
        goal: ['Equal', 'v', 1],
        strictGoal: true,
        hint: '56 = 5·11 + 1 : reste 1. Bézout donne 7·8 − 5·11 = 1 — l’identité entière derrière la congruence.',
      },
    ],
  },
];
