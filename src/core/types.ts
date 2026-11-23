// Types partagés de Plumiverse. Aucune dépendance au DOM : tout le dossier core/ est testé avec Vitest.

/** Les 4 langues de l'interface et des cours. */
export type Lang = "fr" | "en" | "de" | "es";
export const LANGS: Lang[] = ["fr", "en", "de", "es"];

/** Un texte dans les 4 langues. */
export type Tr = Record<Lang, string>;
/** Raccourci pour écrire un texte dans les 4 langues : L("Bonjour", "Hello", "Hallo", "Hola"). */
export const L = (fr: string, en: string, de: string, es: string): Tr => ({ fr, en, de, es });

/** Tranches d'âge : elles changent l'interface (taille, texte, récompenses). */
export type AgeBand = "3-5" | "6-8" | "9-11" | "12-14";
export const AGE_BANDS: AgeBand[] = ["3-5", "6-8", "9-11", "12-14"];

/** Les 4 paliers de difficulté. Un palier = un ou plusieurs chapitres d'un parcours. */
export type Tier = "facile" | "moyen" | "difficile" | "expert";
export const TIERS: Tier[] = ["facile", "moyen", "difficile", "expert"];

export type Category = "lire-ecrire" | "maths" | "langues" | "logique" | "sciences" | "histoire-geo" | "emotions" | "arcade" | "creer";
export const CATEGORIES: Category[] = ["langues", "lire-ecrire", "maths", "logique", "sciences", "histoire-geo", "emotions", "arcade", "creer"];

/** Un niveau : une partie courte, avec ses paramètres (lus par le jeu). */
export interface LevelDef {
  id: string;
  rounds: number;
  params: Record<string, unknown>;
  /** Compétences travaillées (pour la maîtrise, vue par le parent). */
  skills?: string[];
  /** Épreuve de fin de chapitre : il faut 2 étoiles pour ouvrir le chapitre suivant. */
  boss?: boolean;
}

/** Un chapitre : des niveaux d'un même palier, puis une épreuve. */
export interface ChapterDef {
  id: string;
  tier: Tier;
  /** Âges pour lesquels ce chapitre est le bon point de départ. */
  ages: [number, number];
  title: Tr;
  levels: LevelDef[];
}

export interface Track {
  chapters: ChapterDef[];
}

export interface LevelResult {
  stars: 0 | 1 | 2 | 3;
  errors: number;
  seconds: number;
}

/** Progression d'un profil dans un jeu. */
export interface GameProgress {
  levels: Record<string, { stars: 0 | 1 | 2 | 3; tries: number; last: string }>;
  /** Index du dernier chapitre ouvert (les chapitres d'avant sont ouverts aussi). */
  unlockedChapter: number;
  lastPlayed?: string;
}

/** Suivi d'un mot dans un cours de langue (révisions espacées, boîtes de Leitner 1 à 5). */
export interface WordState { box: number; due: string; seen: number; wrong: number }

export interface LangProgress {
  words: Record<string, WordState>;
  streak: Streak;
}

export interface Streak { current: number; best: number; lastDay: string; freezes: number }

export interface ProfileSettings {
  voice: boolean;
  sounds: boolean;
  /** Minutes de jeu par jour (0 = pas de limite). */
  dailyLimit: number;
  /** Jeux ou catégories bloqués par le parent : "ecrire" ou "cat:arcade". */
  blocked: string[];
  unlockAll: boolean;
}

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  birthYear: number;
  uiLang: Lang;
  learning: Lang[];
  createdAt: string;
  settings: ProfileSettings;
  progress: Record<string, GameProgress>;
  langs: Partial<Record<Lang, LangProgress>>;
  /** Maîtrise par compétence (0 → 1) et nombre de parties prises en compte. */
  mastery: Record<string, { value: number; plays: number }>;
  trophies: Record<string, string>;
  xp: number;
  streak: Streak;
  /** Secondes jouées par jour ("2026-11-23" → 640). */
  playLog: Record<string, number>;
  seenVersion: string;
}
