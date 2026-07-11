import { Wallet, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GeoPaywallProps {
  /** One-line summary of what will run, e.g. `ChatGPT's answer for your prompt`. */
  subject: string;
  /** Combined price, from the manifest. 0 while it loads or when unknown. */
  totalUsd: number;
  /** Privy sign-in state. */
  authenticated: boolean;
  /** True once a wagmi wallet client is ready to sign. */
  hasWallet: boolean;
  loading: boolean;
  onConnect: () => void;
  onPay: () => void;
}

/** Payment prompt shared by both GEO modes. Mirrors the backlinks paywall. */
export function GeoPaywall({
  subject,
  totalUsd,
  authenticated,
  hasWallet,
  loading,
  onConnect,
  onPay,
}: GeoPaywallProps) {
  const priceLabel = totalUsd > 0 ? `$${totalUsd.toFixed(2)} USDC` : "a small fee";
  const canPay = authenticated && hasWallet;

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-5 py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
          <CreditCard className="h-6 w-6 text-indigo-500" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-xl font-semibold">This costs {priceLabel}</h2>
          <p className="text-sm text-muted-foreground">
            AI Visibility bills per request via x402.{" "}
            {canPay
              ? `Approve the payment to pull ${subject}.`
              : "Connect a wallet with USDC on Base to pay and run."}
          </p>
        </div>

        {canPay ? (
          <Button onClick={onPay} disabled={loading} className="h-11 gap-2 px-6">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Pay {priceLabel} &amp; run
          </Button>
        ) : (
          <Button onClick={onConnect} disabled={loading} className="h-11 gap-2 px-6">
            <Wallet className="h-4 w-4" />
            {authenticated ? "Waiting for wallet…" : "Connect wallet & pay"}
          </Button>
        )}

        <p className="text-xs text-muted-foreground">
          Powered by DataForSEO · settled in USDC on Base
        </p>
      </CardContent>
    </Card>
  );
}
