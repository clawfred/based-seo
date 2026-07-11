import { Card } from "@/components/ui/card";

/**
 * A stylized terminal showing the whole agent contract: discover free, call,
 * get a 402 with the price, pay, get data. This is the premise made concrete.
 */
export function AgentTerminal() {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-[#0b0d12] p-0 shadow-xl">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
        <span className="ml-2 text-xs text-white/40">agent · x402</span>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-white/80">
        <code>
          <span className="text-white/40"># no account — discovery is free</span>
          {"\n"}
          <span className="text-emerald-400">GET</span> /api/v3/manifest
          {"\n\n"}
          <span className="text-white/40"># call an endpoint → 402 with the price</span>
          {"\n"}
          <span className="text-sky-400">POST</span> /api/v3/backlinks/summary/live
          {"\n"}
          <span className="text-white/50">{"{ "}</span>
          <span className="text-amber-300">&quot;target&quot;</span>
          <span className="text-white/50">: </span>
          <span className="text-emerald-300">&quot;stripe.com&quot;</span>
          <span className="text-white/50">{" }"}</span>
          {"\n"}
          <span className="text-rose-400">← 402</span>{" "}
          <span className="text-white/60">PAYMENT-REQUIRED · $0.02 USDC · base</span>
          {"\n\n"}
          <span className="text-white/40"># wallet signs, request retries, data returns</span>
          {"\n"}
          <span className="text-sky-400">POST</span> …{" "}
          <span className="text-white/60">PAYMENT-SIGNATURE: …</span>
          {"\n"}
          <span className="text-emerald-400">← 200</span>{" "}
          <span className="text-white/60">{"{ referring_domains: 48213, rank: 92, … }"}</span>
        </code>
      </pre>
    </Card>
  );
}
