// Le kit de jeu : il fait tourner un niveau (ses manches) et rend le résultat.
// Il fournit à chaque jeu la même barre, la voix, l'aide 👆, les particules, les erreurs douces et les étoiles.
// Porté de la V2 (js/kit/kit.js) en TypeScript.
import type { Lang, LevelDef, LevelResult } from "../core/types";
import { starsFor } from "../core/progress";
import { pick } from "../core/util";
import { ui } from "../core/i18n";
import { say, stop as stopVoice } from "../audio/voice";
import { sfx } from "../audio/sfx";
import type { GameCtx, GameDef } from "../games/types";

export type HintTarget = Element | { from: Element; to: Element; paint?: boolean } | null | undefined;

export interface RoundApi {
  stage: HTMLElement;
  level: LevelDef;
  params: Record<string, unknown>;
  index: number;
  rounds: number;
  /** Données du niveau préparées par game.setup (les mêmes pour toutes les manches). */
  session: unknown;
  ctx: GameCtx;
  /** Vrai après 2 erreurs de suite : le jeu peut simplifier la manche (moins de choix, aide visible). */
  assist: boolean;
  /** Vrai après 4 réussites rapides de suite : le jeu peut corser un peu. */
  boost: boolean;
  /** Vrai quand le niveau est terminé (ou quitté). */
  readonly ended: boolean;
  say(text: string, lang?: Lang, opts?: { interrupt?: boolean }): Promise<void>;
  /** Consigne de la manche (redite sur 🔊 et quand l'enfant hésite). */
  instruct(text: string, lang?: Lang): void;
  win(el?: Element | null, phrase?: string, opts?: { delay?: number; praise?: boolean }): void;
  miss(el?: Element | null, hint?: string): void;
  /** Erreur comptée sans son ni voix (jeux d'action). */
  oops(): void;
  hint(target?: HintTarget): void;
  setHintTarget(fn: () => HintTarget): void;
  burst(el: Element, emojis?: string[]): void;
  timeout(fn: () => void, ms: number): void;
  interval(fn: () => void, ms: number): void;
  loop(fn: (dt: number) => void): void;
  onCleanup(fn: () => void): void;
  /** Fin immédiate du niveau (jeux d'action) ; sinon la fin vient après la dernière manche. */
  end(): void;
  /** Jauge d'objectif des jeux d'action (à la place des points de progression) : m.set(n). */
  meter(icon: string, total: number): { set(n: number): void };
}

export interface RunOptions {
  host: HTMLElement;
  game: GameDef;
  level: LevelDef;
  ctx: GameCtx;
  title: string;
  /** Appelé chaque seconde de jeu (temps d'écran). */
  onTick?: (seconds: number) => void;
}

declare global { interface Window { __kit?: { target: () => HintTarget; state: () => { index: number; rounds: number; errors: number; ended: boolean } } } }

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = "", text?: string) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
};

// ---------------------------------------------------------------- main d'aide 👆
export function showHand(target: HintTarget) {
  document.querySelectorAll(".k-hand").forEach((h) => h.remove());
  if (!target) return;
  const isDrag = "from" in target;
  const from = isDrag ? target.from : target;
  if (!(from instanceof Element) || !from.isConnected) return;
  const a = from.getBoundingClientRect();
  if (!a.width && !a.height) return; // cible invisible (aide réservée au robot de test)
  const h = el("div", "k-hand" + (isDrag ? " k-hand-drag" : ""), "👆");
  h.style.left = a.left + a.width / 2 + "px";
  h.style.top = a.top + a.height / 2 + "px";
  document.body.appendChild(h);
  if (isDrag) {
    const b = target.to.getBoundingClientRect();
    requestAnimationFrame(() => requestAnimationFrame(() => { h.style.left = b.left + b.width / 2 + "px"; h.style.top = b.top + b.height / 2 + "px"; }));
  }
  setTimeout(() => h.remove(), isDrag ? 1600 : 2200);
}

// ---------------------------------------------------------------- bouton à confirmer
/**
 * Bouton « sûr » pour les tout-petits : le 1er toucher le fait grossir avec un « ? » (et la voix demande),
 * le 2e toucher dans les 3 secondes déclenche l'action. Sans `ask`, un seul toucher suffit.
 */
export function confirmTap(btn: HTMLElement, action: () => void, ask: (() => void) | null) {
  let armed = 0;
  btn.addEventListener("click", () => {
    if (!ask) { sfx.tap(); action(); return; }
    if (armed) { clearTimeout(armed); armed = 0; btn.classList.remove("k-confirm"); sfx.tap(); action(); return; }
    sfx.pop(); ask();
    btn.classList.add("k-confirm");
    armed = window.setTimeout(() => { armed = 0; btn.classList.remove("k-confirm"); }, 3000);
  });
}

// ---------------------------------------------------------------- particules (DOM, légères)
export function burst(target: Element, emojis = ["✨", "⭐", "🎉"]) {
  const r = target.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 12; i++) {
    const p = el("span", "k-spark", i % 3 ? "" : pick(emojis));
    const a = (i / 12) * Math.PI * 2, d = 50 + Math.random() * 60;
    p.style.left = cx + "px"; p.style.top = cy + "px";
    p.style.setProperty("--dx", Math.cos(a) * d + "px");
    p.style.setProperty("--dy", Math.sin(a) * d + "px");
    if (i % 3) p.style.background = pick(["#ffd43b", "#ff922b", "#f06595", "#51cf66", "#4dabf7", "#cc5de8"]);
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 750);
  }
}

/** Fait tourner un niveau. Résout avec le résultat, ou null si l'enfant quitte avant la fin. */
export function runLevel(o: RunOptions): Promise<LevelResult | null> {
  const { host, game, level, ctx } = o;
  const lang = ctx.lang;
  const D = ui(lang);
  const little = ctx.band === "3-5";
  const rounds = Math.max(1, level.rounds);
  const idleMs = ctx.band === "3-5" ? 6000 : ctx.band === "6-8" ? 9000 : ctx.band === "9-11" ? 14000 : 0;

  return new Promise((resolve) => {
    host.innerHTML = "";
    const screen = el("div", "k-screen");
    const bar = el("div", "k-bar");
    const back = el("button", "k-round-btn", "🏠");
    back.setAttribute("aria-label", D.kit.home);
    const title = el("div", "k-title", o.title);
    const repeat = el("button", "k-round-btn", "🔊");
    repeat.setAttribute("aria-label", D.kit.repeat);
    bar.append(back, title, repeat);
    const progress = el("div", "k-progress");
    const stage = el("div", "k-stage");
    screen.append(bar, progress, stage);
    host.appendChild(screen);

    let index = 0, errors = 0, ended = false, busy = false, roundErrors = 0;
    let wrongStreak = 0, fastStreak = 0, roundStart = performance.now();
    let instruction = "", instructionLang: Lang = lang;
    let hintFn: () => HintTarget = () => null;
    let cleanups: (() => void)[] = [];
    let idleTimer = 0;
    const started = performance.now();
    let ticked = 0;
    const session = game.setup ? game.setup(level, ctx) : null;

    const tick = setInterval(() => { if (!document.hidden && !ended) { ticked++; o.onTick?.(ticked); } }, 1000);
    const cleanup = () => { cleanups.forEach((f) => { try { f(); } catch { /* rien */ } }); cleanups = []; document.querySelectorAll(".k-hand").forEach((h) => h.remove()); };

    const finish = (quit = false) => {
      if (ended) return;
      ended = true;
      clearTimeout(idleTimer); clearInterval(tick); cleanup();
      window.removeEventListener("pointerdown", onAnyInput, true);
      if (quit) { stopVoice(); resolve(null); return; }
      resolve({ stars: starsFor(errors), errors, seconds: Math.round((performance.now() - started) / 1000) });
    };

    // retour : chez les tout-petits, il faut toucher 2 fois la maison (pas de sortie par erreur, mais visible et simple)
    confirmTap(back, () => finish(true), little ? () => say(D.kit.leave, lang) : null);
    repeat.onclick = () => { sfx.tap(); if (instruction) say(instruction, instructionLang); showHand(hintFn()); };

    const armIdle = () => {
      clearTimeout(idleTimer);
      if (!idleMs || ended) return;
      idleTimer = window.setTimeout(() => {
        if (ended || busy) return;
        if (instruction) say(instruction, instructionLang);
        showHand(hintFn());
        armIdle();
      }, idleMs);
    };
    const onAnyInput = () => armIdle();
    window.addEventListener("pointerdown", onAnyInput, true);

    const renderProgress = () => {
      progress.innerHTML = "";
      if (rounds <= 1) return;
      for (let i = 0; i < rounds; i++) progress.appendChild(el("span", "k-dot" + (i < index ? " ok" : i === index ? " now" : "")));
    };

    const api = (): RoundApi => ({
      stage, level, params: level.params, index, rounds, session, ctx,
      assist: wrongStreak >= 2,
      boost: fastStreak >= 4,
      get ended() { return ended; },
      say: (text, l = lang, o) => say(text, l, o),
      // la 1re consigne passe après la présentation du niveau, sans la couper
      instruct(text, l = lang) { instruction = text; instructionLang = l; say(text, l, { interrupt: index > 0 || ticked > 2 }); },
      win(target, phrase = "", { delay = 1300, praise = true } = {}) {
        if (busy || ended) return;
        busy = true;
        if (target) { target.classList.remove("k-good"); void (target as HTMLElement).offsetWidth; target.classList.add("k-good"); burst(target); }
        sfx.good();
        const fast = performance.now() - roundStart < 6000 && roundErrors === 0;
        fastStreak = fast ? fastStreak + 1 : 0;
        wrongStreak = 0;
        // chaque morceau est dit à la suite (un fichier audio par phrase : voix naturelle partout)
        if (praise) say(pick(D.kit.praise), lang);
        if (phrase) say(phrase, lang, { interrupt: !praise });
        index++;
        renderProgress();
        clearTimeout(idleTimer);
        window.setTimeout(() => { if (!ended) (index >= rounds ? finish() : nextRound()); }, delay);
      },
      miss(target, hint = "") {
        if (busy || ended) return;
        errors++; roundErrors++; wrongStreak++; fastStreak = 0;
        if (target) { target.classList.remove("k-miss"); void (target as HTMLElement).offsetWidth; target.classList.add("k-miss"); }
        sfx.soft();
        say(pick(D.kit.encourage), lang);
        if (hint) say(hint, lang, { interrupt: false });
        if (roundErrors >= 2) window.setTimeout(() => showHand(hintFn()), 900);
      },
      oops() { if (!ended) { errors++; wrongStreak++; } },
      hint: (target) => showHand(target ?? hintFn()),
      setHintTarget(fn) { hintFn = fn; },
      burst,
      timeout(fn, ms) { const id = window.setTimeout(() => { if (!ended) fn(); }, ms); cleanups.push(() => clearTimeout(id)); },
      interval(fn, ms) { const id = window.setInterval(() => { if (!ended) fn(); }, ms); cleanups.push(() => clearInterval(id)); },
      loop(fn) {
        let alive = true, last = performance.now();
        const step = (now: number) => { if (!alive) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!ended) fn(dt); requestAnimationFrame(step); };
        requestAnimationFrame(step);
        cleanups.push(() => { alive = false; });
      },
      onCleanup(fn) { cleanups.push(fn); },
      end: () => finish(),
      meter(icon, total) {
        progress.innerHTML = `<div class="k-meter"><span class="k-meter-icon">${icon}</span><span class="k-meter-track"><span class="k-meter-fill"></span></span><span class="k-meter-count">0/${total}</span></div>`;
        const fill = progress.querySelector(".k-meter-fill") as HTMLElement, count = progress.querySelector(".k-meter-count") as HTMLElement, box = progress.querySelector(".k-meter") as HTMLElement;
        return {
          set(n: number) {
            n = Math.max(0, Math.min(total, n));
            fill.style.width = (n / total) * 100 + "%";
            count.textContent = `${n}/${total}`;
            box.classList.remove("k-meter-bump"); void box.offsetWidth; box.classList.add("k-meter-bump");
          },
        };
      },
    });

    function nextRound(first = false) {
      cleanup();
      busy = false; roundErrors = 0; hintFn = () => null; roundStart = performance.now();
      renderProgress();
      stage.innerHTML = "";
      if (!first) { stage.classList.remove("k-swap-in"); void stage.offsetWidth; stage.classList.add("k-swap-in"); }
      try { game.start(api(), level, ctx); }
      catch (e) { console.error(`[kit] ${game.id}/${level.id}`, e); }
      armIdle();
    }

    window.__kit = { target: () => hintFn(), state: () => ({ index, rounds, errors, ended }) };
    instruction = game.instruction(level, ctx);
    say(instruction, lang);
    nextRound(true);
  });
}
