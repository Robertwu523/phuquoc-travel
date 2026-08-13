/**
 * Cloud sync engine.
 *
 * localStorage stays the offline source of truth; this module mirrors it to
 * the Supabase `user_data` table (per-user, RLS-isolated) so data follows the
 * logged-in user across devices.
 *
 * Flow:
 *   - on login: pullAndMerge()  — fetch cloud rows, smart-merge into local
 *   - on any local change: markDirty(key) — debounced pushKey() upsert
 *   - isPulling guard prevents the pull-write from re-triggering a push
 */

import { supabase } from "@/lib/supabase/client";

/** Every localStorage key that participates in cloud sync. */
export const SYNC_KEYS = [
  "phu-quoc-trip-v2",
  "phuquoc-manual-flights",
  "phuquoc-expenses-v1",
  "phuquoc-budget-v1",
  "phuquoc-doc-checklist-v3",
  "phuquoc-wx-loc",
] as const;

const META_KEY = "phuquoc-sync-meta";
const DEBOUNCE_MS = 1000;

type Meta = Record<string, number>; // key -> localUpdatedAt (ms)

// --- guards ---
let isPulling = false;
let unsubscribe: (() => void) | null = null;
const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();

function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: Meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function localHas(key: string): boolean {
  return localStorage.getItem(key) !== null;
}

function readLocal(key: string): unknown | null {
  const raw = localStorage.getItem(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function writeLocal(key: string, payload: unknown) {
  // raw write, bypassing markDirty (used by pull, guarded by isPulling)
  const value = typeof payload === "string" ? payload : JSON.stringify(payload);
  localStorage.setItem(key, value);
}

/** Stamp a key as just-modified locally and schedule a debounced push. */
export function markDirty(key: string) {
  if (isPulling) return; // this write came from pulling cloud → don't echo back
  if (!SYNC_KEYS.includes(key as (typeof SYNC_KEYS)[number])) return;

  const meta = readMeta();
  meta[key] = Date.now();
  writeMeta(meta);

  const existing = pushTimers.get(key);
  if (existing) clearTimeout(existing);
  pushTimers.set(
    key,
    setTimeout(() => {
      pushTimers.delete(key);
      void pushKey(key);
    }, DEBOUNCE_MS)
  );
}

/** Upsert a single key's local value to the cloud. */
export async function pushKey(key: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return; // not logged in — local-only, fine

  if (!localHas(key)) return; // nothing local to push

  const payload = readLocal(key);
  const { error } = await supabase.from("user_data").upsert(
    {
      user_id: auth.user.id,
      data_key: key,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,data_key" }
  );
  if (error) console.warn("[sync] pushKey failed:", key, error.message);
}

/** Push every synced key (used by manual "sync now"). */
export async function pushAll() {
  await Promise.all(SYNC_KEYS.map((k) => pushKey(k)));
}

/**
 * Smart-merge cloud data into local on login / reconnect.
 * Per key:
 *   - local present, cloud absent  → push local up
 *   - cloud present, local absent  → write cloud down
 *   - both present → newer wins (cloud.updated_at vs local meta timestamp)
 *     first login (no meta) → treat local as newer, never clobber existing data
 */
export async function pullAndMerge() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  isPulling = true;
  try {
    const { data: rows, error } = await supabase
      .from("user_data")
      .select("data_key, payload, updated_at")
      .eq("user_id", auth.user.id);
    if (error) {
      console.warn("[sync] pull failed:", error.message);
      return;
    }

    const cloudByKey = new Map(
      (rows ?? []).map((r) => [r.data_key as string, r] as const)
    );
    const meta = readMeta();
    const toPush: string[] = [];

    for (const key of SYNC_KEYS) {
      const cloud = cloudByKey.get(key);
      const hasLocal = localHas(key);

      if (!cloud) {
        if (hasLocal) toPush.push(key); // local-only → upload
        continue;
      }
      if (!hasLocal) {
        writeLocal(key, cloud.payload); // cloud-only → download
        meta[key] = new Date(cloud.updated_at).getTime();
        continue;
      }

      // both present → compare timestamps
      const localTs = meta[key]; // undefined on first login
      const cloudTs = new Date(cloud.updated_at).getTime();
      const localNewer = localTs === undefined || localTs >= cloudTs;
      if (localNewer) {
        toPush.push(key);
      } else {
        writeLocal(key, cloud.payload);
        meta[key] = cloudTs;
      }
    }
    writeMeta(meta);

    // upload the keys that should win from local (after releasing the guard)
    isPulling = false;
    await Promise.all(toPush.map((k) => pushKey(k)));
    if (toPush.length > 0) {
      // notify listeners that persisted local data may have changed
      window.dispatchEvent(new CustomEvent("phuquoc:sync-pull"));
    }
  } finally {
    isPulling = false;
  }
}

/**
 * Start watching local storage changes for auto-sync. Call on login.
 * Returns an unsubscribe fn (call on logout).
 */
export function startSync(): () => void {
  // stop any previous subscription
  unsubscribe?.();

  const onStorage = (e: StorageEvent) => {
    if (e.key) markDirty(e.key);
  };
  window.addEventListener("storage", onStorage);

  unsubscribe = () => {
    window.removeEventListener("storage", onStorage);
    pushTimers.forEach((t) => clearTimeout(t));
    pushTimers.clear();
    unsubscribe = null;
  };
  return unsubscribe;
}

/** Stop sync and flush pending timers (call on logout). */
export function stopSync() {
  unsubscribe?.();
}
