// La boulangerie (3-14 ans) : comme en V2, on remplit des boîtes de 10 avec des gâteaux (compter jusqu'à 20),
// puis on paie en glissant pièces et billets, puis on rend la monnaie, puis les centimes.
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { randInt, pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { drag, inside } from "../../kit/drag";
import { numberWords } from "../../core/numwords";
import { sfx } from "../../audio/sfx";

const CLIENTS = ["🐻", "🐱", "🐰", "🦊", "🐼", "🐷", "🐵", "🐨", "🐸", "🦁"];
const ITEMS = ["🥐", "🥖", "🧁", "🍩", "🍪", "🥧", "🍰", "🧃"];
type Forms = Record<Lang, [string, string]>;
/** [un seul, avec l'article (à l'accusatif en allemand)] et [pluriel]. */
export const PASTRIES: { e: string; f: Forms }[] = [
  { e: "🥐", f: { fr: ["un croissant", "croissants"], en: ["one croissant", "croissants"], de: ["ein Croissant", "Croissants"], es: ["un cruasán", "cruasanes"] } },
  { e: "🥖", f: { fr: ["une baguette", "baguettes"], en: ["one baguette", "baguettes"], de: ["ein Baguette", "Baguettes"], es: ["una barra de pan", "barras de pan"] } },
  { e: "🧁", f: { fr: ["un petit gâteau", "petits gâteaux"], en: ["one cupcake", "cupcakes"], de: ["einen Muffin", "Muffins"], es: ["una magdalena", "magdalenas"] } },
  { e: "🍩", f: { fr: ["un beignet", "beignets"], en: ["one doughnut", "doughnuts"], de: ["einen Donut", "Donuts"], es: ["un dónut", "dónuts"] } },
  { e: "🍪", f: { fr: ["un biscuit", "biscuits"], en: ["one biscuit", "biscuits"], de: ["einen Keks", "Kekse"], es: ["una galleta", "galletas"] } },
  { e: "🥧", f: { fr: ["une tarte", "tartes"], en: ["one pie", "pies"], de: ["einen Kuchen", "Kuchen"], es: ["una tarta", "tartas"] } },
];
export const countOf = (n: number, p: (typeof PASTRIES)[number], lang: Lang) => (n === 1 ? p.f[lang][0] : `${numberWords(n, lang)} ${p.f[lang][1]}`);
export const B = {
  order: (n: number, p: (typeof PASTRIES)[number], lang: Lang) => { const x = countOf(n, p, lang); return ({ fr: `Bonjour ! Je voudrais ${x}, s'il te plaît.`, en: `Hello! I'd like ${x}, please.`, de: `Hallo! Ich hätte gern ${x}, bitte.`, es: `¡Hola! Quiero ${x}, por favor.` })[lang]; },
  thanks: (n: number, p: (typeof PASTRIES)[number], lang: Lang) => { const x = countOf(n, p, lang); return ({ fr: `Merci ! Il y a bien ${x}.`, en: `Thank you! That's ${x}.`, de: `Danke! Das sind genau ${x.replace(/^einen /, "ein ")}.`, es: `¡Gracias! Hay justo ${x}.` })[lang]; },
  put: (n: number, p: (typeof PASTRIES)[number], lang: Lang) => { const x = n === 0 ? ({ fr: "zéro", en: "none", de: "keine", es: "ninguno" })[lang] : countOf(n, p, lang); return ({ fr: `Tu as mis ${x}.`, en: `You put ${x}.`, de: `Du hast ${x} hingelegt.`, es: `Has puesto ${x}.` })[lang]; },
  missing: (k: number, lang: Lang) => ({ fr: `Il en manque ${k === 1 ? "un" : numberWords(k, lang)}.`, en: `${k === 1 ? "One" : numberWords(k, lang)} missing.`, de: `Es fehl${k === 1 ? "t einer" : "en " + numberWords(k, lang)}.`, es: `Falta${k === 1 ? " uno" : "n " + numberWords(k, lang)}.` })[lang],
  extra: (k: number, lang: Lang) => ({ fr: `Il y en a ${k === 1 ? "un" : numberWords(k, lang)} de trop.`, en: `${k === 1 ? "One" : numberWords(k, lang)} too many.`, de: `${k === 1 ? "Einer" : numberWords(k, lang)} zu viel.`, es: `Sobra${k === 1 ? " uno" : "n " + numberWords(k, lang)}.` })[lang],
  ten: L("Une boîte de 10 !", "A box of 10!", "Eine Zehnerschachtel!", "¡Una caja de 10!"),
  tenEmpty: L("Une boîte de 10, ça va dans une boîte vide !", "A box of 10 goes into an empty box!", "Eine Zehnerschachtel kommt in eine leere Schachtel!", "¡Una caja de 10 va en una caja vacía!"),
  full: L("Les boîtes sont pleines !", "The boxes are full!", "Die Schachteln sind voll!", "¡Las cajas están llenas!"),
  decompose: (n: number, lang: Lang) => (n === 10 ? L("10, c'est une boîte de 10 bien pleine.", "10 is one full box of 10.", "10 ist eine volle Zehnerschachtel.", "10 es una caja de 10 llena.")[lang]
    : n === 20 ? L("20, c'est deux boîtes de 10.", "20 is two boxes of 10.", "20 sind zwei Zehnerschachteln.", "20 son dos cajas de 10.")[lang]
    : ({ fr: `${n}, c'est une boîte de 10 et encore ${n - 10}.`, en: `${n} is one box of 10 and ${n - 10} more.`, de: `${n} ist eine Zehnerschachtel und noch ${n - 10}.`, es: `${n} es una caja de 10 y ${n - 10} más.` })[lang]),
  paid: L("Merci ! C'est le bon compte !", "Thank you! That's exactly right!", "Danke! Das stimmt genau!", "¡Gracias! ¡Es la cantidad justa!"),
  gave: (v: number, lang: Lang) => { const m = money(v * 100, lang); return ({ fr: `Tu as donné ${m}.`, en: `You gave ${m}.`, de: `Du hast ${m} gegeben.`, es: `Has dado ${m}.` })[lang]; },
};

/** « 3,50 € » (virgule en FR / DE / ES, point en anglais) — montants en centimes. */
export function money(cents: number, lang: Lang): string {
  const e = Math.floor(cents / 100), c = cents % 100;
  const s = c ? `${e}${lang === "en" ? "." : ","}${String(c).padStart(2, "0")}` : String(e);
  return lang === "en" ? `€${s}` : `${s} €`;
}

export function priceLine(cents: number, lang: Lang): string {
  const m = money(cents, lang);
  return { fr: `Ça fait ${m}, s'il te plaît.`, en: `That's ${m}, please.`, de: `Das macht ${m}, bitte.`, es: `Son ${m}, por favor.` }[lang];
}
export function changeLine(price: number, given: number, lang: Lang): string {
  const p = money(price, lang), g = money(given, lang);
  return { fr: `Ça coûte ${p}. Tu donnes ${g}. Combien je te rends ?`, en: `It costs ${p}. You pay ${g}. How much change do you get?`, de: `Es kostet ${p}. Du gibst ${g}. Wie viel bekommst du zurück?`, es: `Cuesta ${p}. Das ${g}. ¿Cuánto te devuelven?` }[lang];
}

/** « Il manque 3 € » / « C'est 2 € de trop ». */
export function missLine(diff: number, tooLittle: boolean, lang: Lang): string {
  const m = money(diff, lang);
  return tooLittle ? { fr: `Il manque ${m}.`, en: `${m} missing.`, de: `Es fehlen ${m}.`, es: `Faltan ${m}.` }[lang] : { fr: `C'est ${m} de trop.`, en: `That's ${m} too much.`, de: `Das sind ${m} zu viel.`, es: `Sobran ${m}.` }[lang];
}

/** La pièce la plus utile à donner : la plus grosse qui ne dépasse pas ce qui reste. */
export const bestCoin = (remaining: number, coins: number[]) => coins.filter((c) => c <= remaining).sort((a, b) => b - a)[0] ?? null;

/** Choix de monnaie à rendre : la bonne + des erreurs courantes, tous différents et positifs. */
export function changeChoices(answer: number, step: number, n: number, rng: Rng = Math.random): number[] {
  const set = new Set([answer]);
  for (const d of shuffle([step, -step, 2 * step, -2 * step, 100, -100, 50, -50], rng)) { if (set.size >= n) break; if (answer + d > 0) set.add(answer + d); }
  return shuffle([...set], rng);
}

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [params.mode === "count" ? "compter" : params.mode === "pay" ? "payer" : params.cents ? "centimes" : "rendre"] });

export const TRACK: Track = {
  chapters: [
    { id: "b1", tier: "facile", ages: [3, 4], title: L("Compter jusqu'à 10", "Counting to 10", "Zählen bis 10", "Contar hasta 10"), levels: [lv("0-1", 5, { mode: "count", min: 1, max: 5 }), lv("0-2", 5, { mode: "count", min: 1, max: 10 }), lv("0-b", 5, { mode: "count", min: 3, max: 10 }, true)] },
    { id: "b2", tier: "facile", ages: [5, 5], title: L("Les boîtes de 10", "Boxes of 10", "Zehnerschachteln", "Cajas de 10"), levels: [lv("0-3", 5, { mode: "count", min: 11, max: 20, tens: true }), lv("0-c", 5, { mode: "count", min: 10, max: 20, tens: true }, true)] },
    { id: "p1", tier: "facile", ages: [5, 6], title: L("Payer avec des pièces de 1 €", "Paying with €1 coins", "Mit 1-Euro-Münzen zahlen", "Pagar con monedas de 1 €"), levels: [lv("1-1", 4, { mode: "pay", min: 2, max: 4, coins: [1] }), lv("1-2", 4, { mode: "pay", min: 3, max: 6, coins: [1] }), lv("1-b", 5, { mode: "pay", min: 2, max: 6, coins: [1] }, true)] },
    { id: "p2", tier: "moyen", ages: [7, 7], title: L("Pièces de 1 € et 2 €", "€1 and €2 coins", "1- und 2-Euro-Münzen", "Monedas de 1 € y 2 €"), levels: [lv("2-1", 5, { mode: "pay", min: 3, max: 8, coins: [1, 2] }), lv("2-2", 5, { mode: "pay", min: 5, max: 10, coins: [1, 2] }), lv("2-b", 6, { mode: "pay", min: 3, max: 10, coins: [1, 2] }, true)] },
    { id: "p3", tier: "moyen", ages: [8, 8], title: L("Les billets", "Banknotes", "Geldscheine", "Los billetes"), levels: [lv("3-1", 5, { mode: "pay", min: 6, max: 15, coins: [1, 2, 5] }), lv("3-2", 5, { mode: "pay", min: 10, max: 30, coins: [1, 2, 5, 10] }), lv("3-b", 6, { mode: "pay", min: 8, max: 40, coins: [1, 2, 5, 10, 20] }, true)] },
    { id: "p4", tier: "difficile", ages: [9, 10], title: L("Rendre la monnaie", "Giving change", "Wechselgeld", "Dar el cambio"), levels: [lv("4-1", 6, { mode: "change", given: [10], step: 100 }), lv("4-2", 6, { mode: "change", given: [10, 20], step: 100 }), lv("4-b", 8, { mode: "change", given: [10, 20, 50], step: 100 }, true)] },
    { id: "p5", tier: "expert", ages: [11, 14], title: L("Les centimes", "Cents", "Cent", "Los céntimos"), levels: [lv("5-1", 6, { mode: "change", given: [5, 10], step: 50, cents: true }), lv("5-2", 6, { mode: "change", given: [10, 20], step: 10, cents: true }), lv("5-b", 8, { mode: "change", given: [5, 10, 20, 50], step: 10, cents: true }, true)] },
  ],
};

const coinLabel = (v: number, lang: Lang) => (v >= 5 ? `${v} €` : money(v * 100, lang));

export const monnaieGame: GameDef = {
  id: "monnaie",
  icon: "🪙",
  category: "maths",
  ages: [3, 14],
  title: L("La boulangerie", "The bakery", "Die Bäckerei", "La panadería"),
  desc: L("Payer le bon prix avec des pièces et des billets, rendre la monnaie, puis calculer avec les centimes.", "Pay the right price with coins and notes, give change, then work with cents.", "Mit Münzen und Scheinen den richtigen Preis zahlen, Wechselgeld geben, dann mit Cent rechnen.", "Pagar el precio justo con monedas y billetes, dar el cambio y luego calcular con céntimos."),
  skills: { compter: L("Compter jusqu'à 20", "Counting to 20", "Zählen bis 20", "Contar hasta 20"), payer: L("Payer le bon prix", "Paying the right amount", "Den richtigen Betrag zahlen", "Pagar el precio justo"), rendre: L("Rendre la monnaie", "Giving change", "Wechselgeld geben", "Dar el cambio"), centimes: L("Calculer avec les centimes", "Working with cents", "Mit Cent rechnen", "Calcular con céntimos") },
  speech: (lang) => [
    ...Array.from({ length: 40 }, (_, i) => i + 1).flatMap((n) => [priceLine(n * 100, lang), missLine(n * 100, true, lang), missLine(n * 100, false, lang), B.gave(n, lang)]),
    ...PASTRIES.flatMap((p) => Array.from({ length: 21 }, (_, n) => [B.put(n, p, lang), ...(n ? [B.order(n, p, lang), B.thanks(n, p, lang)] : [])]).flat()),
    ...Array.from({ length: 20 }, (_, i) => [B.missing(i + 1, lang), B.extra(i + 1, lang), ...(i + 1 >= 10 ? [B.decompose(i + 1, lang)] : [])]).flat(),
    B.ten[lang], B.tenEmpty[lang], B.full[lang], B.paid[lang], ...[1, 2, 5, 10, 20].map((v) => money(v * 100, lang)),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.mode === "count"
    ? L("Écoute le client, et mets le bon nombre dans les boîtes, puis appuie sur Donner !", "Listen to the customer, put the right number in the boxes, then press Give!", "Hör dem Kunden zu, leg die richtige Anzahl in die Schachteln und drück dann auf Geben!", "¡Escucha al cliente, pon el número justo en las cajas y pulsa Dar!")
    : level.params.mode === "pay"
    ? L("Le client doit payer. Glisse les pièces dans le plateau, puis appuie sur Payer !", "Time to pay. Slide the coins onto the tray, then press Pay!", "Jetzt wird bezahlt. Zieh die Münzen auf das Tablett und drück dann auf Bezahlen!", "Hay que pagar. ¡Desliza las monedas a la bandeja y pulsa Pagar!")
    : L("Calcule la monnaie à rendre.", "Work out the change.", "Rechne das Wechselgeld aus.", "Calcula el cambio."))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { mode: string; min?: number; max?: number; tens?: boolean; coins?: number[]; given?: number[]; step: number; cents?: boolean };
    const client = pick(CLIENTS), item = pick(ITEMS);
    const wrap = h("div", { class: "ca-wrap" });
    round.stage.appendChild(wrap);
    if (p.mode === "count") {
      const n = randInt(p.min!, p.max!), pastry = pick(PASTRIES), max = p.tens ? 20 : 10, lang = ctx.lang;
      const order = B.order(n, pastry, lang);
      const face = h("div", { class: "bo-face" }, client);
      const ticket = h("button", { class: "bo-order", "aria-label": "🔊" }, h("b", {}, `${n} ${pastry.e}`));
      ticket.onclick = () => round.say(order);
      const boxes = h("div", { class: "bo-boxes" }), count = h("div", { class: "bo-count" }), tools = h("div", { class: "bo-tools" });
      wrap.append(h("div", { class: "bo-client" }, face, ticket), boxes, count, tools);
      let have = 0;
      function render() {
        boxes.innerHTML = "";
        for (let b = 0; b < (p.tens || have > 10 ? 2 : 1); b++) {
          const box = h("div", { class: "bo-box" });
          for (let i = 0; i < 10; i++) {
            const k = b * 10 + i, full = k < have;
            const c = h("button", { class: "bo-cell" + (full ? " full" : "") }, full ? pastry.e : "");
            if (full) c.onclick = () => { if (round.ended) return; have--; sfx.pop(); render(); };
            box.appendChild(c);
          }
          boxes.appendChild(box);
        }
        count.textContent = have ? String(have) : "";
      }
      function add(k: number) {
        if (round.ended) return;
        if (k === 10 && have % 10 !== 0) { round.say(B.tenEmpty[lang]); return; }
        if (have + k > max) { round.say(B.full[lang]); return; }
        have += k;
        sfx.step(Math.min(11, (have - 1) % 12));
        if (k === 10) { round.say(B.ten[lang]); round.say(numberWords(have, lang), lang, { interrupt: false }); } else round.say(numberWords(have, lang));
        render();
      }
      const hot = (pt: { x: number; y: number }) => boxes.classList.toggle("k-zone-hot", inside(boxes, pt, 20));
      const dropTo = (k: number) => (pt: { x: number; y: number }) => { boxes.classList.remove("k-zone-hot"); if (!inside(boxes, pt, 20)) return false; add(k); return true; };
      const one = h("button", { class: "bo-src", "aria-label": pastry.e }, pastry.e);
      drag(one, { enabled: () => !round.ended, onMove: hot, onDrop: dropTo(1), onTap: () => add(1) });
      tools.appendChild(one);
      let ten: HTMLElement | null = null;
      if (p.tens) { ten = h("button", { class: "bo-src ten", "aria-label": "10" }, "📦 10"); drag(ten, { ghost: "📦", enabled: () => !round.ended, onMove: hot, onDrop: dropTo(10), onTap: () => add(10) }); tools.appendChild(ten); }
      const give = h("button", { class: "k-btn primary", "aria-label": "🛍️" }, "🛍️");
      give.onclick = () => {
        if (round.ended) return;
        if (have === n) { round.win(give, B.thanks(n, pastry, lang), { praise: false, delay: 3400 }); if (n >= 10) round.say(B.decompose(n, lang), lang, { interrupt: false }); return; }
        round.miss(give, B.put(have, pastry, lang));
        round.say(have < n ? B.missing(n - have, lang) : B.extra(have - n, lang), lang, { interrupt: false });
      };
      tools.appendChild(give);
      render();
      round.setHintTarget(() => (have < n ? (ten && n - have >= 10 && have % 10 === 0 ? { from: ten, to: boxes } : { from: one, to: boxes }) : have > n ? boxes.querySelectorAll(".bo-cell.full")[have - 1] : give));
      round.timeout(() => round.say(order), round.index === 0 ? 3400 : 500);
      return;
    }
    if (p.mode === "pay") {
      const price = randInt(p.min!, p.max!), lang = ctx.lang;
      const line = priceLine(price * 100, lang);
      const paid: number[] = [];
      const face = h("div", { class: "bo-face" }, client);
      const ticket = h("button", { class: "bo-order", "aria-label": "🔊" }, h("span", { class: "mo-item" }, item), h("b", {}, money(price * 100, lang)));
      ticket.onclick = () => round.say(line);
      const tray = h("div", { class: "bo-tray" }), total = h("div", { class: "bo-count" }), tools = h("div", { class: "bo-tools" });
      wrap.append(h("div", { class: "bo-client" }, face, ticket), tray, total, tools);
      const sum = () => paid.reduce((a, b) => a + b, 0);
      const coin = (v: number) => h("button", { class: `bo-coin c${v}`, "aria-label": money(v * 100, lang) }, coinLabel(v, lang));
      const draw = () => {
        tray.replaceChildren(...paid.map((v, i) => { const c = coin(v); c.onclick = () => { if (round.ended) return; paid.splice(i, 1); sfx.pop(); draw(); }; return c; }));
        total.textContent = sum() ? money(sum() * 100, lang) : "";
      };
      const give = (v: number) => { if (round.ended || sum() + v > 40) return; paid.push(v); sfx.coin(); round.say(money(v * 100, lang)); draw(); };
      const wallet: Record<number, HTMLElement> = {};
      for (const v of p.coins!) {
        const c = coin(v);
        drag(c, { enabled: () => !round.ended, onMove: (pt) => tray.classList.toggle("k-zone-hot", inside(tray, pt, 20)), onDrop: (pt) => { tray.classList.remove("k-zone-hot"); if (!inside(tray, pt, 20)) return false; give(v); return true; }, onTap: () => give(v) });
        tools.appendChild(c); wallet[v] = c;
      }
      const payB = h("button", { class: "k-btn primary", "aria-label": "💶" }, "💶");
      payB.onclick = () => {
        if (round.ended) return;
        const s2 = sum();
        if (s2 === price) { round.win(payB, B.paid[lang], { praise: false, delay: 2800 }); return; }
        round.miss(payB, B.gave(s2, lang));
        round.say(missLine(Math.abs(s2 - price) * 100, s2 < price, lang), lang, { interrupt: false });
      };
      tools.appendChild(payB);
      draw();
      round.setHintTarget(() => { const s2 = sum(); if (s2 === price) return payB; if (s2 > price) return tray.lastElementChild; return { from: wallet[bestCoin(price - s2, p.coins!)!], to: tray }; });
      round.timeout(() => round.say(line), round.index === 0 ? 3400 : 500);
      return;
    }
    // rendre la monnaie
    const given = pick(p.given!) * 100;
    const price = p.cents ? randInt(1, given / p.step - 1) * p.step : randInt(1, given / 100 - 1) * 100;
    const answer = given - price;
    const line = changeLine(price, given, ctx.lang);
    const grid = h("div", { class: "ca-choices" });
    let good: HTMLElement | null = null;
    for (const v of changeChoices(answer, p.step, round.assist ? 2 : 4)) {
      const b = h("button", { class: "ca-choice" }, money(v, ctx.lang));
      if (v === answer) good = b;
      b.onclick = () => (v === answer ? round.win(b) : round.miss(b));
      grid.appendChild(b);
    }
    const ear = h("button", { class: "lg-ear", "aria-label": line }, "🔊");
    ear.onclick = () => round.say(line);
    wrap.append(h("div", { class: "mo-client" }, h("span", { class: "mo-face" }, client), h("span", { class: "mo-item" }, item), h("span", { class: "mo-price" }, money(price, ctx.lang)), h("span", { class: "mo-given" }, "💶 " + money(given, ctx.lang)), ear), grid);
    round.setHintTarget(() => good);
  },
};
