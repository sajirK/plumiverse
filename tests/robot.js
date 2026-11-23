// Robot de test de bout en bout (dans le navigateur, serveur de dev lancé, une page /fr/ ou /en/ ouverte) :
//   await import("/plumiverse/tests/robot.js"); robot.start([{ game: "calcul", age: 9 }])  puis robot.log
// Il crée un profil de test (tout débloqué), joue chaque niveau en suivant l'aide du jeu (window.__kit.target()),
// en temps accéléré, voix coupée. Attendu : chaque niveau finit, 3 étoiles, 0 erreur.
const sched = (() => {
  const ch = new MessageChannel(), q = []; let id = 1e6, kicked = false;
  const kick = () => { if (!kicked) { kicked = true; ch.port2.postMessage(0); } };
  ch.port1.onmessage = () => { kicked = false; const now = performance.now(); const due = q.filter((x) => x.t <= now).sort((a, b) => a.t - b.t);
    for (const it of due) { q.splice(q.indexOf(it), 1); if (it.rep) { it.t = now + it.rep; q.push(it); } try { it.fn(...it.a); } catch (e) { robot.errors.push(String(e)); } }
    if (q.length) kick(); };
  return { set(fn, ms, rep, a) { const it = { id: ++id, t: performance.now() + (ms || 0), fn: typeof fn === "function" ? fn : () => {}, a: a || [], rep }; q.push(it); kick(); return it.id; }, clear(i) { const k = q.findIndex((x) => x.id === i); if (k >= 0) q.splice(k, 1); } };
})();
const realClear = window.clearTimeout.bind(window);
const SPEED = 20;
// attente robuste : minuterie accélérée OU filet de sécurité par messages (si une minuterie se perd, on ne reste jamais bloqué)
const wait = (ms) => new Promise((r) => {
  let done = false;
  const fin = () => { if (!done) { done = true; r(); } };
  sched.set(fin, ms);
  const end = performance.now() + ms / SPEED + 250;
  const ch = new MessageChannel();
  ch.port1.onmessage = () => { if (done) return; if (performance.now() >= end) fin(); else ch.port2.postMessage(0); };
  ch.port2.postMessage(0);
});

function tap(el) {
  const r = el.getBoundingClientRect(), o = { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, bubbles: true, pointerId: 5 };
  el.dispatchEvent(new PointerEvent("pointerdown", o)); el.dispatchEvent(new PointerEvent("pointerup", o)); if (el.click) el.click(); else el.dispatchEvent(new MouseEvent("click", o));
}
function trace(pts) {
  const cv = document.querySelector("canvas"); const ev = (k, [x, y]) => cv.dispatchEvent(new PointerEvent(k, { clientX: x, clientY: y, bubbles: true, pointerId: 8 }));
  ev("pointerdown", pts[0]); pts.forEach((p) => ev("pointermove", p)); ev("pointerup", pts[pts.length - 1]);
}

const robot = (window.robot = { log: [], errors: [], done: true, accelerate: true, sched });

async function playLevel(game, level) {
  location.hash = `#/play/${game}/${level}`;
  await wait(60);
  const t0 = performance.now();
  let gestures = 0;
  while (performance.now() - t0 < 60000) {
    await wait(25);
    if (document.querySelector(".end-card")) {
      const st = window.__kit?.state();
      return { ok: true, errors: st?.errors ?? -1, gestures, bossRetry: !!document.querySelector(".end-card h1")?.textContent.match(/2/) && false };
    }
    let t = null;
    try { t = window.__kit?.target(); } catch (e) { robot.errors.push(`${game}/${level} target: ${e}`); }
    if (!t) continue;
    if (t.__robotAuto) { t.__robotAuto(); continue; }
    if (t.__robotSwipe) { const sw = t.__robotSwipe(); if (sw) { const [x1, y1, x2, y2] = sw; const pts = Array.from({ length: 7 }, (_, k) => [x1 + ((x2 - x1) * k) / 6, y1 + ((y2 - y1) * k) / 6]); trace(pts); gestures++; await wait(60); } continue; }
    if (t.__robotPath) { trace(t.__robotPath()); gestures++; await wait(80); continue; }
    if (t.__robotFill) t.__robotFill();
    if (t.isConnected && !t.disabled && !t.classList.contains("used")) { tap(t); gestures++; await wait(60); }
  }
  return { ok: false, errors: window.__kit?.state().errors ?? -1, gestures };
}

robot.start = async function (plans) {
  robot.log = []; robot.errors = []; robot.done = false;
  const app = window.__app;
  if (robot.accelerate) {
    window.setTimeout = (fn, ms, ...a) => sched.set(fn, (ms || 0) / SPEED, 0, a);
    window.setInterval = (fn, ms, ...a) => sched.set(fn, Math.max(4, (ms || 0) / SPEED), Math.max(4, (ms || 0) / SPEED), a);
    window.clearTimeout = window.clearInterval = (i) => (i >= 1e6 ? sched.clear(i) : realClear(i));
    window.requestAnimationFrame = (fn) => sched.set(() => fn(performance.now()), 16);
  }
  speechSynthesis.speak = () => {};
  window.addEventListener("error", (e) => robot.errors.push(e.message));
  const { gameById } = await import("/plumiverse/src/games/index.ts");
  const { createProfile, bandForAge } = await import("/plumiverse/src/core/profile.ts");
  for (const plan of plans) {
    const p = createProfile({ name: "Robot", age: plan.age, uiLang: app.state.pageLang, learning: ["fr", "en", "de", "es"] });
    p.settings.unlockAll = true; p.settings.voice = false;
    await app.saveProfile(p); await app.selectProfile(p);
    const g = gameById(plan.game);
    const ctx = { profile: p, age: plan.age, band: bandForAge(plan.age), lang: app.state.pageLang };
    const trk = g.track(ctx);
    const levels = trk.chapters.flatMap((c) => c.levels.map((l) => l.id)).filter((id) => !plan.only || plan.only.some((o) => id.startsWith(o)));
    for (const lv of levels) {
      const r = await playLevel(plan.game, lv);
      robot.log.push(`${plan.game} ${plan.age}ans ${lv}: ${r.ok ? (r.errors === 0 ? "OK ⭐3" : "fini, erreurs=" + r.errors) : "PAS FINI"} (${r.gestures} gestes)`);
    }
    await app.state.store.remove(p.id);
    app.state.profiles = app.state.profiles.filter((x) => x.id !== p.id);
  }
  robot.done = true;
  return robot.log;
};
robot.summary = () => { const bad = robot.log.filter((l) => !l.includes("OK ⭐3")); return { total: robot.log.length, bad, errors: robot.errors.slice(0, 10) }; };
