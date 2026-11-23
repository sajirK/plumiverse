// Respire avec moi (3-14 ans), comme en V2 : 5 respirations guidées, avec le ballon ou la fleur et la bougie.
import { L, type Track } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const CYCLES = 5, IN = 4000, HOLD = 1000, OUT = 5000, PAUSE = 600;
const SAY = {
  balloon: L("Le ballon", "The balloon", "Der Luftballon", "El globo"),
  flower: L("La fleur et la bougie", "The flower and the candle", "Die Blume und die Kerze", "La flor y la vela"),
  start: L("On respire ensemble, cinq fois. Installe-toi bien.", "Let's breathe together, five times. Get comfortable.", "Wir atmen zusammen, fünfmal. Mach es dir bequem.", "Respiramos juntos, cinco veces. Ponte cómodo."),
  inB: L("Inspire", "Breathe in", "Einatmen", "Inspira"),
  inF: L("Sens la fleur", "Smell the flower", "Riech an der Blume", "Huele la flor"),
  outB: L("Souffle doucement", "Breathe out gently", "Langsam ausatmen", "Sopla despacito"),
  outF: L("Souffle la bougie", "Blow out the candle", "Puste die Kerze aus", "Sopla la vela"),
  done: L("Bravo ! Tu as très bien respiré. Tu te sens plus calme ?", "Well done! You breathed beautifully. Do you feel calmer?", "Super! Du hast toll geatmet. Fühlst du dich ruhiger?", "¡Bravo! Has respirado muy bien. ¿Te sientes más tranquilo?"),
};
export const TRACK: Track = { chapters: [{ id: "r", tier: "facile", ages: [3, 14], title: L("Respire avec moi", "Breathe with me", "Atme mit mir", "Respira conmigo"), levels: [{ id: "souffle", rounds: 1, params: {}, skills: ["calme"] }] }] };

export const respireGame: GameDef = {
  id: "respire",
  icon: "🎈",
  category: "emotions",
  free: true,
  ages: [3, 14],
  title: L("Respire avec moi", "Breathe with me", "Atme mit mir", "Respira conmigo"),
  desc: L("Cinq grandes respirations guidées pour se calmer, avec un ballon ou une fleur et une bougie.", "Five guided deep breaths to calm down, with a balloon or a flower and a candle.", "Fünf geführte tiefe Atemzüge zum Ruhigwerden, mit Luftballon oder Blume und Kerze.", "Cinco respiraciones guiadas para calmarse, con un globo o una flor y una vela."),
  skills: { calme: L("Se calmer", "Calming down", "Sich beruhigen", "Calmarse") },
  speech: (lang) => Object.values(SAY).map((x) => x[lang]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Choisis le ballon ou la fleur, puis appuie sur le bouton vert. On va respirer ensemble.", "Choose the balloon or the flower, then press the green button. We'll breathe together.", "Wähl den Luftballon oder die Blume und drück dann auf den grünen Knopf. Wir atmen zusammen.", "Elige el globo o la flor y pulsa el botón verde. Vamos a respirar juntos.")[ctx.lang],
  start(round, _level, ctx) {
    const lang = ctx.lang;
    let kind = localStorage.getItem("plumi.respire.mode") === "fleur" ? "fleur" : "ballon", running = false;
    const choose = h("div", { class: "rs-choose" }), scene = h("div", { class: "rs-scene" }), cue = h("div", { class: "rs-cue" }), dots = h("div", { class: "rs-dots" });
    const go = h("button", { class: "k-btn primary rs-go", "aria-label": "▶️" }, "▶️");
    const wrap = h("div", { class: "rs-wrap" }, choose, scene, cue, dots, go);
    round.stage.appendChild(wrap);
    const balloon = h("div", { class: "rs-balloon" }, "🐻");
    const flame = h("span", { class: "rs-flame" }, "🔥");
    const flower = h("div", { class: "rs-flower" }, "🌸");
    const fc = h("div", { class: "rs-fc" }, flower, h("div", { class: "rs-candle" }, "🕯️", flame));
    const btns: Record<string, HTMLElement> = {};
    for (const [id, e, name] of [["ballon", "🎈", SAY.balloon], ["fleur", "🌸", SAY.flower]] as const) {
      const b = h("button", { "aria-label": name[lang] }, e);
      b.onclick = () => { if (running) return; kind = id; localStorage.setItem("plumi.respire.mode", id); sfx.click(); show(); round.say(name[lang]); };
      choose.appendChild(b); btns[id] = b;
    }
    const show = () => { scene.replaceChildren(kind === "ballon" ? balloon : fc); for (const [k, b] of Object.entries(btns)) b.classList.toggle("sel", k === kind); };
    show();
    for (let i = 0; i < CYCLES; i++) dots.appendChild(h("i"));
    function breathIn(i: number) {
      wrap.classList.remove("out"); cue.textContent = "👃";
      round.say((kind === "ballon" ? SAY.inB : SAY.inF)[lang]);
      balloon.style.transition = `transform ${IN}ms ease-in-out`; balloon.style.transform = "scale(1)";
      flower.classList.add("active"); flame.classList.remove("out");
      sfx.noise(IN / 1000, { from: 300, to: 700, q: 0.6, volume: 0.05 });
      round.timeout(() => (cue.textContent = "🤫"), IN);
      round.timeout(() => breathOut(i), IN + HOLD);
    }
    function breathOut(i: number) {
      wrap.classList.add("out"); cue.textContent = "🌬️";
      round.say((kind === "ballon" ? SAY.outB : SAY.outF)[lang]);
      balloon.style.transition = `transform ${OUT}ms ease-in-out`; balloon.style.transform = "scale(0.55)";
      flower.classList.remove("active"); flame.classList.add("out");
      sfx.noise(OUT / 1000, { from: 700, to: 250, q: 0.6, volume: 0.05 });
      dots.children[i].classList.add("on");
      round.timeout(() => (i + 1 < CYCLES ? breathIn(i + 1) : finish()), OUT + PAUSE);
    }
    function finish() {
      wrap.classList.remove("out"); flame.classList.remove("out"); cue.textContent = "💛";
      sfx.bell(784, 0, 0.2, 1.5);
      round.win(null, SAY.done[lang], { praise: false, delay: 3500 });
    }
    go.onclick = () => {
      if (running) return;
      running = true; go.style.visibility = "hidden"; choose.style.visibility = "hidden";
      round.say(SAY.start[lang]);
      round.timeout(() => breathIn(0), 3500);
    };
    round.setHintTarget(() => (running ? null : go));
  },
};
