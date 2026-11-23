// Statistiques anonymes (GoatCounter), seulement si le parent l'a autorisé dans l'espace parent.
// Aucun prénom, aucun âge exact, aucun identifiant d'enfant : uniquement des compteurs d'événements.
import { state } from "./app";

/** Code du site GoatCounter (https://<code>.goatcounter.com). Vide = statistiques désactivées. */
export const GOATCOUNTER = (import.meta.env.VITE_GOATCOUNTER as string | undefined) ?? "";

export function track(event: string) {
  if (!GOATCOUNTER || !state.meta?.statsConsent) return;
  const url = `https://${GOATCOUNTER}.goatcounter.com/count?p=${encodeURIComponent("/e/" + event)}&t=${encodeURIComponent(event)}&e=true&rnd=${Math.random().toString(36).slice(2)}`;
  // un pixel : pas de cookie, pas de script tiers
  const img = new Image();
  img.referrerPolicy = "no-referrer";
  img.src = url;
}
