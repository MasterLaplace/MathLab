# MathLab

Apprendre les mathématiques et la physique **en les manipulant** : on attrape un terme
d'une équation, on le fait glisser de l'autre côté du `=`, et l'opération inverse
s'applique automatiquement (style Graspable Math). Chaque leçon combine un cours
soigné (LaTeX), des gestes validés sémantiquement, et une visualisation interactive
(graphes, champs de vecteurs, matrices, surfaces 3D, séries de Fourier…).

- **[ROADMAP.md](ROADMAP.md)** — le parcours complet, 26 stations de A (arithmétique)
  à Z (niveau [Humanity's Last Exam](https://agi.safe.ai/)), et les paliers techniques.
- **CLAUDE.md** — architecture et principes du code.
- Les trois autres `*.md` racine sont les rapports de recherche d'origine.

## Lancer

```bash
export PATH=~/.nvm/versions/node/v20.20.2/bin:$PATH   # ou tout Node ≥ 20
npm install
npm run dev
```

`npm test` (vitest, cœur mathématique), `npm run lint` (oxlint), `npm run build`
(app 100 % statique — la progression vit dans `localStorage`, aucun backend).

## Principes

1. **Geste avant formule** : chaque concept se manipule avant de se formaliser.
2. Toute transformation est **validée deux fois** : règle pédagogique applicable,
   puis équivalence vérifiée par `@cortex-js/compute-engine` (MathJSON).
3. Geste illégal → rebond + indice. Jamais de message d'erreur punitif.
4. Rien n'est calculé à la place de l'élève : « Calculer » est un geste, et les
   formes exactes (ln 5, 5/6) sont préservées.
