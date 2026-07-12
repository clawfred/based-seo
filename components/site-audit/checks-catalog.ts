/**
 * A curated catalog of the OnPage `checks` we surface as issues. DataForSEO
 * returns dozens of check keys on `page_metrics.checks`; each value is the count
 * of crawled pages that tripped that check. We only name and rank the ones that
 * matter for an SEO audit, grouped into categories, so the Issues tab reads like
 * a prioritized to-do list instead of a raw dump.
 */

export type Severity = "critical" | "warning" | "notice";

export type IssueCategory = "Crawlability" | "Content" | "Meta" | "Performance" | "Links";

export interface CheckDef {
  /** Key as it appears on `page_metrics.checks`. */
  key: string;
  label: string;
  description: string;
  severity: Severity;
  category: IssueCategory;
}

/**
 * Ordered roughly by how much each issue hurts. Only keys present here are shown;
 * unknown checks from the API are ignored so new upstream flags never crash us.
 */
export const CHECK_CATALOG: CheckDef[] = [
  // Crawlability
  {
    key: "is_5xx_code",
    label: "Server errors (5xx)",
    description: "Pages returning a 5xx status the crawler couldn't load.",
    severity: "critical",
    category: "Crawlability",
  },
  {
    key: "is_4xx_code",
    label: "Client errors (4xx)",
    description: "Pages returning a 4xx status, typically 404 not-found.",
    severity: "critical",
    category: "Crawlability",
  },
  {
    key: "is_broken",
    label: "Broken pages",
    description: "Pages that could not be reached or rendered.",
    severity: "critical",
    category: "Crawlability",
  },
  {
    key: "canonical_to_broken",
    label: "Canonical to broken URL",
    description: "A canonical tag points at a broken page.",
    severity: "critical",
    category: "Crawlability",
  },
  {
    key: "redirect_loop",
    label: "Redirect loops",
    description: "Pages caught in a redirect that never resolves.",
    severity: "critical",
    category: "Crawlability",
  },
  {
    key: "recursive_canonical",
    label: "Recursive canonical",
    description: "A canonical chain that points back on itself.",
    severity: "warning",
    category: "Crawlability",
  },
  {
    key: "canonical_to_redirect",
    label: "Canonical to redirect",
    description: "A canonical tag points at a redirecting URL.",
    severity: "warning",
    category: "Crawlability",
  },
  {
    key: "is_orphan_page",
    label: "Orphan pages",
    description: "Pages with no internal links pointing to them.",
    severity: "warning",
    category: "Crawlability",
  },
  {
    key: "no_favicon",
    label: "Missing favicon",
    description: "Pages that don't declare a favicon.",
    severity: "notice",
    category: "Crawlability",
  },

  // Links
  {
    key: "broken_links",
    label: "Broken internal links",
    description: "Links pointing to pages that return an error.",
    severity: "critical",
    category: "Links",
  },
  {
    key: "broken_resources",
    label: "Broken resources",
    description: "Images, scripts, or styles that fail to load.",
    severity: "warning",
    category: "Links",
  },
  {
    key: "links_relation_conflict",
    label: "Link relation conflicts",
    description: "A link is both dofollow and nofollow.",
    severity: "notice",
    category: "Links",
  },
  {
    key: "redirect_chain",
    label: "Redirect chains",
    description: "Links that pass through multiple redirects.",
    severity: "warning",
    category: "Links",
  },
  {
    key: "https_to_http_links",
    label: "HTTPS → HTTP links",
    description: "Secure pages linking out to insecure URLs.",
    severity: "warning",
    category: "Links",
  },

  // Meta
  {
    key: "no_title",
    label: "Missing title",
    description: "Pages without a <title> tag.",
    severity: "critical",
    category: "Meta",
  },
  {
    key: "duplicate_title",
    label: "Duplicate titles",
    description: "Pages sharing the same title tag.",
    severity: "warning",
    category: "Meta",
  },
  {
    key: "title_too_long",
    label: "Title too long",
    description: "Titles likely to be truncated in search results.",
    severity: "notice",
    category: "Meta",
  },
  {
    key: "title_too_short",
    label: "Title too short",
    description: "Titles too brief to describe the page.",
    severity: "notice",
    category: "Meta",
  },
  {
    key: "no_description",
    label: "Missing meta description",
    description: "Pages without a meta description.",
    severity: "warning",
    category: "Meta",
  },
  {
    key: "duplicate_description",
    label: "Duplicate descriptions",
    description: "Pages sharing the same meta description.",
    severity: "warning",
    category: "Meta",
  },
  {
    key: "duplicate_meta_tags",
    label: "Duplicate meta tags",
    description: "Repeated meta tags within a page.",
    severity: "notice",
    category: "Meta",
  },
  {
    key: "no_h1_tag",
    label: "Missing H1",
    description: "Pages without a top-level H1 heading.",
    severity: "warning",
    category: "Meta",
  },

  // Content
  {
    key: "duplicate_content",
    label: "Duplicate content",
    description: "Pages with substantially identical body content.",
    severity: "warning",
    category: "Content",
  },
  {
    key: "low_content_rate",
    label: "Low text-to-HTML ratio",
    description: "Pages with little readable text relative to markup.",
    severity: "notice",
    category: "Content",
  },
  {
    key: "small_page_size",
    label: "Thin pages",
    description: "Pages with very little content.",
    severity: "notice",
    category: "Content",
  },
  {
    key: "no_image_alt",
    label: "Images missing alt text",
    description: "Images without descriptive alt attributes.",
    severity: "notice",
    category: "Content",
  },
  {
    key: "no_image_title",
    label: "Images missing title",
    description: "Images without a title attribute.",
    severity: "notice",
    category: "Content",
  },
  {
    key: "seo_friendly_url",
    label: "Non SEO-friendly URLs",
    description: "URLs that aren't clean or descriptive.",
    severity: "notice",
    category: "Content",
  },

  // Performance
  {
    key: "high_loading_time",
    label: "Slow pages",
    description: "Pages with a high total load time.",
    severity: "warning",
    category: "Performance",
  },
  {
    key: "high_waiting_time",
    label: "High server response time",
    description: "Pages where the server was slow to first byte.",
    severity: "warning",
    category: "Performance",
  },
  {
    key: "large_page_size",
    label: "Large page size",
    description: "Pages heavier than recommended.",
    severity: "notice",
    category: "Performance",
  },
  {
    key: "has_render_blocking_resources",
    label: "Render-blocking resources",
    description: "Scripts or styles that delay first paint.",
    severity: "notice",
    category: "Performance",
  },
];

/** How each severity sorts and colors, highest priority first. */
export const SEVERITY_RANK: Record<Severity, number> = {
  critical: 0,
  warning: 1,
  notice: 2,
};

export const CATEGORY_ORDER: IssueCategory[] = [
  "Crawlability",
  "Meta",
  "Content",
  "Links",
  "Performance",
];
