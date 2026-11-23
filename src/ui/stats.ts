// Statistiques anonymes (GoatCounter), seulement si le parent l'a autorisé dans l'espace parent.
// Aucun prénom, âge, identifiant de profil ou parcours individuel n'est envoyé.
import { state } from "./app";
import type { Lang } from "../core/types";

/** Code du site GoatCounter (https://<code>.goatcounter.com). Vide = statistiques désactivées. */
export const GOATCOUNTER = (import.meta.env.VITE_GOATCOUNTER as string | undefined) ?? "";

function send(path: string, title: string, event: boolean) {
  if (!GOATCOUNTER || !state.meta?.statsConsent) return;
  const params = new URLSearchParams({ p: path, t: title, rnd: Math.random().toString(36).slice(2) });
  if (event) params.set("e", "true");
  const url = `https://${GOATCOUNTER}.goatcounter.com/count?${params}`;
  // un pixel : pas de cookie, pas de script tiers
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.src = url;
}

function track(eventName: string) {
  send(`/e/${eventName}`, eventName, true);
}

export type AppScreen = "start" | "who" | "home" | "trophies" | "me" | "game" | "play" | "parent" | "parent-profile" | "parent-family";

/** Pages internes anonymisées : on ne transmet jamais le hash complet ni l'identifiant d'un profil. */
export function trackScreenView(screen: AppScreen) {
  send(`/app/${screen}`, `app/${screen}`, false);
}

/** Événements limités aux tendances globales. Ne jamais ajouter d'identifiant de profil ici. */
export const trackProfileCreated = (lang: Lang) => track(`profil/nouveau/${lang}`);
export const trackGameStarted = (gameId: string) => {
  if (/^[a-z0-9-]+$/.test(gameId)) track(`jeu/${gameId}/debut`);
};
export const trackLevelFinished = (gameId: string, levelId: string, stars: number) => {
  if (/^[a-z0-9-]+$/.test(gameId) && /^[a-z0-9-]+$/.test(levelId) && Number.isInteger(stars) && stars >= 1 && stars <= 3) {
    track(`jeu/${gameId}/${levelId}/fin/${stars}`);
  }
};
