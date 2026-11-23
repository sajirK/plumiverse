// « Mon profil » : l'enfant (ou le parent à côté) change son animal, son prénom, son âge et sa langue en un geste.
// On y arrive en touchant son avatar en haut à gauche. Chaque changement est enregistré tout de suite.
import { LANGS, type Lang } from "../../core/types";
import { t, ui } from "../../core/i18n";
import { AVATARS, ageOf, cleanName } from "../../core/profile";
import { say } from "../../audio/voice";
import { sfx } from "../../audio/sfx";
import { h, clear } from "../dom";
import { footer, toast } from "../parts";
import { state, root, go, saveProfile, setTitle, applyProfileSettings, switchLanguage } from "../app";

export const FLAGS: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", de: "🇩🇪", es: "🇪🇸" };

export function me() {
  const p = state.current;
  if (!p) { go("#/who"); return; }
  setTitle(t("me.title"));
  const app = clear(root());
  const save = async () => { await saveProfile(p); applyProfileSettings(p); toast("✅ " + t("me.saved"), 1500); };

  const head = h("div", { class: "me-head" },
    h("button", { class: "round-btn", "aria-label": t("parent.back"), onclick: () => { sfx.tap(); go("#/home"); } }, "←"),
    h("span", { class: "me-avatar" }, p.avatar),
    h("h1", {}, t("me.title")));

  // animal
  const animals = h("div", { class: "me-animals" });
  const drawAnimals = () => {
    clear(animals);
    for (const a of AVATARS) {
      const b = h("button", { class: "me-animal" + (a === p.avatar ? " on" : ""), "aria-label": a }, a);
      b.onclick = async () => { sfx.pop(); p.avatar = a; head.querySelector(".me-avatar")!.textContent = a; drawAnimals(); await save(); };
      animals.appendChild(b);
    }
  };
  drawAnimals();

  // prénom
  const name = h("input", { class: "input", value: p.name, maxlength: "20", autocomplete: "off", "aria-label": t("me.name"), placeholder: ui().onboarding.namePlaceholder }) as HTMLInputElement;
  name.onchange = async () => { p.name = cleanName(name.value); name.value = p.name; await save(); };

  // âge
  const ages = h("div", { class: "me-ages" });
  const drawAges = () => {
    clear(ages);
    for (let a = 3; a <= 14; a++) {
      const b = h("button", { class: "me-age" + (a === ageOf(p) ? " on" : ""), "aria-label": String(a) }, String(a));
      b.onclick = async () => { sfx.tap(); p.birthYear = new Date().getFullYear() - a; drawAges(); await save(); };
      ages.appendChild(b);
    }
  };
  drawAges();

  // langue de l'application
  const langs = h("div", { class: "me-langs" });
  for (const l of LANGS) {
    const b = h("button", { class: "me-lang" + (l === p.uiLang ? " on" : ""), lang: l }, h("span", { class: "big" }, FLAGS[l]), h("small", {}, ui(l).app.langName));
    b.onclick = () => { if (l === p.uiLang) return; sfx.tap(); say(ui(l).app.langName, l); void switchLanguage(l, "#/me"); };
    langs.appendChild(b);
  }

  // langues apprises
  const learn = h("div", { class: "toggles" });
  const drawLearn = () => {
    clear(learn);
    for (const l of LANGS) {
      if (l === p.uiLang) continue;
      const on = p.learning.includes(l);
      const b = h("button", { class: "chip big" + (on ? " on" : "") }, `${FLAGS[l]} ${ui().langs[l]}`);
      b.onclick = async () => {
        sfx.tap();
        p.learning = on ? p.learning.filter((x) => x !== l) : [...p.learning, l];
        drawLearn(); await save();
      };
      learn.appendChild(b);
    }
  };
  drawLearn();

  app.append(h("main", { class: "page me" },
    head,
    h("section", { class: "me-card" }, h("h2", {}, "🐾 " + t("me.avatar")), animals),
    h("section", { class: "me-card" }, h("h2", {}, "✏️ " + t("me.name")), name),
    h("section", { class: "me-card" }, h("h2", {}, "🎂 " + t("me.age")), ages),
    h("section", { class: "me-card" }, h("h2", {}, "🗣️ " + t("me.lang")), langs),
    h("section", { class: "me-card" }, h("h2", {}, "🌍 " + t("me.learn")), learn),
    h("div", { class: "row" },
      h("button", { class: "btn primary big", onclick: () => { sfx.good(); go("#/home"); } }, "✅ " + t("me.done")),
      h("button", { class: "btn", onclick: () => { sfx.tap(); go("#/who"); } }, "👥 " + t("me.switch"))),
  ), footer());
  say(t("me.title"), state.pageLang);
}
