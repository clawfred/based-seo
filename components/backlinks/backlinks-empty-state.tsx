import { Link2, Globe, Gauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Link2,
    title: "Every backlink",
    body: "See the pages linking to any site, their anchor text, and dofollow status.",
  },
  {
    icon: Globe,
    title: "Referring domains",
    body: "Break the profile down by domain, ranked by authority and link count.",
  },
  {
    icon: Gauge,
    title: "Profile health",
    body: "Domain rank, spam score, and broken links at a glance.",
  },
];

export function BacklinksEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-8 py-14 text-center">
        <div className="max-w-md space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <Link2 className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold">Explore any site's backlink profile</h2>
          <p className="text-sm text-muted-foreground">
            Enter a domain or URL above to pull its backlinks, referring domains, and overall
            authority - powered by live DataForSEO data, billed per request.
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
