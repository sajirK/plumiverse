// Lire (4-7 ans, en français) : les 3 jeux de lecture de la V2 en un parcours.
//   chapitre 1 « La première lettre », chapitre 2 « Les lettres » (écrire un mot), chapitre 3 « Les syllabes magiques ».
// Les sons et les syllabes sont propres au français : le jeu n'apparaît que si l'interface est en français.
import { L, type LevelDef, type Track } from "../../core/types";
import { pick, shuffle, type Rng } from "../../core/util";
import type { GameDef } from "../types";
import { h } from "../../ui/dom";
import { sfx } from "../../audio/sfx";

// ------------------------------------------------------------------ la première lettre (V2)
export const FIRST_WORDS: [string, string][] = [
  ["🍍", "ananas"], ["🌳", "arbre"], ["✈️", "avion"], ["🎈", "ballon"], ["🍌", "banane"], ["⛵", "bateau"], ["🚌", "bus"], ["🕯️", "bougie"],
  ["🎁", "cadeau"], ["🦆", "canard"], ["🥕", "carotte"], ["🦀", "crabe"], ["🎲", "dé"], ["🦕", "dinosaure"], ["🐬", "dauphin"],
  ["🔥", "feu"], ["🌸", "fleur"], ["🍓", "fraise"], ["🚀", "fusée"], ["🎂", "gâteau"], ["🦍", "gorille"], ["🧃", "jus"], ["🥝", "kiwi"], ["🐨", "koala"],
  ["🐰", "lapin"], ["🦁", "lion"], ["🌙", "lune"], ["📖", "livre"], ["🐺", "loup"], ["🏠", "maison"], ["🏍️", "moto"], ["🐑", "mouton"], ["🔨", "marteau"],
  ["☁️", "nuage"], ["👃", "nez"], ["🫒", "olive"], ["🍊", "orange"], ["🐼", "panda"], ["🍕", "pizza"], ["🍎", "pomme"], ["🐟", "poisson"], ["🦋", "papillon"],
  ["🤖", "robot"], ["🦊", "renard"], ["🌹", "rose"], ["🦈", "requin"], ["☀️", "soleil"], ["🐭", "souris"], ["🐍", "serpent"],
  ["🐢", "tortue"], ["🐯", "tigre"], ["🚂", "train"], ["🥁", "tambour"], ["🏭", "usine"], ["🐄", "vache"], ["🚲", "vélo"], ["🌋", "volcan"], ["🧳", "valise"], ["🦓", "zèbre"],
];
const LOOK_ALIKE: Record<string, string[]> = { B: ["D", "P", "R"], D: ["B", "O", "P"], P: ["B", "R", "F"], R: ["P", "B", "K"], M: ["N", "W"], N: ["M", "H"], C: ["G", "O"], G: ["C", "O"], O: ["Q", "C", "D"], E: ["F", "L"], F: ["E", "P", "T"], T: ["F", "L", "I"], L: ["T", "I", "E"], V: ["U", "W", "Y"], U: ["V", "O"], K: ["R", "X"], S: ["Z", "C"], Z: ["S", "N"], A: ["H", "V"], J: ["I", "L"], I: ["J", "L", "T"] };
const ALPHABET = "ABCDEFGIJKLMNOPRSTUVZ".split("");
export const LETTER_NAMES: Record<string, string> = { A: "a", B: "bé", C: "cé", D: "dé", E: "e", F: "effe", G: "gé", H: "hache", I: "i", J: "ji", K: "ka", L: "elle", M: "emme", N: "enne", O: "o", P: "pé", Q: "ku", R: "erre", S: "esse", T: "té", U: "u", V: "vé", W: "double vé", X: "ixe", Y: "i grec", Z: "zède" };
export const firstLetter = (w: string) => w.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
export function firstQ(n: number, lookalike: boolean, rng: Rng = Math.random, avoid: string | null = null) {
  const [emoji, word] = pick(FIRST_WORDS.filter((w) => w[1] !== avoid), rng);
  const answer = firstLetter(word);
  const others = new Set<string>();
  if (lookalike) for (const l of shuffle(LOOK_ALIKE[answer] ?? [], rng)) if (others.size < 2 && l !== answer) others.add(l);
  for (const l of shuffle(ALPHABET.filter((x) => x !== answer && !(LOOK_ALIKE[answer] ?? []).includes(x)), rng)) { if (others.size >= n - 1) break; others.add(l); }
  return { emoji, word, answer, options: shuffle([answer, ...[...others].slice(0, n - 1)], rng) };
}

// ------------------------------------------------------------------ les lettres (V2)
export const SPELL_WORDS: [string, string, string][] = [
  ["CHAT", "🐱", "chat"], ["LION", "🦁", "lion"], ["LUNE", "🌙", "lune"], ["OURS", "🐻", "ours"], ["DINO", "🦖", "dino"], ["PAPA", "👨", "papa"], ["AUTO", "🚗", "auto"], ["BEBE", "👶", "bébé"], ["VELO", "🚲", "vélo"], ["MOTO", "🏍️", "moto"],
  ["MAMAN", "👩", "maman"], ["VACHE", "🐮", "vache"], ["ROBOT", "🤖", "robot"], ["POMME", "🍎", "pomme"], ["ARBRE", "🌳", "arbre"], ["LAPIN", "🐰", "lapin"], ["PANDA", "🐼", "panda"], ["TIGRE", "🐯", "tigre"], ["SAPIN", "🌲", "sapin"],
  ["SOLEIL", "☀️", "soleil"], ["BATEAU", "⛵", "bateau"], ["CANARD", "🦆", "canard"], ["FUSEE", "🚀", "fusée"], ["TORTUE", "🐢", "tortue"],
];
export const spellList = (minLen: number, maxLen: number, n: number, rng: Rng = Math.random) => shuffle(SPELL_WORDS.filter((w) => w[0].length >= minLen && w[0].length <= maxLen), rng).slice(0, n);
export const spellTiles = (word: string, extras: number, rng: Rng = Math.random) => shuffle([...word.split(""), ...shuffle("ABCDEFGILMNOPRSTU".split("").filter((l) => !word.includes(l)), rng).slice(0, extras)], rng);
export function nameWord(name: string) { const w = String(name || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, ""); return w.length >= 2 && w.length <= 7 ? w : null; }

// ------------------------------------------------------------------ les syllabes magiques (V2)
type Syl = [string, string];
export const SYL_WORDS: [string, string, Syl[]][] = [
  ["LAPIN", "🐰", [["LA", "la"], ["PIN", "pin"]]], ["MOTO", "🏍️", [["MO", "mo"], ["TO", "to"]]], ["VÉLO", "🚲", [["VÉ", "vé"], ["LO", "lo"]]], ["ROBOT", "🤖", [["RO", "ro"], ["BOT", "bo"]]],
  ["PANDA", "🐼", [["PAN", "pan"], ["DA", "da"]]], ["KIWI", "🥝", [["KI", "ki"], ["WI", "oui"]]], ["MAMAN", "👩", [["MA", "ma"], ["MAN", "man"]]], ["PAPA", "👨", [["PA", "pa"], ["PA", "pa"]]],
  ["BÉBÉ", "👶", [["BÉ", "bé"], ["BÉ", "bé"]]], ["CAFÉ", "☕", [["CA", "ca"], ["FÉ", "fé"]]], ["JUDO", "🥋", [["JU", "ju"], ["DO", "do"]]], ["SAPIN", "🌲", [["SA", "sa"], ["PIN", "pin"]]],
  ["DODO", "😴", [["DO", "do"], ["DO", "do"]]], ["TORTUE", "🐢", [["TOR", "tor"], ["TUE", "tu"]]], ["MOUTON", "🐑", [["MOU", "mou"], ["TON", "ton"]]], ["CADEAU", "🎁", [["CA", "ca"], ["DEAU", "do"]]],
  ["BATEAU", "⛵", [["BA", "ba"], ["TEAU", "to"]]], ["GÂTEAU", "🎂", [["GÂ", "gâ"], ["TEAU", "to"]]], ["CHAPEAU", "🎩", [["CHA", "cha"], ["PEAU", "po"]]], ["BANANE", "🍌", [["BA", "ba"], ["NANE", "nane"]]],
  ["TOMATE", "🍅", [["TO", "to"], ["MATE", "mate"]]], ["GIRAFE", "🦒", [["GI", "ji"], ["RAFE", "rafe"]]], ["PIRATE", "🏴‍☠️", [["PI", "pi"], ["RATE", "rate"]]], ["LIMACE", "🐌", [["LI", "li"], ["MACE", "mace"]]],
  ["LUTIN", "🧝", [["LU", "lu"], ["TIN", "tin"]]], ["CAROTTE", "🥕", [["CA", "ca"], ["ROTTE", "rotte"]]], ["SALADE", "🥗", [["SA", "sa"], ["LADE", "lade"]]], ["POMPIER", "🧑‍🚒", [["POM", "pom"], ["PIER", "pié"]]],
  ["PAPILLON", "🦋", [["PA", "pa"], ["PI", "pi"], ["LLON", "yon"]]], ["CHOCOLAT", "🍫", [["CHO", "cho"], ["CO", "co"], ["LAT", "la"]]], ["DINOSAURE", "🦕", [["DI", "di"], ["NO", "no"], ["SAURE", "sor"]]],
  ["ÉLÉPHANT", "🐘", [["É", "é"], ["LÉ", "lé"], ["PHANT", "fan"]]], ["CANAPÉ", "🛋️", [["CA", "ca"], ["NA", "na"], ["PÉ", "pé"]]], ["TÉLÉPHONE", "☎️", [["TÉ", "té"], ["LÉ", "lé"], ["PHONE", "fone"]]],
  ["ANANAS", "🍍", [["A", "a"], ["NA", "na"], ["NAS", "na"]]], ["KANGOUROU", "🦘", [["KAN", "kan"], ["GOU", "gou"], ["ROU", "rou"]]], ["CROCODILE", "🐊", [["CRO", "cro"], ["CO", "co"], ["DILE", "dile"]]],
  ["PARAPLUIE", "☂️", [["PA", "pa"], ["RA", "ra"], ["PLUIE", "plui"]]], ["ÉCUREUIL", "🐿️", [["É", "é"], ["CU", "cu"], ["REUIL", "reuil"]]], ["ORDINATEUR", "💻", [["OR", "or"], ["DI", "di"], ["NA", "na"], ["TEUR", "teur"]]],
  ["HÉLICOPTÈRE", "🚁", [["HÉ", "é"], ["LI", "li"], ["COP", "cop"], ["TÈRE", "tère"]]], ["LOCOMOTIVE", "🚂", [["LO", "lo"], ["CO", "co"], ["MO", "mo"], ["TIVE", "tive"]]],
];
const EXTRA: Syl[] = [["MI", "mi"], ["LU", "lu"], ["RA", "ra"], ["BO", "bo"], ["FA", "fa"], ["NI", "ni"], ["SO", "so"], ["TA", "ta"], ["VI", "vi"], ["PO", "po"], ["DU", "du"], ["LO", "lo"]];
export function sylQ(lv: 1 | 2 | 3, rng: Rng = Math.random, avoid: string | null = null) {
  const list = SYL_WORDS.filter((w) => (lv === 1 ? w[2].length === 2 : lv === 2 ? w[2].length <= 3 : w[2].length >= 3) && w[0] !== avoid);
  const [word, emoji, syl] = pick(list, rng);
  const own = new Set(syl.map((s) => s[0]));
  const extras = shuffle(EXTRA.filter((e) => !own.has(e[0])), rng).slice(0, lv === 1 ? 0 : lv === 2 ? 1 : 2);
  const tiles = shuffle([...syl.map((s, i) => ({ text: s[0], say: s[1], part: i })), ...extras.map((e) => ({ text: e[0], say: e[1], part: -1 }))], rng);
  return { word, emoji, syllables: syl.map((s) => ({ text: s[0], say: s[1] })), tiles };
}
export function readQ(rng: Rng = Math.random, avoid: string | null = null) {
  const [word, emoji, syl] = pick(SYL_WORDS.filter((w) => w[0] !== avoid), rng);
  const others = shuffle(SYL_WORDS.filter((w) => w[0] !== word && w[1] !== emoji), rng).slice(0, 2);
  return { word, emoji, syllables: syl.map((s) => ({ text: s[0], say: s[1] })), options: shuffle([{ emoji, word }, ...others.map((w) => ({ emoji: w[1], word: w[0] }))], rng) };
}
export const blend = (q: { word: string; syllables: { say: string }[] }) => q.syllables.map((s) => s.say).join("... ") + "... " + q.word.toLowerCase() + " !";
const COLORS = ["#ef476f", "#ff9f1c", "#06d6a0", "#118ab2", "#7b2cbf", "#f15bb5", "#00bbf9"];
const SYL_COLORS = ["#f76707", "#7048e8", "#1c7ed6", "#37b24d", "#e64980"];

const lv = (id: string, rounds: number, params: Record<string, unknown>, boss = false): LevelDef => ({ id, rounds, params, boss, skills: [params.mode as string] });
export const TRACK: Track = {
  chapters: [
    { id: "l1", tier: "facile", ages: [4, 5], title: L("La première lettre", "The first letter", "Der erste Buchstabe", "La primera letra"), levels: [lv("1-1", 6, { mode: "first", n: 2 }), lv("1-2", 7, { mode: "first", n: 3 }), lv("1-b", 8, { mode: "first", n: 4, lookalike: true }, true)] },
    { id: "l2", tier: "moyen", ages: [5, 6], title: L("Les lettres", "Letters", "Buchstaben", "Las letras"), levels: [lv("2-1", 4, { mode: "spell", min: 4, max: 4, extras: 0 }), lv("2-2", 5, { mode: "spell", min: 4, max: 5, extras: 1 }), lv("2-b", 6, { mode: "spell", min: 5, max: 6, extras: 2 }, true)] },
    { id: "l3", tier: "difficile", ages: [6, 7], title: L("Les syllabes magiques", "Magic syllables", "Zaubersilben", "Las sílabas mágicas"), levels: [lv("3-1", 5, { mode: "syl", lv: 1 }), lv("3-2", 6, { mode: "syl", lv: 2 }), lv("3-b", 7, { mode: "syl", lv: 3, read: true }, true)] },
  ],
};

export const lireGame: GameDef = {
  id: "lire",
  icon: "📖",
  category: "lire-ecrire",
  ages: [4, 7],
  title: L("Lire", "Reading (French)", "Lesen (Französisch)", "Leer (francés)"),
  desc: L("Apprendre à lire en français : la première lettre d'un mot, écrire un mot lettre par lettre, puis assembler et lire les syllabes.", "Learn to read in French: first letters, spelling words, then building and reading syllables.", "Französisch lesen lernen: Anfangsbuchstaben, Wörter buchstabieren, dann Silben bauen und lesen.", "Aprender a leer en francés: primeras letras, deletrear palabras y luego formar y leer sílabas."),
  skills: { first: L("Les sons et les lettres", "Sounds and letters", "Laute und Buchstaben", "Sonidos y letras"), spell: L("Écrire un mot", "Spelling a word", "Ein Wort schreiben", "Escribir una palabra"), syl: L("Lire les syllabes", "Reading syllables", "Silben lesen", "Leer sílabas") },
  available: (ctx) => ctx.lang === "fr",
  speech: (lang) => {
    if (lang !== "fr") return [];
    const out = ["On écrit ton prénom !", "Tu as écrit ton prénom !", "Lis le mot tout seul, puis touche la bonne image !", ...Object.values(LETTER_NAMES)];
    for (const [, w] of FIRST_WORDS) { out.push(w, `${w}. Par quelle lettre commence ${w} ?`, `${w} commence par la lettre ${LETTER_NAMES[firstLetter(w)]} !`); for (const l of ALPHABET) out.push(`Ça, c'est la lettre ${LETTER_NAMES[l]}. Écoute bien : ${w}.`); }
    for (const [W, , s] of SPELL_WORDS) { out.push(s, `On écrit ${s} !`, `Tu as écrit ${s} !`); for (const l of new Set(W)) for (const x of "ABCDEFGILMNOPRSTUVHC") out.push(`Ça, c'est ${LETTER_NAMES[x]}. Cherche le ${LETTER_NAMES[l]}.`); }
    for (const [W, , syl] of SYL_WORDS) {
      const w = W.toLowerCase(), q = { word: W, syllables: syl.map((s) => ({ say: s[1] })) };
      out.push(w, `${w}. Construis le mot ${w} !`, blend(q), `${w} ! Tu sais lire !`, `Ça, c'est ${w}. Relis bien les syllabes !`, ...syl.map((s) => s[1]));
      syl.forEach((s) => out.push(`Écoute : ${syl.map((x) => x[1]).join("... ")}. Il faut « ${s[1]} ».`));
    }
    out.push(...EXTRA.map((e) => e[1]));
    return out;
  },
  track: () => TRACK,
  instruction: (level) => ({
    first: "Écoute le mot. Par quelle lettre commence-t-il ?",
    spell: "Écris le mot : touche les lettres dans l'ordre !",
    syl: (level.params as { read?: boolean }).read ? "Assemble les syllabes, et lis les mots tout seul !" : "Écoute le mot, et assemble les syllabes dans l'ordre !",
  } as Record<string, string>)[level.params.mode as string],
  setup: (level, ctx) => {
    const p = level.params as { mode: string; min?: number; max?: number };
    if (p.mode !== "spell") return { last: null as string | null };
    const list = spellList(p.min!, p.max!, level.rounds);
    const nw = nameWord(ctx.profile?.name ?? "");
    if (nw && p.max! <= 5) list[0] = [nw, ctx.profile.avatar ?? "🙂", ""];
    return { list };
  },
  start(round, level, ctx) {
    const p = level.params as { mode: string; n?: number; lookalike?: boolean; extras?: number; lv?: 1 | 2 | 3; read?: boolean };
    const wrap = h("div", { class: "ca-wrap li-wrap" });
    round.stage.appendChild(wrap);
    const prompt = (visual: string, onTap: () => void) => { const b = h("button", { class: "li-prompt", "aria-label": "🔊" }, visual); b.onclick = onTap; wrap.appendChild(b); return b; };
    const choices = <T,>(items: T[], render: (t: T, b: HTMLElement) => void, onPick: (t: T, b: HTMLElement) => void, cls = "") => {
      const row = h("div", { class: "k-choices" });
      const btns = items.map((t) => { const b = h("button", { class: "k-choice " + cls }); render(t, b); b.onclick = () => { if (!round.ended && !b.classList.contains("used")) onPick(t, b); }; row.appendChild(b); return b; });
      wrap.appendChild(row);
      return btns;
    };
    if (p.mode === "first") {
      const sess = round.session as { last: string | null };
      const q = firstQ(round.assist ? 2 : p.n!, !!p.lookalike, Math.random, sess.last);
      sess.last = q.word;
      prompt(q.emoji, () => round.say(q.word));
      const first = h("span", { class: "li-first" }, "_");
      wrap.appendChild(h("div", { class: "li-word" }, first, q.word.toUpperCase().slice(1)));
      const btns = choices(q.options, (l, b) => { b.textContent = l; b.classList.add("li-letter"); }, (l, b) => {
        if (l === q.answer) { first.textContent = q.word.charAt(0).toUpperCase(); first.classList.add("found"); round.win(b, `${q.word} commence par la lettre ${LETTER_NAMES[q.answer]} !`, { delay: 2600 }); }
        else round.miss(b, `Ça, c'est la lettre ${LETTER_NAMES[l]}. Écoute bien : ${q.word}.`);
      });
      round.setHintTarget(() => btns[q.options.indexOf(q.answer)]);
      round.timeout(() => round.say(`${q.word}. Par quelle lettre commence ${q.word} ?`), round.index === 0 ? 2800 : 350);
      return;
    }
    if (p.mode === "spell") {
      const [word, emoji, spoken] = (round.session as { list: [string, string, string][] }).list[round.index];
      const isName = !spoken;
      prompt(emoji, () => round.say(isName ? "On écrit ton prénom !" : spoken));
      const slots = h("div", { class: "li-slots" }, ...word.split("").map((l, i) => h("div", { class: "li-slot" + (i === 0 ? " next" : "") }, l)));
      wrap.appendChild(slots);
      const tiles = spellTiles(word, p.extras!);
      let pos = 0;
      const btns = choices(tiles, (l, b) => { b.textContent = l; b.classList.add("li-tile"); b.style.background = COLORS[tiles.indexOf(l) % COLORS.length]; }, (l, b) => {
        if (l === word[pos]) {
          const s = slots.children[pos]; s.classList.remove("next"); s.classList.add("done");
          b.classList.add("used"); sfx.step(pos); round.say(LETTER_NAMES[l]);
          pos++;
          if (pos < word.length) slots.children[pos].classList.add("next");
          else round.win(null, isName ? "Tu as écrit ton prénom !" : `Tu as écrit ${spoken} !`, { delay: 2600 });
        } else round.miss(b, `Ça, c'est ${LETTER_NAMES[l]}. Cherche le ${LETTER_NAMES[word[pos]]}.`);
      });
      round.setHintTarget(() => btns.find((b, i) => !b.classList.contains("used") && tiles[i] === word[pos]) ?? null);
      round.timeout(() => round.say(isName ? "On écrit ton prénom !" : `On écrit ${spoken} !`), round.index === 0 ? 2400 : 350);
      return;
    }
    // syllabes : construire le mot, ou (au défi) lire le mot seul
    const sess = round.session as { last: string | null };
    if (p.read && round.index % 2 === 1) {
      const q = readQ(Math.random, sess.last);
      sess.last = q.word;
      const rw = h("div", { class: "li-read" }, ...q.syllables.map((s, i) => { const sp = h("span", { style: { color: SYL_COLORS[i % SYL_COLORS.length] } }, s.text); sp.onclick = () => round.say(s.say); return sp; }));
      wrap.appendChild(rw);
      const btns = choices(q.options, (o, b) => { b.textContent = o.emoji; b.classList.add("li-pic"); }, (o, b) => {
        if (o.word === q.word) round.win(b, `${q.word.toLowerCase()} ! Tu sais lire !`, { delay: 2600 });
        else round.miss(b, `Ça, c'est ${o.word.toLowerCase()}. Relis bien les syllabes !`);
      });
      round.setHintTarget(() => btns[q.options.findIndex((o) => o.word === q.word)]);
      round.timeout(() => round.say("Lis le mot tout seul, puis touche la bonne image !"), 350);
      return;
    }
    const q = sylQ(p.lv!, Math.random, sess.last);
    sess.last = q.word;
    const pic = prompt(q.emoji, () => round.say(q.word.toLowerCase()));
    const slots = h("div", { class: "li-slots" }, ...q.syllables.map((_, i) => h("div", { class: "li-slot syl" + (i === 0 ? " next" : "") })));
    wrap.appendChild(slots);
    let placed = 0;
    const btns = choices(q.tiles, (t, b) => { b.textContent = t.text; b.classList.add("li-tile"); b.style.background = SYL_COLORS[q.tiles.indexOf(t) % SYL_COLORS.length]; }, (t, b) => {
      round.say(t.say);
      if (t.text === q.syllables[placed].text) {
        const slot = slots.children[placed] as HTMLElement;
        slot.textContent = t.text; slot.style.background = b.style.background; slot.classList.remove("next"); slot.classList.add("full");
        b.classList.add("used"); sfx.step(placed);
        placed++;
        if (placed < q.syllables.length) slots.children[placed].classList.add("next");
        else { pic.classList.add("magic"); round.win(null, blend(q), { praise: false, delay: 3600 }); }
      } else round.miss(b, `Écoute : ${q.syllables.map((s) => s.say).join("... ")}. Il faut « ${q.syllables[placed].say} ».`);
    });
    round.setHintTarget(() => (placed >= q.syllables.length ? null : btns.find((b, i) => !b.classList.contains("used") && q.tiles[i].text === q.syllables[placed].text) ?? null));
    round.timeout(() => round.say(`${q.word.toLowerCase()}. Construis le mot ${q.word.toLowerCase()} !`), round.index === 0 ? 2800 : 350);
  },
};
