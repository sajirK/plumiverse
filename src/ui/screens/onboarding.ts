// Premier lancement (et « Ajouter un joueur ») : compréhensible en moins de 10 secondes, sans lire.
// Plume → langue → animal → âge → prénom (parent, facultatif) → premier jeu tout de suite.
import { type Lang, LANGS } from "../../core/types";
import { ui } from "../../core/i18n";
import { AVATARS, ageOf, createProfile, cleanName, profileFromV2, MAX_PROFILES, defaultLearning } from "../../core/profile";
import { numberWords } from "../../core/numwords";
import { say, unlockAudio } from "../../audio/voice";
import { sfx } from "../../audio/sfx";
import { h, clear } from "../dom";
import { plume } from "../parts";
import { state, root, saveProfile, selectProfile, goToProfileLanguage, go, setTitle } from "../app";
import { showHand } from "../../kit/kit";
import { track } from "../stats";

const FLAGS: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", de: "🇩🇪", es: "🇪🇸" };

export async function onboarding() {
  setTitle();
  if (state.profiles.length >= MAX_PROFILES) { go("#/who"); return; }
  const app = clear(root());
  const screen = h("main", { class: "onb" });
  app.appendChild(screen);
  let lang: Lang = state.pageLang;
  let avatar = AVATARS[0];
  let age = 5;
  const D = () => ui(lang);
  let hintTimer = 0;
  const later = (target: Element) => { clearTimeout(hintTimer); hintTimer = window.setTimeout(() => { if (target.isConnected) showHand(target); }, 3000); };

  // 1. Plume dit bonjour
  const step1 = () => {
    clear(screen);
    const p = plume("l", "wave");
    const btn = h("button", { class: "onb-plume", "aria-label": D().onboarding.hello }, p);
    screen.append(btn, h("p", { class: "onb-say" }, D().onboarding.hello));
    btn.onclick = () => { unlockAudio(); sfx.pop(); v2OrLang(); };
    say(D().onboarding.hello, lang);
    later(btn);
  };

  // Reprise de la V2 (même domaine) : proposée une seule fois
  const v2OrLang = () => {
    const old = !state.meta.v2Offered && !state.profiles.length ? profileFromV2(localStorage, state.pageLang) : null;
    if (!old) return step2();
    clear(screen);
    const q = D().onboarding.v2Found.replace("{name}", old.name || old.avatar);
    const yes = h("button", { class: "btn primary big" }, `${old.avatar} ${D().onboarding.yes}`);
    const no = h("button", { class: "btn" }, D().onboarding.no);
    screen.append(plume("m"), h("p", { class: "onb-say" }, q), h("div", { class: "row" }, yes, no));
    say(q, lang);
    yes.onclick = async () => { await state.store.setMeta({ v2Offered: true }); state.meta.v2Offered = true; await finish(old); };
    no.onclick = async () => { await state.store.setMeta({ v2Offered: true }); state.meta.v2Offered = true; step2(); };
  };

  // 2. La langue de la maison
  const step2 = () => {
    clear(screen);
    const grid = h("div", { class: "onb-grid flags" });
    for (const l of LANGS) {
      const b = h("button", { class: "onb-choice flag" + (l === state.pageLang ? " glow" : ""), "aria-label": ui(l).app.langName }, h("span", { class: "big" }, FLAGS[l]), h("small", {}, ui(l).app.langName));
      b.onclick = () => { sfx.tap(); lang = l; Promise.race([say(ui(l).app.langName, l), new Promise((r) => setTimeout(r, 1500))]).then(step3); };
      grid.appendChild(b);
    }
    screen.append(plume("s"), h("p", { class: "onb-say" }, D().onboarding.whichLang), grid);
    say(D().onboarding.whichLang, lang);
    later(grid.querySelector(".glow") ?? grid.firstElementChild!);
  };

  // 3. Son animal
  const step3 = () => {
    clear(screen);
    const grid = h("div", { class: "onb-grid animals" });
    for (const a of AVATARS.slice(0, 8)) {
      const b = h("button", { class: "onb-choice", "aria-label": a }, h("span", { class: "big" }, a));
      b.onclick = () => { sfx.pop(); avatar = a; b.classList.add("k-good"); setTimeout(step4, 350); };
      grid.appendChild(b);
    }
    screen.append(plume("s"), h("p", { class: "onb-say" }, D().onboarding.chooseAnimal), grid);
    say(D().onboarding.chooseAnimal, lang);
    later(grid.firstElementChild!);
  };

  // 4. L'âge (des bougies)
  const step4 = () => {
    clear(screen);
    const grid = h("div", { class: "onb-grid ages" });
    for (let a = 3; a <= 14; a++) {
      const b = h("button", { class: "onb-choice age", "aria-label": String(a) }, h("span", { class: "num" }, String(a)), h("span", { class: "candles" }, "🕯️".repeat(Math.min(a, 6)) + (a > 6 ? "+" : "")));
      b.onclick = () => { sfx.tap(); age = a; say(numberWords(a, lang), lang); b.classList.add("k-good"); setTimeout(step5, 500); };
      grid.appendChild(b);
    }
    const skip = h("button", { class: "btn ghost" }, D().onboarding.skip);
    skip.onclick = () => { age = 5; step5(); };
    screen.append(h("div", { class: "onb-me" }, avatar), h("p", { class: "onb-say" }, D().onboarding.howOld), grid, skip);
    say(D().onboarding.howOld, lang);
  };

  // 5. Le prénom (pour un parent), facultatif
  const step5 = () => {
    clear(screen);
    const input = h("input", { class: "input", maxlength: "20", placeholder: D().onboarding.namePlaceholder, autocomplete: "off", "aria-label": D().onboarding.nameTitle }) as HTMLInputElement;
    const ok = h("button", { class: "btn primary big" }, D().onboarding.ok);
    const skip = h("button", { class: "btn ghost" }, D().onboarding.skip);
    screen.append(h("div", { class: "onb-me" }, avatar), h("p", { class: "onb-small" }, D().onboarding.nameTitle), input, h("div", { class: "row" }, skip, ok));
    const go2 = () => finish(createProfile({ name: cleanName(input.value), avatar, age, uiLang: lang, learning: defaultLearning(lang) }));
    ok.onclick = go2; skip.onclick = () => { input.value = ""; go2(); };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") go2(); });
  };

  const finish = async (p: ReturnType<typeof createProfile>) => {
    await saveProfile(p);
    await selectProfile(p);
    track(`profil/nouveau/${p.uiLang}`);
    const first = ageOf(p) <= 5 ? "#/play/couleurs" : "#/home";
    if (!goToProfileLanguage(p, first)) go(first);
  };

  step1();
}
