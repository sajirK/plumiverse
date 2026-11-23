// Cours de langue : un jeu par langue apprise (langue-en, langue-de, langue-es, langue-fr).
import { L, type Lang } from "../../core/types";
import { ui } from "../../core/i18n";
import { answerWord, emptyLangProgress, sessionWords } from "../../core/leitner";
import { shuffle } from "../../core/util";
import { say } from "../../audio/voice";
import { sfx } from "../../audio/sfx";
import type { GameDef } from "../types";
import { UNITS, wordById, wordsOfUnit, tiles, sameWord, type Word } from "../../content/lang/course";
import { courseTrack, kindFor, choiceCount, choicesFor, unitsUpTo, sentencesFor, SPECIAL_LETTERS, type Kind } from "./logic";
import { h } from "../../ui/dom";

const FLAG: Record<Lang, string> = { fr: "🇫🇷", en: "🇬🇧", de: "🇩🇪", es: "🇪🇸" };
const NAMES = { fr: L("Français", "French", "Französisch", "Francés"), en: L("Anglais", "English", "Englisch", "Inglés"), de: L("Allemand", "German", "Deutsch", "Alemán"), es: L("Espagnol", "Spanish", "Spanisch", "Español") };

interface Session { words: string[]; recorded: Set<number> }

/** Image d'un mot : l'emoji, ou une pastille de couleur. */
function picture(w: Word, big = false): HTMLElement {
  if (w.color) { const s = h("span", { class: "lg-swatch" + (big ? " big" : "") }); s.style.background = w.color; return s; }
  return h("span", { class: "lg-emoji" + (big ? " big" : "") }, w.e);
}

function listenButton(word: string, lang: Lang, label: string): HTMLButtonElement {
  const b = h("button", { class: "lg-ear", "aria-label": label }, "🔊") as HTMLButtonElement;
  b.onclick = () => { sfx.tap(); say(word, lang); };
  return b;
}

export function languageGame(target: Lang): GameDef {
  return {
    id: `langue-${target}`,
    icon: FLAG[target],
    category: "langues",
    ages: [3, 14],
    title: NAMES[target],
    desc: L(
      `Apprendre le ${NAMES[target].fr.toLowerCase()} : écouter, reconnaître, lire, construire des phrases et écrire, avec des révisions espacées.`,
      `Learn ${NAMES[target].en}: listen, recognise, read, build sentences and write, with spaced review.`,
      `${NAMES[target].de} lernen: hören, erkennen, lesen, Sätze bauen und schreiben, mit Wiederholungen im richtigen Abstand.`,
      `Aprender ${NAMES[target].es.toLowerCase()}: escuchar, reconocer, leer, formar frases y escribir, con repasos espaciados.`,
    ),
    available: (ctx) => ctx.profile.learning.includes(target) && ctx.lang !== target,
    track: () => courseTrack(target),
    instruction(level, ctx) {
      const kind = kindFor(ctx.band, level.params.step as number, 0, level.params.unit as string);
      return ui(ctx.lang).course[kindKey(kind)];
    },
    setup(level, ctx): Session {
      const unit = level.params.unit as string;
      const lp = (ctx.profile.langs[target] ??= emptyLangProgress());
      const allIds = unitsUpTo(unit).flatMap((u) => wordsOfUnit(u).map((w) => w.id));
      const words = sessionWords(lp, wordsOfUnit(unit).map((w) => w.id), allIds, level.rounds);
      // une unité plus courte que la partie : on complète en boucle
      while (words.length < level.rounds) words.push(words[words.length % Math.max(1, words.length)] ?? wordsOfUnit(unit)[0].id);
      return { words, recorded: new Set() };
    },
    start(round, level, ctx) {
      const s = round.session as Session;
      const unit = level.params.unit as string;
      const kind = kindFor(ctx.band, level.params.step as number, round.index, unit);
      const word = wordById(s.words[round.index])!;
      const lp = (ctx.profile.langs[target] ??= emptyLangProgress());
      // on note le mot une seule fois par manche : juste du premier coup, ou faux
      const record = (ok: boolean) => { if (!s.recorded.has(round.index)) { s.recorded.add(round.index); answerWord(lp, word.id, ok); } };
      const won = (el?: Element | null) => { record(true); round.win(el ?? null, "", { praise: true, delay: kind === "build" ? 2600 : 1500 }); };
      const missed = (el: Element | null, hint = "") => { record(false); round.miss(el, hint); };
      const n = round.assist ? Math.max(2, choiceCount(ctx.band, level.params.step as number) - 1) : choiceCount(ctx.band, Math.min(4, level.params.step as number));
      const D = ui(ctx.lang);
      const wrap = h("div", { class: "lg-wrap" });
      round.stage.appendChild(wrap);

      if (kind === "listen") {
        const ear = listenButton(word.t[target].show, target, D.kit.repeat);
        ear.classList.add("big");
        const grid = h("div", { class: "lg-choices pics" });
        let good: HTMLElement | null = null;
        for (const c of choicesFor(word, n, "image")) {
          const b = h("button", { class: "lg-choice pic", "aria-label": c.t[ctx.lang].show }, picture(c));
          if (c.id === word.id) good = b;
          b.onclick = () => (c.id === word.id ? (say(word.t[target].show, target), won(b)) : missed(b));
          grid.appendChild(b);
        }
        wrap.append(ear, grid);
        round.setHintTarget(() => good);
        round.timeout(() => say(word.t[target].show, target, { interrupt: false }), round.index === 0 ? 200 : 350);
        return;
      }

      if (kind === "read" || kind === "translate" || kind === "reverse") {
        // read : image → mot (langue apprise) ; translate : mot appris → sa langue ; reverse : sa langue → mot appris
        const showLang: Lang = kind === "translate" ? ctx.lang : target;
        const prompt = h("div", { class: "lg-prompt" });
        if (kind === "read") prompt.append(picture(word, true));
        else if (kind === "translate") prompt.append(h("div", { class: "lg-word" }, word.t[target].show), listenButton(word.t[target].show, target, D.kit.repeat));
        else prompt.append(picture(word), h("div", { class: "lg-word" }, word.t[ctx.lang].show));
        const grid = h("div", { class: "lg-choices words" });
        let good: HTMLElement | null = null;
        for (const c of choicesFor(word, n, showLang)) {
          const b = h("button", { class: "lg-choice word" }, c.t[showLang].show);
          if (c.id === word.id) good = b;
          b.onclick = () => {
            if (showLang === target) say(c.t[target].show, target);
            if (c.id === word.id) { if (showLang !== target) say(word.t[target].show, target); won(b); } else missed(b);
          };
          grid.appendChild(b);
        }
        wrap.append(prompt, grid);
        round.setHintTarget(() => good);
        if (kind === "translate") round.timeout(() => say(word.t[target].show, target, { interrupt: false }), 300);
        return;
      }

      if (kind === "build") {
        const list = sentencesFor(unit);
        const sentence = list[round.index % list.length];
        const answer = tiles(sentence.t[target]);
        const prompt = h("div", { class: "lg-prompt" }, h("span", { class: "lg-emoji" }, sentence.e), h("div", { class: "lg-sentence" }, sentence.t[ctx.lang]));
        const line = h("div", { class: "lg-line" });
        const bank = h("div", { class: "lg-bank" });
        const placed: HTMLButtonElement[] = [];
        const bankBtns: HTMLButtonElement[] = [];
        const check = () => {
          if (placed.length < answer.length) return;
          const got = placed.map((b) => b.textContent);
          if (got.every((w, i) => w === answer[i])) { say(sentence.t[target], target); won(line); }
          else {
            missed(line);
            round.timeout(() => { [...placed].forEach((b) => unplace(b)); }, 700);
          }
        };
        const unplace = (b: HTMLButtonElement) => { placed.splice(placed.indexOf(b), 1); b.remove(); const src = bankBtns.find((x) => x.dataset.i === b.dataset.i); if (src) src.classList.remove("used"); };
        shuffle(answer.map((w, i) => ({ w, i }))).forEach(({ w, i }) => {
          const b = h("button", { class: "lg-tile", "data-i": String(i) }, w) as HTMLButtonElement;
          b.onclick = () => {
            if (b.classList.contains("used")) return;
            sfx.tap(); b.classList.add("used");
            const p = h("button", { class: "lg-tile placed", "data-i": String(i) }, w) as HTMLButtonElement;
            p.onclick = () => { sfx.tap(); unplace(p); };
            placed.push(p); line.appendChild(p);
            check();
          };
          bankBtns.push(b); bank.appendChild(b);
        });
        wrap.append(prompt, line, bank);
        // aide : la prochaine tuile juste (ou retirer la première tuile fausse)
        round.setHintTarget(() => {
          const wrongAt = placed.findIndex((b, i) => b.textContent !== answer[i]);
          if (wrongAt >= 0) return placed[wrongAt];
          const want = answer[placed.length];
          return bankBtns.find((b) => !b.classList.contains("used") && b.textContent === want) ?? null;
        });
        return;
      }

      // type : écrire le mot entendu
      const ear = listenButton(word.t[target].show, target, D.kit.repeat);
      ear.classList.add("big");
      const form = h("form", { class: "lg-type" }) as HTMLFormElement;
      const input = h("input", { class: "lg-input", autocomplete: "off", autocapitalize: "off", spellcheck: "false", lang: target, "aria-label": D.course.type }) as HTMLInputElement;
      const ok = h("button", { class: "k-btn primary", type: "submit", "aria-label": "OK" }, "✅");
      const letters = h("div", { class: "lg-letters" });
      for (const ch of SPECIAL_LETTERS[target]) {
        const b = h("button", { type: "button", class: "lg-letter" }, ch);
        b.onclick = () => { input.value += ch; input.focus(); };
        letters.appendChild(b);
      }
      form.append(input, ok);
      const mask = () => { const w = [...word.t[target].write]; return w[0] + "•".repeat(w.length - 1); };
      const helpLine = h("div", { class: "lg-help" }, round.assist ? mask() : "");
      form.onsubmit = (e) => {
        e.preventDefault();
        if (!input.value.trim()) return;
        if (sameWord(input.value, word.t[target].write)) { say(word.t[target].show, target); won(input); }
        else { missed(input, ""); input.value = ""; helpLine.textContent = mask(); }
      };
      wrap.append(ear, picture(word), form, letters, helpLine);
      // le robot de test (et l'aide) : remplir la bonne réponse puis valider
      (ok as HTMLButtonElement & { __robotFill?: () => void }).__robotFill = () => { input.value = word.t[target].write; };
      round.setHintTarget(() => ok);
      round.timeout(() => { say(word.t[target].show, target, { interrupt: false }); if (matchMedia("(pointer: fine)").matches) input.focus(); }, 300);
    },
  };
}

function kindKey(k: Kind): "listen" | "read" | "translate" | "build" | "type" {
  return k === "reverse" ? "translate" : k;
}

export const LANGUAGE_GAMES = (["en", "de", "es", "fr"] as Lang[]).map(languageGame);
export { UNITS };
