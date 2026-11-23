// Trophées : un catalogue de règles lues sur le profil. Les nouveaux trophées sont fêtés à la fin d'un niveau.
import { L, type Lang, type Profile, type Track, type Tr } from "./types";
import { isChapterDone, levelStars, playerLevel } from "./progress";
import { learnedCount } from "./leitner";
import { dayKey } from "./util";

export interface TrophyCtx { tracks: Record<string, Track> }
export interface TrophyDef { id: string; icon: string; family: "decouverte" | "maitrise" | "regularite" | "langues" | "joueur"; title: Tr; hint: Tr; test: (p: Profile, c: TrophyCtx) => boolean }

const gamesPlayed = (p: Profile) => Object.values(p.progress).filter((g) => Object.keys(g.levels).length > 0).length;
const chaptersDone = (p: Profile, c: TrophyCtx) => Object.entries(p.progress).reduce((n, [id, gp]) => n + (c.tracks[id]?.chapters.filter((ch) => isChapterDone(gp, ch)).length ?? 0), 0);
const perfectChapter = (p: Profile, c: TrophyCtx) => Object.entries(p.progress).some(([id, gp]) => c.tracks[id]?.chapters.some((ch) => ch.levels.every((l) => levelStars(gp, l.id) === 3)));
const words = (p: Profile) => (Object.keys(p.langs) as Lang[]).reduce((n, l) => n + learnedCount(p.langs[l]), 0);
const totalMinutes = (p: Profile) => Object.values(p.playLog).reduce((a, b) => a + b, 0) / 60;
const langsStarted = (p: Profile) => (Object.keys(p.langs) as Lang[]).filter((l) => learnedCount(p.langs[l]) >= 5).length;

export const TROPHIES: TrophyDef[] = [
  { id: "premier-pas", icon: "👣", family: "decouverte", title: L("Premier pas", "First step", "Erster Schritt", "Primer paso"), hint: L("Finis un niveau.", "Finish a level.", "Schaffe ein Level.", "Termina un nivel."), test: (p) => gamesPlayed(p) >= 1 },
  { id: "curieux", icon: "🔍", family: "decouverte", title: L("Curieux", "Curious", "Neugierig", "Curioso"), hint: L("Joue à 3 jeux différents.", "Play 3 different games.", "Spiele 3 verschiedene Spiele.", "Juega a 3 juegos diferentes."), test: (p) => gamesPlayed(p) >= 3 },
  { id: "explorateur", icon: "🧭", family: "decouverte", title: L("Explorateur", "Explorer", "Entdecker", "Explorador"), hint: L("Joue à 6 jeux différents.", "Play 6 different games.", "Spiele 6 verschiedene Spiele.", "Juega a 6 juegos diferentes."), test: (p) => gamesPlayed(p) >= 6 },
  { id: "chapitre-1", icon: "📗", family: "maitrise", title: L("Chapitre réussi", "Chapter cleared", "Kapitel geschafft", "Capítulo superado"), hint: L("Réussis une épreuve de chapitre.", "Pass a chapter challenge.", "Bestehe eine Kapitel-Prüfung.", "Supera una prueba de capítulo."), test: (p, c) => chaptersDone(p, c) >= 1 },
  { id: "chapitre-5", icon: "📚", family: "maitrise", title: L("Bibliothèque", "Bookworm", "Bücherwurm", "Biblioteca"), hint: L("Réussis 5 chapitres.", "Clear 5 chapters.", "Schaffe 5 Kapitel.", "Supera 5 capítulos."), test: (p, c) => chaptersDone(p, c) >= 5 },
  { id: "parfait", icon: "💎", family: "maitrise", title: L("Sans faute", "Flawless", "Fehlerlos", "Perfecto"), hint: L("3 étoiles à tous les niveaux d'un chapitre.", "3 stars on every level of a chapter.", "3 Sterne in allen Levels eines Kapitels.", "3 estrellas en todos los niveles de un capítulo."), test: perfectChapter },
  { id: "serie-3", icon: "🔥", family: "regularite", title: L("3 jours de suite", "3-day streak", "3 Tage am Stück", "3 días seguidos"), hint: L("Joue 3 jours de suite.", "Play 3 days in a row.", "Spiele 3 Tage hintereinander.", "Juega 3 días seguidos."), test: (p) => p.streak.best >= 3 },
  { id: "serie-7", icon: "🌟", family: "regularite", title: L("Une semaine !", "A whole week!", "Eine ganze Woche!", "¡Una semana!"), hint: L("Joue 7 jours de suite.", "Play 7 days in a row.", "Spiele 7 Tage hintereinander.", "Juega 7 días seguidos."), test: (p) => p.streak.best >= 7 },
  { id: "serie-30", icon: "🏆", family: "regularite", title: L("Un mois !", "A whole month!", "Ein ganzer Monat!", "¡Un mes!"), hint: L("Joue 30 jours de suite.", "Play 30 days in a row.", "Spiele 30 Tage hintereinander.", "Juega 30 días seguidos."), test: (p) => p.streak.best >= 30 },
  { id: "mots-10", icon: "💬", family: "langues", title: L("Premiers mots", "First words", "Erste Wörter", "Primeras palabras"), hint: L("Apprends 10 mots d'une autre langue.", "Learn 10 words in another language.", "Lerne 10 Wörter einer anderen Sprache.", "Aprende 10 palabras de otro idioma."), test: (p) => words(p) >= 10 },
  { id: "mots-50", icon: "🗣️", family: "langues", title: L("Bavard", "Chatterbox", "Plaudertasche", "Parlanchín"), hint: L("Apprends 50 mots.", "Learn 50 words.", "Lerne 50 Wörter.", "Aprende 50 palabras."), test: (p) => words(p) >= 50 },
  { id: "mots-150", icon: "🌍", family: "langues", title: L("Globe-trotteur", "Globetrotter", "Weltenbummler", "Trotamundos"), hint: L("Apprends 150 mots.", "Learn 150 words.", "Lerne 150 Wörter.", "Aprende 150 palabras."), test: (p) => words(p) >= 150 },
  { id: "polyglotte", icon: "🦜", family: "langues", title: L("Polyglotte", "Polyglot", "Sprachtalent", "Políglota"), hint: L("Apprends des mots dans 2 langues.", "Learn words in 2 languages.", "Lerne Wörter in 2 Sprachen.", "Aprende palabras en 2 idiomas."), test: (p) => langsStarted(p) >= 2 },
  { id: "niveau-5", icon: "⭐", family: "joueur", title: L("Niveau 5", "Level 5", "Level 5", "Nivel 5"), hint: L("Atteins le niveau 5.", "Reach level 5.", "Erreiche Level 5.", "Alcanza el nivel 5."), test: (p) => playerLevel(p.xp).level >= 5 },
  { id: "niveau-10", icon: "🌠", family: "joueur", title: L("Niveau 10", "Level 10", "Level 10", "Nivel 10"), hint: L("Atteins le niveau 10.", "Reach level 10.", "Erreiche Level 10.", "Alcanza el nivel 10."), test: (p) => playerLevel(p.xp).level >= 10 },
  { id: "heure", icon: "⏳", family: "joueur", title: L("Une heure d'apprentissage", "One hour of learning", "Eine Stunde Lernen", "Una hora aprendiendo"), hint: L("Joue une heure en tout.", "Play one hour in total.", "Spiele insgesamt eine Stunde.", "Juega una hora en total."), test: (p) => totalMinutes(p) >= 60 },
];

/** Vérifie les trophées et note ceux qui viennent d'être gagnés. */
export function checkTrophies(p: Profile, ctx: TrophyCtx, today = dayKey()): TrophyDef[] {
  const won: TrophyDef[] = [];
  for (const t of TROPHIES) if (!p.trophies[t.id] && t.test(p, ctx)) { p.trophies[t.id] = today; won.push(t); }
  return won;
}
