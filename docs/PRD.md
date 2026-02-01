# Based SEO — Product Requirements Document

> **Status:** Draft — iterating
> **Authors:** Kerem Gurel, Clawfred
> **Last updated:** 2026-01-31

---

## Vision

SEO data is a commodity sold at SaaS margins. SEMRUSH charges $130/mo, Ahrefs $99/mo, Moz $99/mo — for data that costs fractions of a cent per API call. Most indie developers, small teams, and content creators don't need a full dashboard with 200 features. They need specific data points, on demand, at fair prices.

**Based SEO** is an SEO research tool that makes professional-grade keyword and SERP data accessible to everyone — through a clean web app and a pay-per-request API. No expensive subscriptions. Pay only for what you use.

## Origin Story

Kerem was building blog automation workflows with n8n for Onchainsite, using DataForSEO for keyword research. It worked great and was dirt cheap per call. The realization: every major SEO tool is just a UI wrapper around similar data sources, charging 100-1000x the actual data cost. Why not build a modern, focused SEO tool that passes through raw data at cost — with a clean UI for humans and a programmatic API for agents?

---

## Target Users

### Primary

1. **Content Creators / Bloggers** — Want fast, affordable keyword research without a $100+/mo subscription. Use the web app directly.
2. **Indie Developers / Solo Founders** — Building SEO-driven content, need keyword data and SERP analysis without committing to expensive tools.
3. **Small Marketing Teams** — Need professional-grade SEO data for content planning without enterprise pricing.

### Secondary

4. **AI Agents** — Can't sign up for SEMRUSH subscriptions. Use the x402 API to make payments programmatically and query SEO data as part of automated workflows.
5. **Agencies** — Need programmatic SEO data for client work. Pay-per-use is more efficient than per-seat pricing.
6. **No-code/Low-code builders** — n8n, Zapier, Make users who want SEO data in their workflows (via API).

---

## Core Principles

1. **No markup on data** — Pass through exact DataForSEO cost for crypto payments. Stripe payments include a small fee to cover processing costs.
2. **Transparent** — We're a wrapper and we say so. DataForSEO gets full credit.
3. **Zero friction** — No signup required to start researching. Auth only when needed (saving data, purchasing credits).
4. **Clean & focused** — Do fewer things better. Not 200 features — just the ones that matter, done well.
5. **Open source** — The code is fully open. Anyone can self-host with their own DataForSEO credentials.

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│                         Vercel                             │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │   Next.js Pages  │    │   Next.js API Routes         │  │
│  │   (React/Client) │───▶│   (Server-side)              │  │
│  │                  │    │                              │  │
│  │  - Keyword       │    │  /api/keywords/overview      │  │
│  │    Overview      │    │  /api/keywords/ideas         │  │
│  │  - Keyword       │    │  /api/serp                   │  │
│  │    Finder        │    │                              │  │
│  │  - Saved         │    └─────────────┬────────────────┘  │
│  │    Keywords      │                  │                   │
│  └──────────────────┘                  │                   │
│           │                            │                   │
│  ┌────────▼─────────┐                  │                   │
│  │  Auth (TBD)      │                  │                   │
│  └──────────────────┘                  │                   │
└────────────────────────────────────────┼───────────────────┘
                                         │
                                ┌────────▼─────────┐
                                │   DataForSEO     │
                                │   API v3         │
                                └──────────────────┘

│  ┌──────────────────┐                  │                   │
│  │  Neon Postgres   │◀── Drizzle ORM ──┤                   │
│  │  (users, folders,│                  │                   │
│  │   cache, history)│                  │                   │
│  └──────────────────┘                  │                   │

Planned additions:
  - x402 payment middleware (for pay-per-use API access)
  - Stripe integration (for credit purchases)
```

### Tech Stack

| Layer         | Current                                                       | Planned                                       |
| ------------- | ------------------------------------------------------------- | --------------------------------------------- |
| **Framework** | Next.js 16 (App Router, TypeScript)                           | —                                             |
| **Styling**   | Tailwind CSS 4 + shadcn/ui + Radix UI                         | —                                             |
| **Hosting**   | Vercel                                                        | —                                             |
| **Data**      | DataForSEO API v3 (server-side) + 24h DB cache                | —                                             |
| **Auth**      | TBD                                                           | —                                             |
| **Database**  | Neon Postgres + Drizzle ORM (folders, keywords, users, cache) | —                                             |
| **Payments**  | None                                                          | x402 (pay-per-use) + Stripe (credit purchase) |
| **Charts**    | Recharts 3                                                    | —                                             |
| **Animation** | Framer Motion 12                                              | —                                             |

---

## Features

### Built (v0.1 + v0.2) ✅

- [x] Next.js 16 app with App Router and TypeScript
- [x] Keyword Overview page — multi-keyword search (chip input), search volume, KD, CPC, competition, intent, 12-month trends, global volume breakdown, SERP results, related keyword ideas
- [x] Keyword Finder page — seed keyword → related keywords + suggestions with full metrics
- [x] Saved Keywords page — full folder management (create, rename, delete folders; add/remove keywords; folder detail view with keyword table)
- [x] Local storage persistence for saved keywords with cross-tab sync
- [x] Save-to-folder dialog (from Finder and Overview, with inline folder creation)
- [x] Location selector (8 predefined locations: US, UK, CA, DE, FR, AU, JP, BR)
- [x] Dark/light mode with theme toggle (next-themes, persists across sessions)
- [x] Collapsible sidebar navigation (auto-collapses below 1280px, drawer mode on mobile)
- [x] Server-side API routes calling DataForSEO directly (with mock data fallback)
- [x] Loading skeletons on all data-fetching pages (Finder skeleton, Overview inline skeletons)
- [x] Error handling with alert banners (warning for mock data, error for API failures)
- [x] Responsive design (mobile drawer sidebar, hidden table columns on small screens, responsive grids)
- [x] Keyword Finder filters (volume range, KD range, intent type)
- [x] Keyword Finder sorting (keyword, volume, KD, CPC, competition — asc/desc toggle)
- [x] Keyword Finder pagination (20 items/page)
- [x] Keyword Finder group tabs (All, Questions, Related, Variations — with counts)
- [x] Module-level state caching — navigating between pages preserves search results and form state (Overview and Finder)
- [x] Authentication (sign in / sign out, user display in navbar)
- [x] Deployed on Vercel (betterseo-red.vercel.app)

### v0.3 — Database & Credits System

- [x] Database integration — Neon Postgres + Drizzle ORM (schema: users, folders, saved_keywords, search_history, api_cache)
- [x] Persistent saved keywords (synced when signed in, localStorage fallback for guests)
- [x] Server-side API routes for folder CRUD, keyword management, user upsert
- [x] DataForSEO response caching (24h TTL, reduces API costs dramatically)
- [x] Search history recording for authenticated users
- [x] SEO metadata on all pages (title, description, OG, Twitter cards)
- [ ] Credit balance system — users can purchase credits to avoid per-request wallet prompts
- [ ] Credit purchase via crypto (USDC on Base) — at cost, no markup
- [ ] Credit purchase via Stripe — small fee added to cover Stripe processing costs
- [ ] User preferences stored in database (default location, theme)

### v0.4 — More Tools

- [ ] SERP Analysis page (full SERP breakdown, features detection, PAA)
- [ ] Domain Analysis page (overview metrics, top pages, backlinks summary)
- [ ] Keyword gap analysis (domain vs domain)

### v0.5 — x402 API Layer

- [ ] x402 payment middleware on API routes (pay-per-use for web app and agents)
- [ ] Agent-friendly API — agents pay with their wallet via x402, no account needed
- [ ] Public API documentation (OpenAPI/Swagger)
- [ ] TypeScript/Python client SDKs
- [ ] CLI tool (`betterseo keywords "crypto wallets"`)

### v1.0 — Public Launch (based-seo.com)

- [ ] Landing page at based-seo.com
- [ ] Documentation site
- [ ] Production domain + deployment
- [ ] Uptime monitoring & alerting
- [x] Server-side caching layer (cache identical queries for 24h to reduce DataForSEO costs)
- [ ] Rate limiting (IP-based for unauthenticated users)
- [ ] Launch campaign

### Future / Ideas

- [ ] Batch request support (multiple keywords, one payment)
- [ ] Google Trends data integration
- [ ] Content Analysis (relevance, readability)
- [ ] n8n / Zapier / Make integrations
- [ ] Browser extension for quick lookups
- [ ] MCP server integration (AI-native SEO queries)
- [ ] Historical data / trend tracking
- [ ] SEO scoring / recommendations engine
- [ ] Free tier (limited requests/day for unauthenticated users)
- [x] SEO metadata on all pages (title, description, OG tags)
- [ ] Keyboard shortcuts (search focus, navigation)

---

## Functional Requirements

### Keyword Overview Page

The primary research tool. User enters one or more keywords and gets a comprehensive overview.

| Requirement        | Description                                                              | Status   |
| ------------------ | ------------------------------------------------------------------------ | -------- |
| Keyword chip input | Multi-keyword input supporting paste of comma/line-separated values      | ✅ Built |
| Location selector  | Dropdown with 8 predefined locations                                     | ✅ Built |
| Core metrics       | Search volume, keyword difficulty, CPC, competition score, search intent | ✅ Built |
| Trend chart        | 12-month search volume trend (Recharts)                                  | ✅ Built |
| Global volume      | Volume breakdown by country (top countries)                              | ✅ Built |
| SERP results       | Top 10 organic results with position, domain, title, URL                 | ✅ Built |
| Related keywords   | Keyword variations + question-based keywords                             | ✅ Built |
| Multi-keyword view | Results table when searching multiple keywords, click to see detail      | ✅ Built |
| Loading states     | Skeleton loaders while data is fetching                                  | ✅ Built |
| Error handling     | Alert banners for API failures, mock data warnings                       | ✅ Built |
| State persistence  | Navigating away and back preserves all results and form state            | ✅ Built |
| Save to folder     | Save keywords from overview to a folder                                  | ✅ Built |

**Acceptance Criteria:**

- User can type one or more keywords (chip input) and select a location, then see all metrics
- Trend chart renders with accurate monthly data points
- SERP results link to actual URLs and show correct positions
- Related keywords show volume + KD for each suggestion
- If DataForSEO returns an error or empty data, user sees alert banner (not a blank page or crash)
- Loading skeletons appear immediately on search, replaced by real data when ready
- Navigating to Finder or Saved and returning preserves all Overview state

### Keyword Finder Page

Bulk keyword discovery tool. Enter a seed keyword, get a large list of ideas.

| Requirement        | Description                                                               | Status   |
| ------------------ | ------------------------------------------------------------------------- | -------- |
| Seed keyword input | Text field + location selector                                            | ✅ Built |
| Keyword list       | Table of related keyword ideas with metrics                               | ✅ Built |
| Filters            | Filter by: volume range, KD range, intent type                            | ✅ Built |
| Sorting            | Sort by: keyword, volume, KD, CPC, competition (asc/desc)                 | ✅ Built |
| Keyword groups     | Tabs: All Keywords, Questions, Related Keywords, Variations (with counts) | ✅ Built |
| Save to folder     | Select keywords via checkbox + save to a folder (with inline creation)    | ✅ Built |
| Pagination         | 20 items per page with Previous/Next controls                             | ✅ Built |
| Loading states     | FinderSkeleton component with 10 placeholder rows                         | ✅ Built |
| State persistence  | Navigating away and back preserves results, filters, sort, page, group    | ✅ Built |

**Acceptance Criteria:**

- Seed keyword returns keyword ideas with volume, KD, CPC, competition, intent
- Filters update the visible list in real-time (client-side)
- Sorting toggles between ascending/descending on column click
- Keyword group tabs filter by type (questions detected via regex)
- Selected keywords can be saved to an existing or new folder via dialog
- Pagination handles large result sets, resets when filters or groups change
- Navigating to Overview or Saved and returning preserves all Finder state

### Saved Keywords Page

Organize and revisit researched keywords.

| Requirement          | Description                                    | Status   |
| -------------------- | ---------------------------------------------- | -------- |
| Folder grid          | Grid of folder cards with counts               | ✅ Built |
| Create folder        | Create new folders with custom names           | ✅ Built |
| Rename/delete folder | Dropdown menu on each card (rename, delete)    | ✅ Built |
| View keywords        | Click folder to see keyword table with metrics | ✅ Built |
| Remove keywords      | Remove individual keywords from a folder       | ✅ Built |
| Local storage        | Persist folders + keywords in browser          | ✅ Built |
| Cross-tab sync       | Changes sync across browser tabs               | ✅ Built |
| Database sync        | Persist to database (requires auth)            | 🔜 v0.3  |

**Acceptance Criteria:**

- User can create a folder, add keywords from Finder or Overview, and see them with metrics
- Folders persist across page refreshes (local storage now, database in v0.3)
- Folder operations (rename, delete) work with confirmation
- Keywords in folders show the same metrics as in Finder (volume, KD, CPC, etc.)
- Changes propagate across open tabs via storage events

### Navigation & Layout

| Requirement         | Description                                                              | Status   |
| ------------------- | ------------------------------------------------------------------------ | -------- |
| Collapsible sidebar | Sections: Research (Overview, Finder, Saved), Support (Settings)         | ✅ Built |
| Top navbar          | Theme toggle, auth (sign in/out, user display)                           | ✅ Built |
| Dark/light mode     | System preference detection + manual toggle, persists across sessions    | ✅ Built |
| Responsive design   | Mobile drawer sidebar, responsive grids, hidden columns on small screens | ✅ Built |
| Active page state   | Indigo highlight on current page in sidebar                              | ✅ Built |

**Acceptance Criteria:**

- Sidebar collapses to icons on small screens or manual toggle; drawer mode on mobile
- Active page is highlighted in sidebar
- Theme persists across sessions
- Auth state shown in navbar (avatar + name when signed in, sign-in button when not)
- All pages are usable on mobile, optimized for desktop (1024px+)

---

## Non-Functional Requirements

| Category            | Requirement             | Target                                             |
| ------------------- | ----------------------- | -------------------------------------------------- |
| **Performance**     | API route response time | < 3 seconds                                        |
| **Performance**     | Page load (initial)     | < 2 seconds                                        |
| **Performance**     | Client-side navigation  | < 500ms (module-level caching preserves state)     |
| **Accessibility**   | WCAG compliance         | 2.1 AA                                             |
| **Accessibility**   | Keyboard navigation     | Full keyboard support for all interactive elements |
| **Browser support** | Modern browsers         | Chrome, Firefox, Safari, Edge (latest 2 versions)  |
| **Responsive**      | Mobile support          | Usable at 768px+, optimized for 1024px+            |
| **Reliability**     | Uptime target           | 99.5% (depends on Vercel + DataForSEO)             |

---

## Data Flow

```
User → Next.js Page (client) → Next.js API Route (server) → DataForSEO API
                                        │
                                        ▼
                                 Response → Client
                                 (JSON → rendered UI)

Planned layers (inserted between API route and DataForSEO):
  ├── x402 payment verification (for pay-per-use access)
  ├── Credit balance check (for prepaid credit users)
  ├── Caching layer (reduce redundant calls, save cost)
  └── Database writes (usage logging, saved keywords)
```

### API Routes (Current)

| Route                    | Method | Description                    | DataForSEO Endpoint                                                            |
| ------------------------ | ------ | ------------------------------ | ------------------------------------------------------------------------------ |
| `/api/keywords/overview` | POST   | Full keyword analysis          | `v3/dataforseo_labs/google/keyword_overview/live`                              |
| `/api/keywords/ideas`    | POST   | Related keywords + suggestions | `v3/dataforseo_labs/google/related_keywords/live` + `keyword_suggestions/live` |
| `/api/serp`              | POST   | Top 10 organic SERP results    | `v3/serp/google/organic/live/regular`                                          |

All routes use Basic Auth with `DATAFORSEO_USERNAME` and `DATAFORSEO_PASSWORD` environment variables. Default location: 2840 (US), default language: "en". All routes fall back to mock data if credentials are not configured.

---

## Auth

Auth provider: **TBD**.

**What requires auth:**

| Feature                  | Auth Required?                                       |
| ------------------------ | ---------------------------------------------------- |
| Keyword Overview search  | ❌ No                                                |
| Keyword Finder search    | ❌ No                                                |
| Save keywords to folders | ❌ No (local storage) / ✅ Yes (database sync, v0.3) |
| Purchase credits         | ✅ Yes                                               |
| Usage history            | ✅ Yes                                               |
| User preferences (DB)    | ✅ Yes                                               |

---

## Payment Model

BetterSEO has two distinct payment contexts: **humans using the web app** and **agents using the API**.

### For Humans (Web App)

Users sign in (auth provider TBD). Two payment options:

#### Option A: Pay-Per-Use (x402)

- Every API call is wrapped with x402 payment middleware
- User's wallet signs a payment for each request
- Best for occasional users who don't mind wallet prompts
- Price: exact DataForSEO pass-through cost (no markup)

#### Option B: Prepaid Credits

- User purchases a credit balance in advance
- Credits are deducted per API call — no wallet prompt on each request
- Two ways to buy credits:

| Purchase Method | Markup    | Why                                                 |
| --------------- | --------- | --------------------------------------------------- |
| **Crypto**      | None (0%) | USDC on Base — no intermediary fees for us          |
| **Stripe**      | Small fee | Stripe charges us ~2.9% + $0.30; we pass it through |

- Credit balance stored in database, shown in UI
- When credits run out, user is prompted to top up or switch to pay-per-use

#### Why two options?

Pay-per-use (x402) is the crypto-native, zero-trust default — no account needed, no credit balance to manage. But repeatedly approving wallet transactions is friction. Prepaid credits solve this for power users who want a smoother experience. Stripe support makes this accessible to non-crypto users.

### For Agents (API)

- Agents use their wallet to pay via x402 on every API call
- No account creation, no credits system — just wallet + request
- This is the core "agent-friendly" differentiator

### Pricing

All prices are exact DataForSEO pass-through costs:

| Endpoint           | Price per request | DataForSEO source |
| ------------------ | ----------------- | ----------------- |
| Keyword Overview   | $0.05             | DataForSEO Labs   |
| Keyword Ideas      | $0.05             | DataForSEO Labs   |
| Related Keywords   | $0.05             | DataForSEO Labs   |
| Keyword Difficulty | $0.02             | DataForSEO Labs   |
| SERP Organic       | $0.002            | SERP API (Live)   |
| Domain Overview    | $0.05             | DataForSEO Labs   |
| Backlinks Summary  | $0.02             | Backlinks API     |
| On-Page Audit      | $0.02             | On-Page API       |

> **Stripe credit purchases** add a small processing fee on top of the credit value. Crypto purchases are at face value.

### Comparison

|                     | SEMRUSH    | Ahrefs   | BetterSEO                             |
| ------------------- | ---------- | -------- | ------------------------------------- |
| 100 keyword lookups | $129.95/mo | $99/mo   | ~$5.00 (credits or pay-per-use)       |
| 1,000 SERP queries  | included   | included | ~$2.00                                |
| Account required    | Yes        | Yes      | No (web app free tier), No (x402 API) |
| AI agent compatible | No         | No       | Yes (x402 API)                        |
| Open source         | No         | No       | Yes                                   |

---

## Database (Implemented ✅)

**Provider:** Neon Postgres (free tier, Vercel integration) + Drizzle ORM

### Schema (live in `db/schema.ts`)

```
users
  id: text PK (auth provider user id)
  email: text?
  wallet_address: text?
  preferences: jsonb (defaultLocation, theme)
  created_at: timestamptz
  updated_at: timestamptz

folders
  id: text PK (nanoid)
  user_id: text FK → users.id (cascade delete)
  name: text
  created_at: timestamptz
  updated_at: timestamptz

saved_keywords
  id: text PK (nanoid)
  folder_id: text FK → folders.id (cascade delete)
  keyword: text
  location_code: int?
  volume: int
  kd: int
  cpc: real
  competition: real
  intent: text
  trend: jsonb (number[])
  saved_at: timestamptz

search_history
  id: text PK (nanoid)
  user_id: text FK → users.id (cascade delete)
  query: text
  tool: text (overview | finder)
  location_code: int?
  searched_at: timestamptz

api_cache
  cache_key: text PK (SHA-256 hash)
  data: jsonb
  fetched_at: timestamptz
  expires_at: timestamptz
```

### API Routes

| Route                       | Methods            | Description                       |
| --------------------------- | ------------------ | --------------------------------- |
| `/api/folders`              | GET, POST          | List/create folders               |
| `/api/folders/:id`          | GET, PATCH, DELETE | Get/rename/delete folder          |
| `/api/folders/:id/keywords` | POST, DELETE       | Add/remove keywords               |
| `/api/users`                | POST               | Upsert user (auto-called on auth) |
| `/api/search-history`       | GET, POST          | Recent searches                   |

### Future tables (not yet implemented)

```
credit_transactions (for v0.3 credits system)
  id, user_id, amount, method (crypto/stripe), stripe_session_id?, tx_hash?, status, created_at

usage_log (for v0.5 billing)
  id, user_id?, endpoint, keyword, location_code, cost, payment_method, created_at
```

---

## Competitive Landscape

| Tool                | Model                              | Price                       | Agent-friendly | Open Source |
| ------------------- | ---------------------------------- | --------------------------- | -------------- | ----------- |
| SEMRUSH             | Monthly sub                        | $129.95+/mo                 | ❌             | ❌          |
| Ahrefs              | Monthly sub                        | $99+/mo                     | ❌             | ❌          |
| Moz                 | Monthly sub                        | $99+/mo                     | ❌             | ❌          |
| DataForSEO (direct) | Pay-per-use                        | ~$0.002-0.05/req            | ✅ (API key)   | ❌          |
| **BetterSEO**       | **Free web app + pay-per-use API** | **Free / ~$0.002-0.05/req** | **✅ (x402)**  | **✅**      |

Our differentiation: clean UI without the bloat, transparent pricing, crypto-native payments, agent-first API, fully open source.

---

## Reliability & Fair Billing

### Core Principle: Users never pay for failed requests.

We use x402's two-step **verify-then-settle** flow:

1. Client sends payment signature with request
2. x402 facilitator **verifies** the signature (funds are locked, not moved)
3. We call DataForSEO
4. **Success** → settle payment → return data
5. **Failure** → don't settle → user keeps their USDC

For credit-based payments, credits are only deducted after a successful DataForSEO response.

### Pre-flight Checks

- On startup + every 5 minutes: check DataForSEO account balance
- If balance < minimum threshold → return `503 Service Unavailable` before any payment is attempted
- Periodic DataForSEO API health ping
- `/health` endpoint publicly shows: DataForSEO status, account balance status (above/below threshold), API latency

### Failure Scenarios

| Scenario                                          | What happens                                                             | User charged? |
| ------------------------------------------------- | ------------------------------------------------------------------------ | ------------- |
| DataForSEO out of credits                         | 503 before payment                                                       | ❌ No         |
| DataForSEO API down                               | 503 before payment (detected by health check) or 504 timeout → no settle | ❌ No         |
| Bad query (invalid keyword, unsupported location) | DataForSEO returns error → no settle / no credit deduction               | ❌ No         |
| Our server crashes mid-request                    | Payment never settled (verify ≠ settle) / credits not deducted           | ❌ No         |
| DataForSEO returns data successfully              | Payment settled / credits deducted, data returned                        | ✅ Yes        |

### Transparency

- Every successful response includes `x-dataforseo-cost` header (actual cost of that request)
- Every successful response includes `x-payment-method` header (x402, credits, free_tier)
- Failed requests return `x-payment-settled: false` header
- `/health` endpoint is public and unauthenticated

---

## Milestones

| Version  | Scope                                                                                                                                                                    | Status  |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| **v0.1** | Core UI + DataForSEO integration — Keyword Overview + Finder with real data, dark/light mode, sidebar nav                                                                | ✅ Done |
| **v0.2** | Polish — loading skeletons, error handling, responsive design, Saved Keywords with local storage, filters/sorting/pagination in Finder, auth, module-level state caching | ✅ Done |
| **v0.3** | Database + Credits — persistent saved keywords, credit balance system, crypto + Stripe credit purchases, auth provider integration                                       | 🔜 Next |
| **v0.4** | More Tools — SERP Analysis page, Domain Analysis page, keyword gap analysis                                                                                              | Planned |
| **v0.5** | x402 API Layer — pay-per-use middleware, agent-friendly API, docs, SDKs, CLI                                                                                             | Planned |
| **v1.0** | Public launch at betterseo.xyz — landing page, docs, caching layer, rate limiting, monitoring, launch campaign                                                           | Planned |

---

## Open Questions

1. **Auth provider?** TBD. Need sign-in (for credits, preferences, saved keywords sync). Options: social logins, wallet, or other.

2. **Database choice?** Convex (real-time, TS-native), Supabase (Postgres, auth built-in), or PlanetScale? Need to weigh DX, cost, and whether we need real-time features.

3. **Stripe fee amount?** What exact percentage/flat fee do we add on Stripe credit purchases? Pass through Stripe's exact fee (2.9% + $0.30), or round up to a clean number (e.g., 5%)?

4. **Credit minimum purchase?** What's the minimum credit top-up? $1? $5? $10?

5. **Free tier details?** How many free requests per day for unauthenticated users? Or is the web app free until the x402/credits system is live?

6. **DataForSEO relationship?** Should we reach out to them? They might want to promote this as an integration example. Could lead to partnership / discounted rates.

7. **Domain:** based-seo.com — under Kerem's name or a shared entity?

8. **Caching strategy?** DataForSEO data doesn't change hourly. Caching identical queries for 24h could dramatically reduce costs. Server-side (Redis/KV) vs in-memory?

9. **Rate limiting for web app?** Without auth, how do we prevent abuse? IP-based limits? CAPTCHA?

---

## Success Metrics

- **Web app:** Daily active users, searches per day, saved keywords created
- **Payments:** Credit purchases (crypto vs Stripe split), x402 transactions, revenue
- **API (future):** Requests per day, unique agent wallets, revenue
- **Technical:** Page load time, API response time, error rate, uptime
- **Growth:** GitHub stars, social mentions, organic traffic to betterseo.xyz
- **Community:** PRs, issues, self-hosted instances

---

_This is a living document. Edit freely._
