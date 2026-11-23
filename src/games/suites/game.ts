// Suites logiques (4-14 ans) : trouver ce qui vient après. AB → ABC → AABB → suites qui grandissent → suites de nombres.
import { L, type LevelDef, type Track } from "../../core/types";
import { shuffle, pick, randInt, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { numberWords } from "../../core/numwords";

export const SAY = {
  next: L("Qu'est-ce qui vient après ?", "What comes next?", "Was kommt als Nächstes?", "¿Qué viene después?"),
  nextNum: L("Quel nombre vient après ?", "Which number comes next?", "Welche Zahl kommt als Nächstes?", "¿Qué número viene después?"),
  colors: L("Regarde les couleurs : le même groupe se répète !", "Look at the colours: the same group repeats!", "Schau auf die Farben: Die gleiche Gruppe wiederholt sich!", "Mira los colores: ¡el mismo grupo se repite!"),
  howMuch: L("Regarde de combien ça change à chaque fois !", "Look at how much it changes each time!", "Schau, um wie viel es sich jedes Mal ändert!", "¡Mira cuánto cambia cada vez!"),
};

const THEMES = [["🍎", "🍌", "🍇", "🍓"], ["🐶", "🐱", "🐰", "🐸"], ["🔴", "🔵", "🟡", "🟢"], ["⭐", "🌙", "☀️", "☁️"], ["🚗", "🚲", "✈️", "⛵"]];
export const PATTERNS: Record<string, number[]> = { AB: [0, 1], ABC: [0, 1, 2], AAB: [0, 0, 1], ABB: [0, 1, 1], AABB: [0, 0, 1, 1], ABAC: [0, 1, 0, 2], ABCD: [0, 1, 2, 3], ABBC: [0, 1, 1, 2] };

export interface Seq { shown: string[]; answer: string; choices: string[]; unit?: number }

/** Une suite d'images : on montre `len` éléments et il faut trouver le suivant. */
export function imageSeq(patterns: string[], len: number, nChoices: number, rng: Rng = Math.random): Seq {
  const pat = PATTERNS[pick(patterns, rng)];
  const theme = shuffle(pick(THEMES, rng), rng);
  len = Math.max(len, pat.length * 2); // au moins 2 motifs complets : la règle est sans ambiguïté (V2)
  const all = Array.from({ length: len + 1 }, (_, i) => theme[pat[i % pat.length]]);
  const answer = all[len];
  const pool = [answer, ...theme.filter((x) => x !== answer)];
  return { shown: all.slice(0, len), answer, choices: shuffle(pool.slice(0, nChoices), rng), unit: pat.length };
}

/** Une suite de nombres (+k, ×2, carrés…), pour les grands. */
export function numberSeq(kind: string, rng: Rng = Math.random): Seq {
  let s: number[];
  if (kind === "add") { const a = randInt(1, 20, rng), k = randInt(2, 9, rng); s = [0, 1, 2, 3, 4].map((i) => a + i * k); }
  else if (kind === "sub") { const k = randInt(2, 9, rng), a = 4 * k + randInt(5, 40, rng); s = [0, 1, 2, 3, 4].map((i) => a - i * k); }
  else if (kind === "double") { const a = randInt(1, 6, rng); s = [0, 1, 2, 3, 4].map((i) => a * 2 ** i); }
  else if (kind === "square") { const a = randInt(1, 4, rng); s = [0, 1, 2, 3, 4].map((i) => (a + i) ** 2); }
  else { const a = randInt(1, 5, rng), b = randInt(1, 5, rng); s = [a, b]; while (s.length < 5) s.push(s[s.length - 1] + s[s.length - 2]); }
  const answer = s[4];
  const set = new Set([answer]);
  for (const d of shuffle([1, -1, 2, -2, 3, 5, -3, 10], rng)) { if (set.size >= 4) break; if (answer + d >= 0) set.add(answer + d); }
  return { shown: s.slice(0, 4).map(String), answer: String(answer), choices: shuffle([...set].map(String), rng) };
}

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: ["suites"] });

export const TRACK: Track = {
  chapters: [
    { id: "s1", tier: "facile", ages: [4, 5], title: L("Deux qui alternent", "Two taking turns", "Zwei im Wechsel", "Dos que se alternan"), levels: [lv("1-1", 5, { patterns: ["AB"], len: 4, n: 2 }), lv("1-2", 5, { patterns: ["AB"], len: 5, n: 3 }), lv("1-b", 6, { patterns: ["AB", "AAB"], len: 5, n: 3 }, true)] },
    { id: "s2", tier: "moyen", ages: [6, 7], title: L("Trois et plus", "Three and more", "Drei und mehr", "Tres y más"), levels: [lv("2-1", 6, { patterns: ["ABC"], len: 5, n: 3 }), lv("2-2", 6, { patterns: ["AAB", "ABB"], len: 6, n: 3 }), lv("2-b", 8, { patterns: ["ABC", "AAB", "ABB"], len: 6, n: 4 }, true)] },
    { id: "s3", tier: "difficile", ages: [8, 9], title: L("Suites rusées", "Tricky patterns", "Knifflige Folgen", "Series difíciles"), levels: [lv("3-1", 6, { patterns: ["AABB", "ABAC"], len: 7, n: 4 }), lv("3-2", 6, { patterns: ["ABCD", "ABBC"], len: 7, n: 4 }), lv("3-b", 8, { patterns: ["AABB", "ABAC", "ABCD", "ABBC"], len: 7, n: 4 }, true)] },
    { id: "s4", tier: "expert", ages: [10, 14], title: L("Suites de nombres", "Number sequences", "Zahlenfolgen", "Series de números"), levels: [lv("4-1", 6, { numbers: ["add", "sub"] }), lv("4-2", 6, { numbers: ["double", "square"] }), lv("4-3", 6, { numbers: ["fibo", "add", "double"] }), lv("4-b", 8, { numbers: ["add", "sub", "double", "square", "fibo"] }, true)] },
  ],
};

export const suitesGame: GameDef = {
  id: "suites",
  icon: "🧩",
  category: "logique",
  ages: [4, 14],
  title: L("Suites logiques", "Patterns", "Logische Folgen", "Series lógicas"),
  desc: L("Trouver la règle et ce qui vient après : suites d'images, puis suites de nombres (+, −, ×2, carrés, Fibonacci).", "Find the rule and what comes next: picture patterns, then number sequences (+, −, ×2, squares, Fibonacci).", "Die Regel finden und was als Nächstes kommt: Bilderfolgen, dann Zahlenfolgen (+, −, ×2, Quadratzahlen, Fibonacci).", "Encontrar la regla y lo que viene después: series de imágenes y luego de números (+, −, ×2, cuadrados, Fibonacci)."),
  skills: { suites: L("Suites logiques", "Patterns", "Logische Folgen", "Series lógicas") },
  track: () => TRACK,
  speech: (lang) => [SAY.next[lang], SAY.nextNum[lang], SAY.colors[lang], SAY.howMuch[lang]],
  instruction: (_l, ctx) => L("Regarde bien la suite. Qu'est-ce qui vient après ?", "Look carefully at the pattern. What comes next?", "Schau dir die Folge genau an. Was kommt als Nächstes?", "Mira bien la serie. ¿Qué viene después?")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { patterns?: string[]; len?: number; n?: number; numbers?: string[] };
    const q = p.numbers ? numberSeq(pick(p.numbers)) : imageSeq(p.patterns!, p.len!, round.assist ? 2 : p.n!);
    const items = q.shown.map((x, i) => h("span", { class: "sq-item", style: { animationDelay: i * 50 + "ms" } }, x));
    const row = h("div", { class: "sq-row" + (p.numbers ? " num" : "") }, ...items, h("span", { class: "sq-item sq-q" }, "?"));
    let hinted = false;
    const grid = h("div", { class: "ca-choices" });
    let good: HTMLElement | null = null;
    for (const c of q.choices) {
      const b = h("button", { class: "ca-choice sq-choice" }, c);
      if (c === q.answer) good = b;
      b.onclick = () => {
        if (round.ended) return;
        if (c === q.answer) { (row.lastChild as HTMLElement).textContent = c; (row.lastChild as HTMLElement).classList.add("ok"); round.win(b, p.numbers ? numberWords(+c, ctx.lang) : ""); return; }
        // indice (V2) : on colorie les groupes qui se répètent
        if (!hinted && q.unit) { hinted = true; items.forEach((it, i) => it.classList.add("g" + (Math.floor(i / q.unit!) % 2))); }
        round.miss(b, (p.numbers ? SAY.howMuch : SAY.colors)[ctx.lang]);
      };
      grid.appendChild(b);
    }
    round.stage.append(h("div", { class: "ca-wrap" }, row, grid));
    round.setHintTarget(() => good);
    if (round.index > 0) round.say((p.numbers ? SAY.nextNum : SAY.next)[ctx.lang]);
  },
};
