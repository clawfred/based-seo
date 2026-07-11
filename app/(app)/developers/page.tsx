import Link from "next/link";
import { ArrowUpRight, Bot, FileJson, Terminal } from "lucide-react";

import { ENDPOINTS } from "@/lib/registry";

export const metadata = {
  title: "API & Agents",
  description: "Hit the API directly and pay per request with x402 - no account required.",
};

const RESOURCES = [
  {
    href: "/api/v3/manifest",
    label: "Endpoint manifest",
    desc: "Every endpoint, its params and price, as JSON.",
    icon: FileJson,
  },
  {
    href: "/openapi.json",
    label: "OpenAPI 3.1",
    desc: "Import into any client or codegen tool.",
    icon: FileJson,
  },
  {
    href: "/llms.txt",
    label: "llms.txt",
    desc: "A signpost for AI agents discovering the API.",
    icon: Bot,
  },
];

export default function DevelopersPage() {
  const publicCount = ENDPOINTS.filter((e) => e.exposure === "public").length;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">API & Agents</h1>
        <p className="mt-1 text-muted-foreground">
          Every endpoint here is callable directly and paid per request with{" "}
          <a
            href="https://x402.org"
            className="underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            x402
          </a>{" "}
          on Base. No account, no API key - an agent that speaks x402 discovers the {publicCount}{" "}
          endpoints, gets a price, signs a USDC payment, and retries.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          <Terminal className="size-4" /> Call an endpoint
        </h2>
        <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-xs leading-relaxed">
          {`# 1. Unpaid request returns 402 with the price and payment details
curl -sD - -X POST https://based-seo.com/api/v3/backlinks/summary/live \\
  -H 'content-type: application/json' \\
  -d '{"target":"example.com"}'

# 2. An x402 client signs a USDC payment and retries automatically.
#    Any conforming x402 library handles the 402 -> pay -> retry loop.`}
        </pre>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Machine-readable
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {RESOURCES.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.href}
                href={r.href}
                target="_blank"
                className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-4 text-primary" />
                  <ArrowUpRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <span className="text-sm font-medium">{r.label}</span>
                <span className="text-xs text-muted-foreground">{r.desc}</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
