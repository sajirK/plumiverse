// La pizzeria (4-8 ans), comme en V2 : écouter la commande, étaler la sauce et le fromage avec le doigt,
// glisser les garnitures (ou les toucher), compter, mettre au four puis servir le client.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { drag, relPos, type Pt } from "../../kit/drag";
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


/** Petit nom sous chaque garniture. */
export const LABELS: Record<string, Tr> = {
  "🍄": L("champi", "mushroom", "Pilz", "champi"), "🫒": L("olive", "olive", "Olive", "aceituna"), "🍅": L("tomate", "tomato", "Tomate", "tomate"),
  "🌶️": L("piment", "chilli", "Chili", "guindilla"), "🍍": L("ananas", "pineapple", "Ananas", "piña"), "🧅": L("oignon", "onion", "Zwiebel", "cebolla"),
  "🥓": L("jambon", "ham", "Schinken", "jamón"), "🌿": L("basilic", "basil", "Basilikum", "albahaca"), "🦐": L("crevette", "prawn", "Garnele", "gamba"), "🥚": L("œuf", "egg", "Ei", "huevo"),
};
/** Compter à voix haute en posant les garnitures : « une, deux, trois » (au féminin quand il faut). */
const ONE_F: Partial<Record<Lang, string>> = { fr: "une", es: "una" };
export const countWord = (e: string, n: number, lang: Lang) => (n === 1 && ONE_F[lang] && /^(une|una) /.test(TOPPINGS[e][lang][0]) ? ONE_F[lang]! : numberWords(n, lang));
export const UI = {
  sauceHow: L("Glisse la sauce sur la pizza pour l'étaler !", "Slide the sauce over the pizza to spread it!", "Zieh die Soße über die Pizza, um sie zu verteilen!", "¡Desliza la salsa sobre la pizza para extenderla!"),
  cheeseHow: L("Glisse le fromage sur la pizza !", "Slide the cheese over the pizza!", "Zieh den Käse über die Pizza!", "¡Desliza el queso sobre la pizza!"),
  empty: L("La pizza est toute vide ! Commence par la sauce tomate.", "The pizza is empty! Start with the tomato sauce.", "Die Pizza ist ganz leer! Fang mit der Tomatensoße an.", "¡La pizza está vacía! Empieza por la salsa de tomate."),
  oven: L("Au four ! Ça chauffe !", "Into the oven! It's getting hot!", "Ab in den Ofen! Es wird heiß!", "¡Al horno! ¡Qué calor!"),
  cooked: L("Ding ! La pizza est cuite ! Sers-la vite !", "Ding! The pizza is ready! Serve it quickly!", "Ding! Die Pizza ist fertig! Schnell servieren!", "¡Ding! ¡La pizza está lista! ¡Sírvela rápido!"),
  perfect: L("C'est parfait ! Miam miam ! Merci chef !", "It's perfect! Yum yum! Thank you, chef!", "Perfekt! Mmmh! Danke, Chef!", "¡Está perfecta! ¡Ñam ñam! ¡Gracias, chef!"),
  thanksBut: L("Merci, c'était bon ! Mais…", "Thanks, it was nice! But…", "Danke, es war lecker! Aber…", "¡Gracias, estaba rica! Pero…"),
};

const SAMPLES: [number, number][] = [];
for (let y = -0.75; y <= 0.75; y += 0.1) for (let x = -0.75; x <= 0.75; x += 0.1) if (x * x + y * y < 0.72 * 0.72) SAMPLES.push([x, y]);
interface Dab { x: number; y: number; seed: number }
/** Part de la pizza couverte par les touches de sauce (ou de fromage) de rayon r. */
export const coverage = (dabs: Dab[], r: number) => SAMPLES.filter(([x, y]) => dabs.some((d) => (d.x - x) ** 2 + (d.y - y) ** 2 < r * r)).length / SAMPLES.length;
const rand = (s: number) => { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); };

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
    ...Object.values(UI).map((x) => x[lang]), ...Object.values(ONE_F),
    ...Object.keys(TOPPINGS).flatMap((e) => [SAY.extra(e, lang), ...Array.from({ length: MAX_COUNT }, (_, i) => [named(e, i + 1, lang), SAY.wanted(e, i + 1, lang)]).flat()]),
  ].filter((x): x is string => !!x),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute la commande du client. Glisse la sauce et le fromage sur la pizza, puis les garnitures. Ensuite, au four !", "Listen to the customer's order. Slide the sauce and cheese onto the pizza, then the toppings. Then into the oven!", "Hör dir die Bestellung an. Zieh Soße und Käse auf die Pizza, dann den Belag. Und ab in den Ofen!", "Escucha el pedido. Desliza la salsa y el queso sobre la pizza, luego los ingredientes. ¡Y al horno!")[ctx.lang],
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const big = c.types[1] <= 1; // facile : grosses touches de sauce
    const R = { sauce: big ? 0.24 : 0.18, cheese: big ? 0.22 : 0.16 };
    const o = order(c);
    const client = pick(CLIENTS);
    const st = { sauce: [] as Dab[], cheese: [] as Dab[], tops: [] as { e: string; x: number; y: number; r: number; el?: HTMLElement }[], baked: false, served: false };
    const tell = () => { const ls = orderLines(o, lang); round.say(ls[0]); ls.slice(1).forEach((x) => round.say(x, lang, { interrupt: false })); };
    const face = h("div", { class: "pz-face arrive" }, client);
    const bubble = h("button", { class: "pz-bubble", "aria-label": "🔊" });
    bubble.onclick = tell;
    const zone = h("div", { class: "pz-zone" });
    const pizza = h("div", { class: "pz-pizza" });
    const canvas = h("canvas") as HTMLCanvasElement;
    const topsEl = h("div", { class: "pz-tops" });
    pizza.append(canvas, topsEl);
    zone.appendChild(h("div", { class: "pz-board" }, pizza));
    const tray = h("div", { class: "pz-tray" });
    round.stage.appendChild(h("div", { class: "pz-shop" }, h("div", { class: "pz-client" }, face, bubble), zone, tray));
    const c2 = canvas.getContext("2d")!;
    let S = 300;
    const fit = () => {
      const r = zone.getBoundingClientRect();
      S = Math.floor(Math.max(170, Math.min(r.width * 0.92, r.height * 0.92, 520)));
      round.stage.style.setProperty("--S", S + "px");
      const d = devicePixelRatio || 1; canvas.width = S * d; canvas.height = S * d; c2.setTransform(d, 0, 0, d, 0, 0);
      redraw();
    };
    const px = (v: number) => ((v + 1) / 2) * S;
    const clip = () => { c2.save(); c2.beginPath(); c2.arc(S / 2, S / 2, S * 0.41, 0, Math.PI * 2); c2.clip(); };
    function dough() {
      c2.clearRect(0, 0, S, S);
      const m = S / 2, b = st.baked;
      const g = c2.createRadialGradient(m, m, S * 0.36, m, m, S * 0.5);
      g.addColorStop(0, b ? "#e9b872" : "#f6dca8"); g.addColorStop(0.75, b ? "#c47a32" : "#efc98a"); g.addColorStop(1, b ? "#9c5a1f" : "#e0b272");
      c2.fillStyle = g; c2.beginPath(); c2.arc(m, m, S * 0.48, 0, Math.PI * 2); c2.fill();
      c2.fillStyle = b ? "#f3d9a4" : "#fbe9c6"; c2.beginPath(); c2.arc(m, m, S * 0.4, 0, Math.PI * 2); c2.fill();
    }
    function sauceDab(d: Dab) {
      clip();
      const x = px(d.x), y = px(d.y), r = ((R.sauce * S) / 2) * 1.15;
      const g = c2.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(214,40,40,0.95)"); g.addColorStop(0.7, "rgba(200,35,35,0.9)"); g.addColorStop(1, "rgba(200,35,35,0)");
      c2.fillStyle = g; c2.beginPath(); c2.arc(x, y, r, 0, Math.PI * 2); c2.fill(); c2.restore();
    }
    function cheeseDab(d: Dab) {
      clip();
      const x = px(d.x), y = px(d.y), r = (R.cheese * S) / 2;
      for (let i = 0; i < 9; i++) {
        const a = rand(d.seed + i) * Math.PI * 2, dist = rand(d.seed + i + 20) * r;
        c2.save(); c2.translate(x + Math.cos(a) * dist, y + Math.sin(a) * dist); c2.rotate(rand(d.seed + i + 40) * Math.PI);
        c2.fillStyle = st.baked ? (i % 2 ? "#ffd166" : "#f4a261") : i % 2 ? "#ffe066" : "#ffd43b";
        c2.fillRect(-S * 0.025, -S * 0.007, S * 0.05, S * 0.014); c2.restore();
      }
      c2.restore();
    }
    function redraw() { dough(); st.sauce.forEach(sauceDab); st.cheese.forEach(cheeseDab); }
    const counts = () => { const m: Record<string, number> = {}; for (const t of st.tops) m[t.e] = (m[t.e] ?? 0) + 1; return m; };
    const state = (): Pizza => ({ sauce: coverage(st.sauce, R.sauce), cheese: coverage(st.cheese, R.cheese), tops: counts() });
    function renderTops() {
      topsEl.innerHTML = "";
      for (const t of st.tops) {
        const d = h("button", { class: "pz-top", style: { left: (t.x + 1) * 50 + "%", top: (t.y + 1) * 50 + "%", "--r": t.r + "deg" }, "aria-label": t.e }, t.e);
        d.onclick = () => { if (st.baked) return; st.tops.splice(st.tops.indexOf(t), 1); sfx.pop(); renderTops(); updateBubble(); };
        topsEl.appendChild(d); t.el = d;
      }
    }
    function updateBubble() {
      const s = state(), have = s.tops;
      const chip = (cls: string, ...kids: (string | Node)[]) => h("span", { class: "pz-chip " + cls }, ...kids);
      bubble.replaceChildren(
        chip(s.sauce >= SAUCE_OK ? "ok" : "", "🥫"),
        o.cheese ? chip(s.cheese >= CHEESE_OK ? "ok" : "", "🧀") : chip(s.cheese > 0.05 ? "too" : "ok", "🚫🧀"),
        ...Object.entries(o.tops).map(([e, n]) => { const k = have[e] ?? 0; return chip(k === n ? "ok" : k > n ? "too" : "", h("span", { class: "pz-want" }, ...Array.from({ length: n }, (_, i) => h("span", { class: i < k ? "on" : "" }, e)))); }),
      );
    }
    const inPizza = (pt: Pt) => { const p = relPos(pizza, pt); return p.x * p.x + p.y * p.y < 0.85 * 0.85 ? p : null; };
    // sauce et fromage : on glisse le pot sur la pizza pour étaler
    let lastNoise = 0;
    function paintTool(kind: "sauce" | "cheese", emoji: string, label: Tr) {
      const b = h("button", { class: "pz-ing paint", "aria-label": label[lang] }, emoji, h("small", {}, label[lang]));
      drag(b, {
        enabled: () => !st.baked && !round.ended,
        onMove: (pt) => {
          const p = inPizza(pt); pizza.classList.toggle("hot", !!p);
          if (!p) return;
          const list = st[kind], last = list[list.length - 1];
          if (last && Math.hypot(last.x - p.x, last.y - p.y) < 0.05) return;
          const d = { x: p.x, y: p.y, seed: Math.random() * 1000 };
          list.push(d); (kind === "sauce" ? sauceDab : cheeseDab)(d);
          const now = performance.now();
          if (now - lastNoise > 140) { lastNoise = now; sfx.noise(0.1, kind === "sauce" ? { from: 400, to: 250, q: 2, volume: 0.1 } : { from: 3000, to: 4000, q: 3, volume: 0.07 }); }
          if (list.length % 5 === 0) updateBubble();
        },
        onDrop: () => { pizza.classList.remove("hot"); updateBubble(); return false; },
        onTap: () => { round.say((kind === "sauce" ? UI.sauceHow : UI.cheeseHow)[lang]); round.hint({ from: b, to: pizza, paint: true }); },
      });
      return b;
    }
    const sauceB = paintTool("sauce", "🥫", L("sauce", "sauce", "Soße", "salsa"));
    const cheeseB = paintTool("cheese", "🧀", L("fromage", "cheese", "Käse", "queso"));
    tray.append(sauceB, cheeseB);
    function addTop(e: string, x?: number, y?: number) {
      if (st.baked || st.tops.length >= 30) return;
      if (x === undefined || y === undefined) {
        let best: [number, number] = [0, 0], bestD = -1;
        for (let k = 0; k < 25; k++) { const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * 0.62, cx = Math.cos(a) * r, cy = Math.sin(a) * r; const d = Math.min(1, ...st.tops.map((t) => Math.hypot(t.x - cx, t.y - cy))); if (d > bestD) { bestD = d; best = [cx, cy]; } }
        [x, y] = best;
      }
      st.tops.push({ e, x: Math.max(-0.7, Math.min(0.7, x)), y: Math.max(-0.7, Math.min(0.7, y)), r: Math.floor(Math.random() * 60 - 30) });
      renderTops();
      const n = counts()[e];
      sfx.step(n - 1);
      round.say(countWord(e, n, lang));
      updateBubble();
    }
    const topB: Record<string, HTMLElement> = {};
    for (const e of o.tray) {
      const b = h("button", { class: "pz-ing", "aria-label": LABELS[e][lang] }, e, h("small", {}, LABELS[e][lang]));
      drag(b, {
        ghost: e, enabled: () => !st.baked && !round.ended,
        onMove: (pt) => pizza.classList.toggle("hot", !!inPizza(pt)),
        onDrop: (pt) => { pizza.classList.remove("hot"); const p = inPizza(pt); if (!p) return false; addTop(e, p.x, p.y); return true; },
        onTap: () => addTop(e),
      });
      tray.appendChild(b); topB[e] = b;
    }
    const resetB = h("button", { class: "pz-act reset", "aria-label": "🔄" }, "🔄");
    resetB.onclick = () => { if (st.baked) return; st.sauce = []; st.cheese = []; st.tops = []; redraw(); renderTops(); updateBubble(); sfx.pop(); };
    const bakeB = h("button", { class: "pz-act bake", "aria-label": "🔥" }, "🔥");
    const serveB = h("button", { class: "pz-act serve", "aria-label": "🍽️" }, "🍽️");
    serveB.style.display = "none";
    tray.append(resetB, bakeB, serveB);
    bakeB.onclick = () => {
      if (st.baked || round.ended) return;
      if (!st.sauce.length && !st.tops.length) { round.say(UI.empty[lang]); round.hint({ from: sauceB, to: pizza, paint: true }); return; }
      const snap = document.createElement("canvas"); snap.width = S; snap.height = S;
      const sc = snap.getContext("2d")!; sc.drawImage(canvas, 0, 0, S, S);
      sc.textAlign = "center"; sc.textBaseline = "middle"; sc.font = `${S * 0.11}px serif`;
      for (const t of st.tops) sc.fillText(t.e, px(t.x), px(t.y));
      const img = h("img", { alt: "" }) as HTMLImageElement; img.src = snap.toDataURL();
      const bar = h("div");
      const oven = h("div", { class: "pz-oven" }, h("div", { class: "pz-ovenbox" }, h("div", { class: "pz-ovenwin" }, img, h("div", { class: "pz-flames" }, "🔥🔥🔥🔥🔥")), h("div", { class: "pz-bar" }, bar)));
      document.body.appendChild(oven);
      round.onCleanup(() => oven.remove());
      round.say(UI.oven[lang]);
      requestAnimationFrame(() => requestAnimationFrame(() => (bar.style.width = "100%")));
      let crackling = true;
      const crackle = () => { if (!crackling) return; sfx.noise(0.3, { from: 1500, to: 900, q: 0.7, volume: 0.06 }); round.timeout(crackle, 300); };
      crackle();
      bakeB.style.display = "none"; resetB.style.display = "none";
      round.timeout(() => {
        crackling = false; sfx.ding();
        st.baked = true; pizza.classList.add("baked"); redraw();
        oven.remove(); serveB.style.display = "";
        round.say(UI.cooked[lang]);
      }, 2800);
    };
    serveB.onclick = () => {
      if (!st.baked || st.served) return;
      st.served = true;
      const r = judge(o, state(), lang);
      face.classList.add("eat"); pizza.classList.add("gone"); sfx.yum();
      round.timeout(() => {
        face.classList.remove("eat");
        if (r.perfect) { face.textContent = client + "😋"; round.win(face, UI.perfect[lang], { praise: false, delay: 3200 }); }
        else { face.textContent = client + "🙂"; round.oops(); round.say(UI.thanksBut[lang]); round.say(r.notes[0], lang, { interrupt: false }); round.win(face, "", { praise: false, delay: 4200 }); }
      }, 1400);
    };
    round.setHintTarget(() => {
      if (st.served) return null;
      if (st.baked) return serveB;
      if (bakeB.style.display === "none") return null;
      const n = nextNeed(o, state());
      if (n === "sauce") return { from: sauceB, to: pizza, paint: true };
      if (n === "fromage") return { from: cheeseB, to: pizza, paint: true };
      if (n === "recommencer") return resetB;
      if (n === "four") return bakeB;
      if ("add" in n) return { from: topB[n.add], to: pizza };
      return st.tops.find((t) => t.e === n.remove)?.el ?? null;
    });
    fit();
    const ro = new ResizeObserver(fit); ro.observe(zone); round.onCleanup(() => ro.disconnect());
    updateBubble();
    round.timeout(() => face.classList.remove("arrive"), 800);
    round.timeout(tell, round.index === 0 ? 3200 : 700);
  },
};
