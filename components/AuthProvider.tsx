"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { pullAndMerge, startSync, stopSync } from "@/lib/sync";
import { useTripStore, subscribeTripSync } from "@/lib/store";

type SyncStatus = "idle" | "syncing" | "synced" | "error";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  lastSyncAt: number | null;
  syncNow: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const unsubTripSync = useRef<(() => void) | null>(null);

  async function beginSync() {
    setSyncStatus("syncing");
    try {
      await pullAndMerge();
      // pullAndMerge wrote fresh JSON into localStorage for the manual keys;
      // the Zustand store must re-read its own persisted slice to reflect it.
      useTripStore.persist.rehydrate();
      startSync();
      unsubTripSync.current ??= subscribeTripSync();
      setSyncStatus("synced");
      setLastSyncAt(Date.now());
    } catch (e) {
      console.warn("[auth] sync start failed", e);
      setSyncStatus("error");
    }
  }

  useEffect(() => {
    let mounted = true;

    // Bootstrap the current session once on mount.
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user) await beginSync();
    });

    // Stay in sync with login / logout / token refresh.
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (event === "SIGNED_IN" && session?.user) {
        await beginSync();
      } else if (event === "SIGNED_OUT") {
        stopSync();
        unsubTripSync.current?.();
        unsubTripSync.current = null;
        setSyncStatus("idle");
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    syncStatus,
    lastSyncAt,
    async syncNow() {
      const { pullAll } = await import("@/lib/sync");
      setSyncStatus("syncing");
      try {
        await pullAndMerge();
        await pullAll();
        setSyncStatus("synced");
        setLastSyncAt(Date.now());
      } catch {
        setSyncStatus("error");
      }
    },
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    async signUp(email, password) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) return { error: error.message, needsConfirmation: false };
      // If a session came back immediately, email confirmation is off — already logged in.
      // Otherwise Supabase sent a confirmation link.
      return { error: null, needsConfirmation: !data.session };
    },
    async signOut() {
      await supabase.auth.signOut();
    },
    async signInWithGoogle() {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/me` },
      });
      return { error: error?.message ?? null };
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
