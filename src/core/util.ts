// Petits outils sans DOM : dates en jours, hasard reproductible, mélange.

/** Jour local au format AAAA-MM-JJ (les séries et révisions se comptent en jours). */
export function dayKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Nombre de jours entre deux clés de jour (b - a). */
export function daysBetween(a: string, b: string): number {
  const t = (k: string) => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
  return Math.round((t(b) - t(a)) / 86400000);
}

export function addDays(k: string, n: number): string {
  const d = new Date(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10) + n));
  return d.toISOString().slice(0, 10);
}

export type Rng = () => number;

/** Hasard reproductible (mulberry32) : même graine = même suite. */
export function seeded(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function shuffle<T>(arr: readonly T[], rng: Rng = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const pick = <T>(arr: readonly T[], rng: Rng = Math.random): T => arr[Math.floor(rng() * arr.length)];
export const randInt = (a: number, b: number, rng: Rng = Math.random) => a + Math.floor(rng() * (b - a + 1));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Identifiant aléatoire court (profils). */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
