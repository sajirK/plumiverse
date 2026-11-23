// Les Bulles (3-7 ans) : éclater les bulles, puis seulement celles de la bonne couleur, puis celles du bon nombre.
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { pick } from "../../core/util";
import { numberWords } from "../../core/numwords";
import { wordsOfUnit } from "../../content/lang/course";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

// les couleurs (et leurs noms dans les 4 langues) viennent du cours de langue
const COLORS = wordsOfUnit("couleurs").filter((c) => ["couleurs.rouge", "couleurs.bleu", "couleurs.jaune", "couleurs.vert", "couleurs.rose", "couleurs.orange"].includes(c.id));
const SURPRISES = ["🐟", "🐙", "🦆", "🐸", "🦄", "🐱", "🐶", "🐥", "🦋", "🐢", "🍓", "⭐"];

/** « Éclate les bulles rouges » : on dit la couleur au pluriel, sans accord compliqué (attribut). */
export function colorOrder(name: string, lang: Lang): string {
  return { fr: `Éclate les bulles de couleur ${name} !`, en: `Pop the ${name} bubbles!`, de: `Lass die Blasen platzen, die ${name} sind!`, es: `¡Explota las burbujas de color ${name}!` }[lang];
}
export function numberOrder(n: number, lang: Lang): string {
  return { fr: `Éclate les bulles avec le nombre ${numberWords(n, "fr")} !`, en: `Pop the bubbles with the number ${numberWords(n, "en")}!`, de: `Lass die Blasen mit der Zahl ${numberWords(n, "de")} platzen!`, es: `¡Explota las burbujas con el número ${numberWords(n, "es")}!` }[lang];
}

const lv = (id: string, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds: 1, params, boss, skills: [params.mode === "number" ? "chiffres" : params.mode === "color" ? "couleurs" : "precision"] });

export const TRACK: Track = {
  chapters: [
    { id: "b1", tier: "facile", ages: [3, 3], title: L("Pop pop pop !", "Pop pop pop!", "Plopp plopp!", "¡Pop pop pop!"), levels: [lv("1-1", { mode: "all", goal: 10, speed: 0.5, size: [120, 170], max: 7 }), lv("1-2", { mode: "all", goal: 14, speed: 0.6, size: [100, 160], max: 8 }), lv("1-b", { mode: "all", goal: 18, speed: 0.7, size: [90, 150], max: 9 }, true)] },
    { id: "b2", tier: "facile", ages: [4, 4], title: L("La bonne couleur", "The right colour", "Die richtige Farbe", "El color correcto"), levels: [lv("2-1", { mode: "color", goal: 10, every: 5, speed: 0.6, size: [100, 150], max: 8 }), lv("2-2", { mode: "color", goal: 14, every: 5, speed: 0.75, size: [90, 140], max: 10 }), lv("2-b", { mode: "color", goal: 18, every: 4, speed: 0.9, size: [80, 130], max: 11 }, true)] },
    { id: "b3", tier: "moyen", ages: [5, 7], title: L("Les nombres", "Numbers", "Zahlen", "Los números"), levels: [lv("3-1", { mode: "number", goal: 10, every: 4, max5: 5, speed: 0.6, size: [100, 140], max: 8 }), lv("3-2", { mode: "number", goal: 14, every: 4, max5: 10, speed: 0.75, size: [90, 130], max: 10 }), lv("3-b", { mode: "number", goal: 18, every: 3, max5: 10, speed: 0.9, size: [80, 120], max: 11 }, true)] },
  ],
};

export const bullesGame: GameDef = {
  id: "bulles",
  icon: "🫧",
  category: "arcade",
  ages: [3, 7],
  title: L("Les bulles", "Bubbles", "Seifenblasen", "Las burbujas"),
  desc: L("Éclater des bulles pour la précision du geste, puis reconnaître les couleurs et les nombres.", "Pop bubbles for finger precision, then recognise colours and numbers.", "Blasen platzen lassen für einen genauen Finger, dann Farben und Zahlen erkennen.", "Explotar burbujas para la precisión del dedo y luego reconocer colores y números."),
  skills: { precision: L("Précision du geste", "Finger precision", "Genauigkeit", "Precisión"), couleurs: L("Les couleurs", "Colours", "Farben", "Los colores"), chiffres: L("Reconnaître les chiffres", "Recognising numbers", "Zahlen erkennen", "Reconocer los números") },
  speech: (lang) => [...COLORS.map((c) => colorOrder(c.t[lang].show, lang)), ...Array.from({ length: 10 }, (_, i) => numberOrder(i + 1, lang))],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Touche les bulles pour les faire éclater !", "Tap the bubbles to pop them!", "Tipp die Blasen an, damit sie platzen!", "¡Toca las burbujas para explotarlas!")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { mode: string; goal: number; every?: number; max5?: number; speed: number; size: [number, number]; max: number };
    const meter = round.meter("🫧", p.goal);
    const arena = h("div", { class: "bu-arena" });
    round.stage.appendChild(arena);
    type B = { el: HTMLElement; x: number; y: number; size: number; speed: number; phase: number; color: string; n: number };
    const bubbles: B[] = [];
    let score = 0, since = 0, spawnT = 0, target = "", targetN = 0;
    const goalBox = h("button", { class: "bu-goal" });
    if (p.mode !== "all") arena.appendChild(goalBox);
    const sayGoal = () => round.say(p.mode === "color" ? colorOrder(COLORS.find((c) => c.id === target)!.t[ctx.lang].show, ctx.lang) : numberOrder(targetN, ctx.lang));
    goalBox.onclick = sayGoal;
    function newTarget(speak = true) {
      if (p.mode === "color") { let t2 = target; while (t2 === target) t2 = pick(COLORS).id; target = t2; const c = COLORS.find((x) => x.id === target)!; goalBox.innerHTML = `🎯 <i style="background:${c.color}"></i>`; }
      else { let n = targetN; while (n === targetN) n = 1 + Math.floor(Math.random() * p.max5!); targetN = n; goalBox.innerHTML = `🎯 <b>${n}</b>`; }
      goalBox.classList.remove("k-good"); void goalBox.offsetWidth; goalBox.classList.add("k-good");
      if (speak) sayGoal();
    }
    const isGood = (b: B) => (p.mode === "color" ? b.color === target : p.mode === "number" ? b.n === targetN : true);
    function spawn() {
      const W = arena.clientWidth, H = arena.clientHeight;
      const size = p.size[0] + Math.random() * (p.size[1] - p.size[0]);
      const c = p.mode === "color" && Math.random() < 0.4 ? COLORS.find((x) => x.id === target)! : pick(COLORS);
      const n = p.mode === "number" ? (Math.random() < 0.4 ? targetN : 1 + Math.floor(Math.random() * p.max5!)) : 0;
      const el = h("div", { class: "bu-bubble", style: { width: `${size}px`, height: `${size}px`, background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,.98) 0 12%, ${c.color}66 13% 56%, ${c.color}bb 100%)` } });
      if (p.mode === "number") el.innerHTML = `<b style="font-size:${size * 0.45}px">${n}</b>`;
      else if (Math.random() < 0.4) el.innerHTML = `<span style="font-size:${size * 0.42}px">${pick(SURPRISES)}</span>`;
      const b: B = { el, x: Math.random() * Math.max(10, W - size), y: H + 10, size, speed: p.speed * (0.8 + Math.random() * 0.5), phase: Math.random() * 6, color: c.id, n };
      el.addEventListener("pointerdown", (e) => { e.preventDefault(); pop(b); });
      arena.appendChild(el); bubbles.push(b);
    }
    function pop(b: B) {
      if (round.ended || !bubbles.includes(b)) return;
      if (!isGood(b)) { b.el.classList.remove("k-miss"); void b.el.offsetWidth; b.el.classList.add("k-miss"); round.oops(); sfx.wrong(); if (p.mode !== "all") sayGoal(); return; }
      bubbles.splice(bubbles.indexOf(b), 1);
      round.burst(b.el); sfx.bubble();
      const item = b.el.querySelector("span")?.textContent;
      b.el.remove();
      if (item) { const t = h("div", { class: "bu-poptext", style: { left: b.x + b.size / 2 + "px", top: b.y + b.size / 2 + "px" } }, item); arena.appendChild(t); round.timeout(() => t.remove(), 1000); }
      score++; meter.set(score);
      if (score >= p.goal) { round.timeout(() => round.end(), 400); return; }
      if (p.every && ++since >= p.every) { since = 0; newTarget(); }
    }
    round.loop((dt) => {
      spawnT -= dt;
      if (spawnT <= 0 && bubbles.length < p.max) { spawn(); spawnT = 0.45 + Math.random() * 0.6; }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y -= b.speed * 100 * dt; b.phase += 1.8 * dt;
        b.el.style.transform = `translate(${b.x + Math.sin(b.phase) * 18}px, ${b.y}px)`;
        if (b.y < -b.size - 20) { b.el.remove(); bubbles.splice(i, 1); }
      }
    });
    round.setHintTarget(() => bubbles.find((b) => isGood(b) && b.y > -b.size / 3 && b.y < arena.clientHeight - b.size / 2)?.el ?? null);
    // la cible existe tout de suite (une bulle peut apparaître avant la consigne), elle est dite un peu après
    if (p.mode !== "all") { newTarget(false); round.timeout(sayGoal, 1500); }
  },
};
