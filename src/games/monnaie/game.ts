// La Monnaie (5-14 ans) : payer avec des pièces, puis des billets, puis rendre la monnaie, puis les centimes.
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { randInt, pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

const CLIENTS = ["🐻", "🐱", "🐰", "🦊", "🐼", "🐷", "🐵", "🐨", "🐸", "🦁"];
const ITEMS = ["🥐", "🥖", "🧁", "🍩", "🍪", "🥧", "🍰", "🧃"];

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

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [params.mode === "pay" ? "payer" : params.cents ? "centimes" : "rendre"] });

export const TRACK: Track = {
  chapters: [
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
  ages: [5, 14],
  title: L("La boutique", "The shop", "Der Laden", "La tienda"),
  desc: L("Payer le bon prix avec des pièces et des billets, rendre la monnaie, puis calculer avec les centimes.", "Pay the right price with coins and notes, give change, then work with cents.", "Mit Münzen und Scheinen den richtigen Preis zahlen, Wechselgeld geben, dann mit Cent rechnen.", "Pagar el precio justo con monedas y billetes, dar el cambio y luego calcular con céntimos."),
  skills: { payer: L("Payer le bon prix", "Paying the right amount", "Den richtigen Betrag zahlen", "Pagar el precio justo"), rendre: L("Rendre la monnaie", "Giving change", "Wechselgeld geben", "Dar el cambio"), centimes: L("Calculer avec les centimes", "Working with cents", "Mit Cent rechnen", "Calcular con céntimos") },
  speech: (lang) => Array.from({ length: 40 }, (_, i) => i + 1).flatMap((n) => [priceLine(n * 100, lang), missLine(n * 100, true, lang), missLine(n * 100, false, lang)]),
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.mode === "pay"
    ? L("Écoute le prix, et donne les bonnes pièces.", "Listen to the price and give the right coins.", "Hör dir den Preis an und gib die richtigen Münzen.", "Escucha el precio y da las monedas correctas.")
    : L("Calcule la monnaie à rendre.", "Work out the change.", "Rechne das Wechselgeld aus.", "Calcula el cambio."))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { mode: string; min?: number; max?: number; coins?: number[]; given?: number[]; step: number; cents?: boolean };
    const client = pick(CLIENTS), item = pick(ITEMS);
    const wrap = h("div", { class: "ca-wrap" });
    round.stage.appendChild(wrap);
    if (p.mode === "pay") {
      const price = randInt(p.min!, p.max!);
      const line = priceLine(price * 100, ctx.lang);
      const paid: number[] = [];
      const tray = h("div", { class: "mo-tray" });
      const total = h("div", { class: "mo-total" });
      const coins = h("div", { class: "row" });
      const draw = () => {
        tray.innerHTML = "";
        paid.forEach((v, i) => { const b = h("button", { class: `mo-coin v${v}` }, coinLabel(v, ctx.lang)); b.onclick = () => { sfx.pop(); paid.splice(i, 1); draw(); }; tray.appendChild(b); });
        total.textContent = ctx.band === "3-5" || ctx.band === "6-8" ? money(paid.reduce((a, b) => a + b, 0) * 100, ctx.lang) : "";
      };
      const coinBtn: Record<number, HTMLButtonElement> = {};
      for (const v of p.coins!) {
        const b = h("button", { class: `mo-coin big v${v}` }, coinLabel(v, ctx.lang)) as HTMLButtonElement;
        b.onclick = () => { sfx.tap(); paid.push(v); draw(); };
        coins.appendChild(b); coinBtn[v] = b;
      }
      const ok = h("button", { class: "act-btn go", "aria-label": "OK" }, "✅") as HTMLButtonElement;
      ok.onclick = () => {
        const s = paid.reduce((a, b) => a + b, 0);
        if (s === price) { sfx.coin(); round.win(tray, "", { delay: 1300 }); return; }
        const diff = Math.abs(s - price) * 100;
        round.miss(tray, missLine(diff, s < price, ctx.lang));
      };
      const ear = h("button", { class: "lg-ear", "aria-label": line }, "🔊");
      ear.onclick = () => round.say(line);
      wrap.append(h("div", { class: "mo-client" }, h("span", { class: "mo-face" }, client), h("span", { class: "mo-item" }, item), h("span", { class: "mo-price" }, money(price * 100, ctx.lang)), ear), tray, total, coins, ok);
      draw();
      round.setHintTarget(() => {
        const s = paid.reduce((a, b) => a + b, 0);
        if (s > price) return tray.lastElementChild;
        if (s === price) return ok;
        return coinBtn[bestCoin(price - s, p.coins!)!];
      });
      round.instruct(line);
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
