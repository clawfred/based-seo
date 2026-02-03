"use client";

import { useMemo } from "react";
import { base } from "wagmi/chains";
import { createConfig, http, WagmiProvider, useConfig } from "wagmi";
import { coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthTokenProvider } from "@/lib/auth-context";
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
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [base],
        connectors: [coinbaseWallet({ appName: "Based SEO", preference: "smartWalletOnly" })],
        ssr: true,
        transports: {
          [base.id]: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY
            ? http(
                `https://api.developer.coinbase.com/rpc/v1/base/${process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}`,
              )
            : http(),
        },
      }),
    [],
  );

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!privyAppId) {
    return (
      <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
        <QueryClientProvider client={queryClient}>
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base}
            config={{
              appearance: {
                mode: "auto",
                name: "Based SEO",
              },
              wallet: { display: "modal" },
            }}
          >
            <AppInitializers />
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </OnchainKitProvider>
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
        defaultChain: base,
        supportedChains: [base],
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
          <OnchainKitProvider
            apiKey={process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY}
            chain={base}
            config={{
              appearance: {
                mode: "auto",
                name: "Based SEO",
              },
              wallet: { display: "modal" },
            }}
          >
            <AuthTokenProvider>
              <PrivyInitializers />
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </AuthTokenProvider>
          </OnchainKitProvider>
        </PrivyWagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
