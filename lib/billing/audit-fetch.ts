/**
 * Tenant-scoped OnPage (Site Audit) retrieval.
 *
 * An OnPage crawl is posted with `on_page/task_post` and then queried by its
 * crawl id through `on_page/summary`, `on_page/pages`, etc. That id is a
 * DataForSEO id on our shared account, so those endpoints are `internal`: a
 * caller can only reach them through a route that injects THEIR own verified
 * crawl id, never one they supply.
 *
 * The result endpoints are free from DataForSEO (the crawl is what's billed), so
 * this does not charge.
 */

import { getBySlug } from "@/lib/registry";
import { callDataForSEO } from "@/lib/dataforseo/client";

/** OnPage result resources a client may request, mapped to their internal slug. */
const RESOURCES: Record<string, string> = {
  summary: "on_page/summary",
  pages: "on_page/pages",
  links: "on_page/links",
  resources: "on_page/resources",
  duplicate_tags: "on_page/duplicate_tags",
  duplicate_content: "on_page/duplicate_content",
  non_indexable: "on_page/non_indexable",
  redirect_chains: "on_page/redirect_chains",
};

export function isAuditResource(resource: string): boolean {
  return resource in RESOURCES;
}

export function auditResources(): string[] {
  return Object.keys(RESOURCES);
}

export interface AuditFetchResult {
  /** The DataForSEO result payload for the resource. */
  result: unknown;
  /** For `summary`: crawl progress so the UI knows whether to keep polling. */
  crawlProgress?: string;
}

/**
 * Fetch one OnPage result resource for a crawl. `params` is the caller's extra
 * body (limit, filters, …); the crawl `id` is supplied by us, never the caller.
 */
export async function fetchAuditResource(
  resource: string,
  crawlId: string,
  params: Record<string, unknown> = {},
): Promise<AuditFetchResult> {
  const slug = RESOURCES[resource];
  if (!slug) throw new Error(`Unknown audit resource: ${resource}`);

  const endpoint = getBySlug(slug);
  if (!endpoint) throw new Error(`OnPage endpoint ${slug} missing from registry`);

  // summary is a GET with the id in the query; the rest are POST with id in body.
  const isSummary = resource === "summary";
  const envelope = await callDataForSEO(
    isSummary
      ? { dfsPath: `${endpoint.dfsPath}/${crawlId}`, method: "GET" }
      : { dfsPath: endpoint.dfsPath, method: "POST", tasks: [{ ...params, id: crawlId }] },
  );

  const task = envelope.tasks?.[0];
  const result = task?.result ?? null;
  const crawlProgress = isSummary
    ? ((result as { crawl_progress?: string }[] | null)?.[0]?.crawl_progress ?? undefined)
    : undefined;

  return { result, crawlProgress };
}
