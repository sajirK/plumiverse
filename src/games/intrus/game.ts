// Trouve l'intrus (3-14 ans) : catégories évidentes, puis plus fines, puis des intrus parmi les nombres.
import { L, type LevelDef, type Track, type Tr } from "../../core/types";
import { shuffle, pick, randInt, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";

interface Group { name: Tr; items: string[] }
/** Groupes « faciles » (bien distincts) et « fins » (même grande famille, différence plus subtile). */
export const EASY: Group[] = [
  { name: L("des animaux", "animals", "Tiere", "animales"), items: ["🐶", "🐱", "🐰", "🦊", "🐼", "🐸", "🐵", "🐷"] },
  { name: L("des fruits", "fruit", "Obst", "frutas"), items: ["🍎", "🍌", "🍓", "🍇", "🍊", "🍐", "🍒", "🍉"] },
  { name: L("des véhicules", "vehicles", "Fahrzeuge", "vehículos"), items: ["🚗", "🚌", "🚲", "✈️", "🚂", "⛵", "🚀", "🚜"] },
  { name: L("des vêtements", "clothes", "Kleidungsstücke", "ropa"), items: ["👕", "👖", "👗", "🧦", "🧢", "🧣", "🧥", "👟"] },
  { name: L("des instruments de musique", "musical instruments", "Musikinstrumente", "instrumentos musicales"), items: ["🎸", "🥁", "🎹", "🎺", "🎻", "🪗", "🪘", "🎷"] },
];
export const SUBTLE: Group[] = [
  { name: L("des animaux de la ferme", "farm animals", "Bauernhoftiere", "animales de granja"), items: ["🐮", "🐷", "🐑", "🐴", "🐐", "🐇"] },
  { name: L("des animaux de la mer", "sea animals", "Meerestiere", "animales del mar"), items: ["🐟", "🐙", "🦀", "🐬", "🐳", "🦈", "🐢"] },
  { name: L("des animaux qui volent", "animals that fly", "Tiere, die fliegen", "animales que vuelan"), items: ["🐦", "🦅", "🦉", "🦋", "🐝", "🦇", "🕊️"] },
  { name: L("des légumes", "vegetables", "Gemüse", "verduras"), items: ["🥕", "🥦", "🌽", "🥒", "🍆", "🥔", "🧅"] },
  { name: L("des choses de l'hiver", "winter things", "Dinge im Winter", "cosas del invierno"), items: ["⛄", "❄️", "🧤", "🧣", "🎿", "🛷"] },
  { name: L("des choses de l'été", "summer things", "Dinge im Sommer", "cosas del verano"), items: ["☀️", "🏖️", "🩱", "🍦", "🕶️", "🏄"] },
];

export interface Q { items: string[]; odd: string; because: Tr }

export function pictureQ(groups: Group[], n: number, rng: Rng = Math.random): Q {
  const [main, other] = shuffle(groups, rng);
  const odd = pick(other.items, rng);
  const items = shuffle([...shuffle(main.items, rng).slice(0, n - 1), odd], rng);
  return { items, odd, because: main.name };
}

const NUM_RULES: { name: Tr; test: (n: number) => boolean }[] = [
  { name: L("des nombres pairs", "even numbers", "gerade Zahlen", "números pares"), test: (n) => n % 2 === 0 },
  { name: L("des nombres impairs", "odd numbers", "ungerade Zahlen", "números impares"), test: (n) => n % 2 === 1 },
  { name: L("des multiples de 3", "multiples of 3", "Vielfache von 3", "múltiplos de 3"), test: (n) => n % 3 === 0 },
  { name: L("des multiples de 5", "multiples of 5", "Vielfache von 5", "múltiplos de 5"), test: (n) => n % 5 === 0 },
  { name: L("des nombres premiers", "prime numbers", "Primzahlen", "números primos"), test: (n) => n > 1 && [2, 3, 5, 7].every((d) => n === d || n % d !== 0) },
];

/** n−1 nombres qui suivent une règle, et un seul qui ne la suit pas (vérifié). */
export function numberQ(n: number, rng: Rng = Math.random): Q {
  const rule = pick(NUM_RULES, rng);
  const ok: number[] = [], bad: number[] = [];
  while (ok.length < n - 1 || !bad.length) {
    const x = randInt(2, 60, rng);
    if (ok.includes(x) || bad.includes(x)) continue;
    if (rule.test(x)) { if (ok.length < n - 1) ok.push(x); } else if (!bad.length) bad.push(x);
  }
  // une seule bonne réponse : aucune autre règle ne doit désigner un autre nombre comme intrus
  const items = [...ok, bad[0]];
  if (isAmbiguous(items, bad[0])) return numberQ(n, rng);
  return { items: shuffle(items.map(String), rng), odd: String(bad[0]), because: rule.name };
}

/** Vrai si une règle (n'importe laquelle) ferait d'un AUTRE nombre l'intrus. */
export function isAmbiguous(items: number[], odd: number): boolean {
  return NUM_RULES.some((r) => items.some((y) => y !== odd && !r.test(y) && items.filter((x) => x !== y).every(r.test)));
}

const because = (name: Tr, lang: "fr" | "en" | "de" | "es") => ({ fr: `Les autres sont ${name.fr} !`, en: `The others are ${name.en}!`, de: `Die anderen sind ${name.de}!`, es: `¡Los demás son ${name.es}!` })[lang];

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: ["categories"] });

export const TRACK: Track = {
  chapters: [
    { id: "i1", tier: "facile", ages: [3, 5], title: L("Pas comme les autres", "Not like the others", "Nicht wie die anderen", "No como los demás"), levels: [lv("1-1", 5, { kind: "easy", n: 3 }), lv("1-2", 6, { kind: "easy", n: 4 }), lv("1-b", 6, { kind: "easy", n: 4 }, true)] },
    { id: "i2", tier: "moyen", ages: [6, 7], title: L("Regarde bien", "Look closely", "Schau genau hin", "Mira bien"), levels: [lv("2-1", 6, { kind: "subtle", n: 4 }), lv("2-2", 6, { kind: "subtle", n: 5 }), lv("2-b", 8, { kind: "subtle", n: 5 }, true)] },
    { id: "i3", tier: "expert", ages: [8, 14], title: L("L'intrus dans les nombres", "The odd number out", "Die falsche Zahl", "El número intruso"), levels: [lv("3-1", 6, { kind: "numbers", n: 4 }), lv("3-2", 6, { kind: "numbers", n: 5 }), lv("3-b", 8, { kind: "numbers", n: 5 }, true)] },
  ],
};

export const intrusGame: GameDef = {
  id: "intrus",
  icon: "🔍",
  category: "logique",
  ages: [3, 14],
  title: L("Trouve l'intrus", "Odd one out", "Was passt nicht?", "Encuentra el intruso"),
  desc: L("Classer et comparer : trouver celui qui n'est pas comme les autres, avec des images puis des nombres (pairs, multiples, nombres premiers).", "Sort and compare: find the one that doesn't belong, with pictures then numbers (even, multiples, primes).", "Ordnen und vergleichen: finden, was nicht dazugehört, mit Bildern und dann mit Zahlen (gerade, Vielfache, Primzahlen).", "Clasificar y comparar: encontrar el que no pertenece al grupo, con imágenes y luego con números (pares, múltiplos, primos)."),
  skills: { categories: L("Classer, comparer", "Sorting and comparing", "Ordnen und vergleichen", "Clasificar y comparar") },
  speech: (lang) => [...EASY, ...SUBTLE, ...NUM_RULES].map((g) => because(g.name, lang)),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Lequel n'est pas comme les autres ?", "Which one doesn't belong?", "Was passt nicht dazu?", "¿Cuál no es como los demás?")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { kind: string; n: number };
    const n = round.assist ? Math.max(3, p.n - 1) : p.n;
    const q = p.kind === "numbers" ? numberQ(n) : pictureQ(p.kind === "easy" ? EASY : SUBTLE, n);
    const why = because(q.because, ctx.lang);
    const grid = h("div", { class: "cf-grid" });
    let good: HTMLElement | null = null;
    for (const it of q.items) {
      const b = h("button", { class: "cf-item intrus" + (p.kind === "numbers" ? " num" : "") }, it);
      if (it === q.odd) good = b;
      b.onclick = () => (it === q.odd ? round.win(b, why, { praise: true, delay: 1800 }) : round.miss(b));
      grid.appendChild(b);
    }
    round.stage.appendChild(grid);
    round.setHintTarget(() => good);
  },
};
