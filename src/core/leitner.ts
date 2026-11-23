// Révisions espacées (boîtes de Leitner) pour les mots des cours de langue.
// Boîte 1 : à revoir tout de suite ; 2 : le lendemain ; 3 : dans 3 jours ; 4 : 7 jours ; 5 : 21 jours.
// Un mot est « appris » à partir de la boîte 3.
import type { LangProgress, WordState } from "./types";
import { addDays, dayKey, shuffle, type Rng } from "./util";

export const INTERVALS = [0, 0, 1, 3, 7, 21]; // index = boîte
export const LEARNED_BOX = 3;

export function emptyLangProgress(): LangProgress {
  return { words: {}, streak: { current: 0, best: 0, lastDay: "", freezes: 0 } };
}

/** Réponse à un mot : juste → boîte suivante ; faux → retour en boîte 1. */
export function answerWord(lp: LangProgress, wordId: string, correct: boolean, today = dayKey()): WordState {
  const w = lp.words[wordId] ?? { box: 0, due: today, seen: 0, wrong: 0 };
  w.seen += 1;
  if (correct) w.box = Math.min(5, Math.max(1, w.box + 1));
  else { w.box = 1; w.wrong += 1; }
  w.due = addDays(today, INTERVALS[w.box]);
  lp.words[wordId] = w;
  return w;
}

export const learnedCount = (lp?: LangProgress) => (lp ? Object.values(lp.words).filter((w) => w.box >= LEARNED_BOX).length : 0);

export function isDue(w: WordState, today = dayKey()) { return w.due <= today; }

/**
 * Les mots d'une séance : d'abord les mots à revoir (dus), puis des mots nouveaux de l'unité,
 * pour arriver à `size` mots. Les mots de l'unité déjà connus complètent si besoin.
 */
export function sessionWords(lp: LangProgress, unitWordIds: string[], allWordIds: string[], size: number, rng: Rng = Math.random, today = dayKey()): string[] {
  const due = shuffle(allWordIds.filter((id) => lp.words[id] && isDue(lp.words[id], today)), rng).sort((a, b) => lp.words[a].box - lp.words[b].box);
  const fresh = shuffle(unitWordIds.filter((id) => !lp.words[id]), rng);
  const known = shuffle(unitWordIds.filter((id) => lp.words[id] && !due.includes(id)), rng);
  const out: string[] = [];
  // au plus la moitié de révisions, pour que chaque séance apporte du nouveau
  for (const id of due.slice(0, Math.ceil(size / 2))) out.push(id);
  for (const id of [...fresh, ...known, ...due]) { if (out.length >= size) break; if (!out.includes(id)) out.push(id); }
  return out.slice(0, size);
}
