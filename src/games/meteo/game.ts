// Ma météo du jour (3-8 ans), comme en V2 : dire comment on se sent (un peu, beaucoup, énormément),
// recevoir des idées qui aident, et voir sa semaine. Jeu libre : pas de bonne ou de mauvaise réponse.
import { L, type Lang, type Track, type Tr } from "../../core/types";
import { dayKey, addDays } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { EMOTIONS, type Emo } from "../emotions/content";

export const ORDER: Emo[] = ["joie", "calme", "surprise", "fatigue", "tristesse", "colere", "peur", "degout"];
export const POSITIVE = new Set<Emo>(["joie", "calme"]);
const TIP_ICONS: Record<Emo, string[]> = { joie: ["🗣️", "💃"], tristesse: ["🤗", "🗣️", "💧"], colere: ["🎈", "🛋️", "🗣️"], peur: ["👨‍👩‍👧", "🧸"], surprise: ["👀", "🗣️"], degout: ["🙅", "🗣️"], calme: ["🌸", "📖"], fatigue: ["🛏️", "🤗"] };
const LINKS: Record<string, string> = { "🎈": "respire", "💃": "piano" };
/** Ce que dit Plumi : jamais « ne sois pas triste », toutes les émotions sont normales. */
export const MESSAGE: Record<Emo, Tr> = {
  joie: L("Merci de me l'avoir dit ! La joie, c'est bon à sentir. Profites-en !", "Thank you for telling me! Joy feels good. Enjoy it!", "Danke, dass du es mir sagst! Freude fühlt sich gut an. Genieß es!", "¡Gracias por contármelo! La alegría sienta bien. ¡Disfrútala!"),
  calme: L("Merci de me l'avoir dit ! Le calme, c'est bon à sentir. Profites-en !", "Thank you for telling me! Feeling calm is lovely. Enjoy it!", "Danke, dass du es mir sagst! Ruhe fühlt sich gut an. Genieß es!", "¡Gracias por contármelo! La calma sienta bien. ¡Disfrútala!"),
  surprise: L("Merci de me l'avoir dit. Tout le monde est surpris, parfois. C'est normal !", "Thank you for telling me. Everyone gets surprised sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder ist manchmal überrascht. Das ist normal!", "Gracias por contármelo. Todo el mundo se sorprende a veces. ¡Es normal!"),
  fatigue: L("Merci de me l'avoir dit. Tout le monde est fatigué, parfois. C'est normal !", "Thank you for telling me. Everyone gets tired sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder ist manchmal müde. Das ist normal!", "Gracias por contármelo. Todo el mundo se cansa a veces. ¡Es normal!"),
  tristesse: L("Merci de me l'avoir dit. Tout le monde ressent de la tristesse, parfois. C'est normal !", "Thank you for telling me. Everyone feels sad sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder ist manchmal traurig. Das ist normal!", "Gracias por contármelo. Todo el mundo se pone triste a veces. ¡Es normal!"),
  colere: L("Merci de me l'avoir dit. Tout le monde ressent de la colère, parfois. C'est normal !", "Thank you for telling me. Everyone feels angry sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder ist manchmal wütend. Das ist normal!", "Gracias por contármelo. Todo el mundo se enfada a veces. ¡Es normal!"),
  peur: L("Merci de me l'avoir dit. Tout le monde ressent de la peur, parfois. C'est normal !", "Thank you for telling me. Everyone feels scared sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder hat manchmal Angst. Das ist normal!", "Gracias por contármelo. Todo el mundo tiene miedo a veces. ¡Es normal!"),
  degout: L("Merci de me l'avoir dit. Tout le monde ressent du dégoût, parfois. C'est normal !", "Thank you for telling me. Everyone feels disgusted sometimes. That's normal!", "Danke, dass du es mir sagst. Jeder ekelt sich manchmal. Das ist normal!", "Gracias por contármelo. Todo el mundo siente asco a veces. ¡Es normal!"),
};
const SAY = {
  how: L("Comment tu te sens aujourd'hui ? Touche le visage qui te ressemble.", "How do you feel today? Tap the face that looks like you.", "Wie fühlst du dich heute? Tipp auf das Gesicht, das zu dir passt.", "¿Cómo te sientes hoy? Toca la cara que se parece a ti."),
  much: L("Un peu, beaucoup, ou énormément ?", "A little, a lot, or very very much?", "Ein bisschen, viel oder ganz doll?", "¿Un poco, mucho o muchísimo?"),
  adult: L("Si c'est très fort, va voir un adulte que tu aimes.", "If it's very strong, go and see a grown-up you love.", "Wenn es ganz stark ist, geh zu einem Erwachsenen, den du lieb hast.", "Si es muy fuerte, ve a ver a un adulto que quieras."),
  thanks: L("Merci de m'avoir dit comment tu te sens !", "Thank you for telling me how you feel!", "Danke, dass du mir gesagt hast, wie du dich fühlst!", "¡Gracias por contarme cómo te sientes!"),
};
const SIZES = [L("un peu", "a little", "ein bisschen", "un poco"), L("beaucoup", "a lot", "viel", "mucho"), L("énormément", "very very much", "ganz doll", "muchísimo")];
const WEEKDAYS: Record<Lang, string[]> = { fr: ["D", "L", "M", "M", "J", "V", "S"], en: ["S", "M", "T", "W", "T", "F", "S"], de: ["S", "M", "D", "M", "D", "F", "S"], es: ["D", "L", "M", "X", "J", "V", "S"] };
export const needsAdult = (k: Emo, intensity: number) => !POSITIVE.has(k) && intensity === 2;

export const TRACK: Track = { chapters: [{ id: "m", tier: "facile", ages: [3, 14], title: L("Ma météo du jour", "My mood today", "Mein Wetter heute", "Mi tiempo de hoy"), levels: [{ id: "jour", rounds: 1, params: {}, skills: ["ressentir"] }] }] };

export const meteoGame: GameDef = {
  id: "meteo",
  icon: "🌤️",
  category: "emotions",
  free: true,
  ages: [3, 8],
  title: L("Ma météo du jour", "My mood today", "Mein Gefühlswetter", "Mi tiempo de hoy"),
  desc: L("Dire comment on se sent aujourd'hui, recevoir des idées qui aident, et voir sa semaine d'émotions.", "Say how you feel today, get ideas that help, and see your week of feelings.", "Sagen, wie man sich heute fühlt, hilfreiche Ideen bekommen und die eigene Gefühlswoche sehen.", "Decir cómo te sientes hoy, recibir ideas que ayudan y ver tu semana de emociones."),
  skills: { ressentir: L("Nommer ce qu'on ressent", "Naming feelings", "Gefühle benennen", "Nombrar lo que sentimos") },
  speech: (lang) => [...Object.values(SAY).map((x) => x[lang]), ...Object.values(MESSAGE).map((x) => x[lang])],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Dis-moi comment tu te sens aujourd'hui. Quand tu as fini, appuie sur le bouton vert.", "Tell me how you feel today. When you're done, press the green button.", "Sag mir, wie du dich heute fühlst. Wenn du fertig bist, drück auf den grünen Knopf.", "Dime cómo te sientes hoy. Cuando termines, pulsa el botón verde.")[ctx.lang],
  start(round, _level, ctx) {
    const lang = ctx.lang;
    const key = `plumi.meteo.${(ctx.profile as { id?: string }).id ?? "x"}`;
    const journal = (): Record<string, { e: Emo; i: number }> => { try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; } };
    const step = h("div", { class: "mt-step" });
    const done = h("button", { class: "k-btn primary", "aria-label": "✅" }, "✅");
    done.onclick = () => { if (!round.ended) round.win(null, SAY.thanks[lang], { praise: false, delay: 1800 }); };
    round.stage.append(step, done);
    function chooseEmotion(speak = true) {
      step.innerHTML = "";
      const grid = h("div", { class: "mt-grid" });
      for (const k of ORDER) {
        const b = h("button", { class: "mt-emo", style: { background: EMOTIONS[k].color }, "aria-label": EMOTIONS[k].label[lang] }, h("span", {}, EMOTIONS[k].emoji));
        b.onclick = () => { sfx.pop(); round.say(EMOTIONS[k].label[lang]); chooseSize(k); };
        grid.appendChild(b);
      }
      step.appendChild(grid);
      if (speak) round.say(SAY.how[lang]);
    }
    function chooseSize(k: Emo) {
      step.innerHTML = "";
      const sizes = h("div", { class: "mt-sizes" });
      SIZES.forEach((label, i) => {
        const b = h("button", { class: "mt-size", "aria-label": label[lang] }, h("span", { style: { fontSize: [0.6, 0.85, 1.15][i] * 90 + "px" } }, EMOTIONS[k].emoji));
        b.onclick = () => result(k, i);
        sizes.appendChild(b);
      });
      step.appendChild(sizes);
      round.say(SAY.much[lang], lang, { interrupt: false });
    }
    function result(k: Emo, intensity: number, silent = false) {
      const e = EMOTIONS[k], j = journal();
      j[dayKey()] = { e: k, i: intensity };
      const keys = Object.keys(j).sort();
      while (keys.length > 60) delete j[keys.shift()!];
      try { localStorage.setItem(key, JSON.stringify(j)); } catch { /* plein */ }
      step.innerHTML = "";
      const tell = () => { round.say(MESSAGE[k][lang]); e.tips.forEach((t) => round.say(t[lang], lang, { interrupt: false })); if (needsAdult(k, intensity)) round.say(SAY.adult[lang], lang, { interrupt: false }); };
      const face = h("button", { class: "mt-face", style: { background: e.color, "--feeling-size": `${1.12 + intensity * 0.12}` }, "aria-label": "🔊" }, e.emoji);
      face.onclick = tell;
      const tips = h("div", { class: "mt-tips" });
      e.tips.forEach((t, i) => {
        const icon = TIP_ICONS[k][i] ?? "💡", link = LINKS[icon];
        const b = link ? h("a", { class: "mt-tip link", href: `#/game/${link}`, "aria-label": t[lang] }, icon) : h("button", { class: "mt-tip", "aria-label": t[lang] }, icon);
        if (!link) (b as HTMLButtonElement).onclick = () => round.say(t[lang]);
        tips.appendChild(b);
      });
      const card = h("div", { class: "mt-card" }, face, tips);
      if (needsAdult(k, intensity)) card.appendChild(h("div", { class: "mt-adult" }, "👨‍👩‍👧"));
      const week = h("div", { class: "mt-week" });
      const jj = journal();
      for (let d = -6; d <= 0; d++) {
        const dk = addDays(dayKey(), d), entry = jj[dk], wd = new Date(dk + "T12:00:00").getDay();
        week.appendChild(h("div", { class: "mt-day" + (d === 0 ? " today" : "") }, h("span", {}, entry && EMOTIONS[entry.e] ? EMOTIONS[entry.e].emoji : "·"), d === 0 ? "★" : WEEKDAYS[lang][wd]));
      }
      const again = h("button", { class: "k-btn", "aria-label": "🔁" }, "🔁");
      again.onclick = () => { sfx.click(); chooseEmotion(); };
      step.append(card, week, again);
      if (!silent) { sfx.bell(659, 0, 0.18, 1); if (POSITIVE.has(k)) round.burst(face, [e.emoji, "✨"]); tell(); }
    }
    const today = journal()[dayKey()];
    if (today && EMOTIONS[today.e]) result(today.e, today.i ?? 0, true);
    else { chooseEmotion(false); round.timeout(() => round.say(SAY.how[lang]), 2600); }
    round.setHintTarget(() => done);
  },
};
