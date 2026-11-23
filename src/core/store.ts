// Sauvegarde sur l'appareil (IndexedDB). Rien n'est envoyé ailleurs.
// Une base « plumiverse » avec deux tables : profils, et réglages de l'appareil (profil courant, statistiques…).
// Sans IndexedDB (tests, navigation privée très stricte), on garde tout en mémoire.
import type { Profile } from "./types";
import { normalizeProfile } from "./profile";

const DB = "plumiverse";
const VERSION = 1;

export interface DeviceMeta {
  currentProfile?: string;
  statsConsent?: boolean;
  v2Offered?: boolean;
}

export interface Store {
  profiles(): Promise<Profile[]>;
  save(p: Profile): Promise<void>;
  remove(id: string): Promise<void>;
  meta(): Promise<DeviceMeta>;
  setMeta(m: Partial<DeviceMeta>): Promise<void>;
}

export function memoryStore(): Store {
  const profiles = new Map<string, Profile>();
  let meta: DeviceMeta = {};
  return {
    async profiles() { return [...profiles.values()].map((p) => structuredClone(p)); },
    async save(p) { profiles.set(p.id, structuredClone(p)); },
    async remove(id) { profiles.delete(id); },
    async meta() { return { ...meta }; },
    async setMeta(m) { meta = { ...meta, ...m }; },
  };
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((ok, ko) => { r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
}

export async function openStore(): Promise<Store> {
  if (typeof indexedDB === "undefined") return memoryStore();
  let db: IDBDatabase;
  try {
    db = await new Promise<IDBDatabase>((ok, ko) => {
      const r = indexedDB.open(DB, VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("profiles")) d.createObjectStore("profiles", { keyPath: "id" });
        if (!d.objectStoreNames.contains("meta")) d.createObjectStore("meta");
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  } catch {
    return memoryStore();
  }
  const tx = (name: string, mode: IDBTransactionMode) => db.transaction(name, mode).objectStore(name);
  return {
    async profiles() { return ((await req(tx("profiles", "readonly").getAll())) as Profile[]).map(normalizeProfile); },
    async save(p) { await req(tx("profiles", "readwrite").put(structuredClone(p))); },
    async remove(id) { await req(tx("profiles", "readwrite").delete(id)); },
    async meta() { return ((await req(tx("meta", "readonly").get("device"))) as DeviceMeta) ?? {}; },
    async setMeta(m) {
      const cur = ((await req(tx("meta", "readonly").get("device"))) as DeviceMeta) ?? {};
      await req(tx("meta", "readwrite").put({ ...cur, ...m }, "device"));
    },
  };
}

/** Sauvegarde de toute la famille dans un fichier (changer d'appareil). */
export function exportFamily(profiles: Profile[]): string {
  return JSON.stringify({ app: "plumiverse", schema: 1, exported: new Date().toISOString(), profiles }, null, 1);
}

export function importFamily(json: string): Profile[] {
  const data = JSON.parse(json);
  if (data?.app !== "plumiverse" || !Array.isArray(data.profiles)) throw new Error("fichier non reconnu");
  return data.profiles.map(normalizeProfile);
}
