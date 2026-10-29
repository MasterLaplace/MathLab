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

**Batch 17 (29 octobre 2026) — « la carte devient terrain »** : visuels interactifs *dans* les cours (bloc `sim`), questions « devine d'abord » (bloc `predict`), encadrés « analogie », 14 nouveaux explorateurs, 4 nouveaux modules de gestes (second degré, logarithmes, combinatoire, séries), Phases 19 (l'infini) et 20 (l'entropie), 17 leçons et 2 expéditions. Les lignes « ✅ batch 17 » ci-dessous détaillent.

**Couverture** : vérifiée le 15 septembre 2026 contre `Plan_d'apprentissage_Maths-Physique_Universitaire.md` (table de correspondance en fin de document). Deux stations intercalées — **H′** (suites, séries, Taylor) et **T′** (entropie, mécanique statistique) — comblent les manques : 28 stations.

---

## Bloc 1 — Fondations (école → lycée)

### A. Les nombres et les opérations inverses ✅
- **Contenu** : addition/soustraction, multiplication/division, éléments neutres, annulations.
- **Geste** : glisser un terme à travers `=`, taper une paire `+a −a` pour l'annuler.
- **Visuels** : équation manipulable (1D), graphe des deux côtés (2D).
- **Reste à enrichir** : droite numérique animée (déplacement = vecteur 1D), nombres relatifs racontés, proportionnalité et pourcentages (le tableau qui se remplit par gestes), fractions équivalentes et comparaison, priorités opératoires vécues (l'arbre de l'AST *est* la priorité), puissances de 10 et ordres de grandeur (prélude à C et I).

### B. La balance algébrique ✅
- **Contenu** : variables, isoler x, distribution, factorisation, fractions.
- **Geste** : tout le moteur de règles (move-term, move-factor, distribute, factor-common, add-fractions).
- **✅ batch 17** : identités remarquables par gestes (`rules/polynome.ts` : `expand-square`, `factor-square`, `diff-squares` ⇄ `factor-diff-squares`) vues comme des aires (`AlgebraTilesExplorer` : tuiles, double distribution, le « piège a² + b² ») ; **compléter le carré** en un tap (`complete-square`, le geste d'al-Khwarizmi animé en 3 temps) → x² + 10x = 39 résolu comme en 820, racines avec ±, Δ en cours (leçons `p2-identites`, `p2-second-degre`).
- **Reste à enrichir** : systèmes 2 équations / 2 inconnues par substitution et combinaison (K les reprendra en matrices), inéquations (le sens qui bascule quand on multiplie par un négatif — rebond pédagogique), valeur absolue = distance, équations avec fractions rationnelles (domaine de définition).

### C. Puissances, racines, exponentielles, logarithmes ✅
- **Contenu** : x²↔√, xⁿ↔ⁿ√ (avec ±), bˣ↔log_b, e↔ln, « le log transforme × en + ».
- **✅ batch 17** : les règles du log par gestes (`rules/logs.ts` : produit, quotient, puissance, fusion par glissement, valeurs exactes, changement de base) et leur miroir exponentiel (eᵃ·eᵇ = eᵃ⁺ᵇ, eᵃ/eᵇ = eᵃ⁻ᵇ) ; `SlideRuleExplorer` (une vraie règle à calcul + l'échelle des décibels) ; leçon `p2-logarithmes` (2¹⁰⁰ a 31 chiffres, deux aspirateurs = 73 dB).
- **Reste à enrichir** : exposants rationnels et négatifs (x^{1/n} = ⁿ√x, x^{−1} = 1/x en un tap), échelles log (Richter, pH), croissance exponentielle vs polynomiale (la course des courbes : 2ⁿ gagne toujours), changement de base log_b x = ln x / ln b.

### D. Trigonométrie ✅
- **Contenu fait** : sin/cos/tan ↔ arcsin/arccos/arctan par gestes.
- **Fait aussi** : le cercle unité interactif (angle à la main, sin/cos déroulés en ondes, sin²+cos²=1 par gestes).
- **✅ batch 17** : Pythagore manipulable (`PythagorasExplorer` : triangle déformable, carrés sur les côtés, preuve chinoise par réarrangement animée ; leçon `p2-pythagore` : 3-4-5, diagonale d'écran, distance, isoler un côté).
- **⏳ Reste** : Thalès manipulable, aires et volumes (π encadré à la Archimède), radians par gestes (l'arc qui vaut le rayon), formules d'addition sin(a+b), cos(a+b) (que Q redémontre en un geste avec e^{i(a+b)}), loi des cosinus (Pythagore généralisé → le produit scalaire de J), décomposition de forces sur plan incliné.

### E. Fonctions et graphes ✅ (partiel)
- **Contenu fait** : graphe lié à l'équation (l'intersection = solution, immobile pendant la manipulation).
- **✅ batch 17** : transformations de fonctions (`FunctionTransformExplorer` : attraper la courbe, k·f(x − a) + b écrit en direct ; réciproque = miroir animé de y = x) ; leçon `p2-fonctions` (réciproques par les gestes de la balance).
- **⏳ Reste** : lecture de graphes, **coniques** (parabole = balistique de F, ellipse = Kepler de F, hyperbole = calibration de W), asymptotes et comportement à l'infini (les cas limites de I), continuité et fonctions par morceaux, composition f∘g (la chaîne de G en germe).

### F. Les maths en action : la physique ✅
- **Contenu** : d=v·t (mobile animé), F=ma, Ec=½mv², chute libre.
- **✅ batch 17** : gravitation et orbites (`OrbitExplorer` : intégrateur symplectique, flèche de vitesse à glisser, aires égales en temps égaux colorées, T²/a³ mesuré ; mode « canon de Newton » 7,9 → 11,2 km/s) ; leçon `p3-orbites` (Saturne, vitesse orbitale, vitesse de libération par gestes).
- **Reste à enrichir** : projectiles 2D (le geste de décomposition trigo de D branché sur une simulation balistique), mouvement circulaire et force centripète, conservation de l'énergie comme équation manipulable (½mv² + mgh = cte → v en bas de la pente en 3 gestes), quantité de mouvement et chocs (p avant = p après).

### G. Les dérivées ✅ (partiel)
- **Contenu fait** : pente de la tangente explorée à la main (x²→2x).
- **Fait aussi** : la dérivation **par gestes** (`rules/derive.ts` : constante, xⁿ, linéarité, sortie des constantes, sin/cos/exp/ln, règle du produit — chaque règle est un tap), et la **règle de la chaîne** (sin/cos/exp/ln/uⁿ composés : la dérivée intérieure reste en attente dans un nouveau d/dx — leçon `p4-chaine`).
- **✅ batch 17** : **optimiser** (f′ = 0 par les gestes de dérivation : l'enclos, le creux de la parabole ; Fermat en story — leçon `p4-optimisation`) et **la méthode de Newton** (`NewtonExplorer` : tangentes animées, tableau où les décimales justes doublent ; un pas calculé par `Subst` ; YBC 7289 en story — leçon `p4-newton`).
- **⏳ Reste** : limites racontées (vitesse instantanée), notation de Leibniz manipulable (dx qui « se simplifie »), loi de Snell par le principe de Fermat, dérivation implicite (le cercle x² + y² = 1 dérivé tel quel), règle de l'Hôpital comme cas limite (I), convexité et points d'inflexion.

### H. Les intégrales ✅ (partiel)
- **Contenu fait** : aire sous la courbe explorée (b²/2), sommes de Riemann interactives (n → ∞ au curseur), intégration **par gestes** (`rules/integrate.ts` : constante, xⁿ, linéarité, sin/cos/exp, 1/x → ln) et **théorème fondamental en un tap** (D(∫f) → f, ∫(f′) → f) ; **intégration par parties par gestes** (`int-parts` : ∫u·v′ = u·v − ∫u′·v pour sin/cos/exp, le u′ reste en attente dans un D).
- **✅ aussi** : substitution linéaire par gestes (`int-linear` : ∫f(ax) = F(ax)/a).
- **⏳ Reste** : travail d'une force = aire, changement de variable général (u = g(x) : le geste `Subst` de la Phase 18 réutilisé dans une intégrale), intégrales impropres (∫₁^∞ dx/x² converge, ∫₁^∞ dx/x non — H′ explique pourquoi), fractions rationnelles (les éléments simples de P, déjà là), longueur d'arc et volumes de révolution, valeur moyenne d'une fonction (T continue en germe).

### H′. Suites, séries et développements de Taylor ✅ (Phase 19)
- **✅ batch 17** : `rules/series.ts` — `['Taylor', f, x, k]` rendu 𝒯{f} puis O(xᵏ), un terme exact par tap (eˣ, sin, cos, arctan, ln(1+x), 1/(1−x), √(1+x), 1/√(1−x)), **troncature explicite** (le reste disparaît, `=` devient `≈` via la tête `Approx`) ; `['GeomSeries', a, r]` (sommer si |r| < 1, ou dérouler a + r·S) ; calcul exact des quotients en fraction irréductible. Explorateurs `ZenoExplorer` (carré qui se remplit, course d'Achille), `CobwebExplorer` (toile d'araignée, diagramme de bifurcation, Feigenbaum), `TaylorExplorer` (le polynôme qui rampe, rayon de convergence visible). Leçons `p19-zenon` (0,999… = 1, la balle qui rebondit), `p19-suites` (Dottie, Héron, point fixe par complétion du carré), `p19-taylor`, `p19-approx` (sin θ ≈ θ, γ ≈ 1 + u/2 → E ≈ mc² + ½mv², e^0,2 à la main).
- **⏳ Reste** : séries de Taylor à deux variables, critères de convergence (série harmonique, Σ1/n²), restes de Lagrange quantitatifs.
- **Contenu** : limites de suites, suites récurrentes (uₙ₊₁ = f(uₙ) : la toile d'araignée, point fixe stable/instable — le chaos de U en germe), **séries géométriques** (Zénon enfin résolu : ½ + ¼ + ⅛ + … = 1 par gestes), convergence/divergence (la série harmonique diverge, lentement ; Σ1/n² = π²/6 en story — Euler), **développements de Taylor** : le polynôme qui épouse la courbe terme après terme (e^x, sin, cos, ln(1+x), 1/(1−x), √(1+x)), reste et erreur de troncature, **petites oscillations** (sin θ ≈ θ : le pendule de L devient linéaire), équivalents et développements limités (station I : « prendre la grosse part »).
- **Pourquoi ici** : c'est le pont entre G/H et tout le Bloc 2 — la preuve de e^{iθ} = cos θ + i sin θ (Q) *est* trois séries de Taylor alignées ; les séries de Fourier (O) sont l'autre façon de décomposer une fonction ; E = mc² par cas limite (W : √(1+x) ≈ 1 + x/2), la théorie des perturbations (V) et les petites oscillations (L) sont des Taylor tronqués.
- **Geste** : un nœud `['Taylor', f, x, n]` qui se déplie d'un terme par tap (le coefficient f⁽ⁿ⁾(0)/n! calculé par la dérivation de G) ; tronquer = geste (le reste « reste en attente », comme le D de la règle de la chaîne) ; sin θ → θ en un tap sous garde « θ petit » ; sommer une géométrique en un geste.
- **Visuel** : `TaylorExplorer` — courbe + polynôme de Taylor, curseur n (le polynôme rampe le long de la courbe, même mécanique que le curseur d'harmoniques de `FourierExplorer`), rayon de convergence visible (ln(1+x) décroche en x = 1, 1/(1+x²) aussi — Q expliquera pourquoi : le pôle en i) ; toile d'araignée des suites récurrentes.
- **Moteur** : palier « règles symboliques » étendu (voir tableau) ; `Taylor` tête opaque pour `reachesGoal`.

---

## Bloc 2 — Le tournant universitaire

### I. Les méthodes d'expert (« Street-Fighting Mathematics ») ✅
- **Contenu** : les six outils de Mahajan — analyse dimensionnelle (retrouver T≈√(L/g) sans résoudre d'EDO), cas limites (Stokes : r→0, v→0, η→∞), lumping, preuves picturales, « prendre la grosse part » (approximations successives), analogie structurelle (masse↔inductance, ressort↔condensateur) — plus les ordres de grandeur (estimations de Fermi).
- **Pourquoi si tôt** : ces réflexes se cultivent dès maintenant et servent à *chaque* station suivante — c'est le « filtre de réalité » qui rend toute équation lisible.
- **Geste** : manipuler des équations aux dimensions ([L]/[T]…) avec le moteur existant.
- **Visuels** : tableaux d'unités, courbes de comportement asymptotique.
- **✅ batch 17** : **preuves sans mots** (`PictorialProofExplorer` : équerres des impairs, escalier dédoublé de Gauss, carré découpé en tiers ; leçon `p6-preuves-images`).
- **⏳ Reste** : « prendre la grosse part » (√10 ≈ 3 + 1/6 : les Taylor tronqués de H′ comme réflexe), estimations de Fermi en exercices (combien de gouttes dans la mer ?), nombres sans dimension (Reynolds de S, Mach, Froude) comme famille.

### J. Vecteurs et géométrie de l'espace ✅ (partiel)
- **Contenu** : vecteurs 2D, addition (parallélogramme), composantes, norme (Pythagore vectoriel), produit scalaire.
- **Geste/visuel** : `VectorsExplorer` — on attrape l'extrémité des flèches, la somme suit en direct.
- **⏳ Suite** : produit scalaire = projection (visuel ombre), loi des cosinus comme produit scalaire (D refermée), produit vectoriel en 3D (via Surface3D ou successeur), moment cinétique L = r × p et sa conservation (les aires de Kepler, F), bases orthonormées et Gram-Schmidt visuel (redresser une base tordue), vecteurs dans l'AST (le `Vec2` de K est déjà là : addition et produit scalaire par gestes).

### K. Algèbre linéaire : les matrices transforment le plan ✅ (gestes complets 2×2)
- **Contenu** : matrice 2×2 = transformation du plan (style 3Blue1Brown), déterminant = facteur d'aire (négatif = retournement), matrice inverse = « défaire », vecteurs propres = directions qui ne tournent pas, valeurs propres.
- **Geste/visuel** : `MatrixExplorer` — glisser les images de î et ĵ, la grille suit ; det et directions propres affichés en direct.
- **✅ aussi (batch 9)** : **les matrices sont dans l'AST** (`rules/matrix.ts` : `Mat2`/`Vec2` rendus en vraie notation matricielle) — Av par « ligne × colonne » en un tap puis calcul par gestes, Iv = v, produit AB = composition (AB ≠ BA *prouvé* par l'élève sur cisaillement/rotation), det déplié en ad − bc, **Av = λv vérifié des deux côtés par gestes** (4 leçons Phase 7). Le palier « objets non numériques » est ouvert.
- **⏳ Suite** : systèmes linéaires 2×2 par gestes (le pivot de Gauss = move-term généralisé), matrice inverse dans l'AST (A⁻¹ = « défaire », AA⁻¹ = I en un tap), transposée, matrices orthogonales (rotations : det = 1, l'expédition 🌀 revisitée) et symétriques, **hermitiennes** (Aᵀ conjuguée = A : les observables de V), noyau/image et rang (la dimension qui manque), changement de base, **diagonalisation** A = PDP⁻¹ (les puissances de matrices → Fibonacci en forme fermée, Y), matrices 3×3 en 3D, SVD visuel (rotation·étirement·rotation).

### L. Équations différentielles ✅ (partiel)
- **Contenu fait** : oscillateur x''=−(k/m)x simulé (ressort, curseurs k/m, trace x(t)).
- **Fait aussi** : champ de directions y'=f(x,y) (refroidissement, croissance, logistique) — clic = condition initiale, la solution s'intègre sous les yeux ; équilibres stables/instables.
- **✅ batch 17** : **le Laplacien et les EDP** (`HeatWaveExplorer` : peindre une température, chaleur vs onde côte à côte — parabolique contre hyperbolique ; leçon `p9-chaleur` : Laplacien discret, e^(−t) sin x vérifiée solution par les gestes de dérivation).
- **⏳ Reste** : portrait de phase (x,v) — la spirale de l'amortissement, résonance (le pont de Tacoma), datation carbone 14, analogie RLC↔masse-ressort (station I appliquée), **résolution par gestes** (séparation des variables y′ = ky → ln y = kt + C avec les gestes de C et H ; linéaire du 1ᵉʳ ordre ; équation caractéristique r² + ar + b = 0 → le second degré de B décide amorti/oscillant), **systèmes x′ = Ax** (les valeurs propres de K classent les équilibres : nœud, col, spirale, centre), **méthode d'Euler explicite** (ce que fait chaque sim, pas à pas ; erreur et stabilité, RK en encadré), **EDP — la famille** (chaleur ∂ₜu = D∂ₓₓu, onde ∂ₜₜu = c²∂ₓₓu, Laplace ∇²u = 0 ; classification parabolique/hyperbolique/elliptique ; conditions aux limites ; séparation des variables → les modes de la corde de O ; la chaleur résolue par Fourier — le pont T → T′ posé).

### M. Multivariable : la 3e dimension ✅ (partiel)
- **Contenu** : surfaces z=f(x,y), dérivées partielles (« geler une variable »), gradient = direction de plus grande pente, points critiques (bol, selle).
- **Geste/visuel** : `Surface3D` — surface qu'on fait tourner à la main (canvas 3D maison), curseur temps pour surfaces animées (**le « 4D » = 3D + temps**) ; mode gradient du champ 2D.
- **⏳ Suite** : courbes de niveau ↔ surface (lien carte topographique), dérivée directionnelle et règle de la chaîne multivariable (G refermée), Taylor à deux variables et hessienne (bol/selle classés par les valeurs propres de K), multiplicateurs de Lagrange visuels, intégrales doubles = volume, **coordonnées polaires/cylindriques/sphériques et le jacobien** (= le déterminant de K : l'élément d'aire qui se déforme), différentielle totale (dU = TdS − PdV : la thermo de T′ est de la géométrie).

### N. Calcul vectoriel : les verbes de l'espace ✅ (partiel)
- **Contenu fait** : champs 2D source/tourbillon/uniforme avec particules (divergence et rotationnel qualitatifs).
- **Fait aussi** : mode « gradient d'un potentiel » (le champ qui descend la montagne, potentiel en fond).
- **⏳ Reste** : divergence et rotationnel *quantitatifs* (la petite boîte qui gonfle, la roue à aubes qui tourne), Laplacien 2D et 3D (le 1D « moyenne des voisins moins moi » ✅ batch 17, station L), flux et circulation comme intégrales manipulables, théorèmes intégraux (Green, Stokes, Gauss) racontés comme des bilans, identités (rot(grad)=0, div(rot)=0) démontrées par gestes, coordonnées curvilignes (le nabla en polaires).

### O. Ondes et séries de Fourier ✅ (partiel)
- **Contenu** : toute onde = somme de sinusoïdes ; construire un signal carré/triangle en empilant des harmoniques ; spectre = recette.
- **Geste/visuel** : `FourierExplorer` — curseur « nombre d'harmoniques », chaque sinusoïde tracée + la somme qui converge (phénomène de Gibbs visible !). **Fait aussi** : les épicycles (`EpicyclesExplorer`, Phase 12 : cercles tournants e^{ikt} qui dessinent le créneau — le pont Fourier↔complexes).
- **✅ aussi** : la corde vibrante (`StringExplorer` : modes propres animés, nœuds, corde pincée = somme des 5 premiers modes — le problème qui a créé Fourier).
- **⏳ Suite** : transformée de Fourier continue (dualité temps↔fréquence, préparation à Heisenberg), **les fonctions sont des vecteurs** (⟨f, g⟩ = ∫ f g : les modes de la corde sont orthogonaux, les coefficients de Fourier sont des *projections* — le produit scalaire de J au troisième tour de spirale ; l'espace de Hilbert enfin nommé, celui de V), Fourier complexe cₙ e^{inωt} (Q), **convolution** (∗ ↔ × : la même idée pour Laplace en P), Parseval (l'énergie se conserve d'un domaine à l'autre), DFT/FFT et le spectre d'un vrai son (palier micro), Doppler, interférences et diffraction (la fente de Young annonce V).

---

## Bloc 3 — Licence/prépa solide ✅ (partiel)

### P. Laplace et les systèmes de contrôle ✅ (partiel)
- **Contenu** : la transformée qui change les dérivées en multiplications — l'EDO cauchemardesque devient un polynôme de collège ; pôles et stabilité ; fonctions de transfert.
- **Fait** : la table par taps (`rules/laplace.ts` : 1, t, e^(at), sin/cos, linéarité) et l'inverse ℒ⁻¹ ; pipeline EDO complet (transformer → isoler Y par les gestes acquis → revenir) ; `PoleExplorer` (pôle draggable ↔ réponse temporelle, stabilité) ; **ℒ{y′} = sY − y₀ et ℒ{y} = Y comme gestes** (`lt-derive`/`lt-y`) + ℒ⁻¹ à numérateur symbolique — le pipeline EDO est 100 % gestuel, condition initiale comprise (y = y₀·e^(−2t)).
- **✅ aussi** : **ℒ{y″} = s²Y − sy₀ − v₀** (`lt-derive2`), retours sin/cos (`ilt-cos`/`ilt-sin` : le ressort y = y₀·cos 2t résolu par Laplace), **éléments simples** (`partial-fractions` : c/((s+a)(s+b)) se scinde en un tap) et `ilt-neg`.
- **⏳ Reste** : fonctions de transfert composées, pôles complexes amortis (s+a)²+ω², **convolution et réponse impulsionnelle** (ℒ{f ∗ g} = F·G, Dirac δ), théorème de la valeur finale (le cas limite s → 0 : station I), diagramme de Bode (les échelles log de C), boucle de rétroaction et stabilité (Nyquist en horizon).

### Q. Les nombres complexes et leur plan ✅ (partiel)
- **Fait** (Phase 12) : i comme rotation de 90° par gestes (`rules/complex.ts` : cycle des puissances iⁿ, formule d'Euler déplier/replier en un tap) + valeurs exactes du cercle (`rules/trig.ts` : sin/cos de 0…2π par taps) ; **e^{iπ} = −1 démontré en 5 gestes** ; `ComplexExplorer` (z et w draggables : les modules se multiplient, les angles s'additionnent) ; épicycles (pont vers Fourier) ; **racines de l'unité** (`exp-power` : la puissance multiplie l'angle, ω³ = 1 vérifié en 6 gestes ; `RootsExplorer` : polygones et étoiles sur le cercle, somme nulle).
- **✅ aussi** : **domain coloring** (`DomainColoringExplorer` : z², 1/z, (z²−1)/z, e^z peints — teinte = argument, luminosité = module ; zéros et pôles visibles à l'œil).
- **✅ aussi (batch 14)** : **arithmétique complexe complète dans le moteur** — produit (a+bi)(c+di) par gestes (`combine-numbers`/`negate-out`), conjugué `Conj` qui se déplie, module z·z̄ (Phase 12, `content/complexe.ts`).
- **⏳ Reste** : forme polaire ↔ cartésienne par gestes (r e^{iθ} ↔ a + bi), **analyse complexe** — Cauchy-Riemann (holomorphe = rotation-dilatation locale : le domain coloring le montre déjà), intégrales de contour, résidus (∮ dz/z = 2πi : le tour du pôle ; l'intégrale réelle ∫ dx/(1+x²) = π par un détour dans ℂ), théorème fondamental de l'algèbre (avec X), itération z → z² + c (Mandelbrot, avec U).

### R. Grandes équations I : Maxwell ✅ (partiel)
- **Fait** : les 4 équations *lues comme de la prose* (cours riche : chaque équation = une phrase sur les sources et les tourbillons), champ 2D source vs vortex en exploration.
- **✅ aussi** : **ondes EM animées** (`EMWaveExplorer` : E ⊥ B en phase, perspective, c = λf) ; leçon « la lumière est une onde EM » (Maxwell 1865 → Hertz → Marconi).
- **⏳ Suite** : c = 1/√(ε₀μ₀) découvert par gestes, jauge et potentiels, **forme intégrale ↔ forme locale** (les théorèmes de N appliqués : Gauss = bilan de flux à travers une boîte), l'équation d'onde dérivée de rot(rot E) (les identités de N en action), énergie du champ et vecteur de Poynting, la covariance de Maxwell annonce W.

### S. Grandes équations II : Navier-Stokes et les fluides ✅ (partiel)
- **Contenu** : NS = F=ma pour un fluide, terme par terme (convection, pression, viscosité=Laplacien lisseur, gravité) ; nombre de Reynolds par analyse dimensionnelle (station I !) ; laminaire vs turbulent.
- **✅ Fait** : **fluide 2D temps réel** (`FluidExplorer` : solveur « stable fluids » de Stam 64×64 en TS pur — diffusion, advection, projection ; souris = encre + impulsion, curseur de viscosité → volutes/turbulence) ; leçon NS terme à terme + nombre de Reynolds par gestes.
- **⏳ Suite** : montée en résolution (WASM), obstacles, visualisation de la vorticité (le rotationnel de N vécu), écoulement potentiel (le Laplace de L !), Bernoulli par gestes (la conservation de l'énergie de F pour un fluide), couche limite et traînée (le Stokes de I refermé).
- **Bonus** : curve fitting sur données réelles (upload vidéo/CSV, style Tracker) — la méthode scientifique complète.

### T. Probabilités et statistiques ✅ (fondations)
- **Fait** : favorables/possibles, indépendance, complémentaire (Phase 10) ; planche de Galton animée (binomiale→cloche, théorème central limite) ; Bayes en population de 10 000 points (le test médical à 10 %) ; **arbres pondérés manipulables** (`ProbTreeExplorer` : 3 curseurs, feuilles multipliées, somme toujours 1 ; `mul-fractions` : multiplier des fractions par glissement) ; **espérance** (E = Σ valeur × probabilité, dé et pari par gestes).
- **✅ aussi** : **marches aléatoires** (`RandomWalkExplorer` : 400 marcheurs, enveloppe ±√t, histogramme→cloche ; Einstein-Perrin en story) — le pont vers la diffusion est posé.
- **⏳ Reste** : **variables continues** (densité, la loi normale — la cloche de Galton devient une formule ; variance et écart-type ; loi des grands nombres), estimation et intervalles de confiance, **régression linéaire par moindres carrés** (le curve fitting de S = une projection orthogonale, J/K), tests d'hypothèse racontés (la dame qui goûte le thé), **chaînes de Markov** (matrices stochastiques de K, vecteur propre = état stationnaire → PageRank), entropie (→ T′), équation de la chaleur explicite (→ L, EDP).
- **Geste** : arbres de probabilité manipulables, formule de Bayes par glissement.
- **Visuels** : Galton board, histogrammes vivants, marche aléatoire 1D/2D.

### T′. Entropie et mécanique statistique ✅ (Phase 20)
- **✅ batch 17** : Ω compté par gestes (`rules/combinatoire.ts` : `Factorial` qui se pèle, `Binom` par définition/Pascal/symétrie/bords), S = k ln Ω et son additivité par les règles du log, ln(2ᴺ) = N ln 2, Shannon (bits), facteurs de Boltzmann par gestes exponentiels. Explorateurs `EhrenfestExplorer` (les deux urnes, temps de retour 2ᴺ face à l'âge de l'univers), `IsingExplorer` (Metropolis 100×100, T_c d'Onsager, trempe, aimantation en direct). Leçons `p20-entropie`, `p20-boltzmann` ; expédition 🌡️ *La flèche du temps*.
- **⏳ Reste** : fonction de partition Z par gestes, gaz parfait depuis le comptage, rendement de Carnot, statistiques de Bose/Fermi.
- **Contenu** : du hasard (T) à la chaleur : micro-états et macro-états, **entropie S = k ln Ω** (le log de C devient la flèche du temps), température comme ∂S/∂E, **distribution de Boltzmann** e^{−E/kT}, fonction de partition Z (« la somme qui sait tout »), gaz parfait retrouvé (PV = NkT depuis le comptage), équipartition, **entropie de Shannon** (la même formule pour l'information : bits, compression — la station C fermée par le haut), **modèle d'Ising** et transitions de phase (l'aimant qui perd son aimantation à T_c ; dualité de Kramers-Wannier en encadré), le démon de Maxwell et Landauer, statistiques de Bose et Fermi en horizon (V).
- **Pourquoi ici** : la station absente de la première carte. Elle relie T (marche aléatoire → diffusion → équation de la chaleur), U (Hamilton → espace des phases → Liouville → ensemble microcanonique), M (dU = TdS − PdV : différentielle totale) et V (le spin de Pauli devient un spin d'Ising).
- **Geste** : Ω compté par gestes (les tiroirs de la Phase 18 : répartir 4 quanta sur 3 oscillateurs), S = k ln Ω → additivité par les règles des log de C, Z d'un système à deux niveaux par taps, ⟨E⟩ = −∂ ln Z/∂β avec la dérivation de G, rendement de Carnot par cas limite (I).
- **Visuel** : `IsingExplorer` (grille 64×64, Metropolis, curseur de température : les domaines gèlent ou fondent, aimantation en direct), gaz dans une boîte (histogramme des vitesses → Maxwell-Boltzmann), « les deux boîtes » (l'irréversibilité vue comme du comptage : 10 particules reviennent, 10⁴ jamais).
- **Moteur** : Monte-Carlo en TS pur (voir tableau) ; une tête opaque `Omega` (dénombrer) sur le modèle de `Gcd`/`Phi`.

### U. Mécanique analytique : Lagrange et Hamilton ✅ (partiel)
- **Contenu** : principe de moindre action (la nature optimise), coordonnées généralisées, L=T−V, équations d'Euler-Lagrange, H et l'espace des phases, théorème de Noether (symétrie ⇒ conservation — l'une des plus belles idées de la physique).
- **✅ Fait** (Phase 13) : **principe de moindre action** (`ActionExplorer` : chemin déformable au curseur, action S calculée en direct, minimum sur la parabole) ; leçon L = T − V, Euler-Lagrange, Noether, Feynman-chemins ; p = ∂L/∂v et F = −∂V/∂x par gestes.
- **✅ aussi** : **double pendule** (`DoublePendulumExplorer` : Lagrange→RK4, jumeau à 10⁻⁵ rad, écart mesuré en direct — l'effet papillon) et **espace des phases** (`PhaseSpaceExplorer` : flot hamiltonien du pendule, clic = trajectoire, séparatrice, Liouville en encadré).
- **✅ batch 17** : bifurcations de la logistique (diagramme de `CobwebExplorer`, Feigenbaum δ ≈ 4,669, période 3 — leçon `p19-suites`).
- **⏳ Suite** : Noether quantitatif, sections de Poincaré (flot du double pendule), **fractales** (Mandelbrot : z → z² + c, la station Q itérée ; dimension fractale par analyse dimensionnelle, I), exposants de Lyapunov mesurés sur le jumeau, Hamilton-Jacobi en horizon (le pont exact vers V).
- **Geste** : dériver les équations du mouvement par manipulation de L.

---

## Bloc 4 — Master et au-delà ✅ (partiel)

### V. Mécanique quantique ✅ (partiel)
- **✅ Fait** (Phase 14) : Schrödinger décortiquée (i = rotation de phase — station Q ; courbure de ψ = énergie cinétique, ψ″ de sin par gestes), **puits infini** (`QuantumWellExplorer` : Re/Im ψ qui tournent, |ψ|² figé, superposition ψ₁+ψ₂ qui bat — modes = corde vibrante de la station O !), Eₙ = n²E₁ par gestes, **Heisenberg = dualité de Fourier** (leçon complète : de Broglie, paquet d'ondes, pourquoi la matière ne s'effondre pas).
- **✅ aussi** : **effet tunnel** (`TunnelExplorer` : ψ évanescente e^(−κx) dans la barrière, onde transmise en direct, T ≈ e^(−2κL) ; Soleil, Gamow, STM, mémoire flash) — κ et la loi T′ = T² par gestes.
- **✅ aussi (batch 9)** : **le spin en 2×2** (leçon `p14-spin` : σx retourne le spin par produit matrice-vecteur, σx² = I par produit de matrices, superposition (1,1) vérifiée vecteur propre — Stern-Gerlach en story, qubit/porte NOT en encadré). La station K devient de la quantique, telle quelle.
- **✅ aussi (batch 14)** : **σy, la Pauli imaginaire** (leçon `p14-spin-y` : σy|↑⟩ = i|↓⟩ par gestes — i entre dans les matrices ; det σy = −1 ; (1, i) vérifié état propre — « la quantique ne PEUT PAS s'écrire sans les complexes »).
- **⏳ Reste** : σxσy = iσz (l'algèbre de Pauli complète), **commutateur [x, p] = iℏ** (la non-commutativité de K et X devient le principe d'incertitude — Heisenberg en un geste), **opérateurs hermitiens** = observables (valeurs propres réelles, vecteurs propres orthogonaux — K refermée ; l'espace de Hilbert de O), notation bra-ket, oscillateur harmonique (l'échelle a, a† : Eₙ = ℏω(n+½) par gestes), **intrication** : deux qubits = produit tensoriel (le × de la spirale — W partage le mot), inégalité de Bell (les probabilités de T contre la quantique), atome d'hydrogène, statistiques de Bose/Fermi (T′).
- **Visuel** : ψ(x,t) animée dans un potentiel (paquet d'ondes, effet tunnel), niveaux d'énergie interactifs.
- **Moteur** : complexes obligatoires (Q), opérateurs linéaires (K). *La spirale se referme : tout le parcours converge ici.*

### W. Relativité et géométrie de l'espace-temps ✅ (partiel — restreinte)
- **✅ Fait** (Phase 15) : **diagramme de Minkowski manipulable** (`MinkowskiExplorer` : cône de lumière, axes (x′, ct′) en ciseaux au curseur de vitesse, simultanéité qui bascule — Δt′ affiché, hyperbole de calibration) ; leçons intervalle invariant s² = (ct)² − x² et **dilatation du temps** (γ par gestes, muons, GPS, jumeaux) — le tout en canvas 2D, sans Three.js.
- **✅ aussi (batch 9)** : **le boost de Lorentz est une matrice** (leçon `p15-lorentz` : (ct, x) = (5, 3) → (4, 0) par gestes — l'intervalle s = 4 retrouvé comme temps propre ; det(boost) = 1 calculé, rotation hyperbolique en cours). Les stations K et W se referment l'une sur l'autre.
- **✅ batch 17** : E ≈ mc² + ½mv² par troncature de Taylor de γ (leçon `p19-approx`).
- **⏳ Reste** : addition des vitesses (deux boosts composés = un boost : un groupe, X), Doppler relativiste, **tenseurs** (le produit tensoriel de V ; la métrique gμν), **relativité générale** : courbure de Gauss et géodésiques sur surface (Surface3D : la ligne « la plus droite » sur la sphère), principe d'équivalence, l'équation d'Einstein Gμν = 8πG Tμν *lue comme de la prose* (comme Maxwell en R), déviation de la lumière et précession de Mercure, ondes gravitationnelles (l'onde de O dans l'espace-temps), tesseract en rotation.
- **Visuels 4D** : diagrammes d'espace-temps (2D+temps), projection de tesseract en rotation (canvas maison : projeter ℝ⁴→ℝ³→écran, même technique que Surface3D), géodésiques sur surfaces courbes.
- **Palier technique probable** : Three.js/WebGL à partir d'ici si les scènes se complexifient.

### X. Les structures : algèbre abstraite, topologie, preuves ✅ (les groupes existent)
- **✅ Fait (batch 12, Phase 17)** : **le groupe D₄ dans l'AST** (`rules/groupes.ts` : les 8 symétries du carré sont des symboles, `['Compose', a, b]` se réduit d'un tap par la table de Cayley calculée en forme normale r^k·f — impossible de se tromper ; `['Inv', g]` + la règle chaussettes-chaussures (a∘b)⁻¹ = b⁻¹∘a⁻¹) ; **`SymmetryExplorer`** (carré aux coins colorés, boutons r/h/v/d/d′, la composition s'écrit en direct) ; 4 leçons : les 8 symétries, **la non-commutativité prouvée à la main** (r∘h = d ≠ d′ = h∘r), les inverses, le sous-groupe de Klein + Lagrange en encadré (relié à Fermat, Phase 16). Galois en story.
- **✅ aussi (batch 16, Phase 18)** : l'art de la preuve — récurrence/absurde/tiroirs par le geste `Subst` (détail en Z).
- **⏳ Reste** : **logique et ensembles** (∀/∃ et leur négation, applications injectives/surjectives/bijectives — la grammaire que la Phase 18 utilisait sans la nommer), **cardinaux** (l'hôtel de Hilbert, la diagonale de Cantor : ℝ n'est pas dénombrable — l'absurde au niveau supérieur), permutations en notation cyclique (Sₙ dans l'AST, sur le modèle de D₄), anneaux et corps (ℤ/pℤ est un corps ⇔ p premier — pourquoi RSA marche, Y ; corps finis), espaces vectoriels abstraits (les fonctions de O en sont un), groupes = solutions d'équations (Galois quantitatif), **groupes continus** (SO(2) = U(1) = e^{iθ} : l'expédition 🌀 était un groupe de Lie sans le dire ; SU(2) et le spin de V), théorème fondamental de l'algèbre (les racines de Q), topologie (Euler V − E + F = 2 sur polyèdres, tore, ruban de Möbius, genre).
- **Geste** : ✅ composer des symétries, table de Cayley vécue par taps.
- **Moteur** : ✅ objets non numériques (symétries) — les matrices (batch 9) et D₄ (batch 12) partagent le même palier.

### Y. Théorie des nombres et combinatoire ✅ (partiel — l'entraînement olympiades commence)
- **✅ Fait (batch 10, Phase 16)** : **l'algorithme d'Euclide par taps** (`rules/nombres.ts` : chaque tap = un pas pgcd(a,b) → pgcd(b, reste), le pire cas Fibonacci vécu en 6 gestes, Lamé en encadré) ; **l'arithmétique de l'horloge** (`Mod` dans l'AST, réduction en chemin « réduire d'abord, calculer petit » — jamais dans un exposant) ; **le petit théorème de Fermat** (cycles des puissances, a^(p−1) ≡ 1 vérifié) ; **RSA décortiqué de bout en bout** (n = 15, e = d = 3 : clés vérifiées, message 2 chiffré en 8, déchiffré en 2 — par gestes ; GCHQ en story).
- **✅ aussi (batch 13)** : **la fonction φ d'Euler par gestes** (`['Phi', n]` : φ(p) = p−1, φ(p^k) = p^k − p^{k−1}, multiplicativité en un tap — φ(15) = 8 relie enfin RSA à sa source, restes chinois en encadré) ; **l'inverse modulaire** (leçon Bézout : remontée d'Euclide en exemple travaillé, vérifications 5·17 ≡ 1 (mod 21), chiffre affine des espions par gestes).
- **✅ batch 17** : **combinatoire par gestes** (n! pelé, C(n, k) par définition/Pascal/symétrie, 5!/3! simplifié) et `PascalExplorer` (chemins = billes de Galton, Sierpiński modulo 2, 3, 5 avec le théorème de Lucas) — leçon `p20-denombrer`.
- **⏳ Reste** : Bézout interactif (remonter Euclide par gestes), **infinité des premiers par l'absurde** (le geste `Subst` de la Phase 18 sur N = p₁⋯pₖ + 1), crible d'Ératosthène, restes chinois par gestes, binôme de Newton par gestes, récurrences linéaires : Fibonacci en forme fermée via les valeurs propres de K, fonctions génératrices), **théorie des graphes** (Königsberg, arbres, coloriage, V − E + F = 2 avec X, réseaux d'Ising de T′), tiroirs niveau compétition, ζ de Riemann en horizon.
- **Format nouveau** : ✅ **les expéditions** (batch 15) — problèmes rédigés multi-étapes à indices progressifs (voir Z).

### Z. Le sommet : problèmes de niveau HLE ✅ (le mode examen existe)
- **✅ Fait (batch 11)** : **le Défi du jour** (`pages/Quest.tsx` + `core/quest.ts`) — 5 exercices tirés déterministiquement (même jour = même défi) dans **tout le parcours**, un par phase, **mode examen sans indices**, chrono, série de jours consécutifs + record en localStorage. La révision espacée à l'échelle du curriculum entier est en place.
- **Contenu** : problèmes multi-domaines de niveau expert mêlant les stations (ex. : une intégrale qui demande résidus (Q) + symétrie (X) ; une question de physique demandant Lagrangien (U) + analyse dimensionnelle (I)). Générateur de « défis du jour » tirant dans tout le curriculum (révision espacée à l'échelle du parcours entier).
- **Critère de réussite** : prendre une vraie question publique du HLE (maths/physique) et disposer, dans l'app, de toutes les stations nécessaires pour la comprendre *et* la résoudre.
- **✅ aussi (batch 15)** : **les expéditions** (`content/expeditions.ts` + `pages/Expedition.tsx`) — problèmes **rédigés multi-étapes** avec récit, indices **progressifs** (du coup de pouce à la quasi-solution, champ `hints[]` sur `Exercise`) et épilogue. Trois expéditions : 🕵️ *L'interception* (casser RSA-15 : φ par gestes → clé privée → déchiffrement), 🌉 *Le pont qui oscille* (EDO du 2ᵉ ordre de bout en bout : ℒ{y″} → table inverse → éléments simples — physique + Laplace), 🌀 *Deux visages de la rotation* (R·(2,1) et i·(2+i) donnent le même point : matrices ↔ complexes prouvé à la main).
- **✅ aussi (batch 16)** : **l'art de la preuve** (`content/preuves.ts` + `core/rules/preuves.ts`, Phase 18) — les trois grandes techniques ramenées à leur unique geste mécanique, la **substitution** (`['Subst', corps, variable, valeur]`, tête opaque) : **récurrence** (les dominos — instancier P(1), injecter l'hypothèse P(k) ; sim `DominoesExplorer`), **absurde** (√2 irrationnel : injecter a = 2c dans a² fait surgir la contradiction), **tiroirs** (le pourquoi des collisions modulaires). Premier pas vers la rédaction : « supposons P(k) » = « écris l'hypothèse à la place ».
- **✅ aussi (batch 17)** : deux expéditions de plus — 🏺 *La tablette de Babylone* (√2 comme un scribe : Pythagore → point fixe de Héron → un pas de Newton) et 🌡️ *La flèche du temps* (Ω comptés, additivité par le log, 2¹⁰⁰ face à l'âge de l'univers).
- **Format** : ✅ mode examen (sans indices — le Défi du jour) · ✅ problèmes multi-domaines rédigés à indices progressifs (les expéditions) · ✅ techniques de preuve par gestes (récurrence/absurde/tiroirs) · ⏳ rédaction libre assistée, auto-évaluation.

---

## Paliers techniques (besoin avant solution)

| Palier | Déclencheur | Statut |
| --- | --- | --- |
| Cours riches + KaTeX effectif (`CourseBlock`, `CourseView`) | Stations I+ : impossible d'écrire un vrai cours en `string[]` | ✅ |
| 3D canvas maison (projection + painter's algorithm) | Station M : surfaces z=f(x,y) — ~1000 quads, 60 fps garanti sans lib | ✅ |
| Three.js/WebGL | Scènes 3D complexes (W : espace-temps, champs 3D denses) | ⏳ |
| Type `Complex` + règles associées dans le moteur | Station Q | ✅ (`i` + cycle iⁿ + Euler + produit (a+bi)(c+di) par gestes + conjugué `Conj` + module z·z̄ — batch 14) |
| Règles de dérivation/intégration symboliques gestuelles | Stations G/H complètes, prérequis U/V | ✅ dérivation + chaîne + parties + substitution linéaire · ⏳ changement de variable général · ✅ `Taylor` qui se déplie terme par terme + troncature `≈` (H′, batch 17) |
| Objets non numériques (permutations, matrices dans l'AST) | Stations K (manipuler Av=λv), X | ✅ matrices (`Mat2`/`Vec2`, batch 9) · ✅ symétries D₄ (`Compose`/`Inv`, batch 12) · ⏳ permutations Sₙ en notation cyclique (X) |
| Web Workers pour le CAS | Si une vérification d'équivalence bloque l'UI (> ~50 ms) — pas observé à ce jour | ⏳ |
| Fluide 2D temps réel (TS pur d'abord) | Station S | ✅ (« stable fluids » 64×64, TS pur, 60 fps) |
| WASM | Uniquement si le fluide S ou les scènes W saturent le TS pur — **toujours pas justifié** | ⏳ |
| Curve fitting sur données réelles (style Tracker) | Station S (méthode scientifique complète) | ⏳ |
| Mode « quête » multi-étapes, mode examen | Stations Y, Z | ✅ mode examen (Défi du jour, batch 11) · ✅ expéditions à indices progressifs (batch 15) · ✅ techniques de preuve par gestes (`Subst`, batch 16) |
| Simulation à 2 corps (canvas 2D, intégrateur symplectique) | Station F : orbites de Kepler | ✅ (`OrbitExplorer`, batch 17) |
| Monte-Carlo en TS pur (Metropolis, Ising) | Station T′ | ✅ (`IsingExplorer` 100×100, TS pur, batch 17) |
| Visuels dans le cours + « devine d'abord » + analogies | Toutes les stations : manipuler pendant qu'on lit, prédire avant de voir | ✅ (blocs `sim`, `predict`, callout `analogy` ; registre unique `SimView`, batch 17) |
| Entrée micro (WebAudio `AnalyserNode`) | Station O : la FFT d'un vrai son | ⏳ |

## Principes pédagogiques permanents

1. **Geste avant formule** : chaque concept se manipule avant de se formalise.
2. **Spirale** : + devient somme vectorielle (J), série (H′), superposition d'états (V) ; × devient produit scalaire (J), composition de matrices (K), convolution (O/P), produit tensoriel (V, W) ; le log (C) devient l'entropie (T′) ; la non-commutativité (K, X) devient le principe d'incertitude (V) ; la substitution (Phase 18) devient le changement de variable (H). On le dit explicitement à chaque retour.
3. **L'erreur rebondit, elle ne punit pas** : rebond + indice, jamais de rouge.
4. **Chaque équation a une histoire** : qui, pourquoi, et le cas limite qui la rend évidente (station I appliquée partout).
5. **Exact avant approché** : ln 5 reste ln 5 ; le calcul numérique est un choix, jamais un automatisme.
6. **Révision espacée** : les stations terminées repassent en « À réviser » ; à terme, les défis Z puisent dans tout le parcours.

---

## Correspondance avec le plan Gemini

Le fichier `Plan_d'apprentissage_Maths-Physique_Universitaire.md` décrit six phases, une méthodologie (« Street-Fighting ») et trois études de cas. Chaque item y a une station ; les manques repérés le 15 septembre 2026 sont marqués **(ajouté)**.

| Plan Gemini | Stations |
| --- | --- |
| Phase 1 — arithmétique, opérations inverses, carré/racine, fractions, unités, v = d/t | A, B, C, F, I (unités) |
| Phase 2 — balance algébrique, cinématique, puissances/racines/log, échelles log, Pythagore/Thalès, trigo et ses inverses, plan incliné | B (**second degré ajouté**), C, D, F |
| Phase 3 — fonctions, limites, dérivée, intégrale, théorème fondamental, exp↔ln, tan↔arctan | E, G, H, **H′ (ajouté : suites, séries, Taylor)** |
| Phase 4 — rigueur et preuve, algèbre linéaire (inverse, valeurs propres, opérateurs hermitiens) | K (**hermitien ajouté**), X, Z (Phase 18), V |
| Phase 5 — nabla : gradient, divergence, rotationnel, identités | M, N (**Laplacien ajouté**), R |
| Phase 6 — EDO, EDP, Laplace, Fourier, Heisenberg, thermodynamique et mécanique statistique, théorie des graphes | L (**EDP ajoutées**), P, O (**Hilbert et convolution ajoutés**), V, **T′ (ajouté)**, Y (**graphes ajoutés**) |
| Street-Fighting — les six outils de Mahajan | I (**preuves picturales et « grosse part » ajoutées**) |
| Études de cas : Maxwell, Navier-Stokes, Schrödinger | R, S, V |
| Spirale : + → vecteurs → matrices → superposition ; × → scalaire → vectoriel → tensoriel ; groupes ; *Proofs from THE BOOK* | Principe 2, J, K, V, W, X |

**Au-delà du plan** (le plan s'arrête à la licence, la roadmap vise HLE) : Y théorie des nombres et RSA, X groupes et structures, U chaos, W relativité, T′ mécanique statistique, Z expéditions et Défi du jour.
