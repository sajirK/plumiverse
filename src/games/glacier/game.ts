// Le glacier (4-8 ans), comme en V2 : écouter la commande, puis en 4 étapes : cornet ou pot, glisser les boules,
// le nappage, la décoration ; le client lèche sa glace et dit si c'est parfait.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { drag, inside } from "../../kit/drag";
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


type StepId = "holder" | "scoops" | "sauce" | "decos";
const STEPS: StepId[] = ["holder", "scoops", "sauce", "decos"];
export const UI = {
  step: {
    holder: L("Un cornet ou un pot ?", "A cone or a cup?", "Waffel oder Becher?", "¿Cucurucho o tarrina?"),
    scoops: L("Glisse les boules de glace !", "Slide the scoops of ice cream!", "Zieh die Eiskugeln drauf!", "¡Desliza las bolas de helado!"),
    sauce: L("Un peu de nappage ?", "A bit of sauce?", "Ein bisschen Soße?", "¿Un poco de salsa?"),
    decos: L("Et la décoration !", "And the toppings!", "Und jetzt die Deko!", "¡Y los adornos!"),
  },
  fall: L("Attention, ça va tomber !", "Careful, it's going to fall!", "Vorsicht, gleich fällt es runter!", "¡Cuidado, que se cae!"),
  atLeast: L("Il faut au moins une boule !", "You need at least one scoop!", "Mindestens eine Kugel, bitte!", "¡Hace falta al menos una bola!"),
  perfect: L("Elle est parfaite ! Miam ! Merci !", "It's perfect! Yum! Thank you!", "Perfekt! Lecker! Danke!", "¡Está perfecto! ¡Ñam! ¡Gracias!"),
  thanksBut: L("Merci, c'était bon ! Mais…", "Thanks, it was nice! But…", "Danke, es war lecker! Aber…", "¡Gracias, estaba rico! Pero…"),
};
const HOLDER_NAME = { cornet: L("cornet", "cone", "Waffel", "cucurucho"), pot: L("pot", "cup", "Becher", "tarrina") };
const SAUCE_LABEL: Record<string, Tr> = { chocolat: L("chocolat", "chocolate", "Schoko", "chocolate"), caramel: L("caramel", "caramel", "Karamell", "caramelo"), fraise: L("fraise", "strawberry", "Erdbeere", "fresa") };
const NONE = L("sans", "none", "ohne", "sin");
const UI_MAX = 4;

export const glacierGame: GameDef = {
  id: "glacier",
  icon: "🍦",
  category: "maths",
  ages: [4, 8],
  title: L("Le glacier", "The ice-cream shop", "Die Eisdiele", "La heladería"),
  desc: L("Écouter la commande et préparer la bonne glace : cornet ou pot, parfums, nappage et décorations.", "Listen to the order and make the right ice cream: cone or cup, flavours, sauce and toppings.", "Die Bestellung anhören und das richtige Eis machen: Waffel oder Becher, Sorten, Soße und Deko.", "Escuchar el pedido y preparar el helado correcto: cucurucho o tarrina, sabores, salsa y adornos."),
  skills: { ecoute: L("Écouter une consigne", "Following instructions", "Anweisungen folgen", "Seguir instrucciones"), compter: L("Compter", "Counting", "Zählen", "Contar") },
  speech: (lang) => {
    const out: string[] = [SAY.please[lang], SAY.noSauce[lang], ...(["cornet", "pot"] as const).flatMap((k) => [SAY.hello[k][lang], SAY.holder[k][lang]]), ...Object.values(UI.step).map((x) => x[lang]), UI.fall[lang], UI.atLeast[lang], UI.perfect[lang], UI.thanksBut[lang]];
    for (const f of Object.keys(FLAVORS)) { out.push(FLAVORS[f].name[lang], SAY.extra(f, lang)); for (let n = 1; n <= MAX_SCOOPS; n++) out.push(scoops(f, n, lang), SAY.wanted(scoops(f, n, lang), lang)); }
    for (const s of Object.values(SAUCES)) out.push(s.name[lang], SAY.wanted(s.name[lang], lang));
    for (const d of Object.keys(DECOS)) out.push(DECOS[d][lang], SAY.missing(d, lang));
    return out;
  },
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute la commande du client, et prépare sa glace !", "Listen to the customer's order and make the ice cream!", "Hör dir die Bestellung an und mach das Eis!", "¡Escucha el pedido del cliente y prepara su helado!")[ctx.lang],
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg, lang = ctx.lang;
    const o = order(c);
    const client = pick(CLIENTS);
    const ice: Ice = { holder: null, scoops: [], sauce: null, decos: [] };
    let step = 0, served = false;
    const tell = () => { const ls = orderLines(o, lang); round.say(ls[0]); ls.slice(1).forEach((x) => round.say(x, lang, { interrupt: false })); };
    const face = h("div", { class: "gl-face" }, client);
    const bubble = h("button", { class: "pz-bubble", "aria-label": "🔊" });
    bubble.onclick = tell;
    const zone = h("div", { class: "gl-zone" });
    const stack = h("div", { class: "gl-stack" });
    const holderEl = h("div");
    stack.appendChild(holderEl); zone.appendChild(stack);
    const dots = h("div", { class: "gl-steps" }), choices = h("div", { class: "gl-choices" }), nav = h("div", { class: "gl-nav" });
    round.stage.appendChild(h("div", { class: "pz-shop gl-shop" }, h("div", { class: "pz-client" }, face, bubble), zone, h("div", { class: "gl-side" }, dots, choices, nav)));
    const sz = () => parseFloat(getComputedStyle(round.stage).getPropertyValue("--s")) || 80;
    const fit = () => { const r = zone.getBoundingClientRect(); round.stage.style.setProperty("--s", Math.max(44, Math.min(110, r.width / 2.2, r.height / 5.5)) + "px"); drawHolder(); };
    function drawHolder() {
      const s = sz();
      if (!ice.holder) { holderEl.innerHTML = `<svg width="${s * 1.5}" height="${s * 0.3}" viewBox="0 0 160 30"><ellipse cx="80" cy="15" rx="78" ry="12" fill="#fff" stroke="#e5e5e5" stroke-width="3"/></svg>`; return; }
      if (ice.holder === "cornet") {
        let lines = ""; for (let i = -6; i <= 12; i++) lines += `<line x1="${i * 14}" y1="0" x2="${i * 14 + 120}" y2="160" stroke="#c98b4a" stroke-width="3"/><line x1="${i * 14 + 120}" y1="0" x2="${i * 14}" y2="160" stroke="#c98b4a" stroke-width="3"/>`;
        holderEl.innerHTML = `<svg width="${s * 0.95}" height="${s * 1.55}" viewBox="0 0 100 160"><defs><clipPath id="gl-cone"><polygon points="2,4 98,4 50,158"/></clipPath></defs><polygon points="2,4 98,4 50,158" fill="#f2c27b" stroke="#c98b4a" stroke-width="4" stroke-linejoin="round"/><g clip-path="url(#gl-cone)">${lines}</g><rect x="-2" y="0" width="104" height="14" rx="7" fill="#e9a95b"/></svg>`;
      } else {
        holderEl.innerHTML = `<svg width="${s * 1.25}" height="${s * 0.85}" viewBox="0 0 125 85"><polygon points="4,4 121,4 105,82 20,82" fill="#fff" stroke="#ffafcc" stroke-width="4" stroke-linejoin="round"/><polygon points="30,4 45,4 40,82 30,82" fill="#ff8fab" opacity="0.6"/><polygon points="62,4 77,4 75,82 64,82" fill="#ff8fab" opacity="0.6"/><polygon points="94,4 109,4 98,82 88,82" fill="#ff8fab" opacity="0.6"/><rect x="0" y="0" width="125" height="12" rx="6" fill="#ff8fab"/></svg>`;
      }
    }
    const topScoop = () => (stack.children.length > 1 ? (stack.lastElementChild as HTMLElement) : null);
    function drawTop() {
      stack.querySelectorAll(".gl-sauce, .gl-deco, .gl-sprinkles").forEach((x) => x.remove());
      const top = topScoop();
      if (!top) return;
      if (ice.sauce) {
        let d = "M 4 38 Q 50 -8 96 38 ";
        for (const [x, y] of [[88, 62], [74, 50], [60, 70], [44, 48], [28, 66], [14, 52]]) d += `L ${x + 5} 44 Q ${x + 4} ${y + 6} ${x} ${y + 6} Q ${x - 4} ${y + 6} ${x - 4} 44 `;
        const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("viewBox", "0 0 100 80"); s.setAttribute("class", "gl-sauce");
        s.innerHTML = `<path d="${d}Z" fill="${SAUCES[ice.sauce].c}"/>`; top.appendChild(s);
      }
      if (ice.decos.includes("🌈")) {
        const sp = h("div", { class: "gl-sprinkles" }), cols = ["#ef476f", "#ffd166", "#06d6a0", "#118ab2", "#f15bb5", "#fff"];
        for (let i = 0; i < 14; i++) sp.appendChild(h("i", { style: { left: 10 + Math.random() * 75 + "%", top: 5 + Math.random() * 50 + "%", background: cols[i % 6], transform: `rotate(${Math.random() * 180}deg)` } }));
        top.appendChild(sp);
      }
      ice.decos.filter((e) => e !== "🌈").forEach((e, i, arr) => top.appendChild(h("div", { class: "gl-deco", style: { transform: `translateX(calc(-50% + ${(i - (arr.length - 1) / 2) * 34}%))` } }, e)));
    }
    function addScoop(f: string) {
      if (served || round.ended) return;
      if (ice.scoops.length >= UI_MAX) { round.say(UI.fall[lang]); return; }
      ice.scoops.push(f);
      const sc = h("button", { class: "gl-scoop", style: { background: FLAVORS[f].c }, "aria-label": FLAVORS[f].name[lang] });
      sc.dataset.f = f;
      if (FLAVORS[f].chips) for (let i = 0; i < 8; i++) sc.appendChild(h("i", { style: { left: 12 + Math.random() * 70 + "%", top: 12 + Math.random() * 60 + "%" } }));
      sc.onclick = () => { if (served || STEPS[step] !== "scoops" || sc !== stack.lastElementChild) return; ice.scoops.pop(); sc.remove(); sfx.pop(); afterChange(); };
      stack.appendChild(sc);
      round.timeout(() => sfx.slide(500, 200, 0.12, 0.3), 280);
      round.say(FLAVORS[f].name[lang]);
      afterChange();
    }
    function afterChange() { stack.classList.toggle("wobble", ice.scoops.length >= 3); drawTop(); updateBubble(); }
    function updateBubble() {
      const chip = (ok: boolean, ...kids: (string | Node)[]) => h("span", { class: "pz-chip" + (ok ? " ok" : "") }, ...kids);
      const ball = (col: string) => h("span", { class: "gl-ball", style: { background: col } });
      const want = countBy(o.scoops), have = countBy(ice.scoops);
      bubble.replaceChildren(
        chip(ice.holder === o.holder, HOLDER[o.holder]),
        ...Object.entries(want).map(([f, n]) => chip(have[f] === n, ...Array.from({ length: n }, (_, i) => { const b = ball(FLAVORS[f].c); if (i >= (have[f] ?? 0)) b.classList.add("off"); return b; }))),
        ...(o.sauce ? [chip(ice.sauce === o.sauce, ball(SAUCES[o.sauce].c), "💧")] : []),
        ...o.decos.map((d) => chip(ice.decos.includes(d), d)),
      );
    }
    const opt = (content: (string | Node)[], label: string, onClick: (b: HTMLElement) => void, sel = false) => {
      const b = h("button", { class: "gl-opt" + (sel ? " sel" : ""), "aria-label": label }, ...content);
      b.onclick = () => { if (!served && !round.ended) onClick(b); };
      choices.appendChild(b); return b;
    };
    let optEls: Record<string, HTMLElement> = {}, nextB: HTMLElement | null = null;
    const navBtn = (txt: string, cls: string, fn: () => void) => { const b = h("button", { class: "k-btn " + cls, "aria-label": txt }, txt); b.onclick = () => { if (!served && !round.ended) fn(); }; nav.appendChild(b); return b; };
    function showStep(n: number) {
      step = n;
      dots.replaceChildren(...STEPS.map((_, i) => h("i", { class: i <= n ? "on" : "" })));
      choices.innerHTML = ""; nav.innerHTML = ""; optEls = {}; nextB = null;
      const name = STEPS[n];
      if (n > 0) navBtn("⬅️", "", () => { sfx.click(); showStep(n - 1); });
      if (name === "holder") {
        for (const id of ["cornet", "pot"] as const) optEls[id] = opt([HOLDER[id], h("small", {}, HOLDER_NAME[id][lang])], HOLDER_NAME[id][lang], () => { ice.holder = id; drawHolder(); sfx.success(); updateBubble(); round.timeout(() => showStep(1), 400); }, ice.holder === id);
      } else if (name === "scoops") {
        for (const f of o.tubs) {
          const b = opt([h("span", { class: "gl-tub", style: { "--c": FLAVORS[f].c } }), h("small", {}, FLAVORS[f].name[lang])], FLAVORS[f].name[lang], () => {});
          b.onclick = null;
          drag(b, {
            ghost: () => h("div", { class: "gl-scoop", style: { background: FLAVORS[f].c, animation: "none" } }),
            enabled: () => !served && !round.ended,
            onMove: (pt) => zone.classList.toggle("k-zone-hot", inside(zone, pt)),
            onDrop: (pt) => { zone.classList.remove("k-zone-hot"); if (!inside(zone, pt)) return false; addScoop(f); return true; },
            onTap: () => addScoop(f),
          });
          optEls[f] = b;
        }
        nextB = navBtn("➡️", "primary", () => { if (!ice.scoops.length) { round.say(UI.atLeast[lang]); return; } sfx.click(); showStep(2); });
      } else if (name === "sauce") {
        optEls.none = opt(["🚫", h("small", {}, NONE[lang])], NONE[lang], (b) => pickSauce(null, b), !ice.sauce);
        for (const [id, s] of Object.entries(SAUCES)) optEls[id] = opt([h("span", { class: "gl-ball big", style: { background: s.c } }), h("small", {}, SAUCE_LABEL[id][lang])], SAUCE_LABEL[id][lang], (b) => pickSauce(id, b), ice.sauce === id);
        nextB = navBtn("➡️", "primary", () => { sfx.click(); showStep(3); });
      } else {
        for (const e of Object.keys(DECOS)) optEls[e] = opt([e], e, (b) => { const i = ice.decos.indexOf(e); if (i >= 0) { ice.decos.splice(i, 1); b.classList.remove("sel"); sfx.pop(); } else { ice.decos.push(e); b.classList.add("sel"); sfx.coin(); } drawTop(); updateBubble(); }, ice.decos.includes(e));
        nextB = navBtn("🍽️", "primary", serve);
      }
      if (round.index + n > 0) round.say(UI.step[name][lang]);
    }
    function pickSauce(id: string | null, b: HTMLElement) { ice.sauce = id; [...choices.children].forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sfx.noise(0.35, { from: 500, to: 300, q: 2, volume: 0.15 }); drawTop(); updateBubble(); }
    function serve() {
      if (served) return;
      served = true;
      const r = judge(o, ice, lang);
      face.classList.add("eat");
      let lick = 0;
      const lickOnce = () => {
        lick++; sfx.yum(); stack.style.transform = `scale(${1 - lick * 0.2})`;
        if (lick < 4) { round.timeout(lickOnce, 420); return; }
        stack.style.opacity = "0"; face.classList.remove("eat");
        if (r.perfect) { face.textContent = client + "😋"; round.win(face, UI.perfect[lang], { praise: false, delay: 3200 }); }
        else { face.textContent = client + "🙂"; round.oops(); round.say(UI.thanksBut[lang]); round.say(r.notes[0], lang, { interrupt: false }); round.win(face, "", { praise: false, delay: 4200 }); }
      };
      round.timeout(lickOnce, 420);
    }
    round.setHintTarget(() => {
      if (served) return null;
      const name = STEPS[step];
      if (name === "holder") return optEls[o.holder];
      if (name === "scoops") {
        const want = countBy(o.scoops), have = countBy(ice.scoops);
        if (ice.scoops.some((f) => (have[f] ?? 0) > (want[f] ?? 0))) return stack.lastElementChild;
        const miss = Object.keys(want).find((f) => (have[f] ?? 0) < want[f]);
        return miss ? { from: optEls[miss], to: zone } : nextB;
      }
      if (name === "sauce") return ice.sauce !== o.sauce ? optEls[o.sauce ?? "none"] : nextB;
      const missing = o.decos.find((d) => !ice.decos.includes(d)), extra = ice.decos.find((d) => !o.decos.includes(d));
      return missing ? optEls[missing] : extra ? optEls[extra] : nextB;
    });
    fit();
    const ro = new ResizeObserver(fit); ro.observe(zone); round.onCleanup(() => ro.disconnect());
    updateBubble();
    showStep(0);
    round.timeout(tell, round.index === 0 ? 3400 : 600);
  },
};
