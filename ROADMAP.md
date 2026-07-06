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
- **Contenu fait** : aire sous la courbe explorée (b²/2), sommes de Riemann interactives (n → ∞ au curseur), intégration **par gestes** (`rules/integrate.ts` : constante, xⁿ, linéarité, sin/cos/exp, 1/x → ln) et **théorème fondamental en un tap** (D(∫f) → f, ∫(f′) → f) ; **intégration par parties par gestes** (`int-parts` : ∫u·v′ = u·v − ∫u′·v pour sin/cos/exp, le u′ reste en attente dans un D).
- **✅ aussi** : substitution linéaire par gestes (`int-linear` : ∫f(ax) = F(ax)/a).
- **⏳ Reste** : travail d'une force = aire, changement de variable général.

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

### K. Algèbre linéaire : les matrices transforment le plan ✅ (gestes complets 2×2)
- **Contenu** : matrice 2×2 = transformation du plan (style 3Blue1Brown), déterminant = facteur d'aire (négatif = retournement), matrice inverse = « défaire », vecteurs propres = directions qui ne tournent pas, valeurs propres.
- **Geste/visuel** : `MatrixExplorer` — glisser les images de î et ĵ, la grille suit ; det et directions propres affichés en direct.
- **✅ aussi (batch 9)** : **les matrices sont dans l'AST** (`rules/matrix.ts` : `Mat2`/`Vec2` rendus en vraie notation matricielle) — Av par « ligne × colonne » en un tap puis calcul par gestes, Iv = v, produit AB = composition (AB ≠ BA *prouvé* par l'élève sur cisaillement/rotation), det déplié en ad − bc, **Av = λv vérifié des deux côtés par gestes** (4 leçons Phase 7). Le palier « objets non numériques » est ouvert.
- **⏳ Suite** : systèmes linéaires 2×2 par gestes, matrice inverse dans l'AST, changement de base, matrices 3×3 en 3D, SVD visuel (rotation·étirement·rotation).

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
- **✅ aussi** : la corde vibrante (`StringExplorer` : modes propres animés, nœuds, corde pincée = somme des 5 premiers modes — le problème qui a créé Fourier).
- **⏳ Suite** : transformée de Fourier continue (dualité temps↔fréquence, préparation à Heisenberg).

---

## Bloc 3 — Licence/prépa solide ⏳

### P. Laplace et les systèmes de contrôle ✅ (partiel)
- **Contenu** : la transformée qui change les dérivées en multiplications — l'EDO cauchemardesque devient un polynôme de collège ; pôles et stabilité ; fonctions de transfert.
- **Fait** : la table par taps (`rules/laplace.ts` : 1, t, e^(at), sin/cos, linéarité) et l'inverse ℒ⁻¹ ; pipeline EDO complet (transformer → isoler Y par les gestes acquis → revenir) ; `PoleExplorer` (pôle draggable ↔ réponse temporelle, stabilité) ; **ℒ{y′} = sY − y₀ et ℒ{y} = Y comme gestes** (`lt-derive`/`lt-y`) + ℒ⁻¹ à numérateur symbolique — le pipeline EDO est 100 % gestuel, condition initiale comprise (y = y₀·e^(−2t)).
- **✅ aussi** : **ℒ{y″} = s²Y − sy₀ − v₀** (`lt-derive2`), retours sin/cos (`ilt-cos`/`ilt-sin` : le ressort y = y₀·cos 2t résolu par Laplace), **éléments simples** (`partial-fractions` : c/((s+a)(s+b)) se scinde en un tap) et `ilt-neg`.
- **⏳ Reste** : fonctions de transfert composées, pôles complexes amortis (s+a)²+ω².

### Q. Les nombres complexes et leur plan ✅ (partiel)
- **Fait** (Phase 12) : i comme rotation de 90° par gestes (`rules/complex.ts` : cycle des puissances iⁿ, formule d'Euler déplier/replier en un tap) + valeurs exactes du cercle (`rules/trig.ts` : sin/cos de 0…2π par taps) ; **e^{iπ} = −1 démontré en 5 gestes** ; `ComplexExplorer` (z et w draggables : les modules se multiplient, les angles s'additionnent) ; épicycles (pont vers Fourier) ; **racines de l'unité** (`exp-power` : la puissance multiplie l'angle, ω³ = 1 vérifié en 6 gestes ; `RootsExplorer` : polygones et étoiles sur le cercle, somme nulle).
- **✅ aussi** : **domain coloring** (`DomainColoringExplorer` : z², 1/z, (z²−1)/z, e^z peints — teinte = argument, luminosité = module ; zéros et pôles visibles à l'œil).
- **⏳ Reste** : intro résidus, arithmétique complexe complète dans le moteur (produit (a+bi)(c+di) par gestes, conjugué, module).

### R. Grandes équations I : Maxwell ✅ (partiel)
- **Fait** : les 4 équations *lues comme de la prose* (cours riche : chaque équation = une phrase sur les sources et les tourbillons), champ 2D source vs vortex en exploration.
- **✅ aussi** : **ondes EM animées** (`EMWaveExplorer` : E ⊥ B en phase, perspective, c = λf) ; leçon « la lumière est une onde EM » (Maxwell 1865 → Hertz → Marconi).
- **⏳ Suite** : c = 1/√(ε₀μ₀) découvert par gestes, jauge et potentiels.

### S. Grandes équations II : Navier-Stokes et les fluides ✅ (partiel)
- **Contenu** : NS = F=ma pour un fluide, terme par terme (convection, pression, viscosité=Laplacien lisseur, gravité) ; nombre de Reynolds par analyse dimensionnelle (station I !) ; laminaire vs turbulent.
- **✅ Fait** : **fluide 2D temps réel** (`FluidExplorer` : solveur « stable fluids » de Stam 64×64 en TS pur — diffusion, advection, projection ; souris = encre + impulsion, curseur de viscosité → volutes/turbulence) ; leçon NS terme à terme + nombre de Reynolds par gestes.
- **⏳ Suite** : montée en résolution (WASM), obstacles, visualisation de la vorticité.
- **Bonus** : curve fitting sur données réelles (upload vidéo/CSV, style Tracker) — la méthode scientifique complète.

### T. Probabilités et statistiques ✅ (fondations)
- **Fait** : favorables/possibles, indépendance, complémentaire (Phase 10) ; planche de Galton animée (binomiale→cloche, théorème central limite) ; Bayes en population de 10 000 points (le test médical à 10 %) ; **arbres pondérés manipulables** (`ProbTreeExplorer` : 3 curseurs, feuilles multipliées, somme toujours 1 ; `mul-fractions` : multiplier des fractions par glissement) ; **espérance** (E = Σ valeur × probabilité, dé et pari par gestes).
- **✅ aussi** : **marches aléatoires** (`RandomWalkExplorer` : 400 marcheurs, enveloppe ±√t, histogramme→cloche ; Einstein-Perrin en story) — le pont vers la diffusion est posé.
- **⏳ Reste** : estimation, équation de la chaleur explicite.
- **Geste** : arbres de probabilité manipulables, formule de Bayes par glissement.
- **Visuels** : Galton board, histogrammes vivants, marche aléatoire 1D/2D.

### U. Mécanique analytique : Lagrange et Hamilton ✅ (partiel)
- **Contenu** : principe de moindre action (la nature optimise), coordonnées généralisées, L=T−V, équations d'Euler-Lagrange, H et l'espace des phases, théorème de Noether (symétrie ⇒ conservation — l'une des plus belles idées de la physique).
- **✅ Fait** (Phase 13) : **principe de moindre action** (`ActionExplorer` : chemin déformable au curseur, action S calculée en direct, minimum sur la parabole) ; leçon L = T − V, Euler-Lagrange, Noether, Feynman-chemins ; p = ∂L/∂v et F = −∂V/∂x par gestes.
- **✅ aussi** : **double pendule** (`DoublePendulumExplorer` : Lagrange→RK4, jumeau à 10⁻⁵ rad, écart mesuré en direct — l'effet papillon) et **espace des phases** (`PhaseSpaceExplorer` : flot hamiltonien du pendule, clic = trajectoire, séparatrice, Liouville en encadré).
- **⏳ Suite** : Noether quantitatif, flot du double pendule (sections de Poincaré).
- **Geste** : dériver les équations du mouvement par manipulation de L.

---

## Bloc 4 — Master et au-delà ⏳

### V. Mécanique quantique ✅ (partiel)
- **✅ Fait** (Phase 14) : Schrödinger décortiquée (i = rotation de phase — station Q ; courbure de ψ = énergie cinétique, ψ″ de sin par gestes), **puits infini** (`QuantumWellExplorer` : Re/Im ψ qui tournent, |ψ|² figé, superposition ψ₁+ψ₂ qui bat — modes = corde vibrante de la station O !), Eₙ = n²E₁ par gestes, **Heisenberg = dualité de Fourier** (leçon complète : de Broglie, paquet d'ondes, pourquoi la matière ne s'effondre pas).
- **✅ aussi** : **effet tunnel** (`TunnelExplorer` : ψ évanescente e^(−κx) dans la barrière, onde transmise en direct, T ≈ e^(−2κL) ; Soleil, Gamow, STM, mémoire flash) — κ et la loi T′ = T² par gestes.
- **✅ aussi (batch 9)** : **le spin en 2×2** (leçon `p14-spin` : σx retourne le spin par produit matrice-vecteur, σx² = I par produit de matrices, superposition (1,1) vérifiée vecteur propre — Stern-Gerlach en story, qubit/porte NOT en encadré). La station K devient de la quantique, telle quelle.
- **✅ aussi (batch 14)** : **σy, la Pauli imaginaire** (leçon `p14-spin-y` : σy|↑⟩ = i|↓⟩ par gestes — i entre dans les matrices ; det σy = −1 ; (1, i) vérifié état propre — « la quantique ne PEUT PAS s'écrire sans les complexes »).
- **⏳ Reste** : σxσy = iσz (l'algèbre de Pauli complète), atome d'hydrogène.
- **Visuel** : ψ(x,t) animée dans un potentiel (paquet d'ondes, effet tunnel), niveaux d'énergie interactifs.
- **Moteur** : complexes obligatoires (Q), opérateurs linéaires (K). *La spirale se referme : tout le parcours converge ici.*

### W. Relativité et géométrie de l'espace-temps ✅ (partiel — restreinte)
- **✅ Fait** (Phase 15) : **diagramme de Minkowski manipulable** (`MinkowskiExplorer` : cône de lumière, axes (x′, ct′) en ciseaux au curseur de vitesse, simultanéité qui bascule — Δt′ affiché, hyperbole de calibration) ; leçons intervalle invariant s² = (ct)² − x² et **dilatation du temps** (γ par gestes, muons, GPS, jumeaux) — le tout en canvas 2D, sans Three.js.
- **✅ aussi (batch 9)** : **le boost de Lorentz est une matrice** (leçon `p15-lorentz` : (ct, x) = (5, 3) → (4, 0) par gestes — l'intervalle s = 4 retrouvé comme temps propre ; det(boost) = 1 calculé, rotation hyperbolique en cours). Les stations K et W se referment l'une sur l'autre.
- **⏳ Reste** : E=mc² par cas limites (station I), tenseurs, courbure/relativité générale, tesseract en rotation.
- **Visuels 4D** : diagrammes d'espace-temps (2D+temps), projection de tesseract en rotation (canvas maison : projeter ℝ⁴→ℝ³→écran, même technique que Surface3D), géodésiques sur surfaces courbes.
- **Palier technique probable** : Three.js/WebGL à partir d'ici si les scènes se complexifient.

### X. Les structures : algèbre abstraite, topologie, preuves ✅ (les groupes existent)
- **✅ Fait (batch 12, Phase 17)** : **le groupe D₄ dans l'AST** (`rules/groupes.ts` : les 8 symétries du carré sont des symboles, `['Compose', a, b]` se réduit d'un tap par la table de Cayley calculée en forme normale r^k·f — impossible de se tromper ; `['Inv', g]` + la règle chaussettes-chaussures (a∘b)⁻¹ = b⁻¹∘a⁻¹) ; **`SymmetryExplorer`** (carré aux coins colorés, boutons r/h/v/d/d′, la composition s'écrit en direct) ; 4 leçons : les 8 symétries, **la non-commutativité prouvée à la main** (r∘h = d ≠ d′ = h∘r), les inverses, le sous-groupe de Klein + Lagrange en encadré (relié à Fermat, Phase 16). Galois en story.
- **⏳ Reste** : groupes = solutions d'équations (Galois quantitatif), permutations en notation cyclique, topologie (Euler sur polyèdres). (L'art de la preuve — récurrence/absurde/tiroirs par gestes — ✅ livré en batch 16, Phase 18.)
- **Geste** : ✅ composer des symétries, table de Cayley vécue par taps.
- **Moteur** : ✅ objets non numériques (symétries) — les matrices (batch 9) et D₄ (batch 12) partagent le même palier.

### Y. Théorie des nombres et combinatoire ✅ (partiel — l'entraînement olympiades commence)
- **✅ Fait (batch 10, Phase 16)** : **l'algorithme d'Euclide par taps** (`rules/nombres.ts` : chaque tap = un pas pgcd(a,b) → pgcd(b, reste), le pire cas Fibonacci vécu en 6 gestes, Lamé en encadré) ; **l'arithmétique de l'horloge** (`Mod` dans l'AST, réduction en chemin « réduire d'abord, calculer petit » — jamais dans un exposant) ; **le petit théorème de Fermat** (cycles des puissances, a^(p−1) ≡ 1 vérifié) ; **RSA décortiqué de bout en bout** (n = 15, e = d = 3 : clés vérifiées, message 2 chiffré en 8, déchiffré en 2 — par gestes ; GCHQ en story).
- **✅ aussi (batch 13)** : **la fonction φ d'Euler par gestes** (`['Phi', n]` : φ(p) = p−1, φ(p^k) = p^k − p^{k−1}, multiplicativité en un tap — φ(15) = 8 relie enfin RSA à sa source, restes chinois en encadré) ; **l'inverse modulaire** (leçon Bézout : remontée d'Euclide en exemple travaillé, vérifications 5·17 ≡ 1 (mod 21), chiffre affine des espions par gestes).
- **⏳ Reste** : Bézout interactif (remonter Euclide par gestes), comptage fin, récurrences, fonctions génératrices, principe des tiroirs niveau compétition.
- **Format nouveau** : ✅ **les expéditions** (batch 15) — problèmes rédigés multi-étapes à indices progressifs (voir Z).

### Z. Le sommet : problèmes de niveau HLE ✅ (le mode examen existe)
- **✅ Fait (batch 11)** : **le Défi du jour** (`pages/Quest.tsx` + `core/quest.ts`) — 5 exercices tirés déterministiquement (même jour = même défi) dans **tout le parcours**, un par phase, **mode examen sans indices**, chrono, série de jours consécutifs + record en localStorage. La révision espacée à l'échelle du curriculum entier est en place.
- **Contenu** : problèmes multi-domaines de niveau expert mêlant les stations (ex. : une intégrale qui demande résidus (Q) + symétrie (X) ; une question de physique demandant Lagrangien (U) + analyse dimensionnelle (I)). Générateur de « défis du jour » tirant dans tout le curriculum (révision espacée à l'échelle du parcours entier).
- **Critère de réussite** : prendre une vraie question publique du HLE (maths/physique) et disposer, dans l'app, de toutes les stations nécessaires pour la comprendre *et* la résoudre.
- **✅ aussi (batch 15)** : **les expéditions** (`content/expeditions.ts` + `pages/Expedition.tsx`) — problèmes **rédigés multi-étapes** avec récit, indices **progressifs** (du coup de pouce à la quasi-solution, champ `hints[]` sur `Exercise`) et épilogue. Trois expéditions : 🕵️ *L'interception* (casser RSA-15 : φ par gestes → clé privée → déchiffrement), 🌉 *Le pont qui oscille* (EDO du 2ᵉ ordre de bout en bout : ℒ{y″} → table inverse → éléments simples — physique + Laplace), 🌀 *Deux visages de la rotation* (R·(2,1) et i·(2+i) donnent le même point : matrices ↔ complexes prouvé à la main).
- **✅ aussi (batch 16)** : **l'art de la preuve** (`content/preuves.ts` + `core/rules/preuves.ts`, Phase 18) — les trois grandes techniques ramenées à leur unique geste mécanique, la **substitution** (`['Subst', corps, variable, valeur]`, tête opaque) : **récurrence** (les dominos — instancier P(1), injecter l'hypothèse P(k) ; sim `DominoesExplorer`), **absurde** (√2 irrationnel : injecter a = 2c dans a² fait surgir la contradiction), **tiroirs** (le pourquoi des collisions modulaires). Premier pas vers la rédaction : « supposons P(k) » = « écris l'hypothèse à la place ».
- **Format** : ✅ mode examen (sans indices — le Défi du jour) · ✅ problèmes multi-domaines rédigés à indices progressifs (les expéditions) · ✅ techniques de preuve par gestes (récurrence/absurde/tiroirs) · ⏳ rédaction libre assistée, auto-évaluation.

---

## Paliers techniques (besoin avant solution)

| Palier | Déclencheur | Statut |
| --- | --- | --- |
| Cours riches + KaTeX effectif (`CourseBlock`, `CourseView`) | Stations I+ : impossible d'écrire un vrai cours en `string[]` | ✅ |
| 3D canvas maison (projection + painter's algorithm) | Station M : surfaces z=f(x,y) — ~1000 quads, 60 fps garanti sans lib | ✅ |
| Three.js/WebGL | Scènes 3D complexes (W : espace-temps, champs 3D denses) | ⏳ |
| Type `Complex` + règles associées dans le moteur | Station Q | ✅ (`i` + cycle iⁿ + Euler + produit (a+bi)(c+di) par gestes + conjugué `Conj` + module z·z̄ — batch 14) |
| Règles de dérivation/intégration symboliques gestuelles | Stations G/H complètes, prérequis U/V | ✅ dérivation + chaîne + parties + substitution linéaire · ⏳ changement de variable général |
| Objets non numériques (permutations, matrices dans l'AST) | Stations K (manipuler Av=λv), X | ✅ matrices (`Mat2`/`Vec2`, batch 9) · ✅ symétries D₄ (`Compose`/`Inv`, batch 12) |
| Web Workers pour le CAS | Si une vérification d'équivalence bloque l'UI (> ~50 ms) — pas observé à ce jour | ⏳ |
| Fluide 2D temps réel (TS pur d'abord) | Station S | ✅ (« stable fluids » 64×64, TS pur, 60 fps) |
| WASM | Uniquement si le fluide S ou les scènes W saturent le TS pur — **toujours pas justifié** | ⏳ |
| Curve fitting sur données réelles (style Tracker) | Station S (méthode scientifique complète) | ⏳ |
| Mode « quête » multi-étapes, mode examen | Stations Y, Z | ✅ mode examen (Défi du jour, batch 11) · ✅ expéditions à indices progressifs (batch 15) · ✅ techniques de preuve par gestes (`Subst`, batch 16) |

## Principes pédagogiques permanents

1. **Geste avant formule** : chaque concept se manipule avant de se formalise.
2. **Spirale** : + devient somme vectorielle (J), superposition d'états (V) ; × devient produit scalaire (J), composition de matrices (K), produit tensoriel (W). On le dit explicitement à chaque retour.
3. **L'erreur rebondit, elle ne punit pas** : rebond + indice, jamais de rouge.
4. **Chaque équation a une histoire** : qui, pourquoi, et le cas limite qui la rend évidente (station I appliquée partout).
5. **Exact avant approché** : ln 5 reste ln 5 ; le calcul numérique est un choix, jamais un automatisme.
6. **Révision espacée** : les stations terminées repassent en « À réviser » ; à terme, les défis Z puisent dans tout le parcours.
