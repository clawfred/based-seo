import Link from "next/link";
import { ArrowRight, Bot, LayoutDashboard } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/landing/reveal";

/**
 * Two front doors, one API. Makes the agent path a peer of the human dashboard,
 * and points agents at the installable skill.
 */
export function TwoWays() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-12 md:px-6">
      <Reveal className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-4 border-border/70 bg-background/60 p-6 shadow-sm backdrop-blur">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <LayoutDashboard className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">For people</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              A fast, minimal dashboard — keyword research, backlinks, site audits, domain
              overviews, and AI-search visibility. Connect a wallet, top up once, and stop signing
              every request.
            </p>
          </div>
          <Link
            href="/explore"
            className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Open the dashboard <ArrowRight className="size-3.5" />
          </Link>
        </Card>

        <Card className="flex flex-col gap-4 border-primary/30 bg-background/60 p-6 shadow-sm backdrop-blur">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
            <Bot className="size-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">For AI agents</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Agents discover endpoints from a machine-readable manifest, get a price in a standard
              402, and pay per call in USDC — no account, no API key to store. Drop in the{" "}
              <span className="font-medium text-foreground">based-seo skill</span> and your agent
              knows how to use it.
            </p>
          </div>
          <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link
              href="/developers"
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
            >
              Agent docs <ArrowRight className="size-3.5" />
            </Link>
            <a
              href="/api/v3/manifest"
              className="text-muted-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              manifest
            </a>
            <a
              href="/openapi.json"
              className="text-muted-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              openapi
            </a>
            <a
              href="/llms.txt"
              className="text-muted-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              llms.txt
            </a>
          </div>
        </Card>
      </Reveal>
    </section>
  );
}
