// Mon jardin (3-8 ans) : une plante a besoin d'eau ET de soleil pour grandir ; pas trop d'eau ! Puis on la cueille.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { shuffle } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const PLANTS: Record<string, { name: Tr; stages: string[]; harvest: string; fact: Tr; under?: boolean }> = {
  tournesol: { name: L("Le tournesol", "The sunflower", "Die Sonnenblume", "El girasol"), stages: ["🟤", "🌱", "🌿", "🌼", "🌻"], harvest: "🌻", fact: L("Le jeune tournesol tourne sa tête vers le soleil.", "A young sunflower turns its head towards the sun.", "Die junge Sonnenblume dreht ihren Kopf zur Sonne.", "El girasol joven gira la cabeza hacia el sol.") },
  tomate: { name: L("La tomate", "The tomato", "Die Tomate", "El tomate"), stages: ["🟤", "🌱", "🌿", "🌼", "🍅"], harvest: "🍅", fact: L("La tomate pousse après la fleur : c'est un fruit !", "The tomato grows after the flower: it's a fruit!", "Die Tomate wächst nach der Blüte: Sie ist eine Frucht!", "El tomate crece después de la flor: ¡es un fruto!") },
  carotte: { name: L("La carotte", "The carrot", "Die Karotte", "La zanahoria"), stages: ["🟤", "🌱", "🌿", "🌿", "🥕"], harvest: "🥕", under: true, fact: L("La carotte pousse sous la terre : on mange sa racine !", "The carrot grows under the ground: we eat its root!", "Die Karotte wächst unter der Erde: Wir essen ihre Wurzel!", "La zanahoria crece bajo tierra: ¡nos comemos su raíz!") },
  fraise: { name: L("La fraise", "The strawberry", "Die Erdbeere", "La fresa"), stages: ["🟤", "🌱", "🌿", "🌼", "🍓"], harvest: "🍓", fact: L("Les petites graines de la fraise sont dehors, sur sa peau !", "The strawberry's little seeds are on the outside, on its skin!", "Die kleinen Kerne der Erdbeere sitzen außen auf der Haut!", "¡Las semillitas de la fresa están por fuera, en su piel!") },
};
export interface Pot { type: string; stage: number; water: number; sun: boolean }
export const newPot = (type: string): Pot => ({ type, stage: 0, water: 0, sun: false });
export const MAX_WATER = 2;
/** Arroser : 1 ou 2 fois c'est bien, plus c'est trop. Renvoie ok, a grandi. */
export function water(p: Pot) { if (p.stage >= 4 || p.water >= MAX_WATER) return { ok: false, grew: false }; p.water++; return { ok: true, grew: grow(p) }; }
export function sun(p: Pot) { if (p.stage >= 4 || p.sun) return { ok: false, grew: false }; p.sun = true; return { ok: true, grew: grow(p) }; }
function grow(p: Pot) { if (p.water >= 1 && p.sun && p.stage < 4) { p.stage++; p.water = 0; p.sun = false; return true; } return false; }
export const nextAction = (p: Pot): "eau" | "soleil" | "cueillir" => (p.stage >= 4 ? "cueillir" : p.water < 1 ? "eau" : "soleil");

const lv = (id: string, rounds: number, pots: number, strict: boolean, boss = false): LevelDef => ({ id, rounds, params: { pots, strict }, boss, skills: ["plantes"] });

export const TRACK: Track = {
  chapters: [
    { id: "j1", tier: "facile", ages: [3, 5], title: L("Ma première plante", "My first plant", "Meine erste Pflanze", "Mi primera planta"), levels: [lv("1-1", 1, 1, false), lv("1-2", 2, 1, false), lv("1-b", 2, 1, false, true)] },
    { id: "j2", tier: "moyen", ages: [6, 7], title: L("Deux pots", "Two pots", "Zwei Töpfe", "Dos macetas"), levels: [lv("2-1", 1, 2, false), lv("2-2", 2, 2, false), lv("2-b", 2, 2, true, true)] },
    { id: "j3", tier: "difficile", ages: [8, 8], title: L("Le grand potager", "The big vegetable garden", "Der große Gemüsegarten", "El gran huerto"), levels: [lv("3-1", 1, 3, true), lv("3-b", 2, 3, true, true)] },
  ],
};

const SAY = {
  need: (p: Pot, lang: Lang) => {
    const n = PLANTS[p.type].name[lang], a = nextAction(p);
    if (a === "cueillir") return { fr: `${n} est prête : touche-la pour la cueillir !`, en: `${n} is ready: tap it to pick it!`, de: `${n} ist reif: Tipp sie an, um sie zu ernten!`, es: `${n} está lista: ¡tócala para recogerla!` }[lang];
    if (a === "eau") return { fr: `${n} a soif : un peu d'eau !`, en: `${n} is thirsty: a little water!`, de: `${n} hat Durst: ein bisschen Wasser!`, es: `${n} tiene sed: ¡un poco de agua!` }[lang];
    return { fr: `${n} a besoin de soleil !`, en: `${n} needs some sun!`, de: `${n} braucht Sonne!`, es: `¡${n} necesita sol!` }[lang];
  },
  tooMuch: L("Stop ! Trop d'eau, ça noie les racines.", "Stop! Too much water drowns the roots.", "Stopp! Zu viel Wasser ertränkt die Wurzeln.", "¡Para! Demasiada agua ahoga las raíces."),
};

export const jardinGame: GameDef = {
  id: "jardin",
  icon: "🌱",
  category: "sciences",
  ages: [3, 8],
  title: L("Mon jardin", "My garden", "Mein Garten", "Mi jardín"),
  desc: L("Une plante a besoin d'eau et de soleil pour grandir (mais pas trop d'eau) : de la graine à la récolte.", "A plant needs water and sun to grow (but not too much water): from seed to harvest.", "Eine Pflanze braucht Wasser und Sonne zum Wachsen (aber nicht zu viel Wasser): vom Samen bis zur Ernte.", "Una planta necesita agua y sol para crecer (pero no demasiada agua): de la semilla a la cosecha."),
  skills: { plantes: L("Comment pousse une plante", "How a plant grows", "Wie eine Pflanze wächst", "Cómo crece una planta") },
  speech: (lang) => [SAY.tooMuch[lang], ...Object.keys(PLANTS).flatMap((k) => [0, 1, 2, 4].map((st) => { const p = newPot(k); p.stage = st; if (st === 1) p.water = 1; return SAY.need(p, lang); })), ...Object.values(PLANTS).map((x) => x.fact[lang])],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Donne de l'eau et du soleil à la plante pour qu'elle grandisse, puis cueille-la !", "Give the plant water and sun so it grows, then pick it!", "Gib der Pflanze Wasser und Sonne, damit sie wächst, und ernte sie dann!", "¡Dale agua y sol a la planta para que crezca y luego recógela!")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { pots: number; strict: boolean };
    const pots = shuffle(Object.keys(PLANTS)).slice(0, p.pots).map(newPot);
    const done = pots.map(() => false);
    let sel = 0;
    const row = h("div", { class: "ja-pots" });
    const waterBtn = h("button", { class: "ja-tool", "aria-label": "💧" }, "💧") as HTMLButtonElement;
    const sunBtn = h("button", { class: "ja-tool", "aria-label": "☀️" }, "☀️") as HTMLButtonElement;
    round.stage.appendChild(h("div", { class: "ca-wrap" }, row, h("div", { class: "row" }, waterBtn, sunBtn)));
    const els = pots.map((_, i) => { const b = h("button", { class: "ja-pot" }); b.onclick = () => tapPot(i); row.appendChild(b); return b; });
    function draw(i: number, anim = "") {
      const pt = pots[i], pl = PLANTS[pt.type], b = els[i];
      b.classList.toggle("sel", i === sel && pots.length > 1 && !done[i]);
      b.innerHTML = `<span class="ja-sky">${done[i] ? "" : pt.sun ? "☀️" : pt.stage < 4 ? "☁️" : ""}</span><span class="ja-plant ${anim}${pt.stage === 4 && !done[i] ? " ripe" : ""}">${done[i] ? "✅" : pt.stage === 0 ? "" : pl.under && pt.stage === 4 ? "🌿" : pl.stages[pt.stage]}</span><span class="ja-soil">${done[i] ? pl.harvest : pt.stage === 0 ? "🟤" : pl.under && pt.stage >= 3 ? "🥕" : ""}</span><span class="ja-water">${"💧".repeat(pt.water)}</span>`;
    }
    const drawAll = () => pots.forEach((_, i) => draw(i));
    function act(kind: "eau" | "soleil") {
      const i = done[sel] ? done.indexOf(false) : sel;
      if (i < 0 || round.ended) return;
      sel = i;
      const pt = pots[i];
      if (pt.stage >= 4) { round.say(SAY.need(pt, ctx.lang)); round.hint(els[i]); return; }
      const r = kind === "eau" ? water(pt) : sun(pt);
      if (!r.ok) {
        if (kind === "eau" && pt.water >= MAX_WATER) { draw(i, "droop"); if (p.strict) round.miss(els[i], SAY.tooMuch[ctx.lang]); else { sfx.soft(); round.say(SAY.tooMuch[ctx.lang]); } }
        else round.say(SAY.need(pt, ctx.lang));
        return;
      }
      sfx.pop();
      if (r.grew) { draw(i, "grow"); sfx.good(); round.burst(els[i]); round.say(SAY.need(pt, ctx.lang)); } else draw(i);
    }
    waterBtn.onclick = () => act("eau");
    sunBtn.onclick = () => act("soleil");
    function tapPot(i: number) {
      if (done[i] || round.ended) return;
      sel = i; drawAll();
      const pt = pots[i];
      if (pt.stage < 4) { round.say(SAY.need(pt, ctx.lang)); return; }
      done[i] = true; draw(i); sfx.coin(); round.burst(els[i]);
      const next = done.indexOf(false);
      if (next < 0) round.win(els[i], PLANTS[pt.type].fact[ctx.lang], { praise: false, delay: 3000 });
      else { round.say(PLANTS[pt.type].fact[ctx.lang]); sel = next; drawAll(); }
    }
    round.setHintTarget(() => {
      const i = done.indexOf(false);
      if (i < 0) return null;
      if (i !== sel) return els[i];
      const a = nextAction(pots[i]);
      return a === "cueillir" ? els[i] : a === "eau" ? waterBtn : sunBtn;
    });
    drawAll();
  },
};
