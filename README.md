# Based SEO

Professional-grade SEO data at the cost it takes to fetch it. No $130/month subscriptions for data that costs fractions of a cent per request.

Open source. No markup. Powered by Base, DataForSEO and x402.

## What It Does

Every one of DataForSEO's **531 endpoints**, reachable two ways.

**For agents** - `POST /api/v3/{endpoint}` mirrors DataForSEO's own paths 1:1 and
is paid per request with [x402](https://x402.org) on Base. No account, no API key:
an agent that speaks x402 discovers endpoints at `/api/v3/manifest`, gets a `402`
with the price, signs a USDC payment, and retries. Machine-readable descriptions
live at `/openapi.json` and `/llms.txt`.

**For humans** - a dashboard over the endpoints worth a real UI: keyword research,
SERP analysis, backlinks, site audit, and AI-search visibility (GEO).

Covered API families: SERP, Keywords Data, DataForSEO Labs, Backlinks, OnPage,
Content Analysis, Content Generation, Merchant, App Data, Business Data, Domain
Analytics, AI Optimization, and Appendix.

## Why This Exists

SEO data is a commodity sold at SaaS margins. DataForSEO, one of the best players in this game, costs $0.002–$0.05 per request. The industry charges you $100+/month for a dashboard wrapper on top of it.

Based SEO passes through the exact data cost from DataForSEO. No accounts, no subscriptions, no minimum spend. Just the data you need, when you need it.

## Tech Stack

- [Next.js 16](https://nextjs.org/) - React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [DataForSEO](https://dataforseo.com/) - SEO data provider
- [x402](https://x402.org/) - Pay-per-request API protocol
- [Base](https://base.org/) - L2 for payments (USDC)

## Getting Started

### Prerequisites

- Node.js 18+
- [DataForSEO](https://dataforseo.com/) account

### Setup

```bash
git clone https://github.com/clawfred/based-seo.git
cd based-seo
npm install
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```
DATAFORSEO_USERNAME=your_username
DATAFORSEO_PASSWORD=your_password
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

## Deployment

Deploys to [Vercel](https://vercel.com/) on push to `main`.

Set `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD` as environment variables in your Vercel project settings.

## Project Structure

```
app/          Pages + API routes
components/   React components
lib/          Utilities, types, API helpers
public/       Static assets
docs/         Product documentation
```

## Pricing

Prices are DataForSEO's own per-request cost, passed through. `PLATFORM_MARKUP_BPS`
controls the markup and defaults to `0`. Two adjustments:

- Prices are rounded **up** to the micro-USD (USDC has 6 decimals), so a quote
  never lands under what DataForSEO bills us.
- A **$0.001 floor** per request covers settlement overhead. Batching several
  tasks into one request amortises it: five SERP tasks cost $0.003, not $0.005.

| Endpoint family | Cost per request | Comparison |
| --------------- | ---------------- | ---------- |
| SERP (standard queue) | from $0.0006 | Moz: $99/mo to see who ranks |
| SERP (live) | from $0.002 | |
| Keyword overview / ideas | $0.01–$0.05 | Semrush: $129.95/mo for 500 keywords |
| Backlinks summary | $0.02 | Ahrefs: $99/mo for "limited" lookups |
| Site audit (OnPage) | from $0.0006/page | |

The live price for every endpoint is served at `/api/v3/manifest` and
`/openapi.json`, generated from the registry rather than written by hand.

22 of the 531 endpoints have no published DataForSEO price. They inherit the most
expensive published price in their API group so we never undercharge, and say so
via `priceConfidence: "estimated"` in the manifest and `x-price-confidence` in
the OpenAPI document.

## Data Provider

SEO data powered by [DataForSEO](https://dataforseo.com/). Based SEO is an open source wrapper - we don't compete with DataForSEO, we make their data more accessible. You need your own API credentials to self-host.

## Contributing

Contributions welcome - from humans and AI agents alike. Open an issue or submit a PR.

## License

MIT
