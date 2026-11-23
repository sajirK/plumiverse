// Couleurs & formes (3-6 ans), comme en V2 : les ballons de couleur, les formes à glisser dans leur ombre,
// et « Je compte » (on touche les objets pour compter à voix haute). Zéro lecture : on écoute et on touche.
import { L, type Lang, type Track, type Tr } from "../../core/types";
import { numberWords } from "../../core/numwords";
import { pick, shuffle, type Rng } from "../../core/util";
import { wordsOfUnit } from "../../content/lang/course";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";
import { drag, inside } from "../../kit/drag";

const COLORS = wordsOfUnit("couleurs"); // mêmes noms de couleurs que le cours de langue
const BASIC = ["couleurs.rouge", "couleurs.bleu", "couleurs.jaune", "couleurs.vert"];

/** « Quel ballon est rouge ? » — l'adjectif est attribut : pas d'accord compliqué, juste dans les 4 langues. */
export function colorQuestion(colorWord: string, lang: Lang): string {
  return { fr: `Quel ballon est ${colorWord} ?`, en: `Which balloon is ${colorWord}?`, de: `Welcher Ballon ist ${colorWord}?`, es: `¿Qué globo es ${colorWord}?` }[lang];
}
export const colorIs = (w: string, lang: Lang) => ({ fr: `C'est ${w} !`, en: `That's ${w}!`, de: `Das ist ${w}!`, es: `¡Es ${w}!` })[lang];
export const colorThat = (w: string, lang: Lang) => ({ fr: `Ça, c'est ${w}.`, en: `That one is ${w}.`, de: `Der ist ${w}.`, es: `Ese es ${w}.` })[lang];
/** Gardée pour les voix déjà générées. */
export function countQuestion(n: number, lang: Lang): string {
  if (n === 1) return { fr: "Où y a-t-il une étoile ?", en: "Where is one star?", de: "Wo ist ein Stern?", es: "¿Dónde hay una estrella?" }[lang];
  const w = numberWords(n, lang);
  return { fr: `Où y a-t-il ${w} étoiles ?`, en: `Where are ${w} stars?`, de: `Wo sind ${w} Sterne?`, es: `¿Dónde hay ${w} estrellas?` }[lang];
}

// ------------------------------------------------------------------ formes (V2 : glisser dans l'ombre)
export const SHAPES: Record<string, { svg: string; name: Tr; shadow: Tr }> = {
  rond: { svg: '<circle cx="50" cy="50" r="45"/>', name: L("le rond", "the circle", "der Kreis", "el círculo"), shadow: L("Cherche l'ombre du rond !", "Find the circle's shadow!", "Such den Schatten vom Kreis!", "¡Busca la sombra del círculo!") },
  carre: { svg: '<rect x="8" y="8" width="84" height="84" rx="6"/>', name: L("le carré", "the square", "das Quadrat", "el cuadrado"), shadow: L("Cherche l'ombre du carré !", "Find the square's shadow!", "Such den Schatten vom Quadrat!", "¡Busca la sombra del cuadrado!") },
  triangle: { svg: '<polygon points="50,5 95,92 5,92"/>', name: L("le triangle", "the triangle", "das Dreieck", "el triángulo"), shadow: L("Cherche l'ombre du triangle !", "Find the triangle's shadow!", "Such den Schatten vom Dreieck!", "¡Busca la sombra del triángulo!") },
  etoile: { svg: '<polygon points="50,4 62,38 98,38 69,60 80,95 50,74 20,95 31,60 2,38 38,38"/>', name: L("l'étoile", "the star", "der Stern", "la estrella"), shadow: L("Cherche l'ombre de l'étoile !", "Find the star's shadow!", "Such den Schatten vom Stern!", "¡Busca la sombra de la estrella!") },
  coeur: { svg: '<path d="M50 90 C 10 60, 0 35, 20 18 C 35 6, 48 15, 50 26 C 52 15, 65 6, 80 18 C 100 35, 90 60, 50 90 Z"/>', name: L("le cœur", "the heart", "das Herz", "el corazón"), shadow: L("Cherche l'ombre du cœur !", "Find the heart's shadow!", "Such den Schatten vom Herz!", "¡Busca la sombra del corazón!") },
  losange: { svg: '<polygon points="50,3 95,50 50,97 5,50"/>', name: L("le losange", "the diamond", "die Raute", "el rombo"), shadow: L("Cherche l'ombre du losange !", "Find the diamond's shadow!", "Such den Schatten von der Raute!", "¡Busca la sombra del rombo!") },
  lune: { svg: '<path d="M70 8 A 45 45 0 1 0 92 70 A 36 36 0 1 1 70 8 Z"/>', name: L("la lune", "the moon", "der Mond", "la luna"), shadow: L("Cherche l'ombre de la lune !", "Find the moon's shadow!", "Such den Schatten vom Mond!", "¡Busca la sombra de la luna!") },
  rectangle: { svg: '<rect x="2" y="25" width="96" height="50" rx="6"/>', name: L("le rectangle", "the rectangle", "das Rechteck", "el rectángulo"), shadow: L("Cherche l'ombre du rectangle !", "Find the rectangle's shadow!", "Such den Schatten vom Rechteck!", "¡Busca la sombra del rectángulo!") },
  ovale: { svg: '<ellipse cx="50" cy="50" rx="46" ry="30"/>', name: L("l'ovale", "the oval", "das Oval", "el óvalo"), shadow: L("Cherche l'ombre de l'ovale !", "Find the oval's shadow!", "Such den Schatten vom Oval!", "¡Busca la sombra del óvalo!") },
  hexagone: { svg: '<polygon points="27,8 73,8 96,50 73,92 27,92 4,50"/>', name: L("l'hexagone", "the hexagon", "das Sechseck", "el hexágono"), shadow: L("Cherche l'ombre de l'hexagone !", "Find the hexagon's shadow!", "Such den Schatten vom Sechseck!", "¡Busca la sombra del hexágono!") },
};
const EASY_SHAPES = ["rond", "carre", "triangle", "etoile", "coeur"];
const SHAPE_COLORS = ["#ef476f", "#118ab2", "#06d6a0", "#ff9f1c", "#7b2cbf", "#f15bb5"];
/** Un plateau de formes ; au plus difficile, au moins une paire qui se ressemble (rond/ovale ou carré/rectangle). */
export function shapeBoard(pool: string[], pieces: number, similar: boolean, rng: Rng = Math.random) {
  let names = shuffle(pool, rng).slice(0, pieces);
  if (similar && !(names.includes("rond") && names.includes("ovale")) && !(names.includes("carre") && names.includes("rectangle")))
    names = ["rond", "ovale", ...shuffle(pool.filter((n) => n !== "rond" && n !== "ovale"), rng).slice(0, pieces - 2)];
  return { pieces: shuffle(names, rng), shadows: shuffle(names, rng) };
}
const shapeSvg = (n: string, fill: string) => `<svg viewBox="0 0 100 100" width="100%" height="100%"><g fill="${fill}">${SHAPES[n].svg}</g></svg>`;

// ------------------------------------------------------------------ compter (V2 : toucher pour compter)
/** [un seul avec l'article, pluriel] ; f = féminin (fr/es) pour « une / una ». */
export const THINGS: { e: string; t: Record<Lang, [string, string]>; f: { fr: boolean; es: boolean }; deNot: string }[] = [
  { e: "🍎", t: { fr: ["une pomme", "pommes"], en: ["an apple", "apples"], de: ["ein Apfel", "Äpfel"], es: ["una manzana", "manzanas"] }, f: { fr: true, es: true }, deNot: "kein Apfel" },
  { e: "🐟", t: { fr: ["un poisson", "poissons"], en: ["a fish", "fish"], de: ["ein Fisch", "Fische"], es: ["un pez", "peces"] }, f: { fr: false, es: false }, deNot: "kein Fisch" },
  { e: "🚗", t: { fr: ["une voiture", "voitures"], en: ["a car", "cars"], de: ["ein Auto", "Autos"], es: ["un coche", "coches"] }, f: { fr: true, es: false }, deNot: "kein Auto" },
  { e: "⭐", t: { fr: ["une étoile", "étoiles"], en: ["a star", "stars"], de: ["ein Stern", "Sterne"], es: ["una estrella", "estrellas"] }, f: { fr: true, es: true }, deNot: "kein Stern" },
  { e: "🐞", t: { fr: ["une coccinelle", "coccinelles"], en: ["a ladybird", "ladybirds"], de: ["ein Marienkäfer", "Marienkäfer"], es: ["una mariquita", "mariquitas"] }, f: { fr: true, es: true }, deNot: "kein Marienkäfer" },
  { e: "🎈", t: { fr: ["un ballon", "ballons"], en: ["a balloon", "balloons"], de: ["ein Luftballon", "Luftballons"], es: ["un globo", "globos"] }, f: { fr: false, es: false }, deNot: "kein Luftballon" },
  { e: "🍪", t: { fr: ["un biscuit", "biscuits"], en: ["a biscuit", "biscuits"], de: ["ein Keks", "Kekse"], es: ["una galleta", "galletas"] }, f: { fr: false, es: true }, deNot: "kein Keks" },
  { e: "🦆", t: { fr: ["un canard", "canards"], en: ["a duck", "ducks"], de: ["eine Ente", "Enten"], es: ["un pato", "patos"] }, f: { fr: false, es: false }, deNot: "keine Ente" },
  { e: "🌸", t: { fr: ["une fleur", "fleurs"], en: ["a flower", "flowers"], de: ["eine Blume", "Blumen"], es: ["una flor", "flores"] }, f: { fr: true, es: true }, deNot: "keine Blume" },
  { e: "🦖", t: { fr: ["un dinosaure", "dinosaures"], en: ["a dinosaur", "dinosaurs"], de: ["ein Dinosaurier", "Dinosaurier"], es: ["un dinosaurio", "dinosaurios"] }, f: { fr: false, es: false }, deNot: "kein Dinosaurier" },
];
type Thing = (typeof THINGS)[number];
export const howMany = (t: Thing, lang: Lang) => {
  const p = t.t[lang][1];
  return ({ fr: `Combien ${/^[aeiouéèh]/i.test(p) ? "d'" : "de "}${p} ?`, en: `How many ${p}?`, de: `Wie viele ${p}?`, es: `¿Cuánt${t.f.es ? "as" : "os"} ${p}?` })[lang];
};
export const countWord = (n: number, t: Thing, lang: Lang) => (n === 1 ? ({ fr: t.f.fr ? "une" : "un", en: "one", de: "eins", es: t.f.es ? "una" : "uno" })[lang] : numberWords(n, lang));
export const countResult = (n: number, t: Thing, lang: Lang) => {
  const r = n === 1 ? t.t[lang][0].replace(/^(a|an) /, "one ") : `${numberWords(n, lang)} ${t.t[lang][1]}`;
  return ({ fr: `${r} !`, en: `${r}!`, de: `${r}!`, es: `¡${r}!` })[lang];
};
export const notThis = (t: Thing, lang: Lang) => ({ fr: `Ça, ce n'est pas ${t.t.fr[0]} !`, en: `That's not ${t.t.en[0]}!`, de: `Das ist ${t.deNot}!`, es: `¡Eso no es ${t.t.es[0]}!` })[lang];
export function countQ(min: number, max: number, options: number, decoys: number, rng: Rng = Math.random) {
  const n = min + Math.floor(rng() * (max - min + 1));
  const [thing, other] = shuffle(THINGS, rng);
  const opts = new Set([n]);
  for (const d of shuffle([1, -1, 2, -2, 3], rng)) { if (opts.size >= options) break; const v = n + d; if (v >= 1 && v <= 10) opts.add(v); }
  const k = decoys ? Math.min(decoys, 12 - n) : 0;
  return { n, thing, items: shuffle([...Array(n).fill(thing.e), ...Array(k).fill(other.e)], rng) as string[], options: shuffle([...opts], rng) };
}

const SAY = {
  shapesDone: L("Toutes les formes sont à leur place !", "All the shapes are in their place!", "Alle Formen sind an ihrem Platz!", "¡Todas las formas están en su sitio!"),
  shapesGo: L("Glisse chaque forme dans son ombre !", "Slide each shape into its shadow!", "Zieh jede Form in ihren Schatten!", "¡Desliza cada forma a su sombra!"),
  wrongShadow: L("Ce n'est pas la bonne ombre.", "That's not the right shadow.", "Das ist nicht der richtige Schatten.", "No es la sombra correcta."),
  tryCount: L("Essaie encore ! Touche-les pour compter.", "Try again! Tap them to count.", "Versuch es nochmal! Tipp sie an, um zu zählen.", "¡Inténtalo otra vez! Tócalos para contar."),
};

export const TRACK: Track = {
  chapters: [
    { id: "couleurs-1", tier: "facile", ages: [3, 3], title: L("Mes premières couleurs", "My first colours", "Meine ersten Farben", "Mis primeros colores"),
      levels: [
        { id: "c1-1", rounds: 5, params: { kind: "color", n: 2, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-2", rounds: 5, params: { kind: "color", n: 3, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-3", rounds: 6, params: { kind: "color", n: 4, palette: "basic" }, skills: ["couleurs"] },
        { id: "c1-b", rounds: 6, boss: true, params: { kind: "color", n: 4, palette: "basic", drift: true }, skills: ["couleurs"] },
      ] },
    { id: "couleurs-2", tier: "facile", ages: [4, 4], title: L("Toutes les couleurs", "All the colours", "Alle Farben", "Todos los colores"),
      levels: [
        { id: "c2-1", rounds: 6, params: { kind: "color", n: 4, palette: "all" }, skills: ["couleurs"] },
        { id: "c2-2", rounds: 6, params: { kind: "color", n: 5, palette: "all", drift: true }, skills: ["couleurs"] },
        { id: "c2-3", rounds: 8, params: { kind: "color", n: 6, palette: "all", drift: true }, skills: ["couleurs"] },
        { id: "c2-b", rounds: 8, boss: true, params: { kind: "color", n: 6, palette: "all", drift: true }, skills: ["couleurs"] },
      ] },
    { id: "formes", tier: "facile", ages: [5, 5], title: L("Les formes", "Shapes", "Formen", "Las formas"),
      levels: [
        { id: "f-1", rounds: 3, params: { kind: "shape", pieces: 3, pool: "easy" }, skills: ["formes"] },
        { id: "f-2", rounds: 4, params: { kind: "shape", pieces: 4, pool: "mid" }, skills: ["formes"] },
        { id: "f-3", rounds: 4, params: { kind: "shape", pieces: 5, pool: "all", similar: true }, skills: ["formes"] },
        { id: "f-b", rounds: 4, boss: true, params: { kind: "shape", pieces: 5, pool: "all", similar: true }, skills: ["formes"] },
      ] },
    { id: "compter", tier: "moyen", ages: [6, 6], title: L("Compter jusqu'à 10", "Counting to 10", "Zählen bis 10", "Contar hasta 10"),
      levels: [
        { id: "n-1", rounds: 6, params: { kind: "count", min: 1, max: 5, options: 3, decoys: 0 }, skills: ["compter"] },
        { id: "n-2", rounds: 7, params: { kind: "count", min: 3, max: 10, options: 3, decoys: 0 }, skills: ["compter"] },
        { id: "n-3", rounds: 8, params: { kind: "count", min: 4, max: 10, options: 4, decoys: 4 }, skills: ["compter"] },
        { id: "n-b", rounds: 8, boss: true, params: { kind: "count", min: 4, max: 10, options: 4, decoys: 4 }, skills: ["compter"] },
      ] },
  ],
};

export const couleursGame: GameDef = {
  id: "couleurs",
  icon: "🎈",
  category: "maths",
  ages: [3, 6],
  title: L("Couleurs & formes", "Colours & shapes", "Farben & Formen", "Colores y formas"),
  desc: L("Reconnaître les couleurs, les formes et compter jusqu'à 10, sans savoir lire.", "Recognise colours and shapes and count to 10, no reading needed.", "Farben und Formen erkennen und bis 10 zählen, ganz ohne Lesen.", "Reconocer colores y formas y contar hasta 10, sin saber leer."),
  skills: { couleurs: L("Les couleurs", "Colours", "Farben", "Los colores"), formes: L("Les formes", "Shapes", "Formen", "Las formas"), compter: L("Compter jusqu'à 10", "Counting to 10", "Zählen bis 10", "Contar hasta 10") },
  speech: (lang) => [
    ...COLORS.flatMap((c) => [colorIs(c.t[lang].show, lang), colorThat(c.t[lang].show, lang)]),
    ...Object.values(SHAPES).flatMap((s) => [s.name[lang], s.shadow[lang]]), ...Object.values(SAY).map((x) => x[lang]),
    ...THINGS.flatMap((t) => [howMany(t, lang), notThis(t, lang), countWord(1, t, lang), ...Array.from({ length: 10 }, (_, i) => countResult(i + 1, t, lang))]),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => ({
    color: L("Écoute bien, et touche le ballon de la bonne couleur !", "Listen carefully and tap the balloon of the right colour!", "Hör gut zu und tipp den Ballon in der richtigen Farbe an!", "¡Escucha bien y toca el globo del color correcto!"),
    shape: L("Glisse chaque forme dans son ombre !", "Slide each shape into its shadow!", "Zieh jede Form in ihren Schatten!", "¡Desliza cada forma a su sombra!"),
    count: (level.params as { decoys?: number }).decoys
      ? L("Compte seulement les objets demandés ! Touche-les pour compter.", "Count only the things you're asked for! Tap them to count.", "Zähl nur die gesuchten Dinge! Tipp sie an, um zu zählen.", "¡Cuenta solo lo que te piden! Tócalos para contar.")
      : L("Combien y en a-t-il ? Touche les objets pour compter.", "How many are there? Tap the things to count.", "Wie viele sind es? Tipp die Dinge an, um zu zählen.", "¿Cuántos hay? Toca las cosas para contar."),
  } as Record<string, Tr>)[(level.params as { kind: string }).kind][ctx.lang],
  start(round, level, ctx) {
    const p = level.params as { kind: string; n?: number; palette?: string; drift?: boolean; pieces?: number; pool?: string; similar?: boolean; min?: number; max?: number; options?: number; decoys?: number };
    const lang = ctx.lang;
    if (p.kind === "color") {
      const n = round.assist ? Math.max(2, p.n! - 1) : p.n!;
      const palette = COLORS.filter((c) => p.palette === "all" || BASIC.includes(c.id));
      const set = shuffle(palette).slice(0, n), goal = pick(set);
      const ask = () => round.say(colorQuestion(goal.t[lang].show, lang));
      const target = h("button", { class: "cf-target", "aria-label": "🔊" }, h("span", { class: "cf-splash", style: { "--c": goal.color! } }), h("span", { class: "cf-ear" }, "👂"));
      target.onclick = ask;
      const sky = h("div", { class: "cf-sky" + (p.drift ? " drift" : ""), style: { "--bw": n <= 3 ? "clamp(110px, 26vmin, 190px)" : n <= 4 ? "clamp(96px, 22vmin, 160px)" : "clamp(80px, 18vmin, 130px)" } });
      let goalEl: HTMLElement | null = null;
      set.forEach((c, i) => {
        const b = h("button", { class: "cf-balloon" + (c.id === "couleurs.blanc" ? " white" : ""), style: { "--c": c.color!, "--d": `${i * 0.35}s`, "--float": `${2.6 + (i % 3) * 0.5 + (p.drift ? 3 : 0)}s` }, "aria-label": c.t[lang].show });
        if (c === goal) goalEl = b;
        b.onclick = () => {
          if (round.ended) return;
          if (c === goal) { b.classList.add("popped"); sfx.bubble(); round.burst(b, ["🎈", "✨", "⭐"]); round.win(null, colorIs(c.t[lang].show, lang)); }
          else { round.miss(b, colorThat(c.t[lang].show, lang)); round.say(colorQuestion(goal.t[lang].show, lang), lang, { interrupt: false }); }
        };
        sky.appendChild(b);
      });
      round.stage.append(h("div", { class: "ca-wrap" }, target, sky));
      round.setHintTarget(() => goalEl);
      round.timeout(ask, round.index === 0 ? 2600 : 350);
      return;
    }
    if (p.kind === "shape") {
      const pool = p.pool === "easy" ? EASY_SHAPES : p.pool === "mid" ? Object.keys(SHAPES).slice(0, 8) : Object.keys(SHAPES);
      const b = shapeBoard(pool, p.pieces!, !!p.similar);
      const targets = h("div", { class: "cf-row" }), piecesEl = h("div", { class: "cf-row" });
      round.stage.append(h("div", { class: "cf-zone", style: { "--sz": `min(${["", "", "", "clamp(90px, 22vmin, 150px)", "clamp(80px, 19vmin, 130px)", "clamp(70px, 16vmin, 112px)"][p.pieces!]}, calc((98vw - ${p.pieces! * 6}px) / ${p.pieces!}))` } }, targets, piecesEl));
      const shadowEls: Record<string, HTMLElement> = {}, pieceEls: Record<string, HTMLElement> = {};
      for (const n of b.shadows) { const s = h("div", { class: "cf-shadow" }); s.innerHTML = shapeSvg(n, "#3b2a4d"); shadowEls[n] = s; targets.appendChild(s); }
      let left = b.pieces.length;
      b.pieces.forEach((n, i) => {
        const color = SHAPE_COLORS[i % SHAPE_COLORS.length];
        const el = h("div", { class: "cf-piece", "aria-label": SHAPES[n].name[lang] }); el.innerHTML = shapeSvg(n, color); pieceEls[n] = el;
        piecesEl.appendChild(el);
        const under = (pt: { x: number; y: number }) => Object.entries(shadowEls).find(([, s]) => !s.classList.contains("filled") && inside(s, pt, 24));
        drag(el, {
          enabled: () => !round.ended && !el.classList.contains("placed"),
          ghost: () => { const w = el.offsetWidth + "px"; const g = h("div", { style: { width: w, height: w } }); g.innerHTML = shapeSvg(n, color); return g; },
          onMove: (pt) => { Object.values(shadowEls).forEach((s) => s.classList.remove("hot")); under(pt)?.[1].classList.add("hot"); },
          onDrop: (pt) => {
            Object.values(shadowEls).forEach((s) => s.classList.remove("hot"));
            const u = under(pt);
            if (!u) return false;
            if (u[0] !== n) { round.miss(u[1], SAY.wrongShadow[lang]); round.say(SHAPES[n].shadow[lang], lang, { interrupt: false }); return false; }
            u[1].classList.add("filled"); u[1].innerHTML = shapeSvg(n, color);
            el.classList.add("placed"); sfx.success(); round.burst(u[1]); round.say(SHAPES[n].name[lang]);
            if (--left === 0) round.win(null, SAY.shapesDone[lang], { delay: 1800 });
            return true;
          },
          onTap: () => { round.say(SHAPES[n].name[lang]); round.hint({ from: el, to: shadowEls[n] }); },
        });
      });
      round.setHintTarget(() => { const n = b.pieces.find((x) => !pieceEls[x].classList.contains("placed")); return n ? { from: pieceEls[n], to: shadowEls[n] } : null; });
      if (round.index > 0) round.say(SAY.shapesGo[lang]);
      return;
    }
    // compter
    const q = countQ(p.min!, p.max!, round.assist ? 2 : p.options!, p.decoys!);
    const ask = () => round.say(howMany(q.thing, lang));
    const prompt = h("button", { class: "cf-target", "aria-label": "🔊" }, `${q.thing.e} ❓`);
    prompt.onclick = ask;
    const box = h("div", { class: "cf-count" });
    let counted = 0;
    q.items.forEach((e, i) => {
      const s = h("button", { class: "cf-obj", style: { animationDelay: i * 60 + "ms" }, "aria-label": e }, e);
      s.onclick = () => {
        if (round.ended) return;
        if (e !== q.thing.e) { round.say(notThis(q.thing, lang)); return; }
        if (s.classList.contains("counted")) return;
        s.classList.add("counted"); counted++;
        sfx.step(counted - 1);
        round.say(countWord(counted, q.thing, lang));
      };
      box.appendChild(s);
    });
    const choices = h("div", { class: "k-choices" });
    let good: HTMLElement | null = null;
    for (const v of q.options) {
      const b = h("button", { class: "k-choice cf-num" }, String(v));
      if (v === q.n) good = b;
      b.onclick = () => { if (round.ended) return; if (v === q.n) round.win(b, countResult(q.n, q.thing, lang)); else round.miss(b, SAY.tryCount[lang]); };
      choices.appendChild(b);
    }
    round.stage.append(h("div", { class: "ca-wrap" }, prompt, box, choices));
    round.setHintTarget(() => good);
    round.timeout(ask, round.index === 0 ? 2600 : 350);
  },
};
