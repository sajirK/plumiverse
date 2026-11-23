// Le tour du monde des animaux (4-10 ans) : chaque animal vient d'un seul continent, on le pose sur la carte.
// On ne garde que des animaux qui ne vivent naturellement que sur un continent (pas de lion : il y en a en Inde).
import { L, type Lang, type LevelDef, type Track, type Tr } from "../../core/types";
import { shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";

export type Cont = "amnord" | "amsud" | "europe" | "afrique" | "asie" | "oceanie" | "antarctique";
/** name = « l'Afrique », from = « vient d'Afrique ». */
export const CONTINENTS: Record<Cont, { name: Tr; from: Tr; label: Tr; color: string }> = {
  amnord: { name: L("l'Amérique du Nord", "North America", "Nordamerika", "América del Norte"), from: L("d'Amérique du Nord", "from North America", "aus Nordamerika", "de América del Norte"), label: L("Amérique du Nord", "North America", "Nordamerika", "América del Norte"), color: "#ffd8a8" },
  amsud: { name: L("l'Amérique du Sud", "South America", "Südamerika", "América del Sur"), from: L("d'Amérique du Sud", "from South America", "aus Südamerika", "de América del Sur"), label: L("Amérique du Sud", "South America", "Südamerika", "América del Sur"), color: "#b2f2bb" },
  europe: { name: L("l'Europe", "Europe", "Europa", "Europa"), from: L("d'Europe", "from Europe", "aus Europa", "de Europa"), label: L("Europe", "Europe", "Europa", "Europa"), color: "#a5d8ff" },
  afrique: { name: L("l'Afrique", "Africa", "Afrika", "África"), from: L("d'Afrique", "from Africa", "aus Afrika", "de África"), label: L("Afrique", "Africa", "Afrika", "África"), color: "#ffe066" },
  asie: { name: L("l'Asie", "Asia", "Asien", "Asia"), from: L("d'Asie", "from Asia", "aus Asien", "de Asia"), label: L("Asie", "Asia", "Asien", "Asia"), color: "#ffc9c9" },
  oceanie: { name: L("l'Océanie", "Oceania", "Ozeanien", "Oceanía"), from: L("d'Océanie", "from Oceania", "aus Ozeanien", "de Oceanía"), label: L("Océanie", "Oceania", "Ozeanien", "Oceanía"), color: "#d0bfff" },
  antarctique: { name: L("l'Antarctique", "Antarctica", "die Antarktis", "la Antártida"), from: L("de l'Antarctique", "from Antarctica", "aus der Antarktis", "de la Antártida"), label: L("Antarctique", "Antarctica", "Antarktis", "Antártida"), color: "#e9ecef" },
};

export interface Animal { e: string; c: Cont; name: Tr; fact: Tr }
const A = (e: string, c: Cont, name: Tr, fact: Tr): Animal => ({ e, c, name, fact });
export const ANIMALS: Animal[] = [
  A("🦘", "oceanie", L("le kangourou", "the kangaroo", "das Känguru", "el canguro"), L("Le bébé kangourou grandit dans la poche de sa maman.", "The baby kangaroo grows up in its mum's pouch.", "Das Känguru-Baby wächst im Beutel seiner Mama auf.", "El bebé canguro crece en la bolsa de su mamá.")),
  A("🐨", "oceanie", L("le koala", "the koala", "der Koala", "el koala"), L("Il dort presque toute la journée et mange des feuilles d'eucalyptus.", "It sleeps almost all day and eats eucalyptus leaves.", "Er schläft fast den ganzen Tag und frisst Eukalyptusblätter.", "Duerme casi todo el día y come hojas de eucalipto.")),
  A("🦒", "afrique", L("la girafe", "the giraffe", "die Giraffe", "la jirafa"), L("C'est l'animal le plus grand du monde.", "It is the tallest animal in the world.", "Sie ist das größte Tier der Welt.", "Es el animal más alto del mundo.")),
  A("🦓", "afrique", L("le zèbre", "the zebra", "das Zebra", "la cebra"), L("Chaque zèbre a des rayures différentes.", "Every zebra has different stripes.", "Jedes Zebra hat andere Streifen.", "Cada cebra tiene rayas diferentes.")),
  A("🦛", "afrique", L("l'hippopotame", "the hippo", "das Nilpferd", "el hipopótamo"), L("Il passe la journée dans l'eau pour rester au frais.", "It spends the day in the water to keep cool.", "Es verbringt den Tag im Wasser, um kühl zu bleiben.", "Pasa el día en el agua para estar fresco.")),
  A("🦍", "afrique", L("le gorille", "the gorilla", "der Gorilla", "el gorila"), L("C'est le plus grand de tous les singes.", "It is the biggest of all apes.", "Er ist der größte aller Affen.", "Es el más grande de todos los simios.")),
  A("🐼", "asie", L("le panda", "the panda", "der Panda", "el panda"), L("Il mange surtout du bambou.", "It mostly eats bamboo.", "Er frisst vor allem Bambus.", "Come sobre todo bambú.")),
  A("🐯", "asie", L("le tigre", "the tiger", "der Tiger", "el tigre"), L("C'est le plus grand des félins, la famille des chats.", "It is the biggest of the big cats.", "Er ist die größte Katze der Welt.", "Es el más grande de los felinos, la familia de los gatos.")),
  A("🦧", "asie", L("l'orang-outan", "the orangutan", "der Orang-Utan", "el orangután"), L("Il vit dans les arbres, dans les forêts de Bornéo et de Sumatra.", "It lives in the trees, in the forests of Borneo and Sumatra.", "Er lebt auf Bäumen, in den Wäldern von Borneo und Sumatra.", "Vive en los árboles, en las selvas de Borneo y Sumatra.")),
  A("🦙", "amsud", L("le lama", "the llama", "das Lama", "la llama"), L("Il vit dans les montagnes des Andes.", "It lives in the Andes mountains.", "Es lebt in den Bergen der Anden.", "Vive en las montañas de los Andes.")),
  A("🦝", "amnord", L("le raton laveur", "the raccoon", "der Waschbär", "el mapache"), L("Il a comme un masque noir autour des yeux.", "It looks like it wears a black mask around its eyes.", "Er hat eine Art schwarze Maske um die Augen.", "Tiene como un antifaz negro alrededor de los ojos.")),
  A("🐧", "antarctique", L("le manchot empereur", "the emperor penguin", "der Kaiserpinguin", "el pingüino emperador"), L("C'est le papa qui garde l'œuf au chaud sur ses pattes.", "The dad keeps the egg warm on his feet.", "Der Papa hält das Ei auf seinen Füßen warm.", "Es el papá quien mantiene el huevo caliente sobre sus patas.")),
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const askText = (a: Animal, lang: Lang) => ({ fr: `D'où vient ${a.name.fr} ?`, en: `Where does ${a.name.en} come from?`, de: `Woher kommt ${a.name.de}?`, es: `¿De dónde viene ${a.name.es}?` })[lang];
export const rightText = (a: Animal, lang: Lang) => {
  const n = cap(a.name[lang]), f = CONTINENTS[a.c].from[lang];
  return ({ fr: `Oui ! ${n} vient ${f} ! `, en: `Yes! ${n} comes ${f}! `, de: `Ja! ${n} kommt ${f}! `, es: `¡Sí! ${n} viene ${f}. ` })[lang] + a.fact[lang];
};
export const wrongText = (a: Animal, picked: Cont, lang: Lang) => {
  const c = CONTINENTS[picked].name[lang];
  return ({ fr: `Non, ici c'est ${c}. Cherche encore où vit ${a.name.fr} !`, en: `No, this is ${c}. Look again for where ${a.name.en} lives!`, de: `Nein, das ist ${c}. Wo lebt ${a.name.de}? Such weiter!`, es: `No, aquí es ${c}. ¡Busca otra vez dónde vive ${a.name.es}!` })[lang];
};

/** Les animaux d'une partie : seulement ceux dont le continent est sur la carte, sans doublon. */
export function deck(continents: Cont[], n: number, rng: Rng = Math.random): Animal[] {
  return shuffle(ANIMALS.filter((a) => continents.includes(a.c)), rng).slice(0, n);
}

const FOUR: Cont[] = ["afrique", "asie", "oceanie", "antarctique"];
const ALL = Object.keys(CONTINENTS) as Cont[];
const lv = (id: string, rounds: number, continents: Cont[], labels: boolean, boss = false): LevelDef => ({ id, rounds, params: { continents, labels }, boss, skills: ["continents"] });

export const TRACK: Track = {
  chapters: [
    { id: "w1", tier: "facile", ages: [4, 5], title: L("Quatre continents", "Four continents", "Vier Kontinente", "Cuatro continentes"), levels: [lv("1-1", 4, FOUR, true), lv("1-2", 6, FOUR, true), lv("1-b", 7, FOUR, true, true)] },
    { id: "w2", tier: "moyen", ages: [6, 7], title: L("Tous les continents", "All the continents", "Alle Kontinente", "Todos los continentes"), levels: [lv("2-1", 6, ALL, true), lv("2-2", 9, ALL, true), lv("2-b", 10, ALL, true, true)] },
    { id: "w3", tier: "difficile", ages: [8, 10], title: L("Carte sans noms", "Map without names", "Karte ohne Namen", "Mapa sin nombres"), levels: [lv("3-1", 8, ALL, false), lv("3-b", 12, ALL, false, true)] },
  ],
};

const SHAPES: Record<Cont, string> = {
  amnord: "M70,80 Q120,40 230,45 L340,60 Q360,90 330,120 L300,170 Q280,210 250,250 L235,265 Q205,250 190,225 L150,190 Q100,160 85,130 Z",
  amsud: "M240,275 Q290,265 320,285 L350,320 Q345,360 320,390 L290,440 Q275,470 262,455 L250,400 Q235,350 232,310 Z",
  europe: "M440,70 Q490,45 560,55 L565,95 Q560,130 530,140 L490,150 Q455,145 445,120 Z",
  afrique: "M455,170 Q520,155 580,170 L610,220 Q615,270 580,320 L545,385 Q525,410 510,390 L495,330 Q470,290 455,250 Q440,210 455,170 Z",
  asie: "M575,55 Q700,30 860,45 L915,80 Q930,130 900,170 L850,215 Q800,240 760,235 L700,215 Q650,200 620,175 L580,140 Q570,100 575,55 Z",
  oceanie: "M775,325 Q820,300 880,315 L905,355 Q895,395 850,405 L800,395 Q770,375 775,325 Z",
  antarctique: "M140,478 Q500,455 860,478 L870,505 Q500,515 130,505 Z",
};
const SPOTS: Record<Cont, { label: [number, number]; places: [number, number][] }> = {
  amnord: { label: [200, 105], places: [[170, 165], [250, 160], [215, 210]] },
  amsud: { label: [292, 330], places: [[285, 380], [300, 300], [270, 420]] },
  europe: { label: [505, 75], places: [[530, 115], [505, 135], [550, 85]] },
  afrique: { label: [530, 200], places: [[490, 245], [555, 245], [520, 300], [580, 205], [525, 350]] },
  asie: { label: [740, 85], places: [[660, 150], [740, 160], [820, 140], [790, 200], [700, 200]] },
  oceanie: { label: [840, 345], places: [[805, 375], [865, 375]] },
  antarctique: { label: [500, 496], places: [[330, 490], [680, 490]] },
};
const NS = "http://www.w3.org/2000/svg";

interface Sess { deck: Animal[]; placed: { e: string; x: number; y: number }[]; used: Partial<Record<Cont, number>> }

export const mondeGame: GameDef = {
  id: "monde",
  icon: "🌍",
  category: "histoire-geo",
  ages: [4, 10],
  title: L("Le tour du monde", "Around the world", "Rund um die Welt", "La vuelta al mundo"),
  desc: L("Chaque animal vient d'un continent : le poser sur la carte du monde pour découvrir les continents.", "Each animal comes from one continent: place it on the world map to learn the continents.", "Jedes Tier kommt von einem Kontinent: Setze es auf die Weltkarte und lerne die Kontinente kennen.", "Cada animal viene de un continente: colócalo en el mapa del mundo para aprender los continentes."),
  skills: { continents: L("Les continents", "The continents", "Die Kontinente", "Los continentes") },
  speech: (lang) => ANIMALS.flatMap((a) => [askText(a, lang), rightText(a, lang), ...ALL.filter((c) => c !== a.c).map((c) => wrongText(a, c, lang))]),
  track: () => TRACK,
  instruction: (_l, ctx) => L("Chaque animal vient d'un continent. Touche sur la carte l'endroit où il vit !", "Each animal comes from a continent. Tap the place on the map where it lives!", "Jedes Tier kommt von einem Kontinent. Tippe auf der Karte an, wo es lebt!", "Cada animal viene de un continente. ¡Toca en el mapa el lugar donde vive!")[ctx.lang],
  setup: (level): Sess => { const p = level.params as { continents: Cont[] }; return { deck: deck(p.continents, level.rounds), placed: [], used: {} }; },
  start(round, level, ctx) {
    const p = level.params as { continents: Cont[]; labels: boolean };
    const s = round.session as Sess;
    const a = s.deck[round.index % s.deck.length];
    const ask = () => round.say(askText(a, ctx.lang));
    const card = h("button", { class: "mo-card", "aria-label": "🔊" }, a.e);
    card.onclick = ask;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 1000 520"); svg.setAttribute("class", "mo-map");
    svg.innerHTML = `<rect x="0" y="0" width="1000" height="520" rx="30" fill="#74c0fc" />`;
    const lands = {} as Record<Cont, SVGPathElement>;
    let done = false;
    for (const id of ALL) {
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", SHAPES[id]);
      const on = p.continents.includes(id);
      path.setAttribute("class", "mo-land" + (on ? "" : " off"));
      path.style.fill = CONTINENTS[id].color;
      if (on) path.addEventListener("click", () => choose(id));
      svg.appendChild(path); lands[id] = path;
    }
    const deco = document.createElementNS(NS, "g"); deco.setAttribute("class", "mo-deco");
    if (p.labels) for (const id of p.continents) deco.innerHTML += `<text class="mo-lbl" x="${SPOTS[id].label[0]}" y="${SPOTS[id].label[1]}">${CONTINENTS[id].label[ctx.lang]}</text>`;
    for (const pl of s.placed) deco.innerHTML += `<text class="mo-placed" style="animation:none" x="${pl.x}" y="${pl.y}">${pl.e}</text>`;
    svg.appendChild(deco);
    round.stage.appendChild(h("div", { class: "ca-wrap" }, card, h("div", { class: "mo-wrap" }, svg)));
    function choose(c: Cont) {
      if (done || round.ended) return;
      if (c !== a.c) { round.miss(lands[c], wrongText(a, c, ctx.lang)); return; }
      done = true;
      const n = s.used[c] ?? 0; s.used[c] = n + 1;
      const [x, y] = SPOTS[c].places[n % SPOTS[c].places.length];
      s.placed.push({ e: a.e, x, y });
      deco.innerHTML += `<text class="mo-placed" x="${x}" y="${y}">${a.e}</text>`;
      card.style.visibility = "hidden";
      round.win(lands[c], rightText(a, ctx.lang), { praise: false, delay: 4800 });
    }
    round.setHintTarget(() => (done ? null : lands[a.c]));
    round.timeout(ask, round.index === 0 ? 2600 : 400);
  },
};
