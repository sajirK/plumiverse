// Les 4 voix de Plume (une par langue). Partagé par le lecteur (navigateur) et par scripts/build-audio.ts.
// Changer une voix = changer ce fichier puis relancer `npm run audio` (les empreintes changent, tout est régénéré).
import type { Lang } from "../core/types";
import { hashString } from "../core/util";

export interface VoiceConfig { azure: string; locale: string; rate: number; pitch: string }

export const VOICES: Record<Lang, VoiceConfig> = {
  fr: { azure: "fr-FR-DeniseNeural", locale: "fr-FR", rate: 0.92, pitch: "+0%" },
  en: { azure: "en-GB-SoniaNeural", locale: "en-GB", rate: 0.92, pitch: "+0%" },
  de: { azure: "de-DE-KatjaNeural", locale: "de-DE", rate: 0.92, pitch: "+0%" },
  es: { azure: "es-ES-ElviraNeural", locale: "es-ES", rate: 0.92, pitch: "+0%" },
};

/** Nom du fichier audio d'une phrase : empreinte de (voix + réglages + texte). */
export function audioId(lang: Lang, text: string): string {
  const v = VOICES[lang];
  const norm = text.trim().replace(/\s+/g, " ");
  return (hashString(`${v.azure}|${v.rate}|${v.pitch}|${norm}`) >>> 0).toString(36);
}
