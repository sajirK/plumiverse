// Bruitages doux, synthétisés (WebAudio) : aucun fichier à télécharger.
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

export const setSfx = (on: boolean) => { enabled = on; };

function ac(): AudioContext | null {
  if (!enabled) return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    const comp = ctx.createDynamicsCompressor();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(comp).connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", vol = 0.2, delay = 0, slideTo?: number) {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.05);
}

/** Petite cloche : une note + harmoniques douces (V2). */
function bell(freq: number, delay = 0, vol = 0.22, len = 0.9) {
  tone(freq, len, "sine", vol, delay); tone(freq * 2, len * 0.5, "sine", vol * 0.25, delay); tone(freq * 3.01, len * 0.25, "sine", vol * 0.08, delay);
}
/** Note qui glisse (bulle, saut, boing…), avec vibrato possible. */
function slide(from: number, to: number, dur: number, vol = 0.3, type: OscillatorType = "sine", delay = 0, vibrato = 0) {
  const a = ac(); if (!a || !master) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(from, t); o.frequency.exponentialRampToValueAtTime(to, t + dur);
  if (vibrato) { const l = a.createOscillator(), lg = a.createGain(); l.frequency.value = 9; lg.gain.value = vibrato; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur + 0.1); }
  g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.1);
}
let noiseBuf: AudioBuffer | null = null;
/** Bruit filtré : whoosh, sauce qu'on étale, four qui crépite. */
function noise(dur: number, { from = 800, to = 2500, q = 1.2, volume = 0.25, delay = 0, type = "bandpass" as BiquadFilterType } = {}) {
  const a = ac(); if (!a || !master) return;
  if (!noiseBuf) { noiseBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t = a.currentTime + delay, src = a.createBufferSource(); src.buffer = noiseBuf;
  const f = a.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(from, t); f.frequency.exponentialRampToValueAtTime(to, t + dur);
  const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(volume, t + dur * 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master); src.start(t, Math.random()); src.stop(t + dur + 0.05);
}
const SCALE = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19];

export const sfx = {
  tap: () => tone(660, 0.08, "triangle", 0.12),
  pop: () => tone(520, 0.12, "sine", 0.2, 0, 900),
  good: () => { tone(660, 0.14, "triangle", 0.18); tone(880, 0.2, "triangle", 0.18, 0.09); },
  soft: () => tone(240, 0.22, "sine", 0.16, 0, 180),
  coin: () => { bell(1318.5, 0, 0.16, 0.4); bell(1568, 0.07, 0.14, 0.6); },
  /** n-ième note de la gamme : pour compter, ça monte joliment. */
  step: (i: number) => bell(392 * Math.pow(2, SCALE[Math.min(Math.max(0, i), SCALE.length - 1)] / 12), 0, 0.2, 0.7),
  win: () => [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => bell(f, i * 0.12, 0.17, 0.8)),
  bell, slide, noise,
  click: () => slide(900, 600, 0.05, 0.15),
  bubble: () => { const b = 380 + Math.random() * 220; slide(b, b * 2.6, 0.07, 0.35); },
  swoosh: () => noise(0.16, { from: 600, to: 3000, q: 0.8, volume: 0.18 }),
  splat: () => { noise(0.12, { from: 2500, to: 500, q: 1, volume: 0.32 }); slide(300, 120, 0.1, 0.18, "sine", 0.01); },
  yum: () => { slide(300, 420, 0.12, 0.2); slide(420, 300, 0.14, 0.2, "sine", 0.14); },
  ding: () => { bell(1568, 0, 0.22, 1.2); bell(2093, 0.02, 0.08, 0.8); },
  jump: () => slide(260, 620, 0.16, 0.22),
  bonk: () => slide(520, 180, 0.12, 0.35),
  success: () => { bell(1046.5, 0, 0.18, 0.6); bell(1318.5, 0.09, 0.16, 0.6); bell(1568, 0.18, 0.14, 0.9); },
  wrong: () => slide(330, 200, 0.28, 0.28, "sine", 0, 18),
  star: (i: number) => tone(784 * Math.pow(1.26, i), 0.3, "sine", 0.2),
  unlock: () => { tone(392, 0.2, "triangle", 0.15); tone(587, 0.3, "triangle", 0.15, 0.12); tone(784, 0.4, "triangle", 0.15, 0.26); },
};

/** Pour les instruments (Piano) : le contexte audio et la sortie (null si le son est coupé). */
export function audioOut(): { ac: AudioContext; out: AudioNode } | null {
  const a = ac();
  return a && master ? { ac: a, out: master } : null;
}
