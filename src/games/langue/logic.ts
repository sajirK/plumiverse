// Cours de langue : logique pure (testée). Quel exercice pour quel âge, quels mots, quels choix.
import type { AgeBand, ChapterDef, Lang, LevelDef, Track } from "../../core/types";
import { L } from "../../core/types";
import { UNITS, WORDS, SENTENCES, wordsOfUnit, sentencesOfUnit, type Word } from "../../content/lang/course";
import { shuffle, type Rng } from "../../core/util";

/** Les types d'exercices. */
export type Kind =
  | "listen"     // entendre le mot → toucher l'image (zéro lecture)
  | "read"       // voir l'image → toucher le mot écrit
  | "translate"  // mot dans la langue apprise → sa traduction
  | "reverse"    // mot dans sa langue → le mot dans la langue apprise
  | "build"      // remettre une phrase dans l'ordre
  | "type";      // écrire le mot entendu

/** Le programme d'une unité : 5 niveaux + une épreuve. L'exercice dépend de l'âge (§ 4.9 de la spec). */
export const STEPS: Record<AgeBand, Kind[]> = {
  "3-5": ["listen", "listen", "listen", "listen", "listen"],
  "6-8": ["listen", "listen", "read", "read", "reverse"],
  "9-11": ["listen", "read", "translate", "build", "type"],
  "12-14": ["read", "translate", "reverse", "build", "type"],
};
/** Nombre de choix proposés selon l'âge et l'étape. */
export function choiceCount(band: AgeBand, step: number): number {
  if (band === "3-5") return [3, 3, 4, 4, 4][step] ?? 4;
  if (band === "6-8") return [3, 4, 4, 4, 4][step] ?? 4;
  return 4;
}

export const STEP_NAMES = [
  L("Découverte", "Discover", "Entdecken", "Descubre"),
  L("Écoute", "Listen", "Hören", "Escucha"),
  L("Entraînement", "Practice", "Üben", "Practica"),
  L("Défi", "Challenge", "Herausforderung", "Desafío"),
  L("Maître des mots", "Word master", "Wortmeister", "Maestro de palabras"),
];

/** Le parcours d'une langue : un chapitre par unité, tout le monde commence à l'unité 1. */
export function courseTrack(target: Lang): Track {
  const chapters: ChapterDef[] = UNITS.map((u, ui) => ({
    id: u.id,
    tier: u.cefr === "pre-A1" ? "facile" : "moyen",
    ages: ui === 0 ? [3, 14] : [99, 99], // une langue nouvelle se commence au début, quel que soit l'âge
    title: u.title,
    levels: [
      ...[0, 1, 2, 3, 4].map((step): LevelDef => ({ id: `${u.id}-${step + 1}`, rounds: step === 0 ? 6 : 8, params: { unit: u.id, step, target }, skills: [`${target}.${u.id}`] })),
      { id: `${u.id}-epreuve`, rounds: 8, boss: true, params: { unit: u.id, step: 5, target }, skills: [`${target}.${u.id}`] },
    ],
  }));
  return { chapters };
}

/** Exercice d'une manche : l'épreuve mélange les exercices de l'âge. */
export function kindFor(band: AgeBand, step: number, round: number, unit: string): Kind {
  const steps = STEPS[band];
  let k = step < 5 ? steps[step] : steps[(round * 2 + 1) % steps.length];
  // pas de phrase à construire dans une unité sans phrases (sécurité)
  if (k === "build" && !sentencesOfUnit(unit).length) k = "translate";
  return k;
}

/** Les unités vues jusqu'ici (pour les révisions et les distracteurs). */
export function unitsUpTo(unit: string): string[] {
  const n = UNITS.find((u) => u.id === unit)?.n ?? 1;
  return UNITS.filter((u) => u.n <= n).map((u) => u.id);
}

/**
 * Choix pour un mot : le bon + des distracteurs de la même unité (sinon des unités d'avant),
 * jamais deux fois la même image ni le même texte, dans la langue montrée.
 */
export function choicesFor(word: Word, n: number, showLang: Lang | "image", rng: Rng = Math.random): Word[] {
  const key = (w: Word) => (showLang === "image" ? w.color ?? w.e : w.t[showLang].show.toLowerCase());
  const pool = [...shuffle(wordsOfUnit(word.unit), rng), ...shuffle(WORDS.filter((w) => unitsUpTo(word.unit).includes(w.unit) && w.unit !== word.unit), rng)];
  const out = [word];
  const seen = new Set([key(word)]);
  for (const w of pool) {
    if (out.length >= n) break;
    if (seen.has(key(w))) continue;
    seen.add(key(w)); out.push(w);
  }
  return shuffle(out, rng);
}

/** Les phrases d'une unité pour un niveau « build » (une par manche, en boucle). */
export const sentencesFor = (unit: string) => sentencesOfUnit(unit);

/** Lettres spéciales proposées sous le champ de saisie, par langue apprise. */
export const SPECIAL_LETTERS: Record<Lang, string[]> = {
  fr: ["é", "è", "ê", "à", "ç", "ô", "œ", "'"],
  en: ["'"],
  de: ["ä", "ö", "ü", "ß"],
  es: ["á", "é", "í", "ó", "ú", "ñ"],
};

export { WORDS, SENTENCES };
