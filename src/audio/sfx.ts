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

export const sfx = {
  tap: () => tone(660, 0.08, "triangle", 0.12),
  pop: () => tone(520, 0.12, "sine", 0.2, 0, 900),
  good: () => { tone(660, 0.14, "triangle", 0.18); tone(880, 0.2, "triangle", 0.18, 0.09); },
  soft: () => tone(240, 0.22, "sine", 0.16, 0, 180),
  coin: () => { tone(988, 0.08, "square", 0.06); tone(1319, 0.18, "square", 0.06, 0.07); },
  step: (i: number) => tone(523 * Math.pow(2, (i % 8) / 12), 0.12, "triangle", 0.15),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, "triangle", 0.16, i * 0.11)),
  star: (i: number) => tone(784 * Math.pow(1.26, i), 0.3, "sine", 0.2),
  unlock: () => { tone(392, 0.2, "triangle", 0.15); tone(587, 0.3, "triangle", 0.15, 0.12); tone(784, 0.4, "triangle", 0.15, 0.26); },
};
