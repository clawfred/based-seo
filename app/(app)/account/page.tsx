import { FundingPanel } from "@/components/account/funding-panel";

export const metadata = {
  title: "Account",
  description: "Load up your account and spend across the API with one approval.",
};

export default function AccountPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="mt-1 text-muted-foreground">
          Top up once, then run any endpoint without signing each request. Your balance is a USDC
          spending allowance — the funds stay in your wallet until you use them.
        </p>
      </div>

      <FundingPanel />

      <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>You approve a USDC spending allowance — one signature, no deposit.</li>
          <li>Requests draw from that allowance as you make them; no per-request signing.</li>
          <li>We settle the running tab against your wallet in the background.</li>
          <li>
            Prefer to pay per request instead? Just don&apos;t set an allowance — every call falls
            back to a one-off x402 payment.
          </li>
        </ol>
      </div>
    </div>
  );
}
