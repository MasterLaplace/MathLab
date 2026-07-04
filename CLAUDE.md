# LearningApp

Plateforme web d'apprentissage des mathématiques par manipulation directe (style Graspable Math) : on saisit un terme d'une équation et on le fait glisser ; les opérations inverses s'appliquent automatiquement. Contenu pédagogique en français, Phases 1–10 (de l'arithmétique aux méthodes d'expert, algèbre linéaire, multivariable 3D, Fourier, Maxwell, dérivation par gestes, probabilités). **`ROADMAP.md` est la carte maîtresse** : 26 stations A→Z jusqu'au niveau Humanity's Last Exam, avec les paliers techniques. Voir aussi les 3 fichiers `*.md` racine (recherche Gemini).

## Stack

- React 19 + TypeScript + Vite, 100 % client (progression en `localStorage`).
- `@cortex-js/compute-engine` (MathJSON) : vérité sémantique, vérification d'équivalence.
- KaTeX : rendu LaTeX des cours (`CourseView`/`MathText` : blocs `math` + segments `$...$` + `**gras**`) — les équations manipulables sont rendues par notre propre renderer React (`src/components/Equation/`).

## Commandes

- `npm run dev` / `npm run build` / `npm test` (vitest) / `npm run lint` (oxlint)
- Node via nvm : `export PATH=~/.nvm/versions/node/v20.20.2/bin:$PATH`

## Architecture

- `src/core/` — logique pure, **zéro dépendance React**, testée par vitest :
  - `ast.ts` : types MathJSON + navigation par chemin (path).
  - `rules/` : moteur de règles de transformation ; chaque règle produit les manipulations légales pour une sélection donnée. C'est le cœur pédagogique du projet. `derive.ts` : la dérivation par taps (nœud `['D', corps, 'x']` — constante, puissance, linéarité, produit, sin/cos/exp/ln).
  - `engine.ts` : wrapper compute-engine (équivalence, simplification). `reachesGoal` : garde structurelle si l'expression contient `D` (sinon le CAS dériverait à la place de l'élève) ; `strictGoal` sur un exercice = comparaison structurelle seule (pour les exercices dont le but EST le calcul, ex. p = 3/6 → 0,5).
  - `progress.ts` : progression + localStorage.
- `src/components/Equation/` — renderer AST → React (chaque nœud porte `data-path`) + couche drag (Pointer Events natifs, machine à états idle/dragging/drop/rebound).
- `src/components/Graph/` — graphe canvas des deux côtés d'une équation ; l'intersection (= solution) reste immobile pendant les manipulations.
- `src/components/Physics/` — simulations et explorateurs canvas : cinématique 1D, tangente, aire, champ de vecteurs (+ mode gradient avec potentiel en fond), ressort (EDO), vecteurs 2D draggables, matrice 2×2 (grille transformée, det, vecteurs propres), série de Fourier (Gibbs visible), `Surface3D` (renderer 3D canvas maison : projection yaw/pitch + painter's algorithm — pas de Three.js tant que ça suffit), cercle unité (sin/cos déroulés), champ de directions d'EDO (clic = condition initiale, RK2), planche de Galton (binomiale), Bayes (population 10 000 points).
- `src/components/Lesson/CourseView.tsx` — rendu des cours riches (`CourseBlock` : p / math / example / callout idea|warn|story).
- `src/content/` — les leçons sont des **données** typées (`schema.ts`), pas du code. 34 leçons, Phases 1–10 (`lessons.ts` = Phases 1–5, `phases678.ts` = Phases 6–9, `complements.ts` = compléments D/G/L + Phase 10 probabilités).
- `src/pages/` — Accueil (carte de progression), Lesson, Playground (chargé en lazy : MathLive est lourd).
- `src/core/sound.ts` + `prefs.ts` — sons WebAudio synthétisés, thème clair/sombre, préférences localStorage.
- `.github/workflows/` — CI (lint+test+build) et déploiement GitHub Pages (base `./` + hash routing : aucun rewrite nécessaire). Activer Settings → Pages → Source « GitHub Actions » une fois le repo créé.

## Principes

- Toute mutation d'AST issue d'un geste doit être validée : règle applicable + équivalence vérifiée via compute-engine.
- Geste illégal → rebond visuel + indice, jamais de message d'erreur punitif.
- Garder `core/` exhaustivement testé (matrice de cas légal/illégal par règle).
- Tout nouvel exercice avec `goal` doit être vérifié résoluble par gestes en headless (script BFS sur `legalMoves`+`reachesGoal`, cf. scratchpad `verify-new-lessons.ts`) ; le LaTeX des cours se vérifie via `katex.renderToString({throwOnError:true})`.
- Besoin avant solution : chaque palier technique (3D, workers, WASM…) n'entre que quand une station de `ROADMAP.md` l'exige.
