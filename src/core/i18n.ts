// Traductions de l'interface : t("home.hi", { name: "Léa" }).
// Les textes sont dans src/content/ui/<langue>.ts ; TypeScript refuse une langue où il manque une clé.
import type { Lang, Tr } from "./types";
import { fr, type Ui } from "../content/ui/fr";
import { en } from "../content/ui/en";
import { de } from "../content/ui/de";
import { es } from "../content/ui/es";

export const DICTS: Record<Lang, Ui> = { fr, en, de, es };

let current: Lang = "fr";
export const setLang = (l: Lang) => { current = l; };
export const getLang = () => current;
export const ui = (l: Lang = current): Ui => DICTS[l];

/** Remplace {clé} par la valeur. */
export function fill(s: string, vars: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Texte par chemin pointé ("home.hi"), dans la langue courante. */
export function t(path: string, vars?: Record<string, string | number>, l: Lang = current): string {
  const v = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], DICTS[l]);
  if (typeof v !== "string") throw new Error(`[i18n] clé absente : ${path} (${l})`);
  return fill(v, vars);
}

/** Un texte Tr (4 langues) dans la langue courante. */
export const tr = (x: Tr, l: Lang = current) => x[l];

/** Liste de toutes les clés feuilles d'un dictionnaire (pour les tests de complétude). */
export function leafKeys(o: unknown, prefix = ""): string[] {
  if (typeof o === "string") return [prefix];
  if (Array.isArray(o)) return [prefix + "[]"];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leafKeys(v, prefix ? `${prefix}.${k}` : k));
}
