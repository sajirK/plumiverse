// Les saisons et la météo (3-8 ans) : habiller l'enfant selon le temps, puis reconnaître les saisons et leur ordre.
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { drag, inside } from "../../kit/drag";
import { sfx } from "../../audio/sfx";

export type Cloth = "manteau" | "echarpe" | "gants" | "bottes" | "parapluie" | "casquette" | "lunettes" | "tshirt" | "short" | "maillot";
export const CLOTHES: Record<Cloth, { e: string; name: Tr }> = {
  manteau: { e: "🧥", name: L("le manteau", "the coat", "den Mantel", "el abrigo") },
  echarpe: { e: "🧣", name: L("l'écharpe", "the scarf", "den Schal", "la bufanda") },
  gants: { e: "🧤", name: L("les gants", "the gloves", "die Handschuhe", "los guantes") },
  bottes: { e: "👢", name: L("les bottes", "the boots", "die Stiefel", "las botas") },
  parapluie: { e: "☂️", name: L("le parapluie", "the umbrella", "den Regenschirm", "el paraguas") },
  casquette: { e: "🧢", name: L("la casquette", "the cap", "die Mütze", "la gorra") },
  lunettes: { e: "🕶️", name: L("les lunettes de soleil", "the sunglasses", "die Sonnenbrille", "las gafas de sol") },
  tshirt: { e: "👕", name: L("le tee-shirt", "the T-shirt", "das T-Shirt", "la camiseta") },
  short: { e: "🩳", name: L("le short", "the shorts", "die kurze Hose", "el pantalón corto") },
  maillot: { e: "🩱", name: L("le maillot de bain", "the swimsuit", "den Badeanzug", "el bañador") },
};
export const CLOTH_KEYS = Object.keys(CLOTHES) as Cloth[];

export interface Weather { id: string; sky: string; scene: string; text: Tr; need: Cloth[]; no: Partial<Record<Cloth, Tr>> }
const TOO_HOT = L("On aurait beaucoup trop chaud !", "We would be far too hot!", "Da wäre es viel zu warm!", "¡Tendríamos muchísimo calor!");
const TOO_COLD = L("Brrr, on aurait trop froid !", "Brrr, we would be too cold!", "Brrr, da wäre es zu kalt!", "¡Brrr, tendríamos demasiado frío!");
export const WEATHERS: Weather[] = [
  { id: "neige", sky: "#dbe4ff", scene: "⛄❄️🌲", text: L("Il neige et il fait très froid !", "It's snowing and very cold!", "Es schneit und ist sehr kalt!", "¡Está nevando y hace mucho frío!"), need: ["manteau", "echarpe", "gants"], no: { short: TOO_COLD, maillot: TOO_COLD, tshirt: TOO_COLD } },
  { id: "pluie", sky: "#ced4da", scene: "🌧️💧🐌", text: L("Il pleut beaucoup aujourd'hui !", "It's raining a lot today!", "Heute regnet es sehr!", "¡Hoy llueve mucho!"), need: ["parapluie", "bottes"], no: { lunettes: L("Des lunettes de soleil sous la pluie ? Il n'y a pas de soleil !", "Sunglasses in the rain? There's no sun!", "Eine Sonnenbrille im Regen? Es gibt keine Sonne!", "¿Gafas de sol con lluvia? ¡No hay sol!"), maillot: L("On ne va pas à la plage sous la pluie !", "We don't go to the beach in the rain!", "Bei Regen gehen wir nicht an den Strand!", "¡No vamos a la playa con lluvia!") } },
  { id: "soleil", sky: "#a5d8ff", scene: "☀️🌳🦋", text: L("Il fait beau et très chaud !", "It's sunny and very hot!", "Die Sonne scheint und es ist sehr heiß!", "¡Hace sol y mucho calor!"), need: ["casquette", "tshirt"], no: { manteau: TOO_HOT, echarpe: TOO_HOT, gants: TOO_HOT } },
  { id: "plage", sky: "#99e9f2", scene: "🏖️🌊🐚", text: L("On va à la plage, il fait très chaud !", "We're going to the beach, it's very hot!", "Wir gehen an den Strand, es ist sehr heiß!", "¡Vamos a la playa, hace mucho calor!"), need: ["maillot", "lunettes", "casquette"], no: { manteau: TOO_HOT, bottes: L("Des bottes dans le sable ? Pas pratique !", "Boots in the sand? Not handy!", "Stiefel im Sand? Nicht praktisch!", "¿Botas en la arena? ¡Nada práctico!"), gants: TOO_HOT, echarpe: TOO_HOT } },
];

export function checkOutfit(w: Weather, worn: Cloth[]) {
  const missing = w.need.filter((k) => !worn.includes(k));
  const wrong = worn.filter((k) => w.no[k]);
  return { ok: !missing.length && !wrong.length, missing, wrong };
}
export function outfitMessage(w: Weather, worn: Cloth[], lang: Lang): string {
  const r = checkOutfit(w, worn);
  if (r.ok) return L("Parfait ! C'est la bonne tenue pour ce temps-là !", "Perfect! That's the right outfit for this weather!", "Perfekt! Das passt genau zu diesem Wetter!", "¡Perfecto! ¡Es la ropa justa para este tiempo!")[lang];
  if (r.wrong.length) return w.no[r.wrong[0]]![lang];
  const n = CLOTHES[r.missing[0]].name[lang];
  return { fr: `Il manque encore ${n} !`, en: `Still missing: ${n}!`, de: `Es fehlt noch ${n}!`, es: `¡Todavía falta ${n}!` }[lang];
}
export const dressText = (w: Weather, lang: Lang) => w.text[lang] + " " + L("Habille-le pour aller dehors !", "Dress him to go outside!", "Zieh ihn zum Rausgehen an!", "¡Vístelo para salir!")[lang];

export interface Season { id: string; name: Tr; scene: string; e: string; hint: Tr }
export const SEASONS: Season[] = [
  { id: "printemps", name: L("le printemps", "spring", "der Frühling", "la primavera"), scene: "🌷🐣🌸", e: "🌸", hint: L("les fleurs poussent et les oiseaux font leur nid", "flowers grow and birds build their nests", "die Blumen wachsen und die Vögel bauen ihre Nester", "crecen las flores y los pájaros hacen su nido") },
  { id: "ete", name: L("l'été", "summer", "der Sommer", "el verano"), scene: "🏖️☀️🍉", e: "☀️", hint: L("il fait chaud et on va à la plage", "it's hot and we go to the beach", "es ist heiß und wir gehen an den Strand", "hace calor y vamos a la playa") },
  { id: "automne", name: L("l'automne", "autumn", "der Herbst", "el otoño"), scene: "🍂🍄🌰", e: "🍂", hint: L("les feuilles tombent des arbres", "the leaves fall from the trees", "die Blätter fallen von den Bäumen", "las hojas caen de los árboles") },
  { id: "hiver", name: L("l'hiver", "winter", "der Winter", "el invierno"), scene: "⛄❄️🧤", e: "⛄", hint: L("il fait froid et il peut neiger", "it's cold and it can snow", "es ist kalt und es kann schneien", "hace frío y puede nevar") },
];
export const nextSeason = (id: string) => SEASONS[(SEASONS.findIndex((s) => s.id === id) + 1) % 4];
export const sceneQ = L("Regarde l'image. Quelle saison est-ce ?", "Look at the picture. Which season is it?", "Schau dir das Bild an. Welche Jahreszeit ist das?", "Mira la imagen. ¿Qué estación es?");
const DE_DAT: Record<string, string> = { printemps: "dem Frühling", ete: "dem Sommer", automne: "dem Herbst", hiver: "dem Winter" };
export const afterQ = (s: Season, lang: Lang) => ({ fr: `Qu'est-ce qui vient après ${s.name.fr} ?`, en: `What comes after ${s.name.en}?`, de: `Was kommt nach ${DE_DAT[s.id]}?`, es: `¿Qué viene después de${s.name.es.startsWith("el ") ? "l " + s.name.es.slice(3) : " " + s.name.es}?` })[lang];
const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
/** « C'est le printemps : les fleurs poussent… » */
export const seasonIs = (s: Season, lang: Lang) => { const n = s.name[lang], k = s.hint[lang]; return ({ fr: `C'est ${n} : ${k} !`, en: `It's ${n}: ${k}!`, de: `Das ist ${n}: ${k}!`, es: `¡Es ${n}: ${k}!` })[lang]; };
/** « Après le printemps, vient l'été ! » */
export const afterIs = (s: Season, lang: Lang) => { const a = s.name[lang], b = nextSeason(s.id).name[lang]; return ({ fr: `Après ${a}, vient ${b} !`, en: `After ${a} comes ${b}!`, de: `Nach ${DE_DAT[s.id]} kommt ${b}!`, es: `¡Después de${a.startsWith("el ") ? "l " + a.slice(3) : " " + a} viene ${b}!` })[lang]; };
/** Mauvaise saison sur l'image : « L'été, c'est quand il fait chaud… Regarde bien l'image ! » */
export const notThis = (s: Season, lang: Lang) => { const n = cap(s.name[lang]), k = s.hint[lang]; return ({ fr: `${n}, c'est quand ${k}. Regarde bien l'image !`, en: `${n} is when ${k}. Look carefully at the picture!`, de: `Das wäre ${s.name.de}: ${k}. Schau dir das Bild genau an!`, es: `${n} es cuando ${k}. ¡Mira bien la imagen!` })[lang]; };
export const orderHint = L("Printemps, été, automne, hiver… Réfléchis à l'ordre !", "Spring, summer, autumn, winter… Think about the order!", "Frühling, Sommer, Herbst, Winter… Denk an die Reihenfolge!", "Primavera, verano, otoño, invierno… ¡Piensa en el orden!");

export type Step = { kind: "meteo"; weather: Weather; wardrobe: Cloth[] } | { kind: "scene" | "after"; season: Season; answer: string; options: Season[] };

export function wardrobeFor(w: Weather, small: boolean, rng: Rng = Math.random): Cloth[] {
  if (!small) return CLOTH_KEYS;
  const traps = shuffle(Object.keys(w.no) as Cloth[], rng).slice(0, 2);
  const keep = new Set([...w.need, ...traps]);
  return CLOTH_KEYS.filter((k) => keep.has(k));
}
export function plan(p: { weathers: number; small: boolean; seasons: number; order?: boolean }, rng: Rng = Math.random): Step[] {
  const out: Step[] = shuffle(WEATHERS, rng).slice(0, p.weathers).map((w) => ({ kind: "meteo" as const, weather: w, wardrobe: wardrobeFor(w, p.small, rng) }));
  const ss = shuffle(SEASONS, rng);
  for (let i = 0; i < p.seasons; i++) {
    const s = ss[i % 4];
    if (p.order && i % 2 === 1) out.push({ kind: "after", season: s, answer: nextSeason(s.id).id, options: shuffle(SEASONS.filter((x) => x.id !== s.id), rng) });
    else out.push({ kind: "scene", season: s, answer: s.id, options: shuffle(SEASONS, rng) });
  }
  return out;
}

const lv = (id: string, weathers: number, small: boolean, seasons: number, order = false, boss = false): LevelDef => ({ id, rounds: weathers + seasons, params: { weathers, small, seasons, order }, boss, skills: weathers && seasons ? ["meteo", "saisons"] : weathers ? ["meteo"] : ["saisons"] });

export const TRACK: Track = {
  chapters: [
    { id: "s1", tier: "facile", ages: [3, 5], title: L("Quel temps fait-il ?", "What's the weather like?", "Wie ist das Wetter?", "¿Qué tiempo hace?"), levels: [lv("1-1", 2, true, 0), lv("1-2", 3, true, 0), lv("1-b", 4, true, 0, false, true)] },
    { id: "s2", tier: "moyen", ages: [6, 7], title: L("Les quatre saisons", "The four seasons", "Die vier Jahreszeiten", "Las cuatro estaciones"), levels: [lv("2-1", 2, false, 2), lv("2-2", 0, false, 4), lv("2-b", 3, false, 2, false, true)] },
    { id: "s3", tier: "difficile", ages: [8, 8], title: L("L'ordre des saisons", "The order of the seasons", "Die Reihenfolge der Jahreszeiten", "El orden de las estaciones"), levels: [lv("3-1", 1, false, 4, true), lv("3-b", 3, false, 4, true, true)] },
  ],
};

export const saisonsGame: GameDef = {
  id: "saisons",
  icon: "🌦️",
  category: "sciences",
  ages: [3, 8],
  title: L("Les saisons et la météo", "Seasons and weather", "Jahreszeiten und Wetter", "Estaciones y tiempo"),
  desc: L("Choisir les bons habits selon le temps qu'il fait, puis reconnaître les quatre saisons et leur ordre.", "Choose the right clothes for the weather, then recognise the four seasons and their order.", "Die passende Kleidung zum Wetter wählen und die vier Jahreszeiten mit ihrer Reihenfolge erkennen.", "Elegir la ropa adecuada según el tiempo y reconocer las cuatro estaciones y su orden."),
  skills: { meteo: L("S'habiller selon la météo", "Dressing for the weather", "Sich passend zum Wetter anziehen", "Vestirse según el tiempo"), saisons: L("Les saisons", "The seasons", "Die Jahreszeiten", "Las estaciones") },
  speech: (lang) => [
    sceneQ[lang],
    orderHint[lang], ...SEASONS.flatMap((s) => [afterQ(s, lang), seasonIs(s, lang), afterIs(s, lang), notThis(s, lang)]),
    ...WEATHERS.flatMap((w) => [dressText(w, lang), outfitMessage(w, w.need, lang), ...Object.values(w.no).map((x) => x![lang]), ...w.need.map((k) => outfitMessage(w, w.need.filter((x) => x !== k), lang))]),
    ...CLOTH_KEYS.map((k) => CLOTHES[k].name[lang]),
  ],
  track: () => TRACK,
  instruction: (level, ctx) => ((level.params as { weathers: number }).weathers
    ? (level.params as { seasons: number }).seasons
      ? L("Habille l'enfant selon la météo, puis trouve les saisons !", "Dress the child for the weather, then find the seasons!", "Zieh das Kind passend zum Wetter an und finde dann die Jahreszeiten!", "¡Viste al niño según el tiempo y luego encuentra las estaciones!")
      : L("Regarde le temps qu'il fait, et glisse les bons habits sur l'enfant pour sortir !", "Look at the weather and slide the right clothes onto the child to go outside!", "Schau dir das Wetter an und zieh dem Kind die richtigen Sachen zum Rausgehen an!", "¡Mira el tiempo que hace y pon al niño la ropa adecuada para salir!")
    : L("Trouve la bonne saison !", "Find the right season!", "Finde die richtige Jahreszeit!", "¡Encuentra la estación correcta!"))[ctx.lang],
  setup: (level) => plan(level.params as { weathers: number; small: boolean; seasons: number; order?: boolean }),
  start(round, _level, ctx) {
    const st = (round.session as Step[])[round.index];
    const wrap = h("div", { class: "ca-wrap" + (st.kind === "meteo" ? " sa-meteo" : "") });
    round.stage.appendChild(wrap);
    if (st.kind !== "meteo") {
      const ask = () => round.say(st.kind === "scene" ? sceneQ[ctx.lang] : afterQ(st.season, ctx.lang));
      const card = h("button", { class: "sa-sky big" }, st.kind === "scene" ? st.season.scene : `${st.season.e} ➡️ ❓`);
      card.onclick = ask;
      const row = h("div", { class: "k-choices" });
      const btns = st.options.map((o) => {
        const b = h("button", { class: "k-choice" }, h("span", { class: "sa-big" }, o.e), h("small", {}, o.name[ctx.lang]));
        b.onclick = () => {
          if (round.ended) return;
          if (o.id === st.answer) round.win(b, st.kind === "scene" ? seasonIs(o, ctx.lang) : afterIs(st.season, ctx.lang), { praise: false, delay: 3600 });
          else round.miss(b, st.kind === "scene" ? notThis(o, ctx.lang) : orderHint[ctx.lang]);
        };
        row.appendChild(b); return { b, o };
      });
      wrap.append(card, row);
      round.setHintTarget(() => btns.find((x) => x.o.id === st.answer)!.b);
      round.timeout(ask, round.index === 0 ? 2400 : 300);
      return;
    }
    const w = st.weather, worn: Cloth[] = [];
    const ask = () => round.say(dressText(w, ctx.lang));
    const sky = h("button", { class: "sa-sky", style: { background: w.sky } });
    const kid = h("div", { class: "sa-kid" }, "🧒");
    const wornEl = h("div", { class: "sa-worn" });
    sky.append(h("div", { class: "sa-scene" }, w.scene), h("div", {}, kid, wornEl));
    sky.onclick = ask;
    const wardrobe = h("div", { class: "sa-wardrobe", style: { gridTemplateColumns: `repeat(${Math.min(5, st.wardrobe.length)}, 1fr)` } });
    const ready = h("button", { class: "k-btn primary", "aria-label": "✅" }, "✅");
    wrap.append(sky, h("div", { class: "sa-side" }, wardrobe, ready));
    const btns = {} as Record<Cloth, HTMLElement>;
    const wornBtn: Partial<Record<Cloth, HTMLElement>> = {};
    const render = () => {
      wornEl.replaceChildren(...worn.map((k) => {
        const b = h("button", { class: "sa-on", "aria-label": CLOTHES[k].name[ctx.lang] }, CLOTHES[k].e);
        b.onclick = (e) => { e.stopPropagation(); toggle(k); };
        wornBtn[k] = b; return b;
      }));
      for (const k of st.wardrobe) btns[k].classList.toggle("on", worn.includes(k));
    };
    function toggle(k: Cloth, put = false) {
      if (round.ended) return;
      const i = worn.indexOf(k);
      if (i >= 0 && !put) { worn.splice(i, 1); sfx.pop(); }
      else if (i < 0) { worn.push(k); sfx.click(); round.say(CLOTHES[k].name[ctx.lang]); }
      render();
    }
    for (const k of st.wardrobe) {
      const b = h("button", { class: "sa-cloth", "aria-label": CLOTHES[k].name[ctx.lang] }, CLOTHES[k].e);
      drag(b, {
        enabled: () => !round.ended,
        onMove: (pt) => sky.classList.toggle("k-zone-hot", inside(sky, pt)),
        onDrop: (pt) => { sky.classList.remove("k-zone-hot"); if (!inside(sky, pt)) return false; toggle(k, true); return true; },
        onTap: () => toggle(k),
      });
      wardrobe.appendChild(b); btns[k] = b;
    }
    ready.onclick = () => {
      if (round.ended) return;
      const r = checkOutfit(w, worn);
      if (r.ok) round.win(kid, outfitMessage(w, worn, ctx.lang), { praise: false, delay: 2400 });
      else round.miss(r.wrong.length ? wornBtn[r.wrong[0]] ?? ready : ready, outfitMessage(w, worn, ctx.lang));
    };
    round.setHintTarget(() => {
      const r = checkOutfit(w, worn);
      if (r.wrong.length) return wornBtn[r.wrong[0]] ?? null;
      if (r.missing.length) return { from: btns[r.missing[0]], to: sky };
      return ready;
    });
    round.timeout(ask, round.index === 0 ? 2400 : 300);
  },
};
