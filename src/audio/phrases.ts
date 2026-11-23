// Toutes les phrases que Plumiverse peut dire, par langue (pour générer les voix à l'avance).
// Utilisé par scripts/build-audio.ts et par le robot de test (qui vérifie que chaque phrase dite est dans la liste).
import type { Lang } from "../core/types";
import { DICTS, leafKeys } from "../core/i18n";
import { WORDS, SENTENCES } from "../content/lang/course";
import { numberWords } from "../core/numwords";
import { GAMES } from "../games";
import { colorQuestion, countQuestion } from "../games/couleurs/game";
import { WORDS as WRITE_WORDS } from "../games/ecrire/game";
import { spoken } from "../games/calcul/logic";
import { TROPHIES } from "../core/trophies";

export /** Toutes les phrases qu'une langue peut dire. */
function phrases(lang: Lang): Set<string> {
  const out = new Set<string>();
  const add = (s?: string) => { if (s && s.trim()) out.add(s.trim().replace(/\s+/g, " ")); };
  // interface (tout ce qui est dit : consignes, encouragements, fin de niveau, temps…)
  const get = (path: string) => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], DICTS[lang]);
  for (const k of leafKeys(DICTS[lang])) {
    const v = get(k.replace(/\[\]$/, ""));
    if (Array.isArray(v)) v.forEach((x) => add(String(x)));
    else if (typeof v === "string" && !v.includes("{")) add(v);
  }
  for (let n = 0; n <= 100; n++) add(numberWords(n, lang));
  // mots et phrases des cours (dits par la voix de LEUR langue)
  for (const w of WORDS) add(w.t[lang].show);
  for (const s of SENTENCES) add(s.t[lang]);
  // jeux : consignes de niveau, titres, questions
  for (const g of GAMES) {
    add(g.title[lang]);
    for (const x of g.speech?.(lang) ?? []) add(x);
    const trk = g.track({ profile: { learning: ["fr", "en", "de", "es"] } as never, age: 8, band: "6-8", lang });
    for (const c of trk.chapters) for (const l of c.levels) for (const band of ["3-5", "6-8", "9-11", "12-14"] as const) add(g.instruction(l, { profile: {} as never, age: 8, band, lang }));
  }
  for (const w of WORDS.filter((x) => x.unit === "couleurs")) add(colorQuestion(w.t[lang].show, lang));
  for (let n = 1; n <= 10; n++) add(countQuestion(n, lang));
  for (const [, , w] of [...WRITE_WORDS[lang].short, ...WRITE_WORDS[lang].long]) add(w);
  for (const x of TROPHIES) { add(x.title[lang]); add(`${x.title[lang]}. ${x.hint[lang]}`); }
  // questions de calcul dites à voix haute (petits nombres et tables)
  const q = (a: number, op: "+" | "-" | "×" | "÷", b: number) => add(spoken({ text: "", answer: 0, speak: { a, op, b } }, lang) ?? "");
  for (let a = 0; a <= 20; a++) for (let b = 0; b <= 20; b++) { if (a + b <= 20) q(a, "+", b); if (b <= a) q(a, "-", b); }
  for (let a = 1; a <= 10; a++) for (let b = 1; b <= 10; b++) { q(a, "×", b); if (a >= 2) q(a * b, "÷", a); }
  return out;
}
