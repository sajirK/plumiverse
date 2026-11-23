// Le Dino (5-12 ans) : courir et sauter jusqu'au château. Pas de trou au début, puis des trous, puis des escargots.
// Chaque parcours est généré et vérifié franchissable (trous ≤ 3 cases, marches de 1 case).
import { L, type LevelDef, type Track } from "../../core/types";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const GROUND = 8;
export const PHYS = { GRAV: 38, JUMP: 15.5, SPEED: 6.5 };
type Plat = { x: number; y: number; w: number; h: number; kind: "ground" | "float" };
type Enemy = { x: number; y: number; min: number; max: number; dir: number; alive: boolean };
export interface Course { platforms: Plat[]; apples: { x: number; y: number }[]; enemies: Enemy[]; flag: { x: number; y: number } }

export function buildCourse(o: { length: number; gapChance: number; maxGap: number; steps: number; floats: number; enemies: number }, rng = Math.random): Course {
  const platforms: Plat[] = [{ x: -6, y: GROUND, w: 16, h: 3, kind: "ground" }];
  const apples: { x: number; y: number }[] = [], enemies: Enemy[] = [];
  let x = 10;
  while (x < o.length) {
    x += rng() < o.gapChance ? 1 + Math.floor(rng() * o.maxGap) : 0;
    const w = 5 + Math.floor(rng() * 7), hgt = rng() < o.steps ? 1 : 0;
    platforms.push({ x, y: GROUND - hgt, w, h: 3 + hgt, kind: "ground" });
    for (let i = 1; i < w - 1; i += 2) if (rng() < 0.5) apples.push({ x: x + i + 0.5, y: GROUND - hgt - 0.7 });
    if (rng() < o.floats) {
      const py = GROUND - hgt - (2 + Math.floor(rng() * 2)), pw = 3 + Math.floor(rng() * 2), px = x + Math.floor(rng() * Math.max(1, w - pw));
      platforms.push({ x: px, y: py, w: pw, h: 0.6, kind: "float" });
      for (let i = 0; i < pw; i++) apples.push({ x: px + i + 0.5, y: py - 0.7 });
    }
    if (w >= 7 && rng() < o.enemies) enemies.push({ x: x + w / 2, y: GROUND - hgt - 0.8, min: x + 1, max: x + w - 2, dir: rng() < 0.5 ? -1 : 1, alive: true });
    x += w;
  }
  platforms.push({ x, y: GROUND, w: 14, h: 3, kind: "ground" });
  return { platforms, apples, enemies, flag: { x: x + 6, y: GROUND - 1.6 } };
}

export function passable(c: Course, maxGap: number): boolean {
  const g = c.platforms.filter((p) => p.kind === "ground").sort((a, b) => a.x - b.x);
  return g.every((p, i) => i === 0 || (p.x - (g[i - 1].x + g[i - 1].w) <= maxGap && Math.abs(p.y - g[i - 1].y) <= 1));
}

const lv = (id: string, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds: 1, params, boss, skills: ["coordination"] });

export const TRACK: Track = {
  chapters: [
    { id: "d1", tier: "facile", ages: [5, 6], title: L("La grande plaine", "The big meadow", "Die große Wiese", "La gran pradera"), levels: [lv("1-1", { length: 30, gapChance: 0, maxGap: 0, steps: 0.2, floats: 0.4, enemies: 0 }), lv("1-2", { length: 45, gapChance: 0, maxGap: 0, steps: 0.3, floats: 0.5, enemies: 0 }), lv("1-b", { length: 55, gapChance: 0.2, maxGap: 1, steps: 0.3, floats: 0.5, enemies: 0 }, true)] },
    { id: "d2", tier: "moyen", ages: [7, 8], title: L("Les trous", "Gaps", "Die Löcher", "Los agujeros"), levels: [lv("2-1", { length: 60, gapChance: 0.4, maxGap: 2, steps: 0.3, floats: 0.6, enemies: 0 }), lv("2-2", { length: 75, gapChance: 0.45, maxGap: 2, steps: 0.35, floats: 0.6, enemies: 0 }), lv("2-b", { length: 85, gapChance: 0.5, maxGap: 3, steps: 0.35, floats: 0.7, enemies: 0 }, true)] },
    { id: "d3", tier: "difficile", ages: [9, 12], title: L("Les escargots", "Snails", "Die Schnecken", "Los caracoles"), levels: [lv("3-1", { length: 90, gapChance: 0.45, maxGap: 3, steps: 0.35, floats: 0.7, enemies: 0.3 }), lv("3-2", { length: 105, gapChance: 0.5, maxGap: 3, steps: 0.35, floats: 0.7, enemies: 0.4 }), lv("3-b", { length: 125, gapChance: 0.5, maxGap: 3, steps: 0.4, floats: 0.7, enemies: 0.5 }, true)] },
  ],
};

export const dinoGame: GameDef = {
  id: "dino",
  icon: "🦕",
  category: "arcade",
  ages: [5, 12],
  title: L("Le Dino", "Dino Run", "Dino-Lauf", "El Dino"),
  desc: L("Courir, sauter au bon moment, ramasser les pommes et éviter les escargots jusqu'au château.", "Run, jump at the right moment, collect apples and dodge snails all the way to the castle.", "Laufen, im richtigen Moment springen, Äpfel sammeln und Schnecken ausweichen bis zum Schloss.", "Correr, saltar en el momento justo, recoger manzanas y esquivar caracoles hasta el castillo."),
  skills: { coordination: L("Coordination et anticipation", "Coordination and timing", "Koordination und Timing", "Coordinación y anticipación") },
  speech: (lang) => [L("Oups ! On réessaie !", "Oops! Try again!", "Hoppla! Nochmal!", "¡Uy! ¡Otra vez!"), L("Aïe ! Saute par-dessus l'escargot !", "Ouch! Jump over the snail!", "Autsch! Spring über die Schnecke!", "¡Ay! ¡Salta por encima del caracol!")].map((x) => x[lang]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Les flèches pour courir, la grosse flèche pour sauter. Va jusqu'au château !", "Arrows to run, the big arrow to jump. Get to the castle!", "Pfeile zum Laufen, der große Pfeil zum Springen. Lauf bis zum Schloss!", "Flechas para correr, la flecha grande para saltar. ¡Llega al castillo!")[ctx.lang],
  start(round, level, ctx) {
    const o = level.params as { length: number; gapChance: number; maxGap: number; steps: number; floats: number; enemies: number };
    let course = buildCourse(o);
    while (!passable(course, o.maxGap)) course = buildCourse(o);
    const { platforms, apples, enemies, flag } = course;
    const meter = round.meter("🍎", Math.max(1, apples.length));
    const canvas = h("canvas", { class: "fr-canvas" }) as HTMLCanvasElement;
    round.stage.appendChild(canvas);
    const c2 = canvas.getContext("2d")!;
    let W = 300, H = 300, T = 30;
    const resize = () => { const d = devicePixelRatio || 1; W = round.stage.clientWidth; H = round.stage.clientHeight; canvas.width = W * d; canvas.height = H * d; c2.setTransform(d, 0, 0, d, 0, 0); T = H / 10; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(round.stage); round.onCleanup(() => ro.disconnect());
    const keys = { left: false, right: false, jump: false };
    let buf = 0, coyote = 0, won = false, t = 0, got = 0, hurt = 0;
    const pl = { x: 0, y: GROUND - 1, vx: 0, vy: 0, w: 0.9, h: 0.9, on: false, face: 1 };
    let safe = { x: 0, y: GROUND - 1 };
    for (const [k, sym] of [["left", "⬅️"], ["right", "➡️"], ["jump", "⬆️"]] as const) {
      const b = h("button", { class: `di-ctrl ${k}`, "aria-label": k }, sym);
      const on = (e: Event) => { e.preventDefault(); keys[k] = true; b.classList.add("on"); if (k === "jump") buf = 0.15; };
      const off = () => { keys[k] = false; b.classList.remove("on"); };
      b.addEventListener("pointerdown", on); b.addEventListener("pointerup", off); b.addEventListener("pointercancel", off); b.addEventListener("pointerleave", off);
      round.stage.appendChild(b);
    }
    const KM: Record<string, "left" | "right" | "jump"> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "jump", " ": "jump" };
    const kd = (e: KeyboardEvent) => { const k = KM[e.key]; if (k) { keys[k] = true; if (k === "jump" && !e.repeat) buf = 0.15; e.preventDefault(); } };
    const ku = (e: KeyboardEvent) => { const k = KM[e.key]; if (k) keys[k] = false; };
    addEventListener("keydown", kd); addEventListener("keyup", ku);
    round.onCleanup(() => { removeEventListener("keydown", kd); removeEventListener("keyup", ku); });
    const over = (a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    function update(dt: number) {
      if (won) return;
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (hurt <= 0.8) pl.vx += (dir * PHYS.SPEED - pl.vx) * Math.min(1, dt * 12);
      if (dir) pl.face = dir;
      buf -= dt; coyote -= dt; hurt -= dt;
      if (pl.on) coyote = 0.12;
      if (buf > 0 && coyote > 0) { pl.vy = -PHYS.JUMP; buf = 0; coyote = 0; sfx.tap(); }
      if (!keys.jump && pl.vy < -6) pl.vy += PHYS.GRAV * dt * 1.5;
      pl.vy = Math.min(pl.vy + PHYS.GRAV * dt, 22);
      pl.x = Math.max(-5, pl.x + pl.vx * dt);
      for (const q of platforms) if (q.kind === "ground" && over(pl, q)) { if (pl.vx > 0) pl.x = q.x - pl.w; else if (pl.vx < 0) pl.x = q.x + q.w; pl.vx = 0; }
      const prevB = pl.y + pl.h;
      pl.y += pl.vy * dt;
      pl.on = false;
      for (const q of platforms) {
        if (!over(pl, q)) continue;
        if (pl.vy > 0 && prevB <= q.y + 0.05) { pl.y = q.y - pl.h; pl.vy = 0; pl.on = true; if (q.kind === "ground") safe = { x: Math.max(q.x + 0.2, Math.min(pl.x, q.x + q.w - 1.2)), y: q.y - 1 }; }
        else if (q.kind === "ground" && pl.vy < 0) { pl.y = q.y + q.h; pl.vy = 0; }
      }
      if (pl.y > 11) { round.oops(); sfx.soft(); round.say(L("Oups ! On réessaie !", "Oops! Try again!", "Hoppla! Nochmal!", "¡Uy! ¡Otra vez!")[ctx.lang]); pl.x = safe.x; pl.y = safe.y - 1; pl.vx = pl.vy = 0; }
      for (const e of enemies) {
        if (!e.alive) continue;
        e.x += e.dir * 1.1 * dt; if (e.x < e.min || e.x > e.max) e.dir *= -1;
        const box = { x: e.x - 0.45, y: e.y, w: 0.9, h: 0.8 };
        if (!over(pl, box)) continue;
        if (pl.vy > 0 && prevB <= box.y + 0.45) { e.alive = false; pl.vy = -10; sfx.pop(); }
        else if (hurt <= 0) { hurt = 1.2; round.oops(); sfx.soft(); pl.vx = (pl.x < e.x ? -1 : 1) * 7; pl.vy = -7; round.say(L("Aïe ! Saute par-dessus l'escargot !", "Ouch! Jump over the snail!", "Autsch! Spring über die Schnecke!", "¡Ay! ¡Salta por encima del caracol!")[ctx.lang]); }
      }
      for (let i = apples.length - 1; i >= 0; i--) { const a = apples[i]; if (Math.abs(a.x - (pl.x + pl.w / 2)) < 0.7 && Math.abs(a.y - (pl.y + pl.h / 2)) < 0.8) { apples.splice(i, 1); got++; meter.set(got); sfx.coin(); } }
      if (pl.x + pl.w > flag.x) { won = true; sfx.win(); round.timeout(() => round.end(), 1000); }
    }
    const em = (ch: string, x: number, y: number, s: number, flip = false) => { c2.save(); c2.translate(x, y); c2.scale(flip ? -1 : 1, 1); c2.font = `${s}px serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(ch, 0, 0); c2.restore(); };
    function draw() {
      const cam = pl.x - (W / T) * 0.35;
      const g = c2.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#6ec6ff"); g.addColorStop(1, "#d6f5ff"); c2.fillStyle = g; c2.fillRect(0, 0, W, H);
      em("☀️", T * 1.6, T * 1.4, T * 1.3);
      c2.save(); c2.translate(-cam * T, 0);
      for (const q of platforms) {
        if ((q.x + q.w - cam) * T < 0 || (q.x - cam) * T > W) continue;
        if (q.kind === "ground") { c2.fillStyle = "#9c6b3f"; c2.fillRect(q.x * T, q.y * T, q.w * T, q.h * T); c2.fillStyle = "#5cc85c"; c2.fillRect(q.x * T, q.y * T, q.w * T, T * 0.35); }
        else { c2.fillStyle = "#ffb703"; c2.fillRect(q.x * T, q.y * T, q.w * T, q.h * T); }
      }
      for (const a of apples) em("🍎", a.x * T, (a.y + Math.sin(t * 3 + a.x) * 0.08) * T, T * 0.7);
      for (const e of enemies) em(e.alive ? "🐌" : "🐚", e.x * T, (e.y + 0.4) * T, T * 0.95, e.dir > 0);
      em("🏁", flag.x * T, flag.y * T, T * 1.6); em("🏰", (flag.x + 4) * T, (GROUND - 1.4) * T, T * 3);
      if (!(hurt > 0 && Math.floor(t * 12) % 2)) em("🦕", (pl.x + pl.w / 2) * T, (pl.y + pl.h / 2 - 0.1) * T, T * 1.25, pl.face > 0);
      c2.restore();
    }
    round.loop((dt) => { t += dt; update(dt); draw(); });
    // pilote automatique (robot de test) : court, saute devant un trou, une marche ou un escargot
    const auto = h("span", { class: "hidden" }) as HTMLElement & { __robotAuto?: () => void };
    const groundAt = (x: number) => platforms.find((q) => q.kind === "ground" && x >= q.x && x <= q.x + q.w);
    auto.__robotAuto = () => {
      keys.right = true; keys.left = false;
      const front = pl.x + pl.w, cur = groundAt(pl.x + pl.w / 2), ahead = groundAt(front + 0.5);
      const danger = !groundAt(front + 0.6) || (ahead && cur && ahead.y < cur.y) || enemies.some((e) => e.alive && e.x - front > -0.2 && e.x - front < 2.4 && Math.abs(e.y - pl.y) < 1.5);
      if (pl.on && danger) { buf = 0.15; keys.jump = true; } else if (pl.on) keys.jump = false;
    };
    round.stage.appendChild(auto);
    round.setHintTarget(() => auto);
  },
};
