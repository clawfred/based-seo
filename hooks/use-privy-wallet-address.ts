"use client";

import { useEffect } from "react";
import { useWallets, usePrivy } from "@privy-io/react-auth";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { setPrivyWalletAddress } from "@/lib/api";
import { useAccount } from "wagmi";

export function usePrivyWalletAddress() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (!ready || !authenticated || !wallets || wallets.length === 0) {
      return;
    }

    const privyWallet = wallets.find((w) => w.walletClientType === "privy");

    if (privyWallet?.address) {
      setPrivyWalletAddress(privyWallet.address as `0x${string}`);

      if (!isConnected) {
        setActiveWallet(privyWallet);
      }
    }
  }, [ready, authenticated, wallets, isConnected, setActiveWallet]);
}
