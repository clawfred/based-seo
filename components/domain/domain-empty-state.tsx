import { KeyRound, Link2, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: KeyRound,
    title: "Keyword footprint",
    body: "Organic keywords, estimated traffic, and the terms a domain actually ranks for.",
  },
  {
    icon: Link2,
    title: "Backlink authority",
    body: "Referring domains, total backlinks, and domain rank from a live crawl.",
  },
  {
    icon: Layers,
    title: "Tech stack",
    body: "The CMS, analytics, and frameworks powering the site, grouped by category.",
  },
];

export function DomainEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-8 py-14 text-center">
        <div className="max-w-md space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <Layers className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold">One snapshot of any domain</h2>
          <p className="text-sm text-muted-foreground">
            Enter a domain above to pull its keyword footprint, backlink authority, and technology
            stack in a single view — powered by live DataForSEO data, billed per request.
          </p>
        </div>

        <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border bg-card p-4 text-left">
              <f.icon className="mb-2 h-5 w-5 text-muted-foreground" />
              <h3 className="text-sm font-medium">{f.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
