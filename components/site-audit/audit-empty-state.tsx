import { Gauge, Link2, FileWarning, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: FileWarning,
    title: "Technical issues",
    body: "Broken links, redirect loops, 4xx/5xx errors, and canonical problems across your site.",
  },
  {
    icon: Link2,
    title: "On-page SEO",
    body: "Missing or duplicate titles and descriptions, thin content, and missing H1s and alt text.",
  },
  {
    icon: Zap,
    title: "Performance",
    body: "Slow pages, heavy payloads, and render-blocking resources that hurt Core Web Vitals.",
  },
];

export function AuditEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-8 py-14 text-center">
        <div className="max-w-md space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <Gauge className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-xl font-semibold">Audit any site for technical SEO issues</h2>
          <p className="text-sm text-muted-foreground">
            Enter a URL above to crawl the site and get a health score with a prioritized list of
            issues — broken links, duplicate tags, missing metadata, slow pages, and more. Powered
            by live DataForSEO crawling, billed per page.
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
