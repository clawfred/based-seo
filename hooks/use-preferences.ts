"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserPreferences } from "@/db/schema";
import { useAuthToken } from "@/lib/auth-context";

const LOCAL_PREFS_KEY = "betterseo_preferences";

function getLocalPrefs(): UserPreferences {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalPrefs(prefs: UserPreferences) {
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
}

/**
 * User preferences hook.
 * - Authenticated → syncs with DB
 * - Guest → localStorage
 */
export function usePreferences(userId?: string | null) {
  const isDb = !!userId;
  const getToken = useAuthToken();
  const [preferences, setPreferences] = useState<UserPreferences>(getLocalPrefs);
  const [loaded, setLoaded] = useState(!isDb); // locals are instant

  // Fetch from DB on auth
  useEffect(() => {
    if (!userId) return;

    (async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        const r = await fetch(`/api/users/preferences`, {
          headers,
        });
        const res = await r.json();
        if (res.data) {
          setPreferences(res.data);
          setLocalPrefs(res.data);
        }
      } catch {
      } finally {
        setLoaded(true);
      }
    })();
  }, [userId, getToken]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const merged = { ...preferences, ...patch };
      setPreferences(merged);
      setLocalPrefs(merged);

      if (isDb && userId) {
        try {
          const token = await getToken();
          const headers: Record<string, string> = { "Content-Type": "application/json" };
          if (token) headers.Authorization = `Bearer ${token}`;

          await fetch("/api/users/preferences", {
            method: "PATCH",
            headers,
            body: JSON.stringify({ preferences: patch }),
          });
        } catch {}
      }
    },
    [preferences, isDb, userId, getToken],
  );

  return { preferences, updatePreferences, loaded };
}
