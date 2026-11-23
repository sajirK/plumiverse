// Petits outils pour tester l'application à la main dans le navigateur (serveur de dev) :
//   const T = await import("/plumiverse/tests/helpers.js");
import { numberWords } from "/plumiverse/src/core/numwords.ts";

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const q = (s) => document.querySelector(s);
export const qa = (s) => [...document.querySelectorAll(s)];
export const byText = (sel, txt) => qa(sel).find((b) => b.textContent.includes(txt));

export function tap(el) {
  const r = el.getBoundingClientRect(), o = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true };
  el.dispatchEvent(new PointerEvent("pointerdown", o)); el.dispatchEvent(new PointerEvent("pointerup", o)); el.click();
}

/** Ouvre la porte parent en lisant le calcul écrit en lettres. */
export async function passGate(root = document) {
  const g = root.querySelector(".gate-q");
  if (!g) return "pas de porte";
  const lang = document.documentElement.lang;
  const [a, b] = g.textContent.split(lang === "es" ? " más " : " plus ");
  const f = (w) => { for (let n = 0; n <= 100; n++) if (numberWords(n, lang) === w) return n; };
  const box = g.closest(".gate, .modal");
  box.querySelector("input").value = String(f(a) + f(b));
  box.querySelector(".btn.primary").click();
  await sleep(400);
  return "ouverte";
}

/** Joue le niveau affiché en suivant l'aide du jeu, jusqu'à l'écran de fin. */
export async function playThrough(maxSteps = 80, pause = 1300) {
  for (let i = 0; i < maxSteps && !q(".end-card"); i++) {
    const t = window.__kit?.target();
    if (t?.__robotFill) t.__robotFill();
    if (t && t.isConnected) tap(t);
    await sleep(pause);
  }
  return !!q(".end-card");
}

/** Capture le fichier d'export au lieu de le télécharger. */
export async function captureExport(button) {
  let captured = null;
  const orig = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { if (this.download) captured = { href: this.href, name: this.download, inDom: this.isConnected }; else orig.call(this); };
  try { button.click(); } finally { HTMLAnchorElement.prototype.click = orig; }
  if (!captured) return null;
  return { ...captured, text: await fetch(captured.href).then((r) => r.text()) };
}

/** Importe un fichier (comme si on l'avait choisi). */
export async function importFile(input, text, name = "sauvegarde.json") {
  const dt = new DataTransfer();
  dt.items.add(new File([text], name, { type: "application/json" }));
  input.files = dt.files;
  input.dispatchEvent(new Event("change"));
  await sleep(600);
}

export const app = () => window.__app;
