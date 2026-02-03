"use client";

import { createContext, useContext, type ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";

const AuthTokenContext = createContext<(() => Promise<string | null>) | null>(null);

export function AuthTokenProvider({ children }: { children: ReactNode }) {
  const { getAccessToken } = usePrivy();
  return <AuthTokenContext.Provider value={getAccessToken}>{children}</AuthTokenContext.Provider>;
}

export function useAuthToken() {
  const getToken = useContext(AuthTokenContext);
  if (!getToken) {
    return async () => null;
  }
  return getToken;
}
