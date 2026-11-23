# Plumiverse — spécification produit et technique (V3 des Petits Jeux)

> Arcade éducative premium pour les 3-14 ans, en français, anglais, allemand et espagnol. Avec Plume, la chouette.
>
> **Nouveau projet** : dossier `~/Workspaces/plumiverse`, nouveau dépôt Git. La V2 (`petits-jeux`) reste en ligne, figée.
> Hébergement **gratuit sur GitHub Pages** (décision ferme).
>
> **Décisions prises (23/11/2026)** : nom Plumiverse · mascotte Plume · TypeScript + Vite + PWA + IndexedDB · GitHub Pages ·
> 4 langues d'interface et 4 langues à apprendre · voix Azure Neural pré-générée (4 voix) · statistiques GoatCounter.

## 1. Nom et identité (décidé)

### 1.1 Nom : **Plumiverse**

- **Pourquoi** : c'est « l'univers de Plume ». Il garde la mascotte que les enfants connaissent déjà, il se dit pareil en français, anglais, allemand et espagnol, et il ne fait pas « bébé » (un univers, pas une garderie).
- **Pas de conflit trouvé** (22-23/11/2026) : nom de compte GitHub libre, `plumiverse.com`, `.app`, `.fr` libres. À l'inverse, `plumiverse.com` est un bar virtuel pour adultes, et Kidora / PlayNest sont déjà des produits pour enfants (application Kidora, PlayNest® de Galt).
- Marque : recherche INPI / EUIPO à faire avant d'acheter le domaine (non bloquant pour coder).

### 1.2 Mascotte : **Plume**, la chouette

- Elle guide, elle ne juge jamais. Elle parle avec la voix de la langue choisie.
- Elle « grandit » avec l'enfant : chez les Pousses, grosse chouette ronde qui danse ; chez les 12-14 ans, petit badge discret dans un coin, qui donne des indices seulement quand on les demande.

### 1.3 Ton et positionnement

- **Premium** : sobre, aéré, des animations douces, aucune publicité, aucun achat, aucun bouton qui clignote pour retenir l'enfant.
- **Éducatif d'abord** : chaque jeu dit ce qu'il fait apprendre (au parent), chaque niveau a un vrai objectif.
- **Chaleureux** : on félicite l'effort, on ne punit jamais l'erreur.
- **Pas enfantin pour les grands** : l'interface change avec la tranche d'âge (§ 2.2). Les 12-14 ans ont un thème sobre (sombre possible), des mots d'adulte, des records et des pourcentages de maîtrise, pas d'autocollants.
- Signature : « Apprendre en jouant, à son rythme. » (FR) · « Learn by playing, at your own pace. » · « Spielend lernen, im eigenen Tempo. » · « Aprende jugando, a tu ritmo. »

## 2. Direction produit et UX

### 2.1 Promesse

- **Enfant** : « Je joue, je monte de niveau, je gagne des trophées. »
- **Parent** : « Je vois ce qu'il apprend vraiment, sans pub, sans données qui partent ailleurs. »
- **Produit** : un moteur de jeux + des **parcours** de contenu. Ajouter un jeu ou 20 niveaux ne demande pas de toucher au socle.

### 2.2 Quatre tranches d'âge, une seule application

L'interface s'adapte à la tranche du profil : on ne montre pas la même chose à 4 ans et à 13 ans.

| Tranche | Âge | Lecture | Interface | Récompenses |
|---|---|---|---|---|
| 🌱 **Pousses** | 3-5 | aucune | très grosses cibles, voix partout, 6 jeux max à l'écran, pas de texte utile | autocollants, Plume qui danse, pas de série de jours |
| 🔭 **Explorateurs** | 6-8 | débutant | voix + texte court, icônes | étoiles, trophées, niveaux |
| 🧭 **Aventuriers** | 9-11 | lecteur | texte normal, voix à la demande | XP, trophées, séries de jours |
| 🚀 **Experts** | 12-14 | lecteur | interface sobre « app de grand », thème sombre possible, voix optionnelle | XP, classement personnel (records), maîtrise en % |

Le filtre d'âge du catalogue (en haut de l'accueil) montre par défaut la tranche du profil, mais on peut ouvrir « tous les jeux ».

### 2.3 Écrans (dans l'ordre du parcours)

1. **Qui joue ?** Les avatars des profils + « ➕ ». Un appui = on entre. Rien d'autre.
2. **Accueil du profil**
   - En haut : avatar, niveau du joueur, barre d'XP, 🔥 série de jours (pas chez les Pousses).
   - **« Ma quête du jour »** : 3 activités choisies par le moteur (1 à réviser, 1 à continuer, 1 nouveauté).
   - **Langues** : une carte par langue apprise, avec son niveau.
   - **Catalogue** par catégorie (§ 4.6), filtré par âge.
   - Ruban **NOUVEAU** sur les jeux de la dernière version, et une bulle « Quoi de neuf ? » une seule fois par version.
3. **Fiche d'un jeu** : la carte des niveaux (chemin à la Mario : chapitres, cadenas, étoiles), et le gros bouton « Continuer ».
4. **Jeu** : le kit V2 (barre, voix, aide 👆, fin), plus la difficulté **dans** la progression (§ 4.4).
5. **Fin de niveau** : étoiles, XP gagnée, trophée éventuel, « Niveau suivant » en gros.
6. **Mes trophées** : la vitrine (gagnés en couleur, à gagner en ombre avec un indice).
7. **Espace parent**, derrière une porte parent (§ 4.8) : progression par profil, réglages, langues, sauvegarde.

### 2.4 Règles d'UX (toutes tranches)

- Un écran = une action principale, en gros.
- Retour à l'accueil toujours au même endroit, sans perte : la progression s'enregistre à chaque niveau.
- Jamais d'échec bloquant : on peut toujours rejouer un niveau, et chez les Pousses on ne peut pas « perdre ».
- Les cadenas expliquent comment s'ouvrir (« Gagne 2 étoiles au niveau 4 »), en voix et en image.
- Les règles V2 restent valables : cibles ≥ 64 px chez les Pousses (≥ 48 px chez les Experts), voix française, rien de faux enseigné, une vraie fin.
- Design : on garde les tokens V2 (couleurs, rayons, ombres) et on ajoute un thème par tranche (couleurs plus sobres pour les 12-14 ans). Illustrations : un seul style SVG cohérent (on remplace petit à petit les emojis des grands jeux, qui s'affichent différemment selon l'appareil).

---

### 2.5 Entrée des tout-petits (3-5 ans) : comprendre en moins de 10 secondes, sans lire

Premier lancement (le parent est souvent là, mais l'enfant doit pouvoir faire seul) :

1. **0 s** : écran plein, Plume au centre qui fait coucou. Rien d'autre. Elle dit (voix, langue de l'appareil) : « Bonjour ! Touche-moi ! » et **pulse** avec une main 👆 animée sur elle.
2. **Toucher Plume** → elle s'envole et pose 4 gros drapeaux ronds 🇫🇷 🇬🇧 🇩🇪 🇪🇸 ; celui de l'appareil brille. « C'est quelle langue chez toi ? » (dans les 4 langues, l'une après l'autre). La plupart du temps l'enfant touche celui qui brille.
3. **Avatar** : 8 gros animaux, Plume : « Choisis ton animal ! ». Un toucher = choisi.
4. **Âge** : des bougies sur un gâteau (3 à 14), Plume compte à voix haute quand on touche. Pour les petits, le parent aide ; on peut passer (âge 5 par défaut).
5. **Prénom** : facultatif, réservé au parent (clavier), bouton « Passer » très visible. L'animal sert de nom en attendant.
6. **Premier jeu immédiat** : pas de catalogue. Plume : « On joue ? » et lance directement un niveau 1 très facile adapté à l'âge (Bulles des couleurs pour 3-5 ans). Gagner tout de suite = l'enfant a compris le principe « toucher → ça réagit → bravo ».
7. **Retour à l'accueil** : chez les Pousses, l'accueil est une **grande île** avec 6 bulles-jeux maximum (images, pas de texte), Plume au milieu. Toucher une bulle = le jeu commence (pas de carte de niveaux : le moteur choisit le bon niveau tout seul).

Règles des Pousses : aucun texte nécessaire, aucune décision à plus de 4 choix, chaque écran dit lui-même quoi faire (voix + main 👆) au bout de 3 s sans action, et l'enfant ne peut pas « sortir » par erreur (le bouton maison demande un appui long de 1 s).

### 2.6 Accueil des grands (9-14 ans)

Pas d'île : un tableau de bord sobre (quête du jour, parcours en cours avec % de maîtrise, langues, trophées), un catalogue filtrable par catégorie et par âge, une recherche.

## 3. Architecture technique (décidée)

### 3.1 Décisions

| Sujet | Décision | Pourquoi |
|---|---|---|
| Hébergement | **GitHub Pages**, gratuit. Dépôt `sajirK/plumiverse` → `https://sajirk.github.io/plumiverse/`, puis domaine personnalisé (`plumiverse.app`) quand il sera acheté. Déploiement par **GitHub Actions** à chaque push sur `main` (build Vite → Pages). | Gratuit, déjà maîtrisé, HTTPS inclus. Tout le produit est statique : aucun serveur à payer. |
| Front | **TypeScript + Vite**, sans framework. | Les jeux sont du DOM et du canvas. TypeScript protège les données, Vite donne modules, fichiers versionnés, tests (Vitest). |
| Application | **PWA** : installable sur l'écran d'accueil, fonctionne hors ligne (service worker). | Jeu en voiture, en train ; ressenti « vraie app ». |
| Navigation | Une application par langue (`/fr/`, `/en/`, `/de/`, `/es/`), routes internes en `#/…` (compatible GitHub Pages, pas de 404). | GitHub Pages ne sait pas réécrire les URL ; le `#` évite tout problème. |
| SEO | **Pages statiques générées au build** pour chaque langue et chaque jeu (`/fr/jeux/ecrire/`, `/en/games/writing/`…) : titre, description, `hreflang`, données structurées, image de partage, `sitemap.xml`, `robots.txt`. Le contenu est dans le HTML. Bouton « Jouer » vers l'application. | Les moteurs lisent le HTML, pas les routes `#`. |
| Données enfants | **Sur l'appareil uniquement**, IndexedDB, schéma versionné, export / import en fichier. | Aucune donnée d'enfant ne part : argument n° 1 pour les parents, et rien à héberger. |
| Statistiques | **GoatCounter** (gratuit pour un usage non commercial, sans cookie, européen dans l'esprit, conçu pour les sites statiques). Événements personnalisés anonymes. Activables par le parent. | GitHub Pages n'a pas de serveur : GoatCounter tient le rôle du backend de statistiques et fournit le tableau de bord. |
| Admin | **Tableau de bord GoatCounter** (connexion privée) + page `admin.html` du site qui lit l'API GoatCounter avec une clé saisie à la main (jamais dans le dépôt) pour les vues propres au jeu (taux de fin par niveau, langues, âges). | Privé, gratuit, sans serveur. |
| Voix | **Fichiers audio Azure Neural générés à l'avance** (§ 5), servis par GitHub Pages. | Voix naturelle, coût nul à l'usage, hors ligne. |
| Tests | Vitest (logique, contenus, traductions), **robot dans le navigateur** (comme en V2) qui joue tous les niveaux de tous les jeux, en mobile et en bureau. | Le robot V2 a prouvé son utilité. |

> Pas de comptes, pas de base de données, pas de serveur : c'est un choix, pas une limite. La synchronisation entre appareils passe par l'export / import (fichier ou QR code), chiffrée, sans serveur.

### 3.2 Deux projets séparés

| | V2 `petits-jeux` | V3 `plumiverse` |
|---|---|---|
| Dossier | `~/Workspaces/petits-jeux` | `~/Workspaces/plumiverse` |
| Adresse | `sajirk.github.io/petits-jeux` | `sajirk.github.io/plumiverse` puis `plumiverse.app` |
| Statut | figée, en ligne | développement actif |

**Reprise des sauvegardes V2** : les deux sites sont sur le **même domaine** (`sajirk.github.io`), donc Plumiverse peut lire directement les anciennes données `jeux.*` au premier lancement et proposer : « On a retrouvé la progression de Toto 🦊 : on la reprend ? ». (Plus tard, avec un domaine personnalisé, ce sera un lien d'export depuis la V2.)

### 3.3 Structure du dépôt

```
src/
  core/        logique pure, sans DOM, testée : profils, progression, maîtrise, Leitner, trophées, quête du jour, i18n, stats
  kit/         le kit de jeu (barre, voix, aide 👆, particules, fin, glisser), porté de la V2
  audio/       lecteur de sons et de voix (fichiers + secours Web Speech)
  ui/          écrans : premier lancement, qui joue, accueil, carte des niveaux, trophées, espace parent
  games/<id>/  un dossier par jeu : game.ts (mécanique), logic.ts (pur, testé), track.ts (parcours)
  content/     textes et contenus par langue (fr, en, de, es) : interface, consignes, mots, histoires
public/audio/  sons générés, un fichier par phrase et par langue (nom = empreinte du texte)
scripts/       build-audio (Azure), prerender (pages SEO), release
tests/         Vitest ; robot.js pour le navigateur
```

### 3.4 Le contrat d'un jeu

```ts
export default defineGame({
  id: "ecrire", category: "lire-ecrire", ages: [3, 9], skills: ["graphisme", "orthographe"],
  track,                        // chapitres et niveaux (données)
  start(level, round) { … },    // une manche, comme en V2
});
```

### 3.5 Statistiques (GoatCounter) et vie privée

- Mesures anonymes actuelles : écrans consultés dans l'application, langue de l'interface à la création d'un profil, début d'un jeu, et fin d'un niveau avec le jeu, le niveau et les étoiles. Aucun prénom, âge ou identifiant de profil n'est envoyé. Ne jamais transmettre le hash complet : les écrans de profil parent sont tous regroupés sous `parent`. Ne pas ajouter d'identifiant stable ; la mesure distante reste globale.
- **Désactivé par défaut**, activable dans l'espace parent (« Aider à améliorer Plumiverse ») : le plus prudent pour un public d'enfants. La page d'accueil publique (SEO, visiteurs) compte les visites sans cookie.
- Pages « Confidentialité » et « Mentions légales » dans les 4 langues. (Ceci n'est pas un avis juridique.)

## 4. Spécification du système

### 4.1 Profil

```ts
type Profile = {
  id: string;                    // aléatoire, local
  name: string;                  // prénom ou surnom (jamais envoyé)
  avatar: string;
  birthYear: number;             // on stocke l'année, on affiche l'âge
  ageBand: "3-5" | "6-8" | "9-11" | "12-14";   // calculée, modifiable par le parent
  uiLang: "fr" | "en" | "de" | "es";    // langue principale : interface + voix
  learning: ("fr" | "en" | "de" | "es")[];      // langues apprises (pas la principale)
  createdAt: string;
  settings: { voice: boolean; sounds: boolean; reduceMotion: boolean };
  progress: Record<GameId, GameProgress>;
  langs: Record<LangCode, LangProgress>;
  mastery: Record<SkillId, number>;             // 0 → 1
  trophies: Record<TrophyId, string>;           // date d'obtention
  xp: number;
  streak: { current: number; best: number; lastDay: string; freezes: number };
  seenVersion: string;                          // pour « quoi de neuf »
};
type GameProgress = {
  levels: Record<LevelId, { stars: 0 | 1 | 2 | 3; best?: number; tries: number; last: string }>;
  current: LevelId;
};
```

- Jusqu'à 6 profils par appareil. Suppression d'un profil seulement depuis l'espace parent.
- **Reprise de la V2** : via le lien « Emporter ma progression » (§ 3.2), les données `jeux.*` deviennent un premier profil (prénom, avatar, autocollants, niveau choisi par jeu → point de départ du parcours).

### 4.2 Âge

- L'âge place le profil dans une tranche (§ 2.2) : thème, taille des cibles, quantité de texte, voix automatique ou non.
- Chaque jeu a une plage d'âge conseillée. Le catalogue montre d'abord les jeux de la tranche, puis « Pour aller plus loin » (au-dessus) et « Pour réviser » (en dessous).
- L'âge choisit **le point de départ** dans chaque parcours (§ 4.5), jamais une limite.

### 4.3 Difficulté : 4 paliers, partout

| Palier | Couleur | Pour qui (repère) | Principe |
|---|---|---|---|
| 🟢 **Facile** | vert | 3-5 ans | peu de choix, aide visible, pas de temps |
| 🟡 **Moyen** | jaune | 6-8 ans | choix normaux, aide si on hésite |
| 🔴 **Difficile** | rouge | 9-11 ans | plus de choix, pièges, un peu de temps |
| 🟣 **Expert** | violet | 12-14 ans | contenu de collège, temps, sans aide |

**Changement clé par rapport à la V2 : le palier n'est plus un réglage, c'est un chapitre du parcours.** On ne « choisit » pas Difficile : on y arrive en réussissant Moyen (ou on y est placé par son âge).

### 4.4 Progression : parcours → chapitres → niveaux

```
Jeu
 └─ Parcours (une compétence, ex. « Écrire »)
     ├─ Chapitre 1  🟢  Les lettres en bâtons        niveaux 1…8   + épreuve ⭐
     ├─ Chapitre 2  🟢  Les lettres rondes           niveaux 1…8   + épreuve
     ├─ Chapitre 3  🟡  Mes premiers mots            …
     └─ …
```

- **Niveau** : une partie courte (3 à 8 manches) avec des paramètres précis (données). Résultat en étoiles (V2 : 3 sans erreur, 2 pour 1-2 erreurs, 1 sinon ; certains niveaux ajoutent un temps).
- **Déblocage**
  - Niveau suivant : ouvert dès 1 ⭐.
  - **Épreuve de chapitre** (le « boss ») : ouverte quand tous les niveaux du chapitre ont ≥ 1 ⭐. Elle mélange tout le chapitre.
  - Chapitre suivant : ouvert quand l'épreuve est réussie avec ≥ 2 ⭐.
  - Le parent peut tout ouvrir (espace parent). L'enfant peut toujours rejouer ce qui est ouvert.
- **Ajustement pendant le niveau** (dans les bornes du niveau, invisible) : après 2 erreurs de suite, la manche suivante est un cran plus facile (moins de choix, aide 👆) ; après 4 réussites rapides de suite, un cran plus difficile. Les étoiles comptent normalement.
- **Révisions** : la quête du jour propose de rejouer un niveau réussi il y a longtemps ou avec 1 ⭐ (répétition espacée : J+1, J+3, J+7, J+21).
- **Maîtrise** (pour le parent) : chaque niveau nourrit des compétences (`skills`). Maîtrise = moyenne pondérée des dernières réussites. L'espace parent montre « Lettres en bâtons : maîtrisé ✅ », « Mots de 2 syllabes : en cours 60 % ».

Définition d'un niveau (exemple) :

```ts
{ id: "ch3-n2", tier: "moyen", skills: ["mots-simples"], rounds: 5,
  params: { kind: "word", words: "cv-2syll", guide: "dotted", tol: 13 },
  stars: { time: null } }
```

### 4.5 Point de départ et placement

- Au premier lancement d'un jeu : départ conseillé par l'âge (ex. 7 ans → chapitre 3 d'« Écrire »), mais le profil reste « dans » le parcours.
- Option « Mini-test » (Aventuriers et Experts) : 3 à 5 questions qui sautent les chapitres déjà sus (on débloque ce qui est réussi).
- Si un enfant échoue 3 fois l'épreuve d'un chapitre, Plume propose de revenir au chapitre d'avant (jamais automatique).

### 4.6 Catégories (catalogue)

| Catégorie | Contenu |
|---|---|
| ✏️ **Lire & écrire** | graphisme, lettres, sons, syllabes, mots, phrases, orthographe, grammaire |
| 🔢 **Maths** | nombres, calcul, monnaie, heure, géométrie, fractions, problèmes |
| 🌍 **Langues** | anglais, allemand, français (langue apprise), espagnol plus tard |
| 🧠 **Logique & code** | suites, mémoire, programmation, énigmes |
| 🔬 **Sciences** | vivant, corps humain, matière, énergie, espace |
| 🏛️ **Histoire & géo** | frise du temps, civilisations, cartes, pays, drapeaux |
| 💛 **Émotions & bien-être** | émotions, respiration, météo du jour |
| 🎮 **Arcade** | jeux d'action qui font réviser n'importe quelle catégorie (§ 6.2) |
| 🎨 **Créer** | dessin, musique |

### 4.7 Trophées, XP et motivation

- **XP** : 10 par étoile, + 20 par épreuve réussie, + 5 par jour joué. **Niveau du joueur** 1 → 50 (courbe douce : chaque niveau demande un peu plus).
- **Trophées** (≈ 60 au lancement), en 5 familles :
  - Découverte : jouer à 5 / 10 / 20 jeux différents.
  - Maîtrise : finir un parcours, avoir 3 ⭐ partout dans un chapitre.
  - Régularité : 3 / 7 / 30 jours (pas chez les Pousses).
  - Langues : 50 / 200 / 500 mots appris, premier niveau A1.
  - Secrets : quelques trophées cachés et drôles (« Trancher 100 fruits sans chaussette »).
- **Séries de jours** : 🔥 visible à partir de 6 ans ; 1 « gel » gagné par semaine (un jour manqué ne casse pas la série). Pas de notification culpabilisante.
- **Nouveautés** : à chaque version, la bulle « Quoi de neuf ? » (texte et voix, 3 points max) et le ruban NOUVEAU pendant 30 jours.
- **Pas** de monnaie à dépenser, pas de boutique, pas de publicité, pas de « vies » qui empêchent de jouer.

### 4.8 Espace parent (simple et rassurant)

**Entrée** : bouton discret « 👪 » en haut à droite (appui long 1 s chez les Pousses), puis une porte parent : une opération écrite en toutes lettres (« trente-sept plus vingt-quatre »), différente à chaque fois.

**Écran 1 — « Comment ça va ? »** (une carte par profil, lisible en 5 secondes) :
- Temps de jeu aujourd'hui / cette semaine (petite barre par jour).
- **Ce qu'il sait faire** : les compétences maîtrisées cette semaine, en phrases (« ✅ Écrit les lettres en bâtons », « ✅ Connaît 40 mots d'anglais », « 🔄 Les tables de 6 et 7 : en cours, 65 % »). C'est la progression réelle, calculée par la maîtrise (§ 4.4), pas les étoiles.
- **Ce qui coince** : les 2 compétences où il échoue le plus, avec un conseil (« Les sons “on / an” : lire ensemble des mots à voix haute »).

**Écran 2 — Détail d'un profil** : chaque parcours avec sa barre (chapitre, maîtrise %), chaque langue (niveau CECRL, mots appris, série de jours), l'historique des 30 derniers jours.

**Écran 3 — Réglages du profil** :
- **Bloquer** des catégories ou des jeux précis (interrupteurs). Un jeu bloqué disparaît de l'accueil de l'enfant.
- **Temps de jeu** : limite par jour (aucune / 15 / 30 / 45 / 60 min). Avant la fin, Plume prévient (« Encore 5 minutes ! »), à la fin elle termine le niveau en cours puis montre un écran calme « À demain ! » (déblocage par la porte parent).
- Âge, langue de l'interface, langues apprises, voix et sons, débloquer tous les niveaux.

**Écran 4 — Famille** : ajouter / supprimer un profil, sauvegarde (exporter / importer un fichier), statistiques anonymes (oui / non), confidentialité.

### 4.9 Langues

**Deux notions séparées :**

- **Langue principale** (`uiLang`) : la langue de l'interface, des consignes et de la voix. **FR, EN, DE, ES** dès le lancement.
- **Langues apprises** (`learning`) : **FR, EN, DE, ES**, toutes les combinaisons (on n'apprend pas sa langue principale).

**Interface multilingue** : 100 % des textes dans `content/<lang>/*.json`, pour les **4 langues**. Test automatique : aucune clé manquante dans aucune langue, aucun texte en dur dans le code. Les traductions sont écrites pour des enfants (pas de traduction mot à mot) et relues par langue. Les contenus pédagogiques propres à une langue (syllabes, lecture, orthographe) existent en version française d'abord ; les parcours « Lire & écrire » EN et DE arrivent ensuite (§ 8).

**Cours de langue (pour une langue apprise)**, aligné sur le CECRL :

| Étape | Niveau | Unités (exemples) |
|---|---|---|
| 1 | Éveil (pré-A1) | couleurs, nombres 1-10, animaux, famille, bonjour / merci |
| 2 | A1.1 | nourriture, corps, vêtements, école, maison, nombres 1-100 |
| 3 | A1.2 | verbes du quotidien, phrases simples (« I like… », « Ich habe… »), heures, jours |
| 4 | A2.1 | passé simple du quotidien, questions, dialogues (magasin, restaurant, chemin) |
| 5 | A2.2 | petites histoires, compréhension, écrire 2-3 phrases |

- **Unité** = 8 à 12 mots ou structures + 5 niveaux d'exercices + une épreuve.
- **Mot** (donnée) : `{ id, image, fr, en, de, es, genre/article par langue, audio par langue }`. Les images sont communes à toutes les langues.
- **Exercices, selon l'âge**
  - Pousses : écouter → toucher l'image (zéro lecture).
  - Explorateurs : écouter → image, image → mot (lecture), mémory son-image.
  - Aventuriers : mot → traduction, construire la phrase avec des tuiles, dictée de mots.
  - Experts : traduire une phrase, conjuguer, compléter un dialogue, compréhension d'un texte court.
- **Révisions espacées** (Leitner, 5 boîtes par profil et par langue) : chaque mot remonte d'une boîte quand il est réussi, retourne en boîte 1 quand il est raté. La session du jour mélange des mots nouveaux et des mots à revoir.
- **Progression par langue** : niveau (étape + unité), mots appris (boîte ≥ 3), 🔥 série propre à chaque langue, trophées de langue.
- **Adaptation au niveau** : le placement (§ 4.5) et la maîtrise choisissent l'unité de départ ; les exercices changent de type quand l'enfant change de tranche d'âge (un enfant de 9 ans débutant fait l'éveil, mais avec des exercices d'Aventurier).
- **Prononciation** : la reconnaissance vocale du navigateur n'existe pas partout (absente de Firefox, partielle ailleurs) → exercice « Répète après Plume » **sans note** (on enregistre, on réécoute sa voix à côté de celle de Plume). Pas de reconnaissance notée en V3.

---

## 5. Voix (décidée) : Azure Neural, générée à l'avance, 4 voix

### 5.1 Décision

- **Azure AI Speech, voix neuronales, offre gratuite F0** (0,5 million de caractères par mois). On génère **une fois** un fichier audio par phrase, sur l'ordinateur du développeur, et GitHub Pages les sert comme des images. Coût à l'usage : zéro. Hors ligne : oui. Même voix sur tous les appareils.
- **Pas Piper** : plus faible en naturel et en intonation, et licences à vérifier voix par voix. Il reste un secours technique, pas le choix.
- **4 voix au total, une par langue**, la même « Plume » partout (voix féminine chaleureuse, claire, un peu lente) :

| Langue | Voix | Réglages |
|---|---|---|
| 🇫🇷 Français | `fr-FR-DeniseNeural` | vitesse 0,92, style chaleureux |
| 🇬🇧 English | `en-GB-SoniaNeural` (anglais britannique, public européen) | vitesse 0,92 |
| 🇩🇪 Deutsch | `de-DE-KatjaNeural` | vitesse 0,92 |
| 🇪🇸 Español | `es-ES-ElviraNeural` | vitesse 0,92 |

  Les 4 voix sont réglées dans un seul fichier (`scripts/voices.json`) : on peut en changer après écoute sans rien casser, il suffit de régénérer.
- **Fluidité** : SSML avec petites pauses entre les phrases, prononciations corrigées (lexique par langue : prénoms des personnages, mots étrangers dans les leçons), volume normalisé, MP3 mono 48 kbit/s, préchargés pour le niveau en cours (aucun délai au toucher).
- **Dans les leçons de langue**, le mot étranger est toujours dit par la voix **de sa langue** (un francophone qui apprend « der Hund » l'entend par la voix allemande), jamais avec l'accent de l'interface.

### 5.2 Ce qui n'est pas généré à l'avance

- **Le prénom** : pas dit par la voix (il est affiché). Option : le parent enregistre le prénom avec sa voix (gardé sur l'appareil).
- **Nombres, heures, monnaie** : petits fichiers enchaînés (« Il est » + « trois heures » + « et quart »).
- **Secours** si un fichier manque : la voix du navigateur, en choisissant automatiquement la meilleure voix de la langue (voix « Premium / Enhanced / Natural / Google » d'abord). Un test bloque la publication s'il manque des sons.

### 5.3 Fabrication

1. Toutes les phrases parlées sont dans `src/content/<langue>/*.json`.
2. `npm run audio` : calcule une empreinte par phrase (texte + voix + réglages) ; si le fichier n'existe pas, appelle Azure (clé dans la variable d'environnement `AZURE_SPEECH_KEY`, jamais dans le dépôt) et l'écrit dans `public/audio/<langue>/`. Puis écrit le manifeste.
3. Les fichiers sont commités : GitHub Pages les sert, le service worker les met en cache langue par langue.

## 6. Revue des jeux actuels et nouveaux jeux

### 6.1 Verdict sur les 36 jeux V2

| Jeu actuel | Verdict | Devient |
|---|---|---|
| J'écris (`tracer`) | 🔁 refondre en parcours | **Écrire** : lettres → mots → phrases (§ 7.1) |
| Les syllabes magiques | 🔁 refondre | **Lire** : sons → syllabes → mots → phrases → petites histoires |
| La Première Lettre + Les Lettres | 🔀 fusionner | chapitres de **Lire** (conscience des sons) |
| Je compte + La Tour des Nombres | 🔀 fusionner | **Nombres** (1 → 1 000, dizaines, centaines) |
| Les Calculs malins | 🔁 refondre | **Calcul** : + − → × ÷ → calcul mental chrono (§ 7.2) |
| La Boulangerie des nombres | ✅ garder, étendre | **Monnaie** : payer → rendre la monnaie → soldes en % |
| La Pizzeria + Le Glacier | 🔀 fusionner | **Le Resto** : commandes, quantités, puis fractions (½ pizza, ¾…) |
| Memory des animaux | ✅ garder | mémoire, contenu tiré de toutes les catégories (et vocabulaire de langue) |
| Les Suites logiques + Trouve l'intrus | ✅ garder | **Logique** : suites → intrus → matrices 3×3 (jusqu'à 14 ans) |
| La Mémoire Musicale | ✅ garder | longueur de mélodie → rythmes → vraies notes |
| Le Petit Robot | 🔁 refondre, jeu phare | **Code** : séquences → boucles → conditions → fonctions (§ 7.3) |
| Devine l'émotion + Histoires d'émotions + Que ferais-tu ? | 🔀 fusionner | **Mes émotions** : un parcours en 3 chapitres |
| Respire avec moi + Ma météo du jour | ✅ garder (libres) | bien-être, sans progression ni étoiles |
| Le tour du monde des animaux | 🔁 refondre | **Géographie** : continents → pays → capitales → drapeaux |
| Quelle heure est-il ? | ✅ garder, étendre | + durées, emploi du temps (8-10 ans) |
| Les saisons et la météo | 🔀 fusionner | chapitre de **Sciences 3-7** (avec Le Jardin) |
| Mon jardin | 🔁 refondre | **Le vivant** : plantes → animaux → chaînes alimentaires |
| Les Couleurs + Les Formes | 🔀 fusionner | **Couleurs & formes** (Pousses), puis géométrie |
| Le Docteur des animaux | ✅ garder (Pousses), étendre | + **Corps humain** pour les 8-12 ans |
| Les Bulles, Tape la Taupe, Tranche les Fruits, Course de Bulles, Le Château, Super Saut Dino | 🔁 refondre en **Arcade éducative** | mêmes mécaniques, mais chacune prend un **pack de questions** (§ 6.2) |
| Réflexe Éclair | ✅ garder | contrôle de soi (go / no-go), règles plus riches pour les grands |
| Je dessine + Le Piano rigolo | ✅ garder (libres) | Créer |

Bilan : 36 jeux → **≈ 24 jeux plus riches**, chacun avec un vrai parcours. Rien n'est supprimé sans être recyclé dans un parcours.

### 6.2 L'idée forte : arcade × contenu

Aujourd'hui les 7 jeux d'action n'apprennent rien. En V3, **chaque mécanique d'arcade accepte un pack de questions** venant de n'importe quelle catégorie :

| Mécanique | Ce qu'on fait | Exemples de packs |
|---|---|---|
| Tranche les fruits | couper seulement les bonnes réponses | multiples de 3, mots anglais d'animaux, verbes |
| Tape la taupe | taper la taupe qui porte la bonne réponse | lettre qui fait le son « ch », capitale de l'Italie |
| Course de bulles | passer par la porte de la bonne réponse | 7 × 8, « der / die / das Hund » |
| Château | ramasser les trésors dans l'ordre | les planètes de la plus proche à la plus lointaine |
| Dino | attraper les lettres pour écrire le mot | mot entendu en anglais |
| Bulles (Pousses) | éclater la bonne couleur / forme / quantité | couleurs, formes, nombres 1-5 |

Le parcours d'un jeu d'arcade = les packs dans l'ordre de difficulté ; la quête du jour propose « Révise tes tables en jouant à la Course de bulles ». **Une mécanique + 30 packs = 30 activités, sans nouveau code.**

### 6.3 Nouveaux jeux (priorité aux 8-14 ans)

**Langues** (priorité haute)

1. **Les mots illustrés** : écouter, toucher l'image ; puis lire, écrire (moteur du § 4.9).
2. **Construis la phrase** : tuiles de mots à remettre dans l'ordre, avec article et accord.
3. **Dictée** : écouter, écrire le mot puis la phrase ; correction lettre par lettre.
4. **Le marché / Le restaurant** : dialogues à choix (commander, demander le prix, le chemin).
5. **Conjugaison** : présent → passé → futur, pour FR / EN / DE, en mode arcade.
6. **Histoires à écouter** : petite histoire + 3 questions de compréhension (A1-A2).

**Sciences**

7. **Le système solaire** : placer les planètes, comparer tailles et distances, ordre, phases de la Lune.
8. **Le corps humain** : organes et squelette à placer, à quoi ils servent, les 5 sens.
9. **Le labo d'électricité** : pile, fils, interrupteur, ampoule ; circuit ouvert / fermé, série / parallèle.
10. **États de la matière** : chauffer / refroidir (glace → eau → vapeur), cycle de l'eau.
11. **Les chaînes alimentaires** : qui mange qui, construire la chaîne puis le réseau.

**Histoire & géographie**

12. **La frise du temps** : placer des événements et des objets dans le temps (§ 7.5).
13. **Civilisations** : Égypte, Grèce, Rome, Moyen Âge : associer objets, bâtiments, inventions.
14. **Pays & capitales** et **Drapeaux** : cartes par continent, puis le monde.

**Maths (9-14)**

15. **Fractions** : partager des pizzas, comparer, additionner des fractions simples.
16. **Les tables** : multiplications en arcade, avec révisions espacées des tables ratées.
17. **Géométrie** : angles (mesurer avec un rapporteur), symétrie, aires par quadrillage.
18. **Problèmes** : petits problèmes illustrés en plusieurs étapes (achats, trajets, recettes).
19. **Nombres relatifs** : le thermomètre, l'ascenseur, la droite graduée.

**Logique & code**

20. **Code** (le Robot refait) : jusqu'aux fonctions (§ 7.3).
21. **Picross / nonogrammes** : 5×5 → 15×15, dessins cachés.
22. **Sudoku** : 4×4 → 6×6 → 9×9, avec indices.
23. **Les blocs qui glissent** : libérer une pièce en faisant glisser les autres (genre classique, niveaux originaux générés et vérifiés comme ceux du Robot).

**Lire & écrire (8-12)**

24. **Les homophones** : a / à, et / est, son / sont… en arcade.
25. **La nature des mots** : colorier nom, verbe, adjectif dans une phrase.
26. **Dactylo** : apprendre à taper au clavier (10 doigts), pour l'ordinateur.

---

## 7. Exemples de progression (jeux importants)

Chaque chapitre a 6 à 10 niveaux + une épreuve. Les tableaux montrent le contenu, pas chaque niveau.

### 7.1 Écrire (3-9 ans)

| Ch. | Palier | Contenu | Réussite d'un niveau |
|---|---|---|---|
| 1 | 🟢 | Traits : vertical, horizontal, oblique, rond (chemin large) | suivre le chemin, sens respecté |
| 2 | 🟢 | Lettres en bâtons : I L T H E F | 4 lettres tracées, tolérance large |
| 3 | 🟢 | Lettres rondes et obliques : O C V A M N… + chiffres 0-9 | tolérance normale |
| 4 | 🟡 | **Mes premiers mots** : son prénom, puis mots de 2-3 lettres (LA, LE, UN, MAMAN…) tracés lettre par lettre, avec l'image | le mot entier, dans l'ordre |
| 5 | 🟡 | Mots de 4-5 lettres entendus (CHAT, LUNE, POMME), le modèle s'efface petit à petit (pointillés → première lettre seulement) | sans modèle à la fin |
| 6 | 🔴 | **Écrire au clavier de lettres** (tuiles) : mots dictés avec sons complexes (ou, on, an, ch) | orthographe exacte |
| 7 | 🔴 | **Petites phrases** : « Le chat dort. » — majuscule, espaces, point | phrase exacte, ponctuation |
| 8 | 🟣 | Phrases dictées avec accords (pluriel, féminin) | 0 faute ou 1 faute = ⭐⭐ |

### 7.2 Calcul (5-14 ans)

| Ch. | Palier | Contenu |
|---|---|---|
| 1 | 🟢 | Additions ≤ 5 avec objets à compter |
| 2 | 🟢 | Additions et soustractions ≤ 10, sans objets |
| 3 | 🟡 | ≤ 20, compléments à 10, doubles |
| 4 | 🟡 | ≤ 100, dizaines (avec boîtes de 10 comme la Boulangerie) |
| 5 | 🔴 | Tables de multiplication (une table par niveau, puis mélangées) |
| 6 | 🔴 | Divisions simples, calcul mental chronométré (record personnel) |
| 7 | 🟣 | Priorités de calcul, nombres relatifs, puissances simples |
| 8 | 🟣 | Fractions et pourcentages de tête |

### 7.3 Code (le Robot, 5-14 ans)

| Ch. | Palier | Contenu |
|---|---|---|
| 1 | 🟢 | Flèches, grilles 4×4, chemin court |
| 2 | 🟡 | Grilles 6×6, obstacles, **nombre de flèches limité** (chemin optimal) |
| 3 | 🟡 | **Boucles** : « ↻ 3 × ➡️ » (programmes plus courts que la place disponible) |
| 4 | 🔴 | Ramasser des objets dans l'ordre, clés et portes |
| 5 | 🔴 | **Conditions** : « si mur devant, tourne » (cases qui changent à chaque partie) |
| 6 | 🟣 | **Fonctions** : un bloc réutilisable appelé plusieurs fois |
| 7 | 🟣 | Débogage : un programme faux est donné, trouver et corriger l'erreur |

Chaque grille reste générée et **vérifiée par un solveur** (comme en V2) : aucun niveau impossible.

### 7.4 Anglais pour un francophone (3-14 ans)

| Étape | Unité (exemple) | Pousses (3-5) | Explorateurs (6-8) | Aventuriers / Experts (9-14) |
|---|---|---|---|---|
| Éveil | Colours | entendre « red », toucher le ballon rouge | + lire le mot, mémory son-image | + écrire le mot, phrase « The car is red » |
| Éveil | Animals | entendre, toucher l'animal | + article « a / an » | + pluriels, « I have two cats » |
| A1.1 | Food | — | « I like / I don't like » avec images | commander au restaurant (dialogue) |
| A1.2 | Daily life | — | heures, jours | présent simple, 3e personne (-s) |
| A2.1 | Last weekend | — | — | prétérit des verbes courants, histoire à remettre en ordre |

Même structure pour l'allemand (avec der / die / das dès l'éveil, en couleurs) et pour le français langue apprise (anglophones, germanophones).

### 7.5 La frise du temps (8-14 ans)

| Ch. | Contenu |
|---|---|
| 1 | Avant / après dans ma vie (bébé, école, aujourd'hui) — 6-7 ans |
| 2 | Les grandes périodes : Préhistoire, Antiquité, Moyen Âge, Temps modernes, Époque contemporaine |
| 3 | Objets et inventions à placer (roue, écriture, imprimerie, machine à vapeur, Internet) |
| 4 | Dates clés à placer à l'échelle (siècles, avant / après J.-C.) |
| 5 | Personnages et événements, avec une phrase « le savais-tu ? » vérifiée |
| 6 | Expert : intervalles (combien de siècles entre…), plusieurs civilisations en parallèle |

Contenu à valider par une source fiable (manuels du programme) : la règle V2 « rien de faux enseigné » s'applique d'autant plus en histoire et en sciences.

### 7.6 Lire (3-9 ans)

| Ch. | Contenu |
|---|---|
| 1 | Entendre les sons : première lettre, rimes |
| 2 | Lettres et sons simples (voyelles, m, l, r, s…) |
| 3 | Syllabes simples (MA, LO, RI) |
| 4 | Mots de 2 syllabes, puis sons complexes (ou, on, an, ch) |
| 5 | Phrases courtes lues → toucher l'image qui correspond |
| 6 | Petites histoires lues, 3 questions de compréhension |

---

## 8. Feuille de route

| Étape | Version | Contenu | Fini quand |
|---|---|---|---|
| **1. Socle** | 3.0.0-alpha | voir § 8.1 | un enfant de 4 ans et un de 12 ans jouent sans aide, sur iPad et téléphone, dans les 4 langues |
| **2. Grands parcours** | 3.0.0 | Lire, Écrire, Nombres, Calcul, Code, Monnaie, Logique, Émotions, Couleurs & formes, Docteur | tous les jeux V2 gardés sont en parcours ; publication |
| **3. Langues complètes** | 3.1 | 4 langues à apprendre, éveil → A1.2, histoires, dialogues | 2 semaines sans répéter un exercice |
| **4. Arcade éducative** | 3.2 | 6 mécaniques × packs de questions | 30 packs |
| **5. 8-14 ans, lot 1** | 3.3 | Système solaire, Corps humain, Frise, Pays & capitales, Fractions, Tables, Picross | ≥ 3 chapitres validés par jeu |
| **6. 8-14 ans, lot 2** | 3.4+ | Électricité, Matière, Civilisations, Géométrie, Sudoku, Homophones, Dactylo, A2 | au fil de l'eau |

### 8.1 Étape 1 (Socle) : priorités, dans l'ordre

1. **Projet** : Vite + TypeScript, structure, Vitest, robot de test, déploiement GitHub Pages (Actions), PWA.
2. **Données** : profils (IndexedDB), schéma versionné, reprise de la V2, export / import.
3. **Moteur de progression** : parcours → chapitres → niveaux, étoiles, épreuves, déblocages, XP, trophées, quête du jour, ajustement de difficulté, révisions.
4. **4 langues** : interface FR / EN / DE / ES complète, test « aucune clé manquante ».
5. **Voix** : lecteur de fichiers + secours meilleure voix navigateur, pipeline Azure prêt.
6. **Écrans** : premier lancement des tout-petits (§ 2.5), qui joue, accueil par tranche d'âge, carte des niveaux, fin de niveau, trophées, espace parent (§ 4.8).
7. **Premiers contenus qui prouvent le socle** : **Langues** (moteur de vocabulaire, 4 langues, éveil complet), **Écrire** (parcours lettres → mots → phrases), **Calcul**, **Bulles** (Pousses).
8. **SEO** : pages statiques par langue et par jeu, sitemap, `hreflang`.
9. **Qualité** : chaque niveau de chaque jeu joué par le robot ; écrans testés en téléphone, iPad portrait / paysage, bureau.

## 9. Footer

Une ligne discrète en bas de l'accueil et de l'espace parent (jamais pendant un jeu) :

> Développé par Sajir Khenissi · LinkedIn · Confidentialité · v3.0.0

Le lien LinkedIn s'ouvre dans un nouvel onglet ; dans l'application des Pousses, il est derrière la porte parent. URL LinkedIn : à fournir (en attendant, le lien pointe vers la recherche LinkedIn du nom).

## 10. Décisions restantes (non bloquantes pour coder)

1. **Clé Azure** : créer une ressource Speech gratuite (F0) sur le portail Azure et donner la clé → génération des 4 voix (§ 5.3). En attendant, la voix du navigateur (meilleure voix choisie automatiquement) prend le relais.
2. **URL LinkedIn** exacte pour le footer.
3. **Compte GoatCounter** (gratuit) pour activer les statistiques.
4. **Domaine** `plumiverse.app` (≈ 15 €/an, seul coût du projet, facultatif) + recherche de marque.
5. **Création du dépôt GitHub** `sajirK/plumiverse` et premier commit, quand tu veux publier.


---

## 11. État du socle (23/11/2026)

**Fait et testé**
- Projet Vite + TypeScript, PWA (hors ligne), déploiement GitHub Pages par GitHub Actions (prêt, pas encore poussé).
- Moteur : profils (IndexedDB, reprise V2, export / import), parcours → chapitres → épreuves, étoiles, XP, niveau du joueur, séries avec gel, maîtrise, trophées (16), quête du jour, révisions espacées (Leitner).
- Interface complète en **FR / EN / DE / ES** (test : aucune clé manquante), pages SEO par langue et par jeu, sitemap, `hreflang`.
- Écrans : premier lancement des tout-petits (§ 2.5), qui joue, île des 3-5 ans, tableau de bord des 6-14 ans, carte des niveaux, fin de niveau, trophées, espace parent (porte, progression réelle, temps de jeu, limite, blocages, réglages, sauvegarde, statistiques anonymes).
- Jeux : **cours de langue** ×4 (12 unités, 110 mots, 48 phrases, 6 types d'exercices selon l'âge), **Couleurs & formes**, **Écrire** (traits → lettres → chiffres → mots → orthographe), **Calcul** (8 chapitres, jusqu'aux pourcentages).
- Voix : lecteur de fichiers + meilleure voix du navigateur en secours ; pipeline Azure prêt (`npm run audio`), 4 400 phrases listées (≈ 85 000 caractères).
- Tests : 51 tests Vitest ; robot navigateur : **756 niveaux joués** (tous les niveaux de tous les jeux, à plusieurs âges, les 4 langues apprises), tous finis avec 3 étoiles et 0 erreur ; aucune phrase dite hors de la liste des voix.

- Tests manuels dans le navigateur (24/11) : limite de temps (alerte, écran de fin, déblocage parent), export / import de sauvegarde (et limite de 6 profils), reprise d'un profil V2, blocage de jeux et de catégories, changement de langue, « tout ouvrir », suppression de profil, pages SEO et confidentialité dans les 4 langues, trophées, mode hors ligne sur la version de production. Corrigés : alerte de temps parfois coupée, export qui pouvait échouer sur Safari et Firefox, file de voix bloquée si le navigateur ne signale pas la fin d'une phrase, cache hors ligne non versionné.

**Pas encore fait (étapes suivantes)**
- Générer les voix Azure (il faut la clé : § 10).
- Porter les autres jeux V2 en parcours (Lire, Code, Monnaie, Logique, Émotions, Docteur…), l'arcade éducative, les jeux 8-14 ans.
- Vrai test sur iPad et téléphone physiques (testé en émulation : téléphone, iPad paysage, bureau).
