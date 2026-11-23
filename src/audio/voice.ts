// La voix de Plume.
// 1. Si la phrase existe en fichier (voix neuronale générée par `npm run audio`), on joue le fichier.
// 2. Sinon, la voix du navigateur, en prenant la MEILLEURE voix de la bonne langue (jamais une voix d'une autre langue).
// Chaque phrase dite est notée (window.__voiceLog) : le robot de test vérifie qu'aucune phrase ne manque.
import type { Lang } from "../core/types";
import { LANGS } from "../core/types";
import { VOICES, audioId } from "./voices";

const BASE = import.meta.env.BASE_URL;
const manifests: Partial<Record<Lang, Set<string>>> = {};
let muted = false;
let current: HTMLAudioElement | null = null;
let token = 0;
/** Ce qui est en train d'être dit (pour enchaîner sans couper). */
let speaking: Promise<void> = Promise.resolve();

declare global { interface Window { __voiceLog?: { lang: Lang; text: string; source: "file" | "browser" | "none" }[] } }

export const setMuted = (m: boolean) => { muted = m; if (m) stop(); };
export const isMuted = () => muted;

/** Charge la liste des phrases déjà générées pour une langue (fichier public/audio/<lang>/manifest.json). */
export async function loadManifest(lang: Lang): Promise<void> {
  if (manifests[lang]) return;
  try {
    const r = await fetch(`${BASE}audio/${lang}/manifest.json`, { cache: "no-cache" });
    manifests[lang] = new Set(r.ok ? ((await r.json()) as string[]) : []);
  } catch { manifests[lang] = new Set(); }
}

export function stop() {
  token++;
  if (current) { current.pause(); current = null; }
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
}

// ---------------------------------------------------------------- meilleure voix du navigateur
let browserVoices: SpeechSynthesisVoice[] = [];
function refreshVoices() { if (typeof speechSynthesis !== "undefined") browserVoices = speechSynthesis.getVoices(); }
if (typeof speechSynthesis !== "undefined") { refreshVoices(); speechSynthesis.addEventListener?.("voiceschanged", refreshVoices); }

/** Note une voix : les voix « premium / naturelles » d'abord, et la bonne variante régionale. */
export function scoreVoice(v: Pick<SpeechSynthesisVoice, "name" | "lang" | "localService">, lang: Lang): number {
  const vl = v.lang.replace("_", "-").toLowerCase();
  if (!vl.startsWith(lang)) return -1;
  let s = 0;
  if (vl === VOICES[lang].locale.toLowerCase()) s += 3;
  if (/premium|enhanced|natural|neural|online/i.test(v.name)) s += 6;
  if (/google|siri|microsoft/i.test(v.name)) s += 3;
  if (/compact|eloquence|espeak|novelty|bad news|bells|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|albert|jester|superstar|wobble|good news/i.test(v.name)) s -= 10;
  return s;
}

export function bestBrowserVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (!browserVoices.length) refreshVoices();
  let best: SpeechSynthesisVoice | null = null, bs = -1;
  for (const v of browserVoices) { const s = scoreVoice(v, lang); if (s > bs) { bs = s; best = v; } }
  return bs >= 0 ? best : null;
}

// ---------------------------------------------------------------- dire une phrase
/** Dit un texte dans une langue. Renvoie une promesse résolue à la fin (ou tout de suite si coupé). */
export function say(text: string, lang: Lang, opts: { interrupt?: boolean } = {}): Promise<void> {
  const clean = text.replace(/[*_]/g, "").trim();
  if (!clean) return Promise.resolve();
  if (opts.interrupt === false) {
    const before = token;
    speaking = speaking.then(() => (token === before ? sayNow(clean, lang) : undefined));
    return speaking;
  }
  stop();
  speaking = sayNow(clean, lang);
  return speaking;
}

function sayNow(clean: string, lang: Lang): Promise<void> {
  const my = ++token;
  const id = audioId(lang, clean);
  const hasFile = !!manifests[lang]?.has(id);
  (window.__voiceLog ??= []).push({ lang, text: clean, source: muted ? "none" : hasFile ? "file" : "browser" });
  if (muted) return Promise.resolve();
  if (hasFile) {
    return new Promise((done) => {
      const a = new Audio(`${BASE}audio/${lang}/${id}.mp3`);
      current = a;
      a.onended = a.onerror = () => { if (current === a) current = null; done(); };
      a.play().catch(() => done());
    });
  }
  if (typeof speechSynthesis === "undefined") return Promise.resolve();
  return new Promise((done) => {
    if (my !== token) return done();
    const u = new SpeechSynthesisUtterance(clean);
    const v = bestBrowserVoice(lang);
    u.lang = VOICES[lang].locale;
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.05;
    // filet de sécurité : certains navigateurs n'annoncent jamais la fin d'une phrase
    const guard = setTimeout(() => done(), 2500 + clean.length * 90);
    u.onend = u.onerror = () => { clearTimeout(guard); done(); };
    speechSynthesis.speak(u);
  });
}

/** À appeler au premier toucher : iOS n'autorise le son qu'après un geste. */
export function unlockAudio() {
  if (typeof speechSynthesis !== "undefined") { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); }
}

export async function preloadAll() { await Promise.all(LANGS.map(loadManifest)); }
