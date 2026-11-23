// Réflexe Éclair (5-14 ans) : toucher seulement ce que la règle demande (attention et contrôle de soi).
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { pick } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export interface Rule { id: string; go: string[]; nogo: string[]; balloons?: boolean; say: Record<Lang, string> }
const BALLOON: Record<string, string> = { red: "#e63946", blue: "#1d70f5", green: "#2dc653", yellow: "#ffd60a" };

export const RULES: Rule[] = [
  { id: "grenouille", go: ["🐸"], nogo: ["🐝"], say: { fr: "Touche les grenouilles ! Pas les abeilles, ça pique !", en: "Tap the frogs! Not the bees, they sting!", de: "Tipp die Frösche an! Nicht die Bienen, die stechen!", es: "¡Toca las ranas! ¡Las abejas no, que pican!" } },
  { id: "fruits", go: ["🍎", "🍌", "🍓", "🍇", "🍊"], nogo: ["🧦", "👟", "🧢"], say: { fr: "Touche les fruits ! Pas les chaussettes !", en: "Tap the fruit! Not the socks!", de: "Tipp das Obst an! Nicht die Socken!", es: "¡Toca las frutas! ¡Los calcetines no!" } },
  { id: "rouge", go: ["red"], nogo: ["blue", "green", "yellow"], balloons: true, say: { fr: "Touche seulement les ballons rouges !", en: "Tap only the red balloons!", de: "Tipp nur die roten Ballons an!", es: "¡Toca solo los globos rojos!" } },
  { id: "mer", go: ["🐟", "🐙", "🦀", "🐬", "🐳"], nogo: ["🐄", "🐔", "🐶", "🦁"], say: { fr: "Touche les animaux de la mer !", en: "Tap the sea animals!", de: "Tipp die Meerestiere an!", es: "¡Toca los animales del mar!" } },
  { id: "cinq", go: ["5"], nogo: ["2", "3", "6", "8", "S"], say: { fr: "Touche seulement le chiffre 5 !", en: "Tap only the number 5!", de: "Tipp nur die Zahl 5 an!", es: "¡Toca solo el número 5!" } },
  { id: "pair", go: ["2", "4", "6", "8", "10", "12"], nogo: ["1", "3", "5", "7", "9", "11"], say: { fr: "Touche les nombres pairs !", en: "Tap the even numbers!", de: "Tipp die geraden Zahlen an!", es: "¡Toca los números pares!" } },
];

export function nextItem(rule: Rule, goRatio: number, rng = Math.random) {
  const go = rng() < goRatio;
  const list = go ? rule.go : rule.nogo;
  return { value: list[Math.floor(rng() * list.length)], go };
}

const lv = (id: string, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds: 1, params, boss, skills: ["attention"] });

export const TRACK: Track = {
  chapters: [
    { id: "r1", tier: "facile", ages: [5, 6], title: L("Une règle", "One rule", "Eine Regel", "Una regla"), levels: [lv("1-1", { goal: 8, rules: ["grenouille"], life: 3200, gap: 1100, goRatio: 0.75 }), lv("1-2", { goal: 10, rules: ["fruits"], life: 3000, gap: 1050, goRatio: 0.7 }), lv("1-b", { goal: 12, rules: ["grenouille", "fruits"], life: 2800, gap: 1000, goRatio: 0.7 }, true)] },
    { id: "r2", tier: "moyen", ages: [7, 8], title: L("Plus vite", "Faster", "Schneller", "Más rápido"), levels: [lv("2-1", { goal: 12, rules: ["rouge"], life: 2500, gap: 900, goRatio: 0.65 }), lv("2-2", { goal: 14, rules: ["mer"], life: 2400, gap: 880, goRatio: 0.65 }), lv("2-b", { goal: 16, rules: ["rouge", "mer", "fruits"], life: 2300, gap: 850, goRatio: 0.62 }, true)] },
    { id: "r3", tier: "difficile", ages: [9, 10], title: L("Les chiffres", "Numbers", "Zahlen", "Números"), levels: [lv("3-1", { goal: 14, rules: ["cinq"], life: 2200, gap: 800, goRatio: 0.6 }), lv("3-2", { goal: 16, rules: ["pair"], life: 2100, gap: 780, goRatio: 0.6 }), lv("3-b", { goal: 18, rules: ["cinq", "pair"], life: 2000, gap: 750, goRatio: 0.58, switchAt: 9 }, true)] },
    { id: "r4", tier: "expert", ages: [11, 14], title: L("La règle change !", "The rule changes!", "Die Regel ändert sich!", "¡La regla cambia!"), levels: [lv("4-1", { goal: 20, rules: ["grenouille", "rouge", "mer", "pair"], life: 1800, gap: 680, goRatio: 0.55, switchAt: 10 }), lv("4-b", { goal: 24, rules: RULES.map((r) => r.id), life: 1600, gap: 620, goRatio: 0.55, switchAt: 8 }, true)] },
  ],
};

export const reflexeGame: GameDef = {
  id: "reflexe",
  icon: "⚡",
  category: "arcade",
  ages: [5, 14],
  title: L("Réflexe Éclair", "Lightning Reflex", "Blitzreaktion", "Reflejo Relámpago"),
  desc: L("Toucher seulement ce que la règle demande : réflexes, attention et contrôle de soi, avec des règles qui changent.", "Tap only what the rule asks: reflexes, attention and self-control, with rules that change.", "Nur antippen, was die Regel verlangt: Reaktion, Aufmerksamkeit und Selbstkontrolle, mit wechselnden Regeln.", "Tocar solo lo que pide la regla: reflejos, atención y autocontrol, con reglas que cambian."),
  skills: { attention: L("Attention et contrôle de soi", "Attention and self-control", "Aufmerksamkeit und Selbstkontrolle", "Atención y autocontrol") },
  speech: (lang) => RULES.map((r) => r.say[lang]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Touche seulement ce qu'on te demande. Le reste, on n'y touche pas !", "Tap only what you're asked. Leave the rest!", "Tipp nur an, was verlangt wird. Den Rest lässt du!", "Toca solo lo que te piden. ¡Lo demás, no!")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { goal: number; rules: string[]; life: number; gap: number; goRatio: number; switchAt?: number };
    const meter = round.meter("⚡", p.goal);
    const arena = h("div", { class: "re-arena" });
    const ruleBox = h("button", { class: "re-rule" });
    round.stage.append(arena, ruleBox);
    let rule = RULES.find((r) => r.id === pick(p.rules))!;
    let hits = 0, running = false;
    type It = { el: HTMLElement; x: number; y: number; go: boolean; done?: boolean };
    let items: It[] = [];
    const show = (v: string) => (rule.balloons ? `<span class="re-dot" style="background:${BALLOON[v]}"></span>` : v);
    const drawRule = () => { ruleBox.innerHTML = `<span class="yes">👆 ${rule.go.slice(0, 3).map(show).join("")}</span><span class="no">🚫 ${rule.nogo.slice(0, 3).map(show).join("")}</span>`; };
    ruleBox.onclick = () => round.say(rule.say[ctx.lang]);
    drawRule();
    const remove = (o: It) => { o.el.remove(); items = items.filter((x) => x !== o); };
    function spot(size: number): [number, number] | null {
      const W = arena.clientWidth, H = arena.clientHeight;
      for (let k = 0; k < 30; k++) {
        const x = size / 2 + 10 + Math.random() * Math.max(10, W - size - 20), y = size / 2 + 10 + Math.random() * Math.max(10, H - size - 20);
        if (items.every((o) => Math.hypot(o.x - x, o.y - y) > size * 1.1)) return [x, y];
      }
      return null;
    }
    function spawn() {
      if (!running) return;
      const size = Math.max(76, Math.min(130, Math.min(arena.clientWidth, arena.clientHeight) * 0.2));
      const s = spot(size);
      if (s) {
        const it = nextItem(rule, p.goRatio);
        const el = h("button", { class: "re-item", style: { left: `${s[0]}px`, top: `${s[1]}px`, width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.6}px` } });
        if (rule.balloons) { el.classList.add("balloon"); el.style.background = BALLOON[it.value]; } else el.textContent = it.value;
        const o: It = { el, x: s[0], y: s[1], go: it.go };
        el.addEventListener("pointerdown", (e) => { e.preventDefault(); tap(o); });
        arena.appendChild(el); items.push(o);
        round.timeout(() => { if (!o.done) remove(o); }, p.life);
      }
      round.timeout(spawn, p.gap * (0.8 + Math.random() * 0.4));
    }
    function tap(o: It) {
      if (!running || o.done || round.ended) return;
      o.done = true;
      if (!o.go) { round.oops(); sfx.soft(); o.el.classList.add("k-miss"); round.timeout(() => remove(o), 350); return; }
      sfx.pop(); round.burst(o.el); o.el.classList.add("hit");
      round.timeout(() => remove(o), 250);
      hits++; meter.set(hits);
      if (hits >= p.goal) { running = false; round.timeout(() => round.end(), 400); return; }
      if (p.switchAt && hits % p.switchAt === 0 && p.rules.length > 1) {
        running = false; items.slice().forEach(remove);
        const others = p.rules.filter((r) => r !== rule.id);
        rule = RULES.find((r) => r.id === pick(others))!;
        drawRule();
        ruleBox.classList.remove("k-good"); void ruleBox.offsetWidth; ruleBox.classList.add("k-good");
        round.say(rule.say[ctx.lang]);
        round.timeout(() => { running = true; spawn(); }, 2600);
      }
    }
    round.setHintTarget(() => items.find((o) => o.go && !o.done)?.el ?? null);
    round.timeout(() => round.say(rule.say[ctx.lang]), 1600);
    round.timeout(() => { running = true; spawn(); }, 3400);
  },
};
