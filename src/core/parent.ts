// Espace parent : porte d'entrée (calcul écrit en toutes lettres), temps de jeu, blocages.
import type { Category, Lang, Profile } from "./types";
import { numberWords } from "./numwords";
import { dayKey, randInt, type Rng } from "./util";

const PLUS: Record<Lang, string> = { fr: "plus", en: "plus", de: "plus", es: "más" };

/** Une question pour adulte : « trente-sept plus vingt-quatre ». Un enfant de 5 ans ne peut pas la lire. */
export function parentGate(lang: Lang, rng: Rng = Math.random): { question: string; answer: number } {
  const a = randInt(13, 48, rng), b = randInt(13, 48, rng);
  return { question: `${numberWords(a, lang)} ${PLUS[lang]} ${numberWords(b, lang)}`, answer: a + b };
}

export const LIMIT_CHOICES = [0, 15, 30, 45, 60];

export const secondsToday = (p: Profile, today = dayKey()) => p.playLog[today] ?? 0;

/** Minutes restantes aujourd'hui (Infinity s'il n'y a pas de limite). */
export function minutesLeft(p: Profile, extraSeconds = 0, today = dayKey()): number {
  if (!p.settings.dailyLimit) return Infinity;
  return Math.max(0, p.settings.dailyLimit - (secondsToday(p, today) + extraSeconds) / 60);
}

export function isBlocked(p: Profile, gameId: string, category: Category): boolean {
  return p.settings.blocked.includes(gameId) || p.settings.blocked.includes("cat:" + category);
}

export function toggleBlock(p: Profile, key: string) {
  const i = p.settings.blocked.indexOf(key);
  if (i >= 0) p.settings.blocked.splice(i, 1);
  else p.settings.blocked.push(key);
}

/** Minutes jouées sur les 7 derniers jours (du plus ancien à aujourd'hui). */
export function lastWeek(p: Profile, today = new Date()): { day: string; minutes: number }[] {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const k = dayKey(d);
    out.push({ day: k, minutes: Math.round((p.playLog[k] ?? 0) / 60) });
  }
  return out;
}
