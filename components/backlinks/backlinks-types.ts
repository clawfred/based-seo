/**
 * Shapes for the DataForSEO Backlinks result objects the Site Explorer renders.
 *
 * These mirror the fields at `body.data.tasks[0].result[0]` for the three
 * endpoints this page calls. Every field is optional: DataForSEO omits keys it
 * has no data for, and we only read a curated subset, so the UI must tolerate
 * partial rows rather than assume a fixed shape.
 */

/** `backlinks/summary/live` — result[0]. A target's whole backlink profile. */
export interface BacklinkSummary {
  target?: string;
  rank?: number;
  backlinks?: number;
  backlinks_spam_score?: number;
  broken_backlinks?: number;
  broken_pages?: number;
  referring_domains?: number;
  referring_domains_nofollow?: number;
  referring_main_domains?: number;
  referring_ips?: number;
  referring_subnets?: number;
  referring_pages?: number;
  crawled_pages?: number;
  internal_links_count?: number;
  external_links_count?: number;
  first_seen?: string;
  lost_date?: string | null;
  referring_links_types?: Record<string, number>;
  referring_links_attributes?: Record<string, number>;
}

/** `backlinks/referring_domains/live` — one entry in result[0].items. */
export interface ReferringDomain {
  domain?: string;
  rank?: number;
  backlinks?: number;
  first_seen?: string;
  lost_date?: string | null;
  backlinks_spam_score?: number;
  broken_backlinks?: number;
  referring_pages?: number;
  dofollow?: number;
}

/** `backlinks/backlinks/live` — one entry in result[0].items. */
export interface Backlink {
  domain_from?: string;
  url_from?: string;
  url_to?: string;
  anchor?: string;
  dofollow?: boolean;
  is_broken?: boolean;
  rank?: number;
  page_from_rank?: number;
  first_seen?: string;
  last_seen?: string;
  item_type?: string;
}

/** Minimal view of the DataForSEO envelope we index into. */
export interface DataForSEOEnvelope<T> {
  tasks?: Array<{
    result?: Array<
      T & {
        items?: unknown[];
        total_count?: number;
        items_count?: number;
      }
    > | null;
  }>;
}
