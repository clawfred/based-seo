import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/landing/reveal";
import { ENDPOINTS } from "@/lib/registry";
import { quote } from "@/lib/registry/pricing";

/**
 * Honest pricing, computed from the live registry. A few representative
 * endpoints against the SaaS subscriptions they replace.
 */
const EXAMPLES: { slug: string; label: string; vs: string }[] = [
  { slug: "serp/google/organic/task_post", label: "SERP result", vs: "Moz · $99/mo" },
  {
    slug: "dataforseo_labs/google/keyword_overview/live",
    label: "Keyword overview",
    vs: "Semrush · $139/mo",
  },
  { slug: "backlinks/summary/live", label: "Backlink profile", vs: "Ahrefs · $129/mo" },
  { slug: "on_page/task_post", label: "Site audit crawl", vs: "Screaming Frog · $259/yr" },
];

export function PricingSection() {
  const rows = EXAMPLES.map((ex) => {
    const endpoint = ENDPOINTS.find((e) => e.slug === ex.slug);
    return { ...ex, price: endpoint ? quote(endpoint).formatted : "-" };
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
      <Reveal className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Pay for data, not dashboards</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            The exact DataForSEO cost, passed through. No subscription, no seat, no minimum. A
            hundred keyword lookups costs a few dollars - not a monthly bill you forget to cancel.
          </p>
        </div>

        <Card className="divide-y divide-border/60 border-border/70 bg-background/60 p-0 shadow-sm backdrop-blur">
          {rows.map((r) => (
            <div key={r.slug} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.label}</div>
                <div className="truncate text-xs text-muted-foreground line-through">{r.vs}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-semibold tabular-nums text-primary">{r.price}</div>
                <div className="text-[11px] text-muted-foreground">per request</div>
              </div>
            </div>
          ))}
        </Card>
      </Reveal>
    </section>
  );
}
