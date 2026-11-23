// La Mémoire musicale (4-12 ans) : écouter une mélodie d'animaux et la rejouer, de plus en plus longue.
import { L, type LevelDef, type Track } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";

export const PADS = [
  { c: "#ef476f", e: "🐶", f: 523.25 }, { c: "#118ab2", e: "🐱", f: 659.25 }, { c: "#ffd166", e: "🐥", f: 783.99 },
  { c: "#06d6a0", e: "🐸", f: 1046.5 }, { c: "#9775fa", e: "🐮", f: 587.33 }, { c: "#ff922b", e: "🦁", f: 880 },
];

/** Une mélodie : jamais 3 fois la même note de suite. */
export function melody(len: number, pads: number, rng = Math.random): number[] {
  const out: number[] = [];
  while (out.length < len) { const n = Math.floor(rng() * pads); if (out.length >= 2 && out[out.length - 1] === n && out[out.length - 2] === n) continue; out.push(n); }
  return out;
}

function tone(f: number, dur: number) {
  const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!C) return;
  const ac = (tone as unknown as { ac?: AudioContext }).ac ??= new C();
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = "triangle"; o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.05);
}

const lv = (id: string, rounds: number, lengths: number[], pads: number, boss = false): LevelDef => ({ id, rounds, params: { lengths, pads }, boss, skills: ["memoire-auditive"] });

export const TRACK: Track = {
  chapters: [
    { id: "m1", tier: "facile", ages: [4, 5], title: L("Deux, trois notes", "Two, three notes", "Zwei, drei Töne", "Dos, tres notas"), levels: [lv("1-1", 4, [2, 2, 2, 3], 3), lv("1-2", 4, [2, 3, 3, 3], 3), lv("1-b", 4, [3, 3, 3, 3], 4, true)] },
    { id: "m2", tier: "moyen", ages: [6, 7], title: L("Quatre, cinq notes", "Four, five notes", "Vier, fünf Töne", "Cuatro, cinco notas"), levels: [lv("2-1", 4, [3, 4, 4, 4], 4), lv("2-2", 4, [4, 4, 5, 5], 4), lv("2-b", 4, [5, 5, 5, 5], 4, true)] },
    { id: "m3", tier: "difficile", ages: [8, 9], title: L("Six notes", "Six notes", "Sechs Töne", "Seis notas"), levels: [lv("3-1", 4, [5, 5, 6, 6], 5), lv("3-b", 4, [6, 6, 6, 7], 5, true)] },
    { id: "m4", tier: "expert", ages: [10, 12], title: L("Grand orchestre", "Big orchestra", "Großes Orchester", "Gran orquesta"), levels: [lv("4-1", 4, [7, 7, 8, 8], 6), lv("4-b", 4, [8, 9, 9, 10], 6, true)] },
  ],
};

export const melodieGame: GameDef = {
  id: "melodie",
  icon: "🎵",
  category: "creer",
  ages: [4, 12],
  title: L("La mémoire musicale", "Musical memory", "Musik-Gedächtnis", "Memoria musical"),
  desc: L("Écouter une mélodie puis la rejouer dans le même ordre : mémoire auditive et attention.", "Listen to a melody and play it back in the same order: auditory memory and attention.", "Eine Melodie hören und in derselben Reihenfolge nachspielen: Hörgedächtnis und Aufmerksamkeit.", "Escuchar una melodía y repetirla en el mismo orden: memoria auditiva y atención."),
  skills: { "memoire-auditive": L("Mémoire auditive", "Auditory memory", "Hörgedächtnis", "Memoria auditiva") },
  speech: (lang) => [L("Écoute encore une fois.", "Listen once more.", "Hör noch einmal zu.", "Escucha otra vez.")[lang]],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Écoute bien la mélodie, puis rejoue-la !", "Listen to the melody, then play it back!", "Hör dir die Melodie an und spiel sie nach!", "¡Escucha la melodía y luego repítela!")[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { lengths: number[]; pads: number };
    const seq = melody(p.lengths[round.index] ?? p.lengths[p.lengths.length - 1], p.pads);
    let pos = 0, listening = false;
    const wait = (ms: number) => new Promise<void>((r) => round.timeout(r, ms));
    const ear = h("button", { class: "lg-ear big", "aria-label": "🔊" }, "👂");
    const dots = h("div", { class: "k-progress" });
    const grid = h("div", { class: "me-pads", style: { gridTemplateColumns: `repeat(${p.pads <= 4 ? 2 : 3}, 1fr)` } });
    round.stage.appendChild(h("div", { class: "ca-wrap" }, ear, dots, grid));
    const showDots = () => { dots.innerHTML = seq.map((_, i) => `<span class="k-dot${i < pos ? " ok" : ""}"></span>`).join(""); };
    const pads = PADS.slice(0, p.pads).map((pd, i) => {
      const b = h("button", { class: "me-pad", style: { background: pd.c } }, pd.e);
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); press(i); });
      grid.appendChild(b);
      return b;
    });
    const light = (i: number, ms: number) => { pads[i].classList.add("lit"); tone(PADS[i].f, ms / 1000); round.timeout(() => pads[i].classList.remove("lit"), ms); };
    async function play() {
      listening = false; ear.textContent = "👂"; pos = 0; showDots();
      await wait(600);
      const sp = Math.max(380, 700 - seq.length * 30);
      for (const i of seq) { light(i, sp * 0.75); await wait(sp); }
      listening = true; ear.textContent = "🎹";
    }
    ear.onclick = () => { if (listening) play(); };
    function press(i: number) {
      if (!listening) return;
      light(i, 250);
      if (i === seq[pos]) { pos++; showDots(); if (pos === seq.length) { listening = false; round.win(grid, "", { delay: 1300 }); } }
      else { listening = false; round.miss(pads[i], L("Écoute encore une fois.", "Listen once more.", "Hör noch einmal zu.", "Escucha otra vez.")[ctx.lang]); round.timeout(play, 1600); }
    }
    round.setHintTarget(() => (listening ? pads[seq[pos]] : null));
    round.timeout(play, round.index === 0 ? 1800 : 500);
  },
};
