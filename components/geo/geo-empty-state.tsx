import { Sparkles, MessageSquareQuote, Trophy, LineChart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: MessageSquareQuote,
    title: "Mention share",
    body: "How often ChatGPT, Claude, Gemini and Perplexity name your brand in their answers.",
  },
  {
    icon: Trophy,
    title: "Competitor leaderboard",
    body: "See which brands the models recommend first for the topics you care about.",
  },
  {
    icon: LineChart,
    title: "Gained vs lost",
    body: "Track the mentions you're winning and losing across AI answers over time.",
  },
];

/**
 * Prominent explainer for the Brand Visibility mode's idle state. Frames GEO
 * against traditional SEO so the value is obvious before a single call runs.
 */
export function GeoEmptyState() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-8 py-14 text-center">
        <div className="max-w-xl space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-500/10">
            <Sparkles className="h-6 w-6 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Traditional SEO is about Google. GEO is about whether ChatGPT recommends you.
          </h2>
          <p className="text-sm text-muted-foreground">
            Generative Engine Optimization measures how AI models see, mention, and cite your
            brand. Enter a brand or domain above to see your share of AI answers — powered by live
            DataForSEO data, billed per request.
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
