import Link from "next/link";

import { navIcon } from "@/components/layout/nav-icons";
import { Badge } from "@/components/ui/badge";
import { ENDPOINTS } from "@/lib/registry";
import { familyStats } from "@/lib/registry/taxonomy";

export const metadata = {
  title: "Explore the API",
  description: "Run any of DataForSEO's endpoints, priced per request.",
};

export default function ExplorePage() {
  const stats = familyStats();
  const total = ENDPOINTS.filter((e) => e.exposure === "public").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Explore the API</h1>
        <p className="mt-1 text-muted-foreground">
          {total} endpoints across {stats.length} families. Run any of them here, or hit them
          directly and pay per request with x402.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(({ family, count, fromUsd }) => {
          const Icon = navIcon(family.icon);
          return (
            <Link
              key={family.id}
              href={`/explore/${family.id}`}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <Badge variant="secondary" className="text-xs">
                  {count}
                </Badge>
              </div>
              <div>
                <h2 className="font-semibold group-hover:text-primary">{family.label}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{family.blurb}</p>
              </div>
              <p className="mt-auto text-xs text-muted-foreground">
                {fromUsd > 0 ? `from $${fromUsd} / request` : "free reference data"}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
