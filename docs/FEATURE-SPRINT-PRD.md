# Based SEO — Feature Sprint PRD

> **Status:** Ready for Development  
> **Author:** Marketer (AI)  
> **Date:** 2026-02-26  
> **Source:** PM Research Brief + Existing PRD Analysis

---

## Executive Summary

This document defines the next development sprint for Based SEO, translating the PM's research findings into concrete, prioritized features. Each feature is independently deployable, powered by DataForSEO endpoints, and designed to maximize user acquisition while reinforcing Based SEO's core positioning: **affordable, transparent, pay-per-use SEO data**.

**Sprint Goal:** Ship features 1-4 to establish competitive parity with Ubersuggest/Mangools, then differentiate with features 5-6 (GEO + Browser Extension) that no affordable competitor offers.

---

## 1. Prioritized Feature List (Build Order)

### Feature 1: Backlinks Summary

**One-liner:** See any domain's complete backlink profile — referring domains, anchor texts, and link growth — for $0.02.

**User Story:**  
*As an indie founder researching competitors, I want to see their backlink profile so that I can identify link-building opportunities and understand their authority.*

**DataForSEO Endpoint(s):**
- `backlinks/summary` — $0.02/request (full profile summary)
- `backlinks/referring_domains/live` — $0.002/domain (optional deep-dive)

**Estimated Cost to User:** $0.02 per domain lookup (summary); $0.02 + $0.002×n for detailed referring domains list

**UI Spec:**
- **Page:** `/backlinks` (new top-level route)
- **Nav:** Add "Backlinks" under Research section in sidebar (below Saved Keywords)
- **Components:**
  - Domain input field (single domain, e.g., "competitor.com")
  - Summary card grid showing:
    - Total backlinks count
    - Referring domains count
    - Domain rank / Trust score
    - Dofollow/nofollow ratio
    - New/lost links (30 days)
  - Anchor text distribution chart (horizontal bar)
  - Referring domains table (domain, backlinks from it, dofollow %, first seen)
  - "Deep Dive" toggle to load full referring domains list (warns about additional cost)

**API Route:**
- `POST /api/backlinks/summary` — accepts `{ domain: string, includeReferrers?: boolean }`
- Returns: summary metrics + optional top 100 referring domains

**Acceptance Criteria:**
- [ ] User enters domain, sees backlink summary within 3 seconds
- [ ] All metrics from DataForSEO `backlinks/summary` displayed in cards
- [ ] Anchor text chart renders with top 10 anchors
- [ ] Referring domains table shows top 20 by default
- [ ] Cost displayed before request ("This lookup costs $0.02")
- [ ] Error state for invalid domains or API failures

**Estimated Complexity:** **S** (Small) — Straightforward API wrapper + new page, no complex state

---

### Feature 2: Domain Overview

**One-liner:** Instant competitive intel — see any domain's organic traffic, top keywords, and authority score.

**User Story:**  
*As a content creator evaluating competitors, I want to see a domain's overall SEO metrics so that I can understand how strong they are and what keywords drive their traffic.*

**DataForSEO Endpoint(s):**
- `dataforseo_labs/google/domain_rank_overview/live` — $0.02/request

**Estimated Cost to User:** $0.02 per domain lookup

**UI Spec:**
- **Page:** `/domain` (new top-level route)
- **Nav:** Add "Domain Analysis" under Research section (below Backlinks)
- **Components:**
  - Domain input field with location selector
  - Overview card grid:
    - Domain Rank score
    - Organic traffic estimate
    - Organic keywords count
    - Backlinks count (link to Backlinks page)
    - Avg. position
    - Traffic cost value
  - Traffic trend chart (12-month line chart, similar to keyword trends)
  - Top organic keywords preview table (keyword, position, volume, traffic %)
  - CTAs: "See all keywords →" (links to Competitor Keywords feature)

**API Route:**
- `POST /api/domain/overview` — accepts `{ domain: string, locationCode?: number }`
- Returns: domain rank overview metrics + top 10 keywords

**Acceptance Criteria:**
- [ ] User enters domain, sees overview metrics within 3 seconds
- [ ] All domain_rank_overview fields mapped to UI cards
- [ ] Traffic trend chart renders with 12 data points
- [ ] Top keywords table shows position, volume, URL
- [ ] Empty state for domains with no organic presence
- [ ] Cross-links to Backlinks page work correctly

**Estimated Complexity:** **S** (Small) — Similar pattern to existing Overview page

---

### Feature 3: Competitor Keywords

**One-liner:** Spy on any domain's organic rankings — see every keyword they rank for and steal their best opportunities.

**User Story:**  
*As an SEO-focused founder, I want to see what keywords my competitors rank for so that I can identify content gaps and target keywords they've already validated.*

**DataForSEO Endpoint(s):**
- `dataforseo_labs/google/ranked_keywords/live` — $0.01/request (up to 1000 keywords)

**Estimated Cost to User:** $0.01 per lookup (1000 keywords included)

**UI Spec:**
- **Page:** `/domain/keywords` (nested under domain, or accessible from Domain Overview)
- **Nav:** Accessible via Domain Overview "See all keywords" link
- **Components:**
  - Domain input + location selector (pre-filled if coming from Domain Overview)
  - Results table with columns:
    - Keyword
    - Position
    - Search Volume
    - Traffic (estimated)
    - URL (ranking page)
    - KD
    - CPC
  - Filters: Position range (1-10, 11-20, etc.), volume range, KD range
  - Sorting: All columns sortable
  - Pagination: 50 per page
  - Bulk select + "Save to Folder" action
  - Export to CSV button

**API Route:**
- `POST /api/domain/keywords` — accepts `{ domain: string, locationCode?: number, limit?: number, offset?: number }`
- Returns: array of ranked keywords with metrics

**Acceptance Criteria:**
- [ ] User enters domain, sees up to 1000 ranked keywords
- [ ] All filters work client-side without additional API calls
- [ ] Sorting works on all columns
- [ ] Pagination displays correctly
- [ ] Selected keywords can be saved to existing folders
- [ ] CSV export generates valid file with all columns

**Estimated Complexity:** **M** (Medium) — Requires filtering, pagination, bulk actions (similar to Keyword Finder)

---

### Feature 4: Keyword Gap Analysis

**One-liner:** Find keywords your competitors rank for that you don't — instant content opportunities.

**User Story:**  
*As a site owner, I want to compare my domain against competitors so that I can discover keywords I'm missing and prioritize new content.*

**DataForSEO Endpoint(s):**
- `dataforseo_labs/google/domain_intersection/live` — $0.01/request

**Estimated Cost to User:** $0.01 per comparison (2-3 domains)

**UI Spec:**
- **Page:** `/domain/gap` (new route)
- **Nav:** Add "Keyword Gap" as sub-item under Domain Analysis
- **Components:**
  - Input section:
    - "Your domain" field
    - "Competitor domains" (up to 3, chip input style)
    - Location selector
  - Results tabs:
    - "Missing" — keywords competitors have, you don't
    - "Weak" — keywords you rank lower for
    - "Shared" — keywords both rank for
  - Results table per tab:
    - Keyword
    - Your position (or "—")
    - Competitor positions
    - Volume
    - KD
    - Traffic potential
  - Bulk save + export actions

**API Route:**
- `POST /api/domain/gap` — accepts `{ yourDomain: string, competitors: string[], locationCode?: number }`
- Returns: structured keyword gap data with all intersections

**Acceptance Criteria:**
- [ ] User can compare their domain vs up to 3 competitors
- [ ] "Missing" tab shows keywords user doesn't rank for
- [ ] "Weak" tab shows keywords where user ranks worse
- [ ] All tabs show volume, KD, positions
- [ ] Empty competitor positions display "—"
- [ ] Results can be saved to folders or exported

**Estimated Complexity:** **M** (Medium) — Multi-domain comparison logic, tab state management

---

### Feature 5: Google Trends Integration

**One-liner:** See real-time search trends — know when to publish for maximum impact.

**User Story:**  
*As a content strategist, I want to see Google Trends data alongside keyword metrics so that I can time my content for trending topics.*

**DataForSEO Endpoint(s):**
- `keywords_data/google_trends/explore/live` — $0.01/request

**Estimated Cost to User:** $0.01 per trend lookup

**UI Spec:**
- **Integration:** Add to existing Keyword Overview page (not a new page)
- **Components:**
  - New "Trends" section below the existing 12-month chart
  - Google Trends graph (5-year timeline by default)
  - Interest by region map (US states or countries)
  - Related queries section (rising + top)
  - "Trend Status" badge on keyword cards: 🔥 Trending, 📈 Rising, ➡️ Stable, 📉 Declining

**API Route:**
- `POST /api/keywords/trends` — accepts `{ keywords: string[], geo?: string, timeRange?: string }`
- Returns: trends data, regional interest, related queries

**Acceptance Criteria:**
- [ ] Trends section appears on Keyword Overview below existing chart
- [ ] 5-year trend line renders correctly
- [ ] Regional interest shows top 5 regions
- [ ] Related queries show "rising" and "top" lists
- [ ] Trend badge appears on keyword summary cards
- [ ] Toggle to show/hide trends section (default: collapsed to save space)

**Estimated Complexity:** **S** (Small) — Adding section to existing page, straightforward data mapping

---

### Feature 6: GEO / AI Search Tracking

**One-liner:** Track your brand visibility in ChatGPT, Claude, and Perplexity — the first affordable GEO tool.

**User Story:**  
*As a forward-thinking marketer, I want to know if my brand appears in AI-generated answers so that I can optimize for the new search paradigm.*

**DataForSEO Endpoint(s):**
- `ai_optimization/llm_scraper/live` — TBD pricing (new API, assume ~$0.05/query)

**Estimated Cost to User:** ~$0.05 per AI search query

**UI Spec:**
- **Page:** `/geo` (new top-level route)
- **Nav:** Add "GEO Tracker" under Research section with ✨ badge (new feature indicator)
- **Components:**
  - Query input:
    - Search query field (what users might ask AI)
    - Brand/domain to track
    - AI platform selector: ChatGPT, Claude, Perplexity (checkboxes, multi-select)
  - Results display:
    - Per-platform cards showing:
      - AI response preview (truncated)
      - Brand mention: Yes/No with highlight
      - Position in response (if mentioned)
      - Sources cited (if available)
    - Comparison view: side-by-side AI responses
  - Historical tracking (future): track same query over time
  - Recommendations panel: "To improve AI visibility, consider..."

**API Route:**
- `POST /api/geo/search` — accepts `{ query: string, brand: string, platforms: string[] }`
- Returns: AI responses per platform, mention detection, source citations

**Acceptance Criteria:**
- [ ] User can query across 1-3 AI platforms
- [ ] Response shows AI answer with brand mentions highlighted
- [ ] Clear indicator if brand is/isn't mentioned
- [ ] Source citations extracted when available
- [ ] Error handling for platform timeouts/failures
- [ ] Cost clearly displayed per platform before search

**Estimated Complexity:** **M** (Medium) — New paradigm, need to handle multiple async AI queries, mention detection logic

---

### Feature 7: Bulk Keyword Processing

**One-liner:** Analyze hundreds of keywords at once — paste your list, get metrics for all.

**User Story:**  
*As an agency SEO, I want to analyze a large list of keywords in one request so that I can efficiently process client keyword lists.*

**DataForSEO Endpoint(s):**
- `dataforseo_labs/google/keyword_overview/live` — $0.05 per keyword (already used)
- Batch endpoint: send multiple keywords in single request

**Estimated Cost to User:** $0.05 × number of keywords (volume discount possible)

**UI Spec:**
- **Integration:** Enhance existing Keyword Overview page
- **Components:**
  - Increase chip input limit from current to 100 keywords
  - Add "Paste from CSV" option (modal with textarea)
  - Progress indicator for bulk processing
  - Results table view (default for 10+ keywords)
  - Bulk export to CSV
  - "Save all to folder" action

**API Route:**
- Modify existing `POST /api/keywords/overview` to handle arrays up to 100
- Add progress callback support for UI updates

**Acceptance Criteria:**
- [ ] User can paste up to 100 keywords at once
- [ ] Progress bar shows processing status
- [ ] Results display in table format for bulk queries
- [ ] Total cost shown before processing
- [ ] Export includes all metrics for all keywords
- [ ] Performance: 100 keywords complete within 30 seconds

**Estimated Complexity:** **S** (Small) — Enhancement to existing feature, mainly UI changes

---

### Feature 8: Historical Keyword Data

**One-liner:** See 3 years of search volume history — spot seasonal trends and long-term growth.

**User Story:**  
*As a content planner, I want to see historical search volume trends so that I can identify seasonal keywords and plan content calendars.*

**DataForSEO Endpoint(s):**
- `dataforseo_labs/google/historical_search_volume/live` — $0.01/keyword

**Estimated Cost to User:** $0.01 per keyword (additional to overview)

**UI Spec:**
- **Integration:** Add to Keyword Overview page
- **Components:**
  - "Extended History" toggle on trend chart
  - When enabled: 36-month chart (vs current 12-month)
  - Seasonality indicator: "Peaks in: November-December"
  - Year-over-year growth percentage
  - Downloadable data points

**API Route:**
- `POST /api/keywords/history` — accepts `{ keywords: string[], locationCode?: number }`
- Returns: 36+ months of search volume data

**Acceptance Criteria:**
- [ ] Toggle switches chart from 12 to 36 months
- [ ] Seasonality detection shows peak months
- [ ] YoY growth calculated and displayed
- [ ] Additional cost clearly communicated before toggle
- [ ] Data can be exported

**Estimated Complexity:** **S** (Small) — Chart enhancement, new endpoint, simple integration

---

### Feature 9: Browser Extension (MVP)

**One-liner:** Get keyword metrics while you browse — right-click any keyword, see volume instantly.

**User Story:**  
*As a content researcher, I want to check keyword metrics without leaving the page I'm reading so that I can efficiently evaluate topics while researching.*

**DataForSEO Endpoint(s):**
- Uses existing `keywords/overview` endpoint via API

**Estimated Cost to User:** Same as web app (~$0.05 per lookup)

**UI Spec:**
- **Platform:** Chrome Extension (Firefox later)
- **Components:**
  - Browser toolbar icon showing credit balance
  - Right-click context menu: "Check keyword with Based SEO"
  - Popup showing:
    - Quick metrics: Volume, KD, CPC
    - "View full details →" link to web app
    - Credit balance
  - Optional: Inline highlight metrics on Google search pages

**Extension Structure:**
- Manifest V3
- Background service worker for API calls
- Content script for context menu
- Popup UI (React, reuse shadcn components)

**Acceptance Criteria:**
- [ ] Extension installs from Chrome Web Store
- [ ] Right-click shows "Check keyword" option
- [ ] Popup displays keyword metrics within 2 seconds
- [ ] Requires same auth as web app (shared credits)
- [ ] Offline state handled gracefully
- [ ] Link to web app opens correct keyword in new tab

**Estimated Complexity:** **L** (Large) — New platform, Chrome APIs, separate build pipeline, store submission

---

### Feature 10: Simple Site Audit

**One-liner:** Instant technical SEO health check — find broken links, missing titles, and slow pages.

**User Story:**  
*As a site owner, I want to quickly audit my site's technical SEO so that I can fix issues hurting my rankings.*

**DataForSEO Endpoint(s):**
- `on_page/task_post` — Queue audit (variable cost based on pages)
- `on_page/summary` — Get results
- `on_page/pages` — Page-level details

**Estimated Cost to User:** ~$0.02 base + $0.001 per page crawled

**UI Spec:**
- **Page:** `/audit` (new top-level route)
- **Nav:** Add "Site Audit" under Research section
- **Components:**
  - URL input (homepage, we crawl from there)
  - Crawl settings: Max pages (10/50/100), include subdomains
  - Progress indicator (crawl takes time)
  - Results dashboard:
    - Health score (0-100)
    - Issues by severity (Critical, Warning, Notice)
    - Issue categories: Indexability, Content, Links, Performance
  - Issues list: Expandable cards with affected URLs
  - Export audit report (PDF or CSV)

**API Route:**
- `POST /api/audit/start` — Queue crawl, returns task ID
- `GET /api/audit/status/:taskId` — Poll for completion
- `GET /api/audit/results/:taskId` — Get full results

**Acceptance Criteria:**
- [ ] User enters URL, crawl begins with progress indicator
- [ ] Results display health score and categorized issues
- [ ] Each issue shows affected URLs
- [ ] User can re-run audit
- [ ] Cost estimate shown before starting (based on crawl settings)
- [ ] Results persist for 24 hours (cached)

**Estimated Complexity:** **L** (Large) — Async task management, polling, complex results parsing

---

## 2. Positioning Copy (Marketing Hooks)

| Feature | Marketing Hook |
|---------|----------------|
| **Backlinks Summary** | "See who links to your competitors — for less than a coffee" |
| **Domain Overview** | "X-ray any website's SEO in 3 seconds" |
| **Competitor Keywords** | "Steal your competitor's best keywords (ethically)" |
| **Keyword Gap** | "Find the keywords you're missing — your competitors already found them" |
| **Google Trends** | "Publish at the perfect moment — trends data built-in" |
| **GEO Tracker** | "The first tool that tracks your brand in ChatGPT" |
| **Bulk Processing** | "100 keywords, one click, $5" |
| **Historical Data** | "3 years of data. Spot seasonality. Plan smarter." |
| **Browser Extension** | "Keywords Everywhere, but actually transparent" |
| **Site Audit** | "Find what's broken before Google does" |

---

## 3. Landing Page Feature Section

### Section Headline
**"Everything you need. Nothing you don't. Pay only for what you use."**

### Feature Cards

**1. 🔍 Keyword Intelligence**  
*Deep keyword research with search volume, difficulty, trends, and intent — at $0.05 per lookup, not $99/month.*

**2. 🔗 Backlink Analysis**  
*See any domain's complete link profile. Referring domains, anchor texts, link growth — the data Ahrefs charges $99/month for, at $0.02/lookup.*

**3. 🏆 Competitor Research**  
*Discover what keywords competitors rank for, find gaps in your content, and steal their best opportunities. All for pennies.*

**4. 🤖 GEO Tracking (NEW)**  
*Track your brand visibility in ChatGPT, Claude, and Perplexity. The only affordable tool for AI search optimization.*

**5. 📈 Trend Intelligence**  
*Google Trends data integrated into every search. Know when to publish for maximum impact.*

**6. ⚡ Browser Extension**  
*Check any keyword without leaving your page. Right-click research, instant metrics.*

---

### Comparison Callout vs Semrush/Ahrefs

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE REAL COST OF SEO DATA                    │
├─────────────────────┬──────────────┬──────────────┬─────────────┤
│                     │   Semrush    │    Ahrefs    │  Based SEO  │
├─────────────────────┼──────────────┼──────────────┼─────────────┤
│ 100 keyword lookups │  $129.95/mo  │   $99/mo     │    $5.00    │
│ 50 backlink checks  │   included   │   included   │    $1.00    │
│ 1,000 SERP queries  │   included   │   included   │    $2.00    │
│ Annual cost         │   $1,559+    │   $1,188+    │   ~$50*     │
├─────────────────────┴──────────────┴──────────────┴─────────────┤
│ *Based on typical indie hacker usage (200 lookups/month)        │
│                                                                 │
│ Based SEO: Same data. 95% cheaper. Open source.                 │
└─────────────────────────────────────────────────────────────────┘
```

**Subhead:** *"We're a wrapper around DataForSEO and we say so. You pay what we pay — no 100x markup."*

---

## 4. Build Priority Reasoning

### Why This Order?

**Features 1-4 (Backlinks → Domain → Competitor Keywords → Keyword Gap): Close the Gap**

The PM research clearly shows these are "expected features" that users coming from Ubersuggest or Mangools will look for. Without them, Based SEO feels incomplete. Reddit threads consistently mention: "I just need keyword research and maybe backlink data" — we have keywords, we need backlinks.

Build order rationale:
1. **Backlinks first** because it's the most-requested missing feature and has the simplest implementation (single endpoint, straightforward data)
2. **Domain Overview second** because it naturally leads into competitor analysis and provides the "entry point" to the domain research flow
3. **Competitor Keywords third** because it answers the #1 competitor research question ("what do they rank for?")
4. **Keyword Gap fourth** because it synthesizes 1-3 into actionable intelligence

**Feature 5 (Google Trends): Low-Hanging Enhancement**

$0.01 per request, trivial to implement, immediately valuable. Adding it to existing Keyword Overview makes our core feature more competitive with zero new navigation complexity. The PM noted users want "timing insights" — this delivers.

**Feature 6 (GEO Tracker): Blue Ocean Differentiation**

This is the PM's strongest insight: "No affordable GEO tools exist." Current GEO tools (Peec AI, AthenaHQ, etc.) are enterprise-priced at $500+/month. DataForSEO has the AI Optimization API but nobody has built a consumer UI.

**Based SEO can be first.** This is our "indie hacker's GEO tool" positioning. Even if the feature is MVP-quality, being first matters. Build it after the table-stakes features so we have credibility when we launch it.

**Features 7-8 (Bulk + Historical): Power User Retention**

These are incremental improvements that don't acquire new users but retain power users. Build them when we have users who are asking for them.

**Feature 9 (Browser Extension): Growth Loop**

The Keywords Everywhere model proves browser extensions can reach millions of users. It's a separate codebase and Chrome store submission, which is why it's ranked 9 — but it has high leverage for user acquisition once built.

**Feature 10 (Site Audit): Crowded Space, Build Last**

Every SEO tool has site audits. It's expected but not differentiating. The on_page API is more complex (async tasks, polling, large result sets). Build it last unless user feedback demands it sooner.

---

### Quick Reference Table

| Priority | Feature | PM Signal | Differentiator? | DataForSEO Cost | Complexity |
|----------|---------|-----------|-----------------|-----------------|------------|
| 1 | Backlinks | "Expected feature gap" | No (table stakes) | $0.02 | S |
| 2 | Domain Overview | "Competitor analysis baseline" | No | $0.02 | S |
| 3 | Competitor Keywords | "High-value feature" | No | $0.01 | M |
| 4 | Keyword Gap | "High-value feature" | No | $0.01 | M |
| 5 | Google Trends | "Easy, rounds out keyword research" | Low | $0.01 | S |
| 6 | GEO Tracker | "Blue ocean opportunity" | **YES — FIRST** | ~$0.05 | M |
| 7 | Bulk Processing | "Incremental improvement" | No | $0.05×n | S |
| 8 | Historical Data | "Incremental improvement" | Low | $0.01 | S |
| 9 | Browser Extension | "Viral potential" | Medium | $0.05 | L |
| 10 | Site Audit | "Expected but crowded" | No | Variable | L |

---

### Recommended Sprint Chunks

**Sprint A (Ship in 1-2 weeks):**  
Features 1-2: Backlinks + Domain Overview  
*Goal: Establish credibility as a "real" SEO tool*

**Sprint B (Ship in 2-3 weeks):**  
Features 3-4: Competitor Keywords + Keyword Gap  
*Goal: Complete the competitive analysis suite*

**Sprint C (Ship in 1 week):**  
Feature 5: Google Trends Integration  
*Goal: Enhance existing core feature*

**Sprint D (Ship in 2-3 weeks):**  
Feature 6: GEO Tracker  
*Goal: DIFFERENTIATE — launch as "first affordable GEO tool"*

**Sprint E (Polish, ship as capacity allows):**  
Features 7-8: Bulk + Historical  
*Goal: Power user features*

**Sprint F (Separate initiative):**  
Feature 9: Browser Extension  
*Goal: Growth channel*

**Sprint G (If demanded):**  
Feature 10: Site Audit  
*Goal: Feature completeness*

---

## Appendix: DataForSEO Endpoint Quick Reference

| Feature | Endpoint | Est. Cost |
|---------|----------|-----------|
| Backlinks Summary | `backlinks/summary` | $0.02 |
| Backlinks List | `backlinks/referring_domains/live` | $0.002/domain |
| Domain Overview | `dataforseo_labs/google/domain_rank_overview/live` | $0.02 |
| Competitor Keywords | `dataforseo_labs/google/ranked_keywords/live` | $0.01 |
| Keyword Gap | `dataforseo_labs/google/domain_intersection/live` | $0.01 |
| Google Trends | `keywords_data/google_trends/explore/live` | $0.01 |
| GEO/AI Search | `ai_optimization/llm_scraper/live` | TBD (~$0.05) |
| Historical Volume | `dataforseo_labs/google/historical_search_volume/live` | $0.01 |
| Site Audit | `on_page/*` | ~$0.02 + $0.001/page |

---

*This PRD is ready for engineering handoff. Each feature can be built and shipped independently. Prioritize in order unless user feedback or business needs dictate otherwise.*
