"use client";

import { useState } from "react";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAccountFunding } from "@/hooks/use-account-funding";

const PRESETS = [5, 10, 25, 50];

/**
 * The "load up your account" panel. Shows the user's spendable tab and lets them
 * raise it with a single USDC approval — the funds never leave their wallet.
 */
export function FundingPanel() {
  const { state, loading, error, approving, approve, connected } = useAccountFunding();
  const [amount, setAmount] = useState(25);

  if (!connected) {
    return (
      <Card>
        <Empty
          icon={<Wallet className="size-5" />}
          title="Connect a wallet to load up"
          body="Your balance is a spending allowance - USDC stays in your wallet and we draw from it only as you use the API."
        />
      </Card>
    );
  }

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Spendable" value={loading ? "…" : `$${fmt(state?.usd.spendable)}`} />
        <Stat label="Remaining" value={loading ? "…" : `$${fmt(state?.usd.remaining)}`} />
        <Stat
          label="In your wallet"
          value={loading ? "…" : `$${fmt(microToUsd(state?.walletBalanceMicros))}`}
        />
      </div>

      <div className="mt-6 border-t pt-6">
        <p className="text-sm font-medium">Increase your allowance</p>
        <p className="mt-1 text-sm text-muted-foreground">
          One signature authorizes us to draw up to this much USDC as you spend. No deposit; revoke
          anytime.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {PRESETS.map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
                amount === v ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent"
              }`}
            >
              ${v}
            </button>
          ))}
          <Button className="ml-auto" disabled={approving} onClick={() => approve(amount)}>
            {approving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Wallet className="size-4" />
            )}
            {approving ? "Confirm in wallet…" : `Approve $${amount}`}
          </Button>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border bg-card p-6">{children}</div>;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function Empty({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function fmt(n?: number): string {
  return (n ?? 0).toFixed(2);
}

function microToUsd(micros?: number): number {
  return (micros ?? 0) / 1_000_000;
}
