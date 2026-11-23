// Espace parent : porte d'entrée, « Comment ça va ? », détail d'un profil, réglages, famille et sauvegarde.
import { LANGS, CATEGORIES, type Lang, type Profile } from "../../core/types";
import { t, tr, ui } from "../../core/i18n";
import { ageOf, displayName, cleanName, MAX_PROFILES } from "../../core/profile";
import { parentGate, lastWeek, secondsToday, toggleBlock, LIMIT_CHOICES } from "../../core/parent";
import { isMastered, getGameProgress, isChapterDone, continueLevel } from "../../core/progress";
import { learnedCount } from "../../core/leitner";
import { exportFamily, importFamily } from "../../core/store";
import { UNITS } from "../../content/lang/course";
import { h, clear } from "../dom";
import { footer, plume } from "../parts";
import { state, root, go, saveProfile, selectProfile, ctxFor, allGames, setTitle } from "../app";

let openUntil = 0; // la porte reste ouverte 10 minutes

function gate(onOpen: () => void) {
  if (Date.now() < openUntil) return onOpen();
  const app = clear(root());
  const q = parentGate(state.pageLang);
  const input = h("input", { class: "input big", inputmode: "numeric", autocomplete: "off", "aria-label": t("parent.gate") }) as HTMLInputElement;
  const msg = h("p", { class: "muted" });
  const ok = h("button", { class: "btn primary" }, t("parent.enter"));
  const tryOpen = () => {
    if (Number(input.value.trim()) === q.answer) { openUntil = Date.now() + 10 * 60 * 1000; onOpen(); }
    else { msg.textContent = t("parent.wrong"); input.value = ""; }
  };
  ok.onclick = tryOpen;
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryOpen(); });
  app.append(h("main", { class: "page parent gate" },
    h("button", { class: "round-btn", "aria-label": t("parent.close"), onclick: () => history.back() }, "✕"),
    h("h1", {}, "👪 " + t("parent.title")), h("p", {}, t("parent.gate")), h("p", { class: "gate-q" }, q.question), input, ok, msg), footer());
  input.focus();
}

/** Nom lisible d'une compétence (jeux et cours de langue). */
function skillName(id: string): string {
  const m = id.match(/^(fr|en|de|es)\.(.+)$/);
  if (m) { const u = UNITS.find((x) => x.id === m[2]); return `${ui().langs[m[1] as Lang]} · ${u ? tr(u.title) : m[2]}`; }
  for (const g of allGames()) if (g.skills?.[id]) return tr(g.skills[id]);
  return id;
}

function weekBars(p: Profile) {
  const days = lastWeek(p);
  const max = Math.max(15, ...days.map((d) => d.minutes));
  return h("div", { class: "week" }, ...days.map((d) => h("div", { class: "week-day", title: t("parent.minutes", { n: d.minutes }) }, h("span", { class: "week-bar", style: { height: `${Math.round((d.minutes / max) * 100)}%` } }), h("small", {}, new Date(d.day).toLocaleDateString(state.pageLang, { weekday: "narrow" })))));
}

// ---------------------------------------------------------------- vue d'ensemble
export function parent() {
  gate(() => {
    setTitle(t("parent.title"));
    const app = clear(root());
    const page = h("main", { class: "page parent" });
    page.append(h("div", { class: "parent-top" }, h("button", { class: "round-btn", "aria-label": t("parent.close"), onclick: () => go(state.current ? "#/home" : "#/who") }, "✕"), h("h1", {}, "👪 " + t("parent.title"))));
    page.append(h("h2", {}, t("parent.overview")));
    for (const p of state.profiles) page.append(profileCard(p));
    if (!state.profiles.length) page.append(plume("m"));
    page.append(h("div", { class: "row" },
      state.profiles.length < MAX_PROFILES ? h("button", { class: "btn", onclick: () => go("#/start") }, "➕ " + t("parent.addProfile")) : null,
      h("button", { class: "btn", onclick: () => go("#/parent/family") }, "💾 " + t("parent.family"))));
    app.append(page, footer());
  });
}

function profileCard(p: Profile): HTMLElement {
  const skills = Object.entries(p.mastery);
  const knows = skills.filter(([, m]) => isMastered(m)).map(([k]) => k);
  const hard = skills.filter(([, m]) => m.plays >= 2 && m.value < 0.55).sort((a, b) => a[1].value - b[1].value).slice(0, 2);
  const langs = p.learning.map((l) => `${ui().langs[l]} : ${t("parent.words", { n: learnedCount(p.langs[l]) })}`);
  return h("section", { class: "pcard" },
    h("div", { class: "pcard-head" }, h("span", { class: "who-avatar small" }, p.avatar), h("div", {}, h("h3", {}, displayName(p)), h("small", { class: "muted" }, `${ageOf(p)} · ${t("parent.today")} : ${t("parent.minutes", { n: Math.round(secondsToday(p) / 60) })}`)),
      h("button", { class: "btn small", onclick: () => go(`#/parent/p/${p.id}`) }, "⚙️ " + t("parent.details"))),
    weekBars(p),
    h("div", { class: "pcols" },
      h("div", {}, h("h4", {}, "✅ " + t("parent.knows")), knows.length ? h("ul", {}, ...knows.map((k) => h("li", {}, skillName(k)))) : h("p", { class: "muted" }, t("parent.nothingYet"))),
      h("div", {}, h("h4", {}, "🔄 " + t("parent.struggles")), hard.length ? h("ul", {}, ...hard.map(([k, m]) => h("li", {}, `${skillName(k)} — ${Math.round(m.value * 100)} %`))) : h("p", { class: "muted" }, "—"))),
    langs.length ? h("p", { class: "muted" }, "🌍 " + langs.join(" · ")) : null,
  );
}

// ---------------------------------------------------------------- détail et réglages d'un profil
export function parentProfile([id]: string[]) {
  gate(() => {
    const p = state.profiles.find((x) => x.id === id);
    if (!p) { go("#/parent"); return; }
    const app = clear(root());
    const page = h("main", { class: "page parent" });
    const save = () => saveProfile(p);
    page.append(h("div", { class: "parent-top" }, h("button", { class: "round-btn", "aria-label": t("parent.back"), onclick: () => go("#/parent") }, "←"), h("h1", {}, `${p.avatar} ${displayName(p)}`)));

    // progression par jeu
    const ctx = ctxFor(p);
    const prog = h("div", { class: "plist" });
    for (const g of allGames().filter((x) => (x.available ? x.available(ctx) : true))) {
      const trk = g.track(ctx), gp = p.progress[g.id];
      const played = gp && Object.keys(gp.levels).length > 0;
      const done = played ? trk.chapters.filter((c) => isChapterDone(gp, c)).length : 0;
      const cur = played ? continueLevel(p, getGameProgress(p, g.id, trk), trk) : null;
      prog.append(h("div", { class: "prow" }, h("span", {}, g.icon), h("span", { class: "prow-name" }, tr(g.title)),
        h("span", { class: "muted" }, cur ? `${t("parent.chapter", { n: cur.ci + 1, total: trk.chapters.length })} · ${tr(cur.chapter.title)}` : t("parent.never")),
        h("span", { class: "game-prog" }, h("span", { style: { width: `${Math.round((done / trk.chapters.length) * 100)}%` } }))));
    }
    page.append(h("h2", {}, "📈 " + t("parent.details")), prog);

    // réglages
    page.append(h("h2", {}, "⚙️ " + t("parent.settings")));
    const name = h("input", { class: "input", value: p.name, maxlength: "20", "aria-label": t("parent.name") }) as HTMLInputElement;
    name.onchange = () => { p.name = cleanName(name.value); save(); };
    const age = h("select", { class: "input", "aria-label": t("parent.age") }, ...Array.from({ length: 12 }, (_, i) => i + 3).map((a) => h("option", { value: String(a), selected: a === ageOf(p) }, String(a)))) as HTMLSelectElement;
    age.onchange = () => { p.birthYear = new Date().getFullYear() - Number(age.value); save(); };
    const uiLang = h("select", { class: "input", "aria-label": t("parent.uiLang") }, ...LANGS.map((l) => h("option", { value: l, selected: l === p.uiLang }, ui(l).app.langName))) as HTMLSelectElement;
    uiLang.onchange = () => { p.uiLang = uiLang.value as Lang; p.learning = p.learning.filter((l) => l !== p.uiLang); save(); };
    const learn = h("div", { class: "toggles" }, ...LANGS.map((l) => {
      const on = p.learning.includes(l);
      const b = h("button", { class: "chip" + (on ? " on" : ""), disabled: l === p.uiLang }, ui().langs[l]);
      b.onclick = () => { p.learning = on ? p.learning.filter((x) => x !== l) : [...p.learning, l]; save().then(() => parentProfile([id])); };
      return b;
    }));
    const limit = h("select", { class: "input", "aria-label": t("parent.limit") }, ...LIMIT_CHOICES.map((m) => h("option", { value: String(m), selected: m === p.settings.dailyLimit }, m ? t("parent.minutes", { n: m }) : t("parent.noLimit")))) as HTMLSelectElement;
    limit.onchange = () => { p.settings.dailyLimit = Number(limit.value); save(); };
    const toggle = (label: string, get: () => boolean, set: (v: boolean) => void) => {
      const b = h("button", { class: "switch" + (get() ? " on" : ""), role: "switch", "aria-checked": String(get()) }, h("span", {}));
      b.onclick = () => { set(!get()); b.classList.toggle("on", get()); b.setAttribute("aria-checked", String(get())); save(); };
      return h("label", { class: "field row" }, h("span", {}, label), b);
    };
    page.append(
      h("label", { class: "field" }, h("span", {}, t("parent.name")), name),
      h("label", { class: "field" }, h("span", {}, t("parent.age")), age),
      h("label", { class: "field" }, h("span", {}, t("parent.uiLang")), uiLang),
      h("div", { class: "field" }, h("span", {}, t("parent.learning")), learn),
      h("label", { class: "field" }, h("span", {}, t("parent.limit")), limit),
      toggle(t("parent.voice"), () => p.settings.voice, (v) => (p.settings.voice = v)),
      toggle(t("parent.sounds"), () => p.settings.sounds, (v) => (p.settings.sounds = v)),
      toggle(t("parent.unlockAll"), () => p.settings.unlockAll, (v) => (p.settings.unlockAll = v)),
    );

    // jeux et catégories autorisés
    const blocks = h("div", { class: "toggles" });
    for (const c of CATEGORIES) {
      const key = "cat:" + c;
      const b = h("button", { class: "chip" + (p.settings.blocked.includes(key) ? "" : " on") }, (p.settings.blocked.includes(key) ? "🚫 " : "✅ ") + t(`cat.${c}`));
      b.onclick = () => { toggleBlock(p, key); save().then(() => parentProfile([id])); };
      blocks.appendChild(b);
    }
    for (const g of allGames()) {
      const b = h("button", { class: "chip" + (p.settings.blocked.includes(g.id) ? "" : " on") }, `${p.settings.blocked.includes(g.id) ? "🚫" : g.icon} ${tr(g.title)}`);
      b.onclick = () => { toggleBlock(p, g.id); save().then(() => parentProfile([id])); };
      blocks.appendChild(b);
    }
    page.append(h("h2", {}, "🧩 " + t("parent.blocked")), blocks);

    const del = h("button", { class: "btn danger" }, "🗑️ " + t("parent.deleteProfile"));
    del.onclick = async () => {
      if (!confirm(t("parent.confirmDelete", { name: displayName(p) }))) return;
      await state.store.remove(p.id);
      state.profiles = state.profiles.filter((x) => x.id !== p.id);
      if (state.current?.id === p.id) await selectProfile(null);
      go("#/parent");
    };
    page.append(h("div", { class: "row" }, h("button", { class: "btn primary", onclick: async () => { await selectProfile(p); go("#/home"); } }, `▶ ${p.avatar}`), del));
    app.append(page, footer());
  });
}

// ---------------------------------------------------------------- famille et sauvegarde
export function parentFamily() {
  gate(() => {
    const app = clear(root());
    const page = h("main", { class: "page parent" });
    const msg = h("p", { class: "muted" });
    const exp = h("button", { class: "btn" }, "⬇️ " + t("parent.export"));
    exp.onclick = () => {
      const blob = new Blob([exportFamily(state.profiles)], { type: "application/json" });
      const a = h("a", { href: URL.createObjectURL(blob), download: `plumiverse-${new Date().toISOString().slice(0, 10)}.json` });
      // le lien doit être dans la page (Firefox) et le fichier gardé le temps du téléchargement (Safari)
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    };
    const file = h("input", { type: "file", accept: "application/json,.json", class: "hidden" }) as HTMLInputElement;
    const imp = h("button", { class: "btn" }, "⬆️ " + t("parent.import"));
    imp.onclick = () => file.click();
    file.onchange = async () => {
      try {
        const list = importFamily(await file.files![0].text());
        // 6 profils au maximum : un profil déjà présent (même identifiant) est remplacé, les autres s'ajoutent tant qu'il reste de la place
        let n = 0;
        for (const p of list) {
          const exists = state.profiles.some((x) => x.id === p.id);
          if (!exists && state.profiles.length >= MAX_PROFILES) continue;
          await saveProfile(p); n++;
        }
        msg.textContent = t("parent.importDone", { n });
      } catch { msg.textContent = t("parent.importError"); }
    };
    const consent = h("button", { class: "switch" + (state.meta.statsConsent ? " on" : ""), role: "switch", "aria-checked": String(!!state.meta.statsConsent) }, h("span", {}));
    consent.onclick = async () => { state.meta.statsConsent = !state.meta.statsConsent; await state.store.setMeta({ statsConsent: state.meta.statsConsent }); consent.classList.toggle("on", state.meta.statsConsent); };
    page.append(
      h("div", { class: "parent-top" }, h("button", { class: "round-btn", "aria-label": t("parent.back"), onclick: () => go("#/parent") }, "←"), h("h1", {}, "💾 " + t("parent.family"))),
      h("div", { class: "row" }, exp, imp, file), msg,
      h("h2", {}, "📊 " + t("parent.stats")),
      h("label", { class: "field row" }, h("span", {}, t("parent.statsHelp")), consent),
    );
    app.append(page, footer());
  });
}
