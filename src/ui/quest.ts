// La quête du jour : 3 activités choisies pour le profil (continuer, réviser ou apprendre, découvrir).
// Même choix toute la journée (hasard tiré du jour et du profil).
import type { Profile } from "../core/types";
import { continueLevel, getGameProgress, reviewCandidates } from "../core/progress";
import { ageOf } from "../core/profile";
import { dayKey, hashString, seeded, pick } from "../core/util";
import type { GameCtx, GameDef } from "../games/types";

export interface QuestItem { kind: "continue" | "review" | "discover" | "learn"; game: GameDef; levelId: string }

export function dailyQuest(p: Profile, games: GameDef[], ctx: GameCtx, today = dayKey()): QuestItem[] {
  const rng = seeded(hashString(p.id + today));
  const age = ageOf(p);
  const fits = games.filter((g) => age >= g.ages[0] && age <= g.ages[1]);
  const out: QuestItem[] = [];
  const used = new Set<string>();
  const add = (kind: QuestItem["kind"], game: GameDef, levelId: string) => { if (!used.has(game.id)) { used.add(game.id); out.push({ kind, game, levelId }); } };
  const played = fits.filter((g) => p.progress[g.id]?.lastPlayed).sort((a, b) => (p.progress[b.id].lastPlayed! > p.progress[a.id].lastPlayed! ? 1 : -1));
  // 1. continuer le jeu le plus récent (sinon le premier jeu conseillé)
  const first = played[0] ?? fits.find((g) => g.category !== "langues") ?? fits[0];
  if (first) { const tr = first.track(ctx); add("continue", first, continueLevel(p, getGameProgress(p, first.id, tr), tr).level.id); }
  // 2. une langue apprise (prioritaire), sinon une révision
  const lang = fits.find((g) => g.category === "langues" && !used.has(g.id));
  if (lang) { const tr = lang.track(ctx); add("learn", lang, continueLevel(p, getGameProgress(p, lang.id, tr), tr).level.id); }
  else {
    for (const g of played) {
      const tr = g.track(ctx);
      const rev = reviewCandidates(getGameProgress(p, g.id, tr), tr, today);
      if (rev.length && !used.has(g.id)) { add("review", g, pick(rev, rng).id); break; }
    }
  }
  // 3. découvrir un jeu jamais joué
  const fresh = fits.filter((g) => !p.progress[g.id] || !Object.keys(p.progress[g.id].levels).length).filter((g) => !used.has(g.id));
  if (fresh.length) { const g = pick(fresh, rng); const tr = g.track(ctx); add("discover", g, continueLevel(p, getGameProgress(p, g.id, tr), tr).level.id); }
  // compléter avec d'autres jeux joués
  for (const g of fits) { if (out.length >= 3) break; if (!used.has(g.id)) { const tr = g.track(ctx); add("continue", g, continueLevel(p, getGameProgress(p, g.id, tr), tr).level.id); } }
  return out.slice(0, 3);
}

/** Une activité de la quête est faite si ce niveau a été joué aujourd'hui. */
export const questDone = (p: Profile, q: QuestItem, today = dayKey()) => p.progress[q.game.id]?.levels[q.levelId]?.last === today;
