// Couleurs & formes (3-6 ans) : couleurs, puis formes, puis compter. Zéro lecture : on écoute et on touche.
import { L, type Lang, type Track } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle } from "../../core/util";
import { wordsOfUnit } from "../../content/lang/course";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

const COLORS = wordsOfUnit("couleurs"); // mêmes noms de couleurs que le cours de langue
const BASIC = ["couleurs.rouge", "couleurs.bleu", "couleurs.jaune", "couleurs.vert"];

export const SHAPES = ["cercle", "carre", "triangle", "etoile", "coeur", "rectangle"] as const;
type Shape = (typeof SHAPES)[number];
const SHAPE_PHRASE: Record<Shape, Record<Lang, string>> = {
  cercle: { fr: "Touche le cercle.", en: "Tap the circle.", de: "Tippe auf den Kreis.", es: "Toca el círculo." },
  carre: { fr: "Touche le carré.", en: "Tap the square.", de: "Tippe auf das Quadrat.", es: "Toca el cuadrado." },
  triangle: { fr: "Touche le triangle.", en: "Tap the triangle.", de: "Tippe auf das Dreieck.", es: "Toca el triángulo." },
  etoile: { fr: "Touche l'étoile.", en: "Tap the star.", de: "Tippe auf den Stern.", es: "Toca la estrella." },
  coeur: { fr: "Touche le cœur.", en: "Tap the heart.", de: "Tippe auf das Herz.", es: "Toca el corazón." },
  rectangle: { fr: "Touche le rectangle.", en: "Tap the rectangle.", de: "Tippe auf das Rechteck.", es: "Toca el rectángulo." },
};

/** « Quel ballon est rouge ? » — l'adjectif est attribut : pas d'accord compliqué, juste dans les 4 langues. */
export function colorQuestion(colorWord: string, lang: Lang): string {
  return { fr: `Quel ballon est ${colorWord} ?`, en: `Which balloon is ${colorWord}?`, de: `Welcher Ballon ist ${colorWord}?`, es: `¿Qué globo es ${colorWord}?` }[lang];
}

/** « Où y a-t-il trois étoiles ? » avec le bon accord pour 1. */
export function countQuestion(n: number, lang: Lang): string {
  if (n === 1) return { fr: "Où y a-t-il une étoile ?", en: "Where is one star?", de: "Wo ist ein Stern?", es: "¿Dónde hay una estrella?" }[lang];
  const w = numberWords(n, lang);
  return { fr: `Où y a-t-il ${w} étoiles ?`, en: `Where are ${w} stars?`, de: `Wo sind ${w} Sterne?`, es: `¿Dónde hay ${w} estrellas?` }[lang];
}

function shapeSvg(s: Shape, color: string): string {
  const f = `fill="${color}" stroke="rgba(0,0,0,.15)" stroke-width="3"`;
  const body: Record<Shape, string> = {
    cercle: `<circle cx="50" cy="50" r="40" ${f}/>`,
    carre: `<rect x="12" y="12" width="76" height="76" rx="6" ${f}/>`,
    triangle: `<polygon points="50,8 92,88 8,88" ${f} stroke-linejoin="round"/>`,
    etoile: `<polygon points="50,6 61,38 95,38 67,58 78,92 50,71 22,92 33,58 5,38 39,38" ${f} stroke-linejoin="round"/>`,
    coeur: `<path d="M50 88 C10 60 6 30 26 20 C40 13 50 24 50 32 C50 24 60 13 74 20 C94 30 90 60 50 88Z" ${f}/>`,
    rectangle: `<rect x="6" y="26" width="88" height="48" rx="6" ${f}/>`,
  };
  return `<svg viewBox="0 0 100 100" width="100%" height="100%">${body[s]}</svg>`;
}

const balloon = (color: string) => `<svg viewBox="0 0 60 80" width="100%" height="100%"><ellipse cx="30" cy="30" rx="24" ry="28" fill="${color}" stroke="rgba(0,0,0,.12)" stroke-width="2"/><ellipse cx="22" cy="20" rx="6" ry="9" fill="rgba(255,255,255,.45)"/><path d="M30 58 l-4 6 h8z" fill="${color}"/><path d="M30 64 q-6 8 0 16" stroke="#868e96" stroke-width="1.5" fill="none"/></svg>`;

export const TRACK: Track = {
  chapters: [
    { id: "couleurs-1", tier: "facile", ages: [3, 3], title: L("Mes premières couleurs", "My first colours", "Meine ersten Farben", "Mis primeros colores"),
      levels: [
        { id: "c1-1", rounds: 5, params: { kind: "color", n: 2, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-2", rounds: 5, params: { kind: "color", n: 3, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-3", rounds: 6, params: { kind: "color", n: 4, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-b", rounds: 6, boss: true, params: { kind: "color", n: 4, palette: "basic" }, skills: ["couleurs"] },
      ] },
    { id: "couleurs-2", tier: "facile", ages: [4, 4], title: L("Toutes les couleurs", "All the colours", "Alle Farben", "Todos los colores"),
      levels: [
        { id: "c2-1", rounds: 6, params: { kind: "color", n: 4, palette: "all" }, skills: ["couleurs"] },
        { id: "c2-2", rounds: 6, params: { kind: "color", n: 5, palette: "all" }, skills: ["couleurs"] },
        { id: "c2-3", rounds: 8, params: { kind: "color", n: 6, palette: "all" }, skills: ["couleurs"] },
        { id: "c2-b", rounds: 8, boss: true, params: { kind: "color", n: 6, palette: "all" }, skills: ["couleurs"] },
      ] },
    { id: "formes", tier: "facile", ages: [5, 5], title: L("Les formes", "Shapes", "Formen", "Las formas"),
      levels: [
        { id: "f-1", rounds: 5, params: { kind: "shape", n: 3, shapes: 3 }, skills: ["formes"] },
        { id: "f-2", rounds: 6, params: { kind: "shape", n: 3, shapes: 6 }, skills: ["formes"] },
        { id: "f-3", rounds: 6, params: { kind: "shape", n: 4, shapes: 6, mixColors: true }, skills: ["formes"] },
        { id: "f-b", rounds: 8, boss: true, params: { kind: "shape", n: 4, shapes: 6, mixColors: true }, skills: ["formes"] },
      ] },
    { id: "compter", tier: "moyen", ages: [6, 6], title: L("Compter jusqu'à 10", "Counting to 10", "Zählen bis 10", "Contar hasta 10"),
      levels: [
        { id: "n-1", rounds: 5, params: { kind: "count", max: 3, n: 3 }, skills: ["compter"] },
        { id: "n-2", rounds: 6, params: { kind: "count", max: 5, n: 3 }, skills: ["compter"] },
        { id: "n-3", rounds: 6, params: { kind: "count", max: 10, n: 3 }, skills: ["compter"] },
        { id: "n-b", rounds: 8, boss: true, params: { kind: "count", max: 10, n: 4 }, skills: ["compter"] },
      ] },
  ],
};

export const couleursGame: GameDef = {
  id: "couleurs",
  icon: "🎈",
  category: "maths",
  ages: [3, 6],
  title: L("Couleurs & formes", "Colours & shapes", "Farben & Formen", "Colores y formas"),
  desc: L("Reconnaître les couleurs, les formes et compter jusqu'à 10, sans savoir lire.", "Recognise colours and shapes and count to 10, no reading needed.", "Farben und Formen erkennen und bis 10 zählen, ganz ohne Lesen.", "Reconocer colores y formas y contar hasta 10, sin saber leer."),
  skills: { couleurs: L("Les couleurs", "Colours", "Farben", "Los colores"), formes: L("Les formes", "Shapes", "Formen", "Las formas"), compter: L("Compter jusqu'à 10", "Counting to 10", "Zählen bis 10", "Contar hasta 10") },
  track: () => TRACK,
  instruction: (level, ctx) => ({
    color: L("Écoute bien, et touche le bon ballon !", "Listen carefully and tap the right balloon!", "Hör gut zu und tipp den richtigen Ballon an!", "¡Escucha bien y toca el globo correcto!"),
    shape: L("Écoute, et touche la bonne forme !", "Listen and tap the right shape!", "Hör zu und tipp die richtige Form an!", "¡Escucha y toca la forma correcta!"),
    count: L("Compte bien les étoiles !", "Count the stars carefully!", "Zähl die Sterne gut!", "¡Cuenta bien las estrellas!"),
  }[level.params.kind as "color" | "shape" | "count"][ctx.lang]),
  start(round, level, ctx) {
    const p = level.params as { kind: string; n: number; palette?: string; shapes?: number; mixColors?: boolean; max?: number };
    const n = round.assist ? Math.max(2, p.n - 1) : p.n;
    const grid = h("div", { class: "cf-grid" });
    round.stage.appendChild(grid);
    let good: HTMLElement | null = null;
    const add = (inner: string, ok: boolean, label: string) => {
      const b = h("button", { class: "cf-item", "aria-label": label });
      b.innerHTML = inner;
      b.style.animationDelay = Math.random() * 1.5 + "s";
      b.onclick = () => { sfx.pop(); if (ok) round.win(b); else round.miss(b); };
      if (ok) good = b;
      grid.appendChild(b);
    };
    if (p.kind === "color") {
      const palette = COLORS.filter((c) => p.palette === "all" || BASIC.includes(c.id));
      const set = shuffle(palette).slice(0, n);
      const goal = pick(set);
      for (const c of set) add(balloon(c.color!), c === goal, c.t[ctx.lang].show);
      round.instruct(colorQuestion(goal.t[ctx.lang].show, ctx.lang));
    } else if (p.kind === "shape") {
      const pool = SHAPES.slice(0, p.shapes);
      const set = shuffle(pool).slice(0, n);
      const goal = pick(set);
      const colors = shuffle(COLORS.filter((c) => !["couleurs.blanc", "couleurs.noir"].includes(c.id)));
      set.forEach((s, i) => add(shapeSvg(s, p.mixColors ? colors[i].color! : "#7048e8"), s === goal, s));
      round.instruct(SHAPE_PHRASE[goal][ctx.lang]);
    } else {
      const nums = shuffle(Array.from({ length: p.max! }, (_, i) => i + 1)).slice(0, n);
      const goal = pick(nums);
      for (const k of nums) add(`<span class="cf-stars">${"⭐".repeat(k)}</span>`, k === goal, String(k));
      round.instruct(countQuestion(goal, ctx.lang));
    }
    round.setHintTarget(() => good);
  },
};
