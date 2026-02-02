import { PrivyClient } from "@privy-io/server-auth";

let _privyClient: PrivyClient | null = null;

function getPrivyClient(): PrivyClient {
  if (!_privyClient) {
    if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
      throw new Error("Missing NEXT_PUBLIC_PRIVY_APP_ID environment variable");
    }

    if (!process.env.PRIVY_APP_SECRET) {
      throw new Error("Missing PRIVY_APP_SECRET environment variable");
    }

    _privyClient = new PrivyClient(
      process.env.NEXT_PUBLIC_PRIVY_APP_ID,
      process.env.PRIVY_APP_SECRET,
    );
  }

  return _privyClient;
}

export const privyClient = new Proxy({} as PrivyClient, {
  get(_target, prop) {
    const client = getPrivyClient();
    const value = client[prop as keyof PrivyClient];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
