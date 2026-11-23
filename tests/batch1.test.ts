// Lot 1 : memory, suites, intrus, code, horloge, boutique.
import { describe, expect, test } from "vitest";
import { deck, isMistake } from "../src/games/memoire/game";
import { imageSeq, numberSeq, PATTERNS } from "../src/games/suites/game";
import { pictureQ, numberQ, isAmbiguous, EASY, SUBTLE } from "../src/games/intrus/game";
import { generate, run, compress, expand, nextMove, type Block, type Dir } from "../src/games/code/logic";
import { timeWords, clockChoices, randomTime, type M } from "../src/games/horloge/game";
import { money, bestCoin, changeChoices, priceLine } from "../src/games/monnaie/game";
import { seeded } from "../src/core/util";

describe("memory", () => {
  test("chaque carte a exactement une paire", () => {
    for (const nums of [false, true]) for (let k = 0; k < 50; k++) {
      const d = deck(6, "animaux", nums);
      expect(d).toHaveLength(12);
      for (const c of d) expect(d.filter((x) => x.key === c.key)).toHaveLength(2);
      if (nums) for (const c of d) if (/🍎/.test(c.face)) expect([...c.face].filter((x) => x === "🍎").length).toBe(Number(c.key));
    }
  });
  test("une erreur ne compte que si la carte partenaire avait déjà été vue", () => {
    const d = [{ key: "a", face: "a" }, { key: "b", face: "b" }, { key: "a", face: "a" }, { key: "b", face: "b" }];
    expect(isMistake(new Set(), d, 0, 1)).toBe(false);
    expect(isMistake(new Set([2]), d, 0, 1)).toBe(true);
    expect(isMistake(new Set([2]), d, 0, 2)).toBe(false);
  });
});

describe("suites", () => {
  test("la bonne réponse suit le motif et fait partie des choix", () => {
    const rng = seeded(3);
    for (const pat of Object.keys(PATTERNS)) for (let k = 0; k < 50; k++) {
      const q = imageSeq([pat], 7, 4, rng);
      const p = PATTERNS[pat];
      expect(q.choices).toContain(q.answer);
      expect(new Set(q.choices).size).toBe(q.choices.length);
      // le motif se répète bien : l'élément i vaut l'élément i − longueur du motif
      const all = [...q.shown, q.answer];
      for (let i = p.length; i < all.length; i++) expect(all[i]).toBe(all[i - p.length]);
    }
  });
  test("suites de nombres justes", () => {
    const rng = seeded(9);
    for (const kind of ["add", "sub", "double", "square", "fibo"]) for (let k = 0; k < 100; k++) {
      const q = numberSeq(kind, rng);
      const s = [...q.shown, q.answer].map(Number);
      expect(q.choices).toContain(q.answer);
      expect(s.every((x) => x >= 0)).toBe(true);
      if (kind === "add" || kind === "sub") expect(s[4] - s[3]).toBe(s[1] - s[0]);
      if (kind === "double") expect(s[4]).toBe(s[3] * 2);
      if (kind === "fibo") expect(s[4]).toBe(s[3] + s[2]);
      if (kind === "square") expect(Number.isInteger(Math.sqrt(s[4]))).toBe(true);
    }
  });
});

describe("intrus", () => {
  test("images : un seul intrus, de l'autre groupe", () => {
    const rng = seeded(4);
    for (const groups of [EASY, SUBTLE]) for (let k = 0; k < 200; k++) {
      const q = pictureQ(groups, 5, rng);
      expect(q.items.filter((x) => x === q.odd)).toHaveLength(1);
      const main = groups.find((g) => g.name === q.because)!;
      expect(main.items).not.toContain(q.odd);
      for (const x of q.items) if (x !== q.odd) expect(main.items).toContain(x);
    }
  });
  test("pas d'image dans deux groupes (sinon deux réponses possibles)", () => {
    for (const groups of [EASY, SUBTLE]) {
      const all = groups.flatMap((g) => g.items);
      expect(new Set(all).size).toBe(all.length);
    }
  });
  test("nombres : une seule bonne réponse", () => {
    const rng = seeded(7);
    for (let k = 0; k < 300; k++) {
      const q = numberQ(5, rng);
      expect(isAmbiguous(q.items.map(Number), Number(q.odd))).toBe(false);
    }
  });
});

describe("code", () => {
  test("la solution gagne, et l'aide mène à la victoire (avec et sans boucles)", () => {
    const rng = seeded(11);
    for (const loops of [false, true]) for (let k = 0; k < 100; k++) {
      const g = generate(7, 7, 10, [6, 12], rng);
      expect(run(g, g.solution).result).toBe("win");
      expect(expand(compress(g.solution))).toEqual(g.solution);
      const prog: Block[] = [{ dir: "up", n: 3 }];
      for (let s = 0; s < 60; s++) {
        const m = nextMove(g, prog, loops);
        if (m === "go") break;
        if (m === "undo") prog.pop();
        else if (m.startsWith("times:")) prog[prog.length - 1].n = Number(m.slice(6));
        else prog.push({ dir: m as Dir, n: 1 });
      }
      expect(run(g, expand(prog)).result).toBe("win");
      if (loops) expect(prog.length).toBe(compress(g.solution).length);
    }
  });
});

describe("horloge", () => {
  test("l'heure dite est juste dans les 4 langues", () => {
    expect(timeWords(3, 0, "fr")).toBe("Il est trois heures.");
    expect(timeWords(1, 30, "fr")).toBe("Il est une heure et demie.");
    expect(timeWords(3, 45, "fr")).toBe("Il est quatre heures moins le quart.");
    expect(timeWords(3, 15, "en")).toBe("It's quarter past three.");
    expect(timeWords(3, 45, "en")).toBe("It's quarter to four.");
    expect(timeWords(1, 0, "de")).toBe("Es ist ein Uhr.");
    expect(timeWords(3, 30, "de")).toBe("Es ist halb vier.");
    expect(timeWords(1, 15, "de")).toBe("Es ist Viertel nach eins.");
    expect(timeWords(1, 0, "es")).toBe("Es la una.");
    expect(timeWords(1, 30, "es")).toBe("Es la una y media.");
    expect(timeWords(3, 45, "es")).toBe("Son las cuatro menos cuarto.");
  });
  test("une seule horloge juste parmi les choix", () => {
    const rng = seeded(2);
    const mins: M[] = [0, 15, 30, 45];
    for (let k = 0; k < 300; k++) {
      const t = randomTime(mins, rng);
      const c = clockChoices(t, mins, 4, rng);
      expect(c).toHaveLength(4);
      expect(c.filter((x) => x.hr === t.hr && x.m === t.m)).toHaveLength(1);
      expect(new Set(c.map((x) => `${x.hr}:${x.m}`)).size).toBe(4);
    }
  });
});

describe("boutique", () => {
  test("format des prix par langue", () => {
    expect(money(350, "fr")).toBe("3,50 €");
    expect(money(350, "en")).toBe("€3.50");
    expect(money(700, "de")).toBe("7 €");
    expect(priceLine(700, "es")).toBe("Son 7 €, por favor.");
  });
  test("en suivant l'aide on paie juste ; la monnaie à rendre est parmi les choix", () => {
    for (let price = 2; price <= 40; price++) {
      let rest = price, n = 0;
      while (rest > 0) { rest -= bestCoin(rest, [1, 2, 5, 10, 20])!; n++; }
      expect(rest).toBe(0);
    }
    for (let a = 10; a < 2000; a += 37) { const c = changeChoices(a, 10, 4, seeded(a)); expect(c).toContain(a); expect(new Set(c).size).toBe(4); expect(c.every((x) => x > 0)).toBe(true); }
  });
});
