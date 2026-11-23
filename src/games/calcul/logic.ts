// Calcul : générateur de questions par niveau (testé). De « 2 + 1 avec des pommes » aux pourcentages.
import { L, type Lang, type Track, type LevelDef } from "../../core/types";
import { randInt, shuffle, pick, type Rng } from "../../core/util";

export type Op = "+" | "-" | "×" | "÷";
export interface Question {
  /** Ce qui est affiché : "7 + 5", "3 + 4 × 2", "10 % de 50". */
  text: string;
  answer: number;
  /** Pour la voix (seulement les petits calculs). */
  speak?: { a: number; op: Op; b: number };
  /** Objets à compter (premiers niveaux). */
  objects?: { a: number; b: number; e: string };
}

/** Les sortes de questions (params.gen d'un niveau). */
export type Gen =
  | { gen: "add"; max: number; objects?: boolean }
  | { gen: "addsub"; max: number }
  | { gen: "complement"; to: number }
  | { gen: "double"; max: number }
  | { gen: "tens"; max: number }
  | { gen: "table"; tables: number[] }
  | { gen: "div"; tables: number[] }
  | { gen: "priority" }
  | { gen: "relative"; max: number }
  | { gen: "fraction" }
  | { gen: "percent" };

const FRUITS = ["🍎", "🍓", "🍐", "🍊", "🍌", "🥕"];

export function question(g: Gen, rng: Rng = Math.random): Question {
  switch (g.gen) {
    case "add": {
      const a = randInt(1, g.max - 1, rng), b = randInt(1, g.max - a, rng);
      return { text: `${a} + ${b}`, answer: a + b, speak: { a, op: "+", b }, objects: g.objects ? { a, b, e: pick(FRUITS, rng) } : undefined };
    }
    case "addsub": {
      if (rng() < 0.5) { const a = randInt(0, g.max, rng), b = randInt(0, g.max - a, rng); return { text: `${a} + ${b}`, answer: a + b, speak: { a, op: "+", b } }; }
      const a = randInt(1, g.max, rng), b = randInt(0, a, rng);
      return { text: `${a} − ${b}`, answer: a - b, speak: { a, op: "-", b } };
    }
    case "complement": { const a = randInt(1, g.to - 1, rng); return { text: `${a} + ? = ${g.to}`, answer: g.to - a }; }
    case "double": { const a = randInt(1, g.max, rng); return { text: `${a} + ${a}`, answer: 2 * a, speak: { a, op: "+", b: a } }; }
    case "tens": {
      if (rng() < 0.5) { const a = randInt(10, g.max - 10, rng), b = randInt(1, g.max - a, rng); return { text: `${a} + ${b}`, answer: a + b }; }
      const a = randInt(20, g.max, rng), b = randInt(1, a - 1, rng);
      return { text: `${a} − ${b}`, answer: a - b };
    }
    case "table": { const a = pick(g.tables, rng), b = randInt(1, 10, rng); return rng() < 0.5 ? { text: `${a} × ${b}`, answer: a * b, speak: { a, op: "×", b } } : { text: `${b} × ${a}`, answer: a * b, speak: { a: b, op: "×", b: a } }; }
    case "div": { const a = pick(g.tables, rng), b = randInt(1, 10, rng); return { text: `${a * b} ÷ ${a}`, answer: b, speak: { a: a * b, op: "÷", b: a } }; }
    case "priority": {
      const a = randInt(1, 9, rng), b = randInt(2, 9, rng), c = randInt(2, 9, rng);
      return rng() < 0.5 ? { text: `${a} + ${b} × ${c}`, answer: a + b * c } : { text: `${b} × ${c} − ${a}`, answer: b * c - a };
    }
    case "relative": {
      const a = randInt(-g.max, g.max, rng), b = randInt(-g.max, g.max, rng);
      const show = (n: number) => (n < 0 ? `(${n})` : String(n));
      return rng() < 0.5 ? { text: `${a} + ${show(b)}`, answer: a + b } : { text: `${a} − ${show(b)}`, answer: a - b };
    }
    case "fraction": {
      const d = pick([2, 3, 4, 5, 10], rng), k = randInt(1, 10, rng), num = randInt(1, d - 1, rng);
      return { text: `${num}/${d} × ${d * k}`, answer: num * k };
    }
    case "percent": {
      const p = pick([10, 20, 25, 50, 75], rng);
      const base = p === 25 || p === 75 ? 4 * randInt(2, 25, rng) : 10 * randInt(1, 20, rng);
      return { text: `${p} % × ${base}`, answer: (p * base) / 100 };
    }
  }
}

/** Les choix (si le niveau n'utilise pas le pavé numérique) : la bonne réponse + des voisines plausibles. */
export function choices(answer: number, n: number, rng: Rng = Math.random): number[] {
  const set = new Set([answer]);
  const near = shuffle([1, -1, 2, -2, 10, -10, 3, -3], rng);
  for (const d of near) { if (set.size >= n) break; const v = answer + d; if (v >= 0 || answer < 0) set.add(v); }
  let k = 4;
  while (set.size < n) { set.add(answer + k); k++; }
  return shuffle([...set], rng);
}

const OP_WORDS: Record<Lang, Record<Op, string>> = {
  fr: { "+": "plus", "-": "moins", "×": "fois", "÷": "divisé par" },
  en: { "+": "plus", "-": "minus", "×": "times", "÷": "divided by" },
  de: { "+": "plus", "-": "minus", "×": "mal", "÷": "geteilt durch" },
  es: { "+": "más", "-": "menos", "×": "por", "÷": "entre" },
};
/** « Combien font 3 plus 4 ? » dans les 4 langues. */
/** « 3 plus 2 égale 5 ! » (dit quand on a trouvé). */
export function spokenResult(q: Question, lang: Lang): string | null {
  if (!q.speak) return null;
  const { a, op, b } = q.speak, w = OP_WORDS[lang][op], r = q.answer;
  return { fr: `${a} ${w} ${b} égale ${r} !`, en: `${a} ${w} ${b} equals ${r}!`, de: `${a} ${w} ${b} ist ${r}!`, es: `¡${a} ${w} ${b} es ${r}!` }[lang];
}
export function spoken(q: Question, lang: Lang): string | null {
  if (!q.speak) return null;
  const { a, op, b } = q.speak, w = OP_WORDS[lang][op];
  return { fr: `Combien font ${a} ${w} ${b} ?`, en: `What is ${a} ${w} ${b}?`, de: `Wie viel ist ${a} ${w} ${b}?`, es: `¿Cuánto es ${a} ${w} ${b}?` }[lang];
}

const lv = (id: string, rounds: number, gen: Gen, opts: Partial<LevelDef> & { keypad?: boolean; n?: number } = {}): LevelDef => ({
  id, rounds, boss: opts.boss, skills: opts.skills, params: { ...gen, keypad: opts.keypad ?? false, n: opts.n ?? 3 },
});

export const TRACK: Track = {
  chapters: [
    { id: "c1", tier: "facile", ages: [5, 5], title: L("Additions avec des objets", "Adding with objects", "Plus rechnen mit Dingen", "Sumas con objetos"), levels: [
      lv("1-1", 5, { gen: "add", max: 3, objects: true }, { skills: ["add5"] }),
      lv("1-2", 6, { gen: "add", max: 5, objects: true }, { skills: ["add5"] }),
      lv("1-3", 6, { gen: "add", max: 5 }, { skills: ["add5"] }),
      lv("1-b", 8, { gen: "add", max: 5 }, { boss: true, skills: ["add5"] }),
    ] },
    { id: "c2", tier: "facile", ages: [6, 6], title: L("Jusqu'à 10", "Up to 10", "Bis 10", "Hasta 10"), levels: [
      lv("2-1", 6, { gen: "add", max: 10 }, { skills: ["add10"] }),
      lv("2-2", 6, { gen: "addsub", max: 10 }, { skills: ["add10", "sub10"] }),
      lv("2-3", 8, { gen: "complement", to: 10 }, { skills: ["comp10"] }),
      lv("2-b", 8, { gen: "addsub", max: 10 }, { boss: true, n: 4, skills: ["add10", "sub10"] }),
    ] },
    { id: "c3", tier: "moyen", ages: [7, 7], title: L("Jusqu'à 20", "Up to 20", "Bis 20", "Hasta 20"), levels: [
      lv("3-1", 8, { gen: "double", max: 10 }, { n: 4, skills: ["double"] }),
      lv("3-2", 8, { gen: "addsub", max: 20 }, { n: 4, skills: ["add20"] }),
      lv("3-3", 8, { gen: "complement", to: 20 }, { n: 4, skills: ["add20"] }),
      lv("3-b", 8, { gen: "addsub", max: 20 }, { boss: true, keypad: true, skills: ["add20"] }),
    ] },
    { id: "c4", tier: "moyen", ages: [8, 8], title: L("Jusqu'à 100", "Up to 100", "Bis 100", "Hasta 100"), levels: [
      lv("4-1", 8, { gen: "tens", max: 50 }, { keypad: true, skills: ["add100"] }),
      lv("4-2", 8, { gen: "tens", max: 100 }, { keypad: true, skills: ["add100"] }),
      lv("4-b", 10, { gen: "tens", max: 100 }, { boss: true, keypad: true, skills: ["add100"] }),
    ] },
    { id: "c5", tier: "difficile", ages: [9, 9], title: L("Les tables de multiplication", "Times tables", "Das Einmaleins", "Las tablas de multiplicar"), levels: [
      lv("5-1", 8, { gen: "table", tables: [2, 5, 10] }, { keypad: true, skills: ["tables"] }),
      lv("5-2", 8, { gen: "table", tables: [3, 4] }, { keypad: true, skills: ["tables"] }),
      lv("5-3", 8, { gen: "table", tables: [6, 7] }, { keypad: true, skills: ["tables"] }),
      lv("5-4", 8, { gen: "table", tables: [8, 9] }, { keypad: true, skills: ["tables"] }),
      lv("5-b", 10, { gen: "table", tables: [2, 3, 4, 5, 6, 7, 8, 9] }, { boss: true, keypad: true, skills: ["tables"] }),
    ] },
    { id: "c6", tier: "difficile", ages: [10, 11], title: L("Divisions", "Division", "Teilen", "Divisiones"), levels: [
      lv("6-1", 8, { gen: "div", tables: [2, 5, 10] }, { keypad: true, skills: ["div"] }),
      lv("6-2", 8, { gen: "div", tables: [3, 4, 6] }, { keypad: true, skills: ["div"] }),
      lv("6-3", 8, { gen: "div", tables: [7, 8, 9] }, { keypad: true, skills: ["div"] }),
      lv("6-b", 10, { gen: "div", tables: [2, 3, 4, 5, 6, 7, 8, 9] }, { boss: true, keypad: true, skills: ["div"] }),
    ] },
    { id: "c7", tier: "expert", ages: [12, 12], title: L("Priorités et nombres relatifs", "Order of operations and negative numbers", "Punkt vor Strich und negative Zahlen", "Prioridad de operaciones y números negativos"), levels: [
      lv("7-1", 8, { gen: "priority" }, { keypad: true, skills: ["priorite"] }),
      lv("7-2", 8, { gen: "relative", max: 10 }, { keypad: true, skills: ["relatifs"] }),
      lv("7-b", 10, { gen: "relative", max: 20 }, { boss: true, keypad: true, skills: ["relatifs", "priorite"] }),
    ] },
    { id: "c8", tier: "expert", ages: [13, 14], title: L("Fractions et pourcentages", "Fractions and percentages", "Brüche und Prozente", "Fracciones y porcentajes"), levels: [
      lv("8-1", 8, { gen: "fraction" }, { keypad: true, skills: ["fractions"] }),
      lv("8-2", 8, { gen: "percent" }, { keypad: true, skills: ["pourcentages"] }),
      lv("8-b", 10, { gen: "percent" }, { boss: true, keypad: true, skills: ["fractions", "pourcentages"] }),
    ] },
  ],
};
