// Le Château magique (5-12 ans) : ramasser les trésors du labyrinthe puis entrer dans la porte magique.
// Les règles facile / moyen / difficile viennent du sélecteur de difficulté de la V2.
import { L, type LevelDef, type Track } from "../../core/types";
import { pick, shuffle } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const RULES = {
  facile: { size: (n: number) => Math.min(3 + Math.floor((n - 1) / 3), 4), gems: (n: number) => Math.min(6, 2 + Math.ceil(n / 2)), bats: () => 1, batSpeed: 1.5, batCounts: false },
  moyen: { size: (n: number) => Math.min(2 + n, 6), gems: (n: number) => 3 + n, bats: (n: number) => Math.min(1 + Math.floor(n / 3), 3), batSpeed: 1.0, batCounts: true },
  difficile: { size: (n: number) => Math.min(3 + n, 7), gems: (n: number) => 4 + n, bats: (n: number) => Math.min(2 + Math.floor(n / 3), 4), batSpeed: 0.7, batCounts: true },
};
export type Diff = keyof typeof RULES;
export const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;
type D = keyof typeof DIRS;

export function makeMaze(cw: number, ch: number, rng = Math.random): number[][] {
  const W = cw * 2 + 1, H = ch * 2 + 1;
  const g = Array.from({ length: H }, () => Array(W).fill(1));
  const stack: [number, number][] = [[0, 0]], seen = new Set(["0,0"]);
  g[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const n = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]], rng).find(([dx, dy]) => { const nx = x + dx, ny = y + dy; return nx >= 0 && ny >= 0 && nx < cw && ny < ch && !seen.has(`${nx},${ny}`); });
    if (!n) { stack.pop(); continue; }
    const nx = x + n[0], ny = y + n[1];
    seen.add(`${nx},${ny}`); g[y * 2 + 1 + n[1]][x * 2 + 1 + n[0]] = 0; g[ny * 2 + 1][nx * 2 + 1] = 0; stack.push([nx, ny]);
  }
  for (let i = 0; i < cw * ch * 0.35; i++) { const x = 1 + Math.floor(rng() * (W - 2)), y = 1 + Math.floor(rng() * (H - 2)); if ((x + y) % 2 === 1) g[y][x] = 0; }
  return g;
}

export function castle(diff: Diff, n: number, rng = Math.random) {
  const r = RULES[diff], size = r.size(n), grid = makeMaze(size + 1, size, rng);
  const rows = grid.length, cols = grid[0].length, door = { x: cols - 2, y: rows - 2 };
  const free: [number, number][] = [];
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (!grid[y][x]) free.push([x, y]);
  const picks = shuffle(free.filter(([x, y]) => x + y > 4 && !(x === door.x && y === door.y)), rng);
  const gc = r.gems(n);
  const gems = picks.slice(0, gc).map(([x, y]) => ({ x, y }));
  const bats: { x: number; y: number; dx: number; dy: number }[] = [];
  for (const [x, y] of picks.slice(gc)) {
    if (bats.length >= r.bats(n)) break;
    const hz = !grid[y][x - 1] && !grid[y][x + 1], vt = !grid[y - 1]?.[x] && !grid[y + 1]?.[x];
    if (hz || vt) bats.push({ x, y, dx: hz ? 1 : 0, dy: hz ? 0 : 1 });
  }
  return { grid, rows, cols, door, gems, bats };
}

/** Premier pas du plus court chemin vers la cible la plus proche (null si impossible). */
export function nextStep(grid: number[][], from: { x: number; y: number }, targets: { x: number; y: number }[], blocked: (x: number, y: number) => boolean = () => false): D | null {
  const key = (x: number, y: number) => `${x},${y}`, goal = new Set(targets.map((t) => key(t.x, t.y)));
  const prev = new Map<string, { k: string; dir: D } | null>([[key(from.x, from.y), null]]), q: [number, number][] = [[from.x, from.y]];
  while (q.length) {
    const [x, y] = q.shift()!;
    if (goal.has(key(x, y)) && !(x === from.x && y === from.y)) {
      let k = key(x, y), p;
      while ((p = prev.get(k)) && p.k !== key(from.x, from.y)) k = p.k;
      return p ? p.dir : null;
    }
    for (const [dir, [dx, dy]] of Object.entries(DIRS) as [D, readonly [number, number]][]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (grid[ny]?.[nx] !== 0 || prev.has(k) || blocked(nx, ny)) continue;
      prev.set(k, { k: key(x, y), dir }); q.push([nx, ny]);
    }
  }
  return null;
}

const lv = (id: string, diff: Diff, n: number, boss = false): LevelDef => ({ id, rounds: 1, params: { diff, n }, boss, skills: ["orientation"] });

export const TRACK: Track = {
  chapters: [
    { id: "ch1", tier: "facile", ages: [5, 6], title: L("Le petit château", "The little castle", "Die kleine Burg", "El castillo pequeño"), levels: [lv("1-1", "facile", 1), lv("1-2", "facile", 2), lv("1-3", "facile", 4), lv("1-b", "facile", 6, true)] },
    { id: "ch2", tier: "moyen", ages: [7, 8], title: L("Le grand château", "The big castle", "Die große Burg", "El castillo grande"), levels: [lv("2-1", "moyen", 1), lv("2-2", "moyen", 2), lv("2-3", "moyen", 3), lv("2-b", "moyen", 4, true)] },
    { id: "ch3", tier: "difficile", ages: [9, 12], title: L("Le château hanté", "The haunted castle", "Die Spukburg", "El castillo encantado"), levels: [lv("3-1", "difficile", 1), lv("3-2", "difficile", 2), lv("3-3", "difficile", 3), lv("3-b", "difficile", 4, true)] },
  ],
};

const GEMS = ["💎", "💍", "👑", "🔮", "⭐", "🪙"];

export const tresorsGame: GameDef = {
  id: "tresors",
  icon: "🏰",
  category: "arcade",
  ages: [5, 12],
  title: L("Le Château magique", "The Magic Castle", "Die Zauberburg", "El Castillo mágico"),
  desc: L("Se repérer dans un labyrinthe : ramasser tous les trésors, éviter les chauves-souris, trouver la porte magique.", "Find your way through a maze: collect all the treasures, avoid the bats, find the magic door.", "Sich im Labyrinth zurechtfinden: alle Schätze einsammeln, den Fledermäusen ausweichen, die Zaubertür finden.", "Orientarse en un laberinto: recoger todos los tesoros, esquivar los murciélagos y encontrar la puerta mágica."),
  skills: { orientation: L("Se repérer et planifier", "Finding the way and planning", "Orientierung und Planen", "Orientarse y planificar") },
  speech: (lang) => [L("La porte magique est ouverte !", "The magic door is open!", "Die Zaubertür ist offen!", "¡La puerta mágica está abierta!"), L("Oups, la chauve-souris ! Elle s'envole.", "Oops, the bat! It flies away.", "Hoppla, die Fledermaus! Sie fliegt weg.", "¡Uy, el murciélago! Sale volando.")].map((x) => x[lang]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Ramasse tous les trésors, puis va à la porte magique. Glisse ton doigt ou touche les flèches.", "Collect all the treasures, then go to the magic door. Swipe or tap the arrows.", "Sammle alle Schätze, dann geh zur Zaubertür. Wisch oder tipp auf die Pfeile.", "Recoge todos los tesoros y luego ve a la puerta mágica. Desliza o toca las flechas.")[ctx.lang],
  start(round, level, ctx) {
    const { diff, n } = level.params as { diff: Diff; n: number };
    const r = RULES[diff];
    const c = castle(diff, n);
    const { grid, rows, cols, door } = c;
    const gems = c.gems.map((g) => ({ ...g, e: pick(GEMS) }));
    const total = gems.length;
    const bats = c.bats.map((b) => ({ ...b, px: b.x, py: b.y, timer: 0 }));
    const hero = { x: 1, y: 1, px: 1, py: 1, lx: 1, ly: 1 };
    let open = false, busy = false, cool = 0, t = 0, S = 30, held: D | null = null, rep = 0;
    const meter = round.meter("💎", total);
    const main = h("div", { class: "tr-main" }), wrap = h("div", { class: "tr-wrap" }), canvas = h("canvas") as HTMLCanvasElement;
    wrap.appendChild(canvas);
    const pad = h("div", { class: "tr-pad" });
    main.append(wrap, pad);
    round.stage.appendChild(main);
    const c2 = canvas.getContext("2d")!;
    const resize = () => { const b = wrap.getBoundingClientRect(); S = Math.max(8, Math.floor(Math.min(b.width / cols, b.height / rows))); const d = devicePixelRatio || 1; canvas.width = cols * S * d; canvas.height = rows * S * d; canvas.style.width = cols * S + "px"; canvas.style.height = rows * S + "px"; c2.setTransform(d, 0, 0, d, 0, 0); };
    const ro = new ResizeObserver(resize); ro.observe(wrap); round.onCleanup(() => ro.disconnect()); resize();
    const btns = {} as Record<D, HTMLButtonElement>;
    for (const [d, sym] of [["up", "⬆️"], ["left", "⬅️"], ["down", "⬇️"], ["right", "➡️"]] as [D, string][]) {
      const b = h("button", { class: `tr-btn ${d}`, "aria-label": d }, sym) as HTMLButtonElement;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); held = d; step(d); rep = 0.28; });
      const off = () => { if (held === d) held = null; };
      b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
      pad.appendChild(b); btns[d] = b;
    }
    let sw: { x: number; y: number } | null = null;
    canvas.addEventListener("pointerdown", (e) => { sw = { x: e.clientX, y: e.clientY }; });
    canvas.addEventListener("pointermove", (e) => { if (!sw) return; const dx = e.clientX - sw.x, dy = e.clientY - sw.y; if (Math.max(Math.abs(dx), Math.abs(dy)) > S * 0.6) { step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : dy > 0 ? "down" : "up"); sw = { x: e.clientX, y: e.clientY }; } });
    const pu = () => (sw = null); addEventListener("pointerup", pu); round.onCleanup(() => removeEventListener("pointerup", pu));
    function step(d: D) {
      if (busy || round.ended) return;
      const [dx, dy] = DIRS[d], nx = hero.x + dx, ny = hero.y + dy;
      if (grid[ny]?.[nx] !== 0) return;
      hero.lx = hero.x; hero.ly = hero.y; hero.x = nx; hero.y = ny; sfx.tap();
      const gi = gems.findIndex((g) => g.x === nx && g.y === ny);
      if (gi >= 0) { gems.splice(gi, 1); meter.set(total - gems.length); sfx.coin(); if (!gems.length) { open = true; sfx.good(); round.say(L("La porte magique est ouverte !", "The magic door is open!", "Die Zaubertür ist offen!", "¡La puerta mágica está abierta!")[ctx.lang]); } }
      if (open && nx === door.x && ny === door.y) { busy = true; held = null; sfx.win(); round.timeout(() => round.end(), 900); }
    }
    const em = (ch: string, x: number, y: number, s: number) => { c2.font = `${s}px serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(ch, x, y); };
    round.loop((dt) => {
      t += dt; cool = Math.max(0, cool - dt);
      if (held) { rep -= dt; if (rep <= 0) { step(held); rep = 0.17; } }
      hero.px += (hero.x - hero.px) * Math.min(1, dt * 18); hero.py += (hero.y - hero.py) * Math.min(1, dt * 18);
      for (const b of bats) {
        b.timer += dt;
        if (b.timer > r.batSpeed && !busy) { b.timer = 0; if (grid[b.y + b.dy]?.[b.x + b.dx] !== 0) { b.dx *= -1; b.dy *= -1; } if (grid[b.y + b.dy]?.[b.x + b.dx] === 0) { b.x += b.dx; b.y += b.dy; } }
        b.px += (b.x - b.px) * Math.min(1, dt * 6); b.py += (b.y - b.py) * Math.min(1, dt * 6);
        if (!busy && cool === 0 && Math.hypot(b.px - hero.px, b.py - hero.py) < 0.55) {
          cool = 1.2; hero.x = hero.lx; hero.y = hero.ly;
          if (r.batCounts) round.oops();
          sfx.soft(); round.say(L("Oups, la chauve-souris ! Elle s'envole.", "Oops, the bat! It flies away.", "Hoppla, die Fledermaus! Sie fliegt weg.", "¡Uy, el murciélago! Sale volando.")[ctx.lang]);
          // elle s'envole loin du héros : elle ne peut jamais bloquer le chemin pour toujours
          const far: [number, number, boolean][] = [];
          for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) { if (grid[y][x] || Math.abs(x - hero.x) + Math.abs(y - hero.y) < 6 || (x === door.x && y === door.y)) continue; const hz = !grid[y][x - 1] && !grid[y][x + 1], vt = !grid[y - 1][x] && !grid[y + 1][x]; if (hz || vt) far.push([x, y, hz]); }
          if (far.length) { const [x, y, hz] = pick(far); Object.assign(b, { x, y, px: x, py: y, dx: hz ? 1 : 0, dy: hz ? 0 : 1, timer: 0 }); }
          break;
        }
      }
      c2.clearRect(0, 0, cols * S, rows * S);
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { c2.fillStyle = grid[y][x] ? ((x + y) % 2 ? "#9a86cf" : "#a793da") : (x + y) % 2 ? "#1f1236" : "#24163d"; c2.fillRect(x * S, y * S, S, S); }
      em(open ? "🌀" : "🚪", (door.x + 0.5) * S, (door.y + 0.5) * S, S * 0.8);
      for (const g of gems) em(g.e, (g.x + 0.5) * S, (g.y + 0.5) * S, S * 0.65);
      for (const b of bats) em("🦇", (b.px + 0.5) * S, (b.py + 0.5) * S, S * 0.75);
      em("🧙", (hero.px + 0.5) * S, (hero.py + 0.5) * S, S * 0.8);
    });
    round.setHintTarget(() => {
      const targets = gems.length ? gems : [door];
      const danger = (x: number, y: number) => bats.some((b) => Math.abs(b.x - x) + Math.abs(b.y - y) <= 1 || Math.abs(b.x + b.dx - x) + Math.abs(b.y + b.dy - y) <= 1);
      const d = nextStep(grid, hero, targets, danger) ?? nextStep(grid, hero, targets);
      return d ? btns[d] : null;
    });
  },
};
