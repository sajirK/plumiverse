// Mes émotions (3-8 ans) : les 3 jeux d'émotions de la V2 en un parcours.
//   chapitre 1 « Devine l'émotion » (visages), chapitre 2 « Les histoires d'émotions », chapitre 3 « Que ferais-tu ? »
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { EMOTIONS, LEVEL_EMOTIONS, SITUATIONS, CHOICES, howFeels, COLOR_NAMES, WHAT_WOULD, NOT_SURE, YES, type Emo, type Situation, type Choice } from "./content";

export function faceQ(lv: 1 | 2 | 3, rng: Rng = Math.random, avoid: Emo | null = null) {
  const pool = LEVEL_EMOTIONS[lv];
  const answer = pick(pool.filter((e) => e !== avoid), rng);
  const others = shuffle(pool.filter((e) => e !== answer), rng).slice(0, (lv === 1 ? 3 : 4) - 1);
  return { answer, options: shuffle([answer, ...others], rng) };
}
/** Une situation : les autres choix ne sont JAMAIS des émotions aussi possibles. */
export function situationQ(lv: 1 | 2 | 3, rng: Rng = Math.random, avoid: Situation | null = null) {
  const allowed = LEVEL_EMOTIONS[lv];
  const s = pick(SITUATIONS.filter((x) => allowed.includes(x.answer) && x !== avoid), rng);
  const forbidden = new Set([s.answer, ...s.alsoOk]);
  const others = shuffle(allowed.filter((e) => !forbidden.has(e)), rng).slice(0, (lv === 1 ? 3 : 4) - 1);
  return { s, options: shuffle([s.answer, ...others], rng) };
}
export function stories(n: number, options: number, rng: Rng = Math.random): Choice[] {
  return shuffle(CHOICES, rng).slice(0, n).map((c) => {
    const good = c.options.find((o) => o.good)!;
    return { ...c, options: shuffle([good, ...shuffle(c.options.filter((o) => !o.good), rng).slice(0, options - 1)], rng) };
  });
}
export const feels = (s: Situation, e: Emo, lang: Lang) => { const t = `${s.who} ${EMOTIONS[e][s.g][lang]}`; return lang === "es" ? `${t}.` : `${t}.`; };
const COLORS = ["#4dabf7", "#ffa94d", "#b197fc"];

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [params.mode === "face" ? "reconnaitre" : params.mode === "story" ? "comprendre" : "agir"] });
export const TRACK: Track = {
  chapters: [
    { id: "e1", tier: "facile", ages: [3, 4], title: L("Devine l'émotion", "Guess the feeling", "Errate das Gefühl", "Adivina la emoción"), levels: [lv("1-1", 5, { mode: "face", lv: 1 }), lv("1-2", 6, { mode: "face", lv: 2 }), lv("1-b", 8, { mode: "face", lv: 3 }, true)] },
    { id: "e2", tier: "moyen", ages: [5, 6], title: L("Les histoires d'émotions", "Feeling stories", "Gefühlsgeschichten", "Historias de emociones"), levels: [lv("2-1", 4, { mode: "story", lv: 1 }), lv("2-2", 5, { mode: "story", lv: 2 }), lv("2-b", 6, { mode: "story", lv: 3 }, true)] },
    { id: "e3", tier: "difficile", ages: [7, 8], title: L("Que ferais-tu ?", "What would you do?", "Was würdest du tun?", "¿Qué harías tú?"), levels: [lv("3-1", 4, { mode: "choice", options: 2 }), lv("3-2", 5, { mode: "choice", options: 3 }), lv("3-b", 6, { mode: "choice", options: 3 }, true)] },
  ],
};

export const emotionsGame: GameDef = {
  id: "emotions",
  icon: "😊",
  category: "emotions",
  ages: [3, 8],
  title: L("Mes émotions", "My feelings", "Meine Gefühle", "Mis emociones"),
  desc: L("Reconnaître les émotions sur un visage, comprendre ce que ressent quelqu'un, et choisir la réaction la plus gentille.", "Recognise feelings on a face, understand how someone feels, and choose the kindest reaction.", "Gefühle in Gesichtern erkennen, verstehen, wie sich jemand fühlt, und die netteste Reaktion wählen.", "Reconocer emociones en una cara, entender cómo se siente alguien y elegir la reacción más amable."),
  skills: { reconnaitre: L("Reconnaître une émotion", "Recognising feelings", "Gefühle erkennen", "Reconocer emociones"), comprendre: L("Comprendre les autres", "Understanding others", "Andere verstehen", "Entender a los demás"), agir: L("Bien réagir", "Reacting kindly", "Gut reagieren", "Reaccionar bien") },
  speech: (lang) => [
    YES[lang], NOT_SURE[lang], WHAT_WOULD[lang],
    ...Object.values(EMOTIONS).flatMap((e) => [e.label[lang], e.find[lang], e.isThis[lang], e.body[lang], ...e.tips.map((t) => t[lang])]),
    ...SITUATIONS.flatMap((s) => [s.text[lang], howFeels(s)[lang], feels(s, s.answer, lang)]),
    ...CHOICES.flatMap((c) => [c.text[lang], ...c.options.flatMap((o) => [o.t[lang], o.why[lang], ...COLOR_NAMES.map((n) => `${n[lang]} ${o.t[lang]}`)])]),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => ({
    face: L("Écoute l'émotion, et touche le bon visage !", "Listen to the feeling and tap the right face!", "Hör dir das Gefühl an und tipp auf das richtige Gesicht!", "¡Escucha la emoción y toca la cara correcta!"),
    story: L("Écoute l'histoire. Comment se sent le personnage ?", "Listen to the story. How does the character feel?", "Hör dir die Geschichte an. Wie fühlt sich die Person?", "Escucha la historia. ¿Cómo se siente?"),
    choice: L("Écoute l'histoire, puis choisis ce que tu ferais. Choisis la réponse la plus gentille !", "Listen to the story, then choose what you would do. Pick the kindest answer!", "Hör dir die Geschichte an und wähl, was du tun würdest. Nimm die netteste Antwort!", "Escucha la historia y elige lo que harías. ¡Elige la respuesta más amable!"),
  } as Record<string, ReturnType<typeof L>>)[level.params.mode as string][ctx.lang],
  setup: (level) => (level.params.mode === "choice" ? stories(level.rounds, level.params.options as number) : { last: null }),
  start(round, level, ctx) {
    const lang = ctx.lang, mode = level.params.mode as string;
    const wrap = h("div", { class: "ca-wrap em-wrap" });
    round.stage.appendChild(wrap);
    const faceBtn = (k: Emo) => h("button", { class: "k-choice em-face", style: { "--c": EMOTIONS[k].color }, "aria-label": EMOTIONS[k].label[lang] }, h("span", {}, EMOTIONS[k].emoji), h("small", {}, EMOTIONS[k].label[lang]));
    if (mode === "face") {
      const sess = round.session as { last: Emo | null };
      const q = faceQ(level.params.lv as 1 | 2 | 3, Math.random, sess.last);
      sess.last = q.answer;
      const e = EMOTIONS[q.answer];
      const ask = () => round.say(e.find[lang]);
      const prompt = h("button", { class: "cf-target", "aria-label": "🔊" }, "👂❓");
      prompt.onclick = ask;
      const body = h("div", { class: "em-body" });
      const row = h("div", { class: "k-choices" });
      let good: HTMLElement | null = null;
      for (const k of q.options) {
        const b = faceBtn(k);
        if (k === q.answer) good = b;
        b.onclick = () => {
          if (round.ended) return;
          if (k === q.answer) { body.textContent = e.body[lang]; round.say(e.isThis[lang]); round.win(b, e.body[lang], { praise: false, delay: 3800 }); }
          else { round.miss(b, EMOTIONS[k].isThis[lang]); round.say(e.find[lang], lang, { interrupt: false }); }
        };
        row.appendChild(b);
      }
      wrap.append(prompt, row, body);
      round.setHintTarget(() => good);
      round.timeout(ask, round.index === 0 ? 2400 : 350);
      return;
    }
    if (mode === "story") {
      const sess = round.session as { last: Situation | null };
      const q = situationQ(level.params.lv as 1 | 2 | 3, Math.random, sess.last);
      sess.last = q.s;
      const tell = () => { round.say(q.s.text[lang]); round.say(howFeels(q.s)[lang], lang, { interrupt: false }); };
      const card = h("button", { class: "em-scene", "aria-label": "🔊" }, h("span", { class: "em-pic" }, q.s.scene), h("small", {}, q.s.text[lang]));
      card.onclick = tell;
      const tip = h("div", { class: "em-body" });
      const row = h("div", { class: "k-choices" });
      let good: HTMLElement | null = null;
      for (const k of q.options) {
        const b = faceBtn(k);
        if (k === q.s.answer) good = b;
        b.onclick = () => {
          if (round.ended) return;
          if (k === q.s.answer) {
            const t = pick(EMOTIONS[k].tips)[lang];
            tip.textContent = t;
            round.say(YES[lang]); round.say(feels(q.s, k, lang), lang, { interrupt: false }); round.say(t, lang, { interrupt: false });
            round.win(b, "", { praise: false, delay: 5200 });
          } else { round.miss(b, NOT_SURE[lang]); round.say(q.s.text[lang], lang, { interrupt: false }); }
        };
        row.appendChild(b);
      }
      wrap.append(card, row, tip);
      round.setHintTarget(() => good);
      round.timeout(tell, round.index === 0 ? 2800 : 350);
      return;
    }
    // Que ferais-tu ? — les enfants ne lisent pas encore : chaque réponse a une grosse pastille de couleur,
    // la voix lit « Le bleu : … », et la réponse lue s'allume pendant qu'on l'entend.
    const c = (round.session as Choice[])[round.index];
    const why = h("div", { class: "em-body" });
    const opts = h("div", { class: "em-opts" });
    let good: HTMLElement | null = null;
    const btns: HTMLElement[] = [];
    let reading = 0;
    const readAll = async () => {
      const my = ++reading;
      btns.forEach((b) => b.classList.remove("reading"));
      round.say(c.text[lang]);
      await round.say(WHAT_WOULD[lang], lang, { interrupt: false });
      for (let i = 0; i < c.options.length; i++) {
        if (my !== reading || round.ended) return;
        btns.forEach((b) => b.classList.remove("reading"));
        btns[i].classList.add("reading");
        await round.say(`${COLOR_NAMES[i][lang]} ${c.options[i].t[lang]}`, lang, { interrupt: false });
      }
      if (my === reading) btns.forEach((b) => b.classList.remove("reading"));
    };
    const card = h("button", { class: "em-scene", "aria-label": "🔊" }, h("span", { class: "em-pic" }, c.scene), h("small", {}, c.text[lang]), h("span", { class: "em-replay" }, "🔊"));
    card.onclick = () => void readAll();
    c.options.forEach((o, i) => {
      const listen = h("span", { class: "em-listen", role: "button", "aria-label": "🔊" }, "🔊");
      const b = h("button", { class: "em-opt", style: { "--c": COLORS[i] } }, h("span", { class: "em-badge" }, o.e), h("span", { class: "em-t" }, o.t[lang]), listen);
      listen.addEventListener("click", (ev) => { ev.stopPropagation(); reading++; btns.forEach((x) => x.classList.remove("reading")); b.classList.add("reading"); void round.say(`${COLOR_NAMES[i][lang]} ${o.t[lang]}`).then(() => b.classList.remove("reading")); });
      if (o.good) good = b;
      b.onclick = () => {
        if (round.ended) return;
        reading++; btns.forEach((x) => x.classList.remove("reading"));
        why.textContent = (o.good ? "💛 " : "🤔 ") + o.why[lang];
        if (o.good) round.win(b, o.why[lang], { praise: false, delay: 4200 }); else round.miss(b, o.why[lang]);
      };
      opts.appendChild(b); btns.push(b);
    });
    wrap.append(card, opts, why);
    round.setHintTarget(() => good);
    round.timeout(() => void readAll(), round.index === 0 ? 3600 : 400);
  },
};
