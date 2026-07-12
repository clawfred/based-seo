"use client";

import { useMemo } from "react";
import { createConfig, http, WagmiProvider, useConfig } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthTokenProvider } from "@/lib/auth-context";
import { activeChain } from "@/lib/wallet-network";
import { useWagmiConfig } from "@/hooks/use-wagmi-config";
import { useUserSync } from "@/hooks/use-user-sync";
import { useAuthTokenSetup } from "@/hooks/use-auth-token-setup";
import { usePrivyWalletAddress } from "@/hooks/use-privy-wallet-address";

const queryClient = new QueryClient();

function AppInitializers() {
  const config = useConfig();
  useWagmiConfig(config);
  return null;
}

function PrivyInitializers() {
  const config = useConfig();
  useWagmiConfig(config);
  useAuthTokenSetup();
  usePrivyWalletAddress();
  useUserSync();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Match the server's X402_NETWORK. Wallet, RPC, and Privy all point at the
  // same chain so a payment can't fail from a client/server chain mismatch.
  const chain = activeChain();

  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [chain],
        connectors: [coinbaseWallet({ appName: "Based SEO", preference: "smartWalletOnly" })],
        ssr: true,
        // Optional dedicated RPC; falls back to the chain's public endpoint.
        transports: {
          [chain.id]: process.env.NEXT_PUBLIC_RPC_URL
            ? http(process.env.NEXT_PUBLIC_RPC_URL)
            : http(),
        },
      }),
    [chain],
  );

  const themed = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <AppInitializers />
          {themed}
        </QueryClientProvider>
      </WagmiProvider>
    );
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethodsAndOrder: {
          primary: ["email", "base_account", "twitter", "google"],
          overflow: ["farcaster", "detected_ethereum_wallets", "wallet_connect"],
        },
        defaultChain: chain,
        supportedChains: [chain],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "dark",
          accentColor: "#6366E0",
          logo: "/logo.png",
          walletList: ["base_account", "coinbase_wallet", "rainbow", "detected_ethereum_wallets"],
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <PrivyWagmiProvider config={wagmiConfig} reconnectOnMount={false}>
          <AuthTokenProvider>
            <PrivyInitializers />
            {themed}
          </AuthTokenProvider>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
