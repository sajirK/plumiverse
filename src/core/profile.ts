// Profils enfants : création, âge, tranche d'âge, reprise des sauvegardes de la V2.
import { type AgeBand, type Lang, type Profile, LANGS } from "./types";
import { dayKey, uid } from "./util";

export const AVATARS = ["🦊", "🐼", "🐯", "🐰", "🐸", "🦁", "🐨", "🐙", "🦄", "🐧", "🐻", "🐶"];
export const MAX_PROFILES = 6;
export const SCHEMA_VERSION = 1;

export function ageOf(p: Pick<Profile, "birthYear">, today = new Date()): number {
  return Math.max(3, Math.min(14, today.getFullYear() - p.birthYear));
}

export function bandForAge(age: number): AgeBand {
  if (age <= 5) return "3-5";
  if (age <= 8) return "6-8";
  if (age <= 11) return "9-11";
  return "12-14";
}

export const bandOf = (p: Pick<Profile, "birthYear">, today = new Date()) => bandForAge(ageOf(p, today));

/** Les tout-petits ne lisent pas : tout passe par la voix et les images. */
export const canRead = (band: AgeBand) => band !== "3-5";

export function createProfile(opts: { name?: string; avatar?: string; age?: number; uiLang?: Lang; learning?: Lang[] }, today = new Date()): Profile {
  const age = Math.max(3, Math.min(14, Math.round(opts.age ?? 5)));
  const uiLang = opts.uiLang ?? "fr";
  return {
    id: uid(),
    name: cleanName(opts.name ?? ""),
    avatar: opts.avatar ?? AVATARS[0],
    birthYear: today.getFullYear() - age,
    uiLang,
    learning: (opts.learning ?? defaultLearning(uiLang)).filter((l) => l !== uiLang),
    createdAt: dayKey(today),
    settings: { voice: true, sounds: true, dailyLimit: 0, blocked: [], unlockAll: false },
    progress: {},
    langs: {},
    mastery: {},
    trophies: {},
    xp: 0,
    streak: { current: 0, best: 0, lastDay: "", freezes: 0 },
    playLog: {},
    seenVersion: "",
  };
}

/** Par défaut, on apprend l'anglais ; un anglophone apprend l'espagnol. */
export function defaultLearning(ui: Lang): Lang[] {
  return ui === "en" ? ["es"] : ["en"];
}

/** Prénom propre : lettres, espaces, tirets, 20 caractères max. */
export function cleanName(s: string): string {
  return String(s).replace(/[^\p{L}\p{M} '-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 20);
}

/** Nom affiché : le prénom, sinon l'animal choisi. */
export const displayName = (p: Profile) => p.name || p.avatar;

/** Complète un profil lu sur l'appareil (anciennes versions du schéma) avec les valeurs par défaut. */
export function normalizeProfile(raw: Partial<Profile>): Profile {
  const base = createProfile({ uiLang: LANGS.includes(raw.uiLang as Lang) ? raw.uiLang : "fr" });
  return {
    ...base,
    ...raw,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    streak: { ...base.streak, ...(raw.streak ?? {}) },
    progress: raw.progress ?? {},
    langs: raw.langs ?? {},
    mastery: raw.mastery ?? {},
    trophies: raw.trophies ?? {},
    playLog: raw.playLog ?? {},
  } as Profile;
}

/**
 * Reprise de la V2 « Les Petits Jeux » (même domaine sajirk.github.io → même localStorage).
 * Renvoie un profil prêt à être proposé, ou null s'il n'y a rien à reprendre.
 */
export function profileFromV2(storage: Pick<Storage, "getItem">, uiLang: Lang = "fr", today = new Date()): Profile | null {
  const name = storage.getItem("jeux.prenom");
  const avatar = storage.getItem("jeux.avatar");
  const age = parseInt(storage.getItem("jeux.age") || "0", 10);
  const stars = parseInt(storage.getItem("jeux.stars") || "0", 10);
  if (!name && !avatar && !stars) return null;
  const p = createProfile({ name: name ?? "", avatar: avatar ?? undefined, age: age || 5, uiLang }, today);
  // les étoiles V2 deviennent un peu d'XP de départ (un cadeau de bienvenue, pas une conversion exacte)
  p.xp = Math.min(500, Math.max(0, stars) * 5);
  return p;
}
