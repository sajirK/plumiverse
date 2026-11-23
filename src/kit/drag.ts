// Glisser-déposer (repris de la V2) : on attrape un objet, un « fantôme » suit le doigt, on le lâche sur une zone.
// Un simple toucher reste possible (onTap) : les plus petits peuvent toucher, les autres glissent.
import { sfx } from "../audio/sfx";

export interface Pt { x: number; y: number }
export interface DragOpts {
  /** Ce qui suit le doigt (texte, emoji ou élément). Par défaut : le contenu de la source. */
  ghost?: string | Node | ((src: HTMLElement) => string | Node);
  enabled?: () => boolean;
  onStart?: (pt: Pt) => void;
  onMove?: (pt: Pt) => void;
  /** Renvoie true si le dépôt est accepté (le fantôme disparaît), sinon il revient à sa place. */
  onDrop?: (pt: Pt) => boolean;
  onTap?: () => void;
}

export function drag(source: HTMLElement, o: DragOpts = {}) {
  source.style.touchAction = "none";
  source.addEventListener("pointerdown", (e) => {
    if (o.enabled && !o.enabled()) return;
    e.preventDefault();
    try { source.setPointerCapture(e.pointerId); } catch { /* pointeur simulé */ }
    const start = { x: e.clientX, y: e.clientY };
    let ghost: HTMLElement | null = null, moved = false;
    const lift = (pt: Pt) => {
      ghost = document.createElement("div");
      ghost.className = "k-ghost";
      const g = typeof o.ghost === "function" ? o.ghost(source) : o.ghost;
      if (g instanceof Node) ghost.appendChild(g); else ghost.textContent = g ?? source.textContent;
      document.body.appendChild(ghost);
      source.classList.add("k-lifted");
      sfx.click();
      o.onStart?.(pt);
    };
    const move = (ev: PointerEvent) => {
      const pt = { x: ev.clientX, y: ev.clientY };
      if (!moved && Math.hypot(pt.x - start.x, pt.y - start.y) > 8) { moved = true; lift(pt); }
      if (!moved || !ghost) return;
      ghost.style.left = pt.x + "px"; ghost.style.top = pt.y + "px";
      o.onMove?.(pt);
    };
    const up = (ev: PointerEvent) => {
      source.removeEventListener("pointermove", move);
      source.removeEventListener("pointerup", up);
      source.removeEventListener("pointercancel", up);
      source.classList.remove("k-lifted");
      if (!moved || !ghost) { if (ev.type === "pointerup") o.onTap?.(); return; }
      const g = ghost as HTMLElement;
      const ok = ev.type === "pointerup" && o.onDrop ? o.onDrop({ x: ev.clientX, y: ev.clientY }) : false;
      if (ok) { g.classList.add("k-drop"); setTimeout(() => g.remove(), 220); }
      else {
        const r = source.getBoundingClientRect();
        g.classList.add("k-back"); g.style.left = r.left + r.width / 2 + "px"; g.style.top = r.top + r.height / 2 + "px";
        setTimeout(() => g.remove(), 320);
      }
    };
    source.addEventListener("pointermove", move);
    source.addEventListener("pointerup", up);
    source.addEventListener("pointercancel", up);
  });
}

/** Le point est-il dans l'élément ? */
export function inside(el: Element, pt: Pt, pad = 0): boolean {
  const r = el.getBoundingClientRect();
  return pt.x >= r.left - pad && pt.x <= r.right + pad && pt.y >= r.top - pad && pt.y <= r.bottom + pad;
}
/** Position relative dans l'élément, de -1 à 1 sur chaque axe. */
export function relPos(el: Element, pt: Pt): Pt {
  const r = el.getBoundingClientRect();
  return { x: ((pt.x - r.left) / r.width) * 2 - 1, y: ((pt.y - r.top) / r.height) * 2 - 1 };
}
/** L'élément sous le doigt qui correspond au sélecteur (le fantôme ne bloque pas : pointer-events none). */
export function under(pt: Pt, selector: string): HTMLElement | null {
  const t = document.elementFromPoint(pt.x, pt.y);
  return (t?.closest(selector) as HTMLElement) ?? null;
}
