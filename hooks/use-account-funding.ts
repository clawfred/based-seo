"use client";

import { useCallback, useEffect, useState } from "react";
import { erc20Abi, parseUnits } from "viem";
import { useAccount, useWriteContract } from "wagmi";

import { useAuthToken } from "@/lib/auth-context";

export interface AccountState {
  spendableMicros: number;
  remainingMicros: number;
  allowanceMicros: number;
  walletBalanceMicros: number;
  spender: `0x${string}`;
  usdcAddress: `0x${string}`;
  network: string;
  usd: { balance: number; spendable: number; remaining: number };
}

/**
 * Reads the user's funding state from `/api/account` and lets them raise their
 * allowance with a single USDC `approve`. The approval is signed by the user's
 * own wallet — we never hold a key that could move their funds beyond the tab
 * pulls the allowance authorizes.
 */
export function useAccountFunding() {
  const { address } = useAccount();
  const getToken = useAuthToken();
  const { writeContractAsync, isPending: approving } = useWriteContract();

  const [state, setState] = useState<AccountState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`/api/account?wallet=${address}`, {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error((await res.json())?.message ?? `HTTP ${res.status}`);
      setState((await res.json()) as AccountState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read account");
    } finally {
      setLoading(false);
    }
  }, [address, getToken]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Approve `amountUsd` of USDC for the platform spender, then refresh. */
  const approve = useCallback(
    async (amountUsd: number) => {
      if (!state?.spender || !state?.usdcAddress) throw new Error("No spender configured");
      setError(null);
      try {
        await writeContractAsync({
          address: state.usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [state.spender, parseUnits(String(amountUsd), 6)],
        });
        // Approval is confirmed on-chain before this resolves; re-read the tab.
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Approval failed");
        throw err;
      }
    },
    [state?.spender, state?.usdcAddress, writeContractAsync, refresh],
  );

  return { state, loading, error, approving, approve, refresh, connected: Boolean(address) };
}
