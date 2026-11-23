// Lot 2 : jeux d'action.
import { describe, expect, test } from "vitest";
import { nextKind as taupeKind, RULES as TAUPE } from "../src/games/taupe/game";
import { colorOrder, numberOrder } from "../src/games/bulles/game";
import { RULES as REFLEXE, nextItem } from "../src/games/reflexe/game";
import { mathFruit, segDist, nextKind as fruitKind, isMistake } from "../src/games/fruits/game";
import { buildCourse, passable, TRACK as DINO, PHYS } from "../src/games/dino/game";
import { obstacle, MIN_Y, MAX_Y, TRACK as COURSE, type Cfg } from "../src/games/course/game";
import { castle, nextStep, DIRS, TRACK as CASTLE, type Diff } from "../src/games/tresors/game";
import { seeded } from "../src/core/util";

describe("jeux d'action", () => {
  test("taupe : pas de chauve-souris sans réglage ; règles des nombres justes", () => {
    for (let k = 0; k < 300; k++) expect(taupeKind(0, 0.1)).not.toBe("bat");
    const pair = TAUPE.find((r) => r.id === "pair")!; expect(pair.test(8)).toBe(true); expect(pair.test(7)).toBe(false);
    for (const r of TAUPE) for (const l of ["fr", "en", "de", "es"] as const) expect(r.say[l].length).toBeGreaterThan(5);
  });
  test("bulles : consignes dans les 4 langues", () => {
    expect(colorOrder("rot", "de")).toBe("Lass die Blasen platzen, die rot sind!");
    expect(numberOrder(3, "es")).toBe("¡Explota las burbujas con el número tres!");
  });
  test("réflexe : chaque objet tiré est du bon côté de la règle", () => {
    for (const r of REFLEXE) for (let k = 0; k < 50; k++) { const it = nextItem(r, 0.6); expect((it.go ? r.go : r.nogo)).toContain(it.value); }
    for (const r of REFLEXE) expect(r.go.some((g) => r.nogo.includes(g))).toBe(false);
  });
  test("fruits : calculs justes, bons et mauvais bien distingués", () => {
    const rng = seeded(5);
    for (let k = 0; k < 500; k++) {
      const target = 5 + (k % 20), good = k % 2 === 0, m = mathFruit(target, good, rng);
      const [a, b] = m.text.split(/[+−]/).map(Number);
      expect(m.text.includes("+") ? a + b : a - b).toBe(m.value);
      expect(m.value === target).toBe(good);
      expect(a).toBeGreaterThan(0); expect(b).toBeGreaterThan(0);
    }
    expect(segDist(5, 3, { x: 0, y: 0 }, { x: 10, y: 0 })).toBe(3);
    for (let k = 0; k < 300; k++) expect(isMistake(fruitKind(0, 0))).toBe(false);
  });
  test("dino : tous les parcours générés peuvent se franchir", () => {
    expect(PHYS.JUMP ** 2 / (2 * PHYS.GRAV)).toBeGreaterThan(3);
    for (const ch of DINO.chapters) for (const l of ch.levels) for (let k = 0; k < 100; k++) {
      const p = l.params as { length: number; gapChance: number; maxGap: number; steps: number; floats: number; enemies: number };
      expect(passable(buildCourse(p), Math.max(3, p.maxGap))).toBe(true);
    }
  });
  test("course : passages toujours dans la zone de nage et assez grands", () => {
    for (const ch of COURSE.chapters) for (const l of ch.levels) { const c = l.params as unknown as Cfg; for (let d = 0; d <= c.dist; d += 5) { const o = obstacle(c, d); expect(o.top).toBeGreaterThanOrEqual(MIN_Y - 1e-9); expect(o.bottom).toBeLessThanOrEqual(MAX_Y + 1e-9); expect(o.bottom - o.top).toBeGreaterThanOrEqual(3.2 - 1e-9); } }
  });
  test("château : on peut toujours tout ramasser puis atteindre la porte", () => {
    for (const ch of CASTLE.chapters) for (const l of ch.levels) for (let k = 0; k < 20; k++) {
      const { diff, n } = l.params as { diff: Diff; n: number };
      const c = castle(diff, n);
      const hero = { x: 1, y: 1 }, gems = c.gems.slice();
      for (let s = 0; s < 800 && (gems.length || hero.x !== c.door.x || hero.y !== c.door.y); s++) {
        const d = nextStep(c.grid, hero, gems.length ? gems : [c.door]);
        expect(d).toBeTruthy();
        hero.x += DIRS[d!][0]; hero.y += DIRS[d!][1];
        const i = gems.findIndex((g) => g.x === hero.x && g.y === hero.y); if (i >= 0) gems.splice(i, 1);
      }
      expect(gems).toHaveLength(0);
    }
  });
});
