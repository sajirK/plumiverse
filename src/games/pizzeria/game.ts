// La pizzeria (4-8 ans) : écouter la commande du client (et lire le ticket en images), faire la pizza, la cuire.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

/** Pour chaque garniture et chaque langue : [« une olive » (un seul, avec l'article), « olives » (pluriel)]. */
type Forms = Record<Lang, [string, string]>;
const F = (fr: [string, string], en: [string, string], de: [string, string], es: [string, string]): Forms => ({ fr, en, de, es });
export const TOPPINGS: Record<string, Forms> = {
  "🍄": F(["un champignon", "champignons"], ["one mushroom", "mushrooms"], ["einen Pilz", "Pilze"], ["un champiñón", "champiñones"]),
  "🫒": F(["une olive", "olives"], ["one olive", "olives"], ["eine Olive", "Oliven"], ["una aceituna", "aceitunas"]),
  "🍅": F(["une tomate", "tomates"], ["one tomato", "tomatoes"], ["eine Tomate", "Tomaten"], ["un tomate", "tomates"]),
  "🌶️": F(["un piment", "piments"], ["one chilli", "chillies"], ["eine Chili", "Chilis"], ["una guindilla", "guindillas"]),
  "🍍": F(["un morceau d'ananas", "morceaux d'ananas"], ["one piece of pineapple", "pieces of pineapple"], ["ein Ananasstück", "Ananasstücke"], ["un trozo de piña", "trozos de piña"]),
  "🧅": F(["un oignon", "oignons"], ["one onion", "onions"], ["eine Zwiebel", "Zwiebeln"], ["una cebolla", "cebollas"]),
  "🥓": F(["une tranche de jambon", "tranches de jambon"], ["one slice of ham", "slices of ham"], ["eine Schinkenscheibe", "Schinkenscheiben"], ["una loncha de jamón", "lonchas de jamón"]),
  "🌿": F(["une feuille de basilic", "feuilles de basilic"], ["one basil leaf", "basil leaves"], ["ein Basilikumblatt", "Basilikumblätter"], ["una hoja de albahaca", "hojas de albahaca"]),
  "🦐": F(["une crevette", "crevettes"], ["one prawn", "prawns"], ["eine Garnele", "Garnelen"], ["una gamba", "gambas"]),
  "🥚": F(["un œuf", "œufs"], ["one egg", "eggs"], ["ein Ei", "Eier"], ["un huevo", "huevos"]),
};
export const named = (e: string, n: number, lang: Lang) => (n === 1 ? TOPPINGS[e][lang][0] : `${numberWords(n, lang)} ${TOPPINGS[e][lang][1]}`);

export const SAY = {
  hello: L("Bonjour ! Je voudrais une pizza avec :", "Hello! I'd like a pizza with:", "Hallo! Ich hätte gern eine Pizza. Darauf bitte:", "¡Hola! Quiero una pizza con:"),
  sauce: L("de la sauce tomate", "tomato sauce", "Tomatensoße", "salsa de tomate"),
  cheese: L("du fromage", "cheese", "Käse", "queso"),
  noCheese: L("mais sans fromage !", "but no cheese!", "aber ohne Käse!", "¡pero sin queso!"),
  please: L("S'il te plaît !", "Please!", "Bitte!", "¡Por favor!"),
  perfect: L("Miam ! Elle est parfaite, merci !", "Yum! It's perfect, thank you!", "Lecker! Sie ist perfekt, danke!", "¡Mmm! ¡Está perfecta, gracias!"),
  moreSauce: L("Il manque un peu de sauce.", "It needs a bit more sauce.", "Da fehlt noch etwas Soße.", "Falta un poco de salsa."),
  moreCheese: L("Je voulais plus de fromage.", "I wanted more cheese.", "Ich wollte mehr Käse.", "Quería más queso."),
  saidNoCheese: L("J'avais dit sans fromage !", "I said no cheese!", "Ich hatte doch ohne Käse gesagt!", "¡Había dicho sin queso!"),
  wanted: (e: string, n: number, lang: Lang) => { const x = named(e, n, lang); return ({ fr: `Je voulais ${x}.`, en: `I wanted ${x}.`, de: `Ich wollte ${x}.`, es: `Quería ${x}.` })[lang]; },
  extra: (e: string, lang: Lang) => { const x = TOPPINGS[e][lang][1]; return ({ fr: `Il y a des ${x} en plus, rigolo !`, en: `There are extra ${x}, how funny!`, de: `Da sind noch ${x} drauf, lustig!`, es: `¡Hay ${x} de más, qué gracioso!` })[lang]; },
};

export const SAUCE_OK = 0.5, CHEESE_OK = 0.4, MAX_COUNT = 5;
export interface Order { cheese: boolean; tops: Record<string, number>; tray: string[] }
export interface Pizza { sauce: number; cheese: number; tops: Record<string, number> }
export interface Cfg { types: [number, number]; maxCount: number; noCheese: number; tray: number }

export function order(c: Cfg, rng: Rng = Math.random): Order {
  const n = c.types[0] + Math.floor(rng() * (c.types[1] - c.types[0] + 1));
  const types = shuffle(Object.keys(TOPPINGS), rng).slice(0, n);
  const tops = Object.fromEntries(types.map((t) => [t, 1 + Math.floor(rng() * c.maxCount)]));
  const others = shuffle(Object.keys(TOPPINGS).filter((t) => !types.includes(t)), rng).slice(0, Math.max(0, c.tray - types.length));
  return { cheese: rng() >= c.noCheese, tops, tray: shuffle([...types, ...others], rng) };
}
/** La commande, en petits morceaux dits l'un après l'autre. */
export function orderLines(o: Order, lang: Lang): string[] {
  return [SAY.hello[lang], SAY.sauce[lang], ...(o.cheese ? [SAY.cheese[lang]] : []), ...Object.entries(o.tops).map(([e, n]) => named(e, n, lang)), o.cheese ? SAY.please[lang] : SAY.noCheese[lang]];
}
export function judge(o: Order, p: Pizza, lang: Lang): { perfect: boolean; notes: string[] } {
  const notes: string[] = [];
  if (p.sauce < SAUCE_OK) notes.push(SAY.moreSauce[lang]);
  if (o.cheese && p.cheese < CHEESE_OK) notes.push(SAY.moreCheese[lang]);
  if (!o.cheese && p.cheese > 0.05) notes.push(SAY.saidNoCheese[lang]);
  for (const [e, n] of Object.entries(o.tops)) if ((p.tops[e] ?? 0) !== n) notes.push(SAY.wanted(e, n, lang));
  const extra = Object.keys(p.tops).find((e) => p.tops[e] > 0 && !(e in o.tops));
  if (extra) notes.push(SAY.extra(extra, lang));
  return { perfect: notes.length === 0, notes };
}
export type Need = "sauce" | "fromage" | "recommencer" | "four" | { add: string } | { remove: string };
export function nextNeed(o: Order, p: Pizza): Need {
  if (!o.cheese && p.cheese > 0.05) return "recommencer";
  if (p.sauce < SAUCE_OK) return "sauce";
  if (o.cheese && p.cheese < CHEESE_OK) return "fromage";
  for (const [e, n] of Object.entries(o.tops)) { const have = p.tops[e] ?? 0; if (have < n) return { add: e }; if (have > n) return { remove: e }; }
  const extra = Object.keys(p.tops).find((e) => p.tops[e] > 0 && !(e in o.tops));
  return extra ? { remove: extra } : "four";
}

const lv = (id: string, rounds: number, c: Cfg, boss = false): LevelDef => ({ id, rounds, params: c as unknown as Record<string, unknown>, boss, skills: ["ecoute", "compter"] });
export const TRACK: Track = {
  chapters: [
    { id: "p1", tier: "facile", ages: [4, 5], title: L("Une garniture", "One topping", "Ein Belag", "Un ingrediente"), levels: [lv("1-1", 2, { types: [1, 1], maxCount: 2, noCheese: 0, tray: 3 }), lv("1-2", 2, { types: [1, 1], maxCount: 3, noCheese: 0, tray: 4 }), lv("1-b", 3, { types: [1, 1], maxCount: 3, noCheese: 0, tray: 4 }, true)] },
    { id: "p2", tier: "moyen", ages: [6, 7], title: L("Deux garnitures", "Two toppings", "Zwei Beläge", "Dos ingredientes"), levels: [lv("2-1", 2, { types: [2, 2], maxCount: 3, noCheese: 0, tray: 5 }), lv("2-2", 3, { types: [2, 2], maxCount: 4, noCheese: 0, tray: 6 }), lv("2-b", 3, { types: [2, 2], maxCount: 4, noCheese: 0.3, tray: 6 }, true)] },
    { id: "p3", tier: "difficile", ages: [8, 8], title: L("Le grand chef", "The head chef", "Der Chefkoch", "El gran chef"), levels: [lv("3-1", 3, { types: [2, 3], maxCount: 5, noCheese: 0.3, tray: 8 }), lv("3-b", 3, { types: [3, 3], maxCount: 5, noCheese: 0.4, tray: 8 }, true)] },
  ],
};

const CLIENTS = ["🐻", "🐱", "🐸", "🦊", "🐼", "🐷", "🐵", "🦁", "🐰", "👽", "🐧", "🐮"];

export const pizzeriaGame: GameDef = {
  id: "pizzeria",
  icon: "🍕",
  category: "maths",
  ages: [4, 8],
  title: L("La pizzeria", "The pizzeria", "Die Pizzeria", "La pizzería"),
  desc: L("Écouter la commande du client et préparer la bonne pizza : écoute, mémoire et comptage.", "Listen to the customer's order and make the right pizza: listening, memory and counting.", "Die Bestellung des Kunden anhören und die richtige Pizza backen: Zuhören, Gedächtnis und Zählen.", "Escuchar el pedido del cliente y preparar la pizza correcta: escucha, memoria y conteo."),
  skills: { ecoute: L("Écouter une consigne", "Following instructions", "Anweisungen folgen", "Seguir instrucciones"), compter: L("Compter", "Counting", "Zählen", "Contar") },
  speech: (lang) => [
    ...Object.values(SAY).filter((x): x is Tr => typeof x === "object").map((x) => x[lang]),
    ...Object.keys(TOPPINGS).flatMap((e) => [SAY.extra(e, lang), ...Array.from({ length: MAX_COUNT }, (_, i) => [named(e, i + 1, lang), SAY.wanted(e, i + 1, lang)]).flat()]),
  ],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute bien la commande, prépare la pizza, puis mets-la au four !", "Listen to the order, make the pizza, then put it in the oven!", "Hör dir die Bestellung an, mach die Pizza und schieb sie in den Ofen!", "¡Escucha el pedido, prepara la pizza y luego métela al horno!")[ctx.lang],
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const o = order(c);
    const pz: Pizza = { sauce: 0, cheese: 0, tops: {} };
    let baked = false;
    const tell = () => { const ls = orderLines(o, lang); round.say(ls[0]); ls.slice(1).forEach((x) => round.say(x, lang, { interrupt: false })); };
    // le ticket en images (pour ceux qui ne lisent pas)
    const ticket = h("button", { class: "pz-ticket", "aria-label": "🔊" }, h("span", { class: "pz-client" }, pick(CLIENTS)),
      h("span", {}, "🥫"), h("span", {}, o.cheese ? "🧀" : "🚫🧀"), ...Object.entries(o.tops).map(([e, n]) => h("span", { class: "pz-want" }, e.repeat(n))));
    ticket.onclick = tell;
    const sauceL = h("div", { class: "pz-sauce" }), cheeseL = h("div", { class: "pz-cheese" }), topsL = h("div", { class: "pz-tops" });
    const pizza = h("div", { class: "pz-pizza" }, sauceL, cheeseL, topsL);
    const tool = (e: string, fn: () => void, cls = "pz-tool") => { const b = h("button", { class: cls, "aria-label": e }, e); b.onclick = () => { if (!round.ended && !baked) fn(); }; return b; };
    const sauceB = tool("🥫", () => { pz.sauce = Math.min(1, pz.sauce + 0.25); sfx.pop(); draw(); });
    const cheeseB = tool("🧀", () => { pz.cheese = Math.min(1, pz.cheese + 0.25); sfx.pop(); draw(); });
    const resetB = tool("🔄", () => { pz.sauce = 0; pz.cheese = 0; pz.tops = {}; sfx.soft(); draw(); });
    const trayB: Record<string, HTMLElement> = {};
    for (const e of o.tray) trayB[e] = tool(e, () => { const n = Object.values(pz.tops).reduce((a, b) => a + b, 0); if (n >= 14) return; pz.tops[e] = (pz.tops[e] ?? 0) + 1; sfx.pop(); draw(); });
    const ovenB = tool("🔥", () => bake(), "k-btn primary pz-oven");
    round.stage.appendChild(h("div", { class: "ca-wrap pz-wrap" }, ticket, pizza,
      h("div", { class: "pz-tray" }, sauceB, cheeseB, ...o.tray.map((e) => trayB[e]), resetB), ovenB));
    const spots: Record<string, [number, number][]> = {};
    function draw() {
      sauceL.style.opacity = String(Math.min(1, pz.sauce * 1.6));
      cheeseL.style.opacity = String(Math.min(1, pz.cheese * 1.8));
      topsL.innerHTML = "";
      for (const [e, n] of Object.entries(pz.tops)) {
        const sp = (spots[e] ??= []);
        for (let i = 0; i < n; i++) {
          if (!sp[i]) { const a = Math.random() * Math.PI * 2, r = 12 + Math.random() * 26; sp[i] = [50 + Math.cos(a) * r, 50 + Math.sin(a) * r]; }
          const t = h("button", { class: "pz-top", style: { left: sp[i][0] + "%", top: sp[i][1] + "%" }, "aria-label": e }, e);
          t.dataset.e = e;
          t.onclick = (ev) => { ev.stopPropagation(); if (round.ended || baked) return; pz.tops[e]--; sp.splice(i, 1); if (!pz.tops[e]) delete pz.tops[e]; sfx.soft(); draw(); };
          topsL.appendChild(t);
        }
      }
    }
    function bake() {
      const r = judge(o, pz, lang);
      if (r.perfect) { baked = true; pizza.classList.add("baked"); sfx.good(); round.win(pizza, SAY.perfect[lang], { praise: false, delay: 2600 }); }
      else round.miss(pizza, r.notes[0]);
    }
    round.setHintTarget(() => {
      if (baked) return null;
      const n = nextNeed(o, pz);
      if (n === "sauce") return sauceB;
      if (n === "fromage") return cheeseB;
      if (n === "recommencer") return resetB;
      if (n === "four") return ovenB;
      if ("add" in n) return trayB[n.add];
      return topsL.querySelector(`[data-e="${n.remove}"]`);
    });
    draw();
    round.timeout(tell, round.index === 0 ? 2600 : 400);
  },
};
