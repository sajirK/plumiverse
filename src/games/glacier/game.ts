// Le glacier (4-8 ans) : écouter la commande, choisir cornet ou pot, les boules, le nappage et la décoration.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const FLAVORS: Record<string, { c: string; name: Tr; chips?: boolean }> = {
  vanille: { c: "#fff3c4", name: L("vanille", "vanilla", "Vanille", "vainilla") },
  chocolat: { c: "#8b5a3c", name: L("chocolat", "chocolate", "Schokolade", "chocolate") },
  fraise: { c: "#ff9ebb", name: L("fraise", "strawberry", "Erdbeere", "fresa") },
  pistache: { c: "#b8e08f", name: L("pistache", "pistachio", "Pistazie", "pistacho") },
  menthe: { c: "#a8f0dc", name: L("menthe chocolat", "mint choc chip", "Minze-Schoko", "menta con chocolate"), chips: true },
  citron: { c: "#fff27a", name: L("citron", "lemon", "Zitrone", "limón") },
  myrtille: { c: "#a99cf5", name: L("myrtille", "blueberry", "Heidelbeere", "arándano") },
  mangue: { c: "#ffbb5c", name: L("mangue", "mango", "Mango", "mango") },
};
export const SAUCES: Record<string, { c: string; name: Tr }> = {
  chocolat: { c: "#4a2511", name: L("de la sauce chocolat", "chocolate sauce", "Schokosoße", "salsa de chocolate") },
  caramel: { c: "#d98e04", name: L("du caramel", "caramel", "Karamell", "caramelo") },
  fraise: { c: "#d62839", name: L("du coulis de fraise", "strawberry sauce", "Erdbeersoße", "salsa de fresa") },
};
export const DECOS: Record<string, Tr> = {
  "🍒": L("une cerise", "a cherry", "eine Kirsche", "una cereza"),
  "🌈": L("des vermicelles", "sprinkles", "Streusel", "virutas de colores"),
  "🍫": L("un bâton de chocolat", "a chocolate stick", "einen Schokoriegel", "una barrita de chocolate"),
  "🍪": L("un biscuit", "a biscuit", "einen Keks", "una galleta"),
  "🍓": L("une fraise", "a strawberry", "eine Erdbeere", "una fresa"),
};
export type Holder = "cornet" | "pot";
const HOLDER = { cornet: "🍦", pot: "🍨" } as const;

export const scoops = (f: string, n: number, lang: Lang) => {
  const fl = FLAVORS[f].name[lang], one = n === 1;
  const num = one ? { fr: "une", en: "one", de: "eine", es: "una" }[lang] : numberWords(n, lang);
  return ({ fr: `${num} boule${one ? "" : "s"} ${fl}`, en: `${num} scoop${one ? "" : "s"} of ${fl}`, de: `${num} Kugel${one ? "" : "n"} ${fl}`, es: `${num} bola${one ? "" : "s"} de ${fl}` })[lang];
};
export const SAY = {
  hello: { cornet: L("Bonjour ! Je voudrais un cornet avec :", "Hello! I'd like a cone with:", "Hallo! Ich hätte gern eine Waffel. Darauf bitte:", "¡Hola! Quiero un cucurucho con:"), pot: L("Bonjour ! Je voudrais un pot avec :", "Hello! I'd like a cup with:", "Hallo! Ich hätte gern einen Becher. Darin bitte:", "¡Hola! Quiero una tarrina con:") },
  please: L("S'il te plaît !", "Please!", "Bitte!", "¡Por favor!"),
  perfect: L("Miam ! Elle est parfaite, merci !", "Yum! It's perfect, thank you!", "Lecker! Es ist perfekt, danke!", "¡Mmm! ¡Está perfecto, gracias!"),
  holder: { cornet: L("Je voulais un cornet.", "I wanted a cone.", "Ich wollte eine Waffel.", "Quería un cucurucho."), pot: L("Je voulais un pot.", "I wanted a cup.", "Ich wollte einen Becher.", "Quería una tarrina.") },
  noSauce: L("Je ne voulais pas de nappage.", "I didn't want any sauce.", "Ich wollte keine Soße.", "No quería salsa."),
  wanted: (x: string, lang: Lang) => ({ fr: `Je voulais ${x}.`, en: `I wanted ${x}.`, de: `Ich wollte ${x}.`, es: `Quería ${x}.` })[lang],
  extra: (f: string, lang: Lang) => { const fl = FLAVORS[f].name[lang]; return ({ fr: `Il y a une boule ${fl} en plus, rigolo !`, en: `There's an extra scoop of ${fl}, how funny!`, de: `Da ist eine Kugel ${fl} zu viel, lustig!`, es: `¡Hay una bola de ${fl} de más, qué gracioso!` })[lang]; },
  missing: (d: string, lang: Lang) => { const x = DECOS[d][lang]; return ({ fr: `Il manque ${x}.`, en: `I'm missing ${x}.`, de: `Es fehlt noch ${x.replace(/^einen /, "ein ")}.`, es: `Falta ${x}.` })[lang]; },
};

export interface Order { holder: Holder; scoops: string[]; sauce: string | null; decos: string[]; tubs: string[] }
export interface Ice { holder: Holder | null; scoops: string[]; sauce: string | null; decos: string[] }
export interface Cfg { scoops: [number, number]; sauce: number; decos: [number, number]; tubs: number }
const between = (rng: Rng, [a, b]: [number, number]) => a + Math.floor(rng() * (b - a + 1));
export function countBy(list: string[]) { const m: Record<string, number> = {}; for (const x of list) m[x] = (m[x] ?? 0) + 1; return m; }

export function order(c: Cfg, rng: Rng = Math.random): Order {
  const pool = shuffle(Object.keys(FLAVORS), rng);
  const sc = Array.from({ length: between(rng, c.scoops) }, () => pool[Math.floor(rng() * Math.min(3, pool.length))]);
  const wanted = [...new Set(sc)];
  const tubs = shuffle([...wanted, ...pool.filter((f) => !wanted.includes(f)).slice(0, Math.max(0, c.tubs - wanted.length))], rng);
  return { holder: rng() < 0.6 ? "cornet" : "pot", scoops: sc, sauce: rng() < c.sauce ? pick(Object.keys(SAUCES), rng) : null, decos: shuffle(Object.keys(DECOS), rng).slice(0, between(rng, c.decos)), tubs };
}
export function orderLines(o: Order, lang: Lang): string[] {
  return [SAY.hello[o.holder][lang], ...Object.entries(countBy(o.scoops)).map(([f, n]) => scoops(f, n, lang)), ...(o.sauce ? [SAUCES[o.sauce].name[lang]] : []), ...o.decos.map((d) => DECOS[d][lang]), SAY.please[lang]];
}
export function judge(o: Order, ice: Ice, lang: Lang) {
  const notes: string[] = [];
  if (ice.holder !== o.holder) notes.push(SAY.holder[o.holder][lang]);
  const want = countBy(o.scoops), have = countBy(ice.scoops);
  for (const [f, n] of Object.entries(want)) if ((have[f] ?? 0) !== n) notes.push(SAY.wanted(scoops(f, n, lang), lang));
  const extra = Object.keys(have).find((f) => !(f in want));
  if (extra) notes.push(SAY.extra(extra, lang));
  if (o.sauce !== ice.sauce) notes.push(o.sauce ? SAY.wanted(SAUCES[o.sauce].name[lang], lang) : SAY.noSauce[lang]);
  for (const d of o.decos) if (!ice.decos.includes(d)) notes.push(SAY.missing(d, lang));
  return { perfect: notes.length === 0, notes };
}
export type Need = { holder: Holder } | { add: string } | { remove: string } | { sauce: string } | { deco: string } | "servir";
export function nextNeed(o: Order, ice: Ice): Need {
  if (ice.holder !== o.holder) return { holder: o.holder };
  const want = countBy(o.scoops), have = countBy(ice.scoops);
  const over = Object.keys(have).find((f) => have[f] > (want[f] ?? 0));
  if (over) return { remove: over };
  const under = Object.keys(want).find((f) => (have[f] ?? 0) < want[f]);
  if (under) return { add: under };
  if (o.sauce !== ice.sauce) return { sauce: o.sauce ?? ice.sauce! };
  const d = o.decos.find((x) => !ice.decos.includes(x));
  return d ? { deco: d } : "servir";
}

const lv = (id: string, rounds: number, c: Cfg, boss = false): LevelDef => ({ id, rounds, params: c as unknown as Record<string, unknown>, boss, skills: ["ecoute", "compter"] });
export const TRACK: Track = {
  chapters: [
    { id: "g1", tier: "facile", ages: [4, 5], title: L("Une boule", "One scoop", "Eine Kugel", "Una bola"), levels: [lv("1-1", 2, { scoops: [1, 1], sauce: 0, decos: [0, 0], tubs: 3 }), lv("1-2", 3, { scoops: [1, 1], sauce: 0, decos: [1, 1], tubs: 3 }), lv("1-b", 3, { scoops: [1, 2], sauce: 0, decos: [1, 1], tubs: 3 }, true)] },
    { id: "g2", tier: "moyen", ages: [6, 7], title: L("Avec du nappage", "With sauce", "Mit Soße", "Con salsa"), levels: [lv("2-1", 3, { scoops: [1, 2], sauce: 0.5, decos: [0, 1], tubs: 4 }), lv("2-b", 3, { scoops: [2, 2], sauce: 0.6, decos: [1, 1], tubs: 5 }, true)] },
    { id: "g3", tier: "difficile", ages: [8, 8], title: L("La coupe géante", "The giant sundae", "Der Riesenbecher", "La copa gigante"), levels: [lv("3-1", 3, { scoops: [2, 3], sauce: 0.7, decos: [1, 2], tubs: 6 }), lv("3-b", 4, { scoops: [3, 3], sauce: 0.8, decos: [2, 2], tubs: 8 }, true)] },
  ],
};

const CLIENTS = ["🐻", "🐱", "🐸", "🦊", "🐼", "🐷", "🐵", "🦁", "🐰", "👽", "🐧", "🐨", "🦄"];
const MAX_SCOOPS = 3;

export const glacierGame: GameDef = {
  id: "glacier",
  icon: "🍦",
  category: "maths",
  ages: [4, 8],
  title: L("Le glacier", "The ice-cream shop", "Die Eisdiele", "La heladería"),
  desc: L("Écouter la commande et préparer la bonne glace : cornet ou pot, parfums, nappage et décorations.", "Listen to the order and make the right ice cream: cone or cup, flavours, sauce and toppings.", "Die Bestellung anhören und das richtige Eis machen: Waffel oder Becher, Sorten, Soße und Deko.", "Escuchar el pedido y preparar el helado correcto: cucurucho o tarrina, sabores, salsa y adornos."),
  skills: { ecoute: L("Écouter une consigne", "Following instructions", "Anweisungen folgen", "Seguir instrucciones"), compter: L("Compter", "Counting", "Zählen", "Contar") },
  speech: (lang) => {
    const out: string[] = [SAY.please[lang], SAY.perfect[lang], SAY.noSauce[lang], ...(["cornet", "pot"] as const).flatMap((k) => [SAY.hello[k][lang], SAY.holder[k][lang]])];
    for (const f of Object.keys(FLAVORS)) { out.push(SAY.extra(f, lang)); for (let n = 1; n <= MAX_SCOOPS; n++) out.push(scoops(f, n, lang), SAY.wanted(scoops(f, n, lang), lang)); }
    for (const s of Object.values(SAUCES)) out.push(s.name[lang], SAY.wanted(s.name[lang], lang));
    for (const d of Object.keys(DECOS)) out.push(DECOS[d][lang], SAY.missing(d, lang));
    return out;
  },
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute bien la commande et prépare la bonne glace !", "Listen to the order and make the right ice cream!", "Hör dir die Bestellung an und mach das richtige Eis!", "¡Escucha el pedido y prepara el helado correcto!")[ctx.lang],
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const o = order(c);
    const ice: Ice = { holder: null, scoops: [], sauce: null, decos: [] };
    let served = false;
    const tell = () => { const ls = orderLines(o, lang); round.say(ls[0]); ls.slice(1).forEach((x) => round.say(x, lang, { interrupt: false })); };
    const dot = (col: string) => h("span", { class: "gl-dot", style: { background: col } });
    const ticket = h("button", { class: "pz-ticket", "aria-label": "🔊" }, h("span", { class: "pz-client" }, pick(CLIENTS)), h("span", {}, HOLDER[o.holder]),
      h("span", { class: "pz-want" }, ...o.scoops.map((f) => dot(FLAVORS[f].c))), ...(o.sauce ? [h("span", { class: "gl-drop", style: { background: SAUCES[o.sauce].c } })] : []), ...o.decos.map((d) => h("span", {}, d)));
    ticket.onclick = tell;
    const view = h("div", { class: "gl-ice" });
    const act = (fn: () => void) => () => { if (!round.ended && !served) { fn(); draw(); } };
    const btn = (content: Node | string, fn: () => void, cls = "pz-tool", label = "") => { const b = h("button", { class: cls, "aria-label": label || (typeof content === "string" ? content : "") }, content); b.onclick = act(fn); return b; };
    const holderB = { cornet: btn("🍦", () => { ice.holder = "cornet"; sfx.pop(); }), pot: btn("🍨", () => { ice.holder = "pot"; sfx.pop(); }) };
    const tubB: Record<string, HTMLElement> = {};
    for (const f of o.tubs) tubB[f] = btn(h("span", { class: "gl-tub" + (FLAVORS[f].chips ? " chips" : ""), style: { background: FLAVORS[f].c } }), () => { if (ice.scoops.length < MAX_SCOOPS) { ice.scoops.push(f); sfx.pop(); } else sfx.soft(); }, "pz-tool", FLAVORS[f].name[lang]);
    const sauceB: Record<string, HTMLElement> = {};
    for (const [k, s] of Object.entries(SAUCES)) sauceB[k] = btn(h("span", { class: "gl-drop", style: { background: s.c } }), () => { ice.sauce = ice.sauce === k ? null : k; sfx.pop(); }, "pz-tool", s.name[lang]);
    const decoB: Record<string, HTMLElement> = {};
    for (const d of Object.keys(DECOS)) decoB[d] = btn(d, () => { const i = ice.decos.indexOf(d); if (i >= 0) ice.decos.splice(i, 1); else ice.decos.push(d); sfx.pop(); });
    const resetB = btn("🔄", () => { ice.holder = null; ice.scoops = []; ice.sauce = null; ice.decos = []; sfx.soft(); });
    const serveB = btn("✅", () => serve(), "k-btn primary pz-oven");
    const useSauce = c.sauce > 0;
    round.stage.appendChild(h("div", { class: "ca-wrap pz-wrap" }, ticket, view,
      h("div", { class: "pz-tray" }, holderB.cornet, holderB.pot, ...o.tubs.map((f) => tubB[f])),
      h("div", { class: "pz-tray" }, ...(useSauce ? Object.values(sauceB) : []), ...Object.values(decoB), resetB), serveB));
    function draw() {
      view.innerHTML = "";
      view.className = "gl-ice" + (ice.holder ? " " + ice.holder : "");
      const stack = h("div", { class: "gl-stack" });
      ice.scoops.forEach((f, i) => {
        const s = h("button", { class: "gl-scoop" + (FLAVORS[f].chips ? " chips" : ""), style: { background: FLAVORS[f].c }, "aria-label": FLAVORS[f].name[lang] });
        s.dataset.f = f;
        s.onclick = act(() => { ice.scoops.splice(i, 1); sfx.soft(); });
        stack.prepend(s);
      });
      if (ice.sauce) stack.prepend(h("div", { class: "gl-sauce", style: { background: SAUCES[ice.sauce].c } }));
      if (ice.decos.length) stack.prepend(h("div", { class: "gl-decos" }, ice.decos.join("")));
      view.append(stack, h("div", { class: "gl-holder" }, ice.holder ? "" : "❔"));
      for (const k of ["cornet", "pot"] as const) holderB[k].classList.toggle("on", ice.holder === k);
      for (const [k, b] of Object.entries(sauceB)) b.classList.toggle("on", ice.sauce === k);
      for (const [d, b] of Object.entries(decoB)) b.classList.toggle("on", ice.decos.includes(d));
    }
    function serve() {
      const r = judge(o, ice, lang);
      if (r.perfect) { served = true; sfx.good(); round.win(view, SAY.perfect[lang], { praise: false, delay: 2600 }); }
      else round.miss(view, r.notes[0]);
    }
    round.setHintTarget(() => {
      if (served) return null;
      const n = nextNeed(o, ice);
      if (n === "servir") return serveB;
      if ("holder" in n) return holderB[n.holder];
      if ("add" in n) return tubB[n.add];
      if ("remove" in n) return view.querySelector(`.gl-scoop[data-f="${n.remove}"]`);
      if ("sauce" in n) return sauceB[n.sauce];
      return decoB[n.deco];
    });
    draw();
    round.timeout(tell, round.index === 0 ? 2600 : 400);
  },
};
