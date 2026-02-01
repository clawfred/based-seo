"use client";

import { useEffect, useMemo } from "react";
import { base } from "wagmi/chains";
import { createConfig, http, WagmiProvider, useConfig } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OnchainKitProvider } from "@coinbase/onchainkit";
import { ThemeProvider } from "@/components/theme-provider";
import { setWagmiConfig } from "@/lib/api";

const queryClient = new QueryClient();

function ConfigCapture() {
  const config = useConfig();
  useEffect(() => {
    setWagmiConfig(config);
  }, [config]);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const wagmiConfig = useMemo(
    () =>
      createConfig({
        chains: [base],
        connectors: [coinbaseWallet({ appName: "Based SEO", preference: "all" }), injected()],
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
          <ConfigCapture />
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
