// La tour des nombres (3-7 ans), comme en V2 : glisser des blocs pour construire une tour du bon nombre,
// puis des additions (une partie de la tour est déjà construite).
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { drag, inside } from "../../kit/drag";

const COLORS = ["#ef476f", "#ff9f1c", "#ffd166", "#06d6a0", "#118ab2", "#7b2cbf", "#f15bb5", "#00bbf9"];
export interface Q { target: number; fixed: number; toAdd: number }
export function question(min: number, max: number, add: boolean, rng: Rng = Math.random, avoid: number | null = null): Q {
  let target: number;
  do target = min + Math.floor(rng() * (max - min + 1)); while (target === avoid && max > min);
  const fixed = add ? 1 + Math.floor(rng() * (target - 1)) : 0;
  return { target, fixed, toAdd: target - fixed };
}
const n = (k: number, lang: Lang) => numberWords(k, lang);
export const askText = (q: Q, lang: Lang) => (q.fixed
  ? ({ fr: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)}, ça fait combien ? Construis la tour !`, en: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)}, how many is that? Build the tower!`, de: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)}, wie viel ist das? Bau den Turm!`, es: `${n(q.fixed, lang)} más ${n(q.toAdd, lang)}, ¿cuánto es? ¡Construye la torre!` })[lang]
  : ({ fr: `Construis une tour de ${n(q.target, lang)} !`, en: `Build a tower of ${n(q.target, lang)}!`, de: `Bau einen Turm aus ${n(q.target, lang)}!`, es: `¡Construye una torre de ${n(q.target, lang)}!` })[lang]);
export const doneText = (q: Q, lang: Lang) => (q.fixed
  ? ({ fr: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)}, égale ${n(q.target, lang)} !`, en: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)} equals ${n(q.target, lang)}!`, de: `${n(q.fixed, lang)} plus ${n(q.toAdd, lang)} ist ${n(q.target, lang)}!`, es: `¡${n(q.fixed, lang)} más ${n(q.toAdd, lang)} es ${n(q.target, lang)}!` })[lang]
  : ({ fr: `Une tour de ${n(q.target, lang)} !`, en: `A tower of ${n(q.target, lang)}!`, de: `Ein Turm aus ${n(q.target, lang)}!`, es: `¡Una torre de ${n(q.target, lang)}!` })[lang]);
export const tooHigh = (k: number, lang: Lang) => ({ fr: `Oups, trop haut ! Il en faut ${n(k, lang)}. Touche le bloc du haut pour l'enlever.`, en: `Oops, too high! You need ${n(k, lang)}. Tap the top block to take it off.`, de: `Hoppla, zu hoch! Du brauchst ${n(k, lang)}. Tipp auf den obersten Block, um ihn wegzunehmen.`, es: `¡Uy, demasiado alta! Hacen falta ${n(k, lang)}. Toca el bloque de arriba para quitarlo.` })[lang];
const TOO_TALL = L("La tour est trop haute !", "The tower is too tall!", "Der Turm ist zu hoch!", "¡La torre es demasiado alta!");

const lv = (id: string, rounds: number, min: number, max: number, add: boolean, boss = false): LevelDef => ({ id, rounds, params: { min, max, add }, boss, skills: [add ? "additionner" : "denombrer"] });
export const TRACK: Track = {
  chapters: [
    { id: "t1", tier: "facile", ages: [3, 4], title: L("Jusqu'à 5", "Up to 5", "Bis 5", "Hasta 5"), levels: [lv("1-1", 5, 1, 3, false), lv("1-2", 5, 1, 5, false), lv("1-b", 6, 2, 5, false, true)] },
    { id: "t2", tier: "facile", ages: [5, 5], title: L("Jusqu'à 10", "Up to 10", "Bis 10", "Hasta 10"), levels: [lv("2-1", 6, 3, 8, false), lv("2-2", 6, 3, 10, false), lv("2-b", 6, 5, 10, false, true)] },
    { id: "t3", tier: "moyen", ages: [6, 7], title: L("Les additions", "Adding", "Plus rechnen", "Las sumas"), levels: [lv("3-1", 6, 3, 6, true), lv("3-2", 6, 3, 10, true), lv("3-b", 6, 5, 10, true, true)] },
  ],
};

export const toursGame: GameDef = {
  id: "tours",
  icon: "🧱",
  category: "maths",
  ages: [3, 7],
  title: L("La tour des nombres", "The number tower", "Der Zahlenturm", "La torre de números"),
  desc: L("Construire une tour du bon nombre de blocs, puis faire des additions en complétant la tour.", "Build a tower with the right number of blocks, then add by completing the tower.", "Einen Turm mit der richtigen Anzahl Blöcke bauen und dann plus rechnen, indem man ihn ergänzt.", "Construir una torre con el número justo de bloques y luego sumar completándola."),
  skills: { denombrer: L("Dénombrer", "Counting objects", "Abzählen", "Contar objetos"), additionner: L("Additionner", "Adding", "Addieren", "Sumar") },
  speech: (lang) => {
    const out = [TOO_TALL[lang]];
    for (let t = 1; t <= 10; t++) { out.push(askText({ target: t, fixed: 0, toAdd: t }, lang), doneText({ target: t, fixed: 0, toAdd: t }, lang), tooHigh(t, lang)); for (let f = 1; f < t; f++) out.push(askText({ target: t, fixed: f, toAdd: t - f }, lang), doneText({ target: t, fixed: f, toAdd: t - f }, lang)); }
    return out;
  },
  track: () => TRACK,
  instruction: (level, ctx) => ((level.params as { add: boolean }).add
    ? L("Une partie de la tour est déjà construite. Ajoute des blocs pour faire le calcul !", "Part of the tower is already built. Add blocks to do the sum!", "Ein Teil des Turms steht schon. Füg Blöcke hinzu, um die Aufgabe zu lösen!", "Parte de la torre ya está construida. ¡Añade bloques para hacer la cuenta!")
    : L("Glisse des blocs sur la tour pour faire le bon nombre !", "Slide blocks onto the tower to make the right number!", "Zieh Blöcke auf den Turm, bis die Zahl stimmt!", "¡Desliza bloques a la torre para hacer el número justo!"))[ctx.lang],
  setup: () => ({ last: null as number | null }),
  start(round, level, ctx) {
    const p = level.params as { min: number; max: number; add: boolean }, lang = ctx.lang;
    const sess = round.session as { last: number | null };
    const q = question(p.min, p.max, p.add, Math.random, sess.last);
    sess.last = q.target;
    const dots = h("div", { class: "to-dots" }, ...Array.from({ length: q.target }, () => h("span", { class: "to-dot" })));
    const goal = h("button", { class: "to-goal", "aria-label": "🔊" }, h("b", {}, q.fixed ? `${q.fixed} + ${q.toAdd}` : String(q.target)), dots);
    goal.onclick = () => round.say(askText(q, lang));
    const tower = h("div", { class: "to-tower" });
    const zone = h("div", { class: "to-zone" }, tower, h("div", { class: "to-base" }));
    const pile = h("div", { class: "to-pile" });
    round.stage.appendChild(h("div", { class: "to-layout" }, goal, zone, pile));
    const fit = () => { const hh = round.stage.getBoundingClientRect().height; round.stage.style.setProperty("--b", Math.round(Math.max(26, Math.min(64, (hh - 60) / 11))) + "px"); };
    fit();
    const ro = new ResizeObserver(fit); ro.observe(round.stage); round.onCleanup(() => ro.disconnect());
    const count = () => tower.children.length;
    const update = () => [...dots.children].forEach((d, i) => d.classList.toggle("on", i < count()));
    const block = (color: string, fixed = false) => {
      const b = h("div", { class: "to-block" + (fixed ? " fixed" : ""), style: { background: color } });
      if (!fixed) b.onclick = () => { if (round.ended || b !== tower.lastElementChild) return; b.remove(); sfx.pop(); update(); if (count()) round.say(n(count(), lang)); };
      return b;
    };
    for (let i = 0; i < q.fixed; i++) tower.appendChild(block(COLORS[0], true));
    update();
    function add(color: string) {
      if (round.ended) return;
      if (count() >= 10) { round.say(TOO_TALL[lang]); return; }
      tower.appendChild(block(color));
      sfx.step(count() - 1);
      round.say(n(count(), lang));
      update();
      if (count() === q.target) { tower.classList.add("wobble"); round.win(tower, doneText(q, lang), { praise: false, delay: 2600 }); }
      else if (count() > q.target) round.miss(tower, tooHigh(q.target, lang));
    }
    const pileColors = q.fixed ? [COLORS[3], COLORS[3], COLORS[3], COLORS[3]] : COLORS.slice(1, 7);
    for (const c of pileColors) {
      const b = h("div", { class: "to-block" }); b.style.background = c;
      pile.appendChild(b);
      drag(b, {
        ghost: () => { const w = getComputedStyle(round.stage).getPropertyValue("--b").trim() || "48px"; return h("div", { class: "to-block", style: { background: c, width: w, height: w } }); },
        enabled: () => !round.ended,
        onMove: (pt) => zone.classList.toggle("k-zone-hot", inside(zone, pt, 30)),
        onDrop: (pt) => { zone.classList.remove("k-zone-hot"); if (!inside(zone, pt, 30)) return false; add(c); return true; },
        onTap: () => add(c),
      });
    }
    round.setHintTarget(() => (count() > q.target ? tower.lastElementChild : { from: pile.firstElementChild!, to: zone }));
    round.timeout(() => round.say(askText(q, lang)), round.index === 0 ? 3000 : 350);
  },
};
