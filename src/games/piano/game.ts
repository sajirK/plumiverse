// Le piano rigolo (3-14 ans), comme en V2 : 8 grandes touches animaux, 4 instruments, on peut glisser le doigt.
import { L, type Track, type Tr } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { audioOut } from "../../audio/sfx";

export const NOTES = [
  { f: 262, c: "#ef476f", a: "🐶" }, { f: 294, c: "#ff9f1c", a: "🐱" }, { f: 330, c: "#ffd166", a: "🐥" }, { f: 349, c: "#06d6a0", a: "🐸" },
  { f: 392, c: "#118ab2", a: "🐮" }, { f: 440, c: "#7b2cbf", a: "🐷" }, { f: 494, c: "#f15bb5", a: "🦁" }, { f: 523, c: "#00bbf9", a: "🐵" },
];
const INSTRUMENTS: { e: string; name: Tr; type: OscillatorType; vibrato: number }[] = [
  { e: "🎹", name: L("le piano", "the piano", "das Klavier", "el piano"), type: "triangle", vibrato: 0 },
  { e: "🤖", name: L("le robot", "the robot", "der Roboter", "el robot"), type: "square", vibrato: 0 },
  { e: "👻", name: L("le fantôme", "the ghost", "das Gespenst", "el fantasma"), type: "sine", vibrato: 12 },
  { e: "🐝", name: L("l'abeille", "the bee", "die Biene", "la abeja"), type: "sawtooth", vibrato: 30 },
];
const DONE = L("Quel joli concert ! Bravo, musicien !", "What a lovely concert! Well done, musician!", "Was für ein schönes Konzert! Super, Musiker!", "¡Qué concierto tan bonito! ¡Bravo, músico!");
export const TRACK: Track = { chapters: [{ id: "p", tier: "facile", ages: [3, 14], title: L("Piano libre", "Free piano", "Freies Klavier", "Piano libre"), levels: [{ id: "libre", rounds: 1, params: {}, skills: ["musique"] }] }] };

export const pianoGame: GameDef = {
  id: "piano",
  icon: "🎹",
  category: "creer",
  free: true,
  ages: [3, 14],
  title: L("Le piano rigolo", "The funny piano", "Das lustige Klavier", "El piano divertido"),
  desc: L("Jouer librement de la musique sur 8 grandes touches, avec 4 instruments rigolos.", "Play music freely on 8 big keys, with 4 funny instruments.", "Frei Musik machen auf 8 großen Tasten, mit 4 lustigen Instrumenten.", "Tocar música libremente con 8 teclas grandes y 4 instrumentos divertidos."),
  skills: { musique: L("Musique", "Music", "Musik", "Música") },
  speech: (lang) => [DONE[lang], ...INSTRUMENTS.map((i) => i.name[lang])],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Touche les grandes touches pour jouer de la musique ! Choisis ton instrument en haut.", "Tap the big keys to play music! Choose your instrument at the top.", "Tipp auf die großen Tasten, um Musik zu machen! Wähl oben dein Instrument.", "¡Toca las teclas grandes para hacer música! Elige tu instrumento arriba.")[ctx.lang],
  start(round, _level, ctx) {
    const lang = ctx.lang;
    let instr = INSTRUMENTS[0];
    const bar = h("div", { class: "pi-instr" }), keys = h("div", { class: "pi-keys" });
    const done = h("button", { class: "k-btn primary pi-done", "aria-label": "✅" }, "✅");
    done.onclick = () => { if (!round.ended) round.win(null, DONE[lang], { praise: false, delay: 2200 }); };
    round.stage.appendChild(h("div", { class: "pi-wrap" }, h("div", { class: "row" }, bar, done), keys));
    function play(f: number) {
      const o = audioOut(); if (!o) return;
      const { ac, out } = o, t = ac.currentTime, g = ac.createGain(), filter = ac.createBiquadFilter();
      filter.type = "lowpass"; filter.frequency.value = instr.type === "sine" || instr.type === "triangle" ? 5000 : 1400;
      filter.connect(g).connect(out);
      const partials = instr.type === "triangle" ? [[1, 1], [2, 0.3], [3, 0.1]] : [[1, 1]];
      for (const [mult, amp] of partials) {
        const osc = ac.createOscillator();
        osc.type = instr.type === "triangle" ? "sine" : instr.type; osc.frequency.value = f * mult;
        if (instr.vibrato) { const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 6; lg.gain.value = instr.vibrato; lfo.connect(lg).connect(osc.frequency); lfo.start(t); lfo.stop(t + 1.3); }
        const og = ac.createGain(); og.gain.value = amp; osc.connect(og).connect(filter); osc.start(t); osc.stop(t + 1.3);
      }
      const vol = instr.type === "triangle" || instr.type === "sine" ? 0.32 : 0.14;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    }
    INSTRUMENTS.forEach((m, i) => {
      const b = h("button", { class: i ? "" : "active", "aria-label": m.name[lang] }, m.e);
      b.onclick = () => { instr = m; bar.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b)); round.say(m.name[lang]); play(NOTES[4].f); };
      bar.appendChild(b);
    });
    const keyEls = NOTES.map((n, i) => { const k = h("div", { class: "pi-key", style: { background: n.c } }, h("span", {}, n.a)); k.dataset.i = String(i); keys.appendChild(k); return k; });
    const active = new Map<number, HTMLElement | null>();
    const keyAt = (e: PointerEvent) => (document.elementFromPoint(e.clientX, e.clientY)?.closest(".pi-key") as HTMLElement) ?? null;
    function press(k: HTMLElement, e: PointerEvent) {
      const n = NOTES[+k.dataset.i!];
      play(n.f);
      k.classList.add("down"); round.timeout(() => k.classList.remove("down"), 150);
      const note = h("div", { class: "pi-note", style: { left: e.clientX - 20 + "px", top: e.clientY - 40 + "px" } }, ["🎵", "🎶", n.a][Math.floor(Math.random() * 3)]);
      document.body.appendChild(note); setTimeout(() => note.remove(), 1200);
    }
    keys.addEventListener("pointerdown", (e) => { e.preventDefault(); const k = keyAt(e); active.set(e.pointerId, k); if (k) press(k, e); });
    keys.addEventListener("pointermove", (e) => { if (!active.has(e.pointerId)) return; const k = keyAt(e); if (k && k !== active.get(e.pointerId)) press(k, e); active.set(e.pointerId, k); });
    const stop = (e: PointerEvent) => active.delete(e.pointerId);
    keys.addEventListener("pointerup", stop); keys.addEventListener("pointercancel", stop);
    void keyEls;
    round.setHintTarget(() => done);
  },
};
