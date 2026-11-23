// Génère les pages HTML avant le build : une application par langue, une page SEO par jeu et par langue,
// la page de confidentialité, le sitemap et robots.txt. (Fichiers générés : non versionnés, voir .gitignore.)
//   SITE=https://plumiverse.app BASE=/ npm run build   (domaine personnalisé)
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { LANGS, type Lang } from "../src/core/types";
import { DICTS } from "../src/core/i18n";
import { GAMES } from "../src/games";

const SITE = (process.env.SITE ?? "https://sajirk.github.io/plumiverse").replace(/\/$/, "");
const BASE = process.env.BASE ?? "/plumiverse/";
const GAMES_DIR: Record<Lang, string> = { fr: "jeux", en: "games", de: "spiele", es: "juegos" };
const LOCALE: Record<Lang, string> = { fr: "fr_FR", en: "en_GB", de: "de_DE", es: "es_ES" };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const write = (path: string, html: string) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, html); };

const META: Record<Lang, { title: string; desc: string; play: string; all: string; privacy: string }> = {
  fr: { title: "Plumiverse — jeux éducatifs gratuits pour les 3-14 ans", desc: "Apprendre en jouant : lire, écrire, compter, anglais, allemand, espagnol… 3 à 14 ans, sans publicité, sans compte, données gardées sur l'appareil.", play: "Jouer", all: "Tous les jeux", privacy: "Confidentialité" },
  en: { title: "Plumiverse — free learning games for ages 3-14", desc: "Learn by playing: reading, writing, maths, French, German, Spanish… Ages 3 to 14, no ads, no account, data stays on the device.", play: "Play", all: "All games", privacy: "Privacy" },
  de: { title: "Plumiverse — kostenlose Lernspiele für 3- bis 14-Jährige", desc: "Spielend lernen: Lesen, Schreiben, Rechnen, Englisch, Französisch, Spanisch… Für 3 bis 14 Jahre, ohne Werbung, ohne Konto, Daten bleiben auf dem Gerät.", play: "Spielen", all: "Alle Spiele", privacy: "Datenschutz" },
  es: { title: "Plumiverse — juegos educativos gratis de 3 a 14 años", desc: "Aprende jugando: leer, escribir, mates, inglés, francés, alemán… De 3 a 14 años, sin publicidad, sin cuenta, los datos se quedan en el dispositivo.", play: "Jugar", all: "Todos los juegos", privacy: "Privacidad" },
};

const PRIVACY: Record<Lang, string[]> = {
  fr: ["Plumiverse ne crée aucun compte et ne demande aucune adresse e-mail.", "Les profils des enfants (prénom, âge, progression) restent uniquement sur l'appareil (stockage du navigateur). Ils ne sont jamais envoyés.", "Pas de publicité, pas de cookie publicitaire, pas de traceur.", "Statistiques : seulement si un parent les active dans l'espace parent. Ce sont des compteurs anonymes (jeu joué, niveau fini, tranche d'âge, langue), sans prénom, sans âge exact, sans identifiant.", "Le parent peut exporter ou supprimer toutes les données depuis l'espace parent."],
  en: ["Plumiverse creates no account and asks for no email address.", "Children's profiles (first name, age, progress) stay only on the device (browser storage). They are never sent anywhere.", "No ads, no advertising cookies, no trackers.", "Statistics: only if a parent turns them on in the parents' area. They are anonymous counters (game played, level finished, age group, language), with no name, no exact age and no identifier.", "Parents can export or delete all data from the parents' area."],
  de: ["Plumiverse legt kein Konto an und fragt nach keiner E-Mail-Adresse.", "Die Profile der Kinder (Vorname, Alter, Fortschritt) bleiben nur auf dem Gerät (Browserspeicher). Sie werden nie verschickt.", "Keine Werbung, keine Werbe-Cookies, keine Tracker.", "Statistik: nur wenn ein Elternteil sie im Elternbereich einschaltet. Es sind anonyme Zähler (gespieltes Spiel, geschafftes Level, Altersgruppe, Sprache), ohne Namen, ohne genaues Alter, ohne Kennung.", "Eltern können alle Daten im Elternbereich exportieren oder löschen."],
  es: ["Plumiverse no crea ninguna cuenta y no pide ningún correo electrónico.", "Los perfiles de los niños (nombre, edad, progreso) se quedan solo en el dispositivo (almacenamiento del navegador). Nunca se envían.", "Sin publicidad, sin cookies publicitarias, sin rastreadores.", "Estadísticas: solo si un padre o una madre las activa en la zona de padres. Son contadores anónimos (juego, nivel terminado, franja de edad, idioma), sin nombre, sin edad exacta y sin identificador.", "Los padres pueden exportar o borrar todos los datos desde la zona de padres."],
};

function head(lang: Lang, title: string, desc: string, path: string, alternates: Record<Lang, string>) {
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${SITE}/${path}" />
${LANGS.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE}/${alternates[l]}" />`).join("\n")}
<link rel="alternate" hreflang="x-default" href="${SITE}/" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${SITE}/${path}" />
<meta property="og:image" content="${SITE}/og.png" />
<meta property="og:locale" content="${LOCALE[lang]}" />
<meta name="theme-color" content="#7048e8" />
<link rel="icon" href="${BASE}icon.svg" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${BASE}apple-touch-icon.png" />
<link rel="manifest" href="${BASE}manifest.webmanifest" />`;
}

const allLangs = (f: (l: Lang) => string) => Object.fromEntries(LANGS.map((l) => [l, f(l)])) as Record<Lang, string>;

// ---------------------------------------------------------------- application, une par langue
for (const lang of LANGS) {
  const D = DICTS[lang], M = META[lang];
  // le cours de sa propre langue n'existe pas pour cette interface : pas de page
  const gamesOf = (l: Lang) => GAMES.filter((g) => g.id !== `langue-${l}`);
  const gamesList = gamesOf(lang).map((g) => `<li><a href="${GAMES_DIR[lang]}/${g.id}/">${g.icon} ${esc(g.title[lang])}</a> — ${esc(g.desc[lang])}</li>`).join("\n");
  write(`${lang}/index.html`, `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head(lang, M.title, M.desc, `${lang}/`, allLangs((l) => `${l}/`))}
<meta name="apple-mobile-web-app-capable" content="yes" />
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", name: "Plumiverse", url: `${SITE}/${lang}/`, applicationCategory: "EducationalApplication", inLanguage: lang, isAccessibleForFree: true, offers: { "@type": "Offer", price: "0" }, audience: { "@type": "EducationalAudience", educationalRole: "student" }, typicalAgeRange: "3-14", author: { "@type": "Person", name: "Sajir Khenissi" } })}</script>
</head>
<body>
<div id="app">
  <main class="seo">
    <h1>🦉 ${esc(D.app.name)}</h1>
    <p>${esc(D.app.tagline)}</p>
    <p>${esc(M.desc)}</p>
    <h2>${esc(M.all)}</h2>
    <ul>${gamesList}</ul>
  </main>
</div>
<script type="module" src="/src/main.ts"></script>
</body>
</html>
`);
  // pages SEO des jeux
  for (const g of gamesOf(lang)) {
    const path = `${lang}/${GAMES_DIR[lang]}/${g.id}/`;
    const trk = g.track({ profile: { learning: [], uiLang: lang } as never, age: 8, band: "6-8", lang });
    const chapters = trk.chapters.map((c, i) => `<li>${i + 1}. ${esc(c.title[lang])} <small>(${esc(D.tier[c.tier])})</small></li>`).join("");
    write(`${path}index.html`, `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head(lang, `${g.title[lang]} — ${D.app.name}`, g.desc[lang], path, allLangs((l) => (g.id === `langue-${l}` ? `${l}/` : `${l}/${GAMES_DIR[l]}/${g.id}/`)))}
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:auto;padding:24px;color:#2f2545;background:#fff8ec;line-height:1.5}a.play{display:inline-block;background:#7048e8;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-size:20px;margin:12px 0}h1{font-size:34px}</style>
<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "LearningResource", name: g.title[lang], description: g.desc[lang], inLanguage: lang, isAccessibleForFree: true, typicalAgeRange: `${g.ages[0]}-${g.ages[1]}`, url: `${SITE}/${path}` })}</script>
</head>
<body>
<p><a href="../../">🦉 ${esc(D.app.name)}</a></p>
<h1>${g.icon} ${esc(g.title[lang])}</h1>
<p>${esc(g.desc[lang])}</p>
<p>${g.ages[0]}–${g.ages[1]}</p>
<a class="play" href="../../#/game/${g.id}">▶ ${esc(M.play)}</a>
<ol>${chapters}</ol>
</body>
</html>
`);
  }
  // confidentialité
  write(`${lang}/privacy/index.html`, `<!DOCTYPE html>
<html lang="${lang}">
<head>
${head(lang, `${M.privacy} — ${D.app.name}`, PRIVACY[lang][0], `${lang}/privacy/`, allLangs((l) => `${l}/privacy/`))}
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:auto;padding:24px;color:#2f2545;background:#fff8ec;line-height:1.6}</style>
</head>
<body>
<p><a href="../">🦉 ${esc(D.app.name)}</a></p>
<h1>${esc(M.privacy)}</h1>
<ul>${PRIVACY[lang].map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
<p>${esc(D.app.madeBy)} Sajir Khenissi</p>
</body>
</html>
`);
}

// ---------------------------------------------------------------- racine : choix de la langue
write("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
${head("en", "Plumiverse — learning games · jeux éducatifs · Lernspiele · juegos educativos", META.en.desc, "", allLangs((l) => `${l}/`))}
<script>
  // l'appareil parle quelle langue ? (on garde le dernier choix)
  (function () {
    var saved = localStorage.getItem("plumiverse.lang");
    var nav = (navigator.languages || [navigator.language || "fr"]).map(function (l) { return l.slice(0, 2); });
    var langs = ["fr", "en", "de", "es"];
    var pick = saved && langs.indexOf(saved) >= 0 ? saved : nav.filter(function (l) { return langs.indexOf(l) >= 0; })[0] || "en";
    location.replace(pick + "/" + location.hash);
  })();
</script>
</head>
<body>
<h1>🦉 Plumiverse</h1>
<ul>${LANGS.map((l) => `<li><a href="${l}/" hreflang="${l}">${DICTS[l].app.langName}</a></li>`).join("")}</ul>
</body>
</html>
`);

// ---------------------------------------------------------------- sitemap et robots
const urls = ["", ...LANGS.flatMap((l) => [`${l}/`, `${l}/privacy/`, ...GAMES.filter((g) => g.id !== `langue-${l}`).map((g) => `${l}/${GAMES_DIR[l]}/${g.id}/`)])];
write("public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}/${u}</loc></url>`).join("\n")}
</urlset>
`);
write("public/robots.txt", `User-agent: *\nAllow: /\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`✓ pages générées : ${urls.length} adresses (${SITE})`);
