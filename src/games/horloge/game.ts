// Quelle heure est-il ? (5-11 ans) : on entend l'heure et on touche la bonne horloge, puis on règle les aiguilles.
// L'heure dite est juste dans les 4 langues (« halb vier » = 3 h 30 en allemand, « es la una » en espagnol…).
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, randInt, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export type M = 0 | 15 | 30 | 45;

/** L'heure en mots (h de 1 à 11, et h+1 ≤ 11 pour « moins le quart »). */
export function timeWords(hr: number, m: M, lang: Lang): string {
  const next = hr + 1;
  if (lang === "fr") {
    const H = (n: number) => (n === 1 ? "une heure" : `${numberWords(n, "fr")} heures`);
    return m === 0 ? `Il est ${H(hr)}.` : m === 30 ? `Il est ${H(hr)} et demie.` : m === 15 ? `Il est ${H(hr)} et quart.` : `Il est ${H(next)} moins le quart.`;
  }
  if (lang === "en") {
    const w = (n: number) => numberWords(n, "en");
    return m === 0 ? `It's ${w(hr)} o'clock.` : m === 30 ? `It's half past ${w(hr)}.` : m === 15 ? `It's quarter past ${w(hr)}.` : `It's quarter to ${w(next)}.`;
  }
  if (lang === "de") {
    const w = (n: number) => numberWords(n, "de"); // eins, zwei…
    return m === 0 ? `Es ist ${hr === 1 ? "ein" : w(hr)} Uhr.` : m === 30 ? `Es ist halb ${w(next)}.` : m === 15 ? `Es ist Viertel nach ${w(hr)}.` : `Es ist Viertel vor ${w(next)}.`;
  }
  const es = (n: number) => (n === 1 ? "la una" : `las ${numberWords(n, "es")}`);
  const verb = (n: number) => (n === 1 ? "Es" : "Son");
  return m === 0 ? `${verb(hr)} ${es(hr)}.` : m === 30 ? `${verb(hr)} ${es(hr)} y media.` : m === 15 ? `${verb(hr)} ${es(hr)} y cuarto.` : `${verb(next)} ${es(next)} menos cuarto.`;
}

export const angles = (hr: number, m: number) => ({ hour: (hr % 12) * 30 + m * 0.5, minute: m * 6 });

export function randomTime(mins: M[], rng: Rng = Math.random): { hr: number; m: M } {
  const m = pick(mins, rng);
  return { hr: randInt(1, m === 45 ? 10 : 11, rng), m };
}

/** Choix d'horloges : la bonne + des pièges classiques (aiguilles inversées, heure d'à côté). */
export function clockChoices(t: { hr: number; m: M }, mins: M[], n: number, rng: Rng = Math.random) {
  const key = (x: { hr: number; m: M }) => `${x.hr}:${x.m}`;
  const set = new Map([[key(t), t]]);
  const cands: { hr: number; m: M }[] = [{ hr: t.hr === 11 ? 10 : t.hr + 1, m: t.m }, { hr: t.hr === 1 ? 2 : t.hr - 1, m: t.m }, ...mins.filter((m) => m !== t.m).map((m) => ({ hr: t.hr, m }))];
  for (const c of shuffle(cands, rng)) { if (set.size >= n) break; if (c.hr >= 1 && c.hr <= 11 && !(c.m === 45 && c.hr > 10)) set.set(key(c), c); }
  while (set.size < n) { const c = randomTime(mins, rng); set.set(key(c), c); }
  return shuffle([...set.values()], rng);
}

function clockSvg(hr: number, m: number, numbers: boolean) {
  let s = `<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="140" fill="#fff" stroke="#ff922b" stroke-width="12"/>`;
  for (let i = 0; i < 60; i += numbers ? 1 : 5) { const a = (i * 6 * Math.PI) / 180, big = i % 5 === 0; s += `<line x1="${150 + Math.sin(a) * (big ? 116 : 124)}" y1="${150 - Math.cos(a) * (big ? 116 : 124)}" x2="${150 + Math.sin(a) * 130}" y2="${150 - Math.cos(a) * 130}" stroke="${big ? "#495057" : "#ced4da"}" stroke-width="${big ? 5 : 2}"/>`; }
  for (let n = 1; n <= 12; n++) { if (!numbers && n % 3) continue; const a = (n * 30 * Math.PI) / 180; s += `<text x="${150 + Math.sin(a) * 96}" y="${150 - Math.cos(a) * 96 + 12}" text-anchor="middle" font-size="34" font-weight="bold" fill="${n % 3 === 0 ? "#f76707" : "#343a40"}">${n}</text>`; }
  const g = angles(hr, m);
  s += `<rect class="hand hh" x="143" y="80" width="14" height="78" rx="7" fill="#364fc7" style="transform-origin:150px 150px;transform:rotate(${g.hour}deg)"/>`;
  s += `<rect class="hand mh" x="146" y="36" width="8" height="122" rx="4" fill="#f03e3e" style="transform-origin:150px 150px;transform:rotate(${g.minute}deg)"/>`;
  return s + `<circle cx="150" cy="150" r="11" fill="#343a40"/></svg>`;
}

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [String(params.skill ?? "heures")] });

export const TRACK: Track = {
  chapters: [
    { id: "h1", tier: "facile", ages: [5, 6], title: L("Les heures pile", "O'clock", "Volle Stunden", "Las horas en punto"), levels: [lv("1-1", 5, { mins: [0], n: 3, skill: "heures" }), lv("1-2", 5, { mins: [0], n: 4, skill: "heures" }), lv("1-b", 6, { mins: [0], n: 4, skill: "heures" }, true)] },
    { id: "h2", tier: "moyen", ages: [7, 7], title: L("Et demie", "Half past", "Halb", "Y media"), levels: [lv("2-1", 6, { mins: [0, 30], n: 3, skill: "demies" }), lv("2-2", 6, { mins: [30], n: 4, skill: "demies" }), lv("2-b", 6, { mins: [0, 30], n: 4, skill: "demies" }, true)] },
    { id: "h3", tier: "difficile", ages: [8, 9], title: L("Et quart, moins le quart", "Quarter past, quarter to", "Viertel nach, Viertel vor", "Y cuarto, menos cuarto"), levels: [lv("3-1", 6, { mins: [15, 45], n: 4, skill: "quarts" }), lv("3-2", 6, { mins: [0, 15, 30, 45], n: 4, skill: "quarts" }), lv("3-b", 8, { mins: [0, 15, 30, 45], n: 4, skill: "quarts" }, true)] },
    { id: "h4", tier: "expert", ages: [10, 11], title: L("Je règle l'horloge", "Set the clock", "Ich stelle die Uhr", "Pongo el reloj en hora"), levels: [lv("4-1", 5, { mins: [0, 30], set: true, skill: "regler" }), lv("4-2", 5, { mins: [0, 15, 30, 45], set: true, skill: "regler" }), lv("4-b", 6, { mins: [0, 15, 30, 45], set: true, skill: "regler" }, true)] },
  ],
};

export const horlogeGame: GameDef = {
  id: "horloge",
  icon: "🕰️",
  category: "maths",
  ages: [5, 11],
  title: L("Quelle heure est-il ?", "What time is it?", "Wie spät ist es?", "¿Qué hora es?"),
  desc: L("Lire l'heure sur une horloge à aiguilles : heures pile, et demie, et quart, moins le quart, puis régler soi-même les aiguilles.", "Read an analogue clock: o'clock, half past, quarter past, quarter to, then set the hands yourself.", "Die Uhr lesen: volle Stunden, halb, Viertel nach, Viertel vor, dann die Zeiger selbst stellen.", "Leer un reloj de agujas: en punto, y media, y cuarto, menos cuarto y luego mover las agujas."),
  skills: { heures: L("Les heures pile", "O'clock", "Volle Stunden", "Las horas en punto"), demies: L("Les demi-heures", "Half past", "Halbe Stunden", "Las medias horas"), quarts: L("Les quarts d'heure", "Quarters", "Viertelstunden", "Los cuartos"), regler: L("Régler l'horloge", "Setting the clock", "Die Uhr stellen", "Poner el reloj en hora") },
  speech: (lang) => [
    ...Array.from({ length: 11 }, (_, i) => i + 1).flatMap((hr) => ([0, 15, 30, 45] as M[]).filter((m) => !(m === 45 && hr > 10)).map((m) => timeWords(hr, m, lang))),
    ...[L("La petite aiguille bleue montre l'heure, la grande rouge les minutes.", "The short blue hand shows the hour, the long red one the minutes.", "Der kurze blaue Zeiger zeigt die Stunde, der lange rote die Minuten.", "La aguja corta azul marca la hora y la larga roja los minutos."), L("Regarde d'abord la grande aiguille rouge.", "Check the long red hand first.", "Schau zuerst auf den langen roten Zeiger.", "Mira primero la aguja larga roja."), L("Maintenant, la petite aiguille bleue.", "Now the short blue hand.", "Jetzt der kurze blaue Zeiger.", "Ahora la aguja corta azul.")].map((x) => x[lang]),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.set
    ? L("Écoute l'heure, et tourne les aiguilles.", "Listen to the time and turn the hands.", "Hör dir die Uhrzeit an und dreh die Zeiger.", "Escucha la hora y mueve las agujas.")
    : L("Écoute l'heure, et touche la bonne horloge !", "Listen to the time and tap the right clock!", "Hör dir die Uhrzeit an und tipp die richtige Uhr an!", "¡Escucha la hora y toca el reloj correcto!"))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { mins: M[]; n?: number; set?: boolean };
    const t = randomTime(p.mins);
    const said = timeWords(t.hr, t.m, ctx.lang);
    const wrap = h("div", { class: "ca-wrap" });
    round.stage.appendChild(wrap);
    const ear = h("button", { class: "lg-ear big", "aria-label": said }, "🔊");
    ear.onclick = () => { sfx.tap(); round.say(said); };
    if (!p.set) {
      const grid = h("div", { class: "ho-clocks" });
      let good: HTMLElement | null = null;
      for (const c of clockChoices(t, p.mins, round.assist ? 2 : p.n ?? 3)) {
        const b = h("button", { class: "ho-clock" });
        b.innerHTML = clockSvg(c.hr, c.m, ctx.band !== "3-5");
        const ok = c.hr === t.hr && c.m === t.m;
        if (ok) good = b;
        b.onclick = () => (ok ? round.win(b) : round.miss(b, L("La petite aiguille bleue montre l'heure, la grande rouge les minutes.", "The short blue hand shows the hour, the long red one the minutes.", "Der kurze blaue Zeiger zeigt die Stunde, der lange rote die Minuten.", "La aguja corta azul marca la hora y la larga roja los minutos.")[ctx.lang]));
        grid.appendChild(b);
      }
      wrap.append(ear, grid);
      round.setHintTarget(() => good);
      round.instruct(said);
      return;
    }
    // régler : la grande aiguille avance d'un quart d'heure, la petite d'une heure
    let hr = 12, m = 0;
    const big = h("div", { class: "ho-big" });
    big.innerHTML = clockSvg(12, 0, true);
    const draw = () => { const g = angles(hr, m); (big.querySelector(".hh") as SVGElement).style.transform = `rotate(${g.hour}deg)`; (big.querySelector(".mh") as SVGElement).style.transform = `rotate(${g.minute}deg)`; };
    const mBtn = h("button", { class: "co-arrow ho-m", "aria-label": "minutes" }, "🔴↻") as HTMLButtonElement;
    const hBtn = h("button", { class: "co-arrow ho-h", "aria-label": "hours" }, "🔵↻") as HTMLButtonElement;
    const ok = h("button", { class: "act-btn go", "aria-label": "OK" }, "✅") as HTMLButtonElement;
    mBtn.onclick = () => { sfx.tap(); m = ((m + 15) % 60) as M; draw(); };
    hBtn.onclick = () => { sfx.tap(); hr = (hr % 12) + 1; draw(); };
    ok.onclick = () => (hr === t.hr && m === t.m ? round.win(big) : round.miss(big, (m !== t.m ? L("Regarde d'abord la grande aiguille rouge.", "Check the long red hand first.", "Schau zuerst auf den langen roten Zeiger.", "Mira primero la aguja larga roja.") : L("Maintenant, la petite aiguille bleue.", "Now the short blue hand.", "Jetzt der kurze blaue Zeiger.", "Ahora la aguja corta azul."))[ctx.lang]));
    wrap.append(h("div", { class: "row" }, ear, big), h("div", { class: "row" }, mBtn, hBtn, ok));
    round.setHintTarget(() => (m !== t.m ? mBtn : hr !== t.hr ? hBtn : ok));
    round.instruct(said);
  },
};
