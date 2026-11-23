// Tranche les Fruits (5-14 ans) : couper les fruits d'un geste, éviter chaussettes et bombes ; au dernier chapitre,
// les fruits portent des calculs et on ne coupe que ceux qui donnent le nombre demandé.
import { L, type Lang, type LevelDef, type Track } from "../../core/types";
import { pick, randInt } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

const FRUITS: [string, string][] = [["🍉", "#ff4d6d"], ["🍊", "#ff9f1c"], ["🍎", "#e63946"], ["🍋", "#ffd60a"], ["🍐", "#b5e48c"], ["🍑", "#ffb4a2"], ["🍍", "#ffd166"], ["🥝", "#80b918"], ["🍇", "#9d4edd"], ["🍓", "#ef233c"]];
export type Kind = "fruit" | "golden" | "rainbow" | "sock" | "bomb";
export function nextKind(sock: number, bomb: number, rng = Math.random): Kind { const r = rng(); if (r < sock) return "sock"; if (r < sock + bomb) return "bomb"; const b = rng(); return b < 0.03 ? "rainbow" : b < 0.1 ? "golden" : "fruit"; }
export const VALUE: Record<Kind, number> = { fruit: 1, golden: 2, rainbow: 3, sock: 0, bomb: 0 };
export const FSAY = {
  bomb: L("Oups, la bombe ! Évite-la !", "Oops, the bomb! Avoid it!", "Hoppla, die Bombe! Weich ihr aus!", "¡Uy, la bomba! ¡Evítala!"),
  sock: [L("Beurk ! Une chaussette !", "Yuck! A sock!", "Igitt! Eine Socke!", "¡Puaj! ¡Un calcetín!"), L("Oh non, pas la chaussette !", "Oh no, not the sock!", "Oh nein, nicht die Socke!", "¡Oh no, el calcetín no!")],
  combo: (n: number, lang: "fr" | "en" | "de" | "es") => ({ fr: `Combo ${n} !`, en: `Combo ${n}!`, de: `Kombo ${n}!`, es: `¡Combo ${n}!` })[lang],
  boom: L("BOUM !", "BOOM!", "BUMM!", "¡BUM!"), yuck: L("Beurk !", "Yuck!", "Igitt!", "¡Puaj!"),
};
export const isMistake = (k: Kind) => k === "sock" || k === "bomb";
/** Distance d'un point au segment [a, b] : le doigt a-t-il touché le fruit ? */
export function segDist(px: number, py: number, a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}
/** Fruits à calcul : « 3 + 4 » ; bon si le résultat vaut la cible. */
export function mathFruit(target: number, good: boolean, rng = Math.random): { text: string; value: number } {
  let v = target;
  if (!good) while (v === target) v = randInt(Math.max(2, target - 5), target + 5, rng);
  const a = randInt(1, v - 1, rng);
  return rng() < 0.5 || v < 4 ? { text: `${a}+${v - a}`, value: v } : { text: `${v + a}−${a}`, value: v };
}
export function targetLine(n: number, lang: Lang) {
  return { fr: `Coupe les fruits qui font ${n} !`, en: `Slice the fruit that make ${n}!`, de: `Schneide das Obst, das ${n} ergibt!`, es: `¡Corta las frutas que dan ${n}!` }[lang];
}

const lv = (id: string, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds: 1, params, boss, skills: [params.math ? "calcul" : "geste"] });

export const TRACK: Track = {
  chapters: [
    { id: "f1", tier: "facile", ages: [5, 6], title: L("Chef cuisinier", "Little chef", "Kleiner Koch", "Pequeño chef"), levels: [lv("1-1", { goal: 12, g: 0.7, wave: 2, sock: 0, bomb: 0, spawn: [1.6, 1] }), lv("1-2", { goal: 15, g: 0.75, wave: 2, sock: 0, bomb: 0, spawn: [1.5, 1] }), lv("1-b", { goal: 18, g: 0.8, wave: 3, sock: 0, bomb: 0, spawn: [1.4, 0.9] }, true)] },
    { id: "f2", tier: "moyen", ages: [7, 8], title: L("Pas les chaussettes !", "Not the socks!", "Nicht die Socken!", "¡Los calcetines no!"), levels: [lv("2-1", { goal: 18, g: 0.85, wave: 3, sock: 0.08, bomb: 0, spawn: [1.3, 0.8] }), lv("2-2", { goal: 22, g: 0.95, wave: 3, sock: 0.1, bomb: 0, spawn: [1.2, 0.8] }), lv("2-b", { goal: 25, g: 1, wave: 3, sock: 0.12, bomb: 0, spawn: [1.1, 0.7] }, true)] },
    { id: "f3", tier: "difficile", ages: [9, 10], title: L("Attention aux bombes", "Mind the bombs", "Vorsicht, Bomben", "Cuidado con las bombas"), levels: [lv("3-1", { goal: 25, g: 1.1, wave: 4, sock: 0.1, bomb: 0.04, spawn: [1, 0.7] }), lv("3-b", { goal: 30, g: 1.2, wave: 4, sock: 0.12, bomb: 0.05, spawn: [0.9, 0.7] }, true)] },
    { id: "f4", tier: "expert", ages: [11, 14], title: L("Fruits à calculer", "Maths fruit", "Rechen-Obst", "Frutas de cálculo"), levels: [lv("4-1", { goal: 10, g: 0.7, wave: 2, math: [6, 12], spawn: [1.5, 0.8] }), lv("4-2", { goal: 12, g: 0.8, wave: 3, math: [10, 20], spawn: [1.3, 0.8] }), lv("4-b", { goal: 15, g: 0.9, wave: 3, math: [12, 30], spawn: [1.2, 0.7] }, true)] },
  ],
};

export const fruitsGame: GameDef = {
  id: "fruits",
  icon: "🍉",
  category: "arcade",
  ages: [5, 14],
  title: L("Tranche les fruits", "Fruit slice", "Obst schneiden", "Corta la fruta"),
  desc: L("Couper les fruits d'un geste rapide sans toucher les pièges, puis ne couper que les calculs qui donnent le bon nombre.", "Slice the fruit with a quick swipe without touching the traps, then slice only the sums that make the right number.", "Obst mit einer schnellen Wischbewegung schneiden, ohne die Fallen zu treffen, dann nur die Rechnungen mit dem richtigen Ergebnis.", "Cortar la fruta con un gesto rápido sin tocar las trampas y luego solo los cálculos que dan el número correcto."),
  skills: { geste: L("Rapidité du geste", "Quick hands", "Schnelle Hände", "Rapidez"), calcul: L("Calcul mental rapide", "Fast mental maths", "Schnelles Kopfrechnen", "Cálculo mental rápido") },
  speech: (lang) => [...Array.from({ length: 30 }, (_, i) => targetLine(i + 1, lang)), FSAY.bomb[lang], ...FSAY.sock.map((x) => x[lang]), ...Array.from({ length: 18 }, (_, i) => FSAY.combo(i + 3, lang))],
  track: () => TRACK,
  instruction: (level, ctx) => (level.params.math
    ? L("Glisse ton doigt pour couper seulement les bons calculs !", "Swipe to slice only the right sums!", "Wisch, um nur die richtigen Rechnungen zu schneiden!", "¡Desliza para cortar solo los cálculos correctos!")
    : level.params.sock ? L("Glisse ton doigt pour couper les fruits, mais pas les chaussettes ni les bombes !", "Swipe to slice the fruit, but not the socks or bombs!", "Wisch, um das Obst zu schneiden, aber nicht die Socken oder Bomben!", "¡Desliza para cortar la fruta, pero no los calcetines ni las bombas!")
    : L("Glisse ton doigt pour couper les fruits !", "Swipe your finger to slice the fruit!", "Wisch mit dem Finger, um das Obst zu schneiden!", "¡Desliza el dedo para cortar la fruta!"))[ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { goal: number; g: number; wave: number; sock?: number; bomb?: number; spawn: [number, number]; math?: [number, number] };
    const meter = round.meter("🍉", p.goal);
    const canvas = h("canvas", { class: "fr-canvas" }) as HTMLCanvasElement;
    round.stage.appendChild(canvas);
    const c2 = canvas.getContext("2d")!;
    let W = 300, H = 300, R = 40, G = 300;
    let bg: HTMLCanvasElement | null = null;
    const resize = () => { const d = devicePixelRatio || 1; W = round.stage.clientWidth; H = round.stage.clientHeight; canvas.width = W * d; canvas.height = H * d; c2.setTransform(d, 0, 0, d, 0, 0); R = Math.max(38, Math.min(W, H) * 0.08); G = H * p.g;
      bg = document.createElement("canvas"); bg.width = W; bg.height = H; const b = bg.getContext("2d")!, plank = Math.max(60, H / 7);
      for (let y = 0, i = 0; y < H; y += plank, i++) { b.fillStyle = i % 2 ? "#c68b59" : "#b97a4b"; b.fillRect(0, y, W, plank); b.fillStyle = "rgba(0,0,0,0.12)"; b.fillRect(0, y + plank - 4, W, 4); b.strokeStyle = "rgba(90, 50, 20, 0.18)"; b.lineWidth = 2; for (let k = 0; k < 4; k++) { const yy = y + 10 + Math.random() * (plank - 20); b.beginPath(); b.moveTo(0, yy); b.bezierCurveTo(W * 0.3, yy + 10, W * 0.6, yy - 10, W, yy + 4); b.stroke(); } }
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(round.stage); round.onCleanup(() => ro.disconnect());
    type O = { kind: Kind; emoji: string; juice: string; label?: string; good: boolean; x: number; y: number; vx: number; vy: number; rot: number; vr: number; delay: number };
    let objs: O[] = [], halves: { e: string; x: number; y: number; vx: number; vy: number; rot: number; side: number; life: number; label?: string }[] = [], drops: { x: number; y: number; vx: number; vy: number; c: string; life: number }[] = [];
    let count = 0, spawnT = 1.8, trail: { x: number; y: number; t: number }[] = [], down = false, done = false, cuts = 0, lastSwoosh = 0;
    const stains: { x: number; y: number; r: number; c: string; life: number; seed: number }[] = [], texts: { x: number; y: number; s: string; c: string; life: number }[] = [];
    const target = p.math ? randInt(p.math[0], p.math[1]) : 0;
    let banner = "";
    if (p.math) { banner = `🎯 ${target}`; round.instruct(targetLine(target, ctx.lang)); }
    function wave() {
      const n = 1 + Math.floor(Math.random() * p.wave);
      for (let i = 0; i < n; i++) {
        const x = W * (0.15 + Math.random() * 0.7), apex = H * (0.45 + Math.random() * 0.35), vy = -Math.sqrt(2 * G * apex), vx = ((W / 2 - x) * (0.3 + Math.random() * 0.5)) / (Math.abs(vy) / G);
        const [emoji, juice] = pick(FRUITS);
        if (p.math) {
          const good = Math.random() < 0.5, m = mathFruit(target, good);
          objs.push({ kind: "fruit", emoji, juice, label: m.text, good: m.value === target, x, y: H + R, vx, vy, rot: 0, vr: 0, delay: i * 0.3 });
        } else {
          const k = nextKind(p.sock ?? 0, p.bomb ?? 0);
          const [e2, j2] = k === "sock" ? ["🧦", "#9aa"] : k === "bomb" ? ["💣", "#343a40"] : k === "rainbow" ? ["🌈", "#ff70a6"] : k === "golden" ? ["⭐", "#ffd60a"] : [emoji, juice];
          objs.push({ kind: k, emoji: e2, juice: j2, good: !isMistake(k), x, y: H + R, vx, vy, rot: 0, vr: (Math.random() - 0.5) * 4, delay: i * 0.25 });
        }
      }
    }
    const local = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
    canvas.addEventListener("pointerdown", (e) => { down = true; trail = [local(e)]; cuts = 0; });
    canvas.addEventListener("pointermove", (e) => {
      if (!down && e.pointerType !== "mouse") return;
      const pt = local(e), last = trail[trail.length - 1];
      trail.push(pt);
      if (last && Math.hypot(pt.x - last.x, pt.y - last.y) > 3) cut(last, pt);
      if (last && Math.hypot(pt.x - last.x, pt.y - last.y) > 25 && pt.t - lastSwoosh > 180) { sfx.swoosh(); lastSwoosh = pt.t; }
    });
    const up = () => { down = false; if (cuts >= 3 && !done) { texts.push({ x: W / 2, y: H / 3, s: `Combo x${cuts} !`, c: "#fff", life: 1.4 }); sfx.success(); round.say(FSAY.combo(Math.min(cuts, 20), ctx.lang)); } cuts = 0; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    function cut(a: { x: number; y: number }, b: { x: number; y: number }) {
      if (done) return;
      const ang = Math.atan2(b.y - a.y, b.x - a.x);
      for (let i = objs.length - 1; i >= 0; i--) {
        const o = objs[i];
        if (o.delay > 0 || segDist(o.x, o.y, a, b) >= R * 0.95) continue;
        objs.splice(i, 1);
        const nx = Math.cos(ang + Math.PI / 2), ny = Math.sin(ang + Math.PI / 2);
        for (const side of [1, -1]) halves.push({ e: o.emoji, x: o.x, y: o.y, vx: o.vx * 0.5 + nx * side * 90, vy: Math.min(o.vy, 0) * 0.3 + ny * side * 90 - 60, rot: o.rot, side, life: 1.4, label: o.label });
        for (let k = 0; k < 14; k++) { const t = Math.random() * 6.28, v = 80 + Math.random() * 240; drops.push({ x: o.x, y: o.y, vx: Math.cos(t) * v, vy: Math.sin(t) * v - 80, c: o.juice, life: 0.8 }); }
        if (o.kind !== "sock") stains.push({ x: o.x, y: o.y, r: R * (0.9 + Math.random() * 0.5), c: o.juice, life: 3, seed: Math.random() * 10 });
        sfx.splat();
        if (!o.good) {
          round.oops(); sfx.wrong();
          if (o.kind === "bomb" || o.kind === "sock") { texts.push({ x: o.x, y: o.y, s: (o.kind === "bomb" ? FSAY.boom : FSAY.yuck)[ctx.lang], c: "#343a40", life: 1.2 }); round.say(o.kind === "bomb" ? FSAY.bomb[ctx.lang] : pick(FSAY.sock)[ctx.lang]); }
          continue;
        }
        const v = VALUE[o.kind]; cuts++;
        if (v > 1) { texts.push({ x: o.x, y: o.y, s: `+${v} ${o.emoji}`, c: "#ffd60a", life: 1.3 }); sfx.coin(); }
        count += v; meter.set(count);
        if (count >= p.goal && !done) { done = true; round.timeout(() => round.end(), 900); }
      }
    }
    const emoji = (ch: string, x: number, y: number, size: number, rot = 0) => { c2.save(); c2.translate(x, y); c2.rotate(rot); c2.font = `${size}px serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(ch, 0, 0); c2.restore(); };
    const label = (s: string, x: number, y: number) => { c2.font = `bold ${R * 0.7}px system-ui, sans-serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.lineWidth = 6; c2.strokeStyle = "#fff"; c2.strokeText(s, x, y); c2.fillStyle = "#2f2545"; c2.fillText(s, x, y); };
    round.loop((dt) => {
      if (!done) { spawnT -= dt; if (spawnT <= 0 && objs.length < 6) { wave(); spawnT = p.spawn[0] + Math.random() * p.spawn[1]; } }
      for (let i = objs.length - 1; i >= 0; i--) { const o = objs[i]; if (o.delay > 0) { o.delay -= dt; continue; } o.vy += G * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt; if (o.y > H + R * 2 && o.vy > 0) objs.splice(i, 1); }
      for (let i = halves.length - 1; i >= 0; i--) { const q = halves[i]; q.vy += G * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; if (q.life <= 0) halves.splice(i, 1); }
      for (let i = drops.length - 1; i >= 0; i--) { const d = drops[i]; d.vy += G * 0.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.life -= dt; if (d.life <= 0) drops.splice(i, 1); }
      for (let i = stains.length - 1; i >= 0; i--) { stains[i].life -= dt; if (stains[i].life <= 0) stains.splice(i, 1); }
      for (let i = texts.length - 1; i >= 0; i--) { texts[i].life -= dt; texts[i].y -= 40 * dt; if (texts[i].life <= 0) texts.splice(i, 1); }
      const now = performance.now(); trail = trail.filter((q) => now - q.t < 140);
      if (bg) c2.drawImage(bg, 0, 0, W, H);
      for (const st of stains) { c2.globalAlpha = Math.min(0.55, st.life / 3); c2.fillStyle = st.c; c2.beginPath(); for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2, rr = st.r * (0.7 + 0.3 * Math.sin(a * 3 + st.seed)); if (k) c2.lineTo(st.x + Math.cos(a) * rr, st.y + Math.sin(a) * rr); else c2.moveTo(st.x + Math.cos(a) * rr, st.y + Math.sin(a) * rr); } c2.fill(); }
      c2.globalAlpha = 1;
      for (const o of objs) { if (o.delay > 0) continue; if (o.kind === "golden" || o.kind === "rainbow") { c2.shadowColor = o.kind === "golden" ? "#ffd60a" : "#ff70a6"; c2.shadowBlur = 25; } emoji(o.emoji, o.x, o.y, R * 2, o.rot); c2.shadowBlur = 0; if (o.label) label(o.label, o.x, o.y); }
      for (const q of halves) { c2.save(); c2.globalAlpha = Math.min(1, q.life * 2); c2.translate(q.x, q.y); c2.beginPath(); if (q.side > 0) c2.rect(-R * 2, 0, R * 4, R * 2); else c2.rect(-R * 2, -R * 2, R * 4, R * 2); c2.clip(); emoji(q.e, 0, 0, R * 2); c2.restore(); }
      for (const d of drops) { c2.globalAlpha = Math.min(1, d.life * 2); c2.fillStyle = d.c; c2.beginPath(); c2.arc(d.x, d.y, 4, 0, 6.28); c2.fill(); }
      c2.globalAlpha = 1;
      for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i]; c2.strokeStyle = `rgba(255,255,255,${0.3 + (i / trail.length) * 0.7})`; c2.lineWidth = 2 + (i / trail.length) * 9; c2.lineCap = "round"; c2.beginPath(); c2.moveTo(a.x, a.y); c2.lineTo(b.x, b.y); c2.stroke(); }
      for (const t of texts) { c2.globalAlpha = Math.min(1, t.life * 1.5); c2.font = `bold 40px "Comic Sans MS", "Chalkboard SE", sans-serif`; c2.textAlign = "center"; c2.lineWidth = 6; c2.strokeStyle = "rgba(0,0,0,0.35)"; c2.strokeText(t.s, t.x, t.y); c2.fillStyle = t.c; c2.fillText(t.s, t.x, t.y); }
      c2.globalAlpha = 1;
      if (banner) { c2.font = `bold ${Math.max(28, R)}px system-ui, sans-serif`; c2.textAlign = "center"; c2.fillStyle = "#fff"; c2.strokeStyle = "rgba(0,0,0,.35)"; c2.lineWidth = 6; c2.strokeText(banner, W / 2, R * 1.2); c2.fillText(banner, W / 2, R * 1.2); }
    });
    // robot de test : un coup de doigt court sur un bon fruit, loin des pièges
    const swipe = h("span", { class: "hidden" }) as HTMLElement & { __robotSwipe?: () => number[] | null };
    swipe.__robotSwipe = () => {
      const o = objs.find((x) => x.delay <= 0 && x.good && x.y > R && x.y < H - R && x.x > R && x.x < W - R && !objs.some((y) => !y.good && Math.hypot(y.x - x.x, y.y - x.y) < R * 2.6));
      if (!o) return null;
      const r = canvas.getBoundingClientRect();
      return [r.left + o.x - R * 0.6, r.top + o.y, r.left + o.x + R * 0.6, r.top + o.y];
    };
    round.stage.appendChild(swipe);
    round.setHintTarget(() => swipe);
  },
};
