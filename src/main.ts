// Point d'entrée de Plumiverse (une page par langue : /fr/, /en/, /de/, /es/).
import "./styles/tokens.css";
import "./styles/kit.css";
import "./styles/app.css";
import { initState, route, render, state, go, applyProfileSettings, saveProfile, selectProfile } from "./ui/app";
import { onboarding } from "./ui/screens/onboarding";
import { who, home, trophies } from "./ui/screens/home";
import { map, play } from "./ui/screens/play";
import { parent, parentProfile, parentFamily } from "./ui/screens/parent";
import { me } from "./ui/screens/me";
import { loadManifest, unlockAudio } from "./audio/voice";
import { LANGS } from "./core/types";
import { trackScreenView, type AppScreen } from "./ui/stats";

let lastTrackedScreen: AppScreen | null = null;
function trackCurrentScreen() {
  const parts = location.hash.replace(/^#\/?/, "").split("/");
  const root = parts[0];
  const screen = (root === "parent"
    ? parts[1] === "family" ? "parent-family" : parts[1] === "p" ? "parent-profile" : "parent"
    : root) as AppScreen;
  if (["start", "who", "home", "trophies", "me", "game", "play", "parent", "parent-profile", "parent-family"].includes(screen) && screen !== lastTrackedScreen) {
    lastTrackedScreen = screen;
    trackScreenView(screen);
  }
}

route(/^\/start$/, onboarding);
route(/^\/who$/, who);
route(/^\/home$/, home);
route(/^\/trophies$/, trophies);
route(/^\/me$/, me);
route(/^\/game\/([^/?]+)/, map);
route(/^\/play\/([^/?]+)(?:\/([^/?]+))?/, play);
route(/^\/parent\/p\/([^/?]+)/, parentProfile);
route(/^\/parent\/family/, parentFamily);
route(/^\/parent/, parent);
route(/^\/?$/, () => {
  if (!state.profiles.length) go("#/start");
  else if (state.current) go("#/home");
  else go("#/who");
});

// outils du robot de test (seulement en développement)
declare global { interface Window { __app?: unknown } }
if (import.meta.env.DEV) window.__app = { state, saveProfile, selectProfile, go };

async function boot() {
  await initState();
  if (state.current) applyProfileSettings(state.current);
  // sons générés : la langue de la page tout de suite, les autres ensuite (cours de langue)
  await loadManifest(state.pageLang);
  LANGS.forEach((l) => void loadManifest(l));
  window.addEventListener("hashchange", () => { trackCurrentScreen(); void render(); });
  window.addEventListener("pointerdown", unlockAudio, { once: true });
  await render();
  trackCurrentScreen();
  document.body.classList.add("ready");
  if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js?v=${__APP_VERSION__}`).catch(() => {});
}
void boot();
