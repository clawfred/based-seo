"use client";

/**
 * Stub hook — returns unauthenticated state.
 * Will be replaced when auth is set up.
 */
export function useCurrentUser() {
  return {
    userId: null as string | null,
    authenticated: false,
    loading: false,
    user: null,
    login: () => {},
    logout: () => {},
  };
}
