import Link from "next/link";
import { ArrowRight, Bot, Github } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { AgentTerminal } from "@/components/landing/agent-terminal";

/**
 * The premise: one SEO/GEO API that both people and their AI agents can use,
 * paid per request in USDC. Agents are first-class, not an afterthought — the
 * hero shows an agent paying for data with no account and no API key.
 */
export function Hero({ endpointCount }: { endpointCount: number }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 pb-12 pt-14 md:px-6 md:pt-20">
      <Reveal className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Bot className="size-4" />
          </span>
          <span>
            {endpointCount} SEO &amp; GEO endpoints · pay per request · no account, no API key
          </span>
        </div>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="space-y-6">
            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              The SEO &amp; GEO API your <span className="text-primary">AI agents</span> can pay for
              themselves.
            </h1>
            <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
              Every DataForSEO endpoint - keywords, backlinks, site audits, SERPs, and AI-search
              visibility - behind one API. A human uses the dashboard; an agent hits the same
              endpoints and pays per call in USDC over x402. No subscription. No markup. No key to
              leak.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild size="lg" className="group">
                <Link href="/explore">
                  Explore the API
                  <ArrowRight className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/developers">
                  <Bot className="mr-2 size-4" />
                  For agents
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="https://github.com/clawfred/based-seo" target="_blank" rel="noreferrer">
                  <Github className="mr-2 size-4" />
                  Source
                </Link>
              </Button>
            </div>
          </div>

          <AgentTerminal />
        </div>
      </Reveal>
    </section>
  );
}
