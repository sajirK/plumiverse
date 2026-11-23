// Memory (3-14 ans) : retrouver les paires. De 3 paires d'animaux à 8 paires, puis des paires « image ↔ nombre ».
import { L, type LevelDef, type Track } from "../../core/types";
import { shuffle } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

const SETS: Record<string, string[]> = {
  animaux: ["🐶", "🐱", "🐰", "🦊", "🐼", "🐸", "🐵", "🦁", "🐷", "🐮", "🐨", "🐯"],
  fruits: ["🍎", "🍌", "🍓", "🍇", "🍊", "🍐", "🍒", "🍉", "🥝", "🍍", "🥥", "🍑"],
  vehicules: ["🚗", "🚌", "🚲", "✈️", "🚂", "⛵", "🚀", "🚁", "🚜", "🚒", "🛵", "🚑"],
  mer: ["🐟", "🐙", "🦀", "🐬", "🐳", "🦈", "🐢", "🦭", "🐠", "🦑", "🐚", "🪼"],
};

export interface Card { key: string; face: string }

/** Un plateau : n paires mélangées. Mode « nombre » : une image de k objets va avec le chiffre k. */
export function deck(pairs: number, set: string, numbers = false): Card[] {
  if (numbers) {
    const ks = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, pairs);
    return shuffle(ks.flatMap((k) => [{ key: String(k), face: "🍎".repeat(k) }, { key: String(k), face: String(k) }]));
  }
  const faces = shuffle(SETS[set]).slice(0, pairs);
  return shuffle(faces.flatMap((f) => [{ key: f, face: f }, { key: f, face: f }]));
}

/** Une erreur ne compte que si l'on rate une paire alors que l'autre carte avait déjà été vue (V2). */
export function isMistake(seen: Set<number>, deckCards: Card[], a: number, b: number): boolean {
  if (deckCards[a].key === deckCards[b].key) return false;
  const partner = deckCards.findIndex((c, i) => i !== a && c.key === deckCards[a].key);
  return seen.has(partner);
}

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: ["memoire"] });

export const TRACK: Track = {
  chapters: [
    { id: "m1", tier: "facile", ages: [3, 4], title: L("3 paires", "3 pairs", "3 Paare", "3 parejas"), levels: [lv("1-1", 2, { pairs: 3, set: "animaux" }), lv("1-2", 2, { pairs: 3, set: "fruits" }), lv("1-b", 2, { pairs: 4, set: "animaux" }, true)] },
    { id: "m2", tier: "moyen", ages: [5, 6], title: L("5 paires", "5 pairs", "5 Paare", "5 parejas"), levels: [lv("2-1", 2, { pairs: 5, set: "vehicules" }), lv("2-2", 2, { pairs: 5, set: "mer" }), lv("2-b", 2, { pairs: 6, set: "fruits" }, true)] },
    { id: "m3", tier: "difficile", ages: [7, 9], title: L("8 paires", "8 pairs", "8 Paare", "8 parejas"), levels: [lv("3-1", 1, { pairs: 7, set: "animaux" }), lv("3-2", 1, { pairs: 8, set: "mer" }), lv("3-b", 2, { pairs: 8, set: "vehicules" }, true)] },
    { id: "m4", tier: "expert", ages: [10, 14], title: L("Images et nombres", "Pictures and numbers", "Bilder und Zahlen", "Imágenes y números"), levels: [lv("4-1", 1, { pairs: 6, numbers: true }), lv("4-2", 1, { pairs: 8, numbers: true }), lv("4-b", 2, { pairs: 9, numbers: true }, true)] },
  ],
};

export const memoireGame: GameDef = {
  id: "memoire",
  icon: "🃏",
  category: "logique",
  ages: [3, 14],
  title: L("Memory", "Memory", "Memory", "Memoria"),
  desc: L("Retourner les cartes et retrouver les paires : la mémoire et l'attention, de 3 à 9 paires.", "Turn the cards over and find the pairs: memory and attention, from 3 to 9 pairs.", "Karten umdrehen und Paare finden: Gedächtnis und Aufmerksamkeit, von 3 bis 9 Paaren.", "Dar la vuelta a las cartas y encontrar las parejas: memoria y atención, de 3 a 9 parejas."),
  skills: { memoire: L("Mémoire", "Memory", "Gedächtnis", "Memoria") },
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.numbers
    ? L("Trouve l'image qui va avec chaque nombre !", "Match each picture with its number!", "Finde zu jeder Zahl das passende Bild!", "¡Une cada imagen con su número!")
    : L("Retourne deux cartes. Trouve les paires !", "Turn over two cards. Find the pairs!", "Dreh zwei Karten um. Finde die Paare!", "Da la vuelta a dos cartas. ¡Encuentra las parejas!"))[ctx.lang],
  start(round, level) {
    const p = level.params as { pairs: number; set?: string; numbers?: boolean };
    const cards = deck(p.pairs, p.set ?? "animaux", !!p.numbers);
    const seen = new Set<number>();
    const found = new Set<number>();
    let open: number[] = [];
    let lock = false;
    const cols = cards.length <= 6 ? 3 : cards.length <= 12 ? 4 : cards.length <= 16 ? 4 : 6;
    const grid = h("div", { class: "me-grid", style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    round.stage.appendChild(grid);
    const els = cards.map((c, i) => {
      const b = h("button", { class: "mem-card" + (p.numbers ? " num" : ""), "aria-label": "?" }, h("span", { class: "mem-back" }, "🦉"), h("span", { class: "mem-face" }, c.face));
      b.onclick = () => flip(i);
      grid.appendChild(b);
      return b;
    });
    function flip(i: number) {
      if (lock || round.ended || found.has(i) || open.includes(i)) return;
      sfx.tap();
      els[i].classList.add("up");
      open.push(i);
      if (open.length < 2) { seen.add(i); return; }
      const [a, b] = open;
      if (cards[a].key === cards[b].key) {
        found.add(a); found.add(b); open = [];
        seen.add(b);
        els[a].classList.add("found"); els[b].classList.add("found");
        sfx.good(); round.burst(els[b]);
        if (found.size === cards.length) round.win(grid, "", { delay: 900 });
        return;
      }
      if (isMistake(seen, cards, a, b) || isMistake(seen, cards, b, a)) round.oops();
      seen.add(b);
      lock = true;
      round.timeout(() => { els[a].classList.remove("up"); els[b].classList.remove("up"); open = []; lock = false; }, 900);
    }
    // aide : la carte qui complète la paire ouverte, sinon une paire déjà vue, sinon une carte jamais vue
    round.setHintTarget(() => {
      if (lock) return null;
      if (open.length === 1) return els[cards.findIndex((c, i) => i !== open[0] && c.key === cards[open[0]].key)];
      const rest = cards.map((_, i) => i).filter((i) => !found.has(i));
      const pair = rest.find((i) => seen.has(i) && rest.some((j) => j !== i && cards[j].key === cards[i].key && seen.has(j)));
      return els[pair ?? rest[0]];
    });
  },
};
