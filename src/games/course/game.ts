// Course de bulles (5-12 ans) : nager jusqu'au gros crabe en passant par les trous, puis le faire danser.
import { L, type LevelDef, type Track } from "../../core/types";
import { pick } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

export const MIN_Y = 0.8, MAX_Y = 9.2;
const lerp = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k));
export interface Cfg { dist: number; speed: [number, number]; gap: [number, number]; spacing: number; boss: number }
export const gapAt = (c: Cfg, d: number) => lerp(c.gap[0], c.gap[1], d / c.dist);
export function obstacle(c: Cfg, d: number, rng = Math.random) {
  const gap = gapAt(c, d), center = MIN_Y + gap / 2 + rng() * (MAX_Y - MIN_Y - gap);
  return { top: center - gap / 2, bottom: center + gap / 2, center };
}

const lv = (id: string, params: Cfg, boss = false): LevelDef => ({ id, rounds: 1, params: params as unknown as Record<string, unknown>, boss, skills: ["coordination"] });

export const TRACK: Track = {
  chapters: [
    { id: "c1", tier: "facile", ages: [5, 6], title: L("Le lagon", "The lagoon", "Die Lagune", "La laguna"), levels: [lv("1-1", { dist: 35, speed: [2.4, 3], gap: [5.6, 5], spacing: 8, boss: 3 }), lv("1-2", { dist: 45, speed: [2.6, 3.4], gap: [5.4, 4.8], spacing: 8, boss: 3 }), lv("1-b", { dist: 50, speed: [2.8, 3.6], gap: [5, 4.5], spacing: 7.5, boss: 4 }, true)] },
    { id: "c2", tier: "moyen", ages: [7, 8], title: L("Le récif", "The reef", "Das Riff", "El arrecife"), levels: [lv("2-1", { dist: 60, speed: [3.2, 4.6], gap: [4.6, 4], spacing: 6.5, boss: 5 }), lv("2-2", { dist: 65, speed: [3.4, 5], gap: [4.4, 3.8], spacing: 6.5, boss: 5 }), lv("2-b", { dist: 75, speed: [3.6, 5.4], gap: [4.2, 3.6], spacing: 6, boss: 5 }, true)] },
    { id: "c3", tier: "difficile", ages: [9, 12], title: L("Les profondeurs", "The deep", "Die Tiefsee", "Las profundidades"), levels: [lv("3-1", { dist: 80, speed: [3.8, 6], gap: [3.9, 3.3], spacing: 5.5, boss: 5 }), lv("3-b", { dist: 95, speed: [4, 6.4], gap: [3.7, 3.2], spacing: 5.2, boss: 6 }, true)] },
  ],
};

export const courseGame: GameDef = {
  id: "course",
  icon: "🐠",
  category: "arcade",
  ages: [5, 12],
  title: L("Course de bulles", "Bubble race", "Blasenrennen", "Carrera de burbujas"),
  desc: L("Guider le poisson avec le doigt, passer par les trous et attraper les étoiles jusqu'au gros crabe.", "Guide the fish with your finger, swim through the gaps and catch stars all the way to the big crab.", "Den Fisch mit dem Finger lenken, durch die Lücken schwimmen und Sterne fangen bis zur großen Krabbe.", "Guiar el pez con el dedo, pasar por los huecos y atrapar estrellas hasta el gran cangrejo."),
  skills: { coordination: L("Coordination et anticipation", "Coordination and timing", "Koordination und Timing", "Coordinación y anticipación") },
  speech: (lang) => [L("Voilà le gros crabe ! Attrape les étoiles pour le faire danser !", "Here's the big crab! Catch the stars to make him dance!", "Da ist die große Krabbe! Fang die Sterne, damit sie tanzt!", "¡Aquí está el gran cangrejo! ¡Atrapa las estrellas para que baile!"), L("Attention au corail !", "Mind the coral!", "Vorsicht, Koralle!", "¡Cuidado con el coral!")].map((x) => x[lang]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Glisse ton doigt en haut et en bas, et passe par les trous !", "Slide your finger up and down and swim through the gaps!", "Wisch nach oben und unten und schwimm durch die Lücken!", "¡Desliza el dedo arriba y abajo y pasa por los huecos!")[ctx.lang],
  start(round, level, ctx) {
    const c = level.params as unknown as Cfg;
    const meter = round.meter("🦀", c.dist);
    const canvas = h("canvas", { class: "fr-canvas" }) as HTMLCanvasElement;
    round.stage.appendChild(canvas);
    const c2 = canvas.getContext("2d")!;
    let W = 300, H = 300, U = 30;
    const resize = () => { const d = devicePixelRatio || 1; W = round.stage.clientWidth; H = round.stage.clientHeight; canvas.width = W * d; canvas.height = H * d; c2.setTransform(d, 0, 0, d, 0, 0); U = H / 10; };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(round.stage); round.onCleanup(() => ro.disconnect());
    const pl = { y: 5, target: 5, r: 0.55 }, PX = 2.5;
    let obs: { x: number; w: number; top: number; bottom: number; center: number; hit: boolean; col: string }[] = [];
    let stars: { x: number; y: number; boss?: boolean }[] = [];
    let dist = 0, inv = 0, next = 3, t = 0, shown = -1, boss = false, hp = 0, finished = false, started = false;
    const setT = (e: PointerEvent) => { const r = canvas.getBoundingClientRect(); pl.target = Math.max(MIN_Y, Math.min(MAX_Y, (e.clientY - r.top) / U)); };
    canvas.addEventListener("pointerdown", setT); canvas.addEventListener("pointermove", setT);
    function update(dt: number) {
      if (!started || finished) return;
      const speed = lerp(c.speed[0], c.speed[1], dist / c.dist);
      if (!boss) {
        dist += speed * dt;
        const m = Math.min(c.dist, Math.floor(dist)); if (m !== shown) { shown = m; meter.set(m); }
        if (dist >= c.dist) {
          boss = true; hp = c.boss; obs = [];
          round.say(L("Voilà le gros crabe ! Attrape les étoiles pour le faire danser !", "Here's the big crab! Catch the stars to make him dance!", "Da ist die große Krabbe! Fang die Sterne, damit sie tanzt!", "¡Aquí está el gran cangrejo! ¡Atrapa las estrellas para que baile!")[ctx.lang]);
          for (let i = 0; i < c.boss; i++) stars.push({ x: W / U - 2.4 - (c.boss - 1 - i) * 0.9, y: 2 + (i * 6) / Math.max(1, c.boss - 1), boss: true });
        }
      }
      pl.y += (pl.target - pl.y) * Math.min(1, dt * 9);
      inv = Math.max(0, inv - dt);
      next -= speed * dt;
      if (!boss && next <= 0 && dist < c.dist - 6) {
        const o = obstacle(c, dist);
        obs.push({ x: W / U + 1, w: 1.3, ...o, hit: false, col: pick(["#ff6b6b", "#8d99ae", "#52b788"]) });
        for (let i = 0; i < 2; i++) stars.push({ x: W / U + 1.65 + i * 1.2, y: o.center });
        next = c.spacing + Math.random() * 2;
      }
      for (const o of obs) {
        o.x -= speed * dt;
        if (!o.hit && inv <= 0 && PX + pl.r * 0.8 > o.x && PX - pl.r * 0.8 < o.x + o.w && (pl.y - pl.r * 0.8 < o.top || pl.y + pl.r * 0.8 > o.bottom)) {
          o.hit = true; inv = 1.5; round.oops(); sfx.soft(); round.say(L("Attention au corail !", "Mind the coral!", "Vorsicht, Koralle!", "¡Cuidado con el coral!")[ctx.lang]);
        }
      }
      obs = obs.filter((o) => o.x > -3);
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        if (s.boss) s.x = Math.max(PX, s.x - dt * 1.6); else s.x -= speed * dt;
        if (Math.hypot(s.x - PX, s.y - pl.y) < pl.r + 0.4 || (s.boss && Math.abs(s.y - pl.y) < pl.r + 0.4 && s.x <= PX + 0.5)) {
          stars.splice(i, 1); sfx.coin();
          if (s.boss && --hp <= 0) { finished = true; sfx.win(); round.timeout(() => round.end(), 1300); }
        } else if (s.x < -2) stars.splice(i, 1);
      }
    }
    const em = (ch: string, x: number, y: number, s: number) => { c2.font = `${s}px serif`; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(ch, x, y); };
    function draw() {
      const g = c2.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#48cae4"); g.addColorStop(1, "#023e8a"); c2.fillStyle = g; c2.fillRect(0, 0, W, H);
      c2.fillStyle = "#f4d58d"; c2.fillRect(0, H - U * 0.35, W, U * 0.35);
      for (const o of obs) { c2.fillStyle = o.col; c2.fillRect(o.x * U, 0, o.w * U, o.top * U); c2.fillRect(o.x * U, o.bottom * U, o.w * U, H - o.bottom * U); }
      for (const s of stars) em("⭐", s.x * U, s.y * U, U * 0.8);
      if (boss) em(finished ? "💃" : "🦀", W - U * 1.4, H / 2, U * 1.8);
      c2.globalAlpha = inv > 0 && Math.floor(t * 10) % 2 ? 0.35 : 1;
      c2.save(); c2.translate(PX * U, pl.y * U); c2.scale(-1, 1); em("🐠", 0, 0, U * 0.95); c2.restore();
      c2.globalAlpha = 1;
    }
    round.loop((dt) => { t += dt; update(dt); draw(); });
    const auto = h("span", { class: "hidden" }) as HTMLElement & { __robotAuto?: () => void };
    auto.__robotAuto = () => {
      const o = obs.find((x) => x.x + x.w > PX - 0.6);
      if (o && o.x < PX + 6) { pl.target = o.center; return; }
      const s = stars.filter((x) => x.x > PX - 0.3).sort((a, b) => a.x - b.x)[0];
      if (s) pl.target = Math.max(MIN_Y, Math.min(MAX_Y, s.y));
    };
    round.stage.appendChild(auto);
    round.setHintTarget(() => auto);
    round.timeout(() => { started = true; }, 1800);
  },
};
