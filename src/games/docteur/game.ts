// Le docteur des animaux (3-8 ans), comme en V2 : on GLISSE les outils de la trousse sur l'animal.
//   rub   : on frotte avec l'outil sur la zone (désinfectant, loupe, stéthoscope, radio)
//   place : on dépose l'outil sur la zone, « count » fois (pansement, sirop, glace, thermomètre, plâtre)
//   pull  : on attrape l'épine avec la pince et on tire
//   mud   : on frotte chaque tache de boue avec l'éponge
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
/** Zones du corps (en % de la boîte du patient) : [x, y, rayon]. */
export const ZONES: Record<string, [number, number, number]> = { front: [50, 15, 11], bouche: [50, 36, 9], joue: [63, 28, 8], ventre: [50, 66, 15], patte: [22, 60, 9], jambe: [63, 88, 10] };

export interface StepDef { tool: string; zone: string; type: "rub" | "place" | "pull" | "mud"; amount?: number; count?: number; say: Tr }
const S = (tool: string, zone: string, type: StepDef["type"], n: number, say: Tr): StepDef => ({ tool, zone, type, ...(type === "rub" ? { amount: n } : type === "place" ? { count: n } : {}), say });
export const AILMENTS: Record<string, { intro: Tr; icon: string; simple?: boolean; steps: StepDef[] }> = {
  bobo: { icon: "🤕", simple: true, intro: L("Aïe ! Je suis tombé, j'ai un bobo sur la joue !", "Ouch! I fell over and hurt my cheek!", "Aua! Ich bin hingefallen und habe eine Wunde an der Backe!", "¡Ay! ¡Me he caído y tengo una herida en la mejilla!"), steps: [
    S("desinfectant", "joue", "rub", 2.2, L("Frotte le bobo avec le désinfectant.", "Rub the cut with the disinfectant.", "Reib die Wunde mit dem Desinfektionsmittel ab.", "Frota la herida con el desinfectante.")),
    S("pansement", "joue", "place", 1, L("Pose un pansement sur le bobo.", "Put a plaster on the cut.", "Kleb ein Pflaster auf die Wunde.", "Pon una tirita en la herida.")),
  ] },
  boue: { icon: "🟤", simple: true, intro: L("J'ai sauté dans les flaques ! Je suis tout sale !", "I jumped in the puddles! I'm all dirty!", "Ich bin in die Pfützen gesprungen! Ich bin ganz schmutzig!", "¡He saltado en los charcos! ¡Estoy todo sucio!"), steps: [
    S("eponge", "mud", "mud", 0, L("Frotte les taches de boue avec l'éponge.", "Scrub the mud spots with the sponge.", "Schrubb die Schlammflecken mit dem Schwamm weg.", "Frota las manchas de barro con la esponja.")),
  ] },
  ventre: { icon: "🍬", simple: true, intro: L("Oh là là, j'ai mal au ventre !", "Oh dear, I've got a tummy ache!", "Oje, ich habe Bauchweh!", "¡Ay, me duele la barriga!"), steps: [
    S("stethoscope", "ventre", "rub", 2.4, L("Écoute son ventre avec le stéthoscope.", "Listen to the tummy with the stethoscope.", "Hör den Bauch mit dem Stethoskop ab.", "Escucha la barriga con el estetoscopio.")),
    S("sirop", "bouche", "place", 2, L("Donne-lui du sirop dans la bouche.", "Give some medicine in the mouth.", "Gib ihm Saft in den Mund.", "Dale jarabe en la boca.")),
  ] },
  fievre: { icon: "🤒", intro: L("J'ai chaud, j'ai froid… je suis malade !", "I'm hot, I'm cold… I'm ill!", "Mir ist heiß, mir ist kalt… ich bin krank!", "Tengo calor, tengo frío… ¡estoy malito!"), steps: [
    S("thermometre", "bouche", "place", 1, L("Mets le thermomètre dans sa bouche.", "Put the thermometer in the mouth.", "Steck das Thermometer in den Mund.", "Pon el termómetro en la boca.")),
    S("sirop", "bouche", "place", 3, L("Donne-lui du sirop.", "Give some medicine.", "Gib ihm Saft.", "Dale jarabe.")),
    S("glace", "front", "place", 1, L("Pose la glace sur son front.", "Put the ice pack on the forehead.", "Leg den Eisbeutel auf die Stirn.", "Pon el hielo en la frente.")),
  ] },
  epine: { icon: "🌵", intro: L("Aïe aïe aïe ! J'ai marché sur quelque chose qui pique !", "Ouch ouch! I stepped on something prickly!", "Aua aua! Ich bin auf etwas Spitzes getreten!", "¡Ay, ay, ay! ¡He pisado algo que pincha!"), steps: [
    S("loupe", "patte", "rub", 1.8, L("Cherche sur sa patte avec la loupe.", "Look at the paw with the magnifying glass.", "Untersuch die Pfote mit der Lupe.", "Busca en la pata con la lupa.")),
    S("pince", "patte", "pull", 0, L("Attrape-la avec la pince et tire !", "Grab it with the tweezers and pull!", "Pack ihn mit der Pinzette und zieh!", "¡Agárrala con las pinzas y tira!")),
    S("pansement", "patte", "place", 1, L("Un petit pansement pour finir.", "A little plaster to finish.", "Zum Schluss ein kleines Pflaster.", "Una tirita para terminar.")),
  ] },
  jambe: { icon: "🦴", intro: L("Je suis tombé de vélo, j'ai très mal à la jambe !", "I fell off my bike, my leg really hurts!", "Ich bin vom Fahrrad gefallen, mein Bein tut sehr weh!", "¡Me he caído de la bici, me duele mucho la pierna!"), steps: [
    S("radio", "jambe", "rub", 2.2, L("Passe l'appareil de radio sur sa jambe.", "Move the X-ray machine over the leg.", "Fahr mit dem Röntgengerät über das Bein.", "Pasa la máquina de rayos X por la pierna.")),
    S("platre", "jambe", "place", 3, L("Mets le plâtre sur sa jambe.", "Put the cast on the leg.", "Mach den Gips um das Bein.", "Pon la escayola en la pierna.")),
  ] },
};
/** Ce que dit l'animal quand une étape est finie (selon l'outil). */
export const DONE: Record<string, Tr> = {
  desinfectant: L("C'est tout propre !", "All clean!", "Alles sauber!", "¡Ya está limpio!"),
  loupe: L("Je vois une épine !", "I can see a thorn!", "Ich sehe einen Dorn!", "¡Veo una espina!"),
  radio: L("Oh ! L'os est cassé !", "Oh! The bone is broken!", "Oh! Der Knochen ist gebrochen!", "¡Oh! ¡El hueso está roto!"),
  stethoscope: L("Boum boum… et ça gargouille !", "Thump thump… and it's gurgling!", "Bum bum… und es gluckert!", "¡Pum pum… y hace ruiditos!"),
  eponge: L("Tout propre ! Ça brille !", "All clean! Sparkling!", "Ganz sauber! Es glänzt!", "¡Todo limpio! ¡Brilla!"),
  pince: L("Pop ! L'épine est partie !", "Pop! The thorn is out!", "Plopp! Der Dorn ist raus!", "¡Pop! ¡La espina ha salido!"),
  thermometre: L("Il a de la fièvre !", "A fever!", "Fieber!", "¡Tiene fiebre!"),
  sirop: L("Miam ! C'est bon !", "Yum! That's good!", "Mmh! Lecker!", "¡Ñam! ¡Qué rico!"),
  pansement: L("Voilà un joli pansement !", "There's a lovely plaster!", "Was für ein schönes Pflaster!", "¡Qué tirita tan bonita!"),
  glace: L("Ahh, ça rafraîchit !", "Ahh, that's cool!", "Ahh, das kühlt!", "¡Ahh, qué fresquito!"),
  platre: L("Le plâtre est bien mis !", "The cast is on!", "Der Gips sitzt!", "¡La escayola está puesta!"),
};
export const SAY = {
  wrong: [L("Hihi, ça chatouille ! Ce n'est pas le bon outil.", "Hee hee, that tickles! That's not the right tool.", "Hihi, das kitzelt! Das ist nicht das richtige Werkzeug.", "¡Jiji, qué cosquillas! No es la herramienta correcta."), L("Hihihi ! Essaie un autre outil.", "Hee hee! Try another tool.", "Hihihi! Versuch ein anderes Werkzeug.", "¡Jijiji! Prueba otra herramienta."), L("Ça chatouille ! Regarde la bulle : quel outil faut-il ?", "That tickles! Look at the bubble: which tool do you need?", "Das kitzelt! Schau in die Blase: Welches Werkzeug brauchst du?", "¡Cosquillas! Mira la burbuja: ¿qué herramienta hace falta?")],
  more: [L("Miam !", "Yum!", "Mmh!", "¡Ñam!"), L("Encore une cuillère !", "One more spoon!", "Noch einen Löffel!", "¡Otra cucharada!"), L("C'est bon !", "That's good!", "Lecker!", "¡Qué rico!")],
  grabbed: L("Tu l'as attrapée ! Tire !", "You've got it! Pull!", "Du hast ihn! Zieh!", "¡La tienes! ¡Tira!"),
  further: L("Tire plus loin, sans lâcher !", "Pull further, don't let go!", "Zieh weiter, nicht loslassen!", "¡Tira más lejos, sin soltar!"),
  cured: L("Merci docteur ! Je me sens beaucoup mieux !", "Thank you, doctor! I feel much better!", "Danke, Doktor! Mir geht es viel besser!", "¡Gracias, doctor! ¡Me siento mucho mejor!"),
};
/** [tête, corps, pattes] */
const ANIMALS: [string, string, string][] = [
  ["🐶", "#c68b59", "#a0693f"], ["🐱", "#f4a259", "#d9822b"], ["🐰", "#e9ecef", "#ced4da"], ["🐻", "#8d5524", "#6f4518"], ["🐼", "#f8f9fa", "#343a40"], ["🐸", "#80c45a", "#5a9e3a"],
  ["🐷", "#ffb3c6", "#ff8fab"], ["🦊", "#f77f00", "#d45d00"], ["🐯", "#f9a03f", "#e07b00"], ["🐨", "#adb5bd", "#868e96"], ["🦁", "#f6bd60", "#d9a441"], ["🐵", "#a0693f", "#7f5539"],
];

export interface Cfg { ailments: string[]; tray: number; glow: boolean; amountScale: number; maxCount: number; perPatientTray: boolean }
export const stepsFor = (id: string, c: Cfg): StepDef[] => AILMENTS[id].steps.map((s) => ({ ...s, amount: s.amount ? +(s.amount * c.amountScale).toFixed(2) : undefined, count: s.count ? Math.min(s.count, c.maxCount) : undefined }));
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
  return { patients: ailments.map((a, i) => ({ ailment: a, animal: animals[i % animals.length], steps: stepsFor(a, c) })), tray: c.perPatientTray ? null : trayFor(ailments, c.tray, rng) };
}
export const inZone = (pt: [number, number], zone: string, extra = 1) => { const z = ZONES[zone]; return Math.hypot(pt[0] - z[0], pt[1] - z[1]) < z[2] * 1.6 * extra; };

const SIMPLE = Object.keys(AILMENTS).filter((k) => AILMENTS[k].simple), ALL = Object.keys(AILMENTS);
const EASY: Cfg = { ailments: SIMPLE, tray: 4, glow: true, amountScale: 0.6, maxCount: 1, perPatientTray: true };
const MID: Cfg = { ailments: ALL, tray: 8, glow: false, amountScale: 0.85, maxCount: 2, perPatientTray: false };
const HARD: Cfg = { ailments: ALL, tray: Object.keys(TOOLS).length, glow: false, amountScale: 1, maxCount: 3, perPatientTray: false };
const lv = (id: string, rounds: number, c: Cfg, boss = false): LevelDef => ({ id, rounds, params: c as unknown as Record<string, unknown>, boss, skills: ["soins"] });
export const TRACK: Track = {
  chapters: [
    { id: "d1", tier: "facile", ages: [3, 5], title: L("Petits bobos", "Little bumps", "Kleine Wehwehchen", "Pequeñas heridas"), levels: [lv("1-1", 2, EASY), lv("1-2", 3, EASY), lv("1-b", 3, { ...EASY, glow: false }, true)] },
    { id: "d2", tier: "moyen", ages: [6, 7], title: L("La salle d'attente", "The waiting room", "Das Wartezimmer", "La sala de espera"), levels: [lv("2-1", 3, MID), lv("2-2", 4, MID), lv("2-b", 4, MID, true)] },
    { id: "d3", tier: "difficile", ages: [8, 8], title: L("Les urgences", "Emergency room", "Die Notaufnahme", "Urgencias"), levels: [lv("3-1", 4, HARD), lv("3-b", 5, HARD, true)] },
  ],
};

/** Toutes les phrases « fin d'étape + étape suivante ». */
export const stepTransition = (prev: StepDef, next: StepDef, lang: Lang) => `${DONE[prev.tool][lang]} ${next.say[lang]}`;

export const docteurGame: GameDef = {
  id: "docteur",
  icon: "🩺",
  category: "sciences",
  ages: [3, 8],
  title: L("Le docteur des animaux", "The animal doctor", "Der Tierarzt", "El veterinario"),
  desc: L("Soigner des animaux en glissant le bon outil : prendre soin, suivre des étapes, connaître son corps.", "Treat animals by sliding the right tool: caring, following steps and knowing the body.", "Tiere mit dem richtigen Werkzeug versorgen: sich kümmern, Schritte befolgen, den Körper kennen.", "Curar animales deslizando la herramienta correcta: cuidar, seguir pasos y conocer el cuerpo."),
  skills: { soins: L("Soigner, suivre des étapes", "Caring and following steps", "Versorgen und Schritte befolgen", "Cuidar y seguir pasos") },
  speech: (lang) => [
    SAY.cured[lang], SAY.grabbed[lang], SAY.further[lang], ...SAY.wrong.map((x) => x[lang]), ...SAY.more.map((x) => x[lang]),
    ...Object.values(AILMENTS).flatMap((a) => [a.intro[lang], `${a.intro[lang]} ${a.steps[0].say[lang]}`, ...a.steps.map((s) => s.say[lang]), ...a.steps.slice(1).map((s, i) => stepTransition(a.steps[i], s, lang))]),
  ],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Tu es le docteur ! Glisse les outils de la trousse sur l'animal pour le soigner.", "You're the doctor! Slide the tools from the bag onto the animal to make it better.", "Du bist der Arzt! Zieh die Werkzeuge aus der Tasche auf das Tier, um es zu heilen.", "¡Eres el médico! Desliza las herramientas del maletín sobre el animal para curarlo.")[ctx.lang],
  setup: (level) => session(level.params as unknown as Cfg, level.rounds),
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const sess = round.session as ReturnType<typeof session>;
    const patient = sess.patients[round.index];
    const tray = sess.tray ?? trayFor([patient.ailment], c.tray);
    const ail = AILMENTS[patient.ailment];
    const [headE, bodyC, limbC] = patient.animal;
    const st = { step: 0, progress: 0, placed: 0, busy: false };
    const sick: { tears?: HTMLElement[]; scratch?: HTMLElement; fever?: HTMLElement; thorn?: HTMLElement | null; swirl?: HTMLElement; mud?: HTMLElement[]; bones?: HTMLElement; bolt?: HTMLElement } = {};
    const cur = () => patient.steps[st.step];

    const bubble = h("button", { class: "dr-bubble", "aria-label": "🔊" });
    bubble.onclick = () => round.say(cur() ? cur().say[lang] : ail.intro[lang]);
    const p = h("div", { class: "dr-patient arrive sick" });
    const care = h("div", { class: "dr-care" }, bubble, h("div", { class: "dr-pwrap" }, p, h("div", { class: "dr-bed" })));
    const bag = h("div", { class: "dr-bag" });
    round.stage.appendChild(h("div", { class: "dr-room" }, care, bag));
    const fit = () => { const r = care.getBoundingClientRect(); round.stage.style.setProperty("--P", Math.max(150, Math.min(r.width * 0.78, (r.height - 70) * 0.9, 420)) + "px"); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(care); round.onCleanup(() => ro.disconnect());
    const part = (cls: string, x: number, y: number, w?: number, hh?: number, bg?: string) => {
      const d = h("div", { class: "dr-part " + cls, style: { left: x + "%", top: y + "%", ...(w ? { width: w + "%" } : {}), ...(hh ? { height: hh + "%" } : {}), ...(bg ? { background: bg } : {}) } });
      p.appendChild(d); return d;
    };
    const fx = (cls: string, x: number, y: number, w?: number, hh?: number) => part("dr-fx " + cls, x, y, w, hh);
    part("dr-limb", 37, 88, 18, 14, limbC); part("dr-limb", 63, 88, 18, 14, limbC); part("dr-limb", 22, 60, 16, 16, limbC); part("dr-limb", 78, 60, 16, 16, limbC);
    part("dr-body", 50, 66, 50, 44, bodyC); part("dr-belly", 50, 70, 30, 26);
    const headEl = part("dr-head", 50, 27); headEl.textContent = headE;
    const mood = h("div", { class: "dr-mood" }, patient.ailment === "fievre" ? "🤒" : "😢"); p.appendChild(mood);
    // ce qui ne va pas, visible sur l'animal
    sick.tears = [fx("dr-tear", 38, 34), fx("dr-tear", 62, 34)];
    sick.tears.forEach((t, i) => { t.textContent = "💧"; t.style.animationDelay = i * 0.7 + "s"; });
    const Z = ZONES, id = patient.ailment;
    if (id === "bobo") { sick.scratch = fx("dr-scratch", Z.joue[0], Z.joue[1], 11, 7); sick.scratch.innerHTML = "<i style='top:10%'></i><i style='top:45%'></i><i style='top:80%'></i>"; }
    if (id === "fievre") sick.fever = fx("dr-fever", 50, 27, 48, 48);
    if (id === "epine") { sick.thorn = fx("dr-thorn", Z.patte[0], Z.patte[1]); sick.thorn.style.opacity = "0.1"; }
    if (id === "ventre") { sick.swirl = fx("", 50, 68); sick.swirl.textContent = "🌀"; sick.swirl.style.fontSize = "calc(var(--P) * 0.09)"; sick.swirl.style.opacity = "0.6"; }
    if (id === "boue") sick.mud = ([[40, 62, 14, 10], [60, 74, 12, 9], [44, 20, 10, 8], [76, 58, 9, 9], [36, 88, 10, 7]] as const).map(([x, y, w, hh]) => { const m = fx("dr-mud", x, y, w, hh); m.dataset.left = "1"; return m; });
    if (id === "jambe") { sick.bones = fx("", Z.jambe[0], Z.jambe[1]); sick.bones.textContent = "🦴"; sick.bones.style.fontSize = "calc(var(--P) * 0.14)"; sick.bones.style.opacity = "0"; sick.bolt = fx("", Z.jambe[0] + 10, Z.jambe[1] - 8); sick.bolt.textContent = "⚡"; sick.bolt.style.fontSize = "calc(var(--P) * 0.07)"; }

    const toolEls: Record<string, HTMLElement> = {};
    for (const t of tray) {
      const b = h("button", { class: "dr-tool", "aria-label": TOOLS[t].name[lang] }, TOOLS[t].e);
      b.addEventListener("pointerdown", (e) => startDrag(e, b, t));
      bag.appendChild(b); toolEls[t] = b;
    }
    let target: HTMLElement | null = null;
    function renderStep() {
      bubble.replaceChildren(h("span", { class: "dr-sick" }, ail.icon), ...patient.steps.map((s, i) => h("span", { class: "dr-step" + (i < st.step ? " done" : i === st.step ? " now" : "") }, TOOLS[s.tool].e)));
      target?.remove(); target = null;
      Object.values(toolEls).forEach((b) => b.classList.remove("glow"));
      const s = cur();
      if (!s) return;
      if (s.zone !== "mud") { const [x, y, r] = ZONES[s.zone]; target = fx("dr-target", x, y, r * 2.3, r * 2.3); }
      if (c.glow) toolEls[s.tool]?.classList.add("glow");
    }
    const setPct = (v: number) => target?.style.setProperty("--pct", Math.min(100, v * 100) + "%");
    const puff = (x: number, y: number, emoji: string) => {
      const d = h("div", { class: "dr-puff", style: { left: x + "px", top: y - 40 + "px", "--dx": (Math.random() - 0.5) * 60 + "px" } }, emoji);
      document.body.appendChild(d); setTimeout(() => d.remove(), 800);
    };

    // ---------- glisser les outils ----------
    let drag: { btn: HTMLElement; tool: string; ghost: HTMLElement; last: [number, number] | null; grabbed: boolean; stepAtStart: number } | null = null;
    let lastFx = 0, lastBeat = 0;
    const rel = (e: PointerEvent): [number, number] => { const r = p.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]; };
    const onPatient = (pt: [number, number]) => pt[0] > -5 && pt[0] < 105 && pt[1] > -5 && pt[1] < 105;
    function startDrag(e: PointerEvent, btn: HTMLElement, tool: string) {
      if (st.busy || drag || round.ended) return;
      e.preventDefault();
      try { btn.setPointerCapture(e.pointerId); } catch { /* pointeur simulé */ }
      const ghost = h("div", { class: "k-ghost" }, TOOLS[tool].e);
      document.body.appendChild(ghost);
      drag = { btn, tool, ghost, last: null, grabbed: false, stepAtStart: st.step };
      btn.classList.add("k-lifted"); sfx.click();
      moveGhost(e);
      btn.addEventListener("pointermove", onMove); btn.addEventListener("pointerup", onUp); btn.addEventListener("pointercancel", onUp);
    }
    const moveGhost = (e: PointerEvent) => { if (drag) { drag.ghost.style.left = e.clientX + "px"; drag.ghost.style.top = e.clientY + "px"; } };
    function onMove(e: PointerEvent) {
      if (!drag) return;
      moveGhost(e);
      const s = cur(), pt = rel(e);
      const dist = drag.last ? Math.hypot(pt[0] - drag.last[0], pt[1] - drag.last[1]) : 0;
      drag.last = pt;
      if (!s || s.tool !== drag.tool || st.busy) return;
      const now = performance.now();
      if (s.type === "rub") {
        if (inZone(pt, s.zone)) {
          st.progress += dist / 100;
          target?.classList.add("hot");
          setPct(st.progress / s.amount!);
          rubEffect(drag.tool, e, now, s);
          if (st.progress >= s.amount!) stepDone();
        } else target?.classList.remove("hot");
      }
      if (s.type === "mud" && sick.mud) {
        for (const m of sick.mud) {
          const left = +m.dataset.left!;
          if (left <= 0) continue;
          if (Math.hypot(pt[0] - parseFloat(m.style.left), pt[1] - parseFloat(m.style.top)) < 13) {
            const nl = Math.max(0, left - dist / (c.glow ? 35 : 55));
            m.dataset.left = String(nl); m.style.opacity = String(nl);
            if (now - lastFx > 120) { lastFx = now; puff(e.clientX, e.clientY, "🫧"); sfx.noise(0.12, { from: 900, to: 1400, q: 2, volume: 0.1 }); }
            if (nl <= 0) { round.burst(m, ["🫧", "✨"]); m.remove(); sfx.pop(); }
          }
        }
        if (sick.mud.every((m) => +m.dataset.left! <= 0)) stepDone();
      }
      if (s.type === "pull") {
        if (!drag.grabbed && inZone(pt, s.zone)) { drag.grabbed = true; sfx.slide(500, 800, 0.08, 0.2); round.say(SAY.grabbed[lang]); }
        if (drag.grabbed && sick.thorn) {
          const z = ZONES[s.zone];
          sick.thorn.style.left = pt[0] + "%"; sick.thorn.style.top = pt[1] + "%";
          if (Math.hypot(pt[0] - z[0], pt[1] - z[1]) > 26) { sick.thorn.remove(); sick.thorn = null; sfx.slide(300, 1000, 0.15, 0.3); stepDone(); }
        }
      }
    }
    function onUp(e: PointerEvent) {
      if (!drag) return;
      const { btn, tool, ghost } = drag;
      btn.removeEventListener("pointermove", onMove); btn.removeEventListener("pointerup", onUp); btn.removeEventListener("pointercancel", onUp);
      const pt = rel(e), s = cur();
      let consumed = false;
      if (s && !st.busy && drag.stepAtStart === st.step && onPatient(pt) && e.type === "pointerup") {
        if (s.tool !== tool) { round.miss(btn, pick(SAY.wrong)[lang]); sfx.slide(600, 900, 0.1, 0.2); }
        else if (s.type === "place") {
          if (inZone(pt, s.zone, 1.4)) { consumed = true; place(s, tool); }
          else { round.say(s.say[lang]); round.hint(target); }
        } else if (s.type === "pull" && drag.grabbed && sick.thorn) {
          const z = ZONES[s.zone];
          sick.thorn.style.left = z[0] + "%"; sick.thorn.style.top = z[1] + "%";
          round.say(SAY.further[lang]);
        }
      }
      if (consumed) ghost.remove();
      else { const r = btn.getBoundingClientRect(); ghost.classList.add("k-back"); ghost.style.left = r.left + r.width / 2 + "px"; ghost.style.top = r.top + r.height / 2 + "px"; setTimeout(() => ghost.remove(), 300); }
      btn.classList.remove("k-lifted");
      target?.classList.remove("hot");
      drag = null;
    }
    round.onCleanup(() => drag?.ghost.remove());
    function rubEffect(tool: string, e: PointerEvent, now: number, s: StepDef) {
      const k = st.progress / s.amount!;
      if (tool === "desinfectant" && now - lastFx > 140) { lastFx = now; puff(e.clientX, e.clientY, "💨"); sfx.noise(0.15, { from: 3000, to: 5000, q: 0.8, volume: 0.1 }); if (sick.scratch) sick.scratch.style.opacity = String(Math.max(0.35, 1 - k)); }
      if (tool === "loupe" && sick.thorn) sick.thorn.style.opacity = String(Math.min(1, 0.1 + k));
      if (tool === "radio") { if (sick.bones) sick.bones.style.opacity = String(Math.min(1, k)); if (now - lastFx > 220) { lastFx = now; sfx.bell(1200, 0, 0.06, 0.05); } }
      if (tool === "stethoscope" && now - lastBeat > 650) { lastBeat = now; sfx.slide(90, 60, 0.12, 0.5); sfx.slide(90, 60, 0.1, 0.4, "sine", 0.18); puff(e.clientX, e.clientY, "💓"); }
    }
    function place(s: StepDef, tool: string) {
      const z = ZONES[s.zone];
      st.placed++;
      if (tool === "thermometre") {
        st.busy = true;
        const th = fx("dr-applied", z[0] + 12, z[1]); th.textContent = "🌡️"; th.style.transform = "translate(-50%, -50%) rotate(40deg)";
        const t = h("div", { class: "dr-temp" }); p.appendChild(t);
        let deg = 36;
        const tick = () => {
          deg += 0.5;
          t.textContent = (lang === "en" ? deg.toFixed(1) : deg.toFixed(1).replace(".", ",")) + "°";
          sfx.bell(500 + deg * 10, 0, 0.08, 0.05);
          if (deg >= 39.5) { t.style.color = "#e03131"; round.timeout(() => { th.remove(); t.remove(); st.busy = false; stepDone(); }, 1100); }
          else round.timeout(tick, 200);
        };
        round.timeout(tick, 200);
        return;
      }
      if (tool === "sirop") { sfx.yum(); round.burst(headEl, ["💖", "✨"]); }
      if (tool === "pansement") { const b = fx("dr-applied", z[0], z[1]); b.textContent = "🩹"; b.style.transform = "translate(-50%, -50%) rotate(-20deg)"; sick.scratch?.remove(); sfx.slide(400, 700, 0.08, 0.2); }
      if (tool === "glace") { const g = fx("dr-applied", z[0], z[1] - 2); g.textContent = "🧊"; sick.fever?.remove(); sfx.slide(1200, 800, 0.1, 0.15); }
      if (tool === "platre") { fx("dr-cast", z[0] - 1, z[1] - 1, 18 + st.placed * 3, 10 + st.placed * 4); sfx.noise(0.2, { from: 600, to: 1200, q: 1, volume: 0.12 }); }
      setPct(st.placed / s.count!);
      if (st.placed >= s.count!) { if (tool === "platre") sick.bolt?.remove(); stepDone(); }
      else if (tool === "sirop") round.say(pick(SAY.more)[lang]);
    }
    function stepDone() {
      const prev = cur();
      if (!prev) return;
      st.step++; st.progress = 0; st.placed = 0;
      if (drag) drag.grabbed = false;
      sfx.step(st.step);
      renderStep();
      const s = cur();
      if (!s) return cured();
      round.say(stepTransition(prev, s, lang));
    }
    function cured() {
      st.busy = true;
      sick.tears?.forEach((t) => t.remove());
      sick.swirl?.remove(); sick.fever?.remove();
      if (sick.bones) sick.bones.style.opacity = "0";
      p.classList.remove("sick"); p.classList.add("happy");
      mood.textContent = "😄";
      round.burst(p, ["❤️", "💖", "⭐", "✨"]);
      round.win(null, SAY.cured[lang], { delay: 3200, praise: false });
    }
    round.setHintTarget(() => {
      const s = cur();
      if (!s || st.busy) return null;
      const tool = toolEls[s.tool], spot = target ?? p;
      if (s.type === "place") return { from: tool, to: spot };
      if (s.type === "rub") return { from: tool, to: spot, paint: true };
      if (s.type === "mud") { const m = sick.mud?.find((x) => +x.dataset.left! > 0); return m ? { from: tool, to: m, paint: true } : null; }
      if (s.type === "pull") return sick.thorn ? { from: tool, to: sick.thorn, then: bag } : null;
      return tool;
    });
    renderStep();
    round.timeout(() => p.classList.remove("arrive"), 800);
    round.timeout(() => round.say(`${ail.intro[lang]} ${patient.steps[0].say[lang]}`), round.index === 0 ? 3200 : 500);
  },
};
