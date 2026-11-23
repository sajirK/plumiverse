// Le dessin (3-14 ans), comme en V2 : dessiner au doigt, 8 couleurs, l'arc-en-ciel, des tampons, la gomme.
import { L, type Track, type Tr } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { wordsOfUnit } from "../../content/lang/course";

const COLOR_WORDS = wordsOfUnit("couleurs");
const COLORS: [string, string][] = [["#ef476f", "couleurs.rose"], ["#ff9f1c", "couleurs.orange"], ["#ffd166", "couleurs.jaune"], ["#06d6a0", "couleurs.vert"], ["#118ab2", "couleurs.bleu"], ["#7b2cbf", "couleurs.violet"], ["#8d5524", "couleurs.marron"], ["#222222", "couleurs.noir"]];
const STAMPS: [string, Tr][] = [["⭐", L("l'étoile", "the star", "der Stern", "la estrella")], ["❤️", L("le cœur", "the heart", "das Herz", "el corazón")], ["🌸", L("la fleur", "the flower", "die Blume", "la flor")], ["🐱", L("le chat", "the cat", "die Katze", "el gato")], ["🚗", L("la voiture", "the car", "das Auto", "el coche")], ["🦖", L("le dinosaure", "the dinosaur", "der Dinosaurier", "el dinosaurio")]];
const SAY = {
  rainbow: L("l'arc-en-ciel", "the rainbow", "der Regenbogen", "el arcoíris"),
  eraser: L("la gomme", "the eraser", "der Radiergummi", "la goma"),
  clear: L("Tout propre !", "All clean!", "Alles sauber!", "¡Todo limpio!"),
  done: L("Quel beau dessin ! Bravo, artiste !", "What a lovely drawing! Well done, artist!", "Was für ein schönes Bild! Super, Künstler!", "¡Qué dibujo tan bonito! ¡Bravo, artista!"),
};
export const TRACK: Track = { chapters: [{ id: "d", tier: "facile", ages: [3, 14], title: L("Dessin libre", "Free drawing", "Freies Malen", "Dibujo libre"), levels: [{ id: "libre", rounds: 1, params: {}, skills: ["creer"] }] }] };

export const dessinGame: GameDef = {
  id: "dessin",
  icon: "🎨",
  category: "creer",
  free: true,
  ages: [3, 14],
  title: L("Le dessin", "Drawing", "Malen", "El dibujo"),
  desc: L("Dessiner librement au doigt avec des couleurs, un arc-en-ciel, des tampons et une gomme.", "Draw freely with your finger: colours, a rainbow, stamps and an eraser.", "Frei mit dem Finger malen: Farben, Regenbogen, Stempel und Radiergummi.", "Dibujar libremente con el dedo: colores, arcoíris, sellos y goma."),
  skills: { creer: L("Créer", "Creating", "Gestalten", "Crear") },
  speech: (lang) => [...Object.values(SAY).map((x) => x[lang]), ...STAMPS.map(([, n]) => n[lang]), ...COLOR_WORDS.map((c) => c.t[lang].show)],
  track: () => TRACK,
  instruction: (_l, ctx) => L("Choisis une couleur ou un autocollant, puis dessine avec ton doigt ! Quand tu as fini, appuie sur le bouton vert.", "Choose a colour or a sticker, then draw with your finger! When you're done, press the green button.", "Wähl eine Farbe oder einen Stempel und mal mit dem Finger! Wenn du fertig bist, drück auf den grünen Knopf.", "¡Elige un color o una pegatina y dibuja con el dedo! Cuando termines, pulsa el botón verde.")[ctx.lang],
  start(round, _level, ctx) {
    const lang = ctx.lang;
    const canvas = h("canvas", { class: "ds-canvas" }) as HTMLCanvasElement;
    const tools = h("div", { class: "ds-tools" });
    round.stage.appendChild(h("div", { class: "ds-paint" }, canvas, tools));
    const c2 = canvas.getContext("2d")!;
    let mode: { type: string; value?: string } = { type: "color", value: COLORS[0][0] }, hue = 0;
    function resize() {
      const d = devicePixelRatio || 1, r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const old = document.createElement("canvas"); old.width = canvas.width; old.height = canvas.height;
      if (canvas.width) old.getContext("2d")!.drawImage(canvas, 0, 0);
      canvas.width = r.width * d; canvas.height = r.height * d; c2.setTransform(d, 0, 0, d, 0, 0);
      if (old.width) c2.drawImage(old, 0, 0, old.width / d, old.height / d);
    }
    const addTool = (content: string, m: { type: string; value?: string }, bg: string | null, name: string) => {
      const b = h("button", { class: "ds-tool", "aria-label": name, ...(bg ? { style: { background: bg } } : {}) }, content);
      b.onclick = () => {
        sfx.click();
        if (m.type === "clear") { c2.clearRect(0, 0, canvas.width, canvas.height); round.say(SAY.clear[lang]); return; }
        mode = m; tools.querySelectorAll(".ds-tool").forEach((t) => t.classList.remove("active")); b.classList.add("active"); round.say(name);
      };
      tools.appendChild(b); return b;
    };
    COLORS.forEach(([c, id], i) => { const b = addTool("", { type: "color", value: c }, c, COLOR_WORDS.find((w) => w.id === id)?.t[lang].show ?? ""); if (!i) b.classList.add("active"); });
    addTool("🌈", { type: "rainbow" }, null, SAY.rainbow[lang]);
    STAMPS.forEach(([s, n]) => addTool(s, { type: "stamp", value: s }, null, n[lang]));
    addTool("🧽", { type: "eraser" }, null, SAY.eraser[lang]);
    addTool("🗑️", { type: "clear" }, null, SAY.clear[lang]);
    const done = h("button", { class: "ds-tool ds-done", "aria-label": "✅" }, "✅");
    done.onclick = () => { if (!round.ended) round.win(null, SAY.done[lang], { praise: false, delay: 2200 }); };
    tools.appendChild(done);
    const pointers = new Map<number, { x: number; y: number }>();
    const pos = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const size = () => Math.max(10, Math.min(canvas.clientWidth, canvas.clientHeight) / 40);
    function style() {
      c2.globalCompositeOperation = mode.type === "eraser" ? "destination-out" : "source-over";
      let col = mode.value ?? "#000";
      if (mode.type === "rainbow") { hue = (hue + 4) % 360; col = `hsl(${hue},90%,55%)`; }
      c2.strokeStyle = c2.fillStyle = col;
      c2.lineWidth = mode.type === "eraser" ? size() * 3 : size();
      c2.lineCap = c2.lineJoin = "round";
    }
    canvas.addEventListener("pointerdown", (e) => {
      try { canvas.setPointerCapture(e.pointerId); } catch { /* simulé */ }
      const p = pos(e);
      if (mode.type === "stamp") { c2.globalCompositeOperation = "source-over"; c2.font = `${size() * 4}px serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(mode.value!, p.x, p.y); sfx.pop(); return; }
      pointers.set(e.pointerId, p);
      style(); c2.beginPath(); c2.arc(p.x, p.y, c2.lineWidth / 2, 0, Math.PI * 2); c2.fill();
    });
    canvas.addEventListener("pointermove", (e) => {
      const last = pointers.get(e.pointerId);
      if (!last) return;
      const p = pos(e);
      style(); c2.beginPath(); c2.moveTo(last.x, last.y); c2.lineTo(p.x, p.y); c2.stroke();
      pointers.set(e.pointerId, p);
    });
    const end = (e: PointerEvent) => pointers.delete(e.pointerId);
    canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    const ro = new ResizeObserver(resize); ro.observe(canvas); round.onCleanup(() => ro.disconnect());
    requestAnimationFrame(resize);
    round.setHintTarget(() => done);
  },
};
