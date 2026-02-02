export async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const { usePrivy } = await import("@privy-io/react-auth");
    const privyModule = usePrivy;

    if (!privyModule) return null;

    const token = await (window as any).__privyGetAccessToken?.();
    return token || null;
  } catch {
    return null;
  }
}

export function setPrivyTokenGetter(getter: () => Promise<string>) {
  if (typeof window !== "undefined") {
    (window as any).__privyGetAccessToken = getter;
  }
}
