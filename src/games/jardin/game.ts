// Mon jardin (3-8 ans), comme en V2 : une plante a besoin d'eau ET de soleil pour grandir (pas trop d'eau !).
// On glisse l'arrosoir et le soleil sur le pot (ou on les touche), puis on cueille ; la récolte va dans le panier.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { shuffle } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { drag, inside } from "../../kit/drag";

export interface Plant { name: Tr; fem: { fr: boolean; es: boolean }; stages: string[]; seed: string; harvest: string; count: number; fact: Tr; under?: boolean }
export const PLANTS: Record<string, Plant> = {
  tournesol: { name: L("le tournesol", "the sunflower", "die Sonnenblume", "el girasol"), fem: { fr: false, es: false }, seed: "🌻", stages: ["🟤", "🌱", "🌿", "🌼", "🌻"], harvest: "🌻", count: 1, fact: L("Quand il est jeune, le tournesol tourne sa tête pour suivre le soleil.", "When it's young, the sunflower turns its head to follow the sun.", "Solange sie jung ist, dreht die Sonnenblume ihren Kopf mit der Sonne.", "Cuando es joven, el girasol gira la cabeza para seguir al sol.") },
  tomate: { name: L("la tomate", "the tomato", "die Tomate", "el tomate"), fem: { fr: true, es: false }, seed: "🍅", stages: ["🟤", "🌱", "🌿", "🌼", "🍅"], harvest: "🍅", count: 3, fact: L("La tomate pousse sur la plante, après la fleur : c'est un fruit !", "The tomato grows on the plant after the flower: it's a fruit!", "Die Tomate wächst nach der Blüte an der Pflanze: Sie ist eine Frucht!", "El tomate crece en la planta después de la flor: ¡es un fruto!") },
  carotte: { name: L("la carotte", "the carrot", "die Karotte", "la zanahoria"), fem: { fr: true, es: true }, seed: "🥕", stages: ["🟤", "🌱", "🌿", "🌿", "🥕"], harvest: "🥕", count: 1, under: true, fact: L("La carotte pousse sous la terre : on mange sa racine !", "The carrot grows under the ground: we eat its root!", "Die Karotte wächst unter der Erde: Wir essen ihre Wurzel!", "La zanahoria crece bajo tierra: ¡nos comemos su raíz!") },
  fraise: { name: L("la fraise", "the strawberry", "die Erdbeere", "la fresa"), fem: { fr: true, es: true }, seed: "🍓", stages: ["🟤", "🌱", "🌿", "🌼", "🍓"], harvest: "🍓", count: 3, fact: L("Les petites graines de la fraise sont dehors, sur sa peau !", "The strawberry's little seeds are on the outside, on its skin!", "Die kleinen Kerne der Erdbeere sitzen außen auf der Haut!", "¡Las semillitas de la fresa están por fuera, en su piel!") },
};
export interface Pot { type: string; stage: number; water: number; sun: boolean }
export const newPot = (type: string): Pot => ({ type, stage: 0, water: 0, sun: false });
export const MAX_WATER = 2;
export type Res = { ok: false; msg: "ready" | "tooMuch" | "alreadySun" } | { ok: true; grew: boolean; msg: "drink" | "warm" };
export function water(p: Pot): Res { if (p.stage >= 4) return { ok: false, msg: "ready" }; if (p.water >= MAX_WATER) return { ok: false, msg: "tooMuch" }; p.water++; return { ok: true, grew: grow(p), msg: "drink" }; }
export function sun(p: Pot): Res { if (p.stage >= 4) return { ok: false, msg: "ready" }; if (p.sun) return { ok: false, msg: "alreadySun" }; p.sun = true; return { ok: true, grew: grow(p), msg: "warm" }; }
function grow(p: Pot) { if (p.water >= 1 && p.sun && p.stage < 4) { p.stage++; p.water = 0; p.sun = false; return true; } return false; }
export const nextAction = (p: Pot): "eau" | "soleil" | "cueillir" => (p.stage >= 4 ? "cueillir" : p.water < 1 ? "eau" : "soleil");
export type Need = "ready" | "both" | "water" | "sun";
export const needOf = (p: Pot): Need => (p.stage >= 4 ? "ready" : p.water < 1 && !p.sun ? "both" : p.water < 1 ? "water" : "sun");

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export function needText(type: string, n: Need, lang: Lang): string {
  const pl = PLANTS[type], N = cap(pl.name[lang]), f = pl.fem;
  const T: Record<Need, Tr> = {
    ready: L(`${N} est prêt${f.fr ? "e" : ""} ! Touche-${f.fr ? "la" : "le"} pour ${f.fr ? "la" : "le"} cueillir !`, `${N} is ready! Tap it to pick it!`, `${N} ist reif! Tipp darauf, um sie zu ernten!`, `¡${N} está list${f.es ? "a" : "o"}! ¡Tóca${f.es ? "la" : "lo"} para recoger${f.es ? "la" : "lo"}!`),
    both: L(`${N} a besoin d'eau et de soleil.`, `${N} needs water and sun.`, `${N} braucht Wasser und Sonne.`, `${N} necesita agua y sol.`),
    water: L(`${N} a eu du soleil. Maintenant, un peu d'eau !`, `${N} has had some sun. Now a little water!`, `${N} hatte Sonne. Jetzt ein bisschen Wasser!`, `${N} ya tiene sol. ¡Ahora un poco de agua!`),
    sun: L(`${N} a bu. Maintenant, il lui faut du soleil !`, `${N} has had a drink. Now it needs some sun!`, `${N} hat getrunken. Jetzt braucht sie Sonne!`, `${N} ha bebido. ¡Ahora necesita sol!`),
  };
  return T[n][lang];
}
export const growText = (type: string, lang: Lang) => { const N = cap(PLANTS[type].name[lang]); return ({ fr: `${N} grandit !`, en: `${N} is growing!`, de: `${N} wächst!`, es: `¡${N} crece!` })[lang]; };
export const MSG: Record<Res["msg"], Tr> = {
  ready: L("Elle est prête : il faut la cueillir !", "It's ready: time to pick it!", "Sie ist reif: Jetzt wird geerntet!", "Ya está: ¡hay que recogerla!"),
  tooMuch: L("Stop ! Trop d'eau, ça noie les racines.", "Stop! Too much water drowns the roots.", "Stopp! Zu viel Wasser ertränkt die Wurzeln.", "¡Para! Demasiada agua ahoga las raíces."),
  alreadySun: L("Il y a déjà du soleil !", "It already has sun!", "Sie hat schon Sonne!", "¡Ya tiene sol!"),
  drink: L("Glou glou, la plante boit !", "Glug glug, the plant is drinking!", "Gluck gluck, die Pflanze trinkt!", "¡Glu glu, la planta bebe!"),
  warm: L("Le soleil réchauffe la plante !", "The sun warms the plant!", "Die Sonne wärmt die Pflanze!", "¡El sol calienta la planta!"),
};
const SAY = {
  bravo: L("Bravo !", "Well done!", "Super!", "¡Bravo!"),
  yum: L("Miam !", "Yum!", "Mmh!", "¡Ñam!"),
  intro1: (type: string, lang: Lang) => { const n = PLANTS[type].name[lang]; return ({ fr: `On plante ${n} ! Donne-lui de l'eau et du soleil pour qu'elle grandisse.`, en: `Let's plant ${n}! Give it water and sun so it grows.`, de: `Wir pflanzen ${n.replace(/^die /, "eine ")}! Gib ihr Wasser und Sonne, damit sie wächst.`, es: `¡Plantamos ${n}! Dale agua y sol para que crezca.` })[lang]; },
  introN: (n: number, lang: Lang) => ({ fr: `${n} pots à faire pousser ! Glisse l'eau et le soleil sur chaque plante.`, en: `${n} pots to grow! Slide the water and the sun onto each plant.`, de: `${n} Töpfe zum Wachsen! Zieh Wasser und Sonne auf jede Pflanze.`, es: `¡${n} macetas para cultivar! Desliza el agua y el sol sobre cada planta.` })[lang],
};

export interface Cfg { pots: number; strict: boolean }
const lv = (id: string, rounds: number, pots: number, strict: boolean, boss = false): LevelDef => ({ id, rounds, params: { pots, strict }, boss, skills: ["plantes"] });
export const TRACK: Track = {
  chapters: [
    { id: "j1", tier: "facile", ages: [3, 5], title: L("Ma première plante", "My first plant", "Meine erste Pflanze", "Mi primera planta"), levels: [lv("1-1", 2, 1, false), lv("1-2", 3, 1, false), lv("1-b", 3, 1, false, true)] },
    { id: "j2", tier: "moyen", ages: [6, 7], title: L("Deux pots", "Two pots", "Zwei Töpfe", "Dos macetas"), levels: [lv("2-1", 1, 2, false), lv("2-2", 2, 2, false), lv("2-b", 2, 2, true, true)] },
    { id: "j3", tier: "difficile", ages: [8, 8], title: L("Le grand potager", "The big vegetable garden", "Der große Gemüsegarten", "El gran huerto"), levels: [lv("3-1", 1, 3, true), lv("3-b", 2, 3, true, true)] },
  ],
};

export const jardinGame: GameDef = {
  id: "jardin",
  icon: "🌱",
  category: "sciences",
  ages: [3, 8],
  title: L("Mon jardin", "My garden", "Mein Garten", "Mi jardín"),
  desc: L("Une plante a besoin d'eau et de soleil pour grandir (mais pas trop d'eau) : de la graine à la récolte.", "A plant needs water and sun to grow (but not too much water): from seed to harvest.", "Eine Pflanze braucht Wasser und Sonne zum Wachsen (aber nicht zu viel Wasser): vom Samen bis zur Ernte.", "Una planta necesita agua y sol para crecer (pero no demasiada agua): de la semilla a la cosecha."),
  skills: { plantes: L("Comment pousse une plante", "How a plant grows", "Wie eine Pflanze wächst", "Cómo crece una planta") },
  speech: (lang) => [
    SAY.bravo[lang], SAY.yum[lang], ...Object.values(MSG).map((x) => x[lang]), SAY.introN(2, lang), SAY.introN(3, lang),
    ...Object.keys(PLANTS).flatMap((k) => [SAY.intro1(k, lang), growText(k, lang), PLANTS[k].fact[lang], ...(["ready", "both", "water", "sun"] as Need[]).map((n) => needText(k, n, lang))]),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => {
    const strict = (level.params as unknown as Cfg).strict;
    return L("Une plante a besoin d'eau et de soleil pour grandir. Glisse l'arrosoir et le soleil sur le pot, puis cueille la plante !", "A plant needs water and sun to grow. Slide the watering can and the sun onto the pot, then pick the plant!", "Eine Pflanze braucht Wasser und Sonne zum Wachsen. Zieh die Gießkanne und die Sonne auf den Topf und ernte dann die Pflanze!", "Una planta necesita agua y sol para crecer. ¡Desliza la regadera y el sol sobre la maceta y luego recoge la planta!")[ctx.lang]
      + (strict ? " " + L("Attention, pas trop d'eau !", "Careful, not too much water!", "Vorsicht, nicht zu viel Wasser!", "¡Cuidado, no demasiada agua!")[ctx.lang] : "");
  },
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const pots = shuffle(Object.keys(PLANTS)).slice(0, c.pots).map(newPot);
    const done = pots.map(() => false);
    let sel = 0;
    const key = `plumi.jardin.${(ctx.profile as { id?: string }).id ?? "x"}`;
    const basket: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem(key) ?? "{}"); } catch { return {}; } })();
    const basketEl = h("div", { class: "ja-basket" });
    const potsEl = h("div", { class: "ja-pots" });
    const waterB = h("button", { class: "ja-tool", "aria-label": "💧" }, "💧"), sunB = h("button", { class: "ja-tool", "aria-label": "☀️" }, "☀️");
    round.stage.appendChild(h("div", { class: "ja-wrap" }, basketEl, potsEl, h("div", { class: "ja-tools" }, waterB, sunB)));
    const tell = (a: string, b?: string) => { round.say(a); if (b) round.say(b, lang, { interrupt: false }); };
    const potEls = pots.map((_, i) => { const d = h("button", { class: "ja-pot" }); d.onclick = () => tapPot(i); potsEl.appendChild(d); return d; });
    function render(i: number, anim = "") {
      const p = pots[i], pl = PLANTS[p.type], d = potEls[i];
      d.classList.toggle("sel", i === sel && pots.length > 1 && !done[i]);
      d.classList.toggle("done", done[i]);
      const above = done[i] ? "✅" : pl.under && p.stage === 4 ? "🌿" : p.stage === 0 ? "" : pl.stages[p.stage];
      d.replaceChildren(
        h("div", { class: "ja-sky" }, done[i] ? "" : p.sun ? "☀️" : p.stage < 4 ? "☁️" : ""),
        h("div", { class: "ja-plant" + (anim ? " " + anim : "") + (p.stage === 4 && !done[i] ? " ready" : "") }, above),
        h("div", { class: "ja-soil" }, p.stage === 0 && !done[i] ? "🟤" : pl.under && p.stage >= 3 && !done[i] ? "🥕" : pl.seed),
        h("div", { class: "ja-water" }, "💧".repeat(p.water)),
      );
    }
    const renderAll = () => pots.forEach((_, i) => render(i));
    const renderBasket = () => { basketEl.textContent = "🧺 " + Object.entries(basket).map(([e, n]) => `${e} ${n}`).join("  "); };
    const select = (i: number) => { sel = i; renderAll(); };
    function act(kind: "eau" | "soleil", i: number) {
      if (round.ended || i < 0 || done[i]) return;
      select(i);
      const p = pots[i];
      if (p.stage >= 4) { round.say(needText(p.type, "ready", lang)); round.hint(potEls[i]); return; }
      const res = kind === "eau" ? water(p) : sun(p);
      if (!res.ok) {
        if (kind === "eau") render(i, "droop");
        if (kind === "eau" && c.strict && res.msg === "tooMuch") round.miss(potEls[i], MSG[res.msg][lang]);
        else { sfx.wrong(); tell(MSG[res.msg][lang], needText(p.type, needOf(p), lang)); }
        return;
      }
      if (kind === "eau") {
        sfx.noise(0.5, { from: 2000, to: 1200, q: 1, volume: 0.1 });
        for (let k = 0; k < 3; k++) { const dr = h("div", { class: "ja-drop", style: { left: 25 + k * 22 + "%", animationDelay: k * 0.1 + "s" } }, "💧"); potEls[i].appendChild(dr); round.timeout(() => dr.remove(), 900); }
      } else sfx.bell(880, 0, 0.12, 0.8);
      if (res.grew) round.timeout(() => { render(i, "grow"); sfx.success(); round.burst(potEls[i]); if (p.stage === 4) tell(SAY.bravo[lang], needText(p.type, "ready", lang)); else tell(growText(p.type, lang), needText(p.type, needOf(p), lang)); }, kind === "eau" ? 500 : 0);
      else { round.timeout(() => render(i), kind === "eau" ? 500 : 0); tell(MSG[res.msg][lang], needText(p.type, needOf(p), lang)); }
    }
    function tapPot(i: number) {
      if (round.ended || done[i]) return;
      const p = pots[i];
      if (p.stage < 4) { select(i); round.say(needText(p.type, needOf(p), lang)); return; }
      const pl = PLANTS[p.type];
      done[i] = true;
      basket[pl.harvest] = (basket[pl.harvest] ?? 0) + pl.count;
      try { localStorage.setItem(key, JSON.stringify(basket)); } catch { /* stockage plein */ }
      renderBasket(); render(i);
      round.burst(potEls[i], [pl.harvest, "✨", "🌱"]);
      const next = done.indexOf(false);
      if (next < 0) { round.say(SAY.bravo[lang]); round.win(potEls[i], pl.fact[lang], { praise: false, delay: 4800 }); }
      else { sfx.success(); tell(SAY.yum[lang], pl.fact[lang]); select(next); }
    }
    const potAt = (pt: { x: number; y: number }) => potEls.findIndex((d, i) => !done[i] && inside(d, pt, 10));
    for (const [btn, kind] of [[waterB, "eau"], [sunB, "soleil"]] as const) {
      drag(btn, {
        enabled: () => !round.ended,
        onMove: (pt) => { const k = potAt(pt); potEls.forEach((d, i) => d.classList.toggle("k-zone-hot", i === k)); },
        onDrop: (pt) => { potEls.forEach((d) => d.classList.remove("k-zone-hot")); const k = potAt(pt); if (k < 0) return false; act(kind, k); return true; },
        onTap: () => act(kind, done[sel] ? done.indexOf(false) : sel),
      });
    }
    round.setHintTarget(() => {
      const i = done.indexOf(false);
      if (i < 0) return null;
      const a = nextAction(pots[i]);
      return a === "cueillir" ? potEls[i] : { from: a === "eau" ? waterB : sunB, to: potEls[i] };
    });
    renderAll(); renderBasket();
    round.timeout(() => round.say(pots.length === 1 ? SAY.intro1(pots[0].type, lang) : SAY.introN(pots.length, lang)), round.index === 0 ? 3200 : 400);
  },
};
