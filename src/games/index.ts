// La liste des jeux. Ajouter un jeu = l'importer ici (le catalogue, les pages SEO et les tests le prennent tout seuls).
import type { GameDef, GameCtx } from "./types";
import { couleursGame } from "./couleurs/game";
import { ecrireGame } from "./ecrire/game";
import { calculGame } from "./calcul/game";
import { LANGUAGE_GAMES } from "./langue/game";

export const GAMES: GameDef[] = [...LANGUAGE_GAMES, couleursGame, ecrireGame, calculGame];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Jeux visibles pour un profil (disponibles et non bloqués par le parent). */
export function visibleGames(ctx: GameCtx, isBlocked: (g: GameDef) => boolean): GameDef[] {
  return GAMES.filter((g) => (g.available ? g.available(ctx) : true) && !isBlocked(g));
}

/** Un jeu convient-il à cet âge ? (le catalogue « Pour moi ») */
export const fitsAge = (g: GameDef, age: number) => age >= g.ages[0] && age <= g.ages[1];
