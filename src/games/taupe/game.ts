// Tape la Taupe (3-12 ans) : attraper les taupes, éviter les chauves-souris ; au dernier chapitre, les taupes portent
// des nombres et on ne tape que les bons (multiples, nombres pairs…).
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { pick, randInt } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

const CRITTERS = ["🐹", "🐹", "🐹", "🐰", "🐭", "🦔", "🐻"];
export type Kind = "normal" | "bonus" | "bat";
export function nextKind(bats: number, bonus: number, rng = Math.random): Kind { const r = rng(); return r < bats ? "bat" : r < bats + bonus ? "bonus" : "normal"; }
export const points = (k: Kind) => (k === "bonus" ? 2 : k === "bat" ? 0 : 1);

/** Règles des taupes à nombres : la taupe est bonne si son nombre suit la règle. */
export const RULES: { id: string; test: (n: number) => boolean; say: Record<Lang, string> }[] = [
  { id: "pair", test: (n) => n % 2 === 0, say: { fr: "Tape les nombres pairs !", en: "Whack the even numbers!", de: "Hau auf die geraden Zahlen!", es: "¡Golpea los números pares!" } },
  { id: "x3", test: (n) => n % 3 === 0, say: { fr: "Tape les multiples de 3 !", en: "Whack the multiples of 3!", de: "Hau auf die Vielfachen von 3!", es: "¡Golpea los múltiplos de 3!" } },
  { id: "x5", test: (n) => n % 5 === 0, say: { fr: "Tape les multiples de 5 !", en: "Whack the multiples of 5!", de: "Hau auf die Vielfachen von 5!", es: "¡Golpea los múltiplos de 5!" } },
  { id: "gt10", test: (n) => n > 10, say: { fr: "Tape les nombres plus grands que 10 !", en: "Whack the numbers bigger than 10!", de: "Hau auf die Zahlen größer als 10!", es: "¡Golpea los números mayores que 10!" } },
];

const lv = (id: string, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds: 1, params, boss, skills: [params.rule ? "nombres" : "reflexes"] });

export const TRACK: Track = {
  chapters: [
    { id: "t1", tier: "facile", ages: [3, 4], title: L("Les petites taupes", "Little moles", "Kleine Maulwürfe", "Topitos"), levels: [lv("1-1", { goal: 8, holes: 6, stay: 2600, gap: 1300, bats: 0 }), lv("1-2", { goal: 10, holes: 6, stay: 2200, gap: 1150, bats: 0 }), lv("1-b", { goal: 12, holes: 9, stay: 2200, gap: 1100, bats: 0 }, true)] },
    { id: "t2", tier: "moyen", ages: [5, 6], title: L("Attention aux chauves-souris", "Watch out for bats", "Vorsicht, Fledermäuse", "Cuidado con los murciélagos"), levels: [lv("2-1", { goal: 12, holes: 9, stay: 1800, gap: 950, bats: 0.15 }), lv("2-2", { goal: 15, holes: 9, stay: 1600, gap: 900, bats: 0.2 }), lv("2-b", { goal: 18, holes: 9, stay: 1500, gap: 850, bats: 0.2 }, true)] },
    { id: "t3", tier: "difficile", ages: [7, 8], title: L("Super rapide", "Super fast", "Superschnell", "Súper rápido"), levels: [lv("3-1", { goal: 18, holes: 9, stay: 1250, gap: 700, bats: 0.25 }), lv("3-2", { goal: 20, holes: 12, stay: 1100, gap: 650, bats: 0.25 }), lv("3-b", { goal: 24, holes: 12, stay: 1000, gap: 600, bats: 0.3 }, true)] },
    { id: "t4", tier: "expert", ages: [9, 12], title: L("Les taupes à nombres", "Number moles", "Zahlen-Maulwürfe", "Topos con números"), levels: [lv("4-1", { goal: 10, holes: 9, stay: 2200, gap: 900, rule: "pair" }), lv("4-2", { goal: 12, holes: 9, stay: 2000, gap: 850, rule: "x3" }), lv("4-3", { goal: 12, holes: 9, stay: 1900, gap: 800, rule: "x5" }), lv("4-b", { goal: 15, holes: 12, stay: 1700, gap: 750, rule: "gt10" }, true)] },
  ],
};

const TSAY = {
  bonus: L("Taupe étoilée ! Deux d'un coup !", "A star mole! Two at once!", "Ein Sternmaulwurf! Zwei auf einmal!", "¡Topo estrella! ¡Dos de golpe!"),
  bat: L("Attention, la chauve-souris ! Ne la touche pas !", "Watch out, the bat! Don't touch it!", "Achtung, die Fledermaus! Nicht antippen!", "¡Cuidado, el murciélago! ¡No lo toques!"),
  ouch: [L("Aïe !", "Ouch!", "Aua!", "¡Ay!"), L("Ouille !", "Ow!", "Autsch!", "¡Uy!"), L("Hihihi !", "Hee hee!", "Hihihi!", "¡Jijiji!"), L("Boing !", "Boing!", "Boing!", "¡Boing!")],
};
export const taupeGame: GameDef = {
  id: "taupe",
  icon: "🐹",
  category: "arcade",
  ages: [3, 12],
  title: L("Tape la Taupe", "Whack-a-Mole", "Hau den Maulwurf", "Atrapa al topo"),
  desc: L("Réflexes et attention : attraper les taupes sans toucher les chauves-souris, puis ne taper que les bons nombres.", "Reflexes and attention: catch the moles without touching the bats, then whack only the right numbers.", "Reaktion und Aufmerksamkeit: Maulwürfe fangen, ohne die Fledermäuse zu treffen, dann nur die richtigen Zahlen.", "Reflejos y atención: atrapar los topos sin tocar los murciélagos y luego golpear solo los números correctos."),
  skills: { reflexes: L("Réflexes et attention", "Reflexes and attention", "Reaktion und Aufmerksamkeit", "Reflejos y atención"), nombres: L("Reconnaître les nombres (pairs, multiples)", "Spotting numbers (even, multiples)", "Zahlen erkennen (gerade, Vielfache)", "Reconocer números (pares, múltiplos)") },
  speech: (lang) => [TSAY.bonus[lang], TSAY.bat[lang], ...TSAY.ouch.map((x) => x[lang]), ...RULES.map((r) => r.say[lang]), L("Oups ! Pas la chauve-souris !", "Oops! Not the bat!", "Hoppla! Nicht die Fledermaus!", "¡Uy! ¡El murciélago no!")[lang]],
  track: () => TRACK,
  instruction: (level, ctx) => {
    const r = RULES.find((x) => x.id === level.params.rule);
    if (r) return r.say[ctx.lang];
    return (level.params.bats ? L("Touche les taupes, mais pas les chauves-souris !", "Tap the moles, but not the bats!", "Tipp die Maulwürfe an, aber nicht die Fledermäuse!", "¡Toca los topos, pero no los murciélagos!") : L("Touche les petites taupes quand elles sortent !", "Tap the little moles when they pop up!", "Tipp die kleinen Maulwürfe an, wenn sie herauskommen!", "¡Toca los topitos cuando salgan!"))[ctx.lang];
  },
  start(round, level, ctx) {
    const p = level.params as { goal: number; holes: number; stay: number; gap: number; bats?: number; rule?: string };
    const rule = RULES.find((r) => r.id === p.rule);
    const meter = round.meter(rule ? "🔢" : "🐹", p.goal);
    const cols = p.holes === 6 ? 3 : p.holes === 12 ? 4 : 3;
    const field = h("div", { class: "ta-field", style: { gridTemplateColumns: `repeat(${cols}, 1fr)` } });
    round.stage.appendChild(field);
    let score = 0, warnedBat = false;
    const holes = Array.from({ length: p.holes }, () => {
      const el = h("div", { class: "ta-hole" }, h("div", { class: "ta-mole" }));
      el.addEventListener("pointerdown", (e) => { e.preventDefault(); hit(el); });
      field.appendChild(el);
      return el;
    });
    const good = (el: HTMLElement) => (rule ? rule.test(Number(el.dataset.n)) : el.dataset.kind !== "bat");
    function hit(el: HTMLElement) {
      if (round.ended || !el.classList.contains("up") || el.classList.contains("hit")) return;
      el.classList.add("hit");
      const bonk = h("div", { class: "ta-bonk" }, el.dataset.kind === "bat" ? "🙈" : pick(["💥", "⭐", "😵", "✨"]));
      el.appendChild(bonk);
      round.timeout(() => { el.classList.remove("up", "hit", "bonus", "bat"); bonk.remove(); }, 350);
      if (!good(el)) { round.oops(); sfx.soft(); if (!rule) round.say(L("Oups ! Pas la chauve-souris !", "Oops! Not the bat!", "Hoppla! Nicht die Fledermaus!", "¡Uy! ¡El murciélago no!")[ctx.lang]); return; }
      sfx.bonk(); round.burst(el);
      if (el.dataset.kind === "bonus") { sfx.coin(); round.say(TSAY.bonus[ctx.lang]); }
      else if (Math.random() < 0.15) round.say(pick(TSAY.ouch)[ctx.lang]);
      score += rule ? 1 : points(el.dataset.kind as Kind);
      meter.set(score);
      if (score >= p.goal) round.timeout(() => round.end(), 500);
    }
    function popUp() {
      const free = holes.filter((x) => !x.classList.contains("up"));
      if (free.length) {
        const el = pick(free), mole = el.firstElementChild as HTMLElement;
        if (rule) {
          // une taupe sur deux environ est bonne : l'enfant n'attend jamais trop
          let n = randInt(1, 30);
          if (Math.random() < 0.5) while (!rule.test(n)) n = randInt(1, 30);
          el.dataset.n = String(n); el.dataset.kind = "normal"; mole.innerHTML = `<span class="ta-num">${n}</span>`;
        } else {
          const k = nextKind(p.bats ?? 0, 0.1);
          el.dataset.kind = k; el.classList.toggle("bonus", k === "bonus"); el.classList.toggle("bat", k === "bat");
          mole.textContent = k === "bonus" ? "🌟" : k === "bat" ? "🦇" : pick(CRITTERS);
          if (k === "bat" && !warnedBat) { warnedBat = true; round.say(TSAY.bat[ctx.lang]); }
        }
        el.classList.add("up");
        round.timeout(() => { if (!el.classList.contains("hit")) el.classList.remove("up", "bonus", "bat"); }, p.stay);
      }
      round.timeout(popUp, p.gap * (0.8 + Math.random() * 0.4));
    }
    round.setHintTarget(() => holes.find((x) => x.classList.contains("up") && !x.classList.contains("hit") && good(x)) ?? null);
    round.timeout(popUp, 1800);
  },
};
