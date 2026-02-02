"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAuthToken } from "@/lib/auth-context";

export function useUserSync() {
  const { authenticated, user, ready } = usePrivy();
  const getToken = useAuthToken();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !user || synced) return;

    const syncUser = async () => {
      try {
        const token = await getToken();
        if (!token) {
          return;
        }

        const response = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: user.email?.address,
            walletAddress: user.wallet?.address,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        setSynced(true);
      } catch (e) {
        console.error("[UserSync] Failed to sync user:", e);
        const retryDelayMs = 2000;
        setTimeout(() => setSynced(false), retryDelayMs);
      }
    };

    syncUser();
  }, [ready, authenticated, user, synced, getToken]);
}
