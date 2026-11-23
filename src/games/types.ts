// Le contrat d'un jeu Plumiverse. Un jeu = des données (parcours) + une mécanique (start).
import type { AgeBand, Category, Lang, LevelDef, Profile, Tr, Track } from "../core/types";
import type { RoundApi } from "../kit/kit";

export interface GameCtx {
  profile: Profile;
  age: number;
  band: AgeBand;
  /** Langue de l'interface et des consignes. */
  lang: Lang;
}

export interface GameDef {
  id: string;
  icon: string;
  category: Category;
  /** Âges conseillés (le catalogue filtre avec). */
  ages: [number, number];
  title: Tr;
  /** Une phrase pour le parent et pour le SEO : ce que le jeu fait apprendre. */
  desc: Tr;
  /** Nom des compétences (pour l'espace parent). */
  skills?: Record<string, Tr>;
  isNew?: boolean;
  /** Jeu libre (dessin, piano, respiration…) : un seul niveau, pas d'épreuve ni de difficulté. */
  free?: boolean;
  /** Le jeu n'apparaît que si… (ex. un cours de langue seulement si la langue est apprise). */
  available?(ctx: GameCtx): boolean;
  track(ctx: GameCtx): Track;
  /** Consigne dite au début du niveau (dans la langue de l'interface). */
  instruction(level: LevelDef, ctx: GameCtx): string;
  /** Prépare les données d'un niveau (tirées une fois pour toutes les manches). */
  setup?(level: LevelDef, ctx: GameCtx): unknown;
  /** Phrases que le jeu peut dire en plus de ses consignes (pour générer les voix à l'avance). */
  speech?(lang: Lang): string[];
  /** Construit une manche. */
  start(round: RoundApi, level: LevelDef, ctx: GameCtx): void;
}
