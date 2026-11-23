// Tests du moteur (src/core) : nombres, profils, progression, séries, révisions, porte parent, trophées.
import { describe, expect, test } from "vitest";
import { numberWords } from "../src/core/numwords";
import { createProfile, bandForAge, ageOf, profileFromV2, cleanName } from "../src/core/profile";
import { starsFor, startChapterForAge, getGameProgress, isLevelUnlocked, recordLevel, continueLevel, touchStreak, playerLevel, xpForLevel, isMastered, BOSS_STARS } from "../src/core/progress";
import { answerWord, emptyLangProgress, sessionWords, learnedCount } from "../src/core/leitner";
import { parentGate, minutesLeft, isBlocked, toggleBlock } from "../src/core/parent";
import { checkTrophies } from "../src/core/trophies";
import { exportFamily, importFamily, memoryStore } from "../src/core/store";
import { seeded, addDays, daysBetween } from "../src/core/util";
import type { Track } from "../src/core/types";

const TODAY = "2026-11-23";
const track: Track = {
  chapters: [
    { id: "a", tier: "facile", ages: [3, 5], title: { fr: "A", en: "A", de: "A", es: "A" }, levels: [{ id: "a1", rounds: 3, params: {} }, { id: "a2", rounds: 3, params: {}, skills: ["s"] }, { id: "ab", rounds: 3, params: {}, boss: true }] },
    { id: "b", tier: "moyen", ages: [6, 8], title: { fr: "B", en: "B", de: "B", es: "B" }, levels: [{ id: "b1", rounds: 3, params: {} }, { id: "bb", rounds: 3, params: {}, boss: true }] },
    { id: "c", tier: "difficile", ages: [9, 14], title: { fr: "C", en: "C", de: "C", es: "C" }, levels: [{ id: "c1", rounds: 3, params: {} }] },
  ],
};

describe("nombres en toutes lettres", () => {
  test("français (vingt et un, soixante et onze, quatre-vingts)", () => {
    expect(numberWords(21, "fr")).toBe("vingt et un");
    expect(numberWords(71, "fr")).toBe("soixante et onze");
    expect(numberWords(72, "fr")).toBe("soixante-douze");
    expect(numberWords(80, "fr")).toBe("quatre-vingts");
    expect(numberWords(81, "fr")).toBe("quatre-vingt-un");
    expect(numberWords(97, "fr")).toBe("quatre-vingt-dix-sept");
    expect(numberWords(37, "fr")).toBe("trente-sept");
  });
  test("anglais, allemand, espagnol", () => {
    expect(numberWords(42, "en")).toBe("forty-two");
    expect(numberWords(21, "de")).toBe("einundzwanzig");
    expect(numberWords(37, "de")).toBe("siebenunddreißig");
    expect(numberWords(30, "de")).toBe("dreißig");
    expect(numberWords(22, "es")).toBe("veintidós");
    expect(numberWords(46, "es")).toBe("cuarenta y seis");
    expect(numberWords(100, "es")).toBe("cien");
  });
});

describe("profils", () => {
  test("âge et tranches", () => {
    expect([3, 5, 6, 8, 9, 11, 12, 14].map(bandForAge)).toEqual(["3-5", "3-5", "6-8", "6-8", "9-11", "9-11", "12-14", "12-14"]);
    const p = createProfile({ age: 7, uiLang: "de" }, new Date("2026-06-01"));
    expect(ageOf(p, new Date("2026-06-01"))).toBe(7);
    expect(p.learning).toEqual(["en"]);
    expect(createProfile({ uiLang: "en" }).learning).toEqual(["es"]);
    expect(createProfile({ uiLang: "fr", learning: ["fr", "de"] }).learning).toEqual(["de"]);
  });
  test("prénom nettoyé, reprise de la V2", () => {
    expect(cleanName("  Léa<script> ")).toBe("Léascript");
    const store = new Map([["jeux.prenom", "Zoé"], ["jeux.avatar", "🦊"], ["jeux.age", "6"], ["jeux.stars", "12"]]);
    const p = profileFromV2({ getItem: (k: string) => store.get(k) ?? null }, "fr", new Date("2026-06-01"))!;
    expect(p.name).toBe("Zoé"); expect(p.avatar).toBe("🦊"); expect(ageOf(p, new Date("2026-06-01"))).toBe(6); expect(p.xp).toBe(60);
    expect(profileFromV2({ getItem: () => null })).toBeNull();
  });
});

describe("progression", () => {
  test("étoiles", () => { expect([0, 1, 2, 3, 9].map(starsFor)).toEqual([3, 2, 2, 1, 1]); });
  test("point de départ selon l'âge", () => {
    expect(startChapterForAge(track, 4)).toBe(0);
    expect(startChapterForAge(track, 7)).toBe(1);
    expect(startChapterForAge(track, 12)).toBe(2);
  });
  test("déblocages : niveau suivant à 1 étoile, épreuve quand tout le chapitre a 1 étoile, chapitre suivant à 2 étoiles d'épreuve", () => {
    const p = createProfile({ age: 4 });
    const gp = getGameProgress(p, "g", track);
    expect(isLevelUnlocked(p, gp, track, 0, 0)).toBe(true);
    expect(isLevelUnlocked(p, gp, track, 0, 1)).toBe(false);
    expect(isLevelUnlocked(p, gp, track, 1, 0)).toBe(false);
    recordLevel(p, "g", track, "a1", { stars: 1, errors: 5, seconds: 30 }, TODAY);
    expect(isLevelUnlocked(p, gp, track, 0, 1)).toBe(true);
    expect(isLevelUnlocked(p, gp, track, 0, 2)).toBe(false);
    recordLevel(p, "g", track, "a2", { stars: 3, errors: 0, seconds: 30 }, TODAY);
    expect(isLevelUnlocked(p, gp, track, 0, 2)).toBe(true);
    const fail = recordLevel(p, "g", track, "ab", { stars: 1, errors: 4, seconds: 30 }, TODAY);
    expect(fail.chapterUnlocked).toBeNull();
    expect(continueLevel(p, gp, track).level.id).toBe("ab"); // l'épreuve ratée est reproposée
    const ok = recordLevel(p, "g", track, "ab", { stars: BOSS_STARS, errors: 1, seconds: 30 }, TODAY);
    expect(ok.chapterUnlocked).toBe(1);
    expect(isLevelUnlocked(p, gp, track, 1, 0)).toBe(true);
    expect(continueLevel(p, gp, track).level.id).toBe("b1");
    expect(gp.levels.a1.stars).toBe(1);
    recordLevel(p, "g", track, "a1", { stars: 3, errors: 0, seconds: 10 }, TODAY);
    expect(gp.levels.a1.stars).toBe(3); // on garde le meilleur
    expect(gp.levels.a1.tries).toBe(2);
  });
  test("un enfant de 7 ans commence au chapitre 2, et « tout ouvrir » ouvre tout", () => {
    const p = createProfile({ age: 7 });
    const gp = getGameProgress(p, "g", track);
    expect(isLevelUnlocked(p, gp, track, 0, 0)).toBe(true);
    expect(isLevelUnlocked(p, gp, track, 1, 0)).toBe(true);
    expect(isLevelUnlocked(p, gp, track, 2, 0)).toBe(false);
    expect(continueLevel(p, gp, track).level.id).toBe("b1");
    p.settings.unlockAll = true;
    expect(isLevelUnlocked(p, gp, track, 2, 0)).toBe(true);
  });
  test("XP : seulement les nouvelles étoiles (pas de triche en rejouant)", () => {
    const p = createProfile({ age: 4 });
    const a = recordLevel(p, "g", track, "a1", { stars: 2, errors: 1, seconds: 5 }, TODAY);
    expect(a.xp).toBe(2 * 10 + 5); // 2 étoiles + bonus du jour
    const b = recordLevel(p, "g", track, "a1", { stars: 2, errors: 1, seconds: 5 }, TODAY);
    expect(b.xp).toBe(0);
    const c = recordLevel(p, "g", track, "a1", { stars: 3, errors: 0, seconds: 5 }, TODAY);
    expect(c.xp).toBe(10);
    expect(p.playLog[TODAY]).toBe(15);
  });
  test("niveau du joueur", () => {
    expect(playerLevel(0).level).toBe(1);
    expect(playerLevel(xpForLevel(2)).level).toBe(2);
    expect(playerLevel(xpForLevel(5) - 1).level).toBe(4);
    expect(playerLevel(10 ** 9).level).toBe(50);
  });
  test("maîtrise : 3 parties et 80 %", () => {
    const p = createProfile({ age: 4 });
    for (let i = 0; i < 3; i++) recordLevel(p, "g", track, "a2", { stars: 3, errors: 0, seconds: 1 }, TODAY);
    expect(isMastered(p.mastery.s)).toBe(true);
    recordLevel(p, "g", track, "a2", { stars: 1, errors: 5, seconds: 1 }, TODAY);
    expect(isMastered(p.mastery.s)).toBe(false);
  });
});

describe("séries de jours", () => {
  test("suite, gel, remise à zéro", () => {
    const s = { current: 0, best: 0, lastDay: "", freezes: 0 };
    touchStreak(s, "2026-11-01"); touchStreak(s, "2026-11-01");
    expect(s.current).toBe(1);
    for (let d = 2; d <= 7; d++) touchStreak(s, `2026-11-0${d}`);
    expect(s.current).toBe(7); expect(s.freezes).toBe(1);
    touchStreak(s, "2026-11-09"); // un jour manqué : le gel le rattrape
    expect(s.current).toBe(8); expect(s.freezes).toBe(0);
    touchStreak(s, "2026-11-12");
    expect(s.current).toBe(1); expect(s.best).toBe(8);
  });
  test("dates", () => { expect(daysBetween("2026-02-27", "2026-03-02")).toBe(3); expect(addDays("2026-12-31", 1)).toBe("2027-01-01"); });
});

describe("révisions espacées", () => {
  test("une bonne réponse monte d'une boîte, une erreur renvoie en boîte 1", () => {
    const lp = emptyLangProgress();
    answerWord(lp, "w", true, TODAY); answerWord(lp, "w", true, TODAY); answerWord(lp, "w", true, TODAY);
    expect(lp.words.w.box).toBe(3); expect(lp.words.w.due).toBe("2026-11-26");
    expect(learnedCount(lp)).toBe(1);
    answerWord(lp, "w", false, TODAY);
    expect(lp.words.w.box).toBe(1); expect(learnedCount(lp)).toBe(0);
  });
  test("la séance mélange révisions et nouveaux mots, sans doublon", () => {
    const lp = emptyLangProgress();
    ["a", "b", "c", "d"].forEach((w) => answerWord(lp, w, false, "2026-11-01"));
    const s = sessionWords(lp, ["x", "y", "z", "a"], ["a", "b", "c", "d", "x", "y", "z"], 6, seeded(1), TODAY);
    expect(s).toHaveLength(6);
    expect(new Set(s).size).toBe(6);
    expect(s.filter((w) => ["x", "y", "z"].includes(w)).length).toBeGreaterThanOrEqual(3);
  });
});

describe("espace parent", () => {
  test("la porte demande un calcul écrit en lettres", () => {
    for (const l of ["fr", "en", "de", "es"] as const) {
      const g = parentGate(l, seeded(7));
      expect(g.answer).toBeGreaterThanOrEqual(26);
      expect(g.question).not.toMatch(/\d/);
    }
  });
  test("temps de jeu et blocages", () => {
    const p = createProfile({ age: 6 });
    expect(minutesLeft(p)).toBe(Infinity);
    p.settings.dailyLimit = 15;
    p.playLog[TODAY] = 600;
    expect(minutesLeft(p, 60, TODAY)).toBe(4);
    toggleBlock(p, "cat:arcade");
    expect(isBlocked(p, "x", "arcade")).toBe(true);
    expect(isBlocked(p, "x", "maths")).toBe(false);
    toggleBlock(p, "cat:arcade");
    expect(isBlocked(p, "x", "arcade")).toBe(false);
  });
});

describe("trophées et sauvegarde", () => {
  test("premier pas et série", () => {
    const p = createProfile({ age: 6 });
    expect(checkTrophies(p, { tracks: { g: track } })).toHaveLength(0);
    recordLevel(p, "g", track, "a1", { stars: 3, errors: 0, seconds: 1 }, TODAY);
    p.streak.best = 3;
    const won = checkTrophies(p, { tracks: { g: track } }).map((x) => x.id);
    expect(won).toEqual(expect.arrayContaining(["premier-pas", "serie-3"]));
    expect(checkTrophies(p, { tracks: { g: track } })).toHaveLength(0); // une seule fois
  });
  test("export / import", async () => {
    const a = createProfile({ name: "Léo", age: 9 });
    const back = importFamily(exportFamily([a]));
    expect(back[0].name).toBe("Léo");
    expect(() => importFamily("{}")).toThrow();
    const st = memoryStore();
    await st.save(a);
    expect((await st.profiles())[0].id).toBe(a.id);
  });
});

describe("continuer", () => {
  test("on reprend le chapitre commencé avant le chapitre conseillé pour l'âge", () => {
    const p = createProfile({ age: 7 }); // départ conseillé : chapitre b
    const gp = getGameProgress(p, "g", track);
    recordLevel(p, "g", track, "a1", { stars: 3, errors: 0, seconds: 1 }, TODAY);
    expect(continueLevel(p, gp, track).level.id).toBe("a2");
    recordLevel(p, "g", track, "a2", { stars: 3, errors: 0, seconds: 1 }, TODAY);
    expect(continueLevel(p, gp, track).level.id).toBe("ab");
    recordLevel(p, "g", track, "ab", { stars: 3, errors: 0, seconds: 1 }, TODAY);
    expect(continueLevel(p, gp, track).level.id).toBe("b1");
  });
});
