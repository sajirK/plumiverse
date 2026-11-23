// La liste des jeux. Ajouter un jeu = l'importer ici (le catalogue, les pages SEO et les tests le prennent tout seuls).
import type { GameDef, GameCtx } from "./types";
import { couleursGame } from "./couleurs/game";
import { ecrireGame } from "./ecrire/game";
import { calculGame } from "./calcul/game";
import { LANGUAGE_GAMES } from "./langue/game";
import { memoireGame } from "./memoire/game";
import { suitesGame } from "./suites/game";
import { intrusGame } from "./intrus/game";
import { codeGame } from "./code/game";
import { horlogeGame } from "./horloge/game";
import { monnaieGame } from "./monnaie/game";
import { taupeGame } from "./taupe/game";
import { bullesGame } from "./bulles/game";
import { reflexeGame } from "./reflexe/game";
import { fruitsGame } from "./fruits/game";
import { dinoGame } from "./dino/game";
import { courseGame } from "./course/game";
import { tresorsGame } from "./tresors/game";
import { mondeGame } from "./monde/game";
import { saisonsGame } from "./saisons/game";
import { jardinGame } from "./jardin/game";
import { melodieGame } from "./melodie/game";
import { docteurGame } from "./docteur/game";
import { pizzeriaGame } from "./pizzeria/game";
import { glacierGame } from "./glacier/game";

export const GAMES: GameDef[] = [...LANGUAGE_GAMES, couleursGame, ecrireGame, calculGame, memoireGame, suitesGame, intrusGame, codeGame, horlogeGame, monnaieGame,
  bullesGame, taupeGame, fruitsGame, reflexeGame, dinoGame, courseGame, tresorsGame,
  mondeGame, saisonsGame, jardinGame, docteurGame, pizzeriaGame, glacierGame, melodieGame];

export const gameById = (id: string) => GAMES.find((g) => g.id === id);

/** Jeux visibles pour un profil (disponibles et non bloqués par le parent). */
export function visibleGames(ctx: GameCtx, isBlocked: (g: GameDef) => boolean): GameDef[] {
  return GAMES.filter((g) => (g.available ? g.available(ctx) : true) && !isBlocked(g));
}

/** Un jeu convient-il à cet âge ? (le catalogue « Pour moi ») */
export const fitsAge = (g: GameDef, age: number) => age >= g.ages[0] && age <= g.ages[1];
