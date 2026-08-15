import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/clients";
import { useAppState, hydrateFromCloud, type AppState } from "@/lib/store";

// NOTE: bootstrap_owner / claim_recovery_code / regenerate_recovery_code /
// current_owner and the user_state table are defined in
// supabase/migrations/20260815090000_backup_recovery_codes.sql and won't
// exist in the generated Database type until that migration has been
// applied and types.ts regenerated. The `as any` casts below match the
// same pattern already used in lib/race.ts for the same reason — safe to
// narrow once the types catch up.

const OWNER_KEY = "sprout-owner-v1";

function getLocalOwnerId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(OWNER_KEY);
}

function setLocalOwnerId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) window.localStorage.setItem(OWNER_KEY, id);
  else window.localStorage.removeItem(OWNER_KEY);
  window.dispatchEvent(new Event("sprout-owner-change"));
}

async function ensureSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/** Silent, no-code-needed reattachment: if this exact session was already
 *  linked to an owner (normal continued use, or a partial storage loss
 *  that left the Supabase session intact), pick that back up quietly.
 *  Never pulls or overwrites app data — only restores the identity link. */
async function trySelfHeal(): Promise<string | null> {
  const { data, error } = await (supabase as any).rpc("current_owner");
  if (error || !data) return null;
  setLocalOwnerId(data as string);
  return data as string;
}

/** Starts a new backup for this device and returns a one-time recovery
 *  code. `code` is null if this session already had a backup — the
 *  caller should treat that as "already backed up" rather than an error. */
export async function bootstrapBackup(): Promise<{ ownerId: string; code: string | null }> {
  await ensureSession();
  const { data, error } = await (supabase as any).rpc("bootstrap_owner");
  if (error) throw new Error("Couldn't start a backup. Check your connection and try again.");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.owner_id) throw new Error("Couldn't start a backup. Check your connection and try again.");
  setLocalOwnerId(row.owner_id as string);
  return { ownerId: row.owner_id as string, code: (row.recovery_code as string | null) ?? null };
}

/** Restores a previous backup onto this device using its recovery code.
 *  Pulls the saved state down and hydrates it into local state directly —
 *  this is the one place cloud data is allowed to overwrite local data,
 *  since it's only ever offered when there's nothing local to lose yet. */
export async function claimBackupCode(code: string): Promise<boolean> {
  await ensureSession();
  const { data: ownerId, error } = await (supabase as any).rpc("claim_recovery_code", { p_code: code });
  if (error || !ownerId) throw new Error("That code doesn't match anything. Double check it and try again.");
  setLocalOwnerId(ownerId as string);
  const remote = await pullState();
  if (remote && Object.keys(remote).length > 0) {
    hydrateFromCloud(remote);
    return true;
  }
  return false;
}

/** Replaces the current recovery code with a new one. The old code stops
 *  working immediately — there's no way to look up a lost code, only
 *  issue a fresh one, since only its hash is ever stored. */
export async function regenerateBackupCode(): Promise<string> {
  await ensureSession();
  const { data, error } = await (supabase as any).rpc("regenerate_recovery_code");
  if (error || !data) throw new Error("Couldn't make a new code. Check your connection and try again.");
  return data as string;
}

async function pullState(): Promise<AppState | null> {
  const ownerId = getLocalOwnerId();
  if (!ownerId) return null;
  const { data, error } = await supabase
    .from("user_state" as any)
    .select("state")
    .eq("owner_id", ownerId)
    .maybeSingle();
  if (error || !data) return null;
  return (data as any).state as AppState;
}

async function pushState(state: AppState): Promise<void> {
  const ownerId = getLocalOwnerId();
  if (!ownerId) return;
  await supabase
    .from("user_state" as any)
    .update({ state, updated_at: new Date().toISOString() })
    .eq("owner_id", ownerId);
}

/** hasBackup: whether this device currently has a working link to a cloud
 *  backup. Recalculates whenever bootstrapBackup/claimBackupCode run. */
export function useCloudBackup(): { hasBackup: boolean } {
  const [ownerId, setOwnerId] = useState<string | null>(getLocalOwnerId());
  useEffect(() => {
    const onChange = () => setOwnerId(getLocalOwnerId());
    window.addEventListener("sprout-owner-change", onChange);
    return () => window.removeEventListener("sprout-owner-change", onChange);
  }, []);
  return { hasBackup: !!ownerId };
}

/** Mount once near the app root. Ensures an anonymous session exists,
 *  silently self-heals the owner link if possible, and pushes local
 *  state to the cloud (debounced) whenever it changes, but only once a
 *  backup has actually been established — see bootstrapBackup. */
export function CloudSync() {
  const s = useAppState();
  const { hasBackup } = useCloudBackup();
  const bootedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    (async () => {
      try {
        await ensureSession();
        if (!getLocalOwnerId()) await trySelfHeal();
      } catch {
        // Offline or Supabase unreachable — the app still works fully
        // from local storage, this just skips the cloud sync for now.
      }
    })();
  }, []);

  useEffect(() => {
    if (!hasBackup) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      pushState(s).catch(() => {
        // Will retry on the next state change.
      });
    }, 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [s, hasBackup]);

  return null;
}