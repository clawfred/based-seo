import { navIcon } from "@/components/layout/nav-icons";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/landing/reveal";
import { familyStats } from "@/lib/registry/taxonomy";

/**
 * The full surface, generated from the registry taxonomy so the marketing page
 * can never overstate what the API actually serves.
 */
export function Capabilities() {
  const stats = familyStats();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
      <Reveal className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Everything DataForSEO offers</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Not a curated slice - the whole thing. {stats.length} families, from classic keyword
            research to AI-search visibility, each priced at cost.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(({ family, count, fromUsd }) => {
            const Icon = navIcon(family.icon);
            return (
              <Card
                key={family.id}
                className="group flex items-start gap-3 border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <Icon className="size-4.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-medium">{family.label}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{count}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {family.blurb}
                  </p>
                  <p className="mt-1.5 text-[11px] text-muted-foreground/80">
                    {fromUsd > 0 ? `from $${fromUsd}/req` : "free reference data"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </Reveal>
    </section>
  );
}
