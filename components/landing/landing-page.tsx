import Link from "next/link";
import { ArrowRight, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Capabilities } from "@/components/landing/capabilities";
import { Hero } from "@/components/landing/hero";
import { PricingSection } from "@/components/landing/pricing-section";
import { Reveal } from "@/components/landing/reveal";
import { TwoWays } from "@/components/landing/two-ways";
import { listPublic } from "@/lib/registry";

/**
 * The landing page. Leads with the premise — one SEO/GEO API for both people and
 * their AI agents, paid per request — then shows the two front doors, the full
 * surface, and honest pricing. Composed from small section components; the
 * animated background is the only thing that lives here.
 */
export function LandingPage() {
  const endpointCount = listPublic().length;

  return (
    <main className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-[-120px] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.35),transparent)] blur-2xl" />
        <div className="absolute left-[-220px] top-[220px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.22),transparent)] blur-2xl animate-float-slow" />
        <div className="absolute right-[-240px] top-[480px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,oklch(from_var(--primary)_l_c_h_/_0.18),transparent)] blur-2xl animate-float-slower" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,oklch(from_var(--background)_l_c_h_/_0.85))]" />
        <div className="absolute inset-0 opacity-[0.18] [background-image:radial-gradient(oklch(from_var(--foreground)_l_c_h_/_0.12)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <Hero endpointCount={endpointCount} />
      <TwoWays />
      <Capabilities />
      <PricingSection />

      {/* Close */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 md:px-6">
        <Reveal className="flex flex-col items-center gap-5 rounded-2xl border border-border/70 bg-background/60 px-6 py-12 text-center shadow-sm backdrop-blur">
          <h2 className="text-balance text-2xl font-semibold tracking-tight md:text-3xl">
            Give your agents the whole SEO stack.
          </h2>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            {endpointCount} endpoints, priced at cost, paid per call. Start in the dashboard or wire
            it into an agent in minutes.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="/explore">
                Explore the API
                <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="https://github.com/clawfred/based-seo" target="_blank" rel="noreferrer">
                <Github className="mr-2 size-4" />
                Read the code
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
