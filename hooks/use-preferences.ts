"use client";

import { useState, useEffect, useCallback } from "react";
import type { UserPreferences } from "@/db/schema";

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
  const [preferences, setPreferences] = useState<UserPreferences>(getLocalPrefs);
  const [loaded, setLoaded] = useState(!isDb); // locals are instant

  // Fetch from DB on auth
  useEffect(() => {
    if (!userId) return;
    fetch(`/api/users/preferences?userId=${encodeURIComponent(userId)}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setPreferences(res.data);
          setLocalPrefs(res.data); // sync local cache
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [userId]);

  const updatePreferences = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const merged = { ...preferences, ...patch };
      setPreferences(merged);
      setLocalPrefs(merged);

      if (isDb && userId) {
        fetch("/api/users/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, preferences: patch }),
        }).catch(() => {});
      }
    },
    [preferences, isDb, userId],
  );

  return { preferences, updatePreferences, loaded };
}
