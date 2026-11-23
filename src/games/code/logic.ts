// Code (le Petit Robot) : grilles toujours faisables (vérifiées par le plus court chemin), programmes avec boucles.
import { shuffle, type Rng } from "../../core/util";

export type Dir = "up" | "down" | "left" | "right";
export const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export interface Block { dir: Dir; n: number }
export interface Grid { w: number; h: number; walls: [number, number][]; start: [number, number]; goal: [number, number]; solution: Dir[] }

const key = (x: number, y: number) => `${x},${y}`;

export function shortestPath(g: Omit<Grid, "solution">): Dir[] | null {
  const walls = new Set(g.walls.map(([x, y]) => key(x, y)));
  const prev = new Map<string, [string, Dir] | null>([[key(...g.start), null]]);
  const queue: [number, number][] = [g.start];
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === g.goal[0] && y === g.goal[1]) {
      const path: Dir[] = [];
      let k = key(x, y), p;
      while ((p = prev.get(k))) { path.unshift(p[1]); k = p[0]; }
      return path;
    }
    for (const [d, [dx, dy]] of Object.entries(DIRS) as [Dir, [number, number]][]) {
      const nx = x + dx, ny = y + dy, nk = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h || walls.has(nk) || prev.has(nk)) continue;
      prev.set(nk, [key(x, y), d]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

/** Une grille avec un plus court chemin de longueur [min, max]. */
export function generate(w: number, h: number, nWalls: number, path: [number, number], rng: Rng = Math.random): Grid {
  for (let attempt = 0; attempt < 3000; attempt++) {
    const cells: [number, number][] = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) cells.push([x, y]);
    const c = shuffle(cells, rng);
    const g = { w, h, walls: c.slice(2, 2 + nWalls), start: c[0], goal: c[1] };
    const sol = shortestPath(g);
    if (sol && sol.length >= path[0] && sol.length <= path[1]) return { ...g, solution: sol };
  }
  throw new Error("grille impossible");
}

/** Regroupe les flèches identiques qui se suivent : → → → ↓ devient (→ ×3) (↓ ×1). */
export function compress(dirs: Dir[]): Block[] {
  const out: Block[] = [];
  for (const d of dirs) { const last = out[out.length - 1]; if (last && last.dir === d) last.n++; else out.push({ dir: d, n: 1 }); }
  return out;
}

export const expand = (blocks: Block[]): Dir[] => blocks.flatMap((b) => Array(b.n).fill(b.dir) as Dir[]);

/** Fait tourner un programme : "win" (sur la pile), "wall" (arbre), "edge" (bord), "short" (pas arrivé). */
export function run(g: Grid, dirs: Dir[]): { trace: [number, number][]; result: "win" | "wall" | "edge" | "short"; at: number } {
  const walls = new Set(g.walls.map(([x, y]) => key(x, y)));
  let [x, y] = g.start;
  const trace: [number, number][] = [[x, y]];
  for (let i = 0; i < dirs.length; i++) {
    const [dx, dy] = DIRS[dirs[i]];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) return { trace, result: "edge", at: i };
    if (walls.has(key(nx, ny))) return { trace, result: "wall", at: i };
    x = nx; y = ny; trace.push([x, y]);
    if (x === g.goal[0] && y === g.goal[1]) return { trace, result: "win", at: i };
  }
  return { trace, result: "short", at: dirs.length };
}

/**
 * L'aide : quoi toucher maintenant. Sans boucles, on compare flèche par flèche ; avec boucles, bloc par bloc.
 * Renvoie "undo", "go", une direction, ou "times:N" (régler la répétition du dernier bloc).
 */
export function nextMove(g: Grid, program: Block[], loops: boolean): string {
  const target = loops ? compress(g.solution) : g.solution.map((d) => ({ dir: d, n: 1 }));
  for (let i = 0; i < program.length; i++) {
    const t = target[i];
    if (!t || program[i].dir !== t.dir) return "undo";
    if (program[i].n !== t.n) return i === program.length - 1 && program[i].n < t.n ? `times:${t.n}` : "undo";
  }
  if (program.length >= target.length) return "go";
  return target[program.length].dir;
}
