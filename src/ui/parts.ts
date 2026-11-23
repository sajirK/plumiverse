// Morceaux d'interface partagés : Plume, en-tête du joueur, pied de page, étoiles, fenêtre.
import type { Profile } from "../core/types";
import { t, ui } from "../core/i18n";
import { playerLevel, streakAlive } from "../core/progress";
import { bandOf, displayName } from "../core/profile";
import { h } from "./dom";
import { go, state, switchLanguage } from "./app";
import { sfx } from "../audio/sfx";
import { confirmTap } from "../kit/kit";

/** Lien LinkedIn de l'auteur (à confirmer). */
export const LINKEDIN = "https://www.linkedin.com/search/results/all/?keywords=Sajir%20Khenissi";
export const VERSION = __APP_VERSION__;

export function plume(size: "s" | "m" | "l" = "m", mood: "" | "dance" | "wave" = ""): HTMLElement {
  return h("div", { class: `plume plume-${size} ${mood}`, "aria-hidden": "true" }, h("span", { class: "plume-body" }, "🦉"));
}

export function stars(n: number, max = 3): HTMLElement {
  return h("span", { class: "stars", "aria-label": `${n}/${max}` }, ...Array.from({ length: max }, (_, i) => h("span", { class: i < n ? "on" : "" }, "★")));
}

export function footer(): HTMLElement {
  // changer de langue ici change aussi la langue du joueur (sinon on serait renvoyé dans sa langue)
  const langs = (["fr", "en", "de", "es"] as const).map((l) => {
    const a = h("a", { href: `${import.meta.env.BASE_URL}${l}/`, hreflang: l, class: l === state.pageLang ? "on" : "" }, l.toUpperCase());
    a.addEventListener("click", (e) => { e.preventDefault(); if (l === state.pageLang) return;
      // sur « Qui joue ? », le premier lancement ou l'espace parent : seulement la langue de la page
      const shared = /^#\/(who|start|parent)/.test(location.hash) || !location.hash || location.hash === "#/";
      void switchLanguage(l, location.hash || "#/", !shared);
    });
    return a;
  });
  return h("footer", { class: "foot" },
    h("span", {}, `${t("app.madeBy")} Sajir Khenissi · `),
    h("a", { href: LINKEDIN, target: "_blank", rel: "noopener" }, "LinkedIn"),
    h("span", {}, " · "),
    h("a", { href: `${import.meta.env.BASE_URL}${state.pageLang}/privacy/` }, t("app.privacy")),
    h("span", {}, ` · v${VERSION} · `),
    ...langs.flatMap((a, i) => (i ? [h("span", {}, " "), a] : [a])),
  );
}

/** Bouton qui demande 2 touchers chez les tout-petits (pour ne pas sortir par erreur), 1 seul sinon. */
export function holdButton(label: string, cls: string, onDone: () => void, needConfirm: boolean): HTMLButtonElement {
  const b = h("button", { class: cls, "aria-label": label }, label.length <= 2 ? label : "") as HTMLButtonElement;
  confirmTap(b, onDone, needConfirm ? () => {} : null);
  return b;
}

/** En-tête du joueur : avatar (changer de joueur), niveau, XP, série, trophées, parent. */
export function playerHeader(p: Profile, opts: { back?: string } = {}): HTMLElement {
  const lv = playerLevel(p.xp);
  const band = bandOf(p);
  const little = band === "3-5";
  const left = opts.back
    ? h("button", { class: "round-btn", "aria-label": t("parent.back"), onclick: () => { sfx.tap(); go(opts.back!); } }, "←")
    : h("button", { class: "avatar-btn", "aria-label": t("me.title"), onclick: () => { sfx.tap(); go("#/me"); } }, p.avatar);
  const info = h("button", { class: "who-info", "aria-label": t("me.title"), onclick: () => { sfx.tap(); go("#/me"); } },
    h("div", { class: "who-name" }, displayName(p)),
    little ? null : h("div", { class: "xp" }, h("span", { class: "xp-lv" }, t("home.level", { n: lv.level })), h("span", { class: "xp-bar" }, h("span", { style: { width: `${Math.round((lv.into / lv.need) * 100)}%` } }))),
  );
  const streak = !little && streakAlive(p.streak) && p.streak.current > 0
    ? h("div", { class: "streak", title: t("home.streak", { n: p.streak.current }) }, "🔥", h("b", {}, String(p.streak.current))) : null;
  const trophies = h("button", { class: "round-btn", "aria-label": t("home.trophies"), onclick: () => { sfx.tap(); go("#/trophies"); } }, "🏆");
  const parent = holdButton("👪", "round-btn parent-btn", () => go("#/parent"), little);
  parent.setAttribute("aria-label", t("home.parent"));
  return h("header", { class: "top" }, left, info, h("div", { class: "top-right" }, streak, trophies, parent));
}

/** Fenêtre modale simple (renvoie une fonction pour la fermer). */
export function modal(content: HTMLElement, onClose?: () => void): () => void {
  const back = h("div", { class: "modal-back" });
  const box = h("div", { class: "modal" }, content);
  back.appendChild(box);
  const close = () => { back.remove(); onClose?.(); };
  back.addEventListener("click", (e) => { if (e.target === back) close(); });
  document.body.appendChild(back);
  return close;
}

export const D = () => ui(state.pageLang);

/** Petit bandeau en haut de l'écran (quelques secondes). */
export function toast(text: string, ms = 5000) {
  document.querySelectorAll(".toast").forEach((x) => x.remove());
  const el = h("div", { class: "toast", role: "status" }, text);
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}
