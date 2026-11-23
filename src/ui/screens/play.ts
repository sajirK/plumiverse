// Carte des niveaux d'un jeu, partie, écran de fin, et fin du temps de jeu.
import { t, tr } from "../../core/i18n";
import { bandOf } from "../../core/profile";
import { getGameProgress, isLevelUnlocked, isChapterUnlocked, levelStars, continueLevel, findLevel, nextLevel, recordLevel, chapterStars, playerLevel, type LevelRef } from "../../core/progress";
import { checkTrophies } from "../../core/trophies";
import { minutesLeft, parentGate } from "../../core/parent";
import { dayKey } from "../../core/util";
import type { LevelResult, Profile, Track } from "../../core/types";
import { runLevel } from "../../kit/kit";
import { say } from "../../audio/voice";
import { sfx } from "../../audio/sfx";
import { h, clear } from "../dom";
import { footer, playerHeader, plume, stars, modal, toast } from "../parts";
import { state, root, go, ctxFor, gamesFor, saveProfile, setTitle, allGames } from "../app";
import { gameById } from "../../games";
import { track } from "../stats";
import { burst } from "../../kit/kit";

const levelLabel = (ref: LevelRef) => (ref.level.boss ? "👑 " + t("map.boss") : `${t("map.chapter", { n: ref.ci + 1 })} · ${ref.li + 1}`);

// ---------------------------------------------------------------- carte des niveaux
export function map([gameId]: string[]) {
  const p = state.current;
  const g = gameById(gameId);
  if (!p || !g || !gamesFor(p).includes(g)) { go("#/home"); return; }
  if (bandOf(p) === "3-5") { go(`#/play/${g.id}`); return; }
  setTitle(tr(g.title));
  const ctx = ctxFor(p);
  const trk = g.track(ctx);
  const gp = getGameProgress(p, g.id, trk);
  const cont = continueLevel(p, gp, trk);
  const app = clear(root());
  const page = h("main", { class: "page map" });
  app.append(playerHeader(p, { back: "#/home" }), page, footer());
  const play = h("button", { class: "btn primary big" }, `▶ ${t("home.continue")} · ${levelLabel(cont)}`);
  play.onclick = () => { sfx.tap(); go(`#/play/${g.id}/${cont.level.id}`); };
  page.append(h("div", { class: "map-head" }, h("span", { class: "map-icon" }, g.icon), h("div", {}, h("h1", {}, tr(g.title)), h("p", { class: "muted" }, tr(g.desc)))), play);
  trk.chapters.forEach((ch, ci) => {
    const open = isChapterUnlocked(p, gp, trk, ci);
    const st = chapterStars(gp, ch);
    const card = h("section", { class: "chapter" + (open ? "" : " locked") + (ci === cont.ci ? " current" : "") },
      h("div", { class: "chapter-head" }, h("span", { class: `tier tier-${ch.tier}` }, t(`tier.${ch.tier}`)), h("h2", {}, `${t("map.chapter", { n: ci + 1 })} · ${tr(ch.title)}`), h("span", { class: "chapter-stars" }, `★ ${st.got}/${st.max}`)));
    const path = h("div", { class: "path" });
    ch.levels.forEach((lv, li) => {
      const unlocked = isLevelUnlocked(p, gp, trk, ci, li);
      const s = levelStars(gp, lv.id);
      const node = h("button", { class: "node" + (lv.boss ? " boss" : "") + (unlocked ? "" : " locked") + (lv.id === cont.level.id ? " here" : ""), "aria-label": lv.boss ? t("map.boss") : String(li + 1) },
        h("span", { class: "node-n" }, unlocked ? (lv.boss ? "👑" : String(li + 1)) : "🔒"), unlocked ? stars(s) : null);
      node.onclick = () => {
        if (unlocked) { sfx.tap(); go(`#/play/${g.id}/${lv.id}`); return; }
        const why = !open ? t("map.lockedChapter") : lv.boss ? t("map.lockedBoss") : t("map.locked");
        sfx.soft(); say(why, state.pageLang); node.classList.remove("k-miss"); void node.offsetWidth; node.classList.add("k-miss");
      };
      path.appendChild(node);
    });
    card.appendChild(path);
    page.appendChild(card);
  });
  // on arrive directement sur le chapitre en cours
  requestAnimationFrame(() => page.querySelector(".chapter.current")?.scrollIntoView({ block: "center" }));
}

// ---------------------------------------------------------------- partie
let timeWarned = "";

export async function play([gameId, levelId]: string[]) {
  const p = state.current;
  const g = gameById(gameId);
  if (!p || !g || !gamesFor(p).includes(g)) { go("#/home"); return; }
  if (minutesLeft(p) <= 0) { timeOver(); return; }
  const ctx = ctxFor(p);
  const trk = g.track(ctx);
  const gp = getGameProgress(p, g.id, trk);
  let ref = levelId ? findLevel(trk, levelId) : null;
  if (!ref || !isLevelUnlocked(p, gp, trk, ref.ci, ref.li)) ref = continueLevel(p, gp, trk);
  setTitle(tr(g.title));
  const app = clear(root());
  const host = h("div", { class: "play" });
  app.appendChild(host);
  track(`jeu/${g.id}/debut`);
  let extra = 0;
  const res = await runLevel({
    host, game: g, level: ref.level, ctx,
    title: `${g.icon} ${tr(g.title)} · ${levelLabel(ref)}`,
    onTick: (s) => {
      extra = s;
      const left = minutesLeft(p, s);
      const today = dayKey();
      if (left <= 5 && left > 0 && timeWarned !== p.id + today) { timeWarned = p.id + today; toast("⏳ " + t("time.soon"), 8000); say(t("time.soon"), state.pageLang); }
    },
  });
  if (!res) {
    // sortie avant la fin : le temps joué compte quand même
    if (extra) { const k = dayKey(); p.playLog[k] = (p.playLog[k] ?? 0) + extra; await saveProfile(p); }
    go(bandOf(p) === "3-5" ? "#/home" : `#/game/${g.id}`);
    return;
  }
  await endScreen(p, g.id, trk, ref, res);
}

async function endScreen(p: Profile, gameId: string, trk: Track, ref: LevelRef, res: LevelResult) {
  const before = playerLevel(p.xp).level;
  const out = recordLevel(p, gameId, trk, ref.level.id, res);
  const tracks = Object.fromEntries(allGames().map((x) => [x.id, x.track(ctxFor(p))]));
  const newTrophies = checkTrophies(p, { tracks });
  await saveProfile(p);
  track(`jeu/${gameId}/${ref.level.id}/fin/${res.stars}`);
  const after = playerLevel(p.xp).level;
  const little = bandOf(p) === "3-5";
  const bossFail = ref.level.boss && res.stars < 2;
  const next = nextLevel(trk, ref);
  const gp = getGameProgress(p, gameId, trk);
  const nextOpen = next && isLevelUnlocked(p, gp, trk, next.ci, next.li) ? next : null;

  const app = clear(root());
  const card = h("div", { class: "end-card" });
  const st = h("div", { class: "end-stars" }, ...[0, 1, 2].map(() => h("span", {}, "★")));
  const phrase = bossFail ? t("end.bossRetry") : t(`end.stars${res.stars}` as "end.stars3");
  card.append(plume("l", "dance"), st, h("h1", {}, phrase));
  if (out.xp && !little) card.append(h("div", { class: "end-xp" }, t("end.xp", { n: out.xp })));
  if (after > before && !little) card.append(h("div", { class: "end-badge" }, "⭐ " + t("end.levelUp", { n: after })));
  if (out.chapterUnlocked !== null) card.append(h("div", { class: "end-badge" }, "🔓 " + t("end.chapterOpen")));
  for (const x of newTrophies) card.append(h("div", { class: "end-badge trophy" }, `${x.icon} ${t("end.trophy")} ${tr(x.title)}`));
  const actions = h("div", { class: "end-actions" });
  const replay = h("button", { class: "btn" + (bossFail ? " primary big" : "") }, "🔁 " + (little ? "" : t("end.replay")));
  replay.onclick = () => go(`#/play/${gameId}/${ref.level.id}?r=${Date.now()}`);
  if (nextOpen && !bossFail) {
    const nb = h("button", { class: "btn primary big" }, "▶ " + (little ? "" : t("end.next")));
    nb.onclick = () => go(`#/play/${gameId}/${nextOpen.level.id}`);
    actions.append(nb);
  }
  actions.append(replay);
  const back = h("button", { class: "btn ghost" }, little ? "🏠" : "🗺️ " + t("end.map"));
  back.onclick = () => go(little ? "#/home" : `#/game/${gameId}`);
  actions.append(back);
  card.append(actions);
  app.append(h("main", { class: "end" }, card));
  // étoiles une par une, puis la voix
  [...st.children].forEach((s, i) => { if (i < res.stars) setTimeout(() => { s.classList.add("on"); sfx.star(i); burst(s); }, 350 + i * 380); });
  setTimeout(() => {
    if (res.stars === 3) sfx.win();
    say(phrase, state.pageLang);
    if (out.chapterUnlocked !== null) say(t("end.chapterOpen"), state.pageLang, { interrupt: false });
    for (const x of newTrophies) { say(t("end.trophy"), state.pageLang, { interrupt: false }); say(tr(x.title), state.pageLang, { interrupt: false }); }
  }, 350 + res.stars * 380);
  if (minutesLeft(p) <= 0) setTimeout(timeOver, 4500);
}

// ---------------------------------------------------------------- fin du temps de jeu
export function timeOver() {
  const app = clear(root());
  const unlock = h("button", { class: "btn ghost small" }, "👪 " + t("time.unlock"));
  unlock.onclick = () => {
    const q = parentGate(state.pageLang);
    const input = h("input", { class: "input", inputmode: "numeric", "aria-label": t("parent.gate") }) as HTMLInputElement;
    const ok = h("button", { class: "btn primary" }, t("parent.enter"));
    const msg = h("p", { class: "muted" });
    const close = modal(h("div", {}, h("p", {}, t("parent.gate")), h("p", { class: "gate-q" }, q.question), input, ok, msg));
    ok.onclick = async () => {
      if (Number(input.value) !== q.answer) { msg.textContent = t("parent.wrong"); return; }
      const p = state.current!;
      p.settings.dailyLimit = 0; // le parent lève la limite (il peut la remettre dans les réglages)
      await saveProfile(p);
      close(); go("#/home");
    };
  };
  app.append(h("main", { class: "page calm" }, plume("l"), h("h1", {}, "🌙 " + t("time.over")), unlock));
  say(t("time.over"), state.pageLang);
}
