# Plumiverse

Arcade éducative pour les enfants de 3 à 14 ans, en **français, anglais, allemand et espagnol**. Avec Plume, la chouette.
Gratuite, sans publicité, sans compte : les profils restent sur l'appareil. Hébergée sur GitHub Pages.

- Spécification complète : [docs/SPEC.md](docs/SPEC.md)
- Version précédente (V2, « Les Petits Jeux ») : dépôt `petits-jeux`

## Lancer en local

```bash
npm install
npm run dev        # http://localhost:5180/plumiverse/fr/
npm test           # tests de la logique et des contenus (Vitest)
npm run build      # site prêt à publier dans dist/
```

`npm run dev` et `npm run build` génèrent d'abord les pages (`scripts/pages.ts`) : une application par langue
(`/fr/`, `/en/`, `/de/`, `/es/`), une page SEO par jeu et par langue, la confidentialité, le sitemap.

## Publier

Aujourd'hui (sans GitHub Actions) : `npm run deploy` construit le site et le pousse sur la branche `gh-pages`,
servie par GitHub Pages à `https://sajirk.github.io/plumiverse/`.

Déploiement automatique (tests + build à chaque push sur `main`) : le fichier est prêt dans `scripts/deploy-workflow.yml`.
Pour l'activer : `gh auth refresh -s workflow`, copier le fichier dans `.github/workflows/deploy.yml`, pousser, puis régler
GitHub Pages sur « GitHub Actions » (Settings → Pages).

Avec un domaine personnalisé : `SITE=https://plumiverse.app BASE=/ npm run deploy`.

Statistiques anonymes (facultatives) : créer un compte GoatCounter gratuit et construire avec `VITE_GOATCOUNTER=<code>`.
Elles ne partent que si un parent les active dans l'espace parent.

## Voix naturelles (Azure Neural, générées une fois)

```bash
AZURE_SPEECH_KEY=xxxx AZURE_SPEECH_REGION=westeurope npm run audio
npm run audio -- --dry     # compter ce qui manque sans rien générer
```

Toutes les phrases que l'application peut dire sont listées par `src/audio/phrases.ts` (≈ 1 100 par langue,
≈ 85 000 caractères au total : bien en dessous de l'offre gratuite Azure F0). Les fichiers MP3 sont écrits dans
`public/audio/<langue>/` et commités. Sans fichier, la meilleure voix du navigateur prend le relais.
Les 4 voix sont réglées dans `src/audio/voices.ts`.

## Ajouter un jeu

1. Un dossier `src/games/<id>/` avec `game.ts` (la mécanique) et, si besoin, `logic.ts` (logique pure, testée).
2. Un parcours : chapitres (Facile → Expert) et niveaux, chaque chapitre se termine par une épreuve (`boss: true`).
3. Tous les textes dans les 4 langues (`L("…", "…", "…", "…")`).
4. L'aide `round.setHintTarget(...)` : c'est la main 👆 de l'enfant, et le chemin du robot de test.
5. L'ajouter dans `src/games/index.ts`. Les tests vérifient le parcours, les traductions, et qu'on peut le finir.

## Robot de test (navigateur)

Avec `npm run dev`, sur une page `/fr/` (ou `/en/` pour tester le cours de français) :

```js
await import("/plumiverse/tests/robot.js");
await robot.start([{ game: "calcul", age: 9 }, { game: "langue-en", age: 4 }]);
robot.summary();   // chaque niveau doit être « OK ⭐3 »
```

## Structure

```
src/core/     moteur pur et testé : profils, progression, révisions espacées, trophées, parent, i18n, stockage
src/kit/      le kit de jeu (barre, voix, aide, particules, étoiles)
src/audio/    voix (fichiers + secours navigateur), bruitages, liste des phrases
src/games/    un dossier par jeu
src/content/  textes de l'interface (4 langues) et cours de langue
src/ui/       écrans : premier lancement, qui joue, accueil, carte des niveaux, fin, trophées, espace parent
scripts/      pages (SEO), voix (Azure)
tests/        Vitest + robot.js
```

Développé par Sajir Khenissi.
