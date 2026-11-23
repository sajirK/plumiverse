// Moteur de progression : parcours → chapitres → niveaux, étoiles, déblocages, XP, séries, maîtrise.
// Règles (docs/SPEC.md § 4.4) :
//  - le 1er niveau d'un chapitre ouvert est ouvert ; le niveau suivant s'ouvre avec 1 étoile ;
//  - l'épreuve (boss) s'ouvre quand tous les autres niveaux du chapitre ont au moins 1 étoile ;
//  - le chapitre suivant s'ouvre quand l'épreuve a au moins 2 étoiles ;
//  - le point de départ dépend de l'âge : les chapitres prévus pour un âge inférieur sont ouverts d'office.
import type { ChapterDef, GameProgress, LevelDef, LevelResult, Profile, Track } from "./types";
import { addDays, daysBetween, dayKey } from "./util";
import { ageOf } from "./profile";

export const BOSS_STARS = 2;

/** Étoiles d'un niveau : 3 sans erreur, 2 pour 1 ou 2 erreurs, 1 au-delà (on gagne toujours). */
export function starsFor(errors: number): 1 | 2 | 3 {
  if (errors <= 0) return 3;
  if (errors <= 2) return 2;
  return 1;
}

/** Le chapitre de départ pour un âge : le dernier dont l'âge de début est atteint. */
export function startChapterForAge(track: Track, age: number): number {
  let idx = 0;
  track.chapters.forEach((c, i) => { if (c.ages[0] <= age) idx = i; });
  return idx;
}

export function getGameProgress(p: Profile, gameId: string, track: Track): GameProgress {
  let gp = p.progress[gameId];
  if (!gp) {
    gp = { levels: {}, unlockedChapter: startChapterForAge(track, ageOf(p)) };
    p.progress[gameId] = gp;
  }
  return gp;
}

export const levelStars = (gp: GameProgress, levelId: string) => gp.levels[levelId]?.stars ?? 0;

export function isChapterUnlocked(p: Profile, gp: GameProgress, track: Track, ci: number): boolean {
  if (p.settings.unlockAll) return ci < track.chapters.length;
  return ci <= gp.unlockedChapter;
}

export function isLevelUnlocked(p: Profile, gp: GameProgress, track: Track, ci: number, li: number): boolean {
  if (!isChapterUnlocked(p, gp, track, ci)) return false;
  if (p.settings.unlockAll) return true;
  const ch = track.chapters[ci];
  const lv = ch.levels[li];
  if (lv.boss) return ch.levels.filter((l) => !l.boss).every((l) => levelStars(gp, l.id) >= 1);
  if (li === 0) return true;
  return levelStars(gp, ch.levels[li - 1].id) >= 1;
}

export function chapterStars(gp: GameProgress, ch: ChapterDef): { got: number; max: number } {
  return { got: ch.levels.reduce((s, l) => s + levelStars(gp, l.id), 0), max: ch.levels.length * 3 };
}

export function isChapterDone(gp: GameProgress, ch: ChapterDef): boolean {
  const boss = ch.levels.find((l) => l.boss);
  return boss ? levelStars(gp, boss.id) >= BOSS_STARS : ch.levels.every((l) => levelStars(gp, l.id) >= 1);
}

export interface LevelRef { ci: number; li: number; chapter: ChapterDef; level: LevelDef }

export function findLevel(track: Track, levelId: string): LevelRef | null {
  for (let ci = 0; ci < track.chapters.length; ci++) {
    const li = track.chapters[ci].levels.findIndex((l) => l.id === levelId);
    if (li >= 0) return { ci, li, chapter: track.chapters[ci], level: track.chapters[ci].levels[li] };
  }
  return null;
}

/** Le niveau à jouer ensuite (« Continuer ») : le premier niveau ouvert sans étoile, en partant du chapitre le plus avancé. */
export function continueLevel(p: Profile, gp: GameProgress, track: Track): LevelRef {
  // d'abord le chapitre commencé et pas encore réussi (on finit ce qu'on a commencé)
  for (let ci = 0; ci < track.chapters.length; ci++) {
    const ch = track.chapters[ci];
    if (!isChapterUnlocked(p, gp, track, ci) || isChapterDone(gp, ch) || !ch.levels.some((l) => levelStars(gp, l.id) > 0)) continue;
    for (let li = 0; li < ch.levels.length; li++) {
      const l = ch.levels[li];
      const need = l.boss ? BOSS_STARS : 1;
      if (isLevelUnlocked(p, gp, track, ci, li) && levelStars(gp, l.id) < need) return { ci, li, chapter: ch, level: l };
    }
  }
  for (let ci = Math.min(gp.unlockedChapter, track.chapters.length - 1); ci >= 0; ci--) {
    const ch = track.chapters[ci];
    for (let li = 0; li < ch.levels.length; li++) {
      if (isLevelUnlocked(p, gp, track, ci, li) && levelStars(gp, ch.levels[li].id) === 0) return { ci, li, chapter: ch, level: ch.levels[li] };
    }
    // épreuve ratée (moins de 2 étoiles) : on la repropose
    const bi = ch.levels.findIndex((l) => l.boss);
    if (bi >= 0 && isLevelUnlocked(p, gp, track, ci, bi) && levelStars(gp, ch.levels[bi].id) < BOSS_STARS) return { ci, li: bi, chapter: ch, level: ch.levels[bi] };
    if (ci === Math.min(gp.unlockedChapter, track.chapters.length - 1)) {
      // tout est fini dans ce chapitre : le premier niveau sans 3 étoiles, sinon l'épreuve
      const li = ch.levels.findIndex((l) => levelStars(gp, l.id) < 3);
      const k = li >= 0 ? li : ch.levels.length - 1;
      return { ci, li: k, chapter: ch, level: ch.levels[k] };
    }
  }
  return { ci: 0, li: 0, chapter: track.chapters[0], level: track.chapters[0].levels[0] };
}

/** Le niveau qui suit dans le parcours (ou null à la toute fin). */
export function nextLevel(track: Track, ref: LevelRef): LevelRef | null {
  const ch = track.chapters[ref.ci];
  if (ref.li + 1 < ch.levels.length) return { ci: ref.ci, li: ref.li + 1, chapter: ch, level: ch.levels[ref.li + 1] };
  if (ref.ci + 1 < track.chapters.length) { const c = track.chapters[ref.ci + 1]; return { ci: ref.ci + 1, li: 0, chapter: c, level: c.levels[0] }; }
  return null;
}

// ---------------------------------------------------------------- XP et niveau du joueur
export const XP_PER_NEW_STAR = 10;
export const XP_BOSS_BONUS = 20;
export const XP_DAILY = 5;
export const MAX_PLAYER_LEVEL = 50;

/** XP totale nécessaire pour atteindre le niveau n du joueur (1 → 0, 2 → 40, 3 → 120, 4 → 240…). */
export const xpForLevel = (n: number) => 20 * (n - 1) * n;

export function playerLevel(xp: number): { level: number; into: number; need: number } {
  let level = 1;
  while (level < MAX_PLAYER_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const into = xp - xpForLevel(level);
  const need = level < MAX_PLAYER_LEVEL ? xpForLevel(level + 1) - xpForLevel(level) : 1;
  return { level, into, need };
}

// ---------------------------------------------------------------- séries de jours
/** Met à jour une série quand on joue aujourd'hui. Un jour manqué est rattrapé par un « gel » s'il en reste. */
export function touchStreak(s: { current: number; best: number; lastDay: string; freezes: number }, today = dayKey()) {
  if (s.lastDay === today) return s;
  const gap = s.lastDay ? daysBetween(s.lastDay, today) : Infinity;
  if (gap === 1) s.current += 1;
  else if (gap === 2 && s.freezes > 0) { s.freezes -= 1; s.current += 1; }
  else s.current = 1;
  s.best = Math.max(s.best, s.current);
  // un gel gagné tous les 7 jours de suite (2 au maximum)
  if (s.current % 7 === 0) s.freezes = Math.min(2, s.freezes + 1);
  s.lastDay = today;
  return s;
}

/** La série est-elle encore vivante (jouée aujourd'hui ou hier) ? */
export const streakAlive = (s: { lastDay: string }, today = dayKey()) => !!s.lastDay && daysBetween(s.lastDay, today) <= 1;

// ---------------------------------------------------------------- maîtrise
/** Moyenne glissante : les dernières parties comptent plus. */
export function updateMastery(p: Profile, skills: string[] | undefined, stars: number) {
  for (const sk of skills ?? []) {
    const m = p.mastery[sk] ?? { value: 0, plays: 0 };
    m.value = m.plays === 0 ? stars / 3 : m.value * 0.65 + (stars / 3) * 0.35;
    m.plays += 1;
    p.mastery[sk] = m;
  }
}
/** Une compétence est « maîtrisée » avec au moins 3 parties et 80 %. */
export const isMastered = (m?: { value: number; plays: number }) => !!m && m.plays >= 3 && m.value >= 0.8;

// ---------------------------------------------------------------- enregistrer un résultat
export interface RecordOutcome {
  xp: number;
  newStars: number;
  chapterUnlocked: number | null;
  best: number;
}

/** Enregistre la fin d'un niveau dans le profil. Renvoie ce qu'il faut fêter. */
export function recordLevel(p: Profile, gameId: string, track: Track, levelId: string, res: LevelResult, today = dayKey()): RecordOutcome {
  const gp = getGameProgress(p, gameId, track);
  const ref = findLevel(track, levelId);
  if (!ref) throw new Error(`niveau inconnu : ${gameId}/${levelId}`);
  const prev = gp.levels[levelId];
  const before = prev?.stars ?? 0;
  const best = Math.max(before, res.stars) as 0 | 1 | 2 | 3;
  gp.levels[levelId] = { stars: best, tries: (prev?.tries ?? 0) + 1, last: today };
  gp.lastPlayed = today;
  const newStars = best - before;
  let xp = newStars * XP_PER_NEW_STAR;
  let chapterUnlocked: number | null = null;
  if (ref.level.boss && res.stars >= BOSS_STARS && before < BOSS_STARS) {
    xp += XP_BOSS_BONUS;
    if (ref.ci + 1 < track.chapters.length && gp.unlockedChapter < ref.ci + 1) {
      gp.unlockedChapter = ref.ci + 1;
      chapterUnlocked = ref.ci + 1;
    }
  }
  if (p.streak.lastDay !== today) xp += XP_DAILY;
  touchStreak(p.streak, today);
  p.playLog[today] = (p.playLog[today] ?? 0) + Math.max(0, Math.round(res.seconds));
  updateMastery(p, ref.level.skills, res.stars);
  p.xp += xp;
  return { xp, newStars, chapterUnlocked, best };
}

/** Rejouer un niveau réussi il y a longtemps ou avec 1 étoile (pour la quête du jour). */
export function reviewCandidates(gp: GameProgress, track: Track, today = dayKey()): LevelDef[] {
  const out: LevelDef[] = [];
  for (const ch of track.chapters) for (const l of ch.levels) {
    const s = gp.levels[l.id];
    if (!s) continue;
    if (s.stars === 1 || daysBetween(s.last, today) >= 7) out.push(l);
  }
  return out;
}

export { addDays };
