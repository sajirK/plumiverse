// Tests des contenus : traductions complètes, cours de langue justes, parcours de jeux valides et finissables.
import { describe, expect, test } from "vitest";
import { DICTS, leafKeys } from "../src/core/i18n";
import { LANGS, type Lang, type Track } from "../src/core/types";
import { UNITS, WORDS, SENTENCES, tiles, sameWord, wordsOfUnit } from "../src/content/lang/course";
import { courseTrack, kindFor, choicesFor, STEPS } from "../src/games/langue/logic";
import { GAMES } from "../src/games";
import { createProfile } from "../src/core/profile";
import { getGameProgress, isLevelUnlocked, recordLevel, continueLevel } from "../src/core/progress";
import { question, choices, spoken, TRACK as CALC, type Gen } from "../src/games/calcul/logic";
import { colorQuestion, countQuestion } from "../src/games/couleurs/game";
import { WORDS as WRITE_WORDS, TRACK as ECRIRE } from "../src/games/ecrire/game";
import * as G from "../src/games/ecrire/glyphs";
import { seeded } from "../src/core/util";
import { VOICES, audioId } from "../src/audio/voices";
import { scoreVoice } from "../src/audio/voice";

describe("traductions de l'interface", () => {
  test("les 4 langues ont exactement les mêmes clés, sans texte vide", () => {
    const ref = leafKeys(DICTS.fr).sort();
    for (const l of LANGS) {
      expect(leafKeys(DICTS[l]).sort()).toEqual(ref);
      const walk = (o: unknown): void => { if (typeof o === "string") expect(o.trim().length).toBeGreaterThan(0); else Object.values(o as object).forEach(walk); };
      walk(DICTS[l]);
    }
  });
  test("les variables {n}, {name}… sont les mêmes dans chaque langue", () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join();
    const flat = (o: unknown, p = ""): [string, string][] => (typeof o === "string" ? [[p, o]] : Array.isArray(o) ? [] : Object.entries(o as object).flatMap(([k, v]) => flat(v, p + "." + k)));
    const fr = Object.fromEntries(flat(DICTS.fr));
    for (const l of LANGS) for (const [k, v] of flat(DICTS[l])) expect(vars(v), `${l}${k}`).toBe(vars(fr[k]));
  });
});

describe("cours de langue", () => {
  test("mots : identifiants uniques, 4 langues, image unique dans l'unité", () => {
    expect(new Set(WORDS.map((w) => w.id)).size).toBe(WORDS.length);
    for (const u of UNITS) {
      const ws = wordsOfUnit(u.id);
      expect(ws.length).toBeGreaterThanOrEqual(8);
      expect(new Set(ws.map((w) => w.color ?? w.e)).size).toBe(ws.length);
      for (const l of LANGS) expect(new Set(ws.map((w) => w.t[l].show.toLowerCase())).size, `${u.id}/${l}`).toBe(ws.length);
    }
  });
  test("articles et genres : noms allemands avec der/die/das et une majuscule, espagnols avec el/la, français avec le/la/l'", () => {
    const nounUnits = ["animaux", "nourriture", "corps", "vetements", "maison", "nature", "transports"];
    for (const w of WORDS.filter((x) => nounUnits.includes(x.unit))) {
      expect(w.t.de.show, w.id).toMatch(/^(der|die|das) [A-ZÄÖÜ]/);
      expect(w.t.es.show, w.id).toMatch(/^(el|la) /);
      expect(w.t.fr.show, w.id).toMatch(/^(le|la|l') ?/);
      expect(w.t.en.show, w.id).toMatch(/^the /);
      for (const l of LANGS) expect(w.t[l].show.endsWith(w.t[l].write), `${w.id}/${l}`).toBe(true);
    }
    // quelques genres vérifiés à la main
    const g = (id: string, l: Lang) => WORDS.find((w) => w.id === id)!.t[l].show;
    expect(g("animaux.chat", "de")).toBe("die Katze");
    expect(g("nourriture.eau", "es")).toBe("el agua");
    expect(g("nourriture.lait", "es")).toBe("la leche");
    expect(g("nature.soleil", "de")).toBe("die Sonne");
    expect(g("nature.lune", "de")).toBe("der Mond");
    expect(g("maison.lit", "es")).toBe("la cama");
    expect(g("transports.velo", "es")).toBe("la bicicleta");
  });
  test("phrases : 4 langues, découpage en tuiles fidèle, au moins 2 tuiles", () => {
    for (const s of SENTENCES) for (const l of LANGS) {
      const tl = tiles(s.t[l]);
      expect(tl.join(" ").replace(/ ([?!])/g, " $1"), `${s.id}/${l}`).toBe(s.t[l]);
      expect(tl.length, `${s.id}/${l}`).toBeGreaterThanOrEqual(2);
    }
    expect(tiles("Où est ma chaussette ?")).toEqual(["Où", "est", "ma", "chaussette ?"]);
    expect(tiles("¿Dónde está mi calcetín?")[0]).toBe("¿Dónde");
    for (const u of UNITS) expect(SENTENCES.filter((s) => s.unit === u.id).length, u.id).toBeGreaterThanOrEqual(4);
  });
  test("saisie : majuscules ignorées, accents exigés", () => {
    expect(sameWord("katze", "Katze")).toBe(true);
    expect(sameWord(" Pajaro ", "pájaro")).toBe(false);
    expect(sameWord("PÁJARO", "pájaro")).toBe(true);
  });
  test("choix : le bon mot, sans doublon d'image ni de texte", () => {
    for (const w of WORDS) for (const show of ["image", "fr", "de"] as const) {
      const c = choicesFor(w, 4, show, seeded(3));
      expect(c).toContain(w);
      expect(c).toHaveLength(4);
      const keys = c.map((x) => (show === "image" ? x.color ?? x.e : x.t[show].show.toLowerCase()));
      expect(new Set(keys).size).toBe(4);
    }
  });
  test("les tout-petits n'ont que de l'écoute ; les grands construisent des phrases", () => {
    expect(new Set(STEPS["3-5"])).toEqual(new Set(["listen"]));
    for (let r = 0; r < 8; r++) expect(kindFor("3-5", 5, r, "animaux")).toBe("listen");
    expect(STEPS["9-11"]).toContain("build");
    expect(courseTrack("de").chapters).toHaveLength(UNITS.length);
  });
});

describe("parcours des jeux", () => {
  const ctxFor = (age: number) => ({ profile: createProfile({ age, uiLang: "fr", learning: ["en", "de", "es"] }), age, band: (age <= 5 ? "3-5" : age <= 8 ? "6-8" : age <= 11 ? "9-11" : "12-14") as "3-5", lang: "fr" as Lang });
  const tracks: [string, Track][] = GAMES.map((g) => [g.id, g.track(ctxFor(8))]);
  test.each(tracks)("%s : identifiants uniques, une épreuve à la fin de chaque chapitre", (_id, trk) => {
    const ids = trk.chapters.flatMap((c) => c.levels.map((l) => l.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const c of trk.chapters) {
      expect(c.levels.length).toBeGreaterThanOrEqual(2);
      expect(c.levels.at(-1)!.boss).toBe(true);
      expect(c.levels.filter((l) => l.boss)).toHaveLength(1);
      for (const l of c.levels) expect(l.rounds).toBeGreaterThanOrEqual(1);
      for (const l of LANGS) expect(c.title[l].length).toBeGreaterThan(0);
    }
  });
  test.each(tracks)("%s : en réussissant chaque niveau proposé, on termine tout le parcours", (id, trk) => {
    const p = createProfile({ age: 3 });
    const gp = getGameProgress(p, id, trk);
    const all = trk.chapters.flatMap((c) => c.levels);
    for (let i = 0; i < all.length * 2; i++) {
      const ref = continueLevel(p, gp, trk);
      if (gp.levels[ref.level.id]?.stars === 3) break;
      expect(isLevelUnlocked(p, gp, trk, ref.ci, ref.li)).toBe(true);
      recordLevel(p, id, trk, ref.level.id, { stars: 3, errors: 0, seconds: 1 }, "2026-11-23");
    }
    for (const l of all) expect(gp.levels[l.id]?.stars, l.id).toBe(3);
  });
  test("chaque jeu a un titre et une description dans les 4 langues", () => {
    for (const g of GAMES) for (const l of LANGS) { expect(g.title[l].length).toBeGreaterThan(0); expect(g.desc[l].length).toBeGreaterThan(20); }
  });
});

describe("calcul", () => {
  const gens: Gen[] = CALC.chapters.flatMap((c) => c.levels.map((l) => l.params as unknown as Gen));
  test("toutes les questions sont justes (vérifiées en recalculant le texte)", () => {
    const rng = seeded(42);
    for (const g of gens) for (let k = 0; k < 300; k++) {
      const q = question(g, rng);
      if (q.text.includes("?")) { const [a, , , , total] = q.text.split(" "); expect(Number(a) + q.answer).toBe(Number(total)); continue; }
      const expr = q.text.replace(/−/g, "-").replace(/×/g, "*").replace(/÷/g, "/").replace(/(\d+)\/(\d+) \*/g, "($1/$2) *").replace(/(\d+) % \*/g, "($1/100) *");
      // eslint-disable-next-line no-new-func
      const v = Function(`return (${expr});`)() as number;
      expect(Math.abs(v - q.answer), q.text).toBeLessThan(1e-9);
      expect(Number.isInteger(q.answer), q.text).toBe(true);
    }
  });
  test("pas de résultat négatif avant le chapitre des nombres relatifs", () => {
    const rng = seeded(5);
    for (const c of CALC.chapters.slice(0, 6)) for (const l of c.levels) for (let k = 0; k < 200; k++) expect(question(l.params as unknown as Gen, rng).answer).toBeGreaterThanOrEqual(0);
  });
  test("choix uniques avec la bonne réponse ; phrases dites dans les 4 langues", () => {
    for (let a = 0; a < 30; a++) { const c = choices(a, 4, seeded(a)); expect(c).toContain(a); expect(new Set(c).size).toBe(4); expect(c.every((x) => x >= 0)).toBe(true); }
    const q = question({ gen: "add", max: 5 }, seeded(1));
    expect(spoken(q, "fr")).toMatch(/^Combien font \d plus \d \?$/);
    expect(spoken(q, "es")).toMatch(/^¿Cuánto es \d más \d\?$/);
  });
});

describe("couleurs, formes, écrire", () => {
  test("questions bien formées", () => {
    expect(colorQuestion("rot", "de")).toBe("Welcher Ballon ist rot?");
    expect(colorQuestion("rojo", "es")).toBe("¿Qué globo es rojo?");
    expect(countQuestion(1, "fr")).toBe("Où y a-t-il une étoile ?");
    expect(countQuestion(3, "de")).toBe("Wo sind drei Sterne?");
    expect(countQuestion(1, "es")).toBe("¿Dónde hay una estrella?");
  });
  test("toutes les lettres et chiffres à tracer existent", () => {
    for (const c of ECRIRE.chapters) for (const l of c.levels) for (const ch of (l.params.set as string[] | undefined) ?? []) {
      if (!/[A-Z0-9]/.test(ch)) continue;
      expect(G.glyph(ch), ch).toBeTruthy();
    }
    for (const l of LANGS) for (const [w] of [...WRITE_WORDS[l].short, ...WRITE_WORDS[l].long]) for (const ch of w) expect(G.glyph(ch), `${l}:${w}`).toBeTruthy();
  });
  test("en suivant le trait, on le termine (tolérance de chaque palier)", () => {
    for (const tol of [18, 14, 12]) {
      const tr = G.newTrace(G.glyph("B")![1]);
      G.touchStart(tr);
      for (const [x, y] of tr.points) G.feed(tr, x + 2, y, tol);
      expect(tr.done).toBe(true);
    }
  });
});

describe("voix", () => {
  test("4 voix maximum, une par langue, empreinte stable", () => {
    expect(Object.keys(VOICES)).toHaveLength(4);
    expect(audioId("fr", "Bonjour")).toBe(audioId("fr", "  Bonjour "));
    expect(audioId("fr", "Bonjour")).not.toBe(audioId("en", "Bonjour"));
  });
  test("la meilleure voix du navigateur : jamais une autre langue, les voix naturelles d'abord", () => {
    expect(scoreVoice({ name: "Samantha", lang: "en-US", localService: true }, "fr")).toBe(-1);
    const good = scoreVoice({ name: "Amélie (Premium)", lang: "fr-FR", localService: true }, "fr");
    const bad = scoreVoice({ name: "Thomas", lang: "fr-FR", localService: true }, "fr");
    const silly = scoreVoice({ name: "Bad News", lang: "en-GB", localService: true }, "en");
    expect(good).toBeGreaterThan(bad);
    expect(silly).toBeLessThan(scoreVoice({ name: "Daniel", lang: "en-GB", localService: true }, "en"));
  });
});
