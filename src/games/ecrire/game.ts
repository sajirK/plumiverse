// Écrire (3-9 ans) : traits → lettres en bâtons → lettres rondes → chiffres → premiers mots → écrire sans modèle.
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { cleanName } from "../../core/profile";
import { shuffle } from "../../core/util";
import type { GameDef, GameCtx } from "../types";
import type { RoundApi } from "../../kit/kit";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import * as G from "./glyphs";

type Pt = G.Pt;
const { stroke, L: Ln, A } = G;

/** Les traits du 1er chapitre (un seul trait chacun). */
const TRAITS: Record<string, Pt[][]> = {
  "|": [stroke(Ln(50, 10, 50, 110))],
  "—": [stroke(Ln(10, 60, 90, 60))],
  "\\": [stroke(Ln(15, 10, 85, 110))],
  "/": [stroke(Ln(85, 10, 15, 110))],
  "○": [stroke(A(50, 60, 38, 46, -90, -450))],
  "ᴗ": [stroke(A(50, 45, 36, 50, 180, 0))],
};

/** Mots simples (sans accent : le tracé connaît A-Z) avec image, et la façon de les dire. */
export const WORDS: Record<Lang, { short: [string, string, string][]; long: [string, string, string][] }> = {
  fr: {
    short: [["LIT", "🛏️", "lit"], ["BUS", "🚌", "bus"], ["NEZ", "👃", "nez"], ["ROI", "👑", "roi"], ["CHAT", "🐱", "chat"], ["LUNE", "🌙", "lune"], ["LAIT", "🥛", "lait"], ["PAIN", "🍞", "pain"], ["OURS", "🐻", "ours"], ["ROBE", "👗", "robe"]],
    long: [["POMME", "🍎", "pomme"], ["LAPIN", "🐰", "lapin"], ["FLEUR", "🌼", "fleur"], ["MOUTON", "🐑", "mouton"], ["CANARD", "🦆", "canard"], ["TOMATE", "🍅", "tomate"]],
  },
  en: {
    short: [["CAT", "🐱", "cat"], ["DOG", "🐶", "dog"], ["SUN", "☀️", "sun"], ["BUS", "🚌", "bus"], ["HAT", "🎩", "hat"], ["BED", "🛏️", "bed"], ["PIG", "🐷", "pig"], ["CAR", "🚗", "car"], ["FISH", "🐟", "fish"], ["MOON", "🌙", "moon"]],
    long: [["APPLE", "🍎", "apple"], ["HOUSE", "🏠", "house"], ["TRAIN", "🚂", "train"], ["CHAIR", "🪑", "chair"], ["HORSE", "🐴", "horse"], ["PIZZA", "🍕", "pizza"]],
  },
  de: {
    short: [["OMA", "👵", "Oma"], ["OPA", "👴", "Opa"], ["EI", "🥚", "Ei"], ["BUS", "🚌", "Bus"], ["HUT", "🎩", "Hut"], ["KUH", "🐮", "Kuh"], ["AUTO", "🚗", "Auto"], ["BALL", "⚽", "Ball"], ["HAUS", "🏠", "Haus"], ["MOND", "🌙", "Mond"]],
    long: [["APFEL", "🍎", "Apfel"], ["PFERD", "🐴", "Pferd"], ["BLUME", "🌼", "Blume"], ["KATZE", "🐱", "Katze"], ["TOMATE", "🍅", "Tomate"], ["PIZZA", "🍕", "Pizza"]],
  },
  es: {
    short: [["SOL", "☀️", "sol"], ["OSO", "🐻", "oso"], ["PAN", "🍞", "pan"], ["MAR", "🌊", "mar"], ["LUNA", "🌙", "luna"], ["GATO", "🐱", "gato"], ["PATO", "🦆", "pato"], ["VACA", "🐮", "vaca"], ["CASA", "🏠", "casa"], ["TREN", "🚂", "tren"]],
    long: [["PERRO", "🐶", "perro"], ["FRESA", "🍓", "fresa"], ["PELOTA", "⚽", "pelota"], ["ZAPATO", "👟", "zapato"], ["TOMATE", "🍅", "tomate"], ["CABALLO", "🐴", "caballo"]],
  },
};

const TOL = { facile: 18, moyen: 14, difficile: 12, expert: 10 };
const LETTER_NAME: Record<Lang, Record<string, string>> = {
  fr: { A: "a", B: "bé", C: "cé", D: "dé", E: "e", F: "effe", G: "gé", H: "hache", I: "i", J: "ji", K: "ka", L: "elle", M: "emme", N: "enne", O: "o", P: "pé", Q: "ku", R: "erre", S: "esse", T: "té", U: "u", V: "vé", W: "double vé", X: "ixe", Y: "i grec", Z: "zède" },
  en: { A: "A", B: "B", C: "C", D: "D", E: "E", F: "F", G: "G", H: "H", I: "I", J: "J", K: "K", L: "L", M: "M", N: "N", O: "O", P: "P", Q: "Q", R: "R", S: "S", T: "T", U: "U", V: "V", W: "W", X: "X", Y: "Y", Z: "Z" },
  de: { A: "A", B: "B", C: "C", D: "D", E: "E", F: "F", G: "G", H: "H", I: "I", J: "Jott", K: "K", L: "L", M: "M", N: "N", O: "O", P: "P", Q: "Q", R: "R", S: "S", T: "T", U: "U", V: "Vau", W: "We", X: "X", Y: "Ypsilon", Z: "Zett" },
  es: { A: "a", B: "be", C: "ce", D: "de", E: "e", F: "efe", G: "ge", H: "hache", I: "i", J: "jota", K: "ka", L: "ele", M: "eme", N: "ene", O: "o", P: "pe", Q: "cu", R: "erre", S: "ese", T: "te", U: "u", V: "uve", W: "uve doble", X: "equis", Y: "i griega", Z: "zeta" },
};
const DIGIT_NAME: Record<Lang, string[]> = {
  fr: ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"],
  en: ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"],
  de: ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun"],
  es: ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"],
};

const lv = (id: string, rounds: number, params: Record<string, unknown>, extra: Partial<LevelDef> = {}): LevelDef => ({ id, rounds, params, ...extra });

export const TRACK: Track = {
  chapters: [
    { id: "traits", tier: "facile", ages: [3, 3], title: L("Les traits", "Lines", "Striche", "Los trazos"), levels: [
      lv("t-1", 3, { kind: "trace", set: ["|", "—", "|"] }, { skills: ["graphisme"] }),
      lv("t-2", 4, { kind: "trace", set: ["\\", "/", "—", "|"] }, { skills: ["graphisme"] }),
      lv("t-3", 4, { kind: "trace", set: ["○", "ᴗ", "○", "ᴗ"] }, { skills: ["graphisme"] }),
      lv("t-b", 5, { kind: "trace", set: ["|", "—", "/", "○", "ᴗ"] }, { boss: true, skills: ["graphisme"] }),
    ] },
    { id: "batons", tier: "facile", ages: [4, 4], title: L("Lettres en bâtons", "Straight letters", "Gerade Buchstaben", "Letras rectas"), levels: [
      lv("b-1", 3, { kind: "trace", set: ["I", "L", "T"] }, { skills: ["lettres-batons"] }),
      lv("b-2", 3, { kind: "trace", set: ["H", "E", "F"] }, { skills: ["lettres-batons"] }),
      lv("b-3", 4, { kind: "trace", set: ["A", "V", "N", "M"] }, { skills: ["lettres-batons"] }),
      lv("b-4", 4, { kind: "trace", set: ["K", "W", "X", "Z", "Y"], pick: 4 }, { skills: ["lettres-batons"] }),
      lv("b-b", 5, { kind: "trace", set: ["I", "L", "T", "H", "E", "F", "A", "V", "N", "M"], pick: 5 }, { boss: true, skills: ["lettres-batons"] }),
    ] },
    { id: "rondes", tier: "moyen", ages: [5, 5], title: L("Lettres rondes", "Round letters", "Runde Buchstaben", "Letras redondas"), levels: [
      lv("r-1", 3, { kind: "trace", set: ["O", "C", "U"] }, { skills: ["lettres-rondes"] }),
      lv("r-2", 4, { kind: "trace", set: ["D", "P", "B", "R"] }, { skills: ["lettres-rondes"] }),
      lv("r-3", 4, { kind: "trace", set: ["S", "G", "J", "Q"] }, { skills: ["lettres-rondes"] }),
      lv("r-b", 5, { kind: "trace", set: ["O", "C", "U", "D", "P", "B", "R", "S", "G", "J"], pick: 5 }, { boss: true, skills: ["lettres-rondes"] }),
    ] },
    { id: "chiffres", tier: "moyen", ages: [5, 6], title: L("Les chiffres", "Numbers", "Die Ziffern", "Los números"), levels: [
      lv("d-1", 4, { kind: "trace", set: ["0", "1", "2", "3"] }, { skills: ["chiffres"] }),
      lv("d-2", 3, { kind: "trace", set: ["4", "5", "6"] }, { skills: ["chiffres"] }),
      lv("d-3", 3, { kind: "trace", set: ["7", "8", "9"] }, { skills: ["chiffres"] }),
      lv("d-b", 5, { kind: "trace", set: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"], pick: 5 }, { boss: true, skills: ["chiffres"] }),
    ] },
    { id: "mots", tier: "difficile", ages: [6, 6], title: L("Mes premiers mots", "My first words", "Meine ersten Wörter", "Mis primeras palabras"), levels: [
      lv("m-1", 2, { kind: "word", list: "name" }, { skills: ["mots"] }),
      lv("m-2", 3, { kind: "word", list: "short" }, { skills: ["mots"] }),
      lv("m-3", 3, { kind: "word", list: "short" }, { skills: ["mots"] }),
      lv("m-b", 3, { kind: "word", list: "short" }, { boss: true, skills: ["mots"] }),
    ] },
    { id: "orthographe", tier: "difficile", ages: [7, 9], title: L("Écrire sans modèle", "Spelling", "Schreiben ohne Vorlage", "Escribir sin modelo"), levels: [
      lv("o-1", 5, { kind: "spell", list: "short", extra: 0 }, { skills: ["orthographe"] }),
      lv("o-2", 5, { kind: "spell", list: "short", extra: 2 }, { skills: ["orthographe"] }),
      lv("o-3", 5, { kind: "spell", list: "long", extra: 1 }, { skills: ["orthographe"] }),
      lv("o-b", 6, { kind: "spell", list: "long", extra: 3 }, { boss: true, skills: ["orthographe"] }),
    ] },
  ],
};

/** Ce que l'on trace ou écrit à chaque manche (tiré une fois par niveau). */
interface Session { items: string[]; words: [string, string, string][] }

function nameWord(ctx: GameCtx): [string, string, string] | null {
  const w = cleanName(ctx.profile.name).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
  return w.length >= 2 && w.length <= 8 ? [w, ctx.profile.avatar, ctx.profile.name] : null;
}

export const ecrireGame: GameDef = {
  id: "ecrire",
  icon: "✏️",
  category: "lire-ecrire",
  ages: [3, 9],
  title: L("Écrire", "Writing", "Schreiben", "Escribir"),
  desc: L("Tracer les traits, les lettres et les chiffres dans le bon sens, puis écrire ses premiers mots et les écrire sans modèle.", "Trace lines, letters and numbers the right way, then write first words, then spell them without a model.", "Striche, Buchstaben und Ziffern richtig nachspuren, dann erste Wörter schreiben und ohne Vorlage schreiben.", "Trazar líneas, letras y números en el buen sentido, escribir las primeras palabras y luego escribirlas sin modelo."),
  skills: {
    graphisme: L("Tenir le trait", "Pen control", "Stifthaltung und Striche", "Control del trazo"),
    "lettres-batons": L("Lettres en bâtons", "Straight letters", "Gerade Buchstaben", "Letras rectas"),
    "lettres-rondes": L("Lettres rondes", "Round letters", "Runde Buchstaben", "Letras redondas"),
    chiffres: L("Écrire les chiffres", "Writing numbers", "Ziffern schreiben", "Escribir los números"),
    mots: L("Écrire des mots", "Writing words", "Wörter schreiben", "Escribir palabras"),
    orthographe: L("Orthographe", "Spelling", "Rechtschreibung", "Ortografía"),
  },
  track: () => TRACK,
  instruction: (level, ctx) => ({
    trace: L("Suis le chemin gris avec ton doigt. Commence au point vert !", "Follow the grey path with your finger. Start at the green dot!", "Fahr mit dem Finger den grauen Weg nach. Fang beim grünen Punkt an!", "Sigue el camino gris con el dedo. ¡Empieza en el punto verde!"),
    word: L("Écris le mot, lettre par lettre.", "Write the word, letter by letter.", "Schreib das Wort, Buchstabe für Buchstabe.", "Escribe la palabra, letra por letra."),
    spell: L("Écoute le mot, et écris-le avec les lettres.", "Listen to the word and spell it with the letters.", "Hör dir das Wort an und schreib es mit den Buchstaben.", "Escucha la palabra y escríbela con las letras."),
  }[level.params.kind as "trace" | "word" | "spell"][ctx.lang]),
  setup(level, ctx): Session {
    const p = level.params as { set?: string[]; pick?: number; list?: string };
    if (p.set) return { items: (p.pick ? shuffle(p.set).slice(0, p.pick) : p.set).slice(0, level.rounds), words: [] };
    const lists = WORDS[ctx.lang];
    let words = shuffle(p.list === "long" ? lists.long : lists.short).slice(0, level.rounds);
    if (p.list === "name") { const n = nameWord(ctx); words = shuffle(lists.short).slice(0, level.rounds); if (n) words[0] = n; }
    return { items: [], words };
  },
  start(round, level, ctx) {
    const p = level.params as { kind: string; extra?: number };
    const s = round.session as Session;
    const tol = round.assist ? TOL.facile + 4 : TOL[(ctx.band === "3-5" ? "facile" : TRACK.chapters.find((c) => c.levels.includes(level))?.tier ?? "moyen") as keyof typeof TOL];
    if (p.kind === "trace") return traceRound(round, ctx, [s.items[round.index]], tol, null);
    const [word, emoji, spoken] = s.words[round.index % s.words.length];
    if (p.kind === "word") return traceRound(round, ctx, word.split(""), tol, { emoji, spoken });
    spellRound(round, ctx, word, emoji, spoken, round.assist ? 0 : p.extra ?? 0);
  },
};

// ---------------------------------------------------------------- tracer (un caractère, ou un mot lettre par lettre)
function traceRound(round: RoundApi, ctx: GameCtx, chars: string[], tol: number, word: { emoji: string; spoken: string } | null) {
  const wrap = h("div", { class: "ec-wrap" });
  round.stage.appendChild(wrap);
  let ci = 0;
  const head = h("div", { class: "ec-head" });
  if (word) {
    head.append(h("span", { class: "ec-emoji" }, word.emoji));
    const letters = h("div", { class: "ec-word" }, ...chars.map((c) => h("span", {}, c)));
    head.append(letters);
  }
  const paper = h("div", { class: "ec-paper" });
  const canvas = h("canvas", { class: "ec-canvas" }) as HTMLCanvasElement;
  paper.appendChild(canvas);
  const demo = h("button", { class: "ec-tool", "aria-label": "👀" }, "👀") as HTMLButtonElement & { __robotPath?: () => [number, number][] };
  const side = h("div", { class: "ec-side" }, demo);
  wrap.append(head, h("div", { class: "ec-main" }, paper, side));
  const ctx2d = canvas.getContext("2d")!;
  let S = 3, strokes: Pt[][] = [], traces: G.Trace[] = [], current = 0, tracing = false, demoing = false, done = false;
  const say = (c: string) => (/\d/.test(c) ? DIGIT_NAME[ctx.lang][+c] : LETTER_NAME[ctx.lang][c] ?? "");

  function load() {
    const c = chars[ci];
    strokes = TRAITS[c] ?? G.glyph(c) ?? [];
    traces = strokes.map((pts) => G.newTrace(pts));
    current = 0;
    head.querySelectorAll(".ec-word span").forEach((sp, i) => sp.className = i < ci ? "done" : i === ci ? "now" : "");
    draw();
    if (word) { if (ci === 0) round.instruct(word.spoken); else round.say(say(c)); }
    else if (!TRAITS[c]) round.instruct(say(c));
  }
  function resize() {
    const r = wrap.getBoundingClientRect();
    const land = r.width > r.height;
    const availW = land ? r.width - 120 : r.width - 24;
    const availH = r.height - (word ? 90 : 20) - (land ? 0 : 90);
    S = Math.max(1.4, Math.min(availW / G.W, availH / G.H, 5));
    const dpr = devicePixelRatio || 1;
    canvas.width = G.W * S * dpr; canvas.height = G.H * S * dpr;
    canvas.style.width = G.W * S + "px"; canvas.style.height = G.H * S + "px";
    ctx2d.setTransform(dpr * S, 0, 0, dpr * S, 0, 0);
    draw();
  }
  const path = (pts: Pt[], upto = pts.length - 1) => { ctx2d.beginPath(); ctx2d.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= upto; i++) ctx2d.lineTo(pts[i][0], pts[i][1]); };
  const width = tol >= 18 ? 20 : tol >= 14 ? 15 : 12;
  function draw(demoPt: Pt | null = null) {
    ctx2d.clearRect(0, 0, G.W, G.H);
    ctx2d.strokeStyle = "#e7f5ff"; ctx2d.lineWidth = 0.8;
    for (const y of [10, 60, 110]) { ctx2d.beginPath(); ctx2d.moveTo(2, y); ctx2d.lineTo(G.W - 2, y); ctx2d.stroke(); }
    ctx2d.lineCap = ctx2d.lineJoin = "round";
    strokes.forEach((pts, i) => { ctx2d.strokeStyle = i === current ? "#dee2e6" : "#f1f3f5"; ctx2d.lineWidth = width; path(pts); ctx2d.stroke(); });
    if (current < strokes.length) { ctx2d.setLineDash([2, 3]); ctx2d.strokeStyle = "#adb5bd"; ctx2d.lineWidth = 1.2; path(strokes[current]); ctx2d.stroke(); ctx2d.setLineDash([]); }
    const COLORS = ["#ff6b6b", "#4dabf7", "#51cf66", "#fcc419", "#cc5de8"];
    traces.forEach((tr, i) => { if (tr.progress > 0) { ctx2d.strokeStyle = COLORS[i % 5]; ctx2d.lineWidth = width * 0.72; path(tr.points, tr.progress); ctx2d.stroke(); } });
    if (current < strokes.length) {
      const tr = traces[current], pt = tr.points[tr.progress], q = tr.points[Math.min(tr.points.length - 1, tr.progress + 5)];
      const ang = Math.atan2(q[1] - pt[1], q[0] - pt[0]);
      ctx2d.save(); ctx2d.translate(pt[0] + Math.cos(ang) * 12, pt[1] + Math.sin(ang) * 12); ctx2d.rotate(ang);
      ctx2d.fillStyle = "#2b8a3e"; ctx2d.beginPath(); ctx2d.moveTo(5, 0); ctx2d.lineTo(-3, -4.5); ctx2d.lineTo(-3, 4.5); ctx2d.closePath(); ctx2d.fill(); ctx2d.restore();
      ctx2d.fillStyle = "#40c057"; ctx2d.beginPath(); ctx2d.arc(pt[0], pt[1], 6, 0, Math.PI * 2); ctx2d.fill();
      if (strokes.length > 1) { ctx2d.fillStyle = "#fff"; ctx2d.font = "bold 7px sans-serif"; ctx2d.textAlign = "center"; ctx2d.textBaseline = "middle"; ctx2d.fillText(String(current + 1), pt[0], pt[1] + 0.5); }
    }
    if (demoPt) { ctx2d.fillStyle = "#fa5252"; ctx2d.beginPath(); ctx2d.arc(demoPt[0], demoPt[1], 5, 0, Math.PI * 2); ctx2d.fill(); }
  }
  const units = (e: PointerEvent): Pt => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * G.W, ((e.clientY - r.top) / r.height) * G.H]; };
  canvas.addEventListener("pointerdown", (e) => {
    if (done || demoing || current >= strokes.length) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch { /* rien */ }
    const [x, y] = units(e), tr = traces[current];
    G.touchStart(tr);
    if (!G.canStartAt(tr, x, y, tol)) { tracing = false; sfx.soft(); return; }
    tracing = true;
    G.feed(tr, x, y, tol); draw();
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!tracing || current >= strokes.length) return;
    const [x, y] = units(e), tr = traces[current], res = G.feed(tr, x, y, tol);
    if (res.advanced && tr.progress % 8 === 0) sfx.step(tr.progress / 8);
    if (tr.done) strokeDone();
    draw();
  });
  const up = () => { tracing = false; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  function strokeDone() {
    tracing = false;
    sfx.step(current + 3);
    current++;
    if (current < strokes.length) return;
    // caractère fini
    if (ci < chars.length - 1) { ci++; round.timeout(load, 450); return; }
    done = true;
    head.querySelectorAll(".ec-word span").forEach((sp) => (sp.className = "done"));
    round.win(paper, word ? word.spoken : "", { delay: 1500 });
  }
  demo.onclick = () => {
    if (done || demoing || current >= strokes.length) return;
    demoing = true; sfx.tap();
    const pts = traces[current].points.slice(traces[current].progress);
    let i = 0;
    const step = () => { if (i >= pts.length) { demoing = false; draw(); return; } draw(pts[i]); i++; round.timeout(step, 24); };
    round.timeout(step, 300);
  };
  demo.__robotPath = () => { const r = canvas.getBoundingClientRect(), tr = traces[current]; return tr.points.slice(tr.progress).map(([x, y]) => [r.left + (x / G.W) * r.width, r.top + (y / G.H) * r.height]); };
  round.setHintTarget(() => (done ? null : demo));
  const ro = new ResizeObserver(resize); ro.observe(wrap); round.onCleanup(() => ro.disconnect());
  load();
}

// ---------------------------------------------------------------- écrire sans modèle (lettres à toucher dans l'ordre)
function spellRound(round: RoundApi, ctx: GameCtx, word: string, emoji: string, spoken: string, extra: number) {
  const wrap = h("div", { class: "ec-wrap spell" });
  round.stage.appendChild(wrap);
  const ear = h("button", { class: "lg-ear big", "aria-label": spoken }, "🔊");
  ear.onclick = () => { sfx.tap(); round.say(spoken); };
  const slots = h("div", { class: "ec-slots" }, ...word.split("").map(() => h("span", { class: "ec-slot" }, "")));
  const pool = "ABCDEFGHIJKLMNOPRSTUVZ".split("").filter((l) => !word.includes(l));
  const letters = shuffle([...word.split(""), ...shuffle(pool).slice(0, extra)]);
  const bank = h("div", { class: "ec-bank" });
  let pos = 0;
  const btns = letters.map((l) => {
    const b = h("button", { class: "ec-letter" }, l) as HTMLButtonElement;
    b.onclick = () => {
      if (b.classList.contains("used") || pos >= word.length) return;
      if (l === word[pos]) {
        sfx.step(pos); b.classList.add("used");
        slots.children[pos].textContent = l; slots.children[pos].classList.add("ok");
        pos++;
        if (pos === word.length) round.win(slots, spoken, { delay: 1500, praise: true });
      } else round.miss(b);
    };
    bank.appendChild(b);
    return b;
  });
  wrap.append(h("div", { class: "ec-head" }, h("span", { class: "ec-emoji big" }, emoji), ear), slots, bank);
  round.setHintTarget(() => btns.find((b) => !b.classList.contains("used") && b.textContent === word[pos]) ?? null);
  round.instruct(spoken);
}
