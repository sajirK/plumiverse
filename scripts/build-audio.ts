// Génère les voix de Plume (Azure Neural) : un fichier MP3 par phrase et par langue, dans public/audio/<langue>/.
//
//   AZURE_SPEECH_KEY=xxxx AZURE_SPEECH_REGION=westeurope npm run audio
//   npm run audio -- --dry      (compte seulement ce qui manque, sans rien appeler)
//
// Les phrases viennent du code et des contenus (interface, consignes, cours de langue, jeux).
// Les fichiers déjà générés ne sont jamais refaits (le nom = empreinte voix + réglages + texte).
// Offre gratuite Azure F0 : 0,5 million de caractères par mois. Le script s'arrête avant de dépasser MAX_CHARS.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { LANGS, type Lang } from "../src/core/types";
import { VOICES, audioId } from "../src/audio/voices";
import { phrases } from "../src/audio/phrases";

const DRY = process.argv.includes("--dry");
const KEY = process.env.AZURE_SPEECH_KEY;
const REGION = process.env.AZURE_SPEECH_REGION ?? "westeurope";
const MAX_CHARS = Number(process.env.MAX_CHARS ?? 450000);

function ssml(lang: Lang, text: string) {
  const v = VOICES[lang];
  const esc = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<speak version="1.0" xml:lang="${v.locale}"><voice name="${v.azure}"><prosody rate="${v.rate}" pitch="${v.pitch}">${esc}</prosody></voice></speak>`;
}

async function synth(lang: Lang, text: string): Promise<Buffer> {
  const r = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: { "Ocp-Apim-Subscription-Key": KEY!, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3", "User-Agent": "plumiverse-build" },
    body: ssml(lang, text),
  });
  if (!r.ok) throw new Error(`Azure ${r.status} : ${await r.text()}`);
  return Buffer.from(await r.arrayBuffer());
}

let used = 0;
for (const lang of LANGS) {
  const dir = `public/audio/${lang}`;
  mkdirSync(dir, { recursive: true });
  const have = new Set(readdirSync(dir).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));
  const all = [...phrases(lang)];
  const missing = all.filter((p) => !have.has(audioId(lang, p)));
  const chars = missing.reduce((n, p) => n + p.length, 0);
  console.log(`${lang} : ${all.length} phrases, ${missing.length} à générer (${chars} caractères)`);
  if (!DRY && missing.length) {
    if (!KEY) { console.log("  → AZURE_SPEECH_KEY absente : rien n'est généré (la voix du navigateur prend le relais)."); }
    else for (const p of missing) {
      if (used + p.length > MAX_CHARS) { console.log(`  → limite de ${MAX_CHARS} caractères atteinte : on s'arrête (relancer le mois prochain).`); break; }
      writeFileSync(`${dir}/${audioId(lang, p)}.mp3`, await synth(lang, p));
      used += p.length;
      have.add(audioId(lang, p));
    }
  }
  // le manifeste liste les fichiers présents (lu par l'application)
  const present = all.map((p) => audioId(lang, p)).filter((id) => existsSync(`${dir}/${id}.mp3`));
  writeFileSync(`${dir}/manifest.json`, JSON.stringify(present));
}
if (used) console.log(`✓ ${used} caractères envoyés à Azure`);
