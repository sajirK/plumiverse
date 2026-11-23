// Écrans « Qui joue ? », accueil (l'île des tout-petits ou le tableau de bord des grands) et trophées.
import { CATEGORIES, type Category, type Lang } from "../../core/types";
import { t, tr, ui } from "../../core/i18n";
import { ageOf, bandOf, displayName, MAX_PROFILES } from "../../core/profile";
import { learnedCount } from "../../core/leitner";
import { getGameProgress, continueLevel, isChapterDone } from "../../core/progress";
import { TROPHIES } from "../../core/trophies";
import { say } from "../../audio/voice";
import { sfx } from "../../audio/sfx";
import { h, clear } from "../dom";
import { footer, playerHeader, plume } from "../parts";
import { state, root, go, gamesFor, ctxFor, selectProfile, goToProfileLanguage, setTitle, applyProfileSettings } from "../app";
import { dailyQuest, questDone } from "../quest";
import { UNITS } from "../../content/lang/course";
import type { GameDef } from "../../games/types";

// ---------------------------------------------------------------- Qui joue ?
export function who() {
  setTitle(t("who.title"));
  if (!state.profiles.length) { go("#/start"); return; }
  const app = clear(root());
  const grid = h("div", { class: "who-grid" });
  for (const p of state.profiles) {
    const b = h("button", { class: "who-card" }, h("span", { class: "who-avatar" }, p.avatar), h("span", { class: "who-label" }, displayName(p)));
    b.onclick = async () => { sfx.pop(); await selectProfile(p); if (!goToProfileLanguage(p)) go("#/home"); };
    grid.appendChild(b);
  }
  if (state.profiles.length < MAX_PROFILES) {
    const add = h("button", { class: "who-card add", "aria-label": t("who.add") }, h("span", { class: "who-avatar" }, "＋"), h("span", { class: "who-label" }, t("who.add")));
    add.onclick = () => { sfx.tap(); go("#/start"); };
    grid.appendChild(add);
  }
  app.append(h("main", { class: "page who" }, plume("m"), h("h1", {}, t("who.title")), grid, h("button", { class: "btn ghost small", onclick: () => go("#/parent") }, "👪 " + t("home.parent"))), footer());
  say(t("who.title"), state.pageLang);
}

// ---------------------------------------------------------------- Accueil
export function home() {
  const p = state.current;
  if (!p) { go(state.profiles.length ? "#/who" : "#/start"); return; }
  if (goToProfileLanguage(p)) return;
  applyProfileSettings(p);
  setTitle();
  const band = bandOf(p);
  const app = clear(root());
  const games = gamesFor(p);
  const ctx = ctxFor(p);
  const page = h("main", { class: `page home band-${band}` });
  app.append(playerHeader(p), page, footer());

  const little = band === "3-5";
  if (little) page.append(h("div", { class: "little-head" }, plume("m", "dance"), h("p", { class: "little-say" }, t("home.pickGame"))));
  else page.append(h("h1", { class: "hello" }, t("home.hi", { name: displayName(p) })));
  if (little) say(t("home.pickGame"), state.pageLang);

  // Quête du jour (une suggestion : l'enfant reste libre de tout choisir dans le catalogue)
  if (!little) {
  const quest = dailyQuest(p, games, ctx);
  const allDone = quest.length > 0 && quest.every((q) => questDone(p, q));
  const qbox = h("section", { class: "quest" }, h("h2", {}, (allDone ? "🏅 " : "🗺️ ") + (allDone ? t("home.questDone") : t("home.quest"))));
  const qrow = h("div", { class: "quest-row" });
  for (const q of quest) {
    const done = questDone(p, q);
    const label = { continue: t("home.continue"), review: t("home.review"), discover: t("home.discover"), learn: t("home.learn") }[q.kind];
    const c = h("button", { class: "quest-card" + (done ? " done" : "") }, h("span", { class: "quest-icon" }, q.game.icon), h("span", { class: "quest-kind" }, label), h("span", { class: "quest-title" }, tr(q.game.title)), done ? h("span", { class: "quest-check" }, "✅") : null);
    c.onclick = () => { sfx.tap(); go(`#/play/${q.game.id}/${q.levelId}`); };
    qrow.appendChild(c);
  }
  qbox.appendChild(qrow);
  page.appendChild(qbox);

  // Mes langues
  const langs = games.filter((g) => g.category === "langues");
  if (langs.length) {
    const row = h("div", { class: "lang-row" });
    for (const g of langs) {
      const target = g.id.slice(-2) as Lang;
      const tr0 = g.track(ctx), gp = getGameProgress(p, g.id, tr0);
      const unit = continueLevel(p, gp, tr0).chapter;
      const n = learnedCount(p.langs[target]);
      const c = h("button", { class: "lang-card" }, h("span", { class: "lang-flag" }, g.icon), h("span", { class: "lang-name" }, tr(g.title)),
        h("span", { class: "lang-meta" }, `${t("course.unit", { n: UNITS.findIndex((u) => u.id === unit.id) + 1 })} · ${tr(unit.title)}`),
        h("span", { class: "lang-meta" }, t("course.words", { n })));
      c.onclick = () => { sfx.tap(); go(`#/game/${g.id}`); };
      row.appendChild(c);
    }
    page.append(h("section", {}, h("h2", {}, "🌍 " + t("home.languages")), row));
  }
  }

  // Catalogue complet : tous les jeux, l'enfant choisit. Filtres : catégorie (icônes) et âge (« Tous » par défaut).
  const age = ageOf(p);
  let filterAge = false;
  let cat: Category | "all" = "all";
  const chips = h("div", { class: "chips" + (little ? " big" : "") });
  const grid = h("div", { class: "game-grid" + (little ? " little" : "") });
  const cats = CATEGORIES.filter((c) => games.some((g) => g.category === c));
  const fits = (g: GameDef) => age >= g.ages[0] && age <= g.ages[1];
  const renderGrid = () => {
    clear(chips); clear(grid);
    for (const c of ["all", ...cats] as const) {
      const label = c === "all" ? t("home.all") : t(`cat.${c}`);
      const b = h("button", { class: "chip" + (cat === c ? " on" : ""), "aria-label": label }, CAT_ICON[c], little ? null : " " + label);
      b.onclick = () => { cat = c as Category | "all"; sfx.tap(); if (little) say(label, state.pageLang); renderGrid(); };
      chips.appendChild(b);
    }
    if (!little) {
      const ageChip = h("button", { class: "chip age" + (filterAge ? " on" : "") }, "🎂 " + t("home.forMe"));
      ageChip.onclick = () => { filterAge = !filterAge; sfx.tap(); renderGrid(); };
      chips.appendChild(ageChip);
    }
    const list = games
      .filter((g) => (cat === "all" || g.category === cat) && (!filterAge || fits(g)))
      .sort((a, b) => Number(fits(b)) - Number(fits(a)));
    if (!list.length) grid.appendChild(h("p", { class: "muted" }, t("home.empty")));
    for (const g of list) grid.appendChild(gameCard(g));
  };
  const gameCard = (g: GameDef) => {
    const trk = g.track(ctx), gp = getGameProgress(p, g.id, trk);
    const done = trk.chapters.filter((c) => isChapterDone(gp, c)).length;
    const cur = continueLevel(p, gp, trk).chapter;
    const b = h("button", { class: `game-card cat-${g.category}` + (fits(g) ? " fits" : ""), "aria-label": tr(g.title) },
      g.isNew ? h("span", { class: "new" }, t("home.newBadge")) : null,
      h("span", { class: "game-icon" }, g.icon),
      h("span", { class: "game-title" }, tr(g.title)),
      little ? null : h("span", { class: `tier tier-${cur.tier}` }, t(`tier.${cur.tier}`)),
      h("span", { class: "game-prog" }, h("span", { style: { width: `${Math.round((done / trk.chapters.length) * 100)}%` } })));
    b.onclick = () => { sfx.tap(); if (little) say(tr(g.title), state.pageLang); go(little ? `#/play/${g.id}` : `#/game/${g.id}`); };
    return b;
  };
  page.append(h("section", {}, little ? null : h("h2", {}, "🎮 " + t("home.games")), chips, grid));
  renderGrid();
}

const CAT_ICON: Record<Category | "all", string> = { all: "⭐", langues: "🌍", "lire-ecrire": "✏️", maths: "🔢", logique: "🧩", sciences: "🔬", "histoire-geo": "🏛️", emotions: "💛", arcade: "🎮", creer: "🎨" };

// ---------------------------------------------------------------- Trophées
export function trophies() {
  const p = state.current;
  if (!p) { go("#/"); return; }
  setTitle(t("trophies.title"));
  const app = clear(root());
  const won = TROPHIES.filter((x) => p.trophies[x.id]);
  const grid = h("div", { class: "trophy-grid" });
  for (const x of TROPHIES) {
    const has = !!p.trophies[x.id];
    const c = h("button", { class: "trophy" + (has ? " won" : "") }, h("span", { class: "trophy-icon" }, has ? x.icon : "❔"), h("span", { class: "trophy-title" }, tr(x.title)), h("span", { class: "trophy-hint" }, tr(x.hint)));
    c.onclick = () => say(`${tr(x.title)}. ${tr(x.hint)}`, state.pageLang);
    grid.appendChild(c);
  }
  app.append(playerHeader(p, { back: "#/home" }), h("main", { class: "page" }, h("h1", {}, "🏆 " + t("trophies.title")), h("p", { class: "muted" }, t("trophies.count", { n: won.length, total: TROPHIES.length })), grid), footer());
}

export { ui };
