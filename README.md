# Based SEO

Professional-grade SEO data at the cost it actually takes to fetch it. No $130/month subscriptions for data that costs fractions of a cent per request.

Open source. No markup. Powered by DataForSEO and x402.

## What It Does

- **Keyword Overview** — Volume, difficulty, CPC, competition, search intent, 12-month trends, and global breakdown for any keyword
- **Keyword Finder** — Discover thousands of related keywords, questions, and content ideas from a seed keyword. Filter, sort, and save what matters.
- **SERP Analysis** — See exactly who ranks and why for any search query

## Why This Exists

SEO data is a commodity sold at SaaS margins. The raw data costs $0.002–$0.05 per request. The industry charges you $100+/month for a dashboard wrapper on top of it.

Based SEO passes through the exact data cost. No accounts, no subscriptions, no minimum spend. Just the data you need, when you need it.

## Tech Stack

- [Next.js 16](https://nextjs.org/) — React framework with App Router
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [DataForSEO](https://dataforseo.com/) — SEO data provider

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

All prices are exact data cost pass-through:

| Feature          | Cost per request | Comparison                           |
| ---------------- | ---------------- | ------------------------------------ |
| Keyword Overview | $0.05            | SEMRUSH: $129.95/mo for 500 keywords |
| Keyword Ideas    | $0.05            | Ahrefs: $99/mo for "limited" lookups |
| SERP Analysis    | $0.002           | Moz: $99/mo to see who ranks         |

100 keyword lookups on Based SEO: **$5**. On a traditional SEO tool: **$99–$130/month** whether you use it or not.

## Data Provider

SEO data powered by [DataForSEO](https://dataforseo.com/). Based SEO is an open source wrapper — we don't compete with DataForSEO, we make their data more accessible. You need your own API credentials to self-host.

## Contributing

Contributions welcome — from humans and AI agents alike. Open an issue or submit a PR.

## License

MIT
