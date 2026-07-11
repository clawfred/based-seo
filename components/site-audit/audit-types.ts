/**
 * Typed views over the DataForSEO OnPage result shapes we consume. These are
 * deliberately loose (everything optional) because OnPage payloads are deep and
 * fields come and go depending on what the crawler found — every reader guards.
 */

/** Per-page issue flags on `page_metrics.checks` and each page's `checks`. */
export type ChecksMap = Record<string, number | boolean | undefined>;

/** The crawl summary lives at `summary.data[0]`. */
export interface AuditSummary {
  crawl_progress?: string;
  crawl_status?: {
    max_crawl_pages?: number;
    pages_in_queue?: number;
    pages_crawled?: number;
  };
  domain_info?: {
    name?: string;
    cms?: string | null;
    ip?: string;
    server?: string;
    crawl_start?: string;
    crawl_end?: string;
    total_pages?: number;
    ssl_info?: { valid_certificate?: boolean };
    checks?: ChecksMap;
  };
  page_metrics?: {
    links_external?: number;
    links_internal?: number;
    duplicate_title?: number;
    duplicate_description?: number;
    duplicate_content?: number;
    broken_links?: number;
    broken_resources?: number;
    links_relation_conflict?: number;
    redirect_loop?: number;
    onpage_score?: number;
    non_indexable?: number;
    checks?: ChecksMap;
  };
}

/** One crawled page from the `pages` resource (`data[0].items`). */
export interface AuditPage {
  url?: string;
  status_code?: number;
  onpage_score?: number;
  meta?: {
    title?: string;
    description?: string;
    internal_links_count?: number;
    external_links_count?: number;
    htags?: Record<string, string[] | undefined>;
  };
  page_timing?: {
    time_to_interactive?: number;
    dom_complete?: number;
  };
  checks?: ChecksMap;
}

/** One link from the `links` resource. */
export interface AuditLink {
  type?: string;
  domain_from?: string;
  domain_to?: string;
  page_from?: string;
  link_from?: string;
  link_to?: string;
  text?: string | null;
  dofollow?: boolean;
  direction?: string;
  is_broken?: boolean;
  link_attribute?: string | null;
}

/** Everything the results view renders after a finished crawl. */
export interface AuditData {
  target: string;
  summary: AuditSummary | null;
  pages: AuditPage[];
  links: AuditLink[];
}
