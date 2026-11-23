// Les nombres en toutes lettres, de 0 à 100, dans les 4 langues.
// Sert à la porte parent ("trente-sept plus vingt-quatre") et aux voix des jeux de nombres.
import type { Lang } from "./types";

const FR_U = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const FR_T = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante"];
function fr(n: number): string {
  if (n < 20) return FR_U[n];
  if (n === 100) return "cent";
  if (n < 70) {
    const t = Math.floor(n / 10), u = n % 10;
    return FR_T[t] + (u === 0 ? "" : u === 1 ? " et un" : "-" + FR_U[u]);
  }
  if (n < 80) return n === 71 ? "soixante et onze" : "soixante-" + FR_U[n - 60];
  if (n === 80) return "quatre-vingts";
  return "quatre-vingt-" + FR_U[n - 80];
}

const EN_U = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const EN_T = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function en(n: number): string {
  if (n < 20) return EN_U[n];
  if (n === 100) return "one hundred";
  const t = Math.floor(n / 10), u = n % 10;
  return EN_T[t] + (u ? "-" + EN_U[u] : "");
}

const DE_U = ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn", "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"];
const DE_T = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"];
function de(n: number): string {
  if (n < 20) return DE_U[n];
  if (n === 100) return "hundert";
  const t = Math.floor(n / 10), u = n % 10;
  if (!u) return DE_T[t];
  return (u === 1 ? "ein" : DE_U[u]) + "und" + DE_T[t];
}

const ES_U = ["cero", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const ES_T = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
function es(n: number): string {
  if (n < 30) return ES_U[n];
  if (n === 100) return "cien";
  const t = Math.floor(n / 10), u = n % 10;
  return ES_T[t] + (u ? " y " + ES_U[u] : "");
}

const FNS: Record<Lang, (n: number) => string> = { fr, en, de, es };

/** Le nombre n (0 à 100) écrit en toutes lettres dans la langue donnée. */
export function numberWords(n: number, lang: Lang): string {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new Error(`numberWords: ${n} hors de 0-100`);
  return FNS[lang](n);
}
