import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  Sparkles,
  Search,
  BarChart3,
  Github,
  BadgeDollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";

const features = [
  {
    title: "Keyword Overview",
    description:
      "Volume, difficulty, CPC, competition, intent, 12‑month trends, and global breakdown — in one request.",
    icon: Search,
  },
  {
    title: "Keyword Finder",
    description:
      "Thousands of related keywords + questions from a seed keyword. Filter and save what matters.",
    icon: Sparkles,
  },
  {
    title: "SERP Analysis",
    description: "See who ranks and why for a query — without paying SaaS margins.",
    icon: BarChart3,
  },
] as const;

const pricing = [
  {
    feature: "Keyword Overview",
    cost: "$0.05",
    comparison: "SEMRUSH: $129.95/mo",
  },
  {
    feature: "Keyword Ideas",
    cost: "$0.05",
    comparison: "Ahrefs: $99/mo",
  },
  {
    feature: "SERP Analysis",
    cost: "$0.002",
    comparison: "Moz: $99/mo",
  },
] as const;

export function LandingPage() {
  return (
    <main className="relative">
      {/* Background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.35),transparent)] blur-2xl" />
        <div className="absolute left-[-220px] top-[220px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.22),transparent)] blur-2xl animate-float-slow" />
        <div className="absolute right-[-240px] top-[480px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.18),transparent)] blur-2xl animate-float-slower" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(from_var(--background)_l_c_h_/_0.85))]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(oklch(from_var(--foreground)_l_c_h_/_0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      {/* Hero */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 md:px-6 md:pt-16">
        <Reveal className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
            <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <BadgeDollarSign className="size-4" />
            </span>
            <span>Pay‑per‑search SEO data · No subscriptions · No markup</span>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.35fr_0.65fr] md:items-start">
            <div className="space-y-5">
              <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
                Professional‑grade SEO data at the cost it takes to fetch it.
              </h1>
              <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                Based SEO passes through the exact DataForSEO cost. No accounts. No subscriptions.
                Just the data you need, when you need it — paid per request via x402 (USDC on Base).
              </p>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild size="lg" className="group">
                  <Link href="/keywords/overview">
                    Launch the tools
                    <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link
                    href="https://github.com/clawfred/based-seo"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github className="mr-2 size-4" />
                    Read the code
                  </Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Powered by DataForSEO
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Pay per request (x402)
                </span>
                <span className="inline-flex items-center gap-2">
                  <Check className="size-4 text-primary" />
                  Open source
                </span>
              </div>
            </div>

            <Card className="relative overflow-hidden border-border/70 bg-background/65 p-4 shadow-sm backdrop-blur">
              <div className="absolute inset-0 opacity-70 [background:radial-gradient(circle_at_30%_15%,oklch(from_var(--primary)_l_c_h_/_0.18),transparent_55%)]" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Based SEO"
                    width={44}
                    height={44}
                    className="size-11 rounded-xl bg-background object-contain"
                  />
                  <div>
                    <div className="text-sm font-semibold">Based SEO</div>
                    <div className="text-xs text-muted-foreground">
                      Pay‑per‑search keyword research
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-border/70 bg-background/70 p-3">
                  <div className="text-xs text-muted-foreground">Example</div>
                  <div className="mt-1 text-sm font-medium">“best crypto wallet”</div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { k: "Volume", v: "74k" },
                      { k: "KD", v: "41" },
                      { k: "CPC", v: "$2.13" },
                    ].map((x) => (
                      <div
                        key={x.k}
                        className="rounded-md border border-border/70 bg-background/60 p-2"
                      >
                        <div className="text-[10px] text-muted-foreground">{x.k}</div>
                        <div className="text-sm font-semibold">{x.v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  You pay the underlying data cost. That’s the point.
                </div>
              </div>
            </Card>
          </div>
        </Reveal>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <Reveal className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">What it does</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Three focused tools — no bloated dashboards. Get the numbers, make the decision, move
              on.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="group relative overflow-hidden border-border/70 bg-background/60 p-5 shadow-sm backdrop-blur transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 [background:radial-gradient(circle_at_20%_10%,oklch(from_var(--primary)_l_c_h_/_0.14),transparent_55%)]" />
                  <div className="relative space-y-3">
                    <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <div className="text-base font-semibold">{f.title}</div>
                      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {f.description}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* Why */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <Reveal className="grid gap-8 md:grid-cols-2 md:items-start">
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">Why this exists</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              SEO data is a commodity sold at SaaS margins. DataForSEO costs fractions of a cent to
              a few cents per request — but the industry charges you $100+/month for a dashboard
              wrapper.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Based SEO is the opposite: exact data cost pass‑through. No subscriptions. No minimum
              spend. Just clean UI on top of the raw data.
            </p>
          </div>

          <Card className="border-border/70 bg-background/60 p-6 shadow-sm backdrop-blur">
            <div className="space-y-4">
              <div className="text-sm font-semibold">How it works</div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                {[
                  "You search",
                  "Request is paid via x402 (USDC on Base)",
                  "We fetch DataForSEO",
                  "You get results",
                ].map((step, idx) => (
                  <li key={step} className="flex gap-3">
                    <div className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                      {idx + 1}
                    </div>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <Separator />
              <div className="text-xs text-muted-foreground">
                Built with Next.js 16 + shadcn/ui. Payments: Base + x402. Data: DataForSEO.
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Pricing */}
      <section className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6">
        <Reveal className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Pricing</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Exact DataForSEO cost pass‑through. No markup.
            </p>
          </div>

          <Card className="border-border/70 bg-background/60 p-4 shadow-sm backdrop-blur">
            <div className="grid gap-3">
              <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-border/60 pb-2 text-xs font-medium text-muted-foreground md:grid-cols-[1.4fr_0.4fr_1.2fr]">
                <div>Feature</div>
                <div className="text-right md:text-left">Cost / request</div>
                <div className="hidden md:block">Typical pricing</div>
              </div>

              {pricing.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 rounded-md px-1 py-2 text-sm md:grid-cols-[1.4fr_0.4fr_1.2fr]"
                >
                  <div className="font-medium">{row.feature}</div>
                  <div className={cn("text-right font-semibold md:text-left", "text-primary")}>
                    {row.cost}
                  </div>
                  <div className="hidden text-muted-foreground md:block">{row.comparison}</div>
                </div>
              ))}

              <Separator className="my-1" />
              <div className="text-xs text-muted-foreground">
                Example: 100 keyword lookups ={" "}
                <span className="font-medium text-foreground">$5</span>. Traditional tools charge{" "}
                <span className="font-medium text-foreground">$99–$130/month</span> whether you use
                it or not.
              </div>
            </div>
          </Card>
        </Reveal>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-6">
        <Reveal>
          <Card className="relative overflow-hidden border-border/70 bg-background/60 p-8 shadow-sm backdrop-blur">
            <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.22),transparent)] blur-2xl" />
            <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="text-xl font-semibold tracking-tight">
                  Stop paying subscriptions for commodity data.
                </div>
                <div className="text-sm text-muted-foreground">
                  Launch the tools and pay only when you search.
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="group">
                  <Link href="/keywords/overview">
                    Get started
                    <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button asChild variant="secondary" size="lg">
                  <Link
                    href="https://github.com/clawfred/based-seo"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on GitHub
                  </Link>
                </Button>
              </div>
            </div>
          </Card>

          <footer className="mt-10 flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>© {new Date().getFullYear()} Based SEO. MIT licensed.</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <Link className="hover:text-foreground" href="/keywords/overview">
                Tools
              </Link>
              <Link
                className="hover:text-foreground"
                href="https://github.com/clawfred/based-seo"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </Link>
              <Link
                className="hover:text-foreground"
                href="/api/health"
                target="_blank"
                rel="noreferrer"
              >
                Status
              </Link>
            </div>
          </footer>
        </Reveal>
      </section>
    </main>
  );
}
