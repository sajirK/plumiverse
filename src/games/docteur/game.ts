// Le docteur des animaux (3-8 ans) : choisir le bon outil dans la trousse, puis soigner l'animal étape par étape.
// Tout se fait en touchant : l'outil, puis l'endroit qui a mal (plusieurs fois pour frotter ou donner du sirop).
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const TOOLS: Record<string, { e: string; name: Tr }> = {
  desinfectant: { e: "🧴", name: L("le désinfectant", "the disinfectant", "das Desinfektionsmittel", "el desinfectante") },
  pansement: { e: "🩹", name: L("le pansement", "the plaster", "das Pflaster", "la tirita") },
  thermometre: { e: "🌡️", name: L("le thermomètre", "the thermometer", "das Thermometer", "el termómetro") },
  sirop: { e: "🥄", name: L("le sirop", "the medicine", "der Saft", "el jarabe") },
  glace: { e: "🧊", name: L("la poche de glace", "the ice pack", "der Eisbeutel", "la bolsa de hielo") },
  loupe: { e: "🔍", name: L("la loupe", "the magnifying glass", "die Lupe", "la lupa") },
  pince: { e: "🥢", name: L("la pince", "the tweezers", "die Pinzette", "las pinzas") },
  stethoscope: { e: "🩺", name: L("le stéthoscope", "the stethoscope", "das Stethoskop", "el estetoscopio") },
  eponge: { e: "🧽", name: L("l'éponge", "the sponge", "der Schwamm", "la esponja") },
  radio: { e: "📷", name: L("l'appareil de radio", "the X-ray machine", "das Röntgengerät", "la máquina de rayos X") },
  platre: { e: "🧻", name: L("le plâtre", "the cast", "der Gips", "la escayola") },
};
/** Zones (en % de la boîte du patient) : [x, y]. */
export const ZONES: Record<string, [number, number]> = { front: [50, 18], bouche: [50, 40], joue: [66, 32], ventre: [50, 70], patte: [20, 62], jambe: [64, 90] };
const MUD: [number, number][] = [[30, 30], [70, 55], [40, 78]];

export interface StepDef { tool: string; zone: string; taps: number; pull?: boolean; mud?: boolean; say: Tr }
const S = (tool: string, zone: string, taps: number, say: Tr, extra: Partial<StepDef> = {}): StepDef => ({ tool, zone, taps, say, ...extra });
export const AILMENTS: Record<string, { intro: Tr; icon: string; simple?: boolean; steps: StepDef[] }> = {
  bobo: { icon: "🤕", simple: true, intro: L("Aïe ! Je suis tombé, j'ai un bobo sur la joue !", "Ouch! I fell over and hurt my cheek!", "Aua! Ich bin hingefallen und habe eine Wunde an der Backe!", "¡Ay! ¡Me he caído y tengo una herida en la mejilla!"), steps: [
    S("desinfectant", "joue", 3, L("Frotte le bobo avec le désinfectant.", "Clean the cut with the disinfectant.", "Reib die Wunde mit dem Desinfektionsmittel ab.", "Limpia la herida con el desinfectante.")),
    S("pansement", "joue", 1, L("Pose un pansement sur le bobo.", "Put a plaster on the cut.", "Kleb ein Pflaster auf die Wunde.", "Pon una tirita en la herida.")),
  ] },
  boue: { icon: "🟤", simple: true, intro: L("J'ai sauté dans les flaques ! Je suis tout sale !", "I jumped in the puddles! I'm all dirty!", "Ich bin in die Pfützen gesprungen! Ich bin ganz schmutzig!", "¡He saltado en los charcos! ¡Estoy todo sucio!"), steps: [
    S("eponge", "mud", 3, L("Frotte les taches de boue avec l'éponge.", "Scrub the mud spots with the sponge.", "Schrubb die Schlammflecken mit dem Schwamm weg.", "Frota las manchas de barro con la esponja."), { mud: true }),
  ] },
  ventre: { icon: "🍬", simple: true, intro: L("Oh là là, j'ai mal au ventre !", "Oh dear, I've got a tummy ache!", "Oje, ich habe Bauchweh!", "¡Ay, me duele la barriga!"), steps: [
    S("stethoscope", "ventre", 3, L("Écoute son ventre avec le stéthoscope.", "Listen to the tummy with the stethoscope.", "Hör den Bauch mit dem Stethoskop ab.", "Escucha la barriga con el estetoscopio.")),
    S("sirop", "bouche", 2, L("Donne-lui du sirop dans la bouche.", "Give some medicine in the mouth.", "Gib ihm Saft in den Mund.", "Dale jarabe en la boca.")),
  ] },
  fievre: { icon: "🤒", intro: L("J'ai chaud, j'ai froid… je suis malade !", "I'm hot, I'm cold… I'm ill!", "Mir ist heiß, mir ist kalt… ich bin krank!", "Tengo calor, tengo frío… ¡estoy malito!"), steps: [
    S("thermometre", "bouche", 1, L("Mets le thermomètre dans sa bouche.", "Put the thermometer in the mouth.", "Steck das Thermometer in den Mund.", "Pon el termómetro en la boca.")),
    S("sirop", "bouche", 3, L("Il a de la fièvre ! Donne-lui du sirop.", "A fever! Give some medicine.", "Fieber! Gib ihm Saft.", "¡Tiene fiebre! Dale jarabe.")),
    S("glace", "front", 1, L("Pose la glace sur son front.", "Put the ice pack on the forehead.", "Leg den Eisbeutel auf die Stirn.", "Pon el hielo en la frente.")),
  ] },
  epine: { icon: "🌵", intro: L("Aïe aïe aïe ! J'ai marché sur quelque chose qui pique !", "Ouch ouch! I stepped on something prickly!", "Aua aua! Ich bin auf etwas Spitzes getreten!", "¡Ay, ay, ay! ¡He pisado algo que pincha!"), steps: [
    S("loupe", "patte", 2, L("Cherche sur sa patte avec la loupe.", "Look at the paw with the magnifying glass.", "Untersuch die Pfote mit der Lupe.", "Busca en la pata con la lupa.")),
    S("pince", "patte", 1, L("Une épine ! Attrape-la avec la pince !", "A thorn! Pull it out with the tweezers!", "Ein Dorn! Zieh ihn mit der Pinzette heraus!", "¡Una espina! ¡Sácala con las pinzas!"), { pull: true }),
    S("pansement", "patte", 1, L("Un petit pansement pour finir.", "A little plaster to finish.", "Zum Schluss ein kleines Pflaster.", "Una tirita para terminar.")),
  ] },
  jambe: { icon: "🦴", intro: L("Je suis tombé de vélo, j'ai très mal à la jambe !", "I fell off my bike, my leg really hurts!", "Ich bin vom Fahrrad gefallen, mein Bein tut sehr weh!", "¡Me he caído de la bici, me duele mucho la pierna!"), steps: [
    S("radio", "jambe", 2, L("Passe l'appareil de radio sur sa jambe.", "Move the X-ray machine over the leg.", "Röntge das Bein.", "Pasa la máquina de rayos X por la pierna.")),
    S("platre", "jambe", 3, L("L'os est cassé ! Mets le plâtre sur sa jambe.", "The bone is broken! Put a cast on the leg.", "Der Knochen ist gebrochen! Mach einen Gips um das Bein.", "¡El hueso está roto! Pon la escayola en la pierna.")),
  ] },
};
export const SAY = {
  wrong: [L("Hihi, ça chatouille ! Ce n'est pas le bon outil.", "Hee hee, that tickles! That's not the right tool.", "Hihi, das kitzelt! Das ist nicht das richtige Werkzeug.", "¡Jiji, qué cosquillas! No es la herramienta correcta."), L("Hihihi ! Essaie un autre outil.", "Hee hee! Try another tool.", "Hihihi! Versuch ein anderes Werkzeug.", "¡Jijiji! Prueba otra herramienta.")],
  good: [L("Bravo !", "Well done!", "Super!", "¡Bravo!"), L("C'est mieux !", "That's better!", "Schon besser!", "¡Así está mejor!"), L("Très bien !", "Very good!", "Sehr gut!", "¡Muy bien!")],
  cured: L("Merci docteur ! Je me sens beaucoup mieux !", "Thank you, doctor! I feel much better!", "Danke, Doktor! Mir geht es viel besser!", "¡Gracias, doctor! ¡Me siento mucho mejor!"),
};
const ANIMALS = ["🐶", "🐱", "🐰", "🐻", "🐼", "🐸", "🐷", "🦊", "🐯", "🐨", "🦁", "🐵"];

export interface Cfg { ailments: string[]; tray: number; glow: boolean; tapScale: number }
export const stepsFor = (id: string, c: Cfg): StepDef[] => AILMENTS[id].steps.map((s) => ({ ...s, taps: s.mud ? MUD.length : Math.max(1, Math.round(s.taps * c.tapScale)) }));
export function trayFor(ailments: string[], size: number, rng: Rng = Math.random): string[] {
  const needed = [...new Set(ailments.flatMap((a) => AILMENTS[a].steps.map((s) => s.tool)))];
  const others = shuffle(Object.keys(TOOLS).filter((t) => !needed.includes(t)), rng);
  return shuffle([...needed, ...others].slice(0, Math.max(size, needed.length)), rng);
}
export function session(c: Cfg, rounds: number, rng: Rng = Math.random) {
  const ailments: string[] = [];
  let pool: string[] = [];
  for (let i = 0; i < rounds; i++) { if (!pool.length) pool = shuffle(c.ailments, rng); ailments.push(pool.pop()!); }
  const animals = shuffle(ANIMALS, rng);
  return { patients: ailments.map((a, i) => ({ ailment: a, animal: animals[i % animals.length] })), tray: c.tray >= 8 ? trayFor(ailments, c.tray, rng) : null };
}

const SIMPLE = Object.keys(AILMENTS).filter((k) => AILMENTS[k].simple), ALL = Object.keys(AILMENTS);
const lv = (id: string, rounds: number, c: Cfg, boss = false): LevelDef => ({ id, rounds, params: c as unknown as Record<string, unknown>, boss, skills: ["soins"] });
export const TRACK: Track = {
  chapters: [
    { id: "d1", tier: "facile", ages: [3, 5], title: L("Petits bobos", "Little bumps", "Kleine Wehwehchen", "Pequeñas heridas"), levels: [lv("1-1", 2, { ailments: SIMPLE, tray: 3, glow: true, tapScale: 0.6 }), lv("1-2", 3, { ailments: SIMPLE, tray: 4, glow: true, tapScale: 0.6 }), lv("1-b", 3, { ailments: SIMPLE, tray: 4, glow: false, tapScale: 0.7 }, true)] },
    { id: "d2", tier: "moyen", ages: [6, 7], title: L("La salle d'attente", "The waiting room", "Das Wartezimmer", "La sala de espera"), levels: [lv("2-1", 3, { ailments: ALL, tray: 6, glow: false, tapScale: 0.8 }), lv("2-2", 4, { ailments: ALL, tray: 8, glow: false, tapScale: 0.85 }), lv("2-b", 4, { ailments: ALL, tray: 8, glow: false, tapScale: 1 }, true)] },
    { id: "d3", tier: "difficile", ages: [8, 8], title: L("Les urgences", "Emergency room", "Die Notaufnahme", "Urgencias"), levels: [lv("3-1", 4, { ailments: ALL, tray: 11, glow: false, tapScale: 1 }), lv("3-b", 5, { ailments: ALL, tray: 11, glow: false, tapScale: 1 }, true)] },
  ],
};

export const docteurGame: GameDef = {
  id: "docteur",
  icon: "🩺",
  category: "sciences",
  ages: [3, 8],
  title: L("Le docteur des animaux", "The animal doctor", "Der Tierarzt", "El veterinario"),
  desc: L("Soigner des animaux en choisissant le bon outil : prendre soin, suivre des étapes, connaître son corps.", "Treat animals by choosing the right tool: caring, following steps and knowing the body.", "Tiere mit dem richtigen Werkzeug versorgen: sich kümmern, Schritte befolgen, den Körper kennen.", "Curar animales eligiendo la herramienta correcta: cuidar, seguir pasos y conocer el cuerpo."),
  skills: { soins: L("Soigner, suivre des étapes", "Caring and following steps", "Versorgen und Schritte befolgen", "Cuidar y seguir pasos") },
  speech: (lang) => [
    SAY.cured[lang], ...SAY.wrong.map((x) => x[lang]), ...SAY.good.map((x) => x[lang]),
    ...Object.values(TOOLS).map((t) => t.name[lang]),
    ...Object.values(AILMENTS).flatMap((a) => [`${a.intro[lang]} ${a.steps[0].say[lang]}`, a.steps[0].say[lang], ...a.steps.slice(1).flatMap((s) => [s.say[lang], ...SAY.good.map((g) => `${g[lang]} ${s.say[lang]}`)])]),
  ],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute l'animal, choisis le bon outil dans la trousse, puis touche là où il a mal !", "Listen to the animal, choose the right tool, then tap where it hurts!", "Hör dem Tier zu, wähl das richtige Werkzeug und tipp dorthin, wo es wehtut!", "¡Escucha al animal, elige la herramienta correcta y toca donde le duele!")[ctx.lang],
  setup: (level) => session(level.params as unknown as Cfg, level.rounds),
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang: Lang = ctx.lang;
    const sess = round.session as ReturnType<typeof session>;
    const pt = sess.patients[round.index];
    const ail = AILMENTS[pt.ailment], steps = stepsFor(pt.ailment, c);
    const tray = sess.tray ?? trayFor([pt.ailment], c.tray);
    let step = 0, progress = 0, sel: string | null = null, cured = false;
    const mudLeft = new Set([0, 1, 2]);
    const cur = () => steps[step];
    const bubble = h("button", { class: "dr-bubble", "aria-label": "🔊" }, ail.icon);
    bubble.onclick = () => round.say(cur() ? cur().say[lang] : ail.intro[lang]);
    const box = h("div", { class: "dr-patient" }, h("span", { class: "dr-animal" }, pt.animal));
    const zoneEl = h("button", { class: "dr-zone", "aria-label": "✚" });
    zoneEl.onclick = () => use(-1);
    const mudEls = MUD.map(([x, y], i) => { const m = h("button", { class: "dr-mud", style: { left: x + "%", top: y + "%" }, "aria-label": "🟤" }); m.onclick = () => use(i); return m; });
    const thorn = h("span", { class: "dr-thorn" }, "🌵");
    const marks = h("div", { class: "dr-marks" });
    box.append(marks, zoneEl, ...(ail.steps.some((s) => s.mud) ? mudEls : []));
    const toolB: Record<string, HTMLElement> = {};
    const trayEl = h("div", { class: "dr-tray" });
    for (const t of tray) {
      const b = h("button", { class: "dr-tool", "aria-label": TOOLS[t].name[lang] }, TOOLS[t].e);
      b.onclick = () => { if (round.ended || cured) return; sel = t; sfx.tap(); round.say(TOOLS[t].name[lang]); render(); };
      trayEl.appendChild(b); toolB[t] = b;
    }
    round.stage.appendChild(h("div", { class: "ca-wrap dr-wrap" }, h("div", { class: "dr-top" }, bubble, box), trayEl));
    function render() {
      const s = cur();
      for (const [t, b] of Object.entries(toolB)) { b.classList.toggle("on", t === sel); b.classList.toggle("glow", !!s && c.glow && t === s.tool && sel !== t); }
      if (!s || s.mud) zoneEl.style.display = "none";
      else { zoneEl.style.display = ""; const [x, y] = ZONES[s.zone]; zoneEl.style.left = x + "%"; zoneEl.style.top = y + "%"; zoneEl.textContent = s.pull ? "" : progress ? "✨".repeat(Math.min(progress, 3)) : ""; }
      if (s?.pull) { zoneEl.appendChild(thorn); }
      mudEls.forEach((m, i) => { m.style.display = mudLeft.has(i) ? "" : "none"; });
    }
    function use(spot: number) {
      const s = cur();
      if (round.ended || cured || !s) return;
      if (sel !== s.tool) { round.miss(sel ? toolB[sel] : zoneEl, pick(SAY.wrong)[lang]); return; }
      if (s.mud) { if (!mudLeft.delete(spot)) return; sfx.pop(); round.burst(mudEls[spot], ["🫧", "✨"]); render(); if (mudLeft.size) return; return next(); }
      progress++; sfx.pop();
      if (s.tool === "pansement" || s.tool === "platre" || s.tool === "glace") marks.innerHTML += `<span class="dr-mark" style="left:${ZONES[s.zone][0]}%;top:${ZONES[s.zone][1]}%">${TOOLS[s.tool].e}</span>`;
      render();
      if (progress >= s.taps) next();
    }
    function next() {
      step++; progress = 0; sel = null;
      round.burst(box);
      const s = cur();
      render();
      if (!s) { cured = true; box.classList.add("cured"); sfx.good(); round.win(box, SAY.cured[lang], { praise: false, delay: 3000 }); return; }
      sfx.good();
      round.say(`${pick(SAY.good)[lang]} ${s.say[lang]}`);
    }
    round.setHintTarget(() => {
      const s = cur();
      if (!s || cured) return null;
      if (sel !== s.tool) return toolB[s.tool];
      if (s.mud) return mudEls[[...mudLeft][0]];
      return zoneEl;
    });
    render();
    round.timeout(() => round.say(`${ail.intro[lang]} ${steps[0].say[lang]}`), round.index === 0 ? 2800 : 500);
  },
};
