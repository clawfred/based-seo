"use client";

import { useLogin, usePrivy, useFundWallet } from "@privy-io/react-auth";
import { GlassButton } from "@/components/ui/glass-button";
import { Wallet, Plus, LogOut, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useBalance } from "wagmi";
import { base } from "wagmi/chains";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { balanceEvents } from "@/lib/balance-events";
import {
  USDC_TOKEN_ADDRESS_BASE,
  BALANCE_REFETCH_INTERVAL_MS,
  WALLET_FUNDING_REFETCH_DELAY_MS,
} from "@/lib/wallet-constants";

export function ConnectWallet() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <GlassButton disabled size="sm" contentClassName="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <span>Loading...</span>
      </GlassButton>
    );
  }

  return <ConnectWalletClient />;
}

function ConnectWalletClient() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { fundWallet } = useFundWallet();

  const { login } = useLogin({
    onError: (error) => {
      console.error("Login error:", error);
    },
  });

  const fullAddress = user?.wallet?.address as `0x${string}` | undefined;

  const { data: usdcBalance, refetch: refetchBalance } = useBalance({
    address: fullAddress,
    chainId: base.id,
    token: USDC_TOKEN_ADDRESS_BASE,
    query: {
      refetchInterval: authenticated ? BALANCE_REFETCH_INTERVAL_MS : false,
    },
  });

  useEffect(() => {
    if (!authenticated) return;
    const unsubscribe = balanceEvents.subscribe(() => {
      refetchBalance();
    });
    return unsubscribe;
  }, [authenticated, refetchBalance]);

  const handleFundWallet = async () => {
    if (!fullAddress) return;
    try {
      await fundWallet({
        address: fullAddress,
        options: {
          chain: base,
          asset: "USDC",
        },
      });
      setTimeout(() => refetchBalance(), WALLET_FUNDING_REFETCH_DELAY_MS);
    } catch (error) {
      console.error("Funding error:", error);
    }
  };

  const disableLogin = !ready || (ready && authenticated);

  if (!ready) {
    return (
      <GlassButton disabled size="sm" contentClassName="flex items-center gap-2">
        <Wallet className="h-4 w-4" />
        <span>Loading...</span>
      </GlassButton>
    );
  }

  if (authenticated && user) {
    const displayAddress = fullAddress
      ? `${fullAddress.slice(0, 6)}...${fullAddress.slice(-4)}`
      : user.email?.address || "User";

    const displayBalance = usdcBalance
      ? `$${parseFloat(formatUnits(usdcBalance.value, usdcBalance.decimals)).toFixed(2)}`
      : "...";

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div className="glass-button-wrap cursor-pointer rounded-lg">
            <button className="glass-button relative isolate all-unset cursor-pointer rounded-lg text-sm font-medium transition-all">
              <span className="glass-button-text relative block select-none tracking-tighter px-4 py-2 flex items-center gap-2.5">
                <Wallet className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-mono text-xs leading-tight tracking-tight">
                    {displayAddress}
                  </span>
                  <span className="text-[10px] leading-tight text-muted-foreground">
                    {displayBalance} USDC
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </span>
            </button>
            <div className="glass-button-shadow rounded-lg"></div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleFundWallet}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Funds</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <GlassButton
      onClick={login}
      disabled={disableLogin}
      size="sm"
      contentClassName="flex items-center gap-2"
    >
      <Wallet className="h-4 w-4" />
      <span>Connect Wallet</span>
    </GlassButton>
  );
}
