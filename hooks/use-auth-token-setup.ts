"use client";

import { useEffect } from "react";
import { useAuthToken } from "@/lib/auth-context";
import { setAuthTokenGetter } from "@/lib/api";

export function useAuthTokenSetup() {
  const getToken = useAuthToken();

  useEffect(() => {
    setAuthTokenGetter(getToken);
  }, [getToken]);
}
