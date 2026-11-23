// État de l'application et navigation (routes en #/… : compatibles GitHub Pages).
import { type Lang, type Profile, LANGS } from "../core/types";
import { setLang, t } from "../core/i18n";
import { openStore, type Store, type DeviceMeta } from "../core/store";
import { ageOf, bandOf } from "../core/profile";
import { isBlocked } from "../core/parent";
import { GAMES, visibleGames } from "../games";
import type { GameCtx, GameDef } from "../games/types";
import { setMuted } from "../audio/voice";
import { setSfx } from "../audio/sfx";

export interface AppState {
  store: Store;
  profiles: Profile[];
  meta: DeviceMeta;
  /** Langue de la page (/fr/, /en/, /de/, /es/). */
  pageLang: Lang;
  current: Profile | null;
}

export const state = {} as AppState;

export async function initState(): Promise<void> {
  const lang = (document.documentElement.lang.slice(0, 2) as Lang);
  state.pageLang = LANGS.includes(lang) ? lang : "fr";
  setLang(state.pageLang);
  try { localStorage.setItem("plumiverse.lang", state.pageLang); } catch { /* navigation privée */ }
  state.store = await openStore();
  state.profiles = (await state.store.profiles()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  state.meta = await state.store.meta();
  state.current = state.profiles.find((p) => p.id === state.meta.currentProfile) ?? null;
}

export async function saveProfile(p: Profile) {
  await state.store.save(p);
  const i = state.profiles.findIndex((x) => x.id === p.id);
  if (i >= 0) state.profiles[i] = p; else state.profiles.push(p);
}

export async function selectProfile(p: Profile | null) {
  state.current = p;
  await state.store.setMeta({ currentProfile: p?.id });
  if (p) applyProfileSettings(p);
}

export function applyProfileSettings(p: Profile) {
  setMuted(!p.settings.voice);
  setSfx(p.settings.sounds);
  document.body.dataset.band = bandOf(p);
}

/** Si le profil parle une autre langue que la page, on va sur la bonne page (/en/…). Renvoie true si on part. */
export function goToProfileLanguage(p: Profile, hash = "#/home"): boolean {
  if (p.uiLang === state.pageLang) return false;
  location.href = `${import.meta.env.BASE_URL}${p.uiLang}/${hash}`;
  return true;
}

export function ctxFor(p: Profile): GameCtx {
  return { profile: p, age: ageOf(p), band: bandOf(p), lang: state.pageLang };
}

export function gamesFor(p: Profile): GameDef[] {
  return visibleGames(ctxFor(p), (g) => isBlocked(p, g.id, g.category));
}

export const allGames = () => GAMES;

// ---------------------------------------------------------------- navigation
type Handler = (params: string[]) => void | Promise<void>;
const routes: [RegExp, Handler][] = [];
export const route = (re: RegExp, fn: Handler) => routes.push([re, fn]);
export const go = (hash: string) => { if (location.hash === hash) void render(); else location.hash = hash; };

export async function render() {
  const h = location.hash.replace(/^#/, "") || "/";
  for (const [re, fn] of routes) {
    const m = h.match(re);
    if (m) { await fn(m.slice(1).map(decodeURIComponent)); window.scrollTo(0, 0); return; }
  }
  go("#/");
}

export const root = () => document.getElementById("app")!;

/** Titre de l'onglet. */
export const setTitle = (s?: string) => { document.title = s ? `${s} · ${t("app.name")}` : `${t("app.name")} — ${t("app.tagline")}`; };
