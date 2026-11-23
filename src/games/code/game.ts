// Code (5-14 ans) : programmer le robot jusqu'à la pile. Flèches → flèches comptées → boucles → grandes grilles.
import { L, type LevelDef, type Track } from "../../core/types";
import { pick } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { generate, run, expand, nextMove, compress, type Block, type Dir } from "./logic";

const ARROW: Record<Dir, string> = { up: "⬆️", down: "⬇️", left: "⬅️", right: "➡️" };

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [params.loops ? "boucles" : "sequences"] });

export const TRACK: Track = {
  chapters: [
    { id: "c1", tier: "facile", ages: [5, 6], title: L("Mes premières flèches", "My first arrows", "Meine ersten Pfeile", "Mis primeras flechas"), levels: [
      lv("1-1", 3, { w: 4, h: 4, walls: 0, path: [2, 3], slack: 4 }), lv("1-2", 3, { w: 4, h: 4, walls: 2, path: [3, 4], slack: 4 }), lv("1-b", 4, { w: 4, h: 4, walls: 3, path: [3, 5], slack: 3 }, true)] },
    { id: "c2", tier: "moyen", ages: [7, 8], title: L("Éviter les arbres", "Avoid the trees", "Den Bäumen ausweichen", "Esquivar los árboles"), levels: [
      lv("2-1", 3, { w: 5, h: 5, walls: 4, path: [4, 6], slack: 3 }), lv("2-2", 3, { w: 5, h: 5, walls: 6, path: [5, 7], slack: 2 }), lv("2-b", 4, { w: 6, h: 6, walls: 8, path: [6, 9], slack: 2 }, true)] },
    { id: "c3", tier: "difficile", ages: [9, 10], title: L("Pas une flèche de trop", "Not one arrow too many", "Kein Pfeil zu viel", "Ni una flecha de más"), levels: [
      lv("3-1", 3, { w: 6, h: 6, walls: 8, path: [6, 9], slack: 0 }), lv("3-2", 3, { w: 6, h: 6, walls: 11, path: [8, 11], slack: 0 }), lv("3-b", 3, { w: 7, h: 7, walls: 14, path: [9, 12], slack: 0 }, true)] },
    { id: "c4", tier: "expert", ages: [11, 14], title: L("Les boucles", "Loops", "Schleifen", "Los bucles"), levels: [
      lv("4-1", 3, { w: 7, h: 7, walls: 6, path: [8, 12], loops: true }), lv("4-2", 3, { w: 8, h: 8, walls: 10, path: [10, 14], loops: true }), lv("4-b", 3, { w: 9, h: 9, walls: 16, path: [12, 18], loops: true }, true)] },
  ],
};

export const codeGame: GameDef = {
  id: "code",
  icon: "🤖",
  category: "logique",
  ages: [5, 14],
  title: L("Code : le petit robot", "Code: the little robot", "Code: der kleine Roboter", "Código: el pequeño robot"),
  desc: L("Programmer un robot avec des flèches : séquences, programme le plus court, puis boucles « répéter 3 fois ».", "Program a robot with arrows: sequences, the shortest program, then “repeat 3 times” loops.", "Einen Roboter mit Pfeilen programmieren: Abfolgen, das kürzeste Programm, dann Schleifen „3-mal wiederholen“.", "Programar un robot con flechas: secuencias, el programa más corto y luego bucles «repetir 3 veces»."),
  skills: { sequences: L("Programmer une suite d'actions", "Programming a sequence", "Eine Abfolge programmieren", "Programar una secuencia"), boucles: L("Les boucles", "Loops", "Schleifen", "Los bucles") },
  speech: (lang) => [L("Bong, un arbre !", "Bump, a tree!", "Bumm, ein Baum!", "¡Pum, un árbol!"), L("Le robot ne peut pas sortir !", "The robot can't leave the board!", "Der Roboter kann nicht hinaus!", "¡El robot no puede salir!"), L("Pas encore arrivé !", "Not there yet!", "Noch nicht angekommen!", "¡Todavía no ha llegado!")].map((x) => x[lang]),
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.loops
    ? L("Programme le robot jusqu'à la pile. Utilise les boucles pour aller plus vite !", "Program the robot to the battery. Use loops to go faster!", "Programmiere den Roboter bis zur Batterie. Nutze Schleifen!", "Programa el robot hasta la pila. ¡Usa los bucles!")
    : L("Choisis les flèches pour emmener le robot jusqu'à la pile, puis appuie sur le bouton vert.", "Choose arrows to take the robot to the battery, then press the green button.", "Wähle Pfeile, um den Roboter zur Batterie zu bringen, und drück dann den grünen Knopf.", "Elige flechas para llevar el robot hasta la pila y pulsa el botón verde."))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { w: number; h: number; walls: number; path: [number, number]; slack?: number; loops?: boolean };
    const loops = !!p.loops;
    // avec les boucles, aucune ligne droite de plus de 5 cases (les boutons vont jusqu'à ×5)
    let g = generate(p.w, p.h, p.walls, p.path);
    while (loops && compress(g.solution).some((b) => b.n > 5)) g = generate(p.w, p.h, p.walls, p.path);
    const maxSlots = loops ? compress(g.solution).length + 1 : g.solution.length + (p.slack ?? 2);
    const program: Block[] = [];
    let running = false;
    const wait = (ms: number) => new Promise<void>((r) => round.timeout(r, ms));
    const main = h("div", { class: "co-main" });
    const board = h("div", { class: "co-board", style: { gridTemplateColumns: `repeat(${g.w}, 1fr)` } });
    const walls = new Set(g.walls.map(([x, y]) => `${x},${y}`));
    const trees = ["🌳", "🌲"];
    for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) board.appendChild(h("div", { class: "co-tile" }, walls.has(`${x},${y}`) ? pick(trees) : x === g.goal[0] && y === g.goal[1] ? "🔋" : ""));
    const bot = h("div", { class: "co-bot" }, "🤖");
    const boardWrap = h("div", { class: "co-boardwrap" }, board, bot);
    const prog = h("div", { class: "co-prog" });
    const arrows = h("div", { class: "row" });
    const times = h("div", { class: "row co-times" });
    const actions = h("div", { class: "row" });
    const side = h("div", { class: "co-side" }, prog, arrows, times, actions);
    main.append(boardWrap, side);
    round.stage.appendChild(main);
    const place = (x: number, y: number) => { bot.style.left = `${((x + 0.5) / g.w) * 100}%`; bot.style.top = `${((y + 0.5) / g.h) * 100}%`; };
    place(...g.start);
    const btn: Record<string, HTMLButtonElement> = {};
    for (const d of ["left", "up", "down", "right"] as Dir[]) {
      const b = h("button", { class: "co-arrow", "aria-label": d }, ARROW[d]) as HTMLButtonElement;
      b.onclick = () => { if (running || program.length >= maxSlots) return; sfx.tap(); program.push({ dir: d, n: 1 }); draw(); };
      arrows.appendChild(b); btn[d] = b;
    }
    if (loops) for (const n of [2, 3, 4, 5]) {
      const b = h("button", { class: "co-times-btn", "aria-label": `×${n}` }, `×${n}`) as HTMLButtonElement;
      b.onclick = () => { const last = program[program.length - 1]; if (running || !last) return; sfx.tap(); last.n = n; draw(); };
      times.appendChild(b); btn[`times:${n}`] = b;
    }
    const undo = h("button", { class: "act-btn undo", "aria-label": "⌫" }, "⌫") as HTMLButtonElement;
    const go = h("button", { class: "act-btn go", "aria-label": "▶" }, "▶️") as HTMLButtonElement;
    undo.onclick = () => { if (!running && program.length) { sfx.pop(); program.pop(); draw(); } };
    actions.append(undo, go);
    btn.undo = undo; btn.go = go;
    function draw(active = -1, error = -1) {
      prog.innerHTML = "";
      for (let i = 0; i < maxSlots; i++) {
        const b = program[i];
        prog.appendChild(h("span", { class: "co-slot" + (b ? " full" : "") + (i === active ? " now" : "") + (i === error ? " err" : "") }, b ? ARROW[b.dir] + (b.n > 1 ? `×${b.n}` : "") : ""));
      }
    }
    draw();
    go.onclick = async () => {
      if (running || !program.length) return;
      running = true;
      const dirs = expand(program);
      const res = run(g, dirs);
      // index de bloc pour chaque pas (pour éclairer le bon bloc)
      const blockOf: number[] = program.flatMap((b, i) => Array(b.n).fill(i));
      for (let i = 1; i < res.trace.length; i++) { draw(blockOf[i - 1]); place(...res.trace[i]); sfx.step(i); await wait(380); }
      if (res.result === "win") { round.win(bot, "", { delay: 1500 }); return; }
      draw(-1, res.result === "short" ? -1 : blockOf[res.at]);
      round.miss(prog, { wall: L("Bong, un arbre !", "Bump, a tree!", "Bumm, ein Baum!", "¡Pum, un árbol!"), edge: L("Le robot ne peut pas sortir !", "The robot can't leave the board!", "Der Roboter kann nicht hinaus!", "¡El robot no puede salir!"), short: L("Pas encore arrivé !", "Not there yet!", "Noch nicht angekommen!", "¡Todavía no ha llegado!") }[res.result][ctx.lang]);
      await wait(1200);
      place(...g.start); running = false;
    };
    round.setHintTarget(() => (running ? null : btn[nextMove(g, program, loops)] ?? null));
  },
};
