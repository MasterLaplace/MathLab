# ROADMAP — De A à Z : de l'arithmétique au niveau « Humanity's Last Exam »

Ce document est la carte complète du parcours d'apprentissage visé par MathLab, et des
fondations techniques nécessaires à chaque étape. Le principe directeur ne change jamais :
**on ne lit pas les maths, on les manipule** — chaque concept arrive avec un geste, un
visuel (1D/2D/3D, voire 3D+temps pour le « 4D ») et une histoire, avant tout formalisme.

Le point d'arrivée (« Z ») est le niveau des questions du
[Humanity's Last Exam](https://agi.safe.ai/) : des problèmes de niveau expert/recherche,
multi-domaines, qui exigent à la fois la technique et l'intuition transversale. La roadmap
est volontairement gigantesque : c'est un parcours de plusieurs années, découpé en stations
où chacune s'appuie sur les précédentes (apprentissage en spirale : les mêmes idées —
opération inverse, équilibre, superposition — reviennent à chaque étage avec plus de
profondeur).

**Légende** : ✅ fait · 🔨 en cours (batch actuel) · ⏳ à venir.

---

## Bloc 1 — Fondations (école → collège)

### A. Les nombres et les opérations inverses ✅
- **Contenu** : addition/soustraction, multiplication/division, éléments neutres, annulations.
- **Geste** : glisser un terme à travers `=`, taper une paire `+a −a` pour l'annuler.
- **Visuels** : équation manipulable (1D), graphe des deux côtés (2D).
- **Reste à enrichir** : droite numérique animée (déplacement = vecteur 1D), nombres relatifs racontés.

### B. La balance algébrique ✅
- **Contenu** : variables, isoler x, distribution, factorisation, fractions.
- **Geste** : tout le moteur de règles (move-term, move-factor, distribute, factor-common, add-fractions).
- **Reste à enrichir** : double distribution (a+b)(c+d), identités remarquables par gestes.

### C. Puissances, racines, exponentielles, logarithmes ✅
- **Contenu** : x²↔√, xⁿ↔ⁿ√ (avec ±), bˣ↔log_b, e↔ln, « le log transforme × en + ».
- **Reste à enrichir** : leçon dédiée aux règles des log (log(ab)=log a+log b par gestes), échelles log (décibels, Richter).

### D. Trigonométrie ✅
- **Contenu fait** : sin/cos/tan ↔ arcsin/arccos/arctan par gestes.
- **Fait aussi** : le cercle unité interactif (angle à la main, sin/cos déroulés en ondes, sin²+cos²=1 par gestes).
- **⏳ Reste** : Pythagore et Thalès manipulables, décomposition de forces sur plan incliné.

### E. Fonctions et graphes ✅ (partiel)
- **Contenu fait** : graphe lié à l'équation (l'intersection = solution, immobile pendant la manipulation).
- **⏳ Reste** : transformations de fonctions par gestes (glisser la courbe = f(x−a), l'étirer = k·f(x)), lecture de graphes, fonctions réciproques comme miroir y=x.

### F. Les maths en action : la physique ✅
- **Contenu** : d=v·t (mobile animé), F=ma, Ec=½mv², chute libre.
- **Reste à enrichir** : projectiles 2D (le geste de décomposition trigo de D branché sur une simulation balistique).

### G. Les dérivées ✅ (partiel)
- **Contenu fait** : pente de la tangente explorée à la main (x²→2x).
- **Fait aussi** : la dérivation **par gestes** (`rules/derive.ts` : constante, xⁿ, linéarité, sortie des constantes, sin/cos/exp/ln, règle du produit — chaque règle est un tap), et la **règle de la chaîne** (sin/cos/exp/ln/uⁿ composés : la dérivée intérieure reste en attente dans un nouveau d/dx — leçon `p4-chaine`).
- **⏳ Reste** : limites racontées (Zénon, vitesse instantanée), notation de Leibniz manipulable (dx qui « se simplifie »).

### H. Les intégrales ✅ (partiel)
- **Contenu fait** : aire sous la courbe explorée (b²/2), sommes de Riemann interactives (n → ∞ au curseur), intégration **par gestes** (`rules/integrate.ts` : constante, xⁿ, linéarité, sin/cos/exp, 1/x → ln) et **théorème fondamental en un tap** (D(∫f) → f, ∫(f′) → f).
- **⏳ Reste** : travail d'une force = aire, intégration par parties/substitution.

---

## Bloc 2 — Le tournant universitaire

### I. Les méthodes d'expert (« Street-Fighting Mathematics ») ✅
- **Contenu** : analyse dimensionnelle (retrouver T≈√(L/g) sans résoudre d'EDO), cas limites (Stokes : r→0, v→0, η→∞), ordres de grandeur, lumping, analogie structurelle (masse↔inductance, ressort↔condensateur).
- **Pourquoi si tôt** : ces réflexes se cultivent dès maintenant et servent à *chaque* station suivante — c'est le « filtre de réalité » qui rend toute équation lisible.
- **Geste** : manipuler des équations aux dimensions ([L]/[T]…) avec le moteur existant.
- **Visuels** : tableaux d'unités, courbes de comportement asymptotique.

### J. Vecteurs et géométrie de l'espace ✅ (partiel)
- **Contenu** : vecteurs 2D, addition (parallélogramme), composantes, norme (Pythagore vectoriel), produit scalaire.
- **Geste/visuel** : `VectorsExplorer` — on attrape l'extrémité des flèches, la somme suit en direct.
- **⏳ Suite** : produit scalaire = projection (visuel ombre), produit vectoriel en 3D (via Surface3D ou successeur).

### K. Algèbre linéaire : les matrices transforment le plan ✅ (partiel)
- **Contenu** : matrice 2×2 = transformation du plan (style 3Blue1Brown), déterminant = facteur d'aire (négatif = retournement), matrice inverse = « défaire », vecteurs propres = directions qui ne tournent pas, valeurs propres.
- **Geste/visuel** : `MatrixExplorer` — glisser les images de î et ĵ, la grille suit ; det et directions propres affichés en direct.
- **⏳ Suite** : produit de matrices = composition (deux transformations enchaînées), systèmes linéaires 2×2 par gestes, changement de base, matrices 3×3 en 3D, SVD visuel (rotation·étirement·rotation).

### L. Équations différentielles ✅ (partiel)
- **Contenu fait** : oscillateur x''=−(k/m)x simulé (ressort, curseurs k/m, trace x(t)).
- **Fait aussi** : champ de directions y'=f(x,y) (refroidissement, croissance, logistique) — clic = condition initiale, la solution s'intègre sous les yeux ; équilibres stables/instables.
- **⏳ Reste** : portrait de phase (x,v) — la spirale de l'amortissement, résonance (le pont de Tacoma), datation carbone 14, analogie RLC↔masse-ressort (station I appliquée).

### M. Multivariable : la 3e dimension ✅ (partiel)
- **Contenu** : surfaces z=f(x,y), dérivées partielles (« geler une variable »), gradient = direction de plus grande pente, points critiques (bol, selle).
- **Geste/visuel** : `Surface3D` — surface qu'on fait tourner à la main (canvas 3D maison), curseur temps pour surfaces animées (**le « 4D » = 3D + temps**) ; mode gradient du champ 2D.
- **⏳ Suite** : courbes de niveau ↔ surface (lien carte topographique), multiplicateurs de Lagrange visuels, intégrales doubles = volume.

### N. Calcul vectoriel : les verbes de l'espace ✅ (partiel)
- **Contenu fait** : champs 2D source/tourbillon/uniforme avec particules (divergence et rotationnel qualitatifs).
- **Fait aussi** : mode « gradient d'un potentiel » (le champ qui descend la montagne, potentiel en fond).
- **⏳ Reste** : divergence et rotationnel *quantitatifs* (la petite boîte qui gonfle, la roue à aubes qui tourne), théorèmes intégraux (Green, Stokes, Gauss) racontés comme des bilans, identités (rot(grad)=0, div(rot)=0) démontrées par gestes.

### O. Ondes et séries de Fourier ✅ (partiel)
- **Contenu** : toute onde = somme de sinusoïdes ; construire un signal carré/triangle en empilant des harmoniques ; spectre = recette.
- **Geste/visuel** : `FourierExplorer` — curseur « nombre d'harmoniques », chaque sinusoïde tracée + la somme qui converge (phénomène de Gibbs visible !). **Fait aussi** : les épicycles (`EpicyclesExplorer`, Phase 12 : cercles tournants e^{ikt} qui dessinent le créneau — le pont Fourier↔complexes).
- **⏳ Suite** : corde vibrante (modes propres), transformée de Fourier continue (dualité temps↔fréquence, préparation à Heisenberg).

---

## Bloc 3 — Licence/prépa solide ⏳

### P. Laplace et les systèmes de contrôle ✅ (partiel)
- **Contenu** : la transformée qui change les dérivées en multiplications — l'EDO cauchemardesque devient un polynôme de collège ; pôles et stabilité ; fonctions de transfert.
- **Fait** : la table par taps (`rules/laplace.ts` : 1, t, e^(at), sin/cos, linéarité) et l'inverse ℒ⁻¹ ; pipeline EDO complet (transformer → isoler Y par les gestes acquis → revenir) ; `PoleExplorer` (pôle draggable ↔ réponse temporelle, stabilité).
- **⏳ Reste** : ℒ{y′} = sY − y(0) comme règle gestuelle, fonctions de transfert composées, décomposition en éléments simples.

### Q. Les nombres complexes et leur plan ✅ (partiel)
- **Fait** (Phase 12) : i comme rotation de 90° par gestes (`rules/complex.ts` : cycle des puissances iⁿ, formule d'Euler déplier/replier en un tap) + valeurs exactes du cercle (`rules/trig.ts` : sin/cos de 0…2π par taps) ; **e^{iπ} = −1 démontré en 5 gestes** ; `ComplexExplorer` (z et w draggables : les modules se multiplient, les angles s'additionnent) ; épicycles (pont vers Fourier).
- **⏳ Reste** : racines de l'unité, fonctions complexes comme déformations du plan (domain coloring), intro résidus, arithmétique complexe complète dans le moteur (produit (a+bi)(c+di) par gestes, conjugué, module).

### R. Grandes équations I : Maxwell ✅ (version lecture) → ⏳
- **Fait** : les 4 équations *lues comme de la prose* (cours riche : chaque équation = une phrase sur les sources et les tourbillons), champ 2D source vs vortex en exploration.
- **⏳ Suite** : ondes électromagnétiques animées (E et B qui s'engendrent), la lumière découverte au bout du calcul c=1/√(ε₀μ₀) par gestes, jauge et potentiels.

### S. Grandes équations II : Navier-Stokes et les fluides ⏳
- **Contenu** : NS = F=ma pour un fluide, terme par terme (convection, pression, viscosité=Laplacien lisseur, gravité) ; nombre de Reynolds par analyse dimensionnelle (station I !) ; laminaire vs turbulent.
- **Visuel** : simulation de fluide 2D temps réel (grille eulérienne stable ~64×64, faisable en TS pur ; **premier candidat sérieux pour WASM si on monte en résolution**).
- **Bonus** : curve fitting sur données réelles (upload vidéo/CSV, style Tracker) — la méthode scientifique complète.

### T. Probabilités et statistiques ✅ (fondations)
- **Fait** : favorables/possibles, indépendance, complémentaire (Phase 10) ; planche de Galton animée (binomiale→cloche, théorème central limite) ; Bayes en population de 10 000 points (le test médical à 10 %).
- **⏳ Reste** : arbres pondérés manipulables, variables aléatoires et espérance, estimation, marches aléatoires→diffusion (pont vers la physique statistique).
- **Geste** : arbres de probabilité manipulables, formule de Bayes par glissement.
- **Visuels** : Galton board, histogrammes vivants, marche aléatoire 1D/2D.

### U. Mécanique analytique : Lagrange et Hamilton ⏳
- **Contenu** : principe de moindre action (la nature optimise), coordonnées généralisées, L=T−V, équations d'Euler-Lagrange, H et l'espace des phases, théorème de Noether (symétrie ⇒ conservation — l'une des plus belles idées de la physique).
- **Visuel** : chemins perturbés autour de la trajectoire vraie (l'action calculée en direct), double pendule (chaos !), flot hamiltonien dans l'espace des phases.
- **Geste** : dériver les équations du mouvement par manipulation de L.

---

## Bloc 4 — Master et au-delà ⏳

### V. Mécanique quantique ⏳
- **Contenu** : Schrödinger décortiquée (i = rotation de phase — station Q ; le Hamiltonien = conservation de l'énergie ; la courbure de ψ = énergie cinétique), puits infini (modes = corde vibrante de la station O !), superposition, Heisenberg = dualité de Fourier (station O encore), spin et matrices de Pauli (station K).
- **Visuel** : ψ(x,t) animée dans un potentiel (paquet d'ondes, effet tunnel), niveaux d'énergie interactifs.
- **Moteur** : complexes obligatoires (Q), opérateurs linéaires (K). *La spirale se referme : tout le parcours converge ici.*

### W. Relativité et géométrie de l'espace-temps ⏳ (le vrai « 4D »)
- **Contenu** : relativité restreinte (diagrammes de Minkowski manipulables — glisser la vitesse, voir la simultanéité basculer), E=mc² par cas limites (station I), tenseurs (le produit qui généralise scalaire et vectoriel), courbure, idée de la relativité générale.
- **Visuels 4D** : diagrammes d'espace-temps (2D+temps), projection de tesseract en rotation (canvas maison : projeter ℝ⁴→ℝ³→écran, même technique que Surface3D), géodésiques sur surfaces courbes.
- **Palier technique probable** : Three.js/WebGL à partir d'ici si les scènes se complexifient.

### X. Les structures : algèbre abstraite, topologie, preuves ⏳
- **Contenu** : théorie des groupes (symétries du carré manipulables — composer deux rotations *avec les mains*), groupes = solutions d'équations (Galois raconté), topologie (le café et le donut, caractéristique d'Euler sur polyèdres manipulables), l'art de la preuve (récurrence, absurde, tiroirs) avec vérification par gestes.
- **Geste** : composer des symétries, construire des tables de Cayley.
- **Moteur** : objets non numériques (permutations, symétries) — extension du type `Expr`.

### Y. Théorie des nombres et combinatoire ⏳ (l'entraînement olympiades)
- **Contenu** : arithmétique modulaire (l'horloge), Fermat/Euler, RSA décortiqué (les maths qui protègent tes messages), comptage fin, récurrences, fonctions génératrices (les séries qui comptent), principe des tiroirs niveau compétition.
- **Format nouveau** : problèmes ouverts multi-étapes avec indices progressifs (pas un unique `goal` — un mode « quête »).

### Z. Le sommet : problèmes de niveau HLE ⏳
- **Contenu** : problèmes multi-domaines de niveau expert mêlant les stations (ex. : une intégrale qui demande résidus (Q) + symétrie (X) ; une question de physique demandant Lagrangien (U) + analyse dimensionnelle (I)). Générateur de « défis du jour » tirant dans tout le curriculum (révision espacée à l'échelle du parcours entier).
- **Critère de réussite** : prendre une vraie question publique du HLE (maths/physique) et disposer, dans l'app, de toutes les stations nécessaires pour la comprendre *et* la résoudre.
- **Format** : mode examen (sans indices), rédaction de preuves assistée, auto-évaluation.

---

## Paliers techniques (besoin avant solution)

| Palier | Déclencheur | Statut |
| --- | --- | --- |
| Cours riches + KaTeX effectif (`CourseBlock`, `CourseView`) | Stations I+ : impossible d'écrire un vrai cours en `string[]` | ✅ |
| 3D canvas maison (projection + painter's algorithm) | Station M : surfaces z=f(x,y) — ~1000 quads, 60 fps garanti sans lib | ✅ |
| Three.js/WebGL | Scènes 3D complexes (W : espace-temps, champs 3D denses) | ⏳ |
| Type `Complex` + règles associées dans le moteur | Station Q | ✅ partiel (`i` symbole + cycle iⁿ + Euler ; arithmétique complète ⏳) |
| Règles de dérivation/intégration symboliques gestuelles | Stations G/H complètes, prérequis U/V | ✅ dérivation + chaîne · ⏳ intégration par parties |
| Objets non numériques (permutations, matrices dans l'AST) | Stations K (manipuler Av=λv), X | ⏳ (K partiel au batch : visuel seulement) |
| Web Workers pour le CAS | Si une vérification d'équivalence bloque l'UI (> ~50 ms) — pas observé à ce jour | ⏳ |
| Fluide 2D temps réel (TS pur d'abord) | Station S | ⏳ |
| WASM | Uniquement si le fluide S ou les scènes W saturent le TS pur — **toujours pas justifié** | ⏳ |
| Curve fitting sur données réelles (style Tracker) | Station S (méthode scientifique complète) | ⏳ |
| Mode « quête » multi-étapes, mode examen | Stations Y, Z | ⏳ |

## Principes pédagogiques permanents

1. **Geste avant formule** : chaque concept se manipule avant de se formalise.
2. **Spirale** : + devient somme vectorielle (J), superposition d'états (V) ; × devient produit scalaire (J), composition de matrices (K), produit tensoriel (W). On le dit explicitement à chaque retour.
3. **L'erreur rebondit, elle ne punit pas** : rebond + indice, jamais de rouge.
4. **Chaque équation a une histoire** : qui, pourquoi, et le cas limite qui la rend évidente (station I appliquée partout).
5. **Exact avant approché** : ln 5 reste ln 5 ; le calcul numérique est un choix, jamais un automatisme.
6. **Révision espacée** : les stations terminées repassent en « À réviser » ; à terme, les défis Z puisent dans tout le parcours.
