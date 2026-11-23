// Lot 3 : Monde, Saisons, Jardin, Mélodie, Docteur, Pizzeria, Glacier.
import { describe, expect, test } from "vitest";
import { seeded } from "../src/core/util";
import { LANGS } from "../src/core/types";
import { ANIMALS, CONTINENTS, deck, TRACK as MONDE, rightText, type Cont } from "../src/games/monde/game";
import { WEATHERS, checkOutfit, plan, wardrobeFor, nextSeason, afterQ, SEASONS, outfitMessage, TRACK as SAISONS } from "../src/games/saisons/game";
import { newPot, water, sun, nextAction, MAX_WATER, PLANTS } from "../src/games/jardin/game";
import { melody } from "../src/games/melodie/game";
import { AILMENTS, TOOLS, session, stepsFor, trayFor, TRACK as DOC, type Cfg as DocCfg } from "../src/games/docteur/game";
import { order as pizzaOrder, judge as pizzaJudge, nextNeed as pizzaNeed, named, orderLines as pizzaLines, TRACK as PIZZA, type Cfg as PzCfg, type Pizza } from "../src/games/pizzeria/game";
import { order as iceOrder, judge as iceJudge, nextNeed as iceNeed, scoops, orderLines as iceLines, TRACK as ICE, type Cfg as IceCfg, type Ice } from "../src/games/glacier/game";
import { GAMES } from "../src/games";

const levels = (t: { chapters: { levels: { params: Record<string, unknown>; rounds: number }[] }[] }) => t.chapters.flatMap((c) => c.levels);

describe("lot 3", () => {
  test("monde : assez d'animaux pour chaque niveau, sans doublon, textes dans les 4 langues", () => {
    for (const l of levels(MONDE)) {
      const d = deck(l.params.continents as Cont[], l.rounds, seeded(3));
      expect(d.length).toBe(l.rounds);
      expect(new Set(d.map((a) => a.e)).size).toBe(d.length);
      expect(d.every((a) => (l.params.continents as Cont[]).includes(a.c))).toBe(true);
    }
    for (const a of ANIMALS) for (const lang of LANGS) { expect(rightText(a, lang)).toContain(a.fact[lang]); expect(CONTINENTS[a.c].from[lang]).toBeTruthy(); }
    expect(ANIMALS.some((a) => a.e === "🦁")).toBe(false);
  });

  test("saisons : la tenue attendue est toujours possible et jamais interdite", () => {
    for (const w of WEATHERS) {
      expect(w.need.some((k) => w.no[k])).toBe(false);
      expect(checkOutfit(w, w.need).ok).toBe(true);
      const small = wardrobeFor(w, true, seeded(1));
      for (const k of w.need) expect(small).toContain(k);
      for (const lang of LANGS) expect(outfitMessage(w, [], lang).length).toBeGreaterThan(5);
    }
    expect(nextSeason("hiver").id).toBe("printemps");
    expect(afterQ(SEASONS[1], "es")).toBe("¿Qué viene después del verano?");
    expect(afterQ(SEASONS[0], "es")).toBe("¿Qué viene después de la primavera?");
    expect(afterQ(SEASONS[3], "de")).toBe("Was kommt nach dem Winter?");
    for (const l of levels(SAISONS)) {
      const p = plan(l.params as never, seeded(7));
      expect(p.length).toBe(l.rounds);
      for (const st of p) if (st.kind !== "meteo") expect(st.options.some((o) => o.id === st.answer)).toBe(true);
    }
  });

  test("jardin : eau puis soleil fait grandir, trop d'eau est refusé, 4 étapes jusqu'à la récolte", () => {
    for (const type of Object.keys(PLANTS)) {
      const p = newPot(type);
      let guard = 0;
      while (nextAction(p) !== "cueillir" && guard++ < 20) { if (nextAction(p) === "eau") water(p); else sun(p); }
      expect(p.stage).toBe(4);
      expect(guard).toBe(8);
    }
    const p = newPot("tomate");
    for (let i = 0; i < MAX_WATER; i++) expect(water(p).ok).toBe(true);
    expect(water(p).ok).toBe(false);
    expect(sun(p).grew).toBe(true);
  });

  test("mélodie : bonne longueur, jamais 3 fois la même note de suite", () => {
    const rng = seeded(9);
    for (let k = 0; k < 300; k++) {
      const m = melody(2 + (k % 9), 3 + (k % 4), rng);
      expect(m.length).toBe(2 + (k % 9));
      for (let i = 2; i < m.length; i++) expect(m[i] === m[i - 1] && m[i] === m[i - 2]).toBe(false);
    }
  });

  test("docteur : la trousse contient toujours les outils nécessaires", () => {
    for (const l of levels(DOC)) {
      const c = l.params as unknown as DocCfg;
      for (let k = 0; k < 30; k++) {
        const s = session(c, l.rounds, seeded(k));
        expect(s.patients.length).toBe(l.rounds);
        for (const p of s.patients) {
          const tray = s.tray ?? trayFor([p.ailment], c.tray, seeded(k));
          for (const st of stepsFor(p.ailment, c)) { expect(tray).toContain(st.tool); expect(st.taps).toBeGreaterThanOrEqual(1); }
        }
      }
    }
    for (const a of Object.values(AILMENTS)) for (const st of a.steps) expect(TOOLS[st.tool]).toBeTruthy();
  });

  test("pizzeria : suivre l'aide mène toujours à une pizza parfaite", () => {
    expect(named("🫒", 1, "fr")).toBe("une olive");
    expect(named("🍄", 3, "de")).toBe("drei Pilze");
    for (const l of levels(PIZZA)) for (let k = 0; k < 40; k++) {
      const o = pizzaOrder(l.params as unknown as PzCfg, seeded(k * 7 + 1));
      for (const e of Object.keys(o.tops)) expect(o.tray).toContain(e);
      const pz: Pizza = { sauce: 0, cheese: o.cheese ? 0 : 0.5, tops: { [o.tray.find((e) => !(e in o.tops)) ?? "🍄"]: 1 } };
      let guard = 0;
      for (;;) {
        const n = pizzaNeed(o, pz);
        if (n === "four" || guard++ > 60) break;
        if (n === "sauce") pz.sauce += 0.25; else if (n === "fromage") pz.cheese += 0.25; else if (n === "recommencer") { pz.sauce = 0; pz.cheese = 0; pz.tops = {}; }
        else if ("add" in n) pz.tops[n.add] = (pz.tops[n.add] ?? 0) + 1; else { pz.tops[n.remove]--; if (!pz.tops[n.remove]) delete pz.tops[n.remove]; }
      }
      for (const lang of LANGS) expect(pizzaJudge(o, pz, lang).perfect).toBe(true);
      expect(pizzaLines(o, "fr")[0]).toContain("pizza");
    }
  });

  test("glacier : suivre l'aide mène toujours à la bonne glace", () => {
    expect(scoops("vanille", 1, "fr")).toBe("une boule vanille");
    expect(scoops("chocolat", 2, "en")).toBe("two scoops of chocolate");
    expect(scoops("fraise", 2, "de")).toBe("zwei Kugeln Erdbeere");
    for (const l of levels(ICE)) for (let k = 0; k < 40; k++) {
      const o = iceOrder(l.params as unknown as IceCfg, seeded(k * 3 + 2));
      for (const f of o.scoops) expect(o.tubs).toContain(f);
      expect(o.scoops.length).toBeLessThanOrEqual(3);
      const ice: Ice = { holder: o.holder === "pot" ? "cornet" : "pot", scoops: [o.tubs[0], o.tubs[0], o.tubs[0]], sauce: "caramel", decos: [] };
      let guard = 0;
      for (;;) {
        const n = iceNeed(o, ice);
        if (n === "servir" || guard++ > 60) break;
        if ("holder" in n) ice.holder = n.holder; else if ("add" in n) ice.scoops.push(n.add); else if ("remove" in n) ice.scoops.splice(ice.scoops.indexOf(n.remove), 1);
        else if ("sauce" in n) ice.sauce = ice.sauce === n.sauce ? null : n.sauce; else ice.decos.push(n.deco);
      }
      for (const lang of LANGS) expect(iceJudge(o, ice, lang).perfect).toBe(true);
      expect(iceLines(o, "en").at(-1)).toBe("Please!");
    }
  });

  test("les 7 jeux sont dans le catalogue", () => {
    for (const id of ["monde", "saisons", "jardin", "melodie", "docteur", "pizzeria", "glacier"]) expect(GAMES.some((g) => g.id === id)).toBe(true);
  });
});
