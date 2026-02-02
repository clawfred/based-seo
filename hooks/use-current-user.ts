"use client";

import { usePrivy } from "@privy-io/react-auth";

export function useCurrentUser() {
  const { ready, authenticated, user, login, logout } = usePrivy();

  return {
    userId: user?.id || null,
    authenticated,
    loading: !ready,
    user,
    login,
    logout,
  };
}
